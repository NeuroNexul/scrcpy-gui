package main

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	eventEnvironmentUpdated = "environment:updated"
	eventDevicesUpdated     = "devices:updated"
	eventInstanceUpdated    = "instance:updated"
	eventInstanceLog        = "instance:log"

	statusRunning = "running"
	statusExited  = "exited"
	statusFailed  = "failed"
)

type SystemStatus struct {
	ScrcpyFound bool   `json:"scrcpyFound"`
	ScrcpyPath  string `json:"scrcpyPath"`
	AdbFound    bool   `json:"adbFound"`
	AdbPath     string `json:"adbPath"`
	Platform    string `json:"platform"`
	InstallHint string `json:"installHint"`
}

type Device struct {
	Serial string `json:"serial"`
	State  string `json:"state"`
	Model  string `json:"model"`
	Device string `json:"device"`
	Raw    string `json:"raw"`
}

type BundleFileStatus struct {
	Name     string `json:"name"`
	Path     string `json:"path"`
	Exists   bool   `json:"exists"`
	Required bool   `json:"required"`
}

type BundleHealth struct {
	Healthy   bool               `json:"healthy"`
	BundleDir string             `json:"bundleDir"`
	Checks    []BundleFileStatus `json:"checks"`
	Missing   []string           `json:"missing"`
	Message   string             `json:"message"`
}

type LaunchRequest struct {
	DeviceSerial string        `json:"deviceSerial"`
	WindowTitle  string        `json:"windowTitle"`
	ExtraArgs    string        `json:"extraArgs"`
	Options      LaunchOptions `json:"options"`
}

type InstanceSummary struct {
	ID           string `json:"id"`
	DeviceSerial string `json:"deviceSerial"`
	WindowTitle  string `json:"windowTitle"`
	Status       string `json:"status"`
	PID          int    `json:"pid"`
	StartedAt    int64  `json:"startedAt"`
	EndedAt      int64  `json:"endedAt"`
	ExitCode     *int   `json:"exitCode"`
	ErrorMessage string `json:"errorMessage"`
	Command      string `json:"command"`
}

type InstanceLogLine struct {
	InstanceID string `json:"instanceId"`
	Timestamp  int64  `json:"timestamp"`
	Stream     string `json:"stream"`
	Message    string `json:"message"`
}

type instanceProcess struct {
	summary InstanceSummary
	logs    []InstanceLogLine
	cmd     *exec.Cmd
	cancel  context.CancelFunc
}

type App struct {
	ctx         context.Context
	mu          sync.RWMutex
	instances   map[string]*instanceProcess
	idCounter   atomic.Uint64
	maxLogLines int
	status      SystemStatus
}

func NewApp() *App {
	return &App{
		instances:   make(map[string]*instanceProcess),
		maxLogLines: 3000,
		status: SystemStatus{
			Platform: runtime.GOOS,
		},
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.RefreshEnvironment()
}

func (a *App) shutdown(_ context.Context) {
	a.StopAllInstances()
}

func (a *App) RefreshEnvironment() SystemStatus {
	a.mu.Lock()
	defer a.mu.Unlock()

	a.status = detectSystemStatus()
	a.emit(eventEnvironmentUpdated, a.status)

	return a.status
}

func (a *App) GetSystemStatus() SystemStatus {
	a.mu.RLock()
	defer a.mu.RUnlock()

	return a.status
}

func (a *App) GetBundleHealth() BundleHealth {
	a.mu.RLock()
	status := a.status
	a.mu.RUnlock()

	if status.ScrcpyPath == "" && status.AdbPath == "" {
		status = a.RefreshEnvironment()
	}

	return evaluateBundleHealth(status)
}

func (a *App) ListDevices() ([]Device, error) {
	a.mu.RLock()
	adbPath := a.status.AdbPath
	a.mu.RUnlock()

	if adbPath == "" {
		a.RefreshEnvironment()
		a.mu.RLock()
		adbPath = a.status.AdbPath
		a.mu.RUnlock()
	}

	if adbPath == "" {
		return nil, errors.New("adb executable was not found")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, adbPath, "devices", "-l")
	stdout, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to list adb devices: %w", err)
	}

	devices := parseAdbDevicesOutput(string(stdout))
	a.emit(eventDevicesUpdated, devices)

	return devices, nil
}

func (a *App) StartInstance(request LaunchRequest) (InstanceSummary, error) {
	a.mu.RLock()
	status := a.status
	a.mu.RUnlock()

	if !status.ScrcpyFound {
		status = a.RefreshEnvironment()
	}

	if !status.ScrcpyFound || status.ScrcpyPath == "" {
		return InstanceSummary{}, errors.New("scrcpy executable was not found")
	}

	bundleHealth := evaluateBundleHealth(status)
	if !bundleHealth.Healthy {
		return InstanceSummary{}, fmt.Errorf("bundle health check failed: %s", bundleHealth.Message)
	}

	args, resolvedTitle, err := buildScrcpyArgs(request)
	if err != nil {
		return InstanceSummary{}, err
	}

	instanceCtx, cancel := context.WithCancel(context.Background())
	cmd := exec.CommandContext(instanceCtx, status.ScrcpyPath, args...)
	cmd.Env = buildEnvironment(status.AdbPath)

	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		return InstanceSummary{}, fmt.Errorf("failed to open stdout pipe: %w", err)
	}

	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		cancel()
		return InstanceSummary{}, fmt.Errorf("failed to open stderr pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		cancel()
		return InstanceSummary{}, fmt.Errorf("failed to start scrcpy: %w", err)
	}

	instanceID := a.newInstanceID()
	startedAt := time.Now().UnixMilli()
	windowTitle := strings.TrimSpace(resolvedTitle)
	if windowTitle == "" {
		windowTitle = request.DeviceSerial
		if strings.TrimSpace(windowTitle) == "" {
			windowTitle = "scrcpy session"
		}
	}

	summary := InstanceSummary{
		ID:           instanceID,
		DeviceSerial: request.DeviceSerial,
		WindowTitle:  windowTitle,
		Status:       statusRunning,
		PID:          cmd.Process.Pid,
		StartedAt:    startedAt,
		Command:      strings.Join(append([]string{status.ScrcpyPath}, args...), " "),
	}

	process := &instanceProcess{
		summary: summary,
		logs:    make([]InstanceLogLine, 0, 256),
		cmd:     cmd,
		cancel:  cancel,
	}

	a.mu.Lock()
	a.instances[instanceID] = process
	a.mu.Unlock()

	a.emit(eventInstanceUpdated, summary)

	go a.captureLogs(instanceID, "stdout", stdoutPipe)
	go a.captureLogs(instanceID, "stderr", stderrPipe)
	go a.waitForExit(instanceID)

	return summary, nil
}

func (a *App) StopInstance(instanceID string) error {
	a.mu.Lock()
	instance, ok := a.instances[instanceID]
	a.mu.Unlock()

	if !ok {
		return fmt.Errorf("instance %s not found", instanceID)
	}

	if instance.cancel != nil {
		instance.cancel()
	}

	return nil
}

func (a *App) StopAllInstances() error {
	a.mu.Lock()
	instances := make([]*instanceProcess, 0, len(a.instances))
	for _, instance := range a.instances {
		instances = append(instances, instance)
	}
	a.mu.Unlock()

	for _, instance := range instances {
		if instance.cancel != nil {
			instance.cancel()
		}
	}

	return nil
}

func (a *App) ListInstances() []InstanceSummary {
	a.mu.RLock()
	defer a.mu.RUnlock()

	instances := make([]InstanceSummary, 0, len(a.instances))
	for _, item := range a.instances {
		instances = append(instances, item.summary)
	}

	return instances
}

func (a *App) GetInstanceLogs(instanceID string, limit int) []InstanceLogLine {
	a.mu.RLock()
	defer a.mu.RUnlock()

	instance, ok := a.instances[instanceID]
	if !ok {
		return []InstanceLogLine{}
	}

	if limit <= 0 || limit > len(instance.logs) {
		limit = len(instance.logs)
	}

	start := len(instance.logs) - limit
	result := make([]InstanceLogLine, limit)
	copy(result, instance.logs[start:])

	return result
}

func (a *App) waitForExit(instanceID string) {
	a.mu.RLock()
	instance, ok := a.instances[instanceID]
	a.mu.RUnlock()
	if !ok {
		return
	}

	err := instance.cmd.Wait()

	a.mu.Lock()
	defer a.mu.Unlock()

	current, ok := a.instances[instanceID]
	if !ok {
		return
	}

	endedAt := time.Now().UnixMilli()
	current.summary.EndedAt = endedAt

	if err == nil {
		zero := 0
		current.summary.ExitCode = &zero
		current.summary.Status = statusExited
	} else {
		current.summary.Status = statusFailed
		current.summary.ErrorMessage = err.Error()

		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) {
			exitCode := exitErr.ExitCode()
			current.summary.ExitCode = &exitCode
		}
	}

	a.emit(eventInstanceUpdated, current.summary)
}

func (a *App) captureLogs(instanceID string, stream string, source io.ReadCloser) {
	defer source.Close()

	scanner := bufio.NewScanner(source)
	buffer := make([]byte, 0, 64*1024)
	scanner.Buffer(buffer, 1024*1024)

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		logLine := InstanceLogLine{
			InstanceID: instanceID,
			Timestamp:  time.Now().UnixMilli(),
			Stream:     stream,
			Message:    line,
		}

		a.mu.Lock()
		instance, ok := a.instances[instanceID]
		if ok {
			instance.logs = append(instance.logs, logLine)
			if overflow := len(instance.logs) - a.maxLogLines; overflow > 0 {
				instance.logs = instance.logs[overflow:]
			}
		}
		a.mu.Unlock()

		a.emit(eventInstanceLog, logLine)
	}
}

func (a *App) emit(name string, payload any) {
	if a.ctx == nil {
		return
	}
	wailsruntime.EventsEmit(a.ctx, name, payload)
}

func (a *App) newInstanceID() string {
	value := a.idCounter.Add(1)
	return fmt.Sprintf("session-%d", value)
}

func detectSystemStatus() SystemStatus {
	status := SystemStatus{
		Platform: runtime.GOOS,
	}

	scrcpyPath := findExecutable([]string{"scrcpy.exe", "scrcpy"})
	adbPath := findExecutable([]string{"adb.exe", "adb"})

	if scrcpyPath != "" {
		status.ScrcpyFound = true
		status.ScrcpyPath = scrcpyPath
	}

	if adbPath != "" {
		status.AdbFound = true
		status.AdbPath = adbPath
	}

	if !status.ScrcpyFound || !status.AdbFound {
		status.InstallHint = "Bundle scrcpy and adb in bundle/windows/bin for builds (or bin next to the executable), then package with scripts/build-windows.ps1."
	}

	return status
}

func findExecutable(candidates []string) string {
	searchDirs := make([]string, 0, 8)

	if executablePath, err := os.Executable(); err == nil {
		executableDir := filepath.Dir(executablePath)
		searchDirs = append(searchDirs,
			executableDir,
			filepath.Join(executableDir, "bin"),
			filepath.Join(executableDir, "resources", "bin"),
		)
	}

	if workingDir, err := os.Getwd(); err == nil {
		searchDirs = append(searchDirs,
			workingDir,
			filepath.Join(workingDir, "bin"),
			filepath.Join(workingDir, "build", "bin"),
			filepath.Join(workingDir, "bundle", "windows", "bin"),
		)
	}

	for _, dir := range searchDirs {
		for _, candidate := range candidates {
			resolved := filepath.Join(dir, candidate)
			if stat, err := os.Stat(resolved); err == nil && !stat.IsDir() {
				return resolved
			}
		}
	}

	for _, candidate := range candidates {
		if resolved, err := exec.LookPath(candidate); err == nil {
			return resolved
		}
	}

	return ""
}

func parseAdbDevicesOutput(output string) []Device {
	rows := strings.Split(output, "\n")
	devices := make([]Device, 0)

	for _, row := range rows {
		trimmed := strings.TrimSpace(row)
		if trimmed == "" || strings.HasPrefix(trimmed, "List of devices attached") {
			continue
		}

		fields := strings.Fields(trimmed)
		if len(fields) < 2 {
			continue
		}

		device := Device{
			Serial: fields[0],
			State:  fields[1],
			Raw:    trimmed,
		}

		for _, field := range fields[2:] {
			if strings.HasPrefix(field, "model:") {
				device.Model = strings.TrimPrefix(field, "model:")
			}
			if strings.HasPrefix(field, "device:") {
				device.Device = strings.TrimPrefix(field, "device:")
			}
		}

		devices = append(devices, device)
	}

	return devices
}

func buildEnvironment(adbPath string) []string {
	env := os.Environ()
	if adbPath == "" {
		return env
	}

	adbDir := filepath.Dir(adbPath)
	if adbDir == "" {
		return env
	}

	for index, value := range env {
		parts := strings.SplitN(value, "=", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "PATH") {
			env[index] = parts[0] + "=" + adbDir + string(os.PathListSeparator) + parts[1]
			return env
		}
	}

	return append(env, "PATH="+adbDir)
}

func parseShellArgs(raw string) ([]string, error) {
	text := strings.TrimSpace(raw)
	if text == "" {
		return []string{}, nil
	}

	args := make([]string, 0, 8)
	var current bytes.Buffer
	inQuote := rune(0)
	escaped := false

	for _, char := range text {
		if escaped {
			current.WriteRune(char)
			escaped = false
			continue
		}

		switch char {
		case '\\':
			escaped = true
		case '\'', '"':
			if inQuote == 0 {
				inQuote = char
				continue
			}
			if inQuote == char {
				inQuote = 0
				continue
			}
			current.WriteRune(char)
		case ' ', '\t':
			if inQuote != 0 {
				current.WriteRune(char)
				continue
			}
			if current.Len() > 0 {
				args = append(args, current.String())
				current.Reset()
			}
		default:
			current.WriteRune(char)
		}
	}

	if escaped {
		current.WriteRune('\\')
	}

	if inQuote != 0 {
		return nil, errors.New("unterminated quote in extra args")
	}

	if current.Len() > 0 {
		args = append(args, current.String())
	}

	for index, arg := range args {
		args[index] = strings.TrimSpace(arg)
	}

	return args, nil
}

func evaluateBundleHealth(status SystemStatus) BundleHealth {
	bundleDir := resolveBundleDirectory(status)
	if bundleDir == "" {
		return BundleHealth{
			Healthy: false,
			Message: "unable to resolve bundle directory",
		}
	}

	requiredFiles := readRequiredBundleFiles(bundleDir)
	checks := make([]BundleFileStatus, 0, len(requiredFiles))
	missing := make([]string, 0)

	for _, name := range requiredFiles {
		filePath := filepath.Join(bundleDir, name)
		_, err := os.Stat(filePath)
		exists := err == nil

		check := BundleFileStatus{
			Name:     name,
			Path:     filePath,
			Exists:   exists,
			Required: true,
		}
		checks = append(checks, check)

		if !exists {
			missing = append(missing, name)
		}
	}

	health := BundleHealth{
		Healthy:   len(missing) == 0,
		BundleDir: bundleDir,
		Checks:    checks,
		Missing:   missing,
	}

	if health.Healthy {
		health.Message = "bundle looks healthy"
	} else {
		health.Message = "missing required files: " + strings.Join(missing, ", ")
	}

	return health
}

func resolveBundleDirectory(status SystemStatus) string {
	candidates := make([]string, 0, 8)

	if status.ScrcpyPath != "" {
		candidates = append(candidates, filepath.Dir(status.ScrcpyPath))
	}
	if status.AdbPath != "" {
		candidates = append(candidates, filepath.Dir(status.AdbPath))
	}

	if executablePath, err := os.Executable(); err == nil {
		executableDir := filepath.Dir(executablePath)
		candidates = append(candidates,
			filepath.Join(executableDir, "bin"),
			executableDir,
		)
	}

	if workingDir, err := os.Getwd(); err == nil {
		candidates = append(candidates,
			filepath.Join(workingDir, "bundle", "windows", "bin"),
			filepath.Join(workingDir, "build", "bin", "bin"),
			filepath.Join(workingDir, "bin"),
		)
	}

	seen := make(map[string]struct{}, len(candidates))
	for _, candidate := range candidates {
		if candidate == "" {
			continue
		}
		normalized := filepath.Clean(candidate)
		if _, ok := seen[normalized]; ok {
			continue
		}
		seen[normalized] = struct{}{}

		if info, err := os.Stat(normalized); err == nil && info.IsDir() {
			return normalized
		}
	}

	return ""
}

func readRequiredBundleFiles(bundleDir string) []string {
	files := []string{"scrcpy.exe", "adb.exe"}

	manifestPath := filepath.Join(bundleDir, "required-files.txt")
	content, err := os.ReadFile(manifestPath)
	if err != nil {
		return files
	}

	for _, line := range strings.Split(string(content), "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}

		files = append(files, trimmed)
	}

	return uniqueStrings(files)
}

func uniqueStrings(values []string) []string {
	result := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))

	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		key := strings.ToLower(trimmed)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, trimmed)
	}

	return result
}

func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s", name)
}

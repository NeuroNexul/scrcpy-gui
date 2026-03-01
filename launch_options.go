package main

import (
	"fmt"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

type LaunchOptions struct {
	DeviceSelection DeviceSelectionOptions `json:"deviceSelection"`
	VideoSettings   VideoSettingsOptions   `json:"videoSettings"`
	CameraMode      CameraModeOptions      `json:"cameraMode"`
	AudioSettings   AudioSettingsOptions   `json:"audioSettings"`
	WindowBehavior  WindowBehaviorOptions  `json:"windowBehavior"`
	Recording       RecordingOptions       `json:"recording"`
	InputControl    InputControlOptions    `json:"inputControl"`
	DisplayFeatures DisplayFeatureOptions  `json:"displayFeatures"`
	Diagnostics     DiagnosticsOptions     `json:"diagnostics"`
}

type DeviceSelectionOptions struct {
	ConnectionMode string `json:"connectionMode"`
	TCPIPAddress   string `json:"tcpipAddress"`
	CaptureSource  string `json:"captureSource"`
}

type VideoSettingsOptions struct {
	Enabled         bool   `json:"enabled"`
	MaxSize         string `json:"maxSize"`
	BitRate         string `json:"bitRate"`
	MaxFps          string `json:"maxFps"`
	Codec           string `json:"codec"`
	Encoder         string `json:"encoder"`
	LockOrientation bool   `json:"lockOrientation"`
	HFlip           bool   `json:"hFlip"`
	Orientation     string `json:"orientation"`
	DisplayBufferMs string `json:"displayBufferMs"`
	DisplayID       string `json:"displayId"`
}

type CameraModeOptions struct {
	CameraID    string `json:"cameraId"`
	Facing      string `json:"facing"`
	Size        string `json:"size"`
	Fps         string `json:"fps"`
	AspectRatio string `json:"aspectRatio"`
	HighSpeed   bool   `json:"highSpeed"`
}

type AudioSettingsOptions struct {
	Enabled                bool   `json:"enabled"`
	Source                 string `json:"source"`
	BitRate                string `json:"bitRate"`
	Codec                  string `json:"codec"`
	Encoder                string `json:"encoder"`
	BufferMs               string `json:"bufferMs"`
	DuplicationTarget      string `json:"duplicationTarget"`
	AudioDuplicationTarget string `json:"audioDuplicationTarget"`
}

type WindowBehaviorOptions struct {
	Fullscreen         bool   `json:"fullscreen"`
	AlwaysOnTop        bool   `json:"alwaysOnTop"`
	Borderless         bool   `json:"borderless"`
	WindowTitle        string `json:"windowTitle"`
	WindowX            string `json:"windowX"`
	WindowY            string `json:"windowY"`
	WindowWidth        string `json:"windowWidth"`
	WindowHeight       string `json:"windowHeight"`
	DisableScreensaver bool   `json:"disableScreensaver"`
}

type RecordingOptions struct {
	Enabled    bool   `json:"enabled"`
	Format     string `json:"format"`
	TimeLimit  string `json:"timeLimit"`
	NoPlayback bool   `json:"noPlayback"`
	NoWindow   bool   `json:"noWindow"`
}

type InputControlOptions struct {
	NoControl        bool   `json:"noControl"`
	ShowTouches      bool   `json:"showTouches"`
	StayAwake        bool   `json:"stayAwake"`
	TurnScreenOff    bool   `json:"turnScreenOff"`
	PowerOffOnClose  bool   `json:"powerOffOnClose"`
	ScreenOffTimeout string `json:"screenOffTimeout"`
	KeyboardMode     string `json:"keyboardMode"`
	MouseMode        string `json:"mouseMode"`
	GamepadMode      string `json:"gamepadMode"`
	OTG              bool   `json:"otg"`
}

type DisplayFeatureOptions struct {
	PrintFps bool `json:"printFps"`
}

type DiagnosticsOptions struct {
	RequireAudio      bool   `json:"requireAudio"`
	NoDownsizeOnError bool   `json:"noDownsizeOnError"`
	ExtraArgs         string `json:"extraArgs"`
}

func buildScrcpyArgs(request LaunchRequest) ([]string, string, error) {
	args := make([]string, 0, 96)
	windowTitle := strings.TrimSpace(request.WindowTitle)
	selectedConnectionMode := strings.TrimSpace(strings.ToLower(request.Options.DeviceSelection.ConnectionMode))

	switch selectedConnectionMode {
	case "usb":
		args = append(args, "--select-usb")
	case "tcpip":
		tcpAddress := strings.TrimSpace(request.Options.DeviceSelection.TCPIPAddress)
		if tcpAddress != "" {
			args = append(args, "--tcpip="+tcpAddress)
		} else {
			args = append(args, "--select-tcpip")
		}
	default:
		if strings.TrimSpace(request.DeviceSerial) == "" {
			return nil, "", fmt.Errorf("device serial is required")
		}
		args = append(args, "-s", request.DeviceSerial)
	}

	captureSource := strings.TrimSpace(strings.ToLower(request.Options.DeviceSelection.CaptureSource))
	if captureSource == "camera" {
		args = append(args, "--video-source=camera")
	} else {
		args = append(args, "--video-source=display")
	}

	if captureSource == "display" && !request.Options.VideoSettings.Enabled {
		args = append(args, "--no-video")
	}

	if request.Options.AudioSettings.Enabled {
		if source := strings.TrimSpace(request.Options.AudioSettings.Source); source != "" {
			args = append(args, "--audio-source="+source)
		}
		if bitRate := strings.TrimSpace(request.Options.AudioSettings.BitRate); bitRate != "" {
			args = append(args, "--audio-bit-rate="+bitRate)
		}
		if codec := strings.TrimSpace(request.Options.AudioSettings.Codec); codec != "" {
			args = append(args, "--audio-codec="+codec)
		}
		if encoder := strings.TrimSpace(request.Options.AudioSettings.Encoder); encoder != "" {
			args = append(args, "--audio-encoder="+encoder)
		}
		if buffer := parseNumericString(request.Options.AudioSettings.BufferMs); buffer != "" {
			args = append(args, "--audio-buffer="+buffer)
		}
		duplicationTarget := strings.TrimSpace(strings.ToLower(request.Options.AudioSettings.DuplicationTarget))
		if duplicationTarget == "device" || strings.TrimSpace(strings.ToLower(request.Options.AudioSettings.AudioDuplicationTarget)) == "device" {
			args = append(args, "--audio-dup")
		}
	} else {
		args = append(args, "--no-audio")
	}

	video := request.Options.VideoSettings
	if captureSource == "display" && video.Enabled {
		if maxSize := parseNumericString(video.MaxSize); maxSize != "" {
			args = append(args, "--max-size="+maxSize)
		}
		if bitRate := strings.TrimSpace(video.BitRate); bitRate != "" {
			args = append(args, "--video-bit-rate="+bitRate)
		}
		if fps := parseNumericString(video.MaxFps); fps != "" {
			args = append(args, "--max-fps="+fps)
		}
		if codec := strings.TrimSpace(video.Codec); codec != "" {
			args = append(args, "--video-codec="+codec)
		}
		if encoder := strings.TrimSpace(video.Encoder); encoder != "" {
			args = append(args, "--video-encoder="+encoder)
		}
		if displayBuffer := parseNumericString(video.DisplayBufferMs); displayBuffer != "" {
			args = append(args, "--video-buffer="+displayBuffer)
		}
		if displayID := parseNumericString(video.DisplayID); displayID != "" {
			args = append(args, "--display-id="+displayID)
		}

		orientation := buildCaptureOrientation(video.LockOrientation, video.HFlip, video.Orientation)
		if orientation != "" {
			args = append(args, "--capture-orientation="+orientation)
		}
	}

	camera := request.Options.CameraMode
	if captureSource == "camera" {
		if cameraID := strings.TrimSpace(camera.CameraID); cameraID != "" {
			args = append(args, "--camera-id="+cameraID)
		} else if facing := strings.TrimSpace(strings.ToLower(camera.Facing)); facing != "" {
			args = append(args, "--camera-facing="+facing)
		}
		if size := strings.TrimSpace(camera.Size); size != "" {
			args = append(args, "--camera-size="+size)
		} else {
			if maxSize := parseNumericString(video.MaxSize); maxSize != "" {
				args = append(args, "--max-size="+maxSize)
			}
			if aspectRatio := strings.TrimSpace(camera.AspectRatio); aspectRatio != "" {
				args = append(args, "--camera-ar="+aspectRatio)
			}
		}
		if fps := parseNumericString(camera.Fps); fps != "" {
			args = append(args, "--camera-fps="+fps)
		}
		if camera.HighSpeed {
			args = append(args, "--camera-high-speed")
		}

		orientation := buildCaptureOrientation(video.LockOrientation, video.HFlip, video.Orientation)
		if orientation != "" {
			args = append(args, "--capture-orientation="+orientation)
		}
	}

	if videoOrientation := parseOrientationAngle(video.Orientation); videoOrientation != "" {
		args = append(args, "--angle="+videoOrientation)
	}

	window := request.Options.WindowBehavior
	if title := strings.TrimSpace(window.WindowTitle); title != "" {
		windowTitle = title
	}
	if windowTitle != "" {
		args = append(args, "--window-title", windowTitle)
	}
	if window.Fullscreen {
		args = append(args, "--fullscreen")
	}
	if window.AlwaysOnTop {
		args = append(args, "--always-on-top")
	}
	if window.Borderless {
		args = append(args, "--window-borderless")
	}
	if x := parseNumericString(window.WindowX); x != "" {
		args = append(args, "--window-x="+x)
	}
	if y := parseNumericString(window.WindowY); y != "" {
		args = append(args, "--window-y="+y)
	}
	if width := parseNumericString(window.WindowWidth); width != "" {
		args = append(args, "--window-width="+width)
	}
	if height := parseNumericString(window.WindowHeight); height != "" {
		args = append(args, "--window-height="+height)
	}
	if window.DisableScreensaver {
		args = append(args, "--disable-screensaver")
	}

	recording := request.Options.Recording
	if recording.Enabled {
		recordFormat := strings.TrimSpace(strings.ToLower(recording.Format))
		if recordFormat == "" {
			recordFormat = "mkv"
		}
		recordPath := fmt.Sprintf("scrcpy-record-%s.%s", time.Now().Format("20060102-150405"), recordFormat)
		args = append(args, "--record="+filepath.Clean(recordPath))
		args = append(args, "--record-format="+recordFormat)
		if timeLimit := parseNumericString(recording.TimeLimit); timeLimit != "" {
			args = append(args, "--time-limit="+timeLimit)
		}
		if recording.NoPlayback {
			args = append(args, "--no-playback")
		}
		if recording.NoWindow {
			args = append(args, "--no-window")
		}
	}

	inputControl := request.Options.InputControl
	if inputControl.NoControl {
		args = append(args, "--no-control")
	}
	if inputControl.ShowTouches {
		args = append(args, "--show-touches")
	}
	if inputControl.StayAwake {
		args = append(args, "--stay-awake")
	}
	if inputControl.TurnScreenOff {
		args = append(args, "--turn-screen-off")
	}
	if inputControl.PowerOffOnClose {
		args = append(args, "--power-off-on-close")
	}
	if screenOffTimeout := parseNumericString(inputControl.ScreenOffTimeout); screenOffTimeout != "" {
		args = append(args, "--screen-off-timeout="+screenOffTimeout)
	}
	if keyboardMode := parseMode(inputControl.KeyboardMode, []string{"sdk", "uhid", "aoa", "disabled"}); keyboardMode != "" {
		args = append(args, "--keyboard="+keyboardMode)
	}
	if mouseMode := parseMode(inputControl.MouseMode, []string{"sdk", "uhid", "aoa", "disabled"}); mouseMode != "" {
		args = append(args, "--mouse="+mouseMode)
	}
	if gamepadMode := parseMode(inputControl.GamepadMode, []string{"disabled", "uhid", "aoa"}); gamepadMode != "" {
		args = append(args, "--gamepad="+gamepadMode)
	}
	if inputControl.OTG {
		args = append(args, "--otg")
	}

	if request.Options.DisplayFeatures.PrintFps {
		args = append(args, "--print-fps")
	}

	if request.Options.Diagnostics.RequireAudio {
		args = append(args, "--require-audio")
	}
	if request.Options.Diagnostics.NoDownsizeOnError {
		args = append(args, "--no-downsize-on-error")
	}

	extraArgs, err := parseShellArgs(request.ExtraArgs)
	if err != nil {
		return nil, "", err
	}
	diagnosticExtraArgs, err := parseShellArgs(request.Options.Diagnostics.ExtraArgs)
	if err != nil {
		return nil, "", err
	}
	args = append(args, diagnosticExtraArgs...)
	args = append(args, extraArgs...)

	return uniqueStringsPreserveOrder(args), windowTitle, nil
}

func parseNumericString(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return ""
	}
	parsed, err := strconv.ParseFloat(trimmed, 64)
	if err != nil {
		return ""
	}
	if parsed == float64(int64(parsed)) {
		return strconv.FormatInt(int64(parsed), 10)
	}
	return strconv.FormatFloat(parsed, 'f', -1, 64)
}

func parseMode(value string, supported []string) string {
	trimmed := strings.TrimSpace(strings.ToLower(value))
	if trimmed == "" {
		return ""
	}
	for _, item := range supported {
		if item == trimmed {
			return trimmed
		}
	}
	return ""
}

func parseOrientationAngle(value string) string {
	trimmed := strings.TrimSpace(value)
	switch trimmed {
	case "0", "90", "180", "270":
		return trimmed
	default:
		return ""
	}
}

func buildCaptureOrientation(locked bool, hflip bool, angle string) string {
	parsedAngle := parseOrientationAngle(angle)
	if parsedAngle == "" {
		parsedAngle = "0"
	}
	base := parsedAngle
	if hflip {
		base = "flip" + parsedAngle
	}
	if locked {
		return "@" + base
	}
	if hflip || parsedAngle != "0" {
		return base
	}
	return ""
}

func uniqueStringsPreserveOrder(values []string) []string {
	result := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))

	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		if _, ok := seen[trimmed]; ok {
			continue
		}
		seen[trimmed] = struct{}{}
		result = append(result, trimmed)
	}

	return result
}

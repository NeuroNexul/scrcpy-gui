export namespace main {
	
	export class AudioSettingsOptions {
	    enabled: boolean;
	    source: string;
	    bitRate: string;
	    codec: string;
	    encoder: string;
	    bufferMs: string;
	    duplicationTarget: string;
	    audioDuplicationTarget: string;
	
	    static createFrom(source: any = {}) {
	        return new AudioSettingsOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.source = source["source"];
	        this.bitRate = source["bitRate"];
	        this.codec = source["codec"];
	        this.encoder = source["encoder"];
	        this.bufferMs = source["bufferMs"];
	        this.duplicationTarget = source["duplicationTarget"];
	        this.audioDuplicationTarget = source["audioDuplicationTarget"];
	    }
	}
	export class BundleFileStatus {
	    name: string;
	    path: string;
	    exists: boolean;
	    required: boolean;
	
	    static createFrom(source: any = {}) {
	        return new BundleFileStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.exists = source["exists"];
	        this.required = source["required"];
	    }
	}
	export class BundleHealth {
	    healthy: boolean;
	    bundleDir: string;
	    checks: BundleFileStatus[];
	    missing: string[];
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new BundleHealth(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.healthy = source["healthy"];
	        this.bundleDir = source["bundleDir"];
	        this.checks = this.convertValues(source["checks"], BundleFileStatus);
	        this.missing = source["missing"];
	        this.message = source["message"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CameraModeOptions {
	    cameraId: string;
	    facing: string;
	    size: string;
	    fps: string;
	    aspectRatio: string;
	    highSpeed: boolean;
	
	    static createFrom(source: any = {}) {
	        return new CameraModeOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.cameraId = source["cameraId"];
	        this.facing = source["facing"];
	        this.size = source["size"];
	        this.fps = source["fps"];
	        this.aspectRatio = source["aspectRatio"];
	        this.highSpeed = source["highSpeed"];
	    }
	}
	export class Device {
	    serial: string;
	    state: string;
	    model: string;
	    device: string;
	    raw: string;
	
	    static createFrom(source: any = {}) {
	        return new Device(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.serial = source["serial"];
	        this.state = source["state"];
	        this.model = source["model"];
	        this.device = source["device"];
	        this.raw = source["raw"];
	    }
	}
	export class DeviceSelectionOptions {
	    connectionMode: string;
	    tcpipAddress: string;
	    captureSource: string;
	
	    static createFrom(source: any = {}) {
	        return new DeviceSelectionOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.connectionMode = source["connectionMode"];
	        this.tcpipAddress = source["tcpipAddress"];
	        this.captureSource = source["captureSource"];
	    }
	}
	export class DiagnosticsOptions {
	    requireAudio: boolean;
	    noDownsizeOnError: boolean;
	    extraArgs: string;
	
	    static createFrom(source: any = {}) {
	        return new DiagnosticsOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.requireAudio = source["requireAudio"];
	        this.noDownsizeOnError = source["noDownsizeOnError"];
	        this.extraArgs = source["extraArgs"];
	    }
	}
	export class DisplayFeatureOptions {
	    printFps: boolean;
	
	    static createFrom(source: any = {}) {
	        return new DisplayFeatureOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.printFps = source["printFps"];
	    }
	}
	export class InputControlOptions {
	    noControl: boolean;
	    showTouches: boolean;
	    stayAwake: boolean;
	    turnScreenOff: boolean;
	    powerOffOnClose: boolean;
	    screenOffTimeout: string;
	    keyboardMode: string;
	    mouseMode: string;
	    gamepadMode: string;
	    otg: boolean;
	
	    static createFrom(source: any = {}) {
	        return new InputControlOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.noControl = source["noControl"];
	        this.showTouches = source["showTouches"];
	        this.stayAwake = source["stayAwake"];
	        this.turnScreenOff = source["turnScreenOff"];
	        this.powerOffOnClose = source["powerOffOnClose"];
	        this.screenOffTimeout = source["screenOffTimeout"];
	        this.keyboardMode = source["keyboardMode"];
	        this.mouseMode = source["mouseMode"];
	        this.gamepadMode = source["gamepadMode"];
	        this.otg = source["otg"];
	    }
	}
	export class InstanceLogLine {
	    instanceId: string;
	    timestamp: number;
	    stream: string;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new InstanceLogLine(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.instanceId = source["instanceId"];
	        this.timestamp = source["timestamp"];
	        this.stream = source["stream"];
	        this.message = source["message"];
	    }
	}
	export class InstanceSummary {
	    id: string;
	    deviceSerial: string;
	    windowTitle: string;
	    status: string;
	    pid: number;
	    startedAt: number;
	    endedAt: number;
	    exitCode?: number;
	    errorMessage: string;
	    command: string;
	
	    static createFrom(source: any = {}) {
	        return new InstanceSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.deviceSerial = source["deviceSerial"];
	        this.windowTitle = source["windowTitle"];
	        this.status = source["status"];
	        this.pid = source["pid"];
	        this.startedAt = source["startedAt"];
	        this.endedAt = source["endedAt"];
	        this.exitCode = source["exitCode"];
	        this.errorMessage = source["errorMessage"];
	        this.command = source["command"];
	    }
	}
	export class RecordingOptions {
	    enabled: boolean;
	    format: string;
	    timeLimit: string;
	    noPlayback: boolean;
	    noWindow: boolean;
	
	    static createFrom(source: any = {}) {
	        return new RecordingOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.format = source["format"];
	        this.timeLimit = source["timeLimit"];
	        this.noPlayback = source["noPlayback"];
	        this.noWindow = source["noWindow"];
	    }
	}
	export class WindowBehaviorOptions {
	    fullscreen: boolean;
	    alwaysOnTop: boolean;
	    borderless: boolean;
	    windowTitle: string;
	    windowX: string;
	    windowY: string;
	    windowWidth: string;
	    windowHeight: string;
	    disableScreensaver: boolean;
	
	    static createFrom(source: any = {}) {
	        return new WindowBehaviorOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.fullscreen = source["fullscreen"];
	        this.alwaysOnTop = source["alwaysOnTop"];
	        this.borderless = source["borderless"];
	        this.windowTitle = source["windowTitle"];
	        this.windowX = source["windowX"];
	        this.windowY = source["windowY"];
	        this.windowWidth = source["windowWidth"];
	        this.windowHeight = source["windowHeight"];
	        this.disableScreensaver = source["disableScreensaver"];
	    }
	}
	export class VideoSettingsOptions {
	    enabled: boolean;
	    maxSize: string;
	    bitRate: string;
	    maxFps: string;
	    codec: string;
	    encoder: string;
	    lockOrientation: boolean;
	    hFlip: boolean;
	    orientation: string;
	    displayBufferMs: string;
	    displayId: string;
	
	    static createFrom(source: any = {}) {
	        return new VideoSettingsOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.maxSize = source["maxSize"];
	        this.bitRate = source["bitRate"];
	        this.maxFps = source["maxFps"];
	        this.codec = source["codec"];
	        this.encoder = source["encoder"];
	        this.lockOrientation = source["lockOrientation"];
	        this.hFlip = source["hFlip"];
	        this.orientation = source["orientation"];
	        this.displayBufferMs = source["displayBufferMs"];
	        this.displayId = source["displayId"];
	    }
	}
	export class LaunchOptions {
	    deviceSelection: DeviceSelectionOptions;
	    videoSettings: VideoSettingsOptions;
	    cameraMode: CameraModeOptions;
	    audioSettings: AudioSettingsOptions;
	    windowBehavior: WindowBehaviorOptions;
	    recording: RecordingOptions;
	    inputControl: InputControlOptions;
	    displayFeatures: DisplayFeatureOptions;
	    diagnostics: DiagnosticsOptions;
	
	    static createFrom(source: any = {}) {
	        return new LaunchOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.deviceSelection = this.convertValues(source["deviceSelection"], DeviceSelectionOptions);
	        this.videoSettings = this.convertValues(source["videoSettings"], VideoSettingsOptions);
	        this.cameraMode = this.convertValues(source["cameraMode"], CameraModeOptions);
	        this.audioSettings = this.convertValues(source["audioSettings"], AudioSettingsOptions);
	        this.windowBehavior = this.convertValues(source["windowBehavior"], WindowBehaviorOptions);
	        this.recording = this.convertValues(source["recording"], RecordingOptions);
	        this.inputControl = this.convertValues(source["inputControl"], InputControlOptions);
	        this.displayFeatures = this.convertValues(source["displayFeatures"], DisplayFeatureOptions);
	        this.diagnostics = this.convertValues(source["diagnostics"], DiagnosticsOptions);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LaunchRequest {
	    deviceSerial: string;
	    windowTitle: string;
	    extraArgs: string;
	    options: LaunchOptions;
	
	    static createFrom(source: any = {}) {
	        return new LaunchRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.deviceSerial = source["deviceSerial"];
	        this.windowTitle = source["windowTitle"];
	        this.extraArgs = source["extraArgs"];
	        this.options = this.convertValues(source["options"], LaunchOptions);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class SystemStatus {
	    scrcpyFound: boolean;
	    scrcpyPath: string;
	    adbFound: boolean;
	    adbPath: string;
	    platform: string;
	    installHint: string;
	
	    static createFrom(source: any = {}) {
	        return new SystemStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.scrcpyFound = source["scrcpyFound"];
	        this.scrcpyPath = source["scrcpyPath"];
	        this.adbFound = source["adbFound"];
	        this.adbPath = source["adbPath"];
	        this.platform = source["platform"];
	        this.installHint = source["installHint"];
	    }
	}
	

}


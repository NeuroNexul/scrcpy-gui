export type CaptureSource = "display" | "camera";
export type ConnectionMode = "serial" | "usb" | "tcpip";

export type DeviceSelectionOptions = {
  connectionMode: ConnectionMode;
  tcpipAddress: string;
  captureSource: CaptureSource;
};

export type VideoSettingsOptions = {
  enabled: boolean;
  maxSize: string;
  bitRate: string;
  maxFps: string;
  codec: "h264" | "h265" | "av1";
  encoder: string;
  lockOrientation: boolean;
  hFlip: boolean;
  orientation: "0" | "90" | "180" | "270";
  displayBufferMs: string;
  displayId: string;
};

export type CameraModeOptions = {
  cameraId: string;
  facing: "" | "front" | "back" | "external";
  size: string;
  fps: string;
  aspectRatio: string;
  highSpeed: boolean;
};

export type AudioSource =
  | "output"
  | "playback"
  | "mic"
  | "mic-unprocessed"
  | "mic-camcorder"
  | "mic-voice-recognition"
  | "mic-voice-communication"
  | "voice-call"
  | "voice-call-uplink"
  | "voice-call-downlink"
  | "voice-performance";

export type AudioSettingsOptions = {
  enabled: boolean;
  source: AudioSource;
  bitRate: string;
  codec: "opus" | "aac" | "flac" | "raw";
  encoder: string;
  bufferMs: string;
  duplicationTarget: "off" | "device";
  audioDuplicationTarget: "off" | "device";
};

export type WindowBehaviorOptions = {
  fullscreen: boolean;
  alwaysOnTop: boolean;
  borderless: boolean;
  windowTitle: string;
  windowX: string;
  windowY: string;
  windowWidth: string;
  windowHeight: string;
  disableScreensaver: boolean;
};

export type RecordingOptions = {
  enabled: boolean;
  format: "mp4" | "mkv" | "opus" | "flac" | "wav";
  timeLimit: string;
  noPlayback: boolean;
  noWindow: boolean;
};

export type InputControlOptions = {
  noControl: boolean;
  showTouches: boolean;
  stayAwake: boolean;
  turnScreenOff: boolean;
  powerOffOnClose: boolean;
  screenOffTimeout: string;
  keyboardMode: "sdk" | "uhid" | "aoa" | "disabled";
  mouseMode: "sdk" | "uhid" | "aoa" | "disabled";
  gamepadMode: "disabled" | "uhid" | "aoa";
  otg: boolean;
};

export type DisplayFeatureOptions = {
  printFps: boolean;
};

export type DiagnosticsOptions = {
  requireAudio: boolean;
  noDownsizeOnError: boolean;
  extraArgs: string;
};

export type LaunchOptions = {
  deviceSelection: DeviceSelectionOptions;
  videoSettings: VideoSettingsOptions;
  cameraMode: CameraModeOptions;
  audioSettings: AudioSettingsOptions;
  windowBehavior: WindowBehaviorOptions;
  recording: RecordingOptions;
  inputControl: InputControlOptions;
  displayFeatures: DisplayFeatureOptions;
  diagnostics: DiagnosticsOptions;
};

import { main } from "../../../wailsjs/go/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OptionSection } from "./OptionSection";
import {
  audioBitRateOptions,
  audioBufferOptions,
  audioCodecOptions,
  audioSourceOptions,
  cameraAspectRatioOptions,
  cameraFacingOptions,
  cameraFpsOptions,
  cameraIdOptions,
  cameraSizeOptions,
  displayBufferOptions,
  displayIdOptions,
  gamepadModeOptions,
  keyboardModeOptions,
  maxFpsOptions,
  mouseModeOptions,
  orientationOptions,
  recordingFormatOptions,
  resolutionOptions,
  videoBitrateOptions,
  videoCodecOptions,
} from "./options";
import { LaunchOptions } from "./types";
import { Spinner } from "@/components/ui/spinner";

type OptionsPanelProps = {
  devices: main.Device[];
  selectedDevice: string;
  onSelectedDeviceChange: (device: string) => void;
  options: LaunchOptions;
  onOptionsChange: (options: LaunchOptions) => void;
  launching: boolean;
  canLaunch: boolean;
  onLaunch: () => void;
};

type SelectFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  values: string[];
  placeholder?: string;
  disabled?: boolean;
};

function SelectField({
  label,
  value,
  onValueChange,
  values,
  placeholder,
  disabled,
}: SelectFieldProps) {
  const selectValue = value === "" ? "__none" : value;

  return (
    <label className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Select
        value={selectValue}
        onValueChange={(next) => onValueChange(next === "__none" ? "" : next)}
        disabled={disabled}
      >
        <SelectTrigger size="sm" className="h-8 w-full">
          <SelectValue
            placeholder={placeholder ?? `Select ${label.toLowerCase()}`}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none">Default</SelectItem>
          {values.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="h-8 px-2 border rounded-md bg-background/40 flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Switch
        size="sm"
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

export function OptionsPanel({
  devices,
  selectedDevice,
  onSelectedDeviceChange,
  options,
  onOptionsChange,
  launching,
  canLaunch,
  onLaunch,
}: OptionsPanelProps) {
  const isCameraSelected = options.deviceSelection.captureSource === "camera";

  return (
    <section className="h-full min-h-0 rounded-md border bg-card/50 overflow-hidden flex flex-col">
      <div className="px-3 py-2 border-b bg-card/70 text-sm font-medium">
        Options
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-3">
          <OptionSection
            title="Device Selection"
            description="Choose target device, transport mode and capture source."
          >
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">
                Select from available devices
              </span>
              <Select
                value={selectedDevice || "__none"}
                onValueChange={(value) =>
                  onSelectedDeviceChange(value === "__none" ? "" : value)
                }
              >
                <SelectTrigger size="sm" className="h-8 w-full">
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  {devices.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No devices found
                    </SelectItem>
                  ) : (
                    devices.map((device) => (
                      <SelectItem key={device.serial} value={device.serial}>
                        {device.serial}
                        {device.model ? ` · ${device.model}` : ""}
                        {device.state !== "device" ? ` (${device.state})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </label>

            <SelectField
              label="USB / TCP-IP"
              value={options.deviceSelection.connectionMode}
              onValueChange={(connectionMode) =>
                onOptionsChange({
                  ...options,
                  deviceSelection: {
                    ...options.deviceSelection,
                    connectionMode: connectionMode as
                      | "serial"
                      | "usb"
                      | "tcpip",
                  },
                })
              }
              values={["serial", "usb", "tcpip"]}
              placeholder="Transport"
            />

            {options.deviceSelection.connectionMode === "tcpip" ? (
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  TCP-IP address (ip[:port])
                </span>
                <Input
                  className="h-8"
                  value={options.deviceSelection.tcpipAddress}
                  onChange={(event) =>
                    onOptionsChange({
                      ...options,
                      deviceSelection: {
                        ...options.deviceSelection,
                        tcpipAddress: event.target.value,
                      },
                    })
                  }
                  placeholder="192.168.1.2:5555"
                />
              </label>
            ) : null}

            <SelectField
              label="Capture source"
              value={options.deviceSelection.captureSource}
              onValueChange={(captureSource) =>
                onOptionsChange({
                  ...options,
                  deviceSelection: {
                    ...options.deviceSelection,
                    captureSource: captureSource as "display" | "camera",
                  },
                })
              }
              values={["display", "camera"]}
            />
          </OptionSection>

          {!isCameraSelected ? (
            <OptionSection
              title="Video Settings"
              description="Display capture options."
              enabled={options.videoSettings.enabled}
              onEnabledChange={(enabled) =>
                onOptionsChange({
                  ...options,
                  videoSettings: { ...options.videoSettings, enabled },
                })
              }
            >
              <SelectField
                label="Resolution (--max-size)"
                value={options.videoSettings.maxSize}
                onValueChange={(maxSize) =>
                  onOptionsChange({
                    ...options,
                    videoSettings: { ...options.videoSettings, maxSize },
                  })
                }
                values={resolutionOptions}
              />
              <SelectField
                label="Bit Rate"
                value={options.videoSettings.bitRate}
                onValueChange={(bitRate) =>
                  onOptionsChange({
                    ...options,
                    videoSettings: { ...options.videoSettings, bitRate },
                  })
                }
                values={videoBitrateOptions}
              />
              <SelectField
                label="Max FPS"
                value={options.videoSettings.maxFps}
                onValueChange={(maxFps) =>
                  onOptionsChange({
                    ...options,
                    videoSettings: { ...options.videoSettings, maxFps },
                  })
                }
                values={maxFpsOptions}
              />
              <SelectField
                label="Video Codec"
                value={options.videoSettings.codec}
                onValueChange={(codec) =>
                  onOptionsChange({
                    ...options,
                    videoSettings: {
                      ...options.videoSettings,
                      codec: codec as "h264" | "h265" | "av1",
                    },
                  })
                }
                values={videoCodecOptions}
              />

              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  Video Encoder
                </span>
                <Input
                  className="h-8"
                  value={options.videoSettings.encoder}
                  onChange={(event) =>
                    onOptionsChange({
                      ...options,
                      videoSettings: {
                        ...options.videoSettings,
                        encoder: event.target.value,
                      },
                    })
                  }
                  placeholder="OMX.qcom.video.encoder.avc"
                />
              </label>

              <SelectField
                label="Angle"
                value={options.videoSettings.orientation}
                onValueChange={(orientation) =>
                  onOptionsChange({
                    ...options,
                    videoSettings: {
                      ...options.videoSettings,
                      orientation: orientation as "0" | "90" | "180" | "270",
                    },
                  })
                }
                values={orientationOptions}
              />

              <ToggleField
                label="Orientation locked"
                checked={options.videoSettings.lockOrientation}
                onCheckedChange={(lockOrientation) =>
                  onOptionsChange({
                    ...options,
                    videoSettings: {
                      ...options.videoSettings,
                      lockOrientation,
                    },
                  })
                }
              />

              <ToggleField
                label="Horizontal flip"
                checked={options.videoSettings.hFlip}
                onCheckedChange={(hFlip) =>
                  onOptionsChange({
                    ...options,
                    videoSettings: { ...options.videoSettings, hFlip },
                  })
                }
              />

              <SelectField
                label="Display Buffer (ms)"
                value={options.videoSettings.displayBufferMs}
                onValueChange={(displayBufferMs) =>
                  onOptionsChange({
                    ...options,
                    videoSettings: {
                      ...options.videoSettings,
                      displayBufferMs,
                    },
                  })
                }
                values={displayBufferOptions}
              />

              <SelectField
                label="Select Display"
                value={options.videoSettings.displayId}
                onValueChange={(displayId) =>
                  onOptionsChange({
                    ...options,
                    videoSettings: { ...options.videoSettings, displayId },
                  })
                }
                values={displayIdOptions}
              />
            </OptionSection>
          ) : null}

          {isCameraSelected ? (
            <OptionSection
              title="Camera mode"
              description="Camera capture options."
            >
              <SelectField
                label="Camera ID"
                value={options.cameraMode.cameraId}
                onValueChange={(cameraId) =>
                  onOptionsChange({
                    ...options,
                    cameraMode: { ...options.cameraMode, cameraId },
                  })
                }
                values={cameraIdOptions}
              />
              <SelectField
                label="Camera Facing"
                value={options.cameraMode.facing}
                onValueChange={(facing) =>
                  onOptionsChange({
                    ...options,
                    cameraMode: {
                      ...options.cameraMode,
                      facing: facing as "" | "front" | "back" | "external",
                    },
                  })
                }
                values={cameraFacingOptions}
                disabled={options.cameraMode.cameraId !== ""}
              />
              <SelectField
                label="Camera Size"
                value={options.cameraMode.size}
                onValueChange={(size) =>
                  onOptionsChange({
                    ...options,
                    cameraMode: { ...options.cameraMode, size },
                  })
                }
                values={cameraSizeOptions}
              />
              <SelectField
                label="Camera FPS"
                value={options.cameraMode.fps}
                onValueChange={(fps) =>
                  onOptionsChange({
                    ...options,
                    cameraMode: { ...options.cameraMode, fps },
                  })
                }
                values={cameraFpsOptions}
              />
              <SelectField
                label="Camera AR"
                value={options.cameraMode.aspectRatio}
                onValueChange={(aspectRatio) =>
                  onOptionsChange({
                    ...options,
                    cameraMode: { ...options.cameraMode, aspectRatio },
                  })
                }
                values={cameraAspectRatioOptions.filter((item) => item !== "")}
                disabled={options.cameraMode.size !== ""}
              />
              <ToggleField
                label="Camera High Speed"
                checked={options.cameraMode.highSpeed}
                onCheckedChange={(highSpeed) =>
                  onOptionsChange({
                    ...options,
                    cameraMode: { ...options.cameraMode, highSpeed },
                  })
                }
              />
            </OptionSection>
          ) : null}

          <OptionSection
            title="Audio Settings"
            description="Audio forwarding and encoding options."
            enabled={options.audioSettings.enabled}
            onEnabledChange={(enabled) =>
              onOptionsChange({
                ...options,
                audioSettings: { ...options.audioSettings, enabled },
              })
            }
          >
            <SelectField
              label="Audio Source"
              value={options.audioSettings.source}
              onValueChange={(source) =>
                onOptionsChange({
                  ...options,
                  audioSettings: {
                    ...options.audioSettings,
                    source: source as typeof options.audioSettings.source,
                  },
                })
              }
              values={audioSourceOptions}
            />
            <SelectField
              label="Bit Rate"
              value={options.audioSettings.bitRate}
              onValueChange={(bitRate) =>
                onOptionsChange({
                  ...options,
                  audioSettings: { ...options.audioSettings, bitRate },
                })
              }
              values={audioBitRateOptions}
            />
            <SelectField
              label="Audio Codec"
              value={options.audioSettings.codec}
              onValueChange={(codec) =>
                onOptionsChange({
                  ...options,
                  audioSettings: {
                    ...options.audioSettings,
                    codec: codec as "opus" | "aac" | "flac" | "raw",
                  },
                })
              }
              values={audioCodecOptions}
            />
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">
                Audio Encoder
              </span>
              <Input
                className="h-8"
                value={options.audioSettings.encoder}
                onChange={(event) =>
                  onOptionsChange({
                    ...options,
                    audioSettings: {
                      ...options.audioSettings,
                      encoder: event.target.value,
                    },
                  })
                }
                placeholder="c2.android.opus.encoder"
              />
            </label>
            <SelectField
              label="Audio Buffer (ms)"
              value={options.audioSettings.bufferMs}
              onValueChange={(bufferMs) =>
                onOptionsChange({
                  ...options,
                  audioSettings: { ...options.audioSettings, bufferMs },
                })
              }
              values={audioBufferOptions}
            />
            <SelectField
              label="Audio Duplication Target"
              value={options.audioSettings.duplicationTarget}
              onValueChange={(duplicationTarget) =>
                onOptionsChange({
                  ...options,
                  audioSettings: {
                    ...options.audioSettings,
                    duplicationTarget: duplicationTarget as "off" | "device",
                    audioDuplicationTarget: duplicationTarget as
                      | "off"
                      | "device",
                  },
                })
              }
              values={["off", "device"]}
            />
          </OptionSection>

          <OptionSection
            title="Window Behaviour"
            description="Window placement and desktop behavior."
          >
            <ToggleField
              label="Fullscreen"
              checked={options.windowBehavior.fullscreen}
              onCheckedChange={(fullscreen) =>
                onOptionsChange({
                  ...options,
                  windowBehavior: { ...options.windowBehavior, fullscreen },
                })
              }
            />
            <ToggleField
              label="Always on top"
              checked={options.windowBehavior.alwaysOnTop}
              onCheckedChange={(alwaysOnTop) =>
                onOptionsChange({
                  ...options,
                  windowBehavior: { ...options.windowBehavior, alwaysOnTop },
                })
              }
            />
            <ToggleField
              label="Window Borderless"
              checked={options.windowBehavior.borderless}
              onCheckedChange={(borderless) =>
                onOptionsChange({
                  ...options,
                  windowBehavior: { ...options.windowBehavior, borderless },
                })
              }
            />
            <ToggleField
              label="Disable Screen saver"
              checked={options.windowBehavior.disableScreensaver}
              onCheckedChange={(disableScreensaver) =>
                onOptionsChange({
                  ...options,
                  windowBehavior: {
                    ...options.windowBehavior,
                    disableScreensaver,
                  },
                })
              }
            />
            <label className="space-y-1 basis-full">
              <span className="text-xs text-muted-foreground">
                Window Title
              </span>
              <Input
                className="h-8"
                value={options.windowBehavior.windowTitle}
                onChange={(event) =>
                  onOptionsChange({
                    ...options,
                    windowBehavior: {
                      ...options.windowBehavior,
                      windowTitle: event.target.value,
                    },
                  })
                }
                placeholder="Optional"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Window X</span>
              <Input
                className="h-8"
                value={options.windowBehavior.windowX}
                onChange={(event) =>
                  onOptionsChange({
                    ...options,
                    windowBehavior: {
                      ...options.windowBehavior,
                      windowX: event.target.value,
                    },
                  })
                }
                placeholder="100"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Window Y</span>
              <Input
                className="h-8"
                value={options.windowBehavior.windowY}
                onChange={(event) =>
                  onOptionsChange({
                    ...options,
                    windowBehavior: {
                      ...options.windowBehavior,
                      windowY: event.target.value,
                    },
                  })
                }
                placeholder="100"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">
                Window Width
              </span>
              <Input
                className="h-8"
                value={options.windowBehavior.windowWidth}
                onChange={(event) =>
                  onOptionsChange({
                    ...options,
                    windowBehavior: {
                      ...options.windowBehavior,
                      windowWidth: event.target.value,
                    },
                  })
                }
                placeholder="800"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">
                Window Height
              </span>
              <Input
                className="h-8"
                value={options.windowBehavior.windowHeight}
                onChange={(event) =>
                  onOptionsChange({
                    ...options,
                    windowBehavior: {
                      ...options.windowBehavior,
                      windowHeight: event.target.value,
                    },
                  })
                }
                placeholder="600"
              />
            </label>
          </OptionSection>

          <OptionSection
            title="Recording"
            description="Session recording options."
            enabled={options.recording.enabled}
            onEnabledChange={(enabled) =>
              onOptionsChange({
                ...options,
                recording: { ...options.recording, enabled },
              })
            }
          >
            <SelectField
              label="Format"
              value={options.recording.format}
              onValueChange={(format) =>
                onOptionsChange({
                  ...options,
                  recording: {
                    ...options.recording,
                    format: format as "mp4" | "mkv" | "opus" | "flac" | "wav",
                  },
                })
              }
              values={recordingFormatOptions}
            />
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">
                Time Limit (seconds)
              </span>
              <Input
                className="h-8"
                value={options.recording.timeLimit}
                onChange={(event) =>
                  onOptionsChange({
                    ...options,
                    recording: {
                      ...options.recording,
                      timeLimit: event.target.value,
                    },
                  })
                }
                placeholder="20"
              />
            </label>
            <ToggleField
              label="No Playback"
              checked={options.recording.noPlayback}
              onCheckedChange={(noPlayback) =>
                onOptionsChange({
                  ...options,
                  recording: { ...options.recording, noPlayback },
                })
              }
            />
            <ToggleField
              label="No Window"
              checked={options.recording.noWindow}
              onCheckedChange={(noWindow) =>
                onOptionsChange({
                  ...options,
                  recording: { ...options.recording, noWindow },
                })
              }
            />
          </OptionSection>

          <OptionSection
            title="Input & Control Behaviour"
            description="Control and HID input modes."
          >
            <ToggleField
              label="No Control"
              checked={options.inputControl.noControl}
              onCheckedChange={(noControl) =>
                onOptionsChange({
                  ...options,
                  inputControl: { ...options.inputControl, noControl },
                })
              }
            />
            <ToggleField
              label="Show Touches"
              checked={options.inputControl.showTouches}
              onCheckedChange={(showTouches) =>
                onOptionsChange({
                  ...options,
                  inputControl: { ...options.inputControl, showTouches },
                })
              }
            />
            <ToggleField
              label="Stay Awake"
              checked={options.inputControl.stayAwake}
              onCheckedChange={(stayAwake) =>
                onOptionsChange({
                  ...options,
                  inputControl: { ...options.inputControl, stayAwake },
                })
              }
            />
            <ToggleField
              label="Turn Screen Off"
              checked={options.inputControl.turnScreenOff}
              onCheckedChange={(turnScreenOff) =>
                onOptionsChange({
                  ...options,
                  inputControl: { ...options.inputControl, turnScreenOff },
                })
              }
            />
            <ToggleField
              label="Power off on close"
              checked={options.inputControl.powerOffOnClose}
              onCheckedChange={(powerOffOnClose) =>
                onOptionsChange({
                  ...options,
                  inputControl: { ...options.inputControl, powerOffOnClose },
                })
              }
            />
            <ToggleField
              label="OTG"
              checked={options.inputControl.otg}
              onCheckedChange={(otg) =>
                onOptionsChange({
                  ...options,
                  inputControl: { ...options.inputControl, otg },
                })
              }
            />
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">
                Screen off timeout (s)
              </span>
              <Input
                className="h-8"
                value={options.inputControl.screenOffTimeout}
                onChange={(event) =>
                  onOptionsChange({
                    ...options,
                    inputControl: {
                      ...options.inputControl,
                      screenOffTimeout: event.target.value,
                    },
                  })
                }
                placeholder="300"
              />
            </label>
            <SelectField
              label="Keyboard"
              value={options.inputControl.keyboardMode}
              onValueChange={(keyboardMode) =>
                onOptionsChange({
                  ...options,
                  inputControl: {
                    ...options.inputControl,
                    keyboardMode: keyboardMode as
                      | "sdk"
                      | "uhid"
                      | "aoa"
                      | "disabled",
                  },
                })
              }
              values={keyboardModeOptions}
            />
            <SelectField
              label="Mouse"
              value={options.inputControl.mouseMode}
              onValueChange={(mouseMode) =>
                onOptionsChange({
                  ...options,
                  inputControl: {
                    ...options.inputControl,
                    mouseMode: mouseMode as "sdk" | "uhid" | "aoa" | "disabled",
                  },
                })
              }
              values={mouseModeOptions}
            />
            <SelectField
              label="Gamepad"
              value={options.inputControl.gamepadMode}
              onValueChange={(gamepadMode) =>
                onOptionsChange({
                  ...options,
                  inputControl: {
                    ...options.inputControl,
                    gamepadMode: gamepadMode as "disabled" | "uhid" | "aoa",
                  },
                })
              }
              values={gamepadModeOptions}
            />
          </OptionSection>

          <OptionSection
            title="Display features"
            description="Display runtime feature toggles."
          >
            <ToggleField
              label="Print FPS"
              checked={options.displayFeatures.printFps}
              onCheckedChange={(printFps) =>
                onOptionsChange({
                  ...options,
                  displayFeatures: { ...options.displayFeatures, printFps },
                })
              }
            />
          </OptionSection>

          <OptionSection
            title="Diagnostics"
            description="Troubleshooting and advanced options."
          >
            <ToggleField
              label="Require audio"
              checked={options.diagnostics.requireAudio}
              onCheckedChange={(requireAudio) =>
                onOptionsChange({
                  ...options,
                  diagnostics: { ...options.diagnostics, requireAudio },
                })
              }
            />
            <ToggleField
              label="No downsize on error"
              checked={options.diagnostics.noDownsizeOnError}
              onCheckedChange={(noDownsizeOnError) =>
                onOptionsChange({
                  ...options,
                  diagnostics: { ...options.diagnostics, noDownsizeOnError },
                })
              }
            />
            <label className="space-y-1 basis-full">
              <span className="text-xs text-muted-foreground">Extra Args</span>
              <Input
                className="h-8"
                value={options.diagnostics.extraArgs}
                onChange={(event) =>
                  onOptionsChange({
                    ...options,
                    diagnostics: {
                      ...options.diagnostics,
                      extraArgs: event.target.value,
                    },
                  })
                }
                placeholder="--tcpip=+192.168.1.4 --force-adb-forward"
              />
            </label>
          </OptionSection>
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t p-2 bg-card/70">
        <Button
          size="sm"
          className="w-full"
          onClick={onLaunch}
          disabled={!canLaunch || launching}
        >
          {launching ? <Spinner className="size-4" /> : null}
          Launch Session
        </Button>
      </div>
    </section>
  );
}

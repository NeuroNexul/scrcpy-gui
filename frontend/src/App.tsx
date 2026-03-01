import AppBar from "./components/AppBar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { EventsOn } from "../wailsjs/runtime/runtime";
import {
  GetBundleHealth,
  GetInstanceLogs,
  ListDevices,
  ListInstances,
  RefreshEnvironment,
  StartInstance,
  StopAllInstances,
  StopInstance,
} from "../wailsjs/go/main/App";
import { main } from "../wailsjs/go/models";
import { OptionsPanel } from "./features/launch/OptionsPanel";
import { defaultLaunchOptions } from "./features/launch/defaults";

const EVENT_ENVIRONMENT_UPDATED = "environment:updated";
const EVENT_DEVICES_UPDATED = "devices:updated";
const EVENT_INSTANCE_UPDATED = "instance:updated";
const EVENT_INSTANCE_LOG = "instance:log";

const MAX_LOG_LINES = 3000;

const emptyStatus: main.SystemStatus = {
  scrcpyFound: false,
  scrcpyPath: "",
  adbFound: false,
  adbPath: "",
  platform: "",
  installHint: "",
};

function App() {
  const [status, setStatus] = useState<main.SystemStatus>(emptyStatus);
  const [devices, setDevices] = useState<main.Device[]>([]);
  const [instances, setInstances] = useState<main.InstanceSummary[]>([]);
  const [logsByInstance, setLogsByInstance] = useState<Record<string, main.InstanceLogLine[]>>({});
  const [bundleHealth, setBundleHealth] = useState<main.BundleHealth | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("");
  const [initializing, setInitializing] = useState<boolean>(true);
  const [launching, setLaunching] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string>("");
  const [launchOptions, setLaunchOptions] = useState(defaultLaunchOptions);

  const refreshStatus = useCallback(async () => {
    const nextStatus = await RefreshEnvironment();
    setStatus(nextStatus);
  }, []);

  const refreshBundleHealth = useCallback(async () => {
    const nextBundleHealth = await GetBundleHealth();
    setBundleHealth(nextBundleHealth);
  }, []);

  const refreshDevices = useCallback(async () => {
    const nextDevices = await ListDevices();
    setDevices(nextDevices);

    if (nextDevices.length > 0 && !nextDevices.some((item) => item.serial === selectedDevice)) {
      setSelectedDevice(nextDevices[0].serial);
    }
  }, [selectedDevice]);

  const refreshInstances = useCallback(async () => {
    const nextInstances = await ListInstances();
    setInstances(nextInstances);

    if (nextInstances.length > 0 && !nextInstances.some((item) => item.id === activeTab)) {
      setActiveTab(nextInstances[0].id);
    }

    const activeInstanceIds = new Set(nextInstances.map((item) => item.id));
    setLogsByInstance((prev) => {
      const next: Record<string, main.InstanceLogLine[]> = {};
      for (const [instanceId, logs] of Object.entries(prev)) {
        if (activeInstanceIds.has(instanceId)) {
          next[instanceId] = logs;
        }
      }
      return next;
    });
  }, [activeTab]);

  const refreshAll = useCallback(async () => {
    setLastError("");
    try {
      await Promise.all([refreshStatus(), refreshBundleHealth(), refreshDevices(), refreshInstances()]);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Unable to refresh app state");
    }
  }, [refreshBundleHealth, refreshDevices, refreshInstances, refreshStatus]);

  useEffect(() => {
    const init = async () => {
      await refreshAll();
      setInitializing(false);
    };

    init();
  }, [refreshAll]);

  useEffect(() => {
    const offEnvironment = EventsOn(EVENT_ENVIRONMENT_UPDATED, (...data: unknown[]) => {
      const payload = data[0] as main.SystemStatus | undefined;
      if (payload) {
        setStatus(payload);
      }
    });

    const offDevices = EventsOn(EVENT_DEVICES_UPDATED, (...data: unknown[]) => {
      const payload = data[0] as main.Device[] | undefined;
      if (payload) {
        setDevices(payload);
      }
    });

    const offInstanceUpdated = EventsOn(EVENT_INSTANCE_UPDATED, (...data: unknown[]) => {
      const payload = data[0] as main.InstanceSummary | undefined;
      if (!payload) {
        return;
      }

      setInstances((prev) => {
        const index = prev.findIndex((item) => item.id === payload.id);
        if (index === -1) {
          return [payload, ...prev];
        }

        const next = [...prev];
        next[index] = payload;
        return next;
      });

      if (payload.id && !activeTab) {
        setActiveTab(payload.id);
      }
    });

    const offInstanceLog = EventsOn(EVENT_INSTANCE_LOG, (...data: unknown[]) => {
      const payload = data[0] as main.InstanceLogLine | undefined;
      if (!payload) {
        return;
      }

      setLogsByInstance((prev) => {
        const existing = prev[payload.instanceId] ?? [];
        const nextLogs = [...existing, payload];
        const trimmed = nextLogs.length > MAX_LOG_LINES ? nextLogs.slice(nextLogs.length - MAX_LOG_LINES) : nextLogs;
        return {
          ...prev,
          [payload.instanceId]: trimmed,
        };
      });
    });

    return () => {
      offEnvironment();
      offDevices();
      offInstanceUpdated();
      offInstanceLog();
    };
  }, [activeTab]);

  useEffect(() => {
    const loadLogs = async () => {
      const targets = instances.map((item) => item.id).filter((instanceId) => !(instanceId in logsByInstance));

      if (targets.length === 0) {
        return;
      }

      for (const instanceId of targets) {
        try {
          const lines = await GetInstanceLogs(instanceId, 500);
          setLogsByInstance((prev) => ({
            ...prev,
            [instanceId]: lines,
          }));
        } catch {
        }
      }
    };

    loadLogs();
  }, [instances, logsByInstance]);

  const canLaunch = useMemo(() => {
    const canSelectDevice =
      launchOptions.deviceSelection.connectionMode !== "serial" || selectedDevice.length > 0;

    return status.scrcpyFound && status.adbFound && !!bundleHealth?.healthy && canSelectDevice;
  }, [bundleHealth?.healthy, launchOptions.deviceSelection.connectionMode, selectedDevice.length, status.adbFound, status.scrcpyFound]);

  const handleLaunch = async () => {
    if (!canLaunch || launching) {
      return;
    }

    setLaunching(true);
    setLastError("");

    try {
      const payload: any = {
        deviceSerial: selectedDevice,
        windowTitle: launchOptions.windowBehavior.windowTitle,
        extraArgs: "",
      };

      payload.options = launchOptions;

      const instance = await StartInstance(payload as main.LaunchRequest);
      setActiveTab(instance.id);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Failed to launch scrcpy instance");
    } finally {
      setLaunching(false);
    }
  };

  const handleStop = async (instanceId: string) => {
    setLastError("");
    try {
      await StopInstance(instanceId);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : `Failed to stop instance ${instanceId}`);
    }
  };

  const handleStopAll = async () => {
    setLastError("");
    try {
      await StopAllInstances();
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Failed to stop all instances");
    }
  };

  const getInstanceStatusVariant = (value: string): "default" | "secondary" | "destructive" => {
    if (value === "running") {
      return "default";
    }
    if (value === "failed") {
      return "destructive";
    }
    return "secondary";
  };

  const formatTimestamp = (value: number) => {
    if (!value) {
      return "";
    }
    return new Date(value).toLocaleTimeString();
  };

  return (
    <div id="App" className="dark h-screen flex flex-col bg-background text-foreground">
      <AppBar title="Screen Copy" />
      <main className="flex-1 p-3 overflow-hidden min-h-0">
        {initializing ? (
          <div className="h-full grid place-items-center text-muted-foreground gap-2">
            <Spinner className="size-5" />
            <span>Initializing scrcpy workspace…</span>
          </div>
        ) : (
          <div className="h-full grid grid-rows-[auto_1fr_auto_auto] gap-3 min-h-0">
            <section className="rounded-md border p-2 bg-card/60 flex flex-wrap items-center gap-2">
              <Badge variant={status.scrcpyFound ? "default" : "destructive"}>scrcpy: {status.scrcpyFound ? "ok" : "missing"}</Badge>
              <Badge variant={status.adbFound ? "default" : "destructive"}>adb: {status.adbFound ? "ok" : "missing"}</Badge>
              <Badge variant={bundleHealth?.healthy ? "secondary" : "destructive"}>bundle: {bundleHealth?.healthy ? "ok" : "issues"}</Badge>

              <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={refreshAll}>Refresh</Button>
                <Button size="sm" variant="destructive" onClick={handleStopAll}>Stop All</Button>
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-[minmax(360px,480px)_1fr] gap-3 min-h-0">
              <OptionsPanel
                devices={devices}
                selectedDevice={selectedDevice}
                onSelectedDeviceChange={setSelectedDevice}
                options={launchOptions}
                onOptionsChange={setLaunchOptions}
                launching={launching}
                canLaunch={canLaunch}
                onLaunch={handleLaunch}
              />

              <section className="h-full min-h-0 rounded-md border bg-card/50 overflow-hidden flex flex-col">
                <div className="px-3 py-2 border-b bg-card/70 text-sm font-medium">Logs</div>

                {instances.length === 0 ? (
                  <div className="h-full grid place-items-center text-muted-foreground text-sm">
                    No running sessions. Configure options and launch to begin.
                  </div>
                ) : (
                  <Tabs value={activeTab || instances[0].id} onValueChange={setActiveTab} className="h-full min-h-0 flex flex-col">
                    <TabsList className="mx-2 mt-2 max-w-full overflow-x-auto justify-start">
                      {instances.map((instance) => (
                        <TabsTrigger key={instance.id} value={instance.id} className="min-w-fit">
                          {instance.windowTitle}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {instances.map((instance) => (
                      <TabsContent key={instance.id} value={instance.id} className="mt-2 h-full min-h-0 px-2 pb-2">
                        <div className="h-full min-h-0 grid grid-rows-[auto_1fr] gap-2">
                          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-background/30 px-2 py-1.5">
                            <Badge variant={getInstanceStatusVariant(instance.status)}>{instance.status}</Badge>
                            <Badge variant="outline">{instance.deviceSerial || "auto"}</Badge>
                            {instance.pid > 0 ? <Badge variant="outline">PID {instance.pid}</Badge> : null}
                            <span className="text-xs text-muted-foreground truncate">{instance.command}</span>
                            <Button className="ml-auto" size="sm" variant="outline" onClick={() => handleStop(instance.id)}>
                              Stop
                            </Button>
                          </div>

                          <ScrollArea className="h-full rounded-md border bg-background/70">
                            <div className="p-3 font-mono text-xs leading-relaxed space-y-1">
                              {(logsByInstance[instance.id] ?? []).map((line, index) => (
                                <div key={`${instance.id}-${line.timestamp}-${index}`} className="text-foreground/90">
                                  <span className="text-muted-foreground">[{formatTimestamp(line.timestamp)}]</span>{" "}
                                  <span className="text-muted-foreground">{line.stream}</span>{" "}
                                  <span>{line.message}</span>
                                </div>
                              ))}

                              {(logsByInstance[instance.id] ?? []).length === 0 ? (
                                <div className="text-muted-foreground">No logs yet.</div>
                              ) : null}
                            </div>
                          </ScrollArea>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </section>
            </section>

            {lastError ? (
              <section className="border border-destructive/60 bg-destructive/10 rounded-md p-2 text-sm text-destructive animate-in fade-in-0 slide-in-from-bottom-1">
                {lastError}
              </section>
            ) : null}

            {!status.scrcpyFound || !status.adbFound || !bundleHealth?.healthy ? (
              <section className="text-xs text-muted-foreground">
                {status.installHint}
                {!bundleHealth?.healthy ? ` ${bundleHealth?.message || ""}` : ""}
              </section>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

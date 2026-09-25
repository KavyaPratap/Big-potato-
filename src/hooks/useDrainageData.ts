import { useCallback, useEffect, useState } from "react";
import { hardwareAdapter } from "@/services/hardware";
import { mlAdapter } from "@/services/ml";
import type {
  DrainNode,
  Alert,
  Gateway,
  NetworkTopology,
  MaintenanceTask,
  SystemEvent,
  Prediction,
  SensorReading,
} from "@/types";

/** All live nodes, kept fresh via the hardware adapter's simulated stream. */
export function useNodes(live = true) {
  const [nodes, setNodes] = useState<DrainNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    hardwareAdapter.getNodes().then((n) => {
      if (mounted) {
        setNodes(n);
        setError(null);
        setLoading(false);
      }
    }).catch((reason: unknown) => {
      if (mounted) {
        setError(reason instanceof Error ? reason.message : "Unable to load node telemetry.");
        setLoading(false);
      }
    });
    if (!live) return () => { mounted = false; };
    const unsub = hardwareAdapter.subscribeToLiveData((n) => mounted && setNodes(n));
    return () => {
      mounted = false;
      unsub();
    };
  }, [live]);

  return { nodes, loading, error };
}

export function useNode(nodeId: string | undefined) {
  const { nodes } = useNodes(true);
  const [fallback, setFallback] = useState<{ nodeId: string; node?: DrainNode } | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!nodeId) return () => { mounted = false; };
    hardwareAdapter.getNode(nodeId).then((nextNode) => {
      if (mounted) setFallback({ nodeId, node: nextNode });
    });
    return () => { mounted = false; };
  }, [nodeId]);

  const fallbackNode = fallback && fallback.nodeId === nodeId ? fallback.node : undefined;
  const node = nodes.find((n) => n.id === nodeId) ?? fallbackNode;
  return node;
}

export function useSensorHistory(nodeId: string | undefined, hours: number) {
  const requestKey = `${nodeId ?? ""}:${hours}`;
  const [result, setResult] = useState<{ key: string; history: SensorReading[] }>({ key: "", history: [] });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!nodeId) return () => { mounted = false; };
    hardwareAdapter.getSensorHistory(nodeId, hours).then((h) => {
      if (mounted) {
        setResult({ key: requestKey, history: h });
        setError(null);
      }
    }).catch((reason: unknown) => {
      if (mounted) setError(reason instanceof Error ? reason.message : "Unable to load sensor history.");
    });
    return () => { mounted = false; };
  }, [nodeId, hours, requestKey]);

  return {
    history: result.key === requestKey ? result.history : [],
    loading: Boolean(nodeId) && result.key !== requestKey,
    error,
  };
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    hardwareAdapter.getAlerts().then((a) => {
      setAlerts(a);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    const unsub = hardwareAdapter.subscribeToLiveData(() => refresh());
    return unsub;
  }, [refresh]);

  const acknowledge = useCallback(
    async (id: string) => {
      await hardwareAdapter.acknowledgeAlert(id);
      refresh();
    },
    [refresh]
  );
  const resolve = useCallback(
    async (id: string) => {
      await hardwareAdapter.resolveAlert(id);
      refresh();
    },
    [refresh]
  );

  return { alerts, loading, acknowledge, resolve, refresh };
}

export function useGateways() {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  useEffect(() => {
    let mounted = true;
    const refresh = () => hardwareAdapter.getGateways().then((nextGateways) => {
      if (mounted) setGateways(nextGateways);
    }).catch(() => undefined);
    refresh();
    const unsub = hardwareAdapter.subscribeToLiveData(refresh);
    return () => {
      mounted = false;
      unsub();
    };
  }, []);
  return gateways;
}

export function useNetworkTopology() {
  const [topology, setTopology] = useState<NetworkTopology | null>(null);
  useEffect(() => {
    let mounted = true;
    const load = () => hardwareAdapter.getNetworkTopology().then((t) => mounted && setTopology(t)).catch(() => undefined);
    load();
    const unsub = hardwareAdapter.subscribeToLiveData(() => load());
    return () => {
      mounted = false;
      unsub();
    };
  }, []);
  return topology;
}

export function useMaintenanceTasks() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  useEffect(() => {
    hardwareAdapter.getMaintenanceTasks().then(setTasks).catch(() => undefined);
  }, []);
  return tasks;
}

export function useSystemEvents() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  useEffect(() => {
    hardwareAdapter.getSystemEvents().then(setEvents).catch(() => undefined);
  }, []);
  return events;
}

export function usePredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    mlAdapter.getPredictions().then((p) => {
      setPredictions(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  return { predictions, loading };
}

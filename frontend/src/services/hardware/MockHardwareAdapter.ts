import type { HardwareAdapter } from "./HardwareAdapter";
import type { DrainNode, Alert, SimulationScenario } from "@/types";
import {
  NODES,
  GATEWAYS,
  buildAlerts,
  buildHistory,
  buildNetworkEdges,
  MAINTENANCE_TASKS,
  SYSTEM_EVENTS,
} from "@/data/mockData";

const LATENCY = 120;
const wait = (ms = LATENCY) => new Promise((r) => setTimeout(r, ms));

function cloneNodes(nodes: DrainNode[]): DrainNode[] {
  return nodes.map((n) => ({ ...n, location: { ...n.location } }));
}

function cloneGateways(gateways: typeof GATEWAYS) {
  return gateways.map((g) => ({ ...g, location: { ...g.location } }));
}

/**
 * In-memory mock hardware layer. Owns mutable node state so the "Live
 * Simulation" and "Demo Mode" controls can drift values over time and have
 * every subscribed page (Overview, Live Monitoring, Map, Node detail,
 * Alerts) reflect the same state.
 */
class MockHardwareAdapterImpl implements HardwareAdapter {
  private nodes: DrainNode[] = cloneNodes(NODES);
  private gateways = cloneGateways(GATEWAYS);
  private alerts: Alert[] = buildAlerts(this.nodes);
  private listeners = new Set<(nodes: DrainNode[]) => void>();
  private simTimer: ReturnType<typeof setInterval> | null = null;
  private scenario: SimulationScenario = "normal";
  private speed = 1;
  private focusNodeId: string | null = null;
  private offlineGatewayId: string | null = null;

  async getNodes() {
    await wait();
    return cloneNodes(this.nodes);
  }

  async getNode(nodeId: string) {
    await wait(60);
    const node = this.nodes.find((n) => n.id === nodeId);
    return node ? { ...node, location: { ...node.location } } : undefined;
  }

  async getSensorHistory(nodeId: string, hours: number) {
    await wait(150);
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) return [];
    return buildHistory(node, hours);
  }

  async getAlerts() {
    await wait();
    return [...this.alerts];
  }

  async acknowledgeAlert(alertId: string) {
    await wait(80);
    this.alerts = this.alerts.map((a) =>
      a.id === alertId ? { ...a, status: "acknowledged" } : a
    );
  }

  async resolveAlert(alertId: string) {
    await wait(80);
    this.alerts = this.alerts.map((a) =>
      a.id === alertId ? { ...a, status: "resolved" } : a
    );
  }

  async getGateways() {
    await wait(90);
    return cloneGateways(this.gateways);
  }

  async getNetworkTopology() {
    await wait(150);
    return {
      gateways: cloneGateways(this.gateways),
      nodes: cloneNodes(this.nodes),
      edges: buildNetworkEdges(this.nodes),
    };
  }

  async getMaintenanceTasks() {
    await wait(90);
    return [...MAINTENANCE_TASKS];
  }

  async getSystemEvents() {
    await wait(90);
    return [...SYSTEM_EVENTS];
  }

  subscribeToLiveData(callback: (nodes: DrainNode[]) => void) {
    this.listeners.add(callback);
    if (!this.simTimer) this.startTick();
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0 && this.simTimer) {
        clearInterval(this.simTimer);
        this.simTimer = null;
      }
    };
  }

  setScenario(scenario: SimulationScenario, focusNodeId?: string) {
    this.scenario = scenario;
    this.focusNodeId = focusNodeId ?? this.nodes[Math.floor(Math.random() * 30)].id;
    this.offlineGatewayId = scenario === "gateway_offline"
      ? this.nodes.find((n) => n.id === this.focusNodeId)?.gatewayId ?? this.gateways[0]?.id ?? null
      : null;
    this.gateways = this.gateways.map((gateway) =>
      gateway.id === this.offlineGatewayId
        ? { ...gateway, status: "offline", backhaul: "disconnected", meshHealth: 0, lastSync: new Date().toISOString() }
        : { ...gateway }
    );
    this.notify();
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }

  reset() {
    this.nodes = cloneNodes(NODES);
    this.gateways = cloneGateways(GATEWAYS);
    this.alerts = buildAlerts(this.nodes);
    this.scenario = "normal";
    this.focusNodeId = null;
    this.offlineGatewayId = null;
    this.notify();
  }

  private notify() {
    const snapshot = cloneNodes(this.nodes);
    this.listeners.forEach((cb) => cb(snapshot));
  }

  private startTick() {
    this.simTimer = setInterval(() => {
      this.tick();
      this.notify();
    }, 2500);
  }

  private tick() {
    const drift = (v: number, amt: number, min: number, max: number) =>
      Math.min(max, Math.max(min, v + (Math.random() - 0.5) * amt * this.speed));

    this.nodes = this.nodes.map((n) => {
      const baselineNode = NODES.find((baseline) => baseline.id === n.id);
      const gatewayOffline = n.gatewayId === this.offlineGatewayId;
      if (baselineNode?.status === "offline" && !gatewayOffline) return n;
      if (gatewayOffline) return { ...n, status: "offline", lastSeen: n.lastSeen };

      let waterLevel = n.waterLevel;
      let methaneLEL = n.methaneLEL;
      let h2sPpm = n.h2sPpm;
      let battery = n.battery;
      let rssi = n.rssi;
      let tilt = n.tilt;
      let status = n.status;

      const isFocus = n.id === this.focusNodeId;

      switch (this.scenario) {
        case "heavy_rain":
          waterLevel = drift(waterLevel, 3.5, 0, 98);
          break;
        case "rising_water":
          waterLevel = isFocus ? Math.min(98, waterLevel + 2.2 * this.speed) : drift(waterLevel, 1, 0, 98);
          break;
        case "blockage":
          if (isFocus) {
            waterLevel = Math.min(98, waterLevel + 2.6 * this.speed);
            methaneLEL = Math.min(10, methaneLEL + 0.18 * this.speed);
            h2sPpm = Math.min(16, h2sPpm + 0.2 * this.speed);
          } else {
            waterLevel = drift(waterLevel, 0.8, 0, 98);
          }
          break;
        case "gas_alert":
          if (isFocus) {
            methaneLEL = Math.min(10, methaneLEL + 0.25 * this.speed);
            h2sPpm = Math.min(16, h2sPpm + 0.3 * this.speed);
          }
          break;
        case "tamper":
          if (isFocus) tilt = Math.min(18, tilt + 1.4 * this.speed);
          break;
        case "gateway_offline":
          // handled at gateway display level; nodes drift normally
          waterLevel = drift(waterLevel, 1, 0, 98);
          break;
        default:
          waterLevel = drift(waterLevel, 1, 0, 98);
          methaneLEL = drift(methaneLEL, 0.15, 0, 10);
          h2sPpm = drift(h2sPpm, 0.2, 0, 16);
      }

      battery = Math.max(0, battery - 0.005 * this.speed);
      rssi = Math.round(drift(rssi, 2, -98, -40));

      const score =
        (waterLevel > 85 ? 3 : waterLevel > 70 ? 2 : waterLevel > 50 ? 1 : 0) +
        (methaneLEL > 8 ? 3 : methaneLEL > 5 ? 2 : methaneLEL > 3 ? 1 : 0) +
        (h2sPpm > 10 ? 3 : h2sPpm > 6 ? 2 : h2sPpm > 3 ? 1 : 0);
      const risk = score >= 6 ? "critical" : score >= 4 ? "high" : score >= 2 ? "medium" : "low";
      status = risk === "critical" ? "critical" : risk === "high" || risk === "medium" ? "warning" : "online";

      return {
        ...n,
        waterLevel: Math.round(waterLevel * 10) / 10,
        methaneLEL: Math.round(methaneLEL * 10) / 10,
        h2sPpm: Math.round(h2sPpm * 10) / 10,
        battery: Math.round(battery * 10) / 10,
        rssi,
        tilt: Math.round(tilt * 10) / 10,
        risk,
        status,
        lastSeen: new Date().toISOString(),
      };
    });

    // occasionally regenerate alerts to reflect current thresholds
    if (Math.random() < 0.35) {
      this.alerts = buildAlerts(this.nodes).map((a) => {
        const existing = this.alerts.find(
          (e) => e.nodeId === a.nodeId && e.category === a.category
        );
        return existing && existing.status !== "active" ? { ...a, status: existing.status } : a;
      });
    }
  }
}

export const MockHardwareAdapter = new MockHardwareAdapterImpl();

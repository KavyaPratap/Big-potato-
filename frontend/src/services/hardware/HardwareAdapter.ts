import type {
  DrainNode,
  SensorReading,
  Alert,
  Gateway,
  NetworkTopology,
  MaintenanceTask,
  SystemEvent,
} from "@/types";

/**
 * HardwareAdapter is the single contract the UI talks to for all
 * node / gateway / alert / network data. Today it is backed by
 * MockHardwareAdapter, which synthesizes realistic demo telemetry.
 *
 * When the real backend exists (ESP32-C3 → ESP-NOW → Gateway → REST/WS
 * bridge), implement RealHardwareAdapter against this same interface and
 * swap it in one place (see services/hardware/index.ts). No component in
 * src/pages or src/components should ever import mock data directly.
 */
export interface HardwareAdapter {
  getNodes(): Promise<DrainNode[]>;
  getNode(nodeId: string): Promise<DrainNode | undefined>;
  getSensorHistory(nodeId: string, hours: number): Promise<SensorReading[]>;
  getAlerts(): Promise<Alert[]>;
  acknowledgeAlert(alertId: string): Promise<void>;
  resolveAlert(alertId: string): Promise<void>;
  getGateways(): Promise<Gateway[]>;
  getNetworkTopology(): Promise<NetworkTopology>;
  getMaintenanceTasks(): Promise<MaintenanceTask[]>;
  getSystemEvents(): Promise<SystemEvent[]>;
  /**
   * Subscribe to a simulated (or, in future, real WebSocket/MQTT-bridged)
   * live telemetry stream. Returns an unsubscribe function.
   */
  subscribeToLiveData(callback: (nodes: DrainNode[]) => void): () => void;
}

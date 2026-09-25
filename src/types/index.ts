// ─────────────────────────────────────────────────────────────────────────
// Core domain types. These mirror the JSON shape the future backend API
// (REST/WebSocket) is expected to return, so swapping MockHardwareAdapter
// for a real ApiHardwareAdapter requires no changes to components.
// ─────────────────────────────────────────────────────────────────────────

export type NodeStatus = "online" | "warning" | "critical" | "offline";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type AlertSeverity = "info" | "warning" | "critical" | "tamper";
export type AlertStatus = "active" | "acknowledged" | "resolved";
export type AlertCategory =
  | "gas"
  | "flood"
  | "tamper"
  | "network"
  | "battery"
  | "blockage";

export interface GeoPoint {
  lat: number;
  lng: number;
  label: string;
}

export interface DrainNode {
  id: string;
  sector: string;
  status: NodeStatus;
  location: GeoPoint;
  waterLevel: number; // %
  methaneLEL: number; // % LEL
  h2sPpm: number; // ppm
  temperature: number; // °C
  humidity: number; // %
  pressure: number; // hPa
  tilt: number; // degrees
  battery: number; // %
  rssi: number; // dBm
  hopCount: number;
  parentNodeId: string | null;
  gatewayId: string;
  packetLoss: number; // %
  lastSeen: string; // ISO timestamp
  risk: RiskLevel;
  tampered: boolean;
  installedAt: string;
  calibrationDueAt: string;
}

export interface SensorReading {
  nodeId: string;
  timestamp: string;
  waterLevel: number;
  methaneLEL: number;
  h2sPpm: number;
  temperature: number;
  humidity: number;
  pressure: number;
  tilt: number;
  battery: number;
  rssi: number;
}

export interface Alert {
  id: string;
  nodeId: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  sector: string;
  value?: number;
  unit?: string;
  threshold?: number;
  timestamp: string;
  status: AlertStatus;
}

export interface Prediction {
  nodeId: string;
  probability: number; // 0-1
  risk: RiskLevel;
  predictedWindow?: string;
  confidence: number; // 0-1
  factors: string[];
  generatedAt: string;
}

export interface Gateway {
  id: string;
  label: string;
  status: "online" | "offline" | "degraded";
  location: GeoPoint;
  connectedNodes: number;
  meshHealth: number; // %
  backhaul: "connected" | "degraded" | "disconnected";
  backhaulType: string;
  uptime: string;
  packetsReceived: number;
  packetsForwarded: number;
  packetLoss: number;
  cpuLoad: number;
  memoryLoad: number;
  lastSync: string;
}

export interface MaintenanceTask {
  id: string;
  nodeId: string;
  type:
    | "calibration"
    | "battery"
    | "signal"
    | "repeated_alert"
    | "physical_inspection";
  title: string;
  detail: string;
  dueLabel: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
}

export interface NetworkEdge {
  from: string; // gateway or node id
  to: string; // node id
  rssi: number;
  hop: number;
  packetStatus: "good" | "degraded" | "lost";
}

export interface NetworkTopology {
  gateways: Gateway[];
  nodes: DrainNode[];
  edges: NetworkEdge[];
}

export interface SystemEvent {
  id: string;
  nodeId?: string;
  timestamp: string;
  message: string;
  kind: "info" | "warning" | "critical";
}

export type SimulationScenario =
  | "normal"
  | "heavy_rain"
  | "rising_water"
  | "blockage"
  | "gas_alert"
  | "tamper"
  | "gateway_offline";

export interface ThresholdConfig {
  waterWarning: number;
  waterCritical: number;
  ch4Warning: number;
  ch4Critical: number;
  h2sWarning: number;
  h2sCritical: number;
  simulationSpeed: number; // 1x, 2x, 4x
}

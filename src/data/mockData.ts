import type {
  DrainNode,
  Gateway,
  Alert,
  Prediction,
  MaintenanceTask,
  NetworkEdge,
  SystemEvent,
  RiskLevel,
  NodeStatus,
  SensorReading,
} from "@/types";

// Simple seeded PRNG so demo data is stable across reloads within a session
// but still varied node-to-node.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const between = (min: number, max: number) => min + rand() * (max - min);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

export const SECTORS = [
  "Sector A — Civil Lines",
  "Sector B — Old Market",
  "Sector C — Riverside",
  "Sector D — Industrial Belt",
  "Sector E — Residential North",
  "Sector F — Residential South",
  "Sector G — Transit Hub",
  "Sector H — Green Park",
];

const CITY_CENTER = { lat: 28.4595, lng: 77.0266 }; // Gurugram-ish reference, fictional city

export const GATEWAYS: Gateway[] = [
  {
    id: "GW-01",
    label: "Gateway 01 — Civil Lines",
    status: "online",
    location: { lat: CITY_CENTER.lat + 0.01, lng: CITY_CENTER.lng + 0.01, label: "Civil Lines Substation" },
    connectedNodes: 34,
    meshHealth: 98.4,
    backhaul: "connected",
    backhaulType: "4G LTE",
    uptime: "12d 08h",
    packetsReceived: 184320,
    packetsForwarded: 181004,
    packetLoss: 1.8,
    cpuLoad: 34,
    memoryLoad: 48,
    lastSync: new Date(Date.now() - 5000).toISOString(),
  },
  {
    id: "GW-02",
    label: "Gateway 02 — Riverside",
    status: "online",
    location: { lat: CITY_CENTER.lat - 0.015, lng: CITY_CENTER.lng + 0.02, label: "Riverside Pump House" },
    connectedNodes: 41,
    meshHealth: 96.1,
    backhaul: "connected",
    backhaulType: "4G LTE",
    uptime: "9d 14h",
    packetsReceived: 201044,
    packetsForwarded: 196880,
    packetLoss: 2.1,
    cpuLoad: 41,
    memoryLoad: 52,
    lastSync: new Date(Date.now() - 8000).toISOString(),
  },
  {
    id: "GW-03",
    label: "Gateway 03 — Industrial Belt",
    status: "degraded",
    location: { lat: CITY_CENTER.lat + 0.02, lng: CITY_CENTER.lng - 0.015, label: "Industrial Belt Junction" },
    connectedNodes: 29,
    meshHealth: 88.7,
    backhaul: "degraded",
    backhaulType: "4G LTE (weak)",
    uptime: "2d 03h",
    packetsReceived: 92110,
    packetsForwarded: 87344,
    packetLoss: 5.2,
    cpuLoad: 58,
    memoryLoad: 66,
    lastSync: new Date(Date.now() - 34000).toISOString(),
  },
];

const NODE_COUNT = 200;
function riskFromReadings(waterLevel: number, ch4: number, h2s: number): RiskLevel {
  const score =
    (waterLevel > 85 ? 3 : waterLevel > 70 ? 2 : waterLevel > 50 ? 1 : 0) +
    (ch4 > 8 ? 3 : ch4 > 5 ? 2 : ch4 > 3 ? 1 : 0) +
    (h2s > 10 ? 3 : h2s > 6 ? 2 : h2s > 3 ? 1 : 0);
  if (score >= 6) return "critical";
  if (score >= 4) return "high";
  if (score >= 2) return "medium";
  return "low";
}

function statusFromRisk(risk: RiskLevel, offline: boolean): NodeStatus {
  if (offline) return "offline";
  if (risk === "critical") return "critical";
  if (risk === "high" || risk === "medium") return "warning";
  return "online";
}

function generateNodes(): DrainNode[] {
  const nodes: DrainNode[] = [];
  for (let i = 1; i <= NODE_COUNT; i++) {
    const id = `MNH-${String(i).padStart(3, "0")}`;
    const sectorIdx = Math.floor(((i - 1) / NODE_COUNT) * SECTORS.length);
    const sector = SECTORS[Math.min(sectorIdx, SECTORS.length - 1)];
    const gateway = GATEWAYS[i % GATEWAYS.length];

    // create deliberate variation: ~6.5% offline, ~4% low battery, ~5% weak signal
    const roll = rand();
    const offline = roll < 0.065;
    const lowBattery = !offline && rand() < 0.05;
    const weakSignal = !offline && rand() < 0.05;
    const tampered = !offline && rand() < 0.015;
    const gasSpike = !offline && rand() < 0.06;
    const waterSpike = !offline && rand() < 0.08;

    const waterLevel = waterSpike ? between(68, 92) : between(8, 55);
    const methaneLEL = gasSpike ? between(6, 9.5) : between(0.1, 3.4);
    const h2sPpm = gasSpike ? between(8, 14) : between(0.2, 4.5);
    const risk = riskFromReadings(waterLevel, methaneLEL, h2sPpm);
    const status = statusFromRisk(risk, offline);

    const angle = (i / NODE_COUNT) * Math.PI * 2 * 3;
    const radius = 0.006 + (i % 40) * 0.0009;

    nodes.push({
      id,
      sector,
      status: tampered ? "warning" : status,
      location: {
        lat: CITY_CENTER.lat + Math.sin(angle) * radius + between(-0.003, 0.003),
        lng: CITY_CENTER.lng + Math.cos(angle) * radius + between(-0.003, 0.003),
        label: `${sector.split("—")[1]?.trim() ?? sector} / Manhole ${i}`,
      },
      waterLevel: Math.round(waterLevel * 10) / 10,
      methaneLEL: Math.round(methaneLEL * 10) / 10,
      h2sPpm: Math.round(h2sPpm * 10) / 10,
      temperature: Math.round(between(21, 31) * 10) / 10,
      humidity: Math.round(between(55, 96)),
      pressure: Math.round(between(1000, 1015)),
      tilt: Math.round(between(0, tampered ? 14 : 3) * 10) / 10,
      battery: lowBattery ? Math.round(between(9, 22)) : Math.round(between(55, 100)),
      rssi: weakSignal ? Math.round(between(-95, -82)) : Math.round(between(-70, -45)),
      hopCount: 1 + (i % 4),
      parentNodeId: i === 1 ? null : `MNH-${String(Math.max(1, i - 1 - (i % 3))).padStart(3, "0")}`,
      gatewayId: gateway.id,
      packetLoss: Math.round(between(0.2, weakSignal ? 9 : 3.5) * 10) / 10,
      lastSeen: offline
        ? new Date(Date.now() - between(6, 90) * 60000).toISOString()
        : new Date(Date.now() - between(2, 40) * 1000).toISOString(),
      risk: tampered ? "medium" : risk,
      tampered,
      installedAt: new Date(Date.now() - between(30, 400) * 86400000).toISOString(),
      calibrationDueAt: new Date(Date.now() + between(-5, 60) * 86400000).toISOString(),
    });
  }
  return nodes;
}

export const NODES: DrainNode[] = generateNodes();

export function buildAlerts(nodes: DrainNode[]): Alert[] {
  const alerts: Alert[] = [];
  let n = 1;
  const addAlert = (partial: Omit<Alert, "id">) => {
    alerts.push({ id: `ALT-${String(n).padStart(4, "0")}`, ...partial });
    n++;
  };

  for (const node of nodes) {
    if (node.status === "offline") {
      addAlert({
        nodeId: node.id,
        category: "network",
        severity: "warning",
        title: "Node offline",
        message: `${node.id} has not reported telemetry recently.`,
        sector: node.sector,
        timestamp: node.lastSeen,
        status: "active",
      });
      continue;
    }
    if (node.tampered) {
      addAlert({
        nodeId: node.id,
        category: "tamper",
        severity: "tamper",
        title: "Unexpected node movement",
        message: `Tilt sensor on ${node.id} recorded an abnormal orientation change.`,
        sector: node.sector,
        value: node.tilt,
        unit: "°",
        threshold: 8,
        timestamp: node.lastSeen,
        status: "active",
      });
    }
    if (node.methaneLEL > 5) {
      addAlert({
        nodeId: node.id,
        category: "gas",
        severity: node.methaneLEL > 7.5 ? "critical" : "warning",
        title: "High methane concentration detected",
        message: `CH4 concentration exceeded the configured demo threshold at ${node.id}.`,
        sector: node.sector,
        value: node.methaneLEL,
        unit: "% LEL",
        threshold: 10,
        timestamp: node.lastSeen,
        status: rand() < 0.3 ? "acknowledged" : "active",
      });
    }
    if (node.h2sPpm > 6) {
      addAlert({
        nodeId: node.id,
        category: "gas",
        severity: node.h2sPpm > 10 ? "critical" : "warning",
        title: "Elevated H2S levels",
        message: `Hydrogen sulfide reading above the demo warning band at ${node.id}.`,
        sector: node.sector,
        value: node.h2sPpm,
        unit: "ppm",
        threshold: 15,
        timestamp: node.lastSeen,
        status: "active",
      });
    }
    if (node.waterLevel > 65) {
      addAlert({
        nodeId: node.id,
        category: "flood",
        severity: node.waterLevel > 82 ? "critical" : "warning",
        title: "Water level rising rapidly",
        message: `${node.id} water level trending upward beyond the demo threshold.`,
        sector: node.sector,
        value: node.waterLevel,
        unit: "%",
        threshold: 85,
        timestamp: node.lastSeen,
        status: "active",
      });
    }
    if (node.battery < 25) {
      addAlert({
        nodeId: node.id,
        category: "battery",
        severity: "warning",
        title: "Low battery",
        message: `${node.id} battery is below the demo replacement threshold.`,
        sector: node.sector,
        value: node.battery,
        unit: "%",
        threshold: 20,
        timestamp: node.lastSeen,
        status: rand() < 0.4 ? "resolved" : "active",
      });
    }
  }
  return alerts.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
}

export const ALERTS: Alert[] = buildAlerts(NODES);

export function buildPredictions(nodes: DrainNode[]): Prediction[] {
  const candidates = nodes
    .filter((n) => n.status !== "offline")
    .map((n) => {
      const rateFactor = n.waterLevel > 60 ? between(4, 24) : between(-2, 6);
      const probability = Math.min(
        0.98,
        Math.max(
          0.02,
          (n.waterLevel / 100) * 0.45 +
            (n.methaneLEL / 10) * 0.25 +
            (n.h2sPpm / 15) * 0.15 +
            Math.max(0, rateFactor) / 100
        )
      );
      const risk: RiskLevel =
        probability > 0.85 ? "critical" : probability > 0.6 ? "high" : probability > 0.35 ? "medium" : "low";
      const factors: string[] = [];
      if (rateFactor > 15) factors.push(`Water level rising rapidly (+${rateFactor.toFixed(0)}% in 30 min)`);
      if (n.waterLevel > 70) factors.push("Sustained high water level relative to sector baseline");
      if (n.methaneLEL > 5) factors.push("Elevated methane pattern consistent with organic buildup");
      if (n.h2sPpm > 7) factors.push("Hydrogen sulfide trend matches historical blockage precursor");
      factors.push(rand() < 0.5 ? "Monsoon mode active — regional rainfall elevated" : "Historical pattern match with prior sector events");
      if (factors.length < 2) factors.push("No strong precursor signals — baseline monitoring only");

      return {
        nodeId: n.id,
        probability: Math.round(probability * 100) / 100,
        risk,
        predictedWindow: probability > 0.6 ? pick(["2–4 hours", "4–8 hours", "6–12 hours"]) : undefined,
        confidence: Math.round((0.55 + probability * 0.4) * 100) / 100,
        factors: factors.slice(0, 4),
        generatedAt: new Date(Date.now() - between(1, 20) * 60000).toISOString(),
      } satisfies Prediction;
    });

  return candidates.sort((a, b) => b.probability - a.probability);
}

export const PREDICTIONS: Prediction[] = buildPredictions(NODES);

export function buildMaintenanceTasks(nodes: DrainNode[]): MaintenanceTask[] {
  const tasks: MaintenanceTask[] = [];
  let n = 1;
  for (const node of nodes) {
    const daysToCalibration = Math.round((+new Date(node.calibrationDueAt) - Date.now()) / 86400000);
    if (daysToCalibration < 20) {
      tasks.push({
        id: `MNT-${String(n++).padStart(4, "0")}`,
        nodeId: node.id,
        type: "calibration",
        title: "H2S / CH4 sensor calibration",
        detail: `${node.id} gas sensors are approaching their scheduled calibration window.`,
        dueLabel: daysToCalibration < 0 ? "Overdue" : `Due in ${daysToCalibration} days`,
        priority: daysToCalibration < 0 ? "high" : daysToCalibration < 7 ? "medium" : "low",
        createdAt: node.calibrationDueAt,
      });
    }
    if (node.battery < 25) {
      tasks.push({
        id: `MNT-${String(n++).padStart(4, "0")}`,
        nodeId: node.id,
        type: "battery",
        title: "Battery replacement",
        detail: `Battery at ${node.battery}% — schedule field replacement.`,
        dueLabel: node.battery < 15 ? "Urgent" : "This week",
        priority: node.battery < 15 ? "high" : "medium",
        createdAt: node.lastSeen,
      });
    }
    if (node.rssi < -85) {
      tasks.push({
        id: `MNT-${String(n++).padStart(4, "0")}`,
        nodeId: node.id,
        type: "signal",
        title: "Weak network link",
        detail: `RSSI at ${node.rssi} dBm — consider mesh repeater or gateway relocation.`,
        dueLabel: "Investigate",
        priority: "medium",
        createdAt: node.lastSeen,
      });
    }
    if (node.tampered) {
      tasks.push({
        id: `MNT-${String(n++).padStart(4, "0")}`,
        nodeId: node.id,
        type: "physical_inspection",
        title: "Physical inspection required",
        detail: `Tamper event logged at ${node.id} — dispatch field team.`,
        dueLabel: "Priority",
        priority: "high",
        createdAt: node.lastSeen,
      });
    }
  }
  return tasks;
}

export const MAINTENANCE_TASKS: MaintenanceTask[] = buildMaintenanceTasks(NODES);

export function buildNetworkEdges(nodes: DrainNode[]): NetworkEdge[] {
  return nodes.map((n) => ({
    from: n.parentNodeId ?? n.gatewayId,
    to: n.id,
    rssi: n.rssi,
    hop: n.hopCount,
    packetStatus: n.status === "offline" ? "lost" : n.packetLoss > 5 ? "degraded" : "good",
  }));
}

export const NETWORK_EDGES: NetworkEdge[] = buildNetworkEdges(NODES);

export function buildSystemEvents(nodes: DrainNode[]): SystemEvent[] {
  const events: SystemEvent[] = [];
  let n = 1;
  const sample = [...nodes].sort(() => rand() - 0.5).slice(0, 24);
  for (const node of sample) {
    events.push({
      id: `EVT-${String(n++).padStart(4, "0")}`,
      nodeId: node.id,
      timestamp: new Date(Date.now() - between(1, 500) * 60000).toISOString(),
      message: pick([
        `${node.id} telemetry sync completed`,
        `${node.id} rejoined mesh via ${node.gatewayId}`,
        `${node.id} reported sensor self-test OK`,
        `${node.id} battery reading updated`,
        `${node.id} firmware heartbeat received`,
      ]),
      kind: pick(["info", "info", "info", "warning"]),
    });
  }
  return events.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
}

export const SYSTEM_EVENTS: SystemEvent[] = buildSystemEvents(NODES);

// ── Historical series for charts ───────────────────────────────────────────
export function buildHistory(node: DrainNode, hours: number, pointsPerHour = 4) {
  const points = hours * pointsPerHour;
  const out: SensorReading[] = [];
  let water = Math.max(5, node.waterLevel - between(5, 20));
  let ch4 = Math.max(0.1, node.methaneLEL - between(0.5, 2));
  let h2s = Math.max(0.1, node.h2sPpm - between(0.5, 2));
  let temp = node.temperature - between(1, 3);
  let battery = Math.min(100, node.battery + between(1, 4));

  for (let i = points; i >= 0; i--) {
    water += between(-2.2, 2.6);
    water = Math.min(96, Math.max(3, water));
    ch4 += between(-0.3, 0.3);
    ch4 = Math.min(10, Math.max(0.05, ch4));
    h2s += between(-0.4, 0.4);
    h2s = Math.min(16, Math.max(0.05, h2s));
    temp += between(-0.2, 0.2);
    battery -= between(0, 0.02);

    out.push({
      nodeId: node.id,
      timestamp: new Date(Date.now() - i * (60 / pointsPerHour) * 60000).toISOString(),
      waterLevel: Math.round(water * 10) / 10,
      methaneLEL: Math.round(ch4 * 10) / 10,
      h2sPpm: Math.round(h2s * 10) / 10,
      temperature: Math.round(temp * 10) / 10,
      humidity: Math.round(between(55, 95)),
      pressure: Math.round(between(1000, 1015)),
      tilt: node.tilt,
      battery: Math.round(battery * 10) / 10,
      rssi: node.rssi + Math.round(between(-4, 4)),
    });
  }
  // last point should match current node reading
  out[out.length - 1] = {
    ...out[out.length - 1],
    waterLevel: node.waterLevel,
    methaneLEL: node.methaneLEL,
    h2sPpm: node.h2sPpm,
    temperature: node.temperature,
    battery: node.battery,
    rssi: node.rssi,
  };
  return out;
}

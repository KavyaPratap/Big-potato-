import { useCallback, useState } from "react";
import { MockHardwareAdapter } from "@/services/hardware/MockHardwareAdapter";
import type { SimulationScenario } from "@/types";

export const SCENARIO_LABELS: Record<SimulationScenario, string> = {
  normal: "Normal",
  heavy_rain: "Heavy Rain",
  rising_water: "Rising Water",
  blockage: "Blockage",
  gas_alert: "Gas Alert",
  tamper: "Tamper",
  gateway_offline: "Gateway Offline",
};

export function useSimulation() {
  const [scenario, setScenarioState] = useState<SimulationScenario>("normal");
  const [speed, setSpeedState] = useState(1);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  const setScenario = useCallback((s: SimulationScenario, nodeId?: string) => {
    setScenarioState(s);
    MockHardwareAdapter.setScenario(s, nodeId);
    if (nodeId) setFocusNodeId(nodeId);
  }, []);

  const setSpeed = useCallback((v: number) => {
    setSpeedState(v);
    MockHardwareAdapter.setSpeed(v);
  }, []);

  const reset = useCallback(() => {
    setScenarioState("normal");
    setFocusNodeId(null);
    MockHardwareAdapter.reset();
  }, []);

  return { scenario, setScenario, speed, setSpeed, focusNodeId, reset };
}

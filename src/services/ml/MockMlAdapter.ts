import type { MlAdapter } from "./MlAdapter";
import type { Prediction, SensorReading, RiskLevel } from "@/types";
import { PREDICTIONS } from "@/data/mockData";

const wait = (ms = 150) => new Promise((r) => setTimeout(r, ms));

class MockMlAdapterImpl implements MlAdapter {
  async getPredictions(): Promise<Prediction[]> {
    await wait();
    return [...PREDICTIONS];
  }

  async predictBlockage(nodeId: string, readings: SensorReading[]): Promise<Prediction> {
    await wait(220);
    const latest = readings[readings.length - 1];
    if (!latest) {
      return {
        nodeId,
        probability: 0.05,
        risk: "low",
        confidence: 0.4,
        factors: ["Insufficient telemetry history for this node"],
        generatedAt: new Date().toISOString(),
      };
    }
    const probability = Math.min(
      0.98,
      Math.max(
        0.02,
        (latest.waterLevel / 100) * 0.45 +
          (latest.methaneLEL / 10) * 0.25 +
          (latest.h2sPpm / 15) * 0.15
      )
    );
    const risk: RiskLevel =
      probability > 0.85 ? "critical" : probability > 0.6 ? "high" : probability > 0.35 ? "medium" : "low";
    return {
      nodeId,
      probability: Math.round(probability * 100) / 100,
      risk,
      predictedWindow: probability > 0.6 ? "2–4 hours" : undefined,
      confidence: Math.round((0.55 + probability * 0.4) * 100) / 100,
      factors: [
        latest.waterLevel > 65 ? "Water level trending above sector baseline" : "Water level within normal range",
        latest.methaneLEL > 5 ? "Methane pattern consistent with organic buildup" : "Methane within normal range",
        "SIMULATED ML OUTPUT — not a certified prediction",
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}

export const MockMlAdapter = new MockMlAdapterImpl();

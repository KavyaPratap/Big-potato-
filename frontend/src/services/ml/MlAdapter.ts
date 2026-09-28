import type { Prediction, SensorReading } from "@/types";

/**
 * MlAdapter is the single contract for blockage-prediction data.
 * ML logic never lives inside React components — pages call this
 * interface via usePredictions(), never a model directly.
 *
 * Future backend contract:
 *   POST /api/ml/predict           body: { nodeId, ...latest readings }
 *   GET  /api/ml/predictions/:nodeId
 */
export interface MlAdapter {
  getPredictions(): Promise<Prediction[]>;
  predictBlockage(nodeId: string, readings: SensorReading[]): Promise<Prediction>;
}

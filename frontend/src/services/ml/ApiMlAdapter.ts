import { ApiClient } from "@/services/api/ApiClient";
import type { MlAdapter } from "./MlAdapter";
import type { Prediction, SensorReading } from "@/types";

export class ApiMlAdapter implements MlAdapter {
  private readonly api = new ApiClient();

  getPredictions() {
    return this.api.get<Prediction[]>("/ml/predictions");
  }

  predictBlockage(nodeId: string, readings: SensorReading[]) {
    return this.api.post<Prediction>("/ml/predict", { nodeId, readings });
  }
}
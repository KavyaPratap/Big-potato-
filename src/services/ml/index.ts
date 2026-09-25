import { MockMlAdapter } from "./MockMlAdapter";
import { ApiMlAdapter } from "./ApiMlAdapter";
export type { MlAdapter } from "./MlAdapter";

/**
 * FUTURE: ApiMlAdapter would POST to /api/ml/predict (or GET
 * /api/ml/predictions/:nodeId) against a real Python model service.
 * Swap the export below once that exists — no page or component change
 * required.
 */
export const mlAdapter = import.meta.env.VITE_USE_MOCK_DATA === "true" ? MockMlAdapter : new ApiMlAdapter();

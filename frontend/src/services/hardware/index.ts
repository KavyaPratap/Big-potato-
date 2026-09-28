import { MockHardwareAdapter } from "./MockHardwareAdapter";
import { RealHardwareAdapter } from "./RealHardwareAdapter";
export type { HardwareAdapter } from "./HardwareAdapter";

export const isMockHardware = import.meta.env.VITE_USE_MOCK_DATA === "true";
export const hardwareAdapter = isMockHardware ? MockHardwareAdapter : new RealHardwareAdapter();

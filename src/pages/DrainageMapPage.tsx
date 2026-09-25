import { AppShell } from "@/components/layout/AppShell";
import { NodeMap } from "@/components/map/NodeMap";
import { useNodes, useGateways } from "@/hooks/useDrainageData";
import { SimulatedBadge } from "@/components/ui/Misc";

export default function DrainageMapPage() {
  const { nodes } = useNodes();
  const gateways = useGateways();

  return (
    <AppShell title="Drainage Map" subtitle="Fictional city / sector reference for hackathon demonstration">
      <div className="flex h-[calc(100vh-8rem)] flex-col gap-3">
        <div>
          <SimulatedBadge />
        </div>
        <div className="min-h-0 flex-1">
          <NodeMap nodes={nodes} gateways={gateways} />
        </div>
      </div>
    </AppShell>
  );
}

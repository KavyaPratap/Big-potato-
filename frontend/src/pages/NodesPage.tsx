import { AppShell } from "@/components/layout/AppShell";
import { NodeTable } from "@/components/nodes/NodeTable";
import { useNodes } from "@/hooks/useDrainageData";
import { ErrorState, LoadingState } from "@/components/ui/Misc";

export default function NodesPage() {
  const { nodes, loading, error } = useNodes();

  return (
    <AppShell title="Nodes" subtitle="All monitored sensor nodes">
      {loading ? <LoadingState rows={8} /> : error ? <ErrorState title="Telemetry unavailable" detail={error} /> : <NodeTable nodes={nodes} />}
    </AppShell>
  );
}

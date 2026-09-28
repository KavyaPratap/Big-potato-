import type { NodeStatus, AlertSeverity, RiskLevel } from "@/types";

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s} sec ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function formatClock(date: Date = new Date()): string {
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

export const STATUS_COLORS: Record<NodeStatus, { text: string; bg: string; ring: string; dot: string }> = {
  online: { text: "text-[var(--color-ok)]", bg: "bg-[var(--color-ok-dim)]", ring: "ring-[var(--color-ok)]/30", dot: "bg-[var(--color-ok)]" },
  warning: { text: "text-[var(--color-warn)]", bg: "bg-[var(--color-warn-dim)]", ring: "ring-[var(--color-warn)]/30", dot: "bg-[var(--color-warn)]" },
  critical: { text: "text-[var(--color-crit)]", bg: "bg-[var(--color-crit-dim)]", ring: "ring-[var(--color-crit)]/30", dot: "bg-[var(--color-crit)]" },
  offline: { text: "text-[var(--color-offline)]", bg: "bg-[var(--color-offline-dim)]", ring: "ring-[var(--color-offline)]/30", dot: "bg-[var(--color-offline)]" },
};

export const RISK_COLORS: Record<RiskLevel, { text: string; bg: string }> = {
  low: { text: "text-[var(--color-ok)]", bg: "bg-[var(--color-ok-dim)]" },
  medium: { text: "text-[var(--color-warn)]", bg: "bg-[var(--color-warn-dim)]" },
  high: { text: "text-[#ff8a5a]", bg: "bg-[#3a2417]" },
  critical: { text: "text-[var(--color-crit)]", bg: "bg-[var(--color-crit-dim)]" },
};

export const SEVERITY_COLORS: Record<AlertSeverity, { text: string; bg: string; border: string }> = {
  info: { text: "text-[var(--color-blue)]", bg: "bg-[#0f2033]", border: "border-[var(--color-blue)]/30" },
  warning: { text: "text-[var(--color-warn)]", bg: "bg-[var(--color-warn-dim)]", border: "border-[var(--color-warn)]/30" },
  critical: { text: "text-[var(--color-crit)]", bg: "bg-[var(--color-crit-dim)]", border: "border-[var(--color-crit)]/40" },
  tamper: { text: "text-[#c78bff]", bg: "bg-[#241633]", border: "border-[#c78bff]/30" },
};

export function statusLabel(status: NodeStatus): string {
  return { online: "Healthy", warning: "Warning", critical: "Critical", offline: "Offline" }[status];
}

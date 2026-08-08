// Centralized risk thresholds used across all components
export const RISK_THRESHOLDS = {
  escalate: 80,
  verify: 60,
  monitor: 35,
} as const;

export const RISK_COLORS = {
  hex: { escalate: "#a53735", verify: "#b6532b", monitor: "#9b641b", normal: "#355b69", unassessed: "#64748b" },
  text: { escalate: "text-red-400", verify: "text-orange-400", monitor: "text-yellow-400", normal: "text-slate-300", unassessed: "text-slate-400" },
  bg: { escalate: "bg-red-500/10", verify: "bg-orange-500/10", monitor: "bg-yellow-500/10", normal: "bg-slate-500/10", unassessed: "bg-slate-500/10" },
  glow: { escalate: "shadow-red-500/20", verify: "shadow-orange-500/20", monitor: "", normal: "", unassessed: "" },
} as const;

export function riskLevel(score: number | null): "escalate" | "verify" | "monitor" | "normal" | "unassessed" {
  if (score == null) return "unassessed";
  if (score < RISK_THRESHOLDS.monitor) return "normal";
  if (score < RISK_THRESHOLDS.verify) return "monitor";
  if (score < RISK_THRESHOLDS.escalate) return "verify";
  return "escalate";
}

export function riskLabel(score: number | null): string {
  return { escalate: "High", verify: "Elevated", monitor: "Moderate", normal: "Low", unassessed: "Not assessed" }[riskLevel(score)];
}

export function riskHex(score: number | null): string {
  return RISK_COLORS.hex[riskLevel(score)];
}

export function riskTextClass(score: number | null): string {
  return RISK_COLORS.text[riskLevel(score)];
}

export function riskBgClass(score: number | null): string {
  return RISK_COLORS.bg[riskLevel(score)];
}

export function riskGlowClass(score: number | null): string {
  return RISK_COLORS.glow[riskLevel(score)];
}

export function formatAssessmentTime(timestamp: string | null | undefined): string | null {
  if (!timestamp) return null;
  const date = new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(timestamp) ? timestamp : `${timestamp}Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  });
}

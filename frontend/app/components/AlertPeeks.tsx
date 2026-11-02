"use client";

import { useState, useSyncExternalStore } from "react";
import type { Alert } from "@/app/lib/api";
import { riskTextClass } from "@/app/lib/risk";

type AlertPeeksProps = {
  alerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
  selectedAlertId: string | null;
  panelOpen: boolean;
};

const SIGNAL_LABELS: Record<string, string> = {
  ais_gap: "AIS reporting gap",
  kinematic_implausibility: "Position inconsistency",
  geofence_breach: "Restricted area entry",
  type_mismatch: "Vessel identity mismatch",
  route_deviation: "Route deviation",
  loitering: "Loitering",
  zone_lingering: "Extended time in zone",
  speed_anomaly: "Unusual speed",
  heading_anomaly: "Unusual course",
  statistical_outlier: "Unusual regional activity",
  collision_risk: "Collision risk",
  dark_ship_optical: "Optical detection without AIS",
};

function leadingReason(alert: Alert): string {
  const signal = alert.anomaly_signals.reduce<Alert["anomaly_signals"][number] | undefined>(
    (leading, current) => !leading || current.severity > leading.severity ? current : leading,
    undefined,
  );
  if (!signal) return "Review vessel activity";
  return SIGNAL_LABELS[signal.anomaly_type] ?? signal.anomaly_type.replace(/_/g, " ");
}

function subscribeToViewport(onChange: () => void) {
  const query = window.matchMedia("(min-width: 640px)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export default function AlertPeeks({ alerts, onSelectAlert, selectedAlertId, panelOpen }: AlertPeeksProps) {
  const desktop = useSyncExternalStore(subscribeToViewport, () => window.matchMedia("(min-width: 640px)").matches, () => true);
  const [userExpanded, setExpanded] = useState<boolean | null>(null);
  const expanded = userExpanded ?? desktop;
  const active = alerts.filter((alert) => alert.status === "active").sort((a, b) => b.risk_score - a.risk_score);

  return (
    <section aria-label="Alert queue" className={`absolute bottom-[var(--map-alert-bottom)] left-3 z-20 overflow-hidden rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-surface)] shadow-sm ${expanded ? "w-[320px] max-w-[calc(100vw-24px)]" : "w-[200px] max-w-[calc(100vw-120px)] sm:w-[320px] sm:max-w-none"} ${panelOpen ? "hidden lg:block" : ""}`}>
      <button type="button" aria-label={`Alerts: ${active.length} to review`} aria-expanded={expanded} aria-controls="alert-queue" onClick={() => setExpanded(!expanded)} className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left text-sm font-medium text-slate-200 hover:bg-white/[0.03]">
        <span className="flex items-center gap-2.5">Alerts <span className="font-normal tabular-nums text-slate-400">{active.length}</span></span>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={expanded ? "rotate-180" : ""}><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {expanded && (
        <div id="alert-queue" className="max-h-[min(280px,30dvh)] overflow-y-auto border-t border-[var(--workspace-border)]">
          {active.length === 0 && <p className="px-4 py-4 text-xs text-slate-400">No alerts to review</p>}
          {active.map((alert) => (
            <button key={alert.id} type="button" aria-label={`Review ${alert.vessel_name || "unknown vessel"}`} aria-pressed={selectedAlertId === alert.id} onClick={() => onSelectAlert(alert)} className={`block min-h-20 w-full border-b border-[var(--workspace-border)] px-4 py-3 text-left last:border-0 hover:bg-white/[0.04] ${selectedAlertId === alert.id ? "bg-white/[0.06]" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-slate-100">{alert.vessel_name || "Unknown vessel"}</span>
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-slate-400"><path d="m9 6 6 6-6 6" /></svg>
              </div>
              <div className="mt-1 truncate text-xs leading-5 text-slate-300" title={leadingReason(alert)}>{leadingReason(alert)}</div>
              <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 capitalize"><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full bg-current ${riskTextClass(alert.risk_score)}`} />{alert.recommended_action}</span>
                <span className="tabular-nums">Risk <span className="text-slate-300">{Math.round(alert.risk_score)}</span>/100</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

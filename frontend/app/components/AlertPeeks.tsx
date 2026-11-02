"use client";

import { useState, useSyncExternalStore } from "react";
import type { Alert } from "@/app/lib/api";

type AlertPeeksProps = {
  alerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
  selectedAlertId: string | null;
  panelOpen: boolean;
  loading: boolean;
  connectionOk: boolean;
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
  const query = window.matchMedia("(min-width: 1024px)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export default function AlertPeeks({ alerts, onSelectAlert, selectedAlertId, panelOpen, loading, connectionOk }: AlertPeeksProps) {
  const desktop = useSyncExternalStore(subscribeToViewport, () => window.matchMedia("(min-width: 1024px)").matches, () => false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const expanded = desktop || mobileExpanded;
  const active = alerts.filter((alert) => alert.status === "active").sort((a, b) => b.risk_score - a.risk_score);
  const countLabel = active.length === 0 && (loading || !connectionOk) ? "—" : active.length;

  return (
    <section aria-label="Alert queue" className={`absolute inset-x-0 bottom-[var(--map-alert-bottom)] z-20 max-h-[40dvh] flex-col overflow-hidden border-t border-[var(--workspace-border,#d2d7d6)] bg-[var(--workspace-surface,#fafaf7)] text-[var(--workspace-text,#203039)] lg:inset-x-auto lg:bottom-8 lg:left-0 lg:top-[245px] lg:w-[300px] lg:max-h-none lg:border-r ${panelOpen ? "hidden lg:flex" : "flex"}`}>
      <div className="hidden min-h-12 shrink-0 items-center justify-between gap-3 px-5 lg:flex">
        <h2 className="text-sm font-medium">Alerts</h2>
        <span className="text-xs tabular-nums text-[var(--workspace-muted,#596970)]">{countLabel}</span>
      </div>
      <button type="button" aria-label={loading ? "Loading alerts" : !connectionOk ? "Alerts unavailable" : `Alerts: ${active.length} to review`} aria-expanded={expanded} aria-controls="alert-queue" onClick={() => setMobileExpanded(!mobileExpanded)} className="flex min-h-12 w-full shrink-0 items-center justify-between gap-3 px-4 text-left text-sm font-medium hover:bg-[var(--workspace-hover,#eef0ec)] lg:hidden">
        <span className="flex items-center gap-2.5">Alerts <span className="font-normal tabular-nums text-[var(--workspace-muted,#596970)]">{countLabel}</span></span>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={expanded ? "" : "rotate-180"}><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {expanded && (
        <div id="alert-queue" className="min-h-0 overflow-y-auto border-t border-[var(--workspace-border,#d2d7d6)] lg:flex-1">
          {active.length === 0 && <p className="px-4 py-4 text-sm text-[var(--workspace-muted,#596970)] lg:px-5">{loading ? "Loading alerts…" : !connectionOk ? "Alerts are unavailable while disconnected." : "No alerts in this area."}</p>}
          {active.map((alert) => (
            <button key={alert.id} type="button" aria-label={`Review ${alert.vessel_name || "unknown vessel"}`} aria-pressed={selectedAlertId === alert.id} onClick={() => onSelectAlert(alert)} className={`block min-h-16 w-full border-b border-[var(--workspace-border,#d2d7d6)] px-4 py-3 text-left last:border-0 hover:bg-[var(--workspace-hover,#eef0ec)] lg:px-5 ${selectedAlertId === alert.id ? "bg-[var(--workspace-hover,#eef0ec)]" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium">{alert.vessel_name || "Unknown vessel"}</span>
                <span className="shrink-0 text-xs tabular-nums text-[var(--workspace-muted,#596970)]">Risk {Math.round(alert.risk_score)}/100</span>
              </div>
              <div className="mt-1 truncate text-xs leading-5 text-[var(--workspace-muted,#596970)]" title={leadingReason(alert)}>{leadingReason(alert)}</div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

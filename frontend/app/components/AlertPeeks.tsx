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
  if (!signal) return "Activity alert";
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
    <section aria-label="Alert queue" className={`absolute inset-x-0 bottom-[var(--map-alert-bottom)] z-20 max-h-[40dvh] flex-col overflow-hidden border-t border-[var(--workspace-border,#d2d7d6)] bg-[var(--workspace-surface,#fafaf7)] text-[var(--workspace-text,#203039)] lg:inset-x-auto lg:bottom-8 lg:left-0 lg:top-[var(--map-sidebar-header)] lg:w-[300px] lg:max-h-none lg:border-r ${panelOpen ? "hidden lg:flex" : "flex"}`}>
      <div className="hidden min-h-14 shrink-0 items-center justify-between gap-3 px-5 lg:flex">
        <h2 className="text-sm font-semibold">Alerts <span className="ml-2 font-normal tabular-nums text-[var(--workspace-muted)]">{countLabel}</span></h2>
        <span className="text-xs text-[var(--workspace-muted)]" title="Risk score, out of 100">Risk / 100</span>
      </div>
      <button type="button" aria-label={loading ? "Loading alerts" : !connectionOk ? "Alerts unavailable" : `Alerts: ${active.length} to review`} aria-expanded={expanded} aria-controls="alert-queue" onClick={() => setMobileExpanded(!mobileExpanded)} className="flex min-h-12 w-full shrink-0 items-center justify-between gap-3 px-4 text-left text-sm font-medium hover:bg-[var(--workspace-hover,#eef0ec)] lg:hidden">
        <span className="flex items-center gap-2.5">Alerts <span className="font-normal tabular-nums text-[var(--workspace-muted,#596970)]">{countLabel}</span></span>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={expanded ? "" : "rotate-180"}><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {expanded && (
        <div id="alert-queue" className="alert-queue min-h-0 overflow-y-auto overscroll-contain px-2 pb-2 lg:flex-1">
          {active.length === 0 && <p className="px-4 py-4 text-sm text-[var(--workspace-muted,#596970)]">{loading ? "Loading alerts…" : !connectionOk ? "Alerts unavailable." : "No alerts in view."}</p>}
          {active.map((alert) => (
            <button key={alert.id} type="button" aria-label={`Review ${alert.vessel_name || "unknown vessel"}`} aria-pressed={selectedAlertId === alert.id} onClick={() => onSelectAlert(alert)} className={`alert-row block min-h-16 w-full rounded-md px-3 py-3 text-left transition-colors hover:bg-[var(--workspace-hover)] ${selectedAlertId === alert.id ? "bg-[var(--workspace-selected)]" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium">{alert.vessel_name || "Unknown vessel"}</span>
                <span aria-label={`Risk ${Math.round(alert.risk_score)} out of 100`} className="shrink-0 font-mono text-sm tabular-nums text-[var(--workspace-ink)]">{Math.round(alert.risk_score)}</span>
              </div>
              <div className="mt-1 truncate text-[13px] leading-5 text-[var(--workspace-muted)]" title={leadingReason(alert)}>{leadingReason(alert)}</div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

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
    <section aria-label="Alert queue" className={`absolute bottom-[var(--map-alert-bottom)] left-3 z-20 overflow-hidden rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-surface)] shadow-lg ${expanded ? "w-[300px] max-w-[calc(100vw-24px)]" : "w-[200px] max-w-[calc(100vw-120px)] sm:w-[300px] sm:max-w-none"} ${panelOpen ? "hidden lg:block" : ""}`}>
      <button type="button" aria-expanded={expanded} aria-controls="alert-queue" onClick={() => setExpanded(!expanded)} className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left text-[13px] font-medium text-slate-200 hover:bg-white/[0.03]">
        <span>{active.length} {active.length === 1 ? "alert" : "alerts"}<span className="hidden text-slate-400 sm:inline"> to review</span></span>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={expanded ? "rotate-180" : ""}><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {expanded && (
        <div id="alert-queue" className="max-h-[min(240px,30dvh)] overflow-y-auto border-t border-white/[0.08]">
          {active.length === 0 && <p className="px-3.5 py-4 text-xs text-slate-400">No alerts to review</p>}
          {active.map((alert) => (
            <button key={alert.id} type="button" aria-label={`Review ${alert.vessel_name || "unknown vessel"}`} aria-pressed={selectedAlertId === alert.id} onClick={() => onSelectAlert(alert)} className={`flex min-h-16 w-full items-center gap-3 border-b border-white/[0.06] px-3.5 py-3 text-left last:border-0 hover:bg-white/[0.04] ${selectedAlertId === alert.id ? "bg-white/[0.06]" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-slate-200">{alert.vessel_name || "Unknown vessel"}</div>
                <div className="mt-1 flex items-center gap-2 text-[11px]">
                  <span className={`capitalize ${riskTextClass(alert.risk_score)}`}>{alert.recommended_action}</span>
                  <span className="truncate text-slate-400">{alert.anomaly_signals.length} {alert.anomaly_signals.length === 1 ? "signal" : "signals"}</span>
                </div>
              </div>
              <span className={`font-mono text-sm ${riskTextClass(alert.risk_score)}`}>{Math.round(alert.risk_score)}</span>
              <span aria-hidden="true" className="text-slate-600">›</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

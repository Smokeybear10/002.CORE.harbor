"use client";

import type { VesselDetail } from "@/app/lib/api";
import { useDataSource } from "@/app/lib/data-source";
import { formatAssessmentTime, riskTextClass, riskLabel } from "@/app/lib/risk";

type VesselCompareProps = {
  vessels: VesselDetail[];
  onRemove: (vesselId: string) => void;
  onClear: () => void;
};

const SIGNAL_LABELS: Record<string, string> = {
  ais_gap: "AIS reporting gap",
  kinematic_implausibility: "Position inconsistency",
  geofence_breach: "Restricted area entry",
  type_mismatch: "Identity mismatch",
  collision_risk: "Collision risk",
  loitering: "Loitering",
  speed_anomaly: "Unusual speed",
  heading_anomaly: "Unusual course",
  route_deviation: "Route deviation",
  zone_lingering: "Extended time in zone",
  statistical_outlier: "Unusual regional activity",
  dark_ship_optical: "Optical detection without AIS",
};

function regionFromPosition(vessel: VesselDetail): string {
  if (!vessel.latest_position) return "Unknown";
  const { latitude, longitude } = vessel.latest_position;
  if (latitude >= 0 && latitude <= 30 && longitude >= 90 && longitude <= 150) return "South China Sea";
  if (latitude >= 50 && latitude <= 75 && longitude >= -10 && longitude <= 40) return "North Sea";
  if (latitude >= -15 && latitude <= 15 && longitude >= 35 && longitude <= 75) return "Indian Ocean";
  if (latitude >= 25 && latitude <= 50 && longitude >= -10 && longitude <= 45) return "Mediterranean";
  return "Open Ocean";
}

export default function VesselCompare({ vessels, onRemove, onClear }: VesselCompareProps) {
  const { isDemo } = useDataSource();
  if (vessels.length === 0) return null;

  return (
    <section aria-label="Compare vessels" className="max-h-[45dvh] overflow-auto border-t border-[var(--workspace-border,#d2d7d6)] bg-[var(--workspace-surface,#fafaf7)] text-[var(--workspace-ink,#203039)]">
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-[var(--workspace-border,#d2d7d6)] px-4">
        <h2 className="text-sm font-medium">Compare vessels <span className="ml-2 font-normal text-[var(--workspace-muted,#596970)]">{vessels.length} / 3</span></h2>
        <button type="button" onClick={onClear} className="min-h-11 px-2 text-xs text-[var(--workspace-muted,#596970)] hover:bg-[var(--workspace-subtle,#eef0ec)] hover:text-[var(--workspace-ink,#203039)]">Clear selection</button>
      </div>
      <div className="flex divide-x divide-[var(--workspace-border,#d2d7d6)]">
        {vessels.map((vessel) => {
          const speed = vessel.latest_position?.speed_over_ground;
          const heading = vessel.latest_position?.heading ?? vessel.latest_position?.course_over_ground;
          const topSignals = vessel.anomaly_signals.slice(0, 3);
          const assessedAt = formatAssessmentTime(vessel.risk_assessed_at);

          return (
            <article key={vessel.id} className="min-w-[240px] flex-1 px-4 pb-4">
              <div className="flex min-h-14 items-center justify-between gap-2">
                <div className="min-w-0 py-2">
                  <h3 className="truncate text-sm font-medium">{vessel.name || "Unknown vessel"}</h3>
                  <div className="font-mono text-xs text-[var(--workspace-muted,#596970)]">{vessel.mmsi}</div>
                </div>
                <button type="button" onClick={() => onRemove(vessel.id)} aria-label={`Remove ${vessel.name || vessel.mmsi} from comparison`} className="flex h-11 w-11 shrink-0 items-center justify-center text-[var(--workspace-muted,#596970)] hover:bg-[var(--workspace-subtle,#eef0ec)]">
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
              <dl className="space-y-2 text-xs">
                <div className="flex items-baseline justify-between gap-3"><dt className="text-[var(--workspace-muted,#596970)]">Risk</dt><dd className={riskTextClass(vessel.risk_score)}>{vessel.risk_score === null ? "Not assessed" : <><span className="font-mono">{Math.round(vessel.risk_score)} / 100</span><span className="ml-2">{riskLabel(vessel.risk_score)}</span></>}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[var(--workspace-muted,#596970)]">Speed</dt><dd className="font-mono">{speed != null ? `${speed.toFixed(1)} kn` : "—"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[var(--workspace-muted,#596970)]">Heading</dt><dd className="font-mono">{heading != null ? `${Math.round(heading)}°` : "—"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[var(--workspace-muted,#596970)]">Area</dt><dd>{regionFromPosition(vessel)}</dd></div>
              </dl>
              {vessel.risk_score !== null && <div className="mt-3 text-xs leading-5 text-[var(--workspace-muted,#596970)]">{isDemo ? "Demo assessment" : assessedAt ? `Assessed ${assessedAt}` : "Assessment time unknown"}</div>}
              {topSignals.length > 0 && <ul className="mt-3 space-y-1 border-t border-[var(--workspace-border,#d2d7d6)] pt-3 text-xs text-[var(--workspace-muted,#596970)]">{topSignals.map((signal, index) => <li key={`${signal.anomaly_type}-${index}`}>{SIGNAL_LABELS[signal.anomaly_type] ?? signal.anomaly_type.replaceAll("_", " ")}</li>)}</ul>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

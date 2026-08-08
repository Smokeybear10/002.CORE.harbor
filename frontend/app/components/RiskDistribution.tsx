"use client";

import type { RiskDistribution } from "@/app/lib/api";
import { riskTextClass, RISK_THRESHOLDS } from "@/app/lib/risk";

const TIERS: Record<string, { label: string; range: string; score: number }> = {
  escalate: { label: "High", range: "80–100", score: 80 },
  verify: { label: "Elevated", range: "60–<80", score: 60 },
  monitor: { label: "Moderate", range: "35–<60", score: 35 },
  normal: { label: "Low", range: "0–<35", score: 0 },
};

const ACTIVITY_LABELS: Record<string, string> = {
  ais_gap: "AIS reporting gap",
  kinematic_implausibility: "Position inconsistency",
  geofence_breach: "Restricted area entry",
  type_mismatch: "Vessel type mismatch",
  route_deviation: "Route deviation",
  loitering: "Loitering",
  zone_lingering: "Time in zone",
  speed_anomaly: "Unusual speed",
  heading_anomaly: "Unusual course",
  statistical_outlier: "Unusual regional activity",
  collision_risk: "Collision risk",
  dark_ship_optical: "Optical detection without AIS",
};

export default function RiskDistributionPanel({ data, onClose, closing }: {
  data: RiskDistribution | null;
  onClose: () => void;
  closing?: boolean;
}) {
  if (!data) return null;
  const active = data.tiers.reduce((sum, tier) => sum + tier.count, 0);
  const resolved = data.histogram.reduce((sum, bin) => sum + bin.count_resolved, 0);
  const unassessed = data.unassessed_count ?? 0;
  const assessed = active + resolved;
  const maxCount = Math.max(...data.histogram.map((bin) => bin.count_active + bin.count_resolved), 1);
  const signals: Record<string, number> = {};
  data.tiers.forEach((tier) => Object.entries(tier.top_signals).forEach(([name, count]) => { signals[name] = (signals[name] ?? 0) + count; }));
  const topSignals = Object.entries(signals).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <section aria-label="Vessel analytics" data-tour="analytics-panel" className="workspace-panel absolute top-[var(--map-panel-top)] bottom-[var(--map-panel-bottom)] right-3 z-40 flex w-[400px] max-w-[calc(100vw-24px)] flex-col overflow-hidden" style={{ animation: closing ? "slide-out-right 0.2s ease-in forwards" : "slide-in-right 0.25s ease-out" }}>
      <div className="flex items-center justify-between border-b border-[var(--workspace-border)] px-4 py-2">
        <h2 className="text-base font-semibold text-[var(--workspace-ink)]">Risk summary</h2>
        <button type="button" onClick={onClose} aria-label="Close analytics" className="flex h-11 w-11 items-center justify-center text-[var(--workspace-muted)] hover:bg-[var(--workspace-subtle)] hover:text-[var(--workspace-ink)]"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 6 12 12M6 18 18 6" /></svg></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">
        <div className="flex items-baseline justify-between gap-3 py-4 text-sm">
          <span className="text-[var(--workspace-ink)]">{(assessed + unassessed).toLocaleString()} vessels</span>
          <span className="text-xs text-[var(--workspace-muted)]">{assessed.toLocaleString()} assessed</span>
        </div>
        <table className="w-full border-y border-[var(--workspace-border)] text-left text-xs">
          <thead className="text-[var(--workspace-muted)]"><tr><th className="py-2 font-normal">Risk level</th><th className="py-2 text-right font-normal">Vessels</th><th className="py-2 text-right font-normal">Share</th><th className="py-2 text-right font-normal">Avg. signals</th></tr></thead>
          <tbody className="divide-y divide-[var(--workspace-border)]">
            {data.tiers.map((tier) => {
              const style = TIERS[tier.action] ?? TIERS.normal;
              return <tr key={tier.action}>
                <th scope="row" className="py-3 font-normal"><span className={`font-medium ${riskTextClass(style.score)}`}>{style.label}</span><span className="mt-0.5 block font-mono text-[var(--workspace-muted)]">{style.range}</span></th>
                <td className="text-right font-mono text-[var(--workspace-ink)]">{tier.count.toLocaleString()}</td>
                <td className="text-right font-mono text-[var(--workspace-muted)]">{active ? `${Math.round(tier.count / active * 100)}%` : "—"}</td>
                <td className="text-right font-mono text-[var(--workspace-muted)]">{tier.count ? Number(tier.avg_signals.toFixed(1)) : "—"}</td>
              </tr>;
            })}
            {resolved > 0 && <tr><th scope="row" className="py-3 font-normal text-[var(--workspace-muted)]">Reviewed</th><td className="text-right font-mono">{resolved.toLocaleString()}</td><td className="text-right text-[var(--workspace-muted)]">—</td><td className="text-right text-[var(--workspace-muted)]">—</td></tr>}
            <tr><th scope="row" className="py-3 font-normal text-[var(--workspace-muted)]">Not assessed</th><td className="text-right font-mono">{unassessed.toLocaleString()}</td><td className="text-right text-[var(--workspace-muted)]">—</td><td className="text-right text-[var(--workspace-muted)]">—</td></tr>
          </tbody>
        </table>
        <section className="pt-5">
          <div className="mb-3 flex items-baseline justify-between gap-3"><h3 className="text-sm font-medium text-[var(--workspace-ink)]">Score distribution</h3><span className="text-xs text-[var(--workspace-muted)]">Latest assessments</span></div>
          {assessed > 0 ? <>
            <div role="img" aria-label={data.histogram.map((bin) => `${bin.bin_start}–${bin.bin_end}: ${bin.count_active + bin.count_resolved} assessed vessels`).join("; ")} className="flex h-24 items-end gap-1 border-b border-[var(--workspace-border)]">
              {data.histogram.map((bin) => {
                const score = (bin.bin_start + bin.bin_end) / 2;
                const color = score >= RISK_THRESHOLDS.escalate ? "bg-[#a53735]" : score >= RISK_THRESHOLDS.verify ? "bg-[#b6532b]" : score >= RISK_THRESHOLDS.monitor ? "bg-[#9b641b]" : "bg-[#668895]";
                return <div key={bin.bin_start} title={`${bin.bin_start}–${bin.bin_end}: ${bin.count_active + bin.count_resolved} assessed vessels`} className="flex h-full flex-1 flex-col justify-end">
                  {bin.count_resolved > 0 && <div className="bg-[#253f49]" style={{ height: `${bin.count_resolved / maxCount * 100}%` }} />}
                  {bin.count_active > 0 && <div className={color} style={{ height: `${bin.count_active / maxCount * 100}%` }} />}
                </div>;
              })}
            </div>
            <div className="mt-2 flex justify-between font-mono text-xs text-[var(--workspace-muted)]"><span>0</span><span>Score / 100</span><span>100</span></div>
            {resolved > 0 && <div className="mt-2 text-xs text-[var(--workspace-muted)]">Dark segments: reviewed vessels</div>}
          </> : <div className="border-y border-[var(--workspace-border)] py-5 text-sm text-[var(--workspace-muted)]">No assessments recorded.</div>}
        </section>
        {topSignals.length > 0 && <section className="mt-5 border-t border-[var(--workspace-border)] pt-4">
          <h3 className="mb-2 text-sm font-medium text-[var(--workspace-ink)]">Detected activity</h3>
          <dl className="space-y-2">{topSignals.map(([name, count]) => <div key={name} className="flex justify-between gap-3 text-xs"><dt className="text-[var(--workspace-muted)]">{ACTIVITY_LABELS[name] ?? name.replaceAll("_", " ")}</dt><dd className="font-mono text-[var(--workspace-ink)]">{count}</dd></div>)}</dl>
        </section>}
        <div className="mt-5 border-t border-[var(--workspace-border)] pt-3 text-xs text-[var(--workspace-muted)]">Scores describe detected activity, not threat probability.</div>
      </div>
    </section>
  );
}

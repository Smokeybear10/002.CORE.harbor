"use client";

import type { RiskDistribution } from "@/app/lib/api";
import { riskTextClass, RISK_THRESHOLDS } from "@/app/lib/risk";

const TIERS: Record<string, { label: string; score: number; color: string }> = {
  escalate: { label: "Escalate", score: 80, color: "bg-red-400" },
  verify: { label: "Verify", score: 60, color: "bg-orange-400" },
  monitor: { label: "Monitor", score: 35, color: "bg-amber-300" },
  normal: { label: "Normal", score: 0, color: "bg-slate-400" },
};

export default function RiskDistributionPanel({ data, onClose, closing }: {
  data: RiskDistribution | null;
  onClose: () => void;
  closing?: boolean;
}) {
  if (!data) return null;
  const active = data.tiers.reduce((sum, tier) => sum + tier.count, 0);
  const resolved = data.histogram.reduce((sum, bin) => sum + bin.count_resolved, 0);
  const elevated = data.tiers.filter((tier) => tier.action === "escalate" || tier.action === "verify").reduce((sum, tier) => sum + tier.count, 0);
  const maxCount = Math.max(...data.histogram.map((bin) => bin.count_active + bin.count_resolved), 1);
  const signals: Record<string, number> = {};
  data.tiers.forEach((tier) => Object.entries(tier.top_signals).forEach(([name, count]) => { signals[name] = (signals[name] ?? 0) + count; }));
  const topSignals = Object.entries(signals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxSignal = topSignals[0]?.[1] ?? 1;

  return (
    <section aria-label="Vessel analytics" data-tour="analytics-panel" className="workspace-panel absolute top-[var(--map-panel-top)] bottom-[var(--map-panel-bottom)] right-3 z-40 flex w-[400px] max-w-[calc(100vw-24px)] flex-col overflow-hidden shadow-xl" style={{ animation: closing ? "slide-out-right 0.2s ease-in forwards" : "slide-in-right 0.25s ease-out" }}>
      <div className="flex items-center justify-between border-b border-[var(--workspace-border)] px-4 py-3">
        <div><h2 className="text-base font-semibold text-slate-100">Vessel analytics</h2><p className="mt-0.5 text-xs text-slate-400">Risk and review activity</p></div>
        <button type="button" onClick={onClose} aria-label="Close analytics" className="flex h-11 w-11 items-center justify-center rounded-md text-slate-400 hover:bg-white/[0.06] hover:text-white"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 6 12 12M6 18 18 6" /></svg></button>
      </div>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5">
        <dl className="grid grid-cols-3 gap-3 border-b border-[var(--workspace-border)] pb-5">
          {[{label:"Tracked",value:active+resolved},{label:"Elevated",value:elevated},{label:"Resolved",value:resolved}].map(({label,value}) => <div key={label}><dt className="text-xs text-slate-400">{label}</dt><dd className={`mt-1.5 font-mono text-2xl tabular-nums ${label === "Elevated" && value > 0 ? "text-orange-300" : "text-slate-100"}`}>{value}</dd></div>)}
        </dl>
        <section>
          <h3 className="mb-3 text-sm font-medium text-slate-200">Review priority</h3>
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400"><tr><th className="pb-2 font-normal">Action</th><th className="pb-2 text-right font-normal">Vessels</th><th className="pb-2 text-right font-normal">Share</th><th className="pb-2 text-right font-normal">Signals / vessel</th></tr></thead>
            <tbody className="divide-y divide-white/[0.06]">
              {data.tiers.map((tier) => {
                const style = TIERS[tier.action] ?? TIERS.normal;
                return <tr key={tier.action}>
                  <th scope="row" className="py-3 font-medium"><span className="flex items-center gap-2"><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${style.color}`} /><span className={tier.action === "normal" ? "text-slate-300" : riskTextClass(style.score)}>{style.label}</span></span></th>
                  <td className="text-right font-mono text-slate-200">{tier.count}</td>
                  <td className="text-right font-mono text-slate-400">{active ? Math.round(tier.count / active * 100) : 0}%</td>
                  <td className="text-right font-mono text-slate-400">{Number(tier.avg_signals.toFixed(1))}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </section>
        <section>
          <h3 className="mb-3 text-sm font-medium text-slate-200">Risk scores</h3>
          <div role="img" aria-label={data.histogram.map((bin) => `${bin.bin_start}–${bin.bin_end}: ${bin.count_active} active, ${bin.count_resolved} resolved`).join("; ")} className="flex h-32 items-end gap-1 border-b border-white/[0.12]">
            {data.histogram.map((bin) => {
              const score = (bin.bin_start + bin.bin_end) / 2;
              const color = score >= RISK_THRESHOLDS.escalate ? "bg-red-400/80" : score >= RISK_THRESHOLDS.verify ? "bg-orange-400/80" : score >= RISK_THRESHOLDS.monitor ? "bg-amber-300/80" : "bg-slate-400/60";
              return <div key={bin.bin_start} title={`${bin.bin_start}–${bin.bin_end}: ${bin.count_active} active, ${bin.count_resolved} resolved`} className="flex h-full flex-1 flex-col justify-end gap-px">
                {bin.count_resolved > 0 && <div className="bg-slate-600" style={{height:`${bin.count_resolved / maxCount * 100}%`}} />}
                <div className={`min-h-px rounded-t-sm ${color}`} style={{height:`${bin.count_active / maxCount * 100}%`}} />
              </div>;
            })}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[11px] text-slate-400"><span>0</span><span>Risk score</span><span>100</span></div>
          <p className="mt-2 text-xs text-slate-400">{resolved > 0 ? "Dark segments show resolved vessels." : "Higher scores indicate more detected risk signals."}</p>
        </section>
        {topSignals.length > 0 && <section>
          <h3 className="mb-3 text-sm font-medium text-slate-200">Most common signals</h3>
          <div className="space-y-3">{topSignals.map(([name,count]) => <div key={name}>
            <div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="capitalize text-slate-300">{name.replaceAll("_", " ")}</span><span className="font-mono text-slate-400">{count}</span></div>
            <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-slate-400" style={{width:`${count / maxSignal * 100}%`}} /></div>
          </div>)}</div>
        </section>}
        <p className="border-t border-[var(--workspace-border)] pt-4 text-slate-400">Risk scores summarize detected patterns. They are not probabilities of a threat.</p>
      </div>
    </section>
  );
}

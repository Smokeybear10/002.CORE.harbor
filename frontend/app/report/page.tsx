"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getApi, getDataMode, type DataMode, type PositionHistoryCursor } from "@/app/lib/api";
import { riskLevel } from "@/app/lib/risk";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

type Report = Record<string, unknown>;
type History = {
  position_count: number;
  oldest_report_at: string | null;
  newest_report_at: string | null;
  position_offset: number;
  next_position_cursor: PositionHistoryCursor | null;
  page_size: number;
  until: string;
  durable: boolean;
  retention_days: number | null;
  max_position_rows: number;
};

const SIGNAL_LABELS: Record<string, string> = {
  ais_gap: "AIS Dark Period",
  kinematic_implausibility: "Position Spoofing",
  geofence_breach: "Restricted Zone Breach",
  type_mismatch: "Identity Mismatch",
  route_deviation: "Route Deviation",
  loitering: "Loitering",
  zone_lingering: "Zone Lingering",
  speed_anomaly: "Speed Anomaly",
  heading_anomaly: "Course Anomaly",
  statistical_outlier: "Regional Outlier",
  collision_risk: "COLREGS Non-Compliance",
  dark_ship_optical: "Dark Ship (Optical)",
};

function actionPill(action: string) {
  if (action === "escalate") return "bg-red-500/[0.08] border-red-400/25 text-red-300";
  if (action === "verify") return "bg-amber-500/[0.08] border-amber-400/25 text-amber-300";
  if (action === "monitor") return "bg-yellow-500/[0.08] border-yellow-400/25 text-yellow-300";
  return "bg-emerald-500/[0.08] border-emerald-400/25 text-emerald-300";
}

function scoreTone(level: string) {
  if (level === "escalate") return "text-red-300";
  if (level === "verify") return "text-amber-300";
  if (level === "monitor") return "text-yellow-300";
  return "text-emerald-300";
}

function sevColor(sev: number) {
  if (sev >= 0.55) return "bg-red-400";
  if (sev >= 0.35) return "bg-amber-400";
  if (sev >= 0.2) return "bg-yellow-400";
  return "bg-emerald-400";
}

function sevText(sev: number) {
  if (sev >= 0.55) return "text-red-300";
  if (sev >= 0.35) return "text-amber-300";
  if (sev >= 0.2) return "text-yellow-300";
  return "text-emerald-300";
}

export default function ReportPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ReportSession />
    </Suspense>
  );
}

function LoadingState({ mapHref = "/" }: { mapHref?: string }) {
  return (
    <main id="main" className="min-h-screen">
      <SiteNav mapHref={mapHref} />
      <div className="max-w-[1100px] mx-auto px-8 py-20 text-slate-500 text-[14px]">Loading report…</div>
    </main>
  );
}

function ErrorState({ message, mapHref }: { message: string; mapHref: string }) {
  return (
    <main id="main" className="min-h-screen">
      <SiteNav mapHref={mapHref} />
      <div className="max-w-[1100px] mx-auto px-8 py-20">
        <div className="glass rounded-2xl p-8 border border-red-400/20 bg-red-500/[0.04]">
          <div className="text-[10.5px] font-mono tracking-[0.22em] text-red-300 uppercase mb-2">Error</div>
          <div className="text-[15px] text-slate-200">{message}</div>
        </div>
      </div>
    </main>
  );
}

function ReportSession() {
  const searchParams = useSearchParams();
  const vesselId = searchParams.get("vesselId");
  const mode = getDataMode(searchParams.get("mode"));
  return <ReportContent key={`${mode}:${vesselId}`} vesselId={vesselId} mode={mode} />;
}

function ReportContent({ vesselId, mode }: { vesselId: string | null; mode: DataMode }) {
  const api = getApi(mode);
  const isDemo = mode === "demo";
  const mapHref = `/?mode=${mode}`;
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [positionCursors, setPositionCursors] = useState<(PositionHistoryCursor | null)[]>([null]);

  useEffect(() => {
    if (!vesselId) return;
    let cancelled = false;
    api.getVesselReport(vesselId)
      .then((data) => { if (!cancelled) setReport(data); })
      .catch(() => { if (!cancelled) setError("Failed to load report"); });
    return () => { cancelled = true; };
  }, [api, vesselId]);

  if (!vesselId) return <ErrorState message="No vessel specified." mapHref={mapHref} />;
  if (error) return <ErrorState message={error} mapHref={mapHref} />;
  if (!report) return <LoadingState mapHref={mapHref} />;

  const vessel = report.vessel as Record<string, unknown>;
  const position = report.latest_position as Record<string, unknown> | null;
  const risk = report.risk_assessment as Record<string, unknown>;
  const signals = report.anomaly_signals as Record<string, unknown>[];
  const trail = report.position_trail as Record<string, unknown>[];
  const audit = report.alert_audit_trail as Record<string, unknown>[];
  const notes = report.operator_notes ? String(report.operator_notes) : null;
  const generatedAt = report.generated_at ? new Date(String(report.generated_at)) : null;
  const history = report.history as History | undefined;
  const pastAlerts = (report.alert_history ?? []) as Record<string, unknown>[];
  const alertTotal = Number(report.alert_history_total ?? 0);
  const alertOffset = Number(report.alert_offset ?? 0);

  async function loadHistory(cursors: (PositionHistoryCursor | null)[], nextAlertOffset: number) {
    if (!vesselId || !history || historyLoading) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      setReport(await api.getVesselReport(vesselId, { positionCursor: cursors.at(-1), alertOffset: nextAlertOffset, until: history.until }));
      setPositionCursors(cursors);
    } catch {
      setHistoryError("Couldn’t load this part of the history. Try again.");
    } finally {
      setHistoryLoading(false);
    }
  }

  const score = Number(risk.score ?? 0);
  const level = riskLevel(score);
  const actionText = String(risk.recommended_action ?? "normal").toUpperCase();

  return (
    <main id="main" className="min-h-screen">
      <SiteNav mapHref={mapHref} />

      <div className="max-w-[1100px] mx-auto px-8 pt-10 pb-24">

        <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-slate-400">
              {isDemo ? "Demo vessel report" : "Vessel report"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {generatedAt && (
              <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                {generatedAt.toLocaleString()}
              </span>
            )}
            <button
              onClick={() => window.print()}
              className="btn-secondary text-[11.5px] px-3 py-1.5 rounded-md inline-flex items-center gap-1.5"
            >
              <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print / PDF
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="mb-8">
          {isDemo && <p className="mb-4 text-sm text-slate-400">Simulated LA Harbor scenario. Vessel positions and alerts are sample data.</p>}
          <div className="text-[10.5px] font-mono tracking-[0.22em] text-slate-500 uppercase mb-3">Subject Vessel</div>
          <h1 className="text-[36px] font-semibold tracking-[-0.02em] leading-[1.08] mb-3">
            {String(vessel.name)}
            <span className="font-mono text-[16px] text-slate-500 tracking-normal ml-3">
              MMSI {String(vessel.mmsi ?? "—")}
            </span>
          </h1>
          <div className="flex flex-wrap gap-2 items-center">
            <span className={`text-[10.5px] font-semibold py-1 px-2.5 rounded-full border uppercase tracking-[0.14em] ${actionPill(String(risk.recommended_action ?? "normal"))}`}>
              {actionText}
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              Risk <span className={`font-semibold ${scoreTone(level)}`}>{score}</span> / 100
            </span>
            {vessel.vessel_type ? (
              <span className="font-mono text-[11px] text-slate-500">
                · {String(vessel.vessel_type).replace(/_/g, " ")}
              </span>
            ) : null}
            {vessel.flag_state ? (
              <span className="font-mono text-[11px] text-slate-500">
                · {String(vessel.flag_state)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Identity + Risk */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <Card label="Vessel Identity">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <KV label="MMSI" value={String(vessel.mmsi ?? "—")} />
              <KV label="IMO" value={String(vessel.imo ?? "—")} />
              <KV label="Type" value={String(vessel.vessel_type ?? "—").replace(/_/g, " ")} />
              <KV label="Flag" value={String(vessel.flag_state ?? "—")} />
              {vessel.length ? <KV label="Length" value={`${Number(vessel.length).toFixed(1)} m`} /> : null}
              {vessel.beam ? <KV label="Beam" value={`${Number(vessel.beam).toFixed(1)} m`} /> : null}
              {vessel.draft ? <KV label="Draft" value={`${Number(vessel.draft).toFixed(1)} m`} /> : null}
              {vessel.callsign ? <KV label="Callsign" value={String(vessel.callsign)} /> : null}
            </div>
          </Card>

          <Card label="Risk Assessment">
            <div className="flex items-baseline gap-4 mb-3">
              <div className={`text-[48px] font-bold font-mono tabular-nums tracking-[-0.03em] leading-none ${scoreTone(level)}`}>
                {score}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">Score · 100</span>
                <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] mt-1 ${scoreTone(level)}`}>
                  {level}
                </span>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden mb-3">
              <div
                className={`h-full rounded-full ${sevColor(score / 100)}`}
                style={{ width: `${Math.min(score, 100)}%` }}
              />
            </div>
            {risk.explanation ? (
              <p className="text-[12px] text-slate-400 leading-[1.6]">{String(risk.explanation)}</p>
            ) : null}
          </Card>
        </div>

        {/* Position */}
        {position && (
          <Card label="Last reported position" className="mb-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <KV label="Latitude" value={Number(position.latitude).toFixed(5)} mono />
              <KV label="Longitude" value={Number(position.longitude).toFixed(5)} mono />
              <KV label="Speed" value={position.speed_over_ground != null ? `${Number(position.speed_over_ground).toFixed(1)} kn` : "—"} mono />
              <KV label="Course" value={position.course_over_ground != null ? `${Number(position.course_over_ground).toFixed(0)}°` : "—"} mono />
              <KV label="Heading" value={position.heading != null ? `${Number(position.heading).toFixed(0)}°` : "—"} mono />
            </div>
          </Card>
        )}

        {/* Signals */}
        {signals?.length > 0 && (
          <Card label={`Anomaly Signals · ${signals.length}`} className="mb-4">
            <div className="space-y-3">
              {signals.map((s, i) => {
                const sev = Number(s.severity ?? 0);
                const sevPct = Math.round(sev * 100);
                return (
                  <div key={i} className="py-2 border-t border-white/[0.05] first:border-t-0 first:pt-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12.5px] text-slate-200 font-medium">
                        {SIGNAL_LABELS[String(s.anomaly_type)] ?? String(s.anomaly_type).replace(/_/g, " ")}
                      </span>
                      <span className={`font-mono text-[11px] font-semibold tabular-nums ${sevText(sev)}`}>
                        {sevPct}%
                      </span>
                    </div>
                    <div className="w-full bg-white/[0.04] rounded-full h-[3px] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${sevColor(sev)}`}
                        style={{ width: `${sevPct}%` }}
                      />
                    </div>
                    {s.description ? (
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-[1.55]">{String(s.description)}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {history && (
          <Card label={history.durable ? "Saved history" : "Session history"} className="mb-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <KV label="Position reports" value={history.position_count.toLocaleString()} mono />
              <KV label="First retained report" value={history.oldest_report_at ? new Date(history.oldest_report_at).toLocaleString() : "—"} />
              <KV label="Latest retained report" value={history.newest_report_at ? new Date(history.newest_report_at).toLocaleString() : "—"} />
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-slate-400">
              {history.durable
                ? `Tracks are kept for up to ${history.retention_days} days, within a shared ${history.max_position_rows.toLocaleString()}-position limit. The last known position may be kept longer. Alerts and operator notes remain saved.`
                : "This service is using temporary storage. History may be lost when it restarts."}
            </p>
            <p className="mt-2 text-[11px] text-slate-500">This report uses the records currently retained for this vessel. Print / PDF includes the records shown below.</p>
          </Card>
        )}
        {historyError && <p role="alert" className="mb-4 text-sm text-amber-300">{historyError}</p>}

        {(trail?.length > 0 || (history && positionCursors.length > 1)) && (
          <Card label={`Position history · ${history && trail.length ? `${history.position_offset + 1}–${history.position_offset + trail.length} of ${history.position_count.toLocaleString()}` : `${trail.length} points`}`} className="mb-4" padding="none">
            {trail.length === 0 && <p className="px-5 pb-4 text-sm text-slate-400">These older positions are no longer retained.</p>}
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <Th>Time</Th>
                    <Th>Latitude</Th>
                    <Th>Longitude</Th>
                    <Th>Speed</Th>
                    <Th>Course</Th>
                    <Th>Heading</Th>
                  </tr>
                </thead>
                <tbody>
                  {trail.map((p, i) => (
                    <tr key={i} className="border-b border-white/[0.03] last:border-b-0 font-mono text-slate-400 hover:bg-white/[0.015]">
                      <Td>{new Date(String(p.timestamp)).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</Td>
                      <Td>{Number(p.latitude).toFixed(5)}</Td>
                      <Td>{Number(p.longitude).toFixed(5)}</Td>
                      <Td>{p.speed_over_ground != null ? Number(p.speed_over_ground).toFixed(1) : "—"}</Td>
                      <Td>{p.course_over_ground != null ? `${Number(p.course_over_ground).toFixed(0)}°` : "—"}</Td>
                      <Td>{p.heading != null ? `${Number(p.heading).toFixed(0)}°` : "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {history && (history.next_position_cursor || positionCursors.length > 1) && (
              <HistoryPager
                hasNewer={positionCursors.length > 1} hasOlder={history.next_position_cursor !== null}
                loading={historyLoading}
                onNewer={() => void loadHistory(positionCursors.slice(0, -1), alertOffset)}
                onOlder={() => {
                  if (history.next_position_cursor) void loadHistory([...positionCursors, history.next_position_cursor], alertOffset);
                }}
              />
            )}
          </Card>
        )}

        {pastAlerts.length > 0 && (
          <Card label={`Alert history · ${alertTotal.toLocaleString()} saved`} className="mb-4">
            <div className="divide-y divide-white/[0.06]">
              {pastAlerts.map((alert) => (
                <div key={String(alert.id)} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
                    <time className="text-slate-400">{new Date(String(alert.created_at)).toLocaleString()}</time>
                    <span className="capitalize text-slate-200">{String(alert.status).replace(/_/g, " ")}</span>
                    <span className="font-mono text-slate-400">Risk {Number(alert.risk_score ?? 0)} / 100</span>
                  </div>
                  {alert.explanation ? <p className="mt-2 text-[12px] leading-relaxed text-slate-400">{String(alert.explanation)}</p> : null}
                  {alert.operator_notes ? <p className="mt-2 whitespace-pre-wrap text-[12px] text-slate-300"><span className="text-slate-500">Operator note: </span>{String(alert.operator_notes)}</p> : null}
                </div>
              ))}
            </div>
            {history && alertTotal > history.page_size && (
              <HistoryPager hasNewer={alertOffset > 0} hasOlder={alertOffset + history.page_size < alertTotal} loading={historyLoading}
                onNewer={() => void loadHistory(positionCursors, Math.max(0, alertOffset - history.page_size))}
                onOlder={() => void loadHistory(positionCursors, alertOffset + history.page_size)} />
            )}
          </Card>
        )}

        {/* Audit Trail */}
        {audit?.length > 0 && (
          <Card label="Recent operator activity" className="mb-4">
            <div className="space-y-1.5">
              {audit.map((e, i) => (
                <div key={i} className="flex items-start gap-3 text-[11.5px] py-1.5 border-t border-white/[0.04] first:border-t-0 first:pt-0">
                  <span className="text-slate-600 font-mono shrink-0 tabular-nums">
                    {new Date(String(e.timestamp)).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-slate-300">
                    <span className="font-semibold text-slate-200">{String(e.action)}</span>
                    {e.details ? <span className="text-slate-500"> · {String(e.details)}</span> : null}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Notes */}
        {notes && pastAlerts.length === 0 && (
          <Card label="Operator Notes" className="mb-4">
            <p className="text-[13px] text-slate-300 leading-[1.65]">{notes}</p>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-white/[0.06] text-center text-[10.5px] font-mono tracking-[0.18em] uppercase text-slate-600">
          H4BOR · {isDemo ? "Sample data" : "AIS vessel report"}
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}

function Card({
  label,
  children,
  className = "",
  padding = "default",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  padding?: "default" | "none";
}) {
  return (
    <div className={`glass rounded-xl overflow-hidden ${className}`}>
      <div className={`px-5 pt-4 pb-2 ${padding === "none" ? "" : ""}`}>
        <h2 className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.18em]">{label}</h2>
      </div>
      <div className={padding === "none" ? "" : "px-5 pb-5"}>{children}</div>
    </div>
  );
}

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[9.5px] font-mono uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className={`text-[12.5px] text-slate-200 mt-1 ${mono ? "font-mono tabular-nums" : ""}`}>{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-[9.5px] font-mono font-semibold uppercase tracking-[0.14em] text-slate-500">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-1.5">{children}</td>;
}

function HistoryPager({ hasNewer, hasOlder, loading, onNewer, onOlder }: {
  hasNewer: boolean;
  hasOlder: boolean;
  loading: boolean;
  onNewer: () => void;
  onOlder: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] px-4 py-3 print:hidden">
      <span aria-live="polite" className="text-[11px] text-slate-500">{loading ? "Loading history…" : "Older records on later pages"}</span>
      <div className="flex gap-2">
        <button type="button" disabled={loading || !hasNewer} onClick={onNewer}
          className="btn-secondary rounded-md px-3 py-1.5 text-xs disabled:cursor-default disabled:opacity-35">Newer</button>
        <button type="button" disabled={loading || !hasOlder} onClick={onOlder}
          className="btn-secondary rounded-md px-3 py-1.5 text-xs disabled:cursor-default disabled:opacity-35">Older</button>
      </div>
    </div>
  );
}

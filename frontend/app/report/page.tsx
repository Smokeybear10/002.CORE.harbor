"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getApi, getDataMode, type DataMode, type PositionHistoryCursor } from "@/app/lib/api";
import Link from "next/link";
import { formatAssessmentTime, riskLabel } from "@/app/lib/risk";

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

function reportTime(value: unknown, seconds = false): string {
  if (typeof value !== "string") return "—";
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", ...(seconds ? { second: "2-digit" } as const : {}),
    timeZoneName: "short",
  });
}

function ReportHeader({ mapHref, printable = false }: { mapHref: string; printable?: boolean }) {
  return (
    <nav aria-label="Report controls" className="border-b border-[#d2d7d6] print:hidden">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between px-5 py-2 sm:px-8">
        <Link href={mapHref} className="inline-flex min-h-11 items-center gap-2 text-sm text-[#203039] hover:underline underline-offset-4">
          <span aria-hidden="true">←</span> Back to map
        </Link>
        {printable && <button type="button" onClick={() => window.print()} className="min-h-11 px-3 text-sm text-[#203039] hover:bg-[#eef0ec]">Print / PDF</button>}
      </div>
    </nav>
  );
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
    <main id="main" className="vessel-report min-h-screen bg-[#fafaf7] text-[#203039]">
      <ReportHeader mapHref={mapHref} />
      <p className="mx-auto max-w-[1120px] px-5 py-12 text-sm text-[#596970] sm:px-8">Loading report…</p>
    </main>
  );
}

function ErrorState({ message, mapHref }: { message: string; mapHref: string }) {
  return (
    <main id="main" className="vessel-report min-h-screen bg-[#fafaf7] text-[#203039]">
      <ReportHeader mapHref={mapHref} />
      <div className="mx-auto max-w-[1120px] px-5 py-12 sm:px-8">
        <h1 className="mb-2 text-xl font-medium">Report unavailable</h1>
        <p role="alert" className="text-sm text-[#596970]">{message}</p>
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
      .catch(() => { if (!cancelled) setError("Couldn’t load this vessel’s report. Try again from the map."); });
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

  const score = typeof risk.score === "number" && Number.isFinite(risk.score) ? risk.score : null;
  const assessedAt = formatAssessmentTime(typeof risk.assessed_at === "string" ? risk.assessed_at : null);

  return (
    <main id="main" className="vessel-report min-h-screen bg-[#fafaf7] text-[#203039] print:bg-white">
      <ReportHeader mapHref={mapHref} printable />
      <article className="mx-auto max-w-[1120px] px-5 pb-16 pt-7 sm:px-8 sm:pt-10 print:px-0 print:py-0">
        <header className="mb-7">
          <p className="mb-2 text-sm text-[#596970]">{isDemo ? "Demo vessel report" : "Vessel report"}</p>
          <h1 className="break-words text-2xl font-semibold leading-tight sm:text-3xl">{String(vessel.name ?? "Unknown vessel")}</h1>
          <p className="mt-2 font-mono text-sm text-[#596970]">MMSI {String(vessel.mmsi ?? "—")}</p>
          {isDemo && <p className="mt-3 text-sm text-[#596970]">Sample positions and alerts from the LA Harbor scenario.</p>}
        </header>

        <dl className="mb-8 grid gap-x-8 gap-y-5 border-y border-[#d2d7d6] py-5 sm:grid-cols-[1fr_1.5fr_1.5fr]">
          <div>
            <dt className="text-xs text-[#596970]">Risk score</dt>
            <dd className="mt-1 text-lg font-medium tabular-nums">
              {score === null ? "Not assessed" : <>{score}<span className="text-sm font-normal text-[#596970]"> / 100 · {riskLabel(score)}</span></>}
            </dd>
          </div>
          <KV label={isDemo ? "Scenario assessment" : "Last assessed"} value={score === null ? "No assessment recorded" : assessedAt ?? "Time unavailable"} />
          <KV label="Last AIS report" value={reportTime(position?.timestamp)} />
        </dl>

        <div className="grid gap-x-12 lg:grid-cols-2">
          <Section title="Vessel details">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <KV label="IMO" value={String(vessel.imo ?? "—")} mono />
              <KV label="Callsign" value={String(vessel.callsign ?? "—")} mono />
              <KV label="Type" value={String(vessel.vessel_type ?? "—").replace(/_/g, " ")} />
              <KV label="Flag" value={String(vessel.flag_state ?? "—")} />
              {vessel.length != null && <KV label="Length" value={`${Number(vessel.length).toFixed(1)} m`} mono />}
              {vessel.beam != null && <KV label="Beam" value={`${Number(vessel.beam).toFixed(1)} m`} mono />}
              {vessel.draft != null && <KV label="Draft" value={`${Number(vessel.draft).toFixed(1)} m`} mono />}
              {vessel.destination ? <KV label="Destination" value={String(vessel.destination)} /> : null}
            </dl>
          </Section>
          <Section title="Last position">
            {position ? <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <KV label="Latitude" value={`${Number(position.latitude).toFixed(5)}°`} mono />
              <KV label="Longitude" value={`${Number(position.longitude).toFixed(5)}°`} mono />
              <KV label="Speed" value={position.speed_over_ground != null ? `${Number(position.speed_over_ground).toFixed(1)} kn` : "—"} mono />
              <KV label="Course" value={position.course_over_ground != null ? `${Number(position.course_over_ground).toFixed(0)}°` : "—"} mono />
              <KV label="Heading" value={position.heading != null ? `${Number(position.heading).toFixed(0)}°` : "—"} mono />
            </dl> : <p className="text-sm text-[#596970]">No position recorded.</p>}
          </Section>
        </div>

        {(risk.explanation || signals?.length > 0) ? (
          <Section title="Detected activity" ruled>
            {risk.explanation ? <p className="mb-4 max-w-[75ch] text-sm leading-relaxed">{String(risk.explanation)}</p> : null}
            {signals?.length > 0 && <div className="divide-y divide-[#d2d7d6]">
              {signals.map((signal, index) => (
                <div key={index} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <h3 className="font-medium">{SIGNAL_LABELS[String(signal.anomaly_type)] ?? String(signal.anomaly_type).replace(/_/g, " ")}</h3>
                    <span className="shrink-0 text-xs text-[#596970]">Severity <span className="font-mono tabular-nums">{Math.round(Number(signal.severity ?? 0) * 100)} / 100</span></span>
                  </div>
                  {signal.description ? <p className="mt-1 max-w-[85ch] text-sm leading-relaxed text-[#596970]">{String(signal.description)}</p> : null}
                </div>
              ))}
            </div>}
          </Section>
        ) : null}

        {history && <Section title="Saved records" ruled>
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-[1fr_1.5fr_1.5fr]">
            <KV label="Positions" value={history.position_count.toLocaleString()} mono />
            <KV label="First saved report" value={reportTime(history.oldest_report_at)} />
            <KV label="Last saved report" value={reportTime(history.newest_report_at)} />
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-[#596970]">
            {history.durable
              ? `Positions are kept for up to ${history.retention_days} days (${history.max_position_rows.toLocaleString()} across all vessels). Last known positions, alerts and notes may remain longer.`
              : "Temporary storage. These records may be lost when the service restarts."}
          </p>
        </Section>}
        {historyError && <p role="alert" className="mb-5 text-sm text-[#9b402d]">{historyError}</p>}

        {(trail?.length > 0 || (history && positionCursors.length > 1)) && (
          <Section title="Position history" detail={history && trail.length ? `${history.position_offset + 1}–${history.position_offset + trail.length} of ${history.position_count.toLocaleString()}` : `${trail.length} positions`} ruled>
            {trail.length === 0 && <p className="pb-4 text-sm text-[#596970]">These older positions are no longer saved.</p>}
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[#d2d7d6]">
                  <Th>Time</Th><Th>Latitude</Th><Th>Longitude</Th><Th>Speed</Th><Th>Course</Th><Th>Heading</Th>
                </tr></thead>
                <tbody>
                  {trail.map((point, index) => (
                    <tr key={index} className="border-b border-[#e2e6e2] last:border-0 hover:bg-[#eef0ec]">
                      <Td>{reportTime(point.timestamp, true)}</Td>
                      <Td>{Number(point.latitude).toFixed(5)}</Td>
                      <Td>{Number(point.longitude).toFixed(5)}</Td>
                      <Td>{point.speed_over_ground != null ? `${Number(point.speed_over_ground).toFixed(1)} kn` : "—"}</Td>
                      <Td>{point.course_over_ground != null ? `${Number(point.course_over_ground).toFixed(0)}°` : "—"}</Td>
                      <Td>{point.heading != null ? `${Number(point.heading).toFixed(0)}°` : "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {history && (history.next_position_cursor || positionCursors.length > 1) && (
              <HistoryPager hasNewer={positionCursors.length > 1} hasOlder={history.next_position_cursor !== null} loading={historyLoading}
                onNewer={() => void loadHistory(positionCursors.slice(0, -1), alertOffset)}
                onOlder={() => { if (history.next_position_cursor) void loadHistory([...positionCursors, history.next_position_cursor], alertOffset); }} />
            )}
          </Section>
        )}

        {pastAlerts.length > 0 && (
          <Section title="Alert history" detail={`${alertTotal.toLocaleString()} saved`} ruled>
            <div className="divide-y divide-[#d2d7d6]">
              {pastAlerts.map((alert) => (
                <div key={String(alert.id)} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
                    <time className="text-[#596970]">{reportTime(alert.created_at)}</time>
                    <span className="capitalize">{String(alert.status).replace(/_/g, " ")}</span>
                    <span className="text-[#596970]">Risk <span className="font-mono tabular-nums">{alert.risk_score == null ? "—" : `${Number(alert.risk_score)} / 100`}</span></span>
                  </div>
                  {alert.explanation ? <p className="mt-2 max-w-[85ch] text-sm leading-relaxed">{String(alert.explanation)}</p> : null}
                  {alert.operator_notes ? <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#596970]">Note: {String(alert.operator_notes)}</p> : null}
                </div>
              ))}
            </div>
            {history && alertTotal > history.page_size && (
              <HistoryPager hasNewer={alertOffset > 0} hasOlder={alertOffset + history.page_size < alertTotal} loading={historyLoading}
                onNewer={() => void loadHistory(positionCursors, Math.max(0, alertOffset - history.page_size))}
                onOlder={() => void loadHistory(positionCursors, alertOffset + history.page_size)} />
            )}
          </Section>
        )}

        {audit?.length > 0 && (
          <Section title="Review history" ruled>
            <div className="divide-y divide-[#d2d7d6]">
              {audit.map((entry, index) => (
                <div key={index} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[220px_1fr] sm:gap-6">
                  <time className="text-sm text-[#596970]">{reportTime(entry.timestamp)}</time>
                  <p className="text-sm leading-relaxed"><span className="capitalize">{String(entry.action).replace(/_/g, " ")}</span>{entry.details ? <span className="text-[#596970]"> · {String(entry.details)}</span> : null}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {notes && pastAlerts.length === 0 && <Section title="Notes" ruled><p className="whitespace-pre-wrap text-sm leading-relaxed">{notes}</p></Section>}

        <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-[#d2d7d6] pt-4 text-xs text-[#596970]">
          <span>{report.generated_at ? `Generated ${reportTime(report.generated_at)}` : "Vessel report"}</span>
          <span>{isDemo ? "Sample data" : "Includes the records shown on this page"}</span>
        </div>
      </article>
    </main>
  );
}

function Section({ title, detail, children, ruled = false }: { title: string; detail?: string; children: React.ReactNode; ruled?: boolean }) {
  return (
    <section className={`mb-8 break-inside-avoid ${ruled ? "border-t border-[#d2d7d6] pt-5" : ""}`}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-medium">{title}</h2>
        {detail && <span className="text-xs tabular-nums text-[#596970]">{detail}</span>}
      </div>
      {children}
    </section>
  );
}

function KV({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><dt className="text-xs text-[#596970]">{label}</dt><dd className={`mt-1 text-sm leading-relaxed ${mono ? "font-mono tabular-nums" : ""}`}>{value}</dd></div>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap pb-3 pr-5 text-left text-xs font-normal text-[#596970] last:pr-0 print:whitespace-normal print:pr-2">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap py-3 pr-5 font-mono text-xs tabular-nums last:pr-0 print:whitespace-normal print:pr-2">{children}</td>;
}

function HistoryPager({ hasNewer, hasOlder, loading, onNewer, onOlder }: {
  hasNewer: boolean; hasOlder: boolean; loading: boolean; onNewer: () => void; onOlder: () => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-4 border-t border-[#d2d7d6] pt-3 print:hidden">
      <span aria-live="polite" className="text-xs text-[#596970]">{loading ? "Loading…" : ""}</span>
      <div className="flex gap-2">
        <button type="button" disabled={loading || !hasNewer} onClick={onNewer} className="min-h-11 px-3 text-sm hover:bg-[#eef0ec] disabled:cursor-default disabled:opacity-35">← Newer</button>
        <button type="button" disabled={loading || !hasOlder} onClick={onOlder} className="min-h-11 px-3 text-sm hover:bg-[#eef0ec] disabled:cursor-default disabled:opacity-35">Older →</button>
      </div>
    </div>
  );
}

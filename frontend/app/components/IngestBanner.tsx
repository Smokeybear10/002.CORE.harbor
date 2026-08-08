"use client";

import { IS_FREE_HOSTED_API, type IngestionStatus, type MapCoverage } from "@/app/lib/api";
import { useDataSource } from "@/app/lib/data-source";

type IngestBannerProps = {
  vesselCount: number;
  status: IngestionStatus | null;
  isLive: boolean;
  connectionOk: boolean;
  loading: boolean;
  onDemo: () => void;
  coverage?: MapCoverage | null;
  zoomRequired?: boolean;
  vesselsTotal?: number;
};

export default function IngestBanner({ vesselCount, status, isLive, connectionOk, loading, onDemo, coverage, zoomRequired, vesselsTotal = 0 }: IngestBannerProps) {
  const { isDemo } = useDataSource();
  if (isDemo) return null;
  const noteStyle = "absolute left-3 right-[72px] top-[var(--map-panel-top)] z-20 flex w-fit max-w-[calc(100vw-84px)] items-center gap-3 rounded-md bg-[var(--workspace-surface)]/95 px-3 text-[13px] leading-5 text-[var(--workspace-muted)] lg:left-[316px] lg:right-[84px] lg:max-w-[min(560px,calc(100vw-400px))]";
  if (!loading && connectionOk && status?.available && (zoomRequired || coverage?.state === "busy" || isLive)) {
    const busy = coverage?.state === "busy";
    const limited = vesselsTotal > vesselCount;
    if (!zoomRequired && !busy && coverage?.subscribed && vesselCount > 0 && !limited) return null;
    const message = zoomRequired
      ? vesselCount > 0 ? "Saved positions. Zoom in for live updates." : "Zoom into a port or coast to receive AIS."
      : busy ? "Live capacity reached. Retrying automatically."
      : !coverage?.subscribed ? "Connecting to this area…"
      : limited ? `${vesselCount.toLocaleString()} of ${vesselsTotal.toLocaleString()} vessels shown. Zoom to see the rest.`
      : "Waiting for AIS reports in this area.";
    return (
      <section role="status" aria-label="Map coverage" className={`${noteStyle} py-2`}>
        <p>{message}</p>
      </section>
    );
  }

  const needsSetup = connectionOk && status?.available === false;
  const unavailable = !loading && (!connectionOk || needsSetup || (status !== null && !isLive));
  const title = loading ? "Connecting to AIS…"
    : !connectionOk ? "AIS unavailable."
    : needsSetup ? "AIS not connected."
    : !status ? "Checking AIS connection…"
    : isLive ? "Waiting for vessels." : "AIS disconnected.";
  const description = loading
    ? IS_FREE_HOSTED_API ? "Startup can take a minute." : null
    : needsSetup
      ? vesselCount > 0 ? "Saved positions only." : null
    : !connectionOk || (status && !isLive)
      ? IS_FREE_HOSTED_API ? "Reconnecting; allow about a minute." : "Reconnecting automatically."
      : null;

  return (
    <section role="status" aria-label="Live data status" className={`${noteStyle} ${unavailable ? "py-1" : "py-2"}`}>
      <p className="min-w-0 py-1"><span className="font-medium text-[var(--workspace-ink)]">{title}</span>{description && <> {description}</>}</p>
      {unavailable && (
        <button type="button" onClick={onDemo} aria-label="View demo with simulated traffic" className="min-h-11 shrink-0 text-xs text-[var(--workspace-ink)] underline underline-offset-4 hover:no-underline">
          View demo
        </button>
      )}
    </section>
  );
}

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
  const placement = "absolute left-3 right-[72px] top-[124px] z-20 w-fit max-w-[calc(100vw-84px)] lg:left-[316px] lg:right-[84px] lg:top-4";
  const noteStyle = `${placement} border-b border-[var(--workspace-border,#d2d7d6)] bg-[var(--workspace-surface,#fafaf7)] px-3 py-2 text-xs leading-5 text-[var(--workspace-muted,#596970)] lg:max-w-[min(560px,calc(100vw-400px))]`;
  if (!loading && connectionOk && status?.available && (zoomRequired || coverage?.state === "busy" || isLive)) {
    const busy = coverage?.state === "busy";
    const limited = vesselsTotal > vesselCount;
    if (!zoomRequired && !busy && coverage?.subscribed && vesselCount > 0 && !limited) return null;
    return (
      <section role="status" aria-label="Map coverage" className={noteStyle}>
        <h2 className="inline font-medium text-[var(--workspace-text,#203039)]">{zoomRequired ? (vesselCount > 0 ? "Recent AIS positions." : "Choose a coast or port.") : busy ? "Live updates at capacity." : !coverage?.subscribed ? "Connecting to this area." : limited ? `Showing ${vesselCount.toLocaleString()} of ${vesselsTotal.toLocaleString()} vessels.` : "Waiting for AIS reports."}</h2>{" "}
        <p className="inline">{zoomRequired
          ? vesselCount > 0 ? `${vesselCount.toLocaleString()}${limited ? ` of ${vesselsTotal.toLocaleString()}` : ""} saved positions shown. Zoom in for live updates.` : "Zoom into an area to receive AIS reports."
          : busy ? "The free service is handling other map views. This area will retry automatically."
          : limited ? "Zoom in to see more detail. Coverage follows your map."
          : "Reports appear as AISStream receives them. Coverage varies by location."}</p>
      </section>
    );
  }

  const needsSetup = connectionOk && status?.available === false;
  const unavailable = !loading && (!connectionOk || needsSetup || (status !== null && !isLive));
  const title = loading ? "Connecting to live AIS"
    : !connectionOk
    ? "Live feed unavailable"
    : needsSetup ? "Live AIS isn’t configured"
    : !status ? "Checking feed status"
    : isLive ? "Waiting for vessels" : "Live feed is disconnected";
  const description = loading
    ? IS_FREE_HOSTED_API
      ? "The service sleeps when idle. Startup can take about a minute."
      : "Waiting for the AIS service to respond."
    : needsSetup
      ? "This deployment has no live data connection. The demo is available below."
    : !connectionOk || (status && !isLive)
    ? vesselCount > 0
      ? "Showing the last received positions. Reconnecting automatically."
      : "No live positions are available. Reconnecting automatically."
    : !status
      ? "The stream status could not be confirmed. Checking again automatically."
      : "Connected. Waiting for the first vessel reports in this area.";

  return (
    <section role="status" aria-label="Live data status" className={unavailable ? `${placement} border border-[var(--workspace-border,#d2d7d6)] bg-[var(--workspace-surface,#fafaf7)] p-4 text-[var(--workspace-text,#203039)] lg:max-w-[360px]` : noteStyle}>
      <h2 className={unavailable ? "text-sm font-medium" : "inline font-medium text-[var(--workspace-text,#203039)]"}>{title}{!unavailable && "."}</h2>{!unavailable && " "}
      <p className={unavailable ? "mt-2 text-xs leading-5 text-[var(--workspace-muted,#596970)]" : "inline"}>{description}</p>
      {!loading && !connectionOk && IS_FREE_HOSTED_API && (
        <p className="mt-2 text-xs leading-5 text-[var(--workspace-muted,#596970)]">Free hosting sleeps when idle. Allow about a minute to reconnect.</p>
      )}
      {unavailable && <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--workspace-border,#d2d7d6)] pt-3">
        <button type="button" onClick={onDemo} className="min-h-11 border border-[var(--workspace-border,#d2d7d6)] px-3 text-sm font-medium hover:bg-[var(--workspace-hover,#eef0ec)]">
          Open demo
        </button>
        <span className="text-xs text-[var(--workspace-muted,#596970)]">Simulated traffic</span>
      </div>}
    </section>
  );
}

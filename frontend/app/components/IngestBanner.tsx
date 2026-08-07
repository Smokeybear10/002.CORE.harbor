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
  if (!loading && connectionOk && status?.available && (zoomRequired || coverage?.state === "busy" || isLive)) {
    const busy = coverage?.state === "busy";
    const limited = vesselsTotal > vesselCount;
    if (!zoomRequired && !busy && coverage?.subscribed && vesselCount > 0 && !limited) return null;
    return (
      <section role="status" aria-label="Map coverage" className="absolute left-3 top-[var(--map-panel-top)] z-20 w-[350px] max-w-[calc(100vw-72px)] rounded border border-[var(--workspace-border)] bg-[var(--workspace-surface)] p-4">
        <h2 className="text-sm font-medium text-slate-100">{zoomRequired ? (vesselCount > 0 ? `Showing ${vesselCount}${limited ? ` of ${vesselsTotal}` : ""} saved vessels` : "Choose a coast or port") : busy ? "Live map is busy" : !coverage?.subscribed ? "Connecting to this area" : limited ? `Showing ${vesselCount} of ${vesselsTotal} vessels` : "Listening for vessel reports"}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{zoomRequired
          ? vesselCount > 0 ? "Previously received AIS positions. Select a vessel to inspect it, or zoom in for live updates." : "Zoom in anywhere to receive live AIS. Saved positions will appear here as reports arrive."
          : busy ? "The free service is handling other map views. This area will retry automatically."
          : limited ? "Zoom in to see more detail. Coverage follows your map."
          : "Reports appear as AISStream receives them. Coverage varies by location."}</p>
      </section>
    );
  }

  const needsSetup = connectionOk && status?.available === false;
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
    <section role="status" aria-label="Live data status" className="absolute left-3 top-[var(--map-panel-top)] z-20 w-[350px] max-w-[calc(100vw-72px)] rounded border border-[var(--workspace-border)] bg-[var(--workspace-surface)] p-4">
      <h2 className="text-sm font-medium text-slate-100">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
      {!loading && !connectionOk && IS_FREE_HOSTED_API && (
        <p className="mt-2 text-xs leading-relaxed text-slate-400">Free hosting sleeps when idle. Allow about a minute to reconnect.</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--workspace-border)] pt-3">
        <button type="button" onClick={onDemo} className="min-h-11 rounded border border-[var(--workspace-border)] bg-white/[0.06] px-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.1]">
          Open demo
        </button>
        <span className="text-xs text-slate-400">Simulated traffic</span>
      </div>
    </section>
  );
}

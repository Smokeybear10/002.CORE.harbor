"use client";

import { IS_FREE_HOSTED_API, type IngestionStatus } from "@/app/lib/api";
import { useDataSource } from "@/app/lib/data-source";

type IngestBannerProps = {
  vesselCount: number;
  status: IngestionStatus | null;
  isLive: boolean;
  connectionOk: boolean;
  loading: boolean;
  onDemo: () => void;
};

export default function IngestBanner({ vesselCount, status, isLive, connectionOk, loading, onDemo }: IngestBannerProps) {
  const { isDemo } = useDataSource();
  if (isDemo || (!loading && connectionOk && isLive && vesselCount > 0)) return null;

  const needsSetup = connectionOk && status?.available === false;
  const title = loading ? "Connecting to live AIS"
    : !connectionOk
    ? "Live feed unavailable"
    : needsSetup ? "Live AIS isn’t configured"
    : !status ? "Live feed status is unavailable"
    : isLive ? "Waiting for vessels" : "Live feed is disconnected";
  const reason = !connectionOk ? "The AIS service isn’t responding." : "The AIS stream is disconnected.";
  const description = loading
    ? IS_FREE_HOSTED_API
      ? "The live service sleeps when idle and can take about a minute to wake. Explore the harbor simulation while it connects."
      : "Checking the AIS connection. You can explore the harbor simulation while you wait."
    : needsSetup
      ? "A live data connection hasn’t been set up for this deployment. The live demo lets you follow simulated vessel tracks and review alerts."
    : !connectionOk || (status && !isLive)
    ? vesselCount > 0
      ? `${reason} Positions are from the last connection. Open the live demo to explore a running harbor simulation.`
      : `${reason} The live demo lets you follow vessel tracks and review alerts in a simulated harbor.`
    : !status
      ? "We can’t confirm whether AIS updates are arriving. Explore the live demo while the connection is checked."
      : "The AIS connection is open, but no vessel reports have arrived. Explore the live demo while you wait.";

  return (
    <section role="status" aria-label="Live data status" className="absolute left-3 top-[var(--map-panel-top)] z-20 w-[370px] max-w-[calc(100vw-72px)] rounded-lg border border-white/[0.12] bg-[#101722] p-5 shadow-lg motion-safe:animate-[fade-in-up_200ms_ease-out]">
      <h2 className="text-base font-medium tracking-tight text-slate-100">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
      {!loading && !connectionOk && IS_FREE_HOSTED_API && (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">This service uses free hosting. If it’s asleep, startup can take about a minute.</p>
      )}
      <button type="button" onClick={onDemo} className="mt-5 flex min-h-11 w-full items-center justify-between gap-3 rounded-md bg-slate-200 px-3.5 text-sm font-medium text-slate-900 transition-colors hover:bg-white">
        Open live demo
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
      </button>
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-300 motion-safe:animate-pulse" />
        {needsSetup ? "Simulation available" : loading ? "Checking connection" : isLive ? "Listening for vessel reports" : "Reconnecting automatically"}
      </div>
    </section>
  );
}

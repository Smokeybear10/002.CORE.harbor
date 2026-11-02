"use client";

import { useState, useRef, useEffect } from "react";
import type { Region, MapCoverage } from "@/app/lib/api";
import type { DataMode } from "@/app/lib/api";
import { useDataSource } from "@/app/lib/data-source";
import { DEMO_DURATION_MS, DEMO_PLAYBACK_RATE } from "@/app/lib/demo-api";
import Link from "next/link";

type FloatingChromeProps = {
  regions: Record<string, Region>;
  activeRegion: string | null;
  onSelectRegion: (key: string | null) => void;
  vesselCount: number;
  coverage: MapCoverage | null;
  zoomRequired: boolean;
  lastReportAt: string | null;
  onModeChange: (mode: DataMode) => void;
  isLive: boolean;
  loading: boolean;
  statusKnown: boolean;
  connectionOk: boolean;
  onToggleAnalytics: () => void;
  analyticsOpen: boolean;
  onOpenCommandPalette: () => void;
}

const REGION_ABBREV: Record<string, string> = {
  la_harbor: "LA / Long Beach",
  taiwan_strait: "Taiwan Strait",
  south_china_sea: "South China Sea",
  strait_of_malacca: "Malacca",
  strait_of_hormuz: "Hormuz",
  black_sea: "Black Sea",
  sea_of_azov: "Azov",
  english_channel: "English Channel",
  eastern_med: "Eastern Mediterranean",
};

function shortName(key: string, name: string): string {
  return REGION_ABBREV[key] ?? name;
}

export default function FloatingChrome({
  regions,
  activeRegion,
  onSelectRegion,
  vesselCount,
  coverage,
  zoomRequired,
  lastReportAt,
  onModeChange,
  isLive,
  loading,
  statusKnown,
  connectionOk,
  onToggleAnalytics,
  analyticsOpen,
  onOpenCommandPalette,
}: FloatingChromeProps) {
  const { api, mode, isDemo } = useDataSource();
  const [regionOpen, setRegionOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [countsLoading, setCountsLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const regionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isDemo) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isDemo]);

  useEffect(() => {
    if (!regionOpen) return;
    const handler = (e: MouseEvent) => {
      if (regionMenuRef.current && !regionMenuRef.current.contains(e.target as Node)) {
        setRegionOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setRegionOpen(false);
    };
    window.addEventListener("mousedown", handler);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handler);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [regionOpen]);

  // Lazy-fetch vessel counts per region when dropdown opens. Refresh every 30s while open.
  useEffect(() => {
    if (!regionOpen || !isDemo) return;
    const keys = Object.keys(regions);
    if (keys.length === 0) return;
    let cancelled = false;

    const fetchCounts = async () => {
      setCountsLoading(true);
      try {
        const results = await Promise.all(
          keys.map(async (key) => {
            try {
              const r = await api.getVessels(key, 1, 0);
              return [key, r.total] as const;
            } catch {
              return [key, null] as const;
            }
          }),
        );
        if (cancelled) return;
        const next: Record<string, number | null> = {};
        for (const [k, n] of results) next[k] = n;
        setCounts(next);
      } finally {
        if (!cancelled) setCountsLoading(false);
      }
    };

    fetchCounts();
    const id = isDemo ? undefined : setInterval(fetchCounts, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [api, isDemo, regionOpen, regions]);

  const countValues = Object.values(counts);
  const totalCount = countValues.length > 0 && countValues.every((n) => n !== null)
    ? countValues.reduce<number>((sum, n) => sum + (n ?? 0), 0)
    : null;

  const activeLabel = activeRegion
    ? shortName(activeRegion, regions[activeRegion]?.name ?? activeRegion)
    : isDemo ? "All regions" : zoomRequired ? "World map" : "Map area";

  const controlClass = "flex min-h-11 min-w-11 items-center gap-2 rounded-sm px-3 text-sm text-[var(--workspace-ink)] transition-colors hover:bg-[var(--workspace-subtle)] disabled:cursor-not-allowed disabled:opacity-40";
  const reportTime = lastReportAt ? Date.parse(/[Zz]$|[+-]\d{2}:\d{2}$/.test(lastReportAt) ? lastReportAt : `${lastReportAt}Z`) : NaN;
  const reportAge = Number.isFinite(reportTime) ? Math.max(0, Math.floor((now - reportTime) / 1000)) : null;
  const receiving = !loading && !zoomRequired && connectionOk && isLive && coverage?.subscribed && reportAge !== null && reportAge < 120;
  const statusLabel = loading ? (isDemo ? "Loading simulation" : "Connecting to AIS…")
    : isDemo ? "Simulated traffic"
    : !connectionOk ? "AIS offline"
    : zoomRequired ? "Saved AIS positions"
    : !statusKnown ? "AIS status unavailable"
    : !isLive ? "AIS disconnected"
    : coverage?.state === "busy" ? "Waiting for capacity"
    : !coverage?.subscribed ? "Connecting to area"
    : receiving ? "Receiving AIS"
    : reportAge === null ? "Waiting for reports" : "No recent AIS reports";
  const reportAgeLabel = reportAge === null ? null : reportAge < 60 ? `${reportAge}s ago` : reportAge < 3600 ? `${Math.floor(reportAge / 60)}m ago` : `${Math.floor(reportAge / 3600)}h ago`;

  return (
    <>
      <header aria-label="Map controls" className="chart-sidebar-header absolute left-0 right-0 top-0 z-30 grid h-28 grid-cols-[1fr_auto_auto_auto] grid-rows-[44px_44px] gap-x-1 gap-y-2 border-b border-[var(--workspace-border)] bg-[var(--workspace-surface)] px-3 py-2 lg:right-auto lg:h-[245px] lg:w-[300px] lg:grid-cols-2 lg:grid-rows-[repeat(4,44px)] lg:gap-x-2 lg:border-r lg:px-5 lg:py-5">
        <div className="col-start-1 row-start-1 flex min-w-0 items-center justify-between gap-1 lg:col-span-2">
          <h2 className="text-lg font-semibold text-[var(--workspace-ink)]">
            <Link href={`/?mode=${mode}`} aria-label="Vessel map" className="inline-flex min-h-11 items-center">Vessels</Link>
          </h2>
          {isDemo && <button type="button" aria-label="Connect to live AIS" onClick={() => onModeChange("live")} className="min-h-11 shrink-0 px-2 text-xs text-[var(--workspace-muted)] underline underline-offset-4 hover:text-[var(--workspace-ink)]">Use live</button>}
        </div>

        <div ref={regionMenuRef} className="relative col-span-4 col-start-1 row-start-2 min-w-0 lg:col-span-2">
          <button
            type="button"
            disabled={Object.keys(regions).length === 0}
            aria-expanded={regionOpen}
            aria-controls="region-options"
            aria-label={`Select region: ${activeLabel}`}
            onClick={() => setRegionOpen((value) => !value)}
            data-tour="regions"
            className={`${controlClass} w-full justify-between border border-[var(--workspace-border)] ${regionOpen ? "bg-[var(--workspace-subtle)]" : ""}`}
          >
            <span className="min-w-0 truncate">{activeLabel}</span>
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={`shrink-0 transition-transform ${regionOpen ? "rotate-180" : ""}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {regionOpen && (
            <div id="region-options" className="absolute left-0 top-[calc(100%+4px)] z-40 max-h-[60dvh] w-full overflow-y-auto rounded-sm border border-[var(--workspace-border)] bg-[var(--workspace-surface)] p-1 shadow-md">
              <div className="border-b border-[var(--workspace-border)] px-3 pb-3 pt-2">
                <h3 className="text-sm font-medium text-[var(--workspace-ink)]">{isDemo ? "Demo area" : "Go to an area"}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--workspace-muted)]">{isDemo ? "Simulated traffic in LA / Long Beach." : "Choose a location or pan the map to receive AIS reports."}</p>
              </div>
              {Object.keys(regions).length > 1 && <RegionItem
                name={isDemo ? "All regions" : "World map"}
                count={totalCount}
                loading={countsLoading && totalCount === null}
                showCount={isDemo}
                active={activeRegion === null}
                onClick={() => { onSelectRegion(null); setRegionOpen(false); }}
              />}
              {Object.keys(regions).map((key) => (
                <RegionItem
                  key={key}
                  name={shortName(key, regions[key].name)}
                  count={counts[key] ?? null}
                  loading={countsLoading && counts[key] == null}
                  showCount={isDemo}
                  active={activeRegion === key}
                  onClick={() => { onSelectRegion(key); setRegionOpen(false); }}
                />
              ))}
              {Object.keys(regions).length === 0 && <p className="px-3 py-2 text-xs text-[var(--workspace-muted)]">Regions will appear when vessel data is available.</p>}
            </div>
          )}
        </div>

        <button type="button" aria-label="Search vessels and commands" disabled={loading || (!connectionOk && vesselCount === 0)} onClick={onOpenCommandPalette} className={`${controlClass} col-start-2 row-start-1 lg:col-span-2 lg:col-start-1 lg:row-start-3 lg:justify-start lg:border lg:border-[var(--workspace-border)]`}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-5-5" /></svg>
          <span className="hidden sm:inline">Search<span className="hidden lg:inline"> vessels</span></span>
          <kbd className="ml-auto hidden text-xs text-[var(--workspace-muted)] lg:inline">⌘K</kbd>
        </button>
        <button type="button" data-tour="analytics-btn" aria-label="Analytics" disabled={(loading || !connectionOk) && !analyticsOpen} aria-pressed={analyticsOpen} onClick={onToggleAnalytics} className={`${controlClass} col-start-3 row-start-1 lg:col-start-1 lg:row-start-4 ${analyticsOpen ? "bg-[var(--workspace-subtle)]" : ""}`}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-5" /></svg>
          <span className="hidden lg:inline">Analytics</span>
        </button>
        <Link href="/docs" className={`${controlClass} col-start-4 row-start-1 lg:col-start-2 lg:row-start-4`}>Docs</Link>
      </header>

      <section aria-label="AIS feed status" className="chart-status-bar absolute bottom-0 left-0 right-0 z-30 flex h-8 items-center justify-between gap-3 border-t border-[var(--workspace-border)] bg-[var(--workspace-surface)] px-3 text-[11px] text-[var(--workspace-muted)] sm:text-xs lg:left-[300px] lg:px-4">
        <span role="status" className="min-w-0 truncate" title={statusLabel}>{statusLabel}</span>
        {!loading && (isDemo || reportAgeLabel || vesselCount > 0) && <span className="flex shrink-0 items-center gap-3 whitespace-nowrap tabular-nums">
          <span>{vesselCount.toLocaleString()} {vesselCount === 1 ? "vessel" : "vessels"}</span>
          {!isDemo && reportAgeLabel && <time aria-label={`Last AIS report ${reportAgeLabel}`} dateTime={new Date(reportTime).toISOString()} title={`Last AIS report: ${new Date(reportTime).toUTCString()}`}>Updated {reportAgeLabel}</time>}
        </span>}
      </section>
    </>
  );
}

function RegionItem({
  name,
  count,
  loading,
  active,
  onClick,
  showCount = true,
}: {
  name: string;
  count: number | null;
  loading: boolean;
  active: boolean;
  onClick: () => void;
  showCount?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group min-h-11 w-full flex items-center justify-between gap-3 px-3 py-2 rounded-sm text-[13px] transition-colors ${
        active ? "bg-[var(--workspace-subtle)] text-[var(--workspace-ink)]" : "text-[var(--workspace-muted)] hover:bg-[var(--workspace-subtle)]"
      }`}
    >
      <span className="font-medium truncate">{name}</span>
      <span className="flex items-center gap-2 shrink-0">
        {showCount && <span
          className="text-xs tabular-nums text-[var(--workspace-muted)]"
        >
          {loading ? "…" : count != null ? count.toLocaleString() : "—"}
        </span>}
        {active && (
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-[var(--workspace-ink)]">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </span>
    </button>
  );
}

export function DemoPlayback({ elapsed, paused, loading, onToggle }: {
  elapsed: number;
  paused: boolean;
  loading: boolean;
  onToggle: () => void;
}) {
  const finished = elapsed >= DEMO_DURATION_MS;
  const time = `${Math.floor(elapsed / 60_000).toString().padStart(2, "0")}:${Math.floor(elapsed / 1000 % 60).toString().padStart(2, "0")}`;
  const action = finished ? "Replay" : paused ? "Play" : "Pause";
  return (
    <section aria-label="Demo playback" className="chart-playback absolute bottom-[var(--playback-bottom)] left-3 right-3 z-30 overflow-hidden rounded-sm border border-[var(--workspace-border)] bg-[var(--workspace-surface)] sm:left-1/2 sm:right-auto sm:w-[400px] sm:-translate-x-1/2 lg:left-[calc(50%+150px)]">
      <div className="flex min-h-[68px] items-center gap-3 px-3 sm:px-4">
        <button type="button" onClick={onToggle} aria-label={`${action} demo playback`} title={`${action} demo playback`} disabled={loading} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-[var(--workspace-border)] text-[var(--workspace-ink)] transition-colors hover:bg-[var(--workspace-subtle)] disabled:opacity-40">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">{paused || finished ? <path d="M4 2.5 13 8l-9 5.5z" /> : <path d="M4 3h3v10H4zm5 0h3v10H9z" />}</svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--workspace-ink)]">{finished ? "Scenario complete" : paused ? "Demo paused" : "Simulated traffic"}</p>
          <p className="mt-0.5 truncate text-xs text-[var(--workspace-muted)]">LA / Long Beach · {DEMO_PLAYBACK_RATE}× playback</p>
        </div>
        <span aria-label={`Scenario playback ${time} of ${DEMO_DURATION_MS / 60_000} minutes`} className="shrink-0 text-xs tabular-nums text-[var(--workspace-ink)]">{time}<span className="hidden text-[var(--workspace-muted)] sm:inline"> / {DEMO_DURATION_MS / 60_000}:00</span></span>
      </div>
      <div aria-hidden="true" className="h-0.5 bg-[var(--workspace-subtle)]"><div className="h-full bg-[var(--workspace-muted)]" style={{ width: `${elapsed / DEMO_DURATION_MS * 100}%` }} /></div>
    </section>
  );
}

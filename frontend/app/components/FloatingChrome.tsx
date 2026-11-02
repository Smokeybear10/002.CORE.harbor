"use client";

import { useState, useRef, useEffect } from "react";
import type { Region } from "@/app/lib/api";
import type { DataMode } from "@/app/lib/api";
import { useDataSource } from "@/app/lib/data-source";
import { DEMO_DURATION_MS, DEMO_PLAYBACK_RATE } from "@/app/lib/demo-api";
import Link from "next/link";

type FloatingChromeProps = {
  regions: Record<string, Region>;
  activeRegion: string | null;
  onSelectRegion: (key: string | null) => void;
  vesselCount: number;
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
  south_china_sea: "S. China Sea",
  strait_of_malacca: "Malacca",
  strait_of_hormuz: "Hormuz",
  black_sea: "Black Sea",
  sea_of_azov: "Azov",
  english_channel: "English Ch.",
  eastern_med: "E. Med",
};

function shortName(key: string, name: string): string {
  return REGION_ABBREV[key] ?? (name.length > 16 ? name.split(/[\s_-]/)[0] : name);
}

export default function FloatingChrome({
  regions,
  activeRegion,
  onSelectRegion,
  vesselCount,
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
  const regionMenuRef = useRef<HTMLDivElement | null>(null);

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
    if (!regionOpen) return;
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
    : "All monitored regions";

  const controlClass = "min-h-11 min-w-11 disabled:cursor-not-allowed disabled:opacity-40 items-center justify-center gap-2 rounded-md px-3 text-[13px] text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white";
  const statusLabel = loading ? (isDemo ? "Loading demo" : "Connecting to AIS") : isDemo ? "Demo · simulated traffic" : !connectionOk ? "Live data offline" : !statusKnown ? "Feed status unavailable" : isLive ? "Live AIS connected" : "AIS feed disconnected";
  const statusColor = isDemo ? "bg-slate-400" : !connectionOk ? "bg-amber-400" : isLive ? "bg-emerald-400" : "bg-slate-400";

  return (
    <header aria-label="Map controls" className="absolute inset-x-0 top-0 z-30 border-b border-[var(--workspace-border)] bg-[var(--workspace-surface)] px-3 py-2 sm:px-4">
      <div className="flex flex-wrap items-center gap-1 sm:flex-nowrap sm:gap-2">
      <Link href={`/?mode=${mode}`} aria-label="H4BOR map" className="order-1 inline-flex min-h-11 shrink-0 items-center pr-2 text-slate-100 sm:mr-1 sm:border-r sm:border-[var(--workspace-border)] sm:pr-5">
        <span className="font-mono text-[15px] font-semibold tracking-[0.08em]">H4BOR</span>
      </Link>

      <div className="order-7 w-full sm:hidden" />

      <div ref={regionMenuRef} className="relative order-8 sm:order-2">
        <button
          type="button"
          disabled={Object.keys(regions).length === 0}
          aria-expanded={regionOpen}
          aria-controls="region-options"
          aria-label={`Select region: ${activeLabel}`}
          onClick={() => setRegionOpen((v) => !v)}
          data-tour="regions"
          className={`inline-flex ${controlClass} ${regionOpen ? "bg-white/[0.06] text-white" : ""}`}
        >
          <span className="max-w-[150px] truncate font-medium sm:max-w-[180px]">{activeLabel}</span>
          <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`shrink-0 text-slate-400 transition-transform ${regionOpen ? "rotate-180" : ""}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {regionOpen && (
          <div id="region-options" className="absolute top-[calc(100%+8px)] left-0 max-h-[60dvh] w-[280px] max-w-[calc(100vw-40px)] overflow-y-auto rounded border border-[var(--workspace-border)] bg-[var(--workspace-surface)] p-1.5 shadow-lg">
            <div className="border-b border-[var(--workspace-border)] px-3 pb-3 pt-2">
              <h2 className="text-sm font-medium text-slate-200">{isDemo ? "Demo coverage" : "Live coverage"}</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{isDemo ? "Simulated vessel traffic in LA / Long Beach." : "Vessel reports are collected in the areas listed below."}</p>
            </div>
            {Object.keys(regions).length > 1 && <RegionItem
              name="All monitored regions"
              count={totalCount}
              loading={countsLoading && totalCount === null}
              active={activeRegion === null}
              onClick={() => { onSelectRegion(null); setRegionOpen(false); }}
            />}
            {Object.keys(regions).map((key) => (
              <RegionItem
                key={key}
                name={shortName(key, regions[key].name)}
                count={counts[key] ?? null}
                loading={countsLoading && counts[key] == null}
                active={activeRegion === key}
                onClick={() => { onSelectRegion(key); setRegionOpen(false); }}
              />
            ))}
            {Object.keys(regions).length === 0 && (
              <p className="px-3 py-2 text-xs leading-relaxed text-slate-400">Regions will appear when vessel data is available.</p>
            )}
          </div>
        )}
      </div>

      <button type="button" aria-label="Search vessels and commands" disabled={loading || (!connectionOk && vesselCount === 0)} onClick={onOpenCommandPalette} className={`inline-flex ${controlClass} order-2 ml-auto sm:order-3 sm:ml-0 sm:justify-start lg:w-[210px] lg:border lg:border-[var(--workspace-border)] lg:bg-white/[0.025]`}>
        <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-5-5" />
        </svg>
        <span className="hidden lg:inline">Search vessels</span>
        <kbd className="ml-auto hidden rounded border border-white/[0.1] px-1.5 py-0.5 font-mono text-[10px] text-slate-400 xl:inline">⌘K</kbd>
      </button>
      <div className="order-4 hidden flex-1 sm:block" />
      <div role="status" className="order-9 ml-auto flex min-h-11 items-center gap-2 px-2 text-xs text-slate-400 sm:order-5 sm:ml-0">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusColor}`} />
        <span className="hidden lg:inline">{statusLabel}</span>
        <span className="lg:hidden">{loading ? "Connecting…" : isDemo ? "Demo" : !connectionOk ? "AIS offline" : !statusKnown ? "Status unknown" : isLive ? "Live AIS" : "AIS disconnected"}</span>
        {!loading && connectionOk && <span className="hidden border-l border-[var(--workspace-border)] pl-2 xl:inline">{vesselCount} vessels</span>}
      </div>
      <button type="button" data-tour="analytics-btn" aria-label="Analytics" disabled={(loading || !connectionOk) && !analyticsOpen} aria-pressed={analyticsOpen} onClick={onToggleAnalytics} className={`inline-flex ${controlClass} order-3 sm:order-6 ${analyticsOpen ? "bg-white/[0.08] text-white" : ""}`}>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-5" />
        </svg>
        <span className="hidden lg:inline">Analytics</span>
      </button>
      <Link href="/docs" className={`hidden lg:inline-flex ${controlClass} sm:order-7`}>Docs</Link>
      {isDemo && <button type="button" aria-label="Try live" title="Connect to live AIS" onClick={() => onModeChange("live")} className={`inline-flex ${controlClass} order-4 shrink-0 sm:order-8`}>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M7 7h10M9 3v4m6-4v4m-8 0v5a5 5 0 0 0 10 0V7m-5 10v4" /></svg>
        <span className="hidden sm:inline">Try live</span>
      </button>}
      </div>
    </header>
  );
}

function RegionItem({
  name,
  count,
  loading,
  active,
  onClick,
}: {
  name: string;
  count: number | null;
  loading: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`group min-h-11 w-full flex items-center justify-between gap-3 px-3 py-2 rounded-sm text-[13px] transition-colors ${
        active ? "bg-white/[0.06] text-slate-100" : "text-slate-300 hover:bg-white/[0.03]"
      }`}
    >
      <span className="font-medium truncate">{name}</span>
      <span className="flex items-center gap-2 shrink-0">
        <span
          className="font-mono text-xs tabular-nums text-slate-400"
        >
          {loading ? "…" : count != null ? count.toLocaleString() : "—"}
        </span>
        {active && (
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-slate-200">
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
    <section aria-label="Demo playback" className="absolute bottom-[var(--playback-bottom)] left-3 right-3 z-30 overflow-hidden rounded border border-[var(--workspace-border)] bg-[var(--workspace-surface)] sm:left-1/2 sm:right-auto sm:w-[400px] sm:-translate-x-1/2">
      <div className="flex min-h-[68px] items-center gap-3 px-3 sm:px-4">
        <button type="button" onClick={onToggle} aria-label={`${action} demo playback`} title={`${action} demo playback`} disabled={loading} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white/[0.08] text-slate-100 transition-colors hover:bg-white/[0.14] disabled:opacity-40">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">{paused || finished ? <path d="M4 2.5 13 8l-9 5.5z" /> : <path d="M4 3h3v10H4zm5 0h3v10H9z" />}</svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-slate-200">{finished ? "Scenario complete" : paused ? "Demo paused" : "Harbor simulation"}</p>
          <p className="mt-0.5 truncate text-xs text-slate-400">Simulated traffic · {DEMO_PLAYBACK_RATE}× playback</p>
        </div>
        <span aria-label={`Scenario playback ${time} of ${DEMO_DURATION_MS / 60_000} minutes`} className="shrink-0 font-mono text-xs tabular-nums text-slate-300">{time}<span className="hidden text-slate-400 sm:inline"> / {DEMO_DURATION_MS / 60_000}:00</span></span>
      </div>
      <div aria-hidden="true" className="h-0.5 bg-white/[0.06]"><div className="h-full bg-slate-400" style={{ width: `${elapsed / DEMO_DURATION_MS * 100}%` }} /></div>
    </section>
  );
}

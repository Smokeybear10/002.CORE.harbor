"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { Alert, Vessel, Region } from "@/app/lib/api";

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  alerts: Alert[];
  vessels: Vessel[];
  regions: Record<string, Region>;
  activeRegion: string | null;
  onSelectAlert: (alert: Alert) => void;
  onSelectVessel: (id: string) => void;
  onSelectRegion: (key: string | null) => void;
  onToggleAnalytics: () => void;
};

type Result =
  | { kind: "region"; key: string; label: string }
  | { kind: "alert"; alert: Alert }
  | { kind: "vessel"; vessel: Vessel }
  | { kind: "action"; label: string; run: () => void };

function resultGroup(result: Result): string {
  return result.kind === "region" ? "Locations" : result.kind === "action" ? "Tools" : "Vessels";
}

function resultKey(result: Result): string {
  if (result.kind === "region") return `region:${result.key}`;
  if (result.kind === "alert") return `alert:${result.alert.id}`;
  if (result.kind === "vessel") return `vessel:${result.vessel.id}`;
  return `action:${result.label}`;
}

export default function CommandPalette({
  open, onClose, alerts, vessels, regions, activeRegion, onSelectAlert, onSelectVessel, onSelectRegion, onToggleAnalytics,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const keyboardNavigation = useRef(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    keyboardNavigation.current = true;
    inputRef.current?.focus();
    inputRef.current?.select();
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const matches = (text: string | null) => (text ?? "").toLowerCase().includes(q);
    const seenVessels = new Set<string>();
    const vesselResults: Result[] = [];

    for (const vessel of vessels) {
      if (q && !matches(vessel.name) && !matches(vessel.mmsi)) continue;
      if (seenVessels.has(vessel.id)) continue;
      seenVessels.add(vessel.id);
      vesselResults.push({ kind: "vessel", vessel });
    }
    for (const alert of alerts) {
      if (seenVessels.has(alert.vessel_id)) continue;
      if (q && !matches(alert.vessel_name) && !matches(alert.vessel_mmsi)
        && !alert.anomaly_signals.some((signal) => matches(signal.anomaly_type.replace(/_/g, " ")))) continue;
      seenVessels.add(alert.vessel_id);
      vesselResults.push({ kind: "alert", alert });
    }

    const locations: Result[] = Object.entries(regions)
      .filter(([key, region]) => key !== activeRegion && (!q || matches(region.name)))
      .map(([key, region]) => ({ kind: "region", key, label: region.name }));
    const actions: Array<Extract<Result, { kind: "action" }>> = [
      { kind: "action", label: "Analytics", run: onToggleAnalytics },
    ];
    if (Object.keys(regions).length > 1) {
      actions.push({ kind: "action", label: "World map", run: () => onSelectRegion(null) });
    }
    return [
      ...vesselResults.slice(0, q ? 24 : 5),
      ...locations,
      ...actions.filter((action) => !q || matches(action.label)),
    ];
  }, [query, alerts, vessels, regions, activeRegion, onSelectRegion, onToggleAnalytics]);

  const selectedIndex = Math.min(selected, Math.max(0, results.length - 1));

  useEffect(() => {
    if (!open || !keyboardNavigation.current) return;
    listRef.current?.querySelector(`[data-result-index="${selectedIndex}"]`)?.scrollIntoView({ block: "nearest" });
    keyboardNavigation.current = false;
  }, [open, selectedIndex]);

  function runResult(result: Result | undefined) {
    if (!result) return;
    if (result.kind === "region") onSelectRegion(result.key);
    if (result.kind === "alert") onSelectAlert(result.alert);
    if (result.kind === "vessel") onSelectVessel(result.vessel.id);
    if (result.kind === "action") result.run();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-[#203039]/20 px-3 py-4 sm:px-6 sm:pt-[12dvh]" onMouseDown={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-search-title"
        className="workspace-search relative flex max-h-[calc(100dvh-32px)] w-full max-w-[560px] flex-col overflow-hidden rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-surface)] text-[var(--workspace-ink)] shadow-[0_16px_56px_rgba(20,35,40,0.16)] sm:max-h-[76dvh]"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          }
          if (event.key !== "Tab") return;
          const controls = panelRef.current?.querySelectorAll<HTMLElement>('input, button:not([tabindex="-1"])');
          const first = controls?.[0];
          const last = controls?.[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 px-5 pt-2">
          <label id="map-search-title" htmlFor="map-search-input" className="text-sm font-medium">Search</label>
          <button type="button" onClick={onClose} className="-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded text-sm text-[var(--workspace-muted)] transition-colors hover:bg-[var(--workspace-subtle)] hover:text-[var(--workspace-ink)]" aria-label="Close search">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="m6 6 12 12m0-12L6 18" /></svg>
          </button>
        </div>
        <div className="shrink-0 border-b border-[var(--workspace-border)] px-5 pb-4">
          <input
            id="map-search-input"
            ref={inputRef}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="map-search-results"
            aria-activedescendant={results.length ? `map-search-result-${selectedIndex}` : undefined}
            value={query}
            autoComplete="off"
            onChange={(event) => { setQuery(event.target.value); setSelected(0); listRef.current?.scrollTo({ top: 0 }); }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                event.stopPropagation();
                keyboardNavigation.current = true;
                setSelected(Math.max(0, Math.min(selectedIndex + (event.key === "ArrowDown" ? 1 : -1), results.length - 1)));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                runResult(results[selectedIndex]);
              }
            }}
            placeholder="Vessel name, MMSI or location"
            className="min-h-11 w-full rounded border border-[var(--workspace-border)] bg-[var(--workspace-subtle)] px-3 text-base outline-none placeholder:text-[var(--workspace-muted)] focus:border-[var(--workspace-ink)]"
          />
        </div>
        <div ref={listRef} id="map-search-results" role="listbox" aria-label="Search results" className="min-h-0 overflow-y-auto overscroll-contain py-2">
          {results.length === 0 && <p className="px-5 py-8 text-sm text-[var(--workspace-muted)]">No matches in the loaded vessels or locations.</p>}
          {results.map((result, index) => (
            <div key={resultKey(result)} role="presentation">
              {(index === 0 || resultGroup(result) !== resultGroup(results[index - 1])) && (
                <div role="presentation" className="px-5 pb-1 pt-3 text-xs font-medium text-[var(--workspace-muted)]">{resultGroup(result)}</div>
              )}
              <ResultRow result={result} index={index} selected={index === selectedIndex} onHover={() => setSelected(index)} onRun={() => runResult(result)} />
            </div>
          ))}
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--workspace-border)] px-5 py-3 text-xs text-[var(--workspace-muted)]">
          <span>Vessel results are limited to this map view.</span>
          <span className="hidden shrink-0 sm:inline" aria-hidden="true">↑ ↓ to move · Enter to open</span>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ result, index, selected, onHover, onRun }: {
  result: Result;
  index: number;
  selected: boolean;
  onHover: () => void;
  onRun: () => void;
}) {
  const vessel = result.kind === "vessel" ? result.vessel : null;
  const alert = result.kind === "alert" ? result.alert : null;
  const name = vessel?.name || alert?.vessel_name || (result.kind === "region" || result.kind === "action" ? result.label : "Unknown vessel");
  const mmsi = vessel?.mmsi ?? alert?.vessel_mmsi;

  return (
    <button
      type="button"
      id={`map-search-result-${index}`}
      data-result-index={index}
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      onMouseEnter={onHover}
      onClick={onRun}
      className={`flex min-h-11 w-full items-center justify-between gap-4 px-5 py-2.5 text-left transition-colors ${selected ? "bg-[var(--workspace-subtle)]" : "hover:bg-[var(--workspace-subtle)]"}`}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm">{name}</span>
        {mmsi && <span className="mt-0.5 block text-xs tabular-nums text-[var(--workspace-muted)]">{mmsi}</span>}
      </span>
      {vessel?.vessel_type && <span className="max-w-[35%] shrink-0 truncate text-xs text-[var(--workspace-muted)]">{vessel.vessel_type}</span>}
      {alert && <span className="shrink-0 text-xs text-[var(--workspace-muted)]">Alert</span>}
      {selected && !vessel && !alert && <span aria-hidden="true" className="text-[var(--workspace-muted)]">↵</span>}
    </button>
  );
}

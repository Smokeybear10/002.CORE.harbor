"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDataSource } from "@/app/lib/data-source";

interface FeatureTourProps {
  active: boolean;
  onComplete: () => void;
  onSelectRegion: (region: string | null) => void;
  onSelectVessel: (vesselId: string) => void;
  onDeselectVessel: () => void;
  onToggleAnalytics: () => void;
  onFlyTo: (center: [number, number], zoom: number) => void;
  analyticsOpen: boolean;
  activeRegion: string | null;
}

interface TourStep {
  title: string;
  description: string;
  hint?: string;
  target: string;
  position: "right" | "left" | "bottom" | "top";
  interactive?: boolean;
  extraInteractive?: string[];
  noDim?: boolean;
  nextLabel?: string;
  action?: () => void;
  cleanup?: () => void;
}

const STEP_REGION = 2;

export default function FeatureTour({
  active,
  onComplete,
  onDeselectVessel,
  activeRegion,
}: FeatureTourProps) {
  const { isDemo } = useDataSource();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
  const [transitioning, setTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const prevRegionRef = useRef<string | null>(null);
  const stepRef = useRef(step);
  useEffect(() => { stepRef.current = step; }, [step]);

  const steps: TourStep[] = [
    {
      title: "Vessel map",
      description: "Select a vessel to see its position, identity and report time. Amber, orange and red markers indicate increasing review priority.",
      target: "map",
      position: "left",
      action: onDeselectVessel,
    },
    {
      title: "Traffic density",
      description: "Zoom out to see where vessels are concentrated. Brighter areas mean more traffic, not higher risk. Zoom in to select individual vessels.",
      hint: "Scroll to zoom. Drag to pan.",
      target: "map",
      position: "left",
      interactive: true,
    },
    {
      title: "Coverage",
      description: isDemo ? "This demo replays simulated traffic in LA / Long Beach. Switch to live mode to explore other locations." : "Live AIS follows the area you’re viewing. Pan anywhere in the world and zoom into a coast or port. Reports appear where AISStream has coverage.",
      hint: "Use the region menu to jump to a location.",
      target: "regions",
      position: "bottom",
      interactive: true,
    },
    {
      title: "Alerts",
      description: "Open an alert to review the vessel and the signals behind its score. You can acknowledge it, add a note or dismiss it.",
      hint: "Select an alert when one is available.",
      target: "alerts",
      position: "right",
      interactive: true,
    },
    {
      title: "Analytics",
      description: "Review vessel counts, risk scores and common signals. Scores help prioritize review; they are not threat probabilities.",
      hint: "Open Analytics to inspect the breakdown.",
      target: "analytics-btn",
      position: "left",
      interactive: true,
    },
  ];

  const totalSteps = steps.length;
  const current = steps[step];

  const handleClose = () => {
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    setVisible(false);
    setPaused(false);
    setStep(0);
    onComplete();
  };

  const transition = (nextStep: number) => {
    setTransitioning(true);
    setVisible(false);
    setTimeout(() => setStep(nextStep), 250);
  };

  const goNext = () => {
    if (step >= totalSteps - 1) { handleClose(); return; }
    transition(step + 1);
  };

  const goPrev = () => {
    if (step > 0) transition(step - 1);
  };

  const handleRestart = () => {
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    setPaused(false);
    if (step === 0) {
      const action = steps[0]?.action;
      if (action) action();
      return;
    }
    transition(0);
  };

  const positionElements = useCallback(() => {
    if (!current) return;
    const el = document.querySelector(current.target === "alerts" ? '[aria-label="Alert queue"]' : `[data-tour="${current.target}"]`);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const pad = 8;

    setSpotlightStyle({
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
      borderRadius: 4,
    });

    const tooltipW = Math.min(340, window.innerWidth - 32);
    const tooltipH = tooltipRef.current?.getBoundingClientRect().height ?? 280;
    let top = 0;
    let left = 0;

    switch (current.position) {
      case "right":
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.right + 20;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.left - tooltipW - 20;
        break;
      case "bottom":
        top = rect.bottom + 16;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        break;
      case "top":
        top = rect.top - tooltipH - 16;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        break;
    }

    if (current.target !== "map" && (current.position === "left" || current.position === "right") && (left < 16 || left + tooltipW > window.innerWidth - 16)) {
      top = rect.top - tooltipH - 16 >= 16 ? rect.top - tooltipH - 16 : rect.bottom + 16;
      left = rect.left + rect.width / 2 - tooltipW / 2;
    }

    top = Math.max(16, Math.min(top, window.innerHeight - tooltipH - 16));
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipW - 16));

    setTooltipStyle({ top, left, width: tooltipW });
  }, [current]);

  useEffect(() => {
    if (!active || !current) return;
    if (!current.interactive) return;

    const elevated: { element: HTMLElement; position: string; zIndex: string }[] = [];
    const elevate = (element: HTMLElement) => {
      const layer = element.closest("header") ?? element;
      if (layer.dataset.tour === "map") return;
      elevated.push({ element: layer, position: layer.style.position, zIndex: layer.style.zIndex });
      if (getComputedStyle(layer).position === "static") layer.style.position = "relative";
      layer.style.zIndex = "61";
    };
    const restore = () => {
      elevated.forEach(({ element, position, zIndex }) => {
        element.style.position = position;
        element.style.zIndex = zIndex;
      });
    };
    const el = document.querySelector<HTMLElement>(current.target === "alerts" ? '[aria-label="Alert queue"]' : `[data-tour="${current.target}"]`);
    if (el) elevate(el);

    const timer = current.extraInteractive ? setTimeout(() => {
      current.extraInteractive?.forEach((id) => {
        const extra = document.querySelector<HTMLElement>(`[data-tour="${id}"]`);
        if (extra) elevate(extra);
      });
    }, 500) : undefined;
    return () => { clearTimeout(timer); restore(); };
  }, [active, step, current]);

  // Auto-advance when user picks a region during the region step (suspended while paused)
  useEffect(() => {
    if (!active || paused) return;
    if (stepRef.current !== STEP_REGION) {
      prevRegionRef.current = activeRegion;
      return;
    }
    if (activeRegion && activeRegion !== prevRegionRef.current) {
      const timer = setTimeout(() => {
        transition(stepRef.current + 1);
      }, 1200);
      return () => clearTimeout(timer);
    }
    prevRegionRef.current = activeRegion;
  }, [active, activeRegion, paused]);

  useEffect(() => {
    if (!active || !current) return;

    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (current.action) current.action();
    if (current.cleanup) cleanupRef.current = current.cleanup;

    const timer = setTimeout(() => {
      positionElements();
      setVisible(true);
      setTransitioning(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [active, step]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!active) return;
    const handler = () => positionElements();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [active, positionElements]);

  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('[role="dialog"]')) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); handleClose(); return; }
      if (paused) return;
      if (e.key === " " && e.target instanceof HTMLElement && e.target.closest("button, a")) return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  });

  if (!active) return null;

  const isInteractive = current?.interactive;
  const isNoDim = current?.noDim;

  return (
    <div className="fixed inset-0 z-[60]" style={{ pointerEvents: "none" }}>
      {!isNoDim && (
        <>
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0, pointerEvents: "none" }}
          >

            <div
              className="absolute transition-all duration-500 ease-out"
              style={{
                ...spotlightStyle,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.50)",
                border: "1px solid rgba(148,163,184,0.5)",
                zIndex: 1,
                pointerEvents: "none",
              }}
            />
          </div>

          {!isInteractive && !paused && (
            <div className="absolute inset-0" style={{ zIndex: 2, pointerEvents: "auto" }} onClick={(e) => e.stopPropagation()} />
          )}
        </>
      )}

      <div
        ref={tooltipRef}
        role="region"
        aria-label="Map guide"
        className={`w-[min(340px,calc(100vw-32px))] max-h-[calc(100dvh-32px)] overflow-y-auto ${isNoDim ? "fixed z-10" : "absolute z-10"}`}
        style={isNoDim
          ? {
              bottom: 32,
              left: "50%",
              transform: visible && !transitioning ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(8px)",
              width: Math.min(420, window.innerWidth - 32),
              pointerEvents: "auto",
              transition: "opacity 300ms ease, transform 300ms ease",
              opacity: visible && !transitioning ? 1 : 0,
            }
          : {
              ...tooltipStyle,
              pointerEvents: "auto",
              transition: "opacity 300ms ease, transform 300ms ease",
              opacity: visible && !transitioning ? 1 : 0,
              transform: visible && !transitioning ? "translateY(0)" : "translateY(8px)",
            }
        }
      >
        <div className="bg-[var(--workspace-surface)] border border-[var(--workspace-border)] rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-400">
              Map guide{" "}
              <span className="text-slate-400">{step + 1} / {totalSteps}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? "Resume guide" : "Pause guide"}
                title={paused ? "Resume" : "Pause"}
                className="flex h-11 w-11 items-center justify-center text-slate-400 hover:text-slate-100 transition-colors rounded hover:bg-white/5"
              >
                {paused ? (
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleRestart}
                aria-label="Restart guide"
                title="Begin again"
                className="flex h-11 w-11 items-center justify-center text-slate-400 hover:text-slate-100 transition-colors rounded hover:bg-white/5"
              >
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>
              <button
                onClick={handleClose}
                aria-label="Close guide"
                title="Close"
                className="flex h-11 w-11 items-center justify-center text-slate-400 hover:text-slate-100 transition-colors rounded hover:bg-white/5"
              >
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <h3 className="text-base font-medium text-slate-100 mb-2">
            {paused ? "Paused" : current?.title}
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed mb-1">
            {paused
              ? "Explore the map. Resume the guide when ready."
              : current?.description}
          </p>

          {!paused && current?.hint && (
            <p className="text-xs text-slate-400 mt-3 mb-4 flex items-center gap-1.5">
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
              </svg>
              {current.hint}
            </p>
          )}
          {(paused || !current?.hint) && <div className="mb-4" />}

          <div className="flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={paused || step === 0}
              className="min-h-11 text-sm text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-3 rounded hover:bg-white/5"
            >
              Back
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? "w-5 bg-slate-300"
                      : i < step
                        ? "w-1.5 bg-slate-500"
                        : "w-1.5 bg-slate-700"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={goNext}
              disabled={paused}
              className="min-h-11 text-sm font-medium text-slate-900 px-4 rounded transition-colors bg-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {current?.nextLabel ?? (step >= totalSteps - 1 ? "Finish" : "Next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

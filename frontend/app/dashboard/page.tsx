"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import MapView from "@/app/components/MapView";
import VesselDetailPanel from "@/app/components/VesselDetail";
import FeatureTour from "@/app/components/FeatureTour";
import RiskDistributionPanel from "@/app/components/RiskDistribution";
import Toast from "@/app/components/Toast";
import FloatingChrome, { DemoPlayback } from "@/app/components/FloatingChrome";
import AlertPeeks from "@/app/components/AlertPeeks";
import CommandPalette from "@/app/components/CommandPalette";
import IngestBanner from "@/app/components/IngestBanner";
import ShortcutOverlay from "@/app/components/ShortcutOverlay";
import type { ToastItem } from "@/app/components/Toast";
import type { SatelliteOverlay } from "@/app/components/MapView";
import { canWatchMap, getDataMode, watchMapCoverage, type DataMode, type MapBounds, type MapCoverage } from "@/app/lib/api";
import { DataSourceProvider, useDataSource } from "@/app/lib/data-source";
import { DEMO_DURATION_MS, DEMO_PLAYBACK_RATE, getDemoElapsed, setDemoElapsed } from "@/app/lib/demo-api";
import type { Vessel, VesselDetail, Alert, Geofence, IngestionStatus, Region, RiskDistribution } from "@/app/lib/api";

const REFRESH_INTERVAL_MS = 5000;
const BACKGROUND_REFRESH_INTERVAL_MS = 60_000;

// Fast equality checks — skip state updates when payload hasn't meaningfully changed.
// Cheaper than re-rendering a 500-marker map every tick.
function shallowVesselListEqual(a: Vessel[], b: Vessel[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    if (x.id !== y.id) return false;
    if (x.name !== y.name || x.vessel_type !== y.vessel_type) return false;
    if (x.risk_score !== y.risk_score) return false;
    if (x.recommended_action !== y.recommended_action) return false;
    if (x.is_inactive !== y.is_inactive || x.is_resolved !== y.is_resolved) return false;
    const xp = x.latest_position, yp = y.latest_position;
    if (xp?.timestamp !== yp?.timestamp || xp?.speed_over_ground !== yp?.speed_over_ground) return false;
    if (xp?.latitude !== yp?.latitude || xp?.longitude !== yp?.longitude) return false;
    if (xp?.course_over_ground !== yp?.course_over_ground) return false;
  }
  return true;
}

function shallowAlertListEqual(a: Alert[], b: Alert[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
    if (a[i].status !== b[i].status) return false;
    if (a[i].risk_score !== b[i].risk_score) return false;
  }
  return true;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingMap />}>
      <DashboardSession />
    </Suspense>
  );
}

function DashboardSession() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const mode = getDataMode(searchParams.get("mode"));
  const changeMode = (nextMode: DataMode) => {
    const query = new URLSearchParams(searchParams.toString());
    query.set("mode", nextMode);
    query.delete("tour");
    window.history.replaceState(null, "", `${pathname}?${query}`);
  };
  return (
    <DataSourceProvider key={mode} mode={mode}>
      <Dashboard onModeChange={changeMode} />
    </DataSourceProvider>
  );
}

function Dashboard({ onModeChange }: { onModeChange: (mode: DataMode) => void }) {
  const { api, isDemo } = useDataSource();
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsTotal, setAlertsTotal] = useState(0);
  const alertsLimitRef = useRef(50);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [regions, setRegions] = useState<Record<string, Region>>({});
  const [activeRegion, setActiveRegion] = useState<string | null>(isDemo ? "la_harbor" : null);
  const [selectedVessel, setSelectedVessel] = useState<VesselDetail | null>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ingestionStatus, setIngestionStatus] = useState<IngestionStatus | null>(null);
  const [mapTarget, setMapTarget] = useState<{ center: [number, number]; zoom: number; _t?: number } | null>(null);
  const [satelliteOverlay, setSatelliteOverlay] = useState<SatelliteOverlay | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [viewport, setViewport] = useState<MapBounds | null>(null);
  const [coverage, setCoverage] = useState<MapCoverage | null>(null);
  const [vesselsTotal, setVesselsTotal] = useState(0);
  const [areaLastReportAt, setAreaLastReportAt] = useState<string | null>(null);
  const viewerIdRef = useRef<string | null>(null);
  const viewportRevisionRef = useRef(0);
  const viewportRef = useRef<MapBounds | null>(null);
  const [mapClickFocus, setMapClickFocus] = useState<[number, number] | null>(null);
  const [alertStatusFilter, setAlertStatusFilter] = useState<string>("active");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<RiskDistribution | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [detailClosing, setDetailClosing] = useState(false);
  const [analyticsClosing, setAnalyticsClosing] = useState(false);
  const [connectionOk, setConnectionOk] = useState(true);
  const [featureTourActive, setFeatureTourActive] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [demoElapsed, setReplayElapsed] = useState(getDemoElapsed);
  const [demoPaused, setDemoPaused] = useState(false);
  const selectedVesselId = selectedVessel?.id;
  const pollContextRef = useRef({ selectedVesselId, alertStatusFilter, metadataLoaded: false });
  useEffect(() => {
    pollContextRef.current = { selectedVesselId, alertStatusFilter, metadataLoaded: Object.keys(regions).length > 0 };
  }, [selectedVesselId, alertStatusFilter, regions]);
  const searchParams = useSearchParams();
  const autoTour = searchParams.get("tour") === "1";
  const liveVesselsRef = useRef<Vessel[]>([]);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analyticsCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showAnalyticsRef = useRef(showAnalytics);
  useEffect(() => { showAnalyticsRef.current = showAnalytics; }, [showAnalytics]);

  const showToast = useCallback((message: string, type: ToastItem["type"] = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const verificationFocus = mapClickFocus
    ? { latitude: mapClickFocus[1], longitude: mapClickFocus[0] }
    : mapCenter
      ? { latitude: mapCenter[1], longitude: mapCenter[0] }
      : null;

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [v, a, g, r, status] = await Promise.all([
          isDemo ? api.getVessels("la_harbor") : { items: [], total: 0 },
          isDemo ? api.getAlerts("active", "la_harbor") : { items: [], total: 0 },
          api.getGeofences(),
          api.getRegions(),
          api.getIngestionStatus().catch(() => null),
        ]);
        setVessels(v.items);
        liveVesselsRef.current = v.items;
        setAlerts(a.items);
        setAlertsTotal(a.total);
        setGeofences(g);
        setRegions(r);
        setIngestionStatus(status);
        setLoading(false);
        setConnectionOk(true);
      } catch {
        // Don't nuke the UI — let the refresh loop retry. Show reconnecting pill instead.
        setConnectionOk(false);
        setLoading(false);
      }
    }
    loadData();
  }, [api, isDemo]);

  useEffect(() => {
    if (!isDemo) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const respectMotionPreference = () => { if (preference.matches) setDemoPaused(true); };
    respectMotionPreference();
    preference.addEventListener("change", respectMotionPreference);
    return () => preference.removeEventListener("change", respectMotionPreference);
  }, [isDemo]);

  useEffect(() => {
    if (!isDemo || loading || demoPaused) return;
    let previous = performance.now();
    let cancelled = false;
    const timer = setInterval(async () => {
      const now = performance.now();
      const delta = now - previous;
      previous = now;
      if (document.visibilityState === "hidden") return;
      setDemoElapsed(getDemoElapsed() + Math.min(delta, 500) * DEMO_PLAYBACK_RATE);
      setReplayElapsed(getDemoElapsed());
      const [next, detail] = await Promise.all([
        api.getVessels(activeRegion || undefined),
        selectedVesselId ? api.getVesselDetail(selectedVesselId) : null,
      ]);
      if (cancelled) return;
      setVessels(next.items);
      liveVesselsRef.current = next.items;
      if (detail) setSelectedVessel((selected) => selected?.id === detail.id ? detail : selected);
      if (getDemoElapsed() >= DEMO_DURATION_MS) setDemoPaused(true);
    }, 250);
    return () => { cancelled = true; clearInterval(timer); };
  }, [activeRegion, api, demoPaused, isDemo, loading, selectedVesselId]);

  const toggleDemoPlayback = () => {
    if (getDemoElapsed() >= DEMO_DURATION_MS) {
      setDemoElapsed(0);
      setReplayElapsed(0);
      setDemoPaused(false);
      return;
    }
    setDemoPaused((paused) => !paused);
  };

  // Auto-start feature tour from URL param
  useEffect(() => {
    if (autoTour && !loading && !featureTourActive) {
      const timer = setTimeout(() => setFeatureTourActive(true), 800);
      return () => clearTimeout(timer);
    }
  }, [autoTour, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hidden tabs renew coverage without downloading vessel and alert payloads.
  useEffect(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    if (isDemo || loading || !viewport) return;
    let cancelled = false;
    let refreshing = false;
    let released = false;
    let backgroundRenewedAt = 0;
    viewerIdRef.current ??= crypto.randomUUID();
    const viewerId = viewerIdRef.current;
    let revision = ++viewportRevisionRef.current;
    const bounds = canWatchMap(viewport) ? viewport : null;

    const renewBackgroundCoverage = async () => {
      if (cancelled || released || !bounds) return;
      backgroundRenewedAt = Date.now();
      const requestRevision = revision;
      try {
        const nextCoverage = await watchMapCoverage(viewerId, requestRevision, bounds, { background: true });
        if (cancelled || released || requestRevision !== revision) return;
        setCoverage(nextCoverage);
      } catch {
        // The lease bridges timer throttling; another renewal follows next minute.
      }
    };

    const tick = async () => {
      if (cancelled || released) return;
      if (document.visibilityState === "hidden") {
        if (Date.now() - backgroundRenewedAt >= BACKGROUND_REFRESH_INTERVAL_MS) await renewBackgroundCoverage();
        return;
      }
      if (refreshing) return;
      refreshing = true;
      const requestRevision = revision;
      const isCurrent = () => !cancelled && !released && requestRevision === revision;
      const context = pollContextRef.current;
      await Promise.allSettled([
        watchMapCoverage(viewerId, requestRevision, bounds).then((nextCoverage) => {
          if (isCurrent()) setCoverage(nextCoverage);
        }).catch(() => {
          if (isCurrent()) setCoverage(null);
        }),
        // Retained positions are available even when this view is too wide to subscribe.
        api.getVessels(undefined, 500, 0, viewport).then((v) => {
          if (!isCurrent()) return;
          setVessels((prev) => shallowVesselListEqual(prev, v.items) ? prev : v.items);
          liveVesselsRef.current = v.items;
          setVesselsTotal(v.total);
          setAreaLastReportAt(v.last_report_at ?? null);
          setConnectionOk(true);
        }).catch(() => {
          if (isCurrent()) setConnectionOk(false);
        }),
        api.getAlerts(context.alertStatusFilter || undefined, undefined, alertsLimitRef.current, 0, viewport).then((a) => {
          if (!isCurrent()) return;
          setAlerts((prev) => shallowAlertListEqual(prev, a.items) ? prev : a.items);
          setAlertsTotal(a.total);
        }),
        api.getIngestionStatus().then((status) => {
          if (isCurrent()) setIngestionStatus(status);
        }).catch(() => {
          if (isCurrent()) setIngestionStatus(null);
        }),
        !context.metadataLoaded && Promise.all([api.getRegions(), api.getGeofences()]).then(([nextRegions, nextGeofences]) => {
          if (!isCurrent()) return;
          setRegions(nextRegions);
          setGeofences(nextGeofences);
        }),
        context.selectedVesselId && api.getVesselDetail(context.selectedVesselId).then((detail) => {
          if (isCurrent()) setSelectedVessel((prev) => prev?.id === detail.id ? detail : prev);
        }),
      ]);
      refreshing = false;
    };

    const initialTick = setTimeout(tick, 200);
    refreshTimer.current = setInterval(tick, REFRESH_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        void renewBackgroundCoverage();
      } else if (!released) {
        revision = ++viewportRevisionRef.current;
        void tick();
      }
    };
    const releaseCoverage = () => {
      if (released) return;
      released = true;
      revision = ++viewportRevisionRef.current;
      void watchMapCoverage(viewerId, revision, null, { keepalive: true }).catch(() => {});
    };
    const restoreCoverage = () => {
      if (!released) return;
      released = false;
      backgroundRenewedAt = 0;
      revision = ++viewportRevisionRef.current;
      void tick();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", releaseCoverage);
    window.addEventListener("pageshow", restoreCoverage);
    return () => {
      cancelled = true;
      clearTimeout(initialTick);
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", releaseCoverage);
      window.removeEventListener("pageshow", restoreCoverage);
    };
  }, [viewport, api, isDemo, loading]);

  useEffect(() => () => {
    if (isDemo || !viewerIdRef.current) return;
    void watchMapCoverage(viewerIdRef.current, ++viewportRevisionRef.current, null, { keepalive: true }).catch(() => {});
  }, [isDemo]);

  const handleViewportChange = useCallback((bounds: MapBounds, manual: boolean) => {
    if (isDemo) return;
    const previous = viewportRef.current;
    if (manual) setActiveRegion(null);
    if (previous && Math.abs(previous.west - bounds.west) < 0.00001
      && Math.abs(previous.east - bounds.east) < 0.00001
      && Math.abs(previous.south - bounds.south) < 0.00001
      && Math.abs(previous.north - bounds.north) < 0.00001) return;
    viewportRef.current = bounds;
    setViewport(bounds);
    setCoverage(null);
  }, [isDemo]);

  // Region change handler
  const handleRegionChange = useCallback(async (regionKey: string | null) => {
    setActiveRegion(regionKey);
    setSelectedVessel(null);
    setSelectedAlertId(null);
    setMapClickFocus(null);
    alertsLimitRef.current = 50;

    // Fly to the region
    if (regionKey && regions[regionKey]) {
      const r = regions[regionKey];
      setMapTarget({ center: [r.center[1], r.center[0]], zoom: isDemo ? r.zoom : Math.max(r.zoom, 7), _t: Date.now() });
    } else {
      // "All regions" — zoom out to world view
      setMapTarget({ center: [20, 0], zoom: 2, _t: Date.now() });
    }

    if (!isDemo) return;
    // Fetch filtered demo data immediately
    try {
      const regionParam = regionKey || undefined;
      const [v, a] = await Promise.all([
        api.getVessels(regionParam),
        api.getAlerts(alertStatusFilter || undefined, regionParam),
      ]);
      setVessels(v.items);
      setAlerts(a.items);
      setAlertsTotal(a.total);
    } catch {}
  }, [regions, api, alertStatusFilter, isDemo]);

  const handleSelectVessel = useCallback(async (vesselId: string) => {
    // Cancel any pending close animation
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; setDetailClosing(false); }
    // Close analytics if open (use ref to avoid stale closure from map markers)
    if (showAnalyticsRef.current) {
      setAnalyticsClosing(true);
      if (analyticsCloseTimerRef.current) clearTimeout(analyticsCloseTimerRef.current);
      analyticsCloseTimerRef.current = setTimeout(() => {
        setShowAnalytics(false);
        setAnalyticsClosing(false);
        analyticsCloseTimerRef.current = null;
      }, 200);
    }
    setSatelliteOverlay(null);
    setMapClickFocus(null);
    try {
      const detail = await api.getVesselDetail(vesselId);
      setSelectedVessel(detail);
      const matchingAlert = alerts.find((a) => a.vessel_id === vesselId);
      setSelectedAlertId(matchingAlert?.id ?? detail.alert_id ?? null);
      if (detail.latest_position) {
        setMapTarget({
          center: [detail.latest_position.longitude, detail.latest_position.latitude],
          zoom: 14,
          _t: Date.now(),
        });
      }
    } catch (e) {
      console.error("Failed to load vessel detail:", e);
    }
  }, [alerts, api]);

  const handleSelectAlert = useCallback(async (alert: Alert) => {
    setSelectedAlertId(alert.id);
    setSatelliteOverlay(null);
    setMapClickFocus(null);
    try {
      const detail = await api.getVesselDetail(alert.vessel_id);
      setSelectedVessel(detail);
      
      // Ensure the vessel marker exists on the map even if it was excluded by the background limit
      setVessels((prev) => {
        if (!prev.some((v) => v.id === detail.id)) {
          return [...prev, detail];
        }
        return prev;
      });
      // Fly to vessel position when clicking an alert
      if (detail.latest_position) {
        setMapTarget({
          center: [detail.latest_position.longitude, detail.latest_position.latitude],
          zoom: 14,
          _t: Date.now(),
        });
      }
    } catch (e) {
      console.error("Failed to load vessel detail:", e);
    }
  }, [api]);

  const handleLoadMoreAlerts = useCallback(async () => {
    try {
      const regionParam = isDemo ? activeRegion || undefined : undefined;
      const newLimit = alerts.length + 50;
      const a = await api.getAlerts(alertStatusFilter || undefined, regionParam, newLimit, 0, !isDemo && viewport ? viewport : undefined);
      alertsLimitRef.current = newLimit;
      setAlerts(a.items);
      setAlertsTotal(a.total);
    } catch {}
  }, [activeRegion, alerts.length, api, alertStatusFilter, isDemo, viewport]);

  const handleCloseDetail = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setDetailClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setSelectedVessel(null);
      setSelectedAlertId(null);
      setSatelliteOverlay(null);
      setDetailClosing(false);
      closeTimerRef.current = null;
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 200);
  }, []);

  const handleAlertAction = useCallback(async (alertId: string, newStatus: string) => {
    setAlerts((prev) =>
      prev.map((a) => a.id === alertId ? { ...a, status: newStatus } : a)
    );
    if (isDemo) {
      const result = await api.getVessels(activeRegion ?? undefined);
      setVessels(result.items);
      if (selectedVessel) setSelectedVessel(await api.getVesselDetail(selectedVessel.id));
    }
    showToast(
      newStatus === "dismissed" ? "Alert dismissed" : newStatus === "acknowledged" ? "Alert acknowledged" : `Alert ${newStatus}`,
      "success"
    );
    if (newStatus === "dismissed") {
      handleCloseDetail();
    }
  }, [isDemo, showToast, api, activeRegion, selectedVessel, handleCloseDetail]);



  const handleToggleAnalytics = useCallback(() => {
    if (showAnalytics) {
      setAnalyticsClosing(true);
      analyticsCloseTimerRef.current = setTimeout(() => {
        setShowAnalytics(false);
        setAnalyticsClosing(false);
        analyticsCloseTimerRef.current = null;
      }, 200);
    } else {
      if (!connectionOk) {
        showToast("Analytics are unavailable while the data service is offline.", "info");
        return;
      }
      if (analyticsCloseTimerRef.current) { clearTimeout(analyticsCloseTimerRef.current); analyticsCloseTimerRef.current = null; setAnalyticsClosing(false); }
      // Close vessel detail panel if open
      if (selectedVessel) handleCloseDetail();
      setShowAnalytics(true);
      api.getRiskDistribution().then(setAnalyticsData).catch(() => {
        setShowAnalytics(false);
        showToast("Analytics could not be loaded. Try again shortly.", "error");
      });
    }
  }, [showAnalytics, connectionOk, selectedVessel, handleCloseDetail, api, showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K → command palette (works from inputs too)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
        return;
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape") {
        if (commandOpen) setCommandOpen(false);
        else if (selectedVessel) handleCloseDetail();
        else if (showAnalytics) handleToggleAnalytics();
      }
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        showToast("Shortcuts: ⌘K = command · Esc = close · A = analytics", "info");
      }
      if (e.key === "a" && !e.ctrlKey && !e.metaKey) {
        handleToggleAnalytics();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedVessel, showAnalytics, commandOpen, handleCloseDetail, handleToggleAnalytics, showToast]);

  const isLive = ingestionStatus?.running && ingestionStatus?.connected;
  const zoomRequired = !isDemo && viewport !== null && !canWatchMap(viewport);
  const lastReportAt = areaLastReportAt ?? vessels.reduce<string | null>((latest, vessel) => {
    const timestamp = vessel.latest_position?.timestamp;
    return timestamp && (!latest || timestamp > latest) ? timestamp : latest;
  }, null);

  return (
    <main id="main" className="harbor-workspace h-dvh relative overflow-hidden" data-demo={isDemo} data-tour="map">
      <h1 className="sr-only">Vessel tracking map</h1>
      <MapView
        vessels={vessels}
        geofences={geofences}
        selectedVesselId={selectedVessel?.id ?? null}
        onSelectVessel={handleSelectVessel}
        flyTo={mapTarget}
        satelliteOverlay={satelliteOverlay}
        onMapCenterChange={setMapCenter}
        onMapClick={setMapClickFocus}
        onViewportChange={handleViewportChange}
      />

      <FloatingChrome
        regions={regions}
        activeRegion={activeRegion}
        onSelectRegion={handleRegionChange}
        isLive={!!isLive}
        loading={loading}
        statusKnown={ingestionStatus !== null}
        connectionOk={connectionOk}
        vesselCount={vessels.length}
        coverage={coverage}
        zoomRequired={zoomRequired}
        lastReportAt={lastReportAt}
        onModeChange={onModeChange}
        onToggleAnalytics={handleToggleAnalytics}
        analyticsOpen={showAnalytics}
        onOpenCommandPalette={() => setCommandOpen(true)}
      />

      {isDemo && <DemoPlayback elapsed={demoElapsed} paused={demoPaused} loading={loading} onToggle={toggleDemoPlayback} />}

      {/* Ingest banner */}
      <IngestBanner
        vesselCount={vessels.length}
        status={ingestionStatus}
        isLive={!!isLive}
        connectionOk={connectionOk}
        loading={loading}
        onDemo={() => onModeChange("demo")}
        coverage={coverage}
        zoomRequired={zoomRequired}
        vesselsTotal={vesselsTotal}
      />

      <AlertPeeks
        alerts={alerts}
        onSelectAlert={handleSelectAlert}
        selectedAlertId={selectedAlertId}
        panelOpen={!!selectedVessel || showAnalytics}
        loading={loading}
        connectionOk={connectionOk}
      />

      {/* Command palette (⌘K) */}
      {commandOpen && <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        alerts={alerts}
        vessels={vessels}
        regions={regions}
        activeRegion={activeRegion}
        onSelectAlert={handleSelectAlert}
        onSelectRegion={handleRegionChange}
        onSelectVessel={handleSelectVessel}
        onToggleAnalytics={handleToggleAnalytics}
      />}

      <FeatureTour
        active={featureTourActive}
        onComplete={() => setFeatureTourActive(false)}
        onSelectRegion={handleRegionChange}
        onSelectVessel={handleSelectVessel}
        onDeselectVessel={() => { if (selectedVessel) handleCloseDetail(); }}
        onToggleAnalytics={handleToggleAnalytics}
        onFlyTo={(center, zoom) => setMapTarget({ center, zoom, _t: Date.now() })}
        analyticsOpen={showAnalytics}
        activeRegion={activeRegion}
      />

      {(showAnalytics || analyticsClosing) && (
        <RiskDistributionPanel
          data={analyticsData}
          onClose={handleToggleAnalytics}
          closing={analyticsClosing}
        />
      )}

      {selectedVessel && (
        <VesselDetailPanel
          key={selectedVessel.id}
          vessel={selectedVessel}
          alertId={selectedAlertId}
          onSatelliteOverlay={setSatelliteOverlay}
          verificationFocus={verificationFocus}
          onClose={handleCloseDetail}
          onAlertAction={handleAlertAction}
          closing={detailClosing}
        />
      )}


      <ShortcutOverlay />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}

function LoadingMap() {
  return (
    <main id="main" className="harbor-workspace flex h-dvh items-center justify-center" aria-busy="true">
      <div role="status" className="text-center">
        <p className="text-sm text-[var(--workspace-muted)]">Loading map…</p>
      </div>
    </main>
  );
}

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
import { getDataMode, type DataMode } from "@/app/lib/api";
import { DataSourceProvider, useDataSource } from "@/app/lib/data-source";
import { DEMO_DURATION_MS, DEMO_PLAYBACK_RATE, getDemoElapsed, setDemoElapsed } from "@/app/lib/demo-api";
import type { Vessel, VesselDetail, Alert, Geofence, IngestionStatus, Region, RiskDistribution } from "@/app/lib/api";

const REFRESH_INTERVAL_MS = 5000;

// Fast equality checks — skip state updates when payload hasn't meaningfully changed.
// Cheaper than re-rendering a 500-marker map every tick.
function shallowVesselListEqual(a: Vessel[], b: Vessel[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    if (x.id !== y.id) return false;
    if (x.risk_score !== y.risk_score) return false;
    if (x.recommended_action !== y.recommended_action) return false;
    if (x.is_inactive !== y.is_inactive || x.is_resolved !== y.is_resolved) return false;
    const xp = x.latest_position, yp = y.latest_position;
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
  const [activeRegion, setActiveRegion] = useState<string | null>("la_harbor");
  const [selectedVessel, setSelectedVessel] = useState<VesselDetail | null>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ingestionStatus, setIngestionStatus] = useState<IngestionStatus | null>(null);
  const [mapTarget, setMapTarget] = useState<{ center: [number, number]; zoom: number; _t?: number } | null>(null);
  const [satelliteOverlay, setSatelliteOverlay] = useState<SatelliteOverlay | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
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
          api.getVessels("la_harbor"),
          api.getAlerts("active", "la_harbor"),
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
  }, [api]);

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

  // Auto-refresh — pauses when tab hidden, skips state updates when payload is unchanged.
  useEffect(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    if (isDemo || loading) return;
    let cancelled = false;
    let refreshing = false;

    const tick = async () => {
      if (refreshing) return;
      // Don't hammer the API when the user isn't looking.
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      refreshing = true;
      try {
        const regionParam = activeRegion || undefined;
        const [v, a, status] = await Promise.all([
          api.getVessels(regionParam),
          api.getAlerts(alertStatusFilter || undefined, regionParam, alertsLimitRef.current),
          api.getIngestionStatus().catch(() => null),
        ]);
        if (cancelled) return;
        if (Object.keys(regions).length === 0) {
          const [nextRegions, nextGeofences] = await Promise.all([api.getRegions(), api.getGeofences()]);
          if (cancelled) return;
          setRegions(nextRegions);
          setGeofences(nextGeofences);
        }
        // Skip state update (and the map marker diff pass it triggers) if nothing changed.
        setVessels((prev) => (shallowVesselListEqual(prev, v.items) ? prev : v.items));
        liveVesselsRef.current = v.items;
        setAlerts((prev) => (shallowAlertListEqual(prev, a.items) ? prev : a.items));
        setAlertsTotal(a.total);
        setIngestionStatus(status);
        if (selectedVesselId) {
          const detail = await api.getVesselDetail(selectedVesselId).catch(() => null);
          if (cancelled) return;
          if (detail) setSelectedVessel((prev) => prev?.id === detail.id ? detail : prev);
        }
        setConnectionOk(true);
      } catch {
        if (cancelled) return;
        if (connectionOk) showToast("Connection lost — retrying...", "error");
        setConnectionOk(false);
      } finally {
        refreshing = false;
      }
    };

    refreshTimer.current = setInterval(tick, REFRESH_INTERVAL_MS);
    return () => { cancelled = true; if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [activeRegion, alertStatusFilter, api, connectionOk, isDemo, loading, regions, selectedVesselId, showToast]);

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
      setMapTarget({ center: [r.center[1], r.center[0]], zoom: r.zoom, _t: Date.now() });
    } else {
      // "All regions" — zoom out to world view
      setMapTarget({ center: [20, 0], zoom: 2, _t: Date.now() });
    }

    // Fetch filtered data immediately
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
  }, [regions, api, alertStatusFilter]);

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
      const regionParam = activeRegion || undefined;
      const newLimit = alerts.length + 50;
      const a = await api.getAlerts(alertStatusFilter || undefined, regionParam, newLimit);
      alertsLimitRef.current = newLimit;
      setAlerts(a.items);
      setAlertsTotal(a.total);
    } catch {}
  }, [activeRegion, alerts.length, api, alertStatusFilter]);

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

  return (
    <main id="main" className="harbor-workspace h-dvh relative overflow-hidden" data-demo={isDemo} data-tour="map">
      <h1 className="sr-only">HarborOS maritime map</h1>
      {/* Full-bleed map */}
      <MapView
        vessels={vessels}
        geofences={geofences}
        selectedVesselId={selectedVessel?.id ?? null}
        onSelectVessel={handleSelectVessel}
        flyTo={mapTarget}
        satelliteOverlay={satelliteOverlay}
        onMapCenterChange={setMapCenter}
        onMapClick={setMapClickFocus}
      />

      {/* Floating top strip */}
      <FloatingChrome
        regions={regions}
        activeRegion={activeRegion}
        onSelectRegion={handleRegionChange}
        isLive={!!isLive}
        loading={loading}
        statusKnown={ingestionStatus !== null}
        connectionOk={connectionOk}
        vesselCount={vessels.length}
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
      />

      {/* Alert peeks, bottom-left */}
      {!loading && connectionOk && <AlertPeeks
        alerts={alerts}
        onSelectAlert={handleSelectAlert}
        selectedAlertId={selectedAlertId}
        panelOpen={!!selectedVessel || showAnalytics}
      />}

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
    <main id="main" className="flex h-dvh items-center justify-center bg-[#080b14]" aria-busy="true">
      <div role="status" className="text-center">
        <h1 className="text-sm font-semibold text-slate-100">HarborOS</h1>
        <p className="mt-2 text-xs text-slate-400">Loading map…</p>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useDataSource } from "@/app/lib/data-source";
import type { Vessel, Geofence, SatelliteTileSource, MapBounds } from "@/app/lib/api";
import { formatAssessmentTime, riskHex, RISK_THRESHOLDS } from "@/app/lib/risk";

export interface SatelliteOverlay {
  imageSrc: string;
  bbox: [number, number, number, number];
  renderToken?: string;
}

interface MapViewProps {
  vessels: Vessel[];
  geofences: Geofence[];
  selectedVesselId: string | null;
  onSelectVessel: (vesselId: string) => void;
  flyTo?: { center: [number, number]; zoom: number } | null;
  satelliteOverlay?: SatelliteOverlay | null;
  onMapCenterChange?: (center: [number, number]) => void;
  onMapClick?: (coords: [number, number]) => void;
  onViewportChange?: (bounds: MapBounds, manual: boolean) => void;
}

const vesselColor = riskHex;
const SHIP_MARKER_ZOOM = 10;
const WORLD_BOUNDS: [[number, number], [number, number]] = [[-180, -65], [180, 80]];
const constrainLiveMap: maplibregl.TransformConstrainFunction = (center, zoom) => ({
  center: new maplibregl.LngLat(center.lng, Math.max(-85, Math.min(85, center.lat))),
  zoom: Math.max(-2, Math.min(22, zoom)),
});

function geofenceColor(zoneType: string): string {
  switch (zoneType) {
    case "restricted": return "#b88480";
    case "security": return "#b69871";
    default: return "#6b8499";
  }
}

function resolveSatelliteOverlayUrl(imageSrc?: string, renderToken?: string): string | null {
  if (!imageSrc) return null;

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api").replace(/\/api$/, "");
  const absoluteUrl = imageSrc.startsWith("/api/") ? `${apiBase}${imageSrc}` : imageSrc;
  if (!renderToken) return absoluteUrl;
  return `${absoluteUrl}${absoluteUrl.includes("?") ? "&" : "?"}v=${encodeURIComponent(renderToken)}`;
}

function resolveSatelliteTileTemplate(tileUrl?: string): string | null {
  if (!tileUrl) return null;
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api").replace(/\/api$/, "");
  return tileUrl.startsWith("/api/") ? `${apiBase}${tileUrl}` : tileUrl;
}

/**
 * Returns top-down ship silhouette SVG paths for each vessel type.
 * Uses a tall narrow viewBox (10x28) so ships render with realistic proportions.
 * Three layers: hull (colored), deck (subtle), bridge (bright white block).
 */
function vesselSvgPaths(vesselType: string): {
  hull: string; deck: string; bridge: string; viewBox: string; ratio: number;
} {
  // ratio = width / height for the marker element
  switch (vesselType) {
    // Cargo / container: long boxy hull, container bays, bridge block at stern
    case "cargo":
      return {
        hull: "M5 0 L2.5 3 L1.5 6 L1.5 25 L2.5 28 L7.5 28 L8.5 25 L8.5 6 L7.5 3 Z",
        deck: "M2.5 5.5 L7.5 5.5 L7.5 8 L2.5 8 Z M2.5 9 L7.5 9 L7.5 11.5 L2.5 11.5 Z M2.5 12.5 L7.5 12.5 L7.5 15 L2.5 15 Z M2.5 16 L7.5 16 L7.5 18.5 L2.5 18.5 Z",
        bridge: "M2 21 L8 21 L8 26.5 L2 26.5 Z",
        viewBox: "0 0 10 28",
        ratio: 0.36,
      };
    // Tanker: wide rounded bow, center pipe, bridge at stern
    case "tanker":
      return {
        hull: "M5 0 Q1 4 1 7 L1 25 L2 28 L8 28 L9 25 L9 7 Q9 4 5 0 Z",
        deck: "M4 6 L6 6 L6 20 L4 20 Z",
        bridge: "M2 22 L8 22 L8 27 L2 27 Z",
        viewBox: "0 0 10 28",
        ratio: 0.36,
      };
    // Fishing: shorter wider hull, wheelhouse forward, boom line aft
    case "fishing":
      return {
        hull: "M5 0 L2 3 L0.5 7 L0.5 18 L2 22 L8 22 L9.5 18 L9.5 7 L8 3 Z",
        deck: "M4.5 10 L5.5 10 L5.5 19 L4.5 19 Z",
        bridge: "M2 3.5 L8 3.5 L8 9 L2 9 Z",
        viewBox: "0 0 10 22",
        ratio: 0.45,
      };
    // Tug: very short & stocky, big wheelhouse
    case "tug":
      return {
        hull: "M5 0 L2 3 L0.5 6 L0.5 14 L2 17 L8 17 L9.5 14 L9.5 6 L8 3 Z",
        deck: "",
        bridge: "M1.5 4 L8.5 4 L8.5 12 L1.5 12 Z",
        viewBox: "0 0 10 17",
        ratio: 0.59,
      };
    // Passenger / cruise: longest hull, massive superstructure, pool deck
    case "passenger":
      return {
        hull: "M5 0 L2.5 2 L1 5 L1 27 L2 30 L8 30 L9 27 L9 5 L7.5 2 Z",
        deck: "M2 3.5 L8 3.5 L8 25 L2 25 Z",
        bridge: "M2.5 3.5 L7.5 3.5 L7.5 8 L2.5 8 Z",
        viewBox: "0 0 10 30",
        ratio: 0.33,
      };
    // Military / law enforcement: narrow aggressive hull, weapons deck
    case "law_enforcement":
    case "military":
      return {
        hull: "M5 0 L3 3 L2 7 L1.5 24 L3 28 L7 28 L8.5 24 L8 7 L7 3 Z",
        deck: "M3.5 7 L6.5 7 L6.5 11 L3.5 11 Z M3.5 14 L6.5 14 L6.5 16 L3.5 16 Z",
        bridge: "M3 18 L7 18 L7 24 L3 24 Z",
        viewBox: "0 0 10 28",
        ratio: 0.36,
      };
    // Pleasure / yacht: small sleek hull, open cockpit aft
    case "pleasure":
      return {
        hull: "M5 0 L2.5 3 L1.5 7 L1.5 19 L3 23 L7 23 L8.5 19 L8.5 7 L7.5 3 Z",
        deck: "",
        bridge: "M2.5 14 L7.5 14 L7.5 21 L2.5 21 Z",
        viewBox: "0 0 10 23",
        ratio: 0.43,
      };
    // Default / other: generic vessel
    default:
      return {
        hull: "M5 0 L2 4 L1.5 8 L1.5 24 L3 28 L7 28 L8.5 24 L8.5 8 L8 4 Z",
        deck: "",
        bridge: "M2.5 20 L7.5 20 L7.5 26 L2.5 26 Z",
        viewBox: "0 0 10 28",
        ratio: 0.36,
      };
  }
}

type MapMode = "maps" | "chart" | "satellite";

const ESRI_TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

function buildMapStyle(mapMode: MapMode, satelliteTiles?: SatelliteTileSource | null): maplibregl.StyleSpecification | string {
  if (mapMode === "maps") {
    return {
      version: 8,
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        "satellite": {
          type: "raster",
          tiles: [ESRI_TILE_URL],
          tileSize: 256,
          maxzoom: 18,
          attribution: "&copy; Esri, Maxar, Earthstar Geographics",
        },
        "place-labels": {
          type: "raster",
          tiles: [
            "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          maxzoom: 18,
        },
      },
      layers: [
        {
          id: "satellite",
          type: "raster",
          source: "satellite",
          minzoom: 0,
          maxzoom: 22,
        },
        {
          id: "labels",
          type: "raster",
          source: "place-labels",
          minzoom: 3,
          maxzoom: 22,
          paint: { "raster-opacity": 0.8 },
        },
      ],
    };
  }
  if (mapMode === "satellite") {
    const tileUrl = resolveSatelliteTileTemplate(satelliteTiles?.tile_url ?? ESRI_TILE_URL);
    return {
      version: 8,
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        "satellite": {
          type: "raster",
          tiles: tileUrl ? [tileUrl] : [ESRI_TILE_URL],
          tileSize: satelliteTiles?.tile_size ?? 256,
          maxzoom: satelliteTiles?.max_zoom ?? 18,
          attribution: satelliteTiles?.attribution ?? "&copy; Esri, Maxar, Earthstar Geographics",
        },
        "place-labels": {
          type: "raster",
          tiles: [
            "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          maxzoom: 18,
        },
      },
      layers: [
        {
          id: "satellite",
          type: "raster",
          source: "satellite",
          minzoom: 0,
          maxzoom: 22,
        },
        {
          id: "labels",
          type: "raster",
          source: "place-labels",
          minzoom: 3,
          maxzoom: 22,
          paint: { "raster-opacity": 0.8 },
        },
      ],
    };
  }

  return "https://tiles.openfreemap.org/styles/dark";
}

function applyMapPalette(map: maplibregl.Map) {
  const layers = map.getStyle().layers;
  const water = layers.find((layer) => layer.id === "water");
  if (!water || water.type !== "fill") return;

  for (const layer of layers) {
    if (layer.type === "background") map.setPaintProperty(layer.id, "background-color", "#f0efe7");
    if (layer.type === "fill") {
      const color = layer.id === "water" ? "#dbe6e8"
        : layer.id === "building" ? "#ddded6"
        : layer.id === "road_area_pier" ? "#c8d0ca" : "#ebeee5";
      map.setPaintProperty(layer.id, "fill-color", color);
      if (layer.paint?.["fill-outline-color"]) map.setPaintProperty(layer.id, "fill-outline-color", "#b8c3bc");
    }
    if (layer.type === "line") {
      const transport = layer.id.startsWith("highway") || layer.id.startsWith("railway");
      if (transport) {
        map.setPaintProperty(layer.id, "line-color", "#bfc6bc");
        map.setPaintProperty(layer.id, "line-opacity", ["interpolate", ["linear"], ["zoom"], 6, 0.12, 10, 0.3, 14, 0.65]);
      } else if (layer.id === "waterway") {
        map.setPaintProperty(layer.id, "line-color", "#b9d0d6");
      } else if (layer.id.startsWith("boundary")) {
        map.setPaintProperty(layer.id, "line-color", "#929f9d");
        map.setPaintProperty(layer.id, "line-opacity", 0.35);
      }
    }
    if (layer.type === "symbol" && layer.layout?.["text-field"]) {
      const waterLabel = layer.id === "water_name";
      const minZoom = layer.id === "place_city_large" ? 4
        : layer.id === "place_city" ? 6
        : layer.id === "place_town" ? 8
        : ["place_other", "place_suburb", "place_village"].includes(layer.id) ? 10
        : layer.id === "place_state" ? 5 : null;
      if (minZoom !== null) map.setLayerZoomRange(layer.id, minZoom, layer.maxzoom ?? 24);
      map.setPaintProperty(layer.id, "text-color", waterLabel ? "#607c88" : "#69746d");
      map.setPaintProperty(layer.id, "text-halo-color", waterLabel ? "#dbe6e8" : "#f0efe7");
      map.setPaintProperty(layer.id, "text-halo-width", 1);
    }
  }
  map.addLayer({
    id: "coastline-outline",
    type: "line",
    source: water.source,
    "source-layer": water["source-layer"],
    filter: water.filter,
    paint: { "line-color": "#8fa7aa", "line-width": 0.75, "line-opacity": 0.7 },
  }, "water_name");
}

export default function MapView({
  vessels,
  geofences,
  selectedVesselId,
  onSelectVessel,
  flyTo,
  satelliteOverlay,
  onMapCenterChange,
  onMapClick,
  onViewportChange,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const { api, isDemo } = useDataSource();
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, {
    marker: maplibregl.Marker;
    el: HTMLDivElement;
    // Cached render state — skip innerHTML writes when unchanged
    state: { w: number; h: number; color: string; stroke: string; sw: number; type: string; selected: boolean; muted: boolean; course: number } | null;
    lng: number;
    lat: number;
  }>>({});
  const trailVesselIdRef = useRef<string | null>(null);
  const selectedVessel = vessels.find((vessel) => vessel.id === selectedVesselId);
  const selectedPositionTimestamp = selectedVessel?.latest_position?.timestamp;
  const selectedRiskScore = selectedVessel?.risk_score;
  const [styleVersion, setStyleVersion] = useState(0);
  const styleLoadedRef = useRef(false);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>("chart");
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);
  const styleMenuRef = useRef<HTMLDivElement>(null);
  const [satelliteTiles, setSatelliteTiles] = useState<SatelliteTileSource | null>(null);
  const hideNormal = false;
  const [zoomLevel, setZoomLevel] = useState(isDemo ? 12.5 : 2);
  const showMarkers = zoomLevel >= SHIP_MARKER_ZOOM;
  const centerChangeRef = useRef(onMapCenterChange);
  const viewportChangeRef = useRef(onViewportChange);
  const mapClickRef = useRef(onMapClick);
  const onSelectVesselRef = useRef(onSelectVessel);
  const satelliteStyleKey = satelliteTiles
    ? `${satelliteTiles.tile_url}:${satelliteTiles.tile_size}:${satelliteTiles.max_zoom}:${satelliteTiles.sentinel2_available}`
    : "fallback";
  const appliedStyleRef = useRef({ mode: mapMode, key: satelliteStyleKey });

  useEffect(() => {
    if (!styleMenuOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!styleMenuRef.current?.contains(event.target as Node)) setStyleMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setStyleMenuOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [styleMenuOpen]);

  useEffect(() => {
    centerChangeRef.current = onMapCenterChange;
    viewportChangeRef.current = onViewportChange;
    mapClickRef.current = onMapClick;
    onSelectVesselRef.current = onSelectVessel;
  }, [onMapCenterChange, onMapClick, onSelectVessel, onViewportChange]);

  useEffect(() => {
    let cancelled = false;
    api.getSatelliteInfo()
      .then((info) => {
        if (!cancelled) {
          setSatelliteTiles(info.tiles);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSatelliteTiles(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const updateVesselPoints = useCallback(() => {
    const map = mapRef.current;
    if (!map || !styleLoadedRef.current) return;

    const features = vessels
      .filter((v) => v.latest_position)
      .map((v) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [v.latest_position!.longitude, v.latest_position!.latitude],
        },
        properties: {
          id: v.id,
          name: v.name,
          mmsi: v.mmsi,
          color: v.is_inactive || v.is_resolved ? "#64748b" : vesselColor(v.risk_score),
          selected: v.id === selectedVesselId,
        },
      }));

    const geojson = { type: "FeatureCollection" as const, features };

    if (map.getSource("vessel-points")) {
      (map.getSource("vessel-points") as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource("vessel-points", { type: "geojson", data: geojson });

      map.addLayer({
        id: "vessel-dots",
        type: "circle",
        source: "vessel-points",
        maxzoom: SHIP_MARKER_ZOOM,
        layout: { "circle-sort-key": ["case", ["get", "selected"], 1, 0] },
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["zoom"],
            2, ["case", ["get", "selected"], 5, 3],
            9, ["case", ["get", "selected"], 7, 4.5],
          ],
          "circle-color": ["get", "color"],
          "circle-stroke-color": ["case", ["get", "selected"], "#182f3b", "#fafaf7"],
          "circle-stroke-width": ["case", ["get", "selected"], 2, 1.25],
          "circle-opacity": 1,
        },
      });
      map.addLayer({
        id: "vessel-hit-targets",
        type: "circle",
        source: "vessel-points",
        maxzoom: SHIP_MARKER_ZOOM,
        paint: {
          "circle-radius": 22,
          "circle-opacity": 0,
        },
      });
    }
  }, [vessels, selectedVesselId]);

  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !styleLoadedRef.current) return;

    const currentVesselIds = new Set<string>();

    // The canvas dots handle wider views without hundreds of DOM markers.
    if (!showMarkers) {
      Object.keys(markersRef.current).forEach((vesselId) => {
        markersRef.current[vesselId].marker.remove();
        delete markersRef.current[vesselId];
      });
      return;
    }

    vessels.forEach((vessel) => {
      if (!vessel.latest_position) return;

      // Filter out normal vessels when toggle is active
      const hasAnomaly = (vessel.risk_score ?? 0) >= RISK_THRESHOLDS.monitor || (vessel.recommended_action && vessel.recommended_action !== "normal" && vessel.recommended_action !== "ignore");
      if (hideNormal && !hasAnomaly && vessel.id !== selectedVesselId) {
        if (markersRef.current[vessel.id]) {
          markersRef.current[vessel.id].marker.remove();
          delete markersRef.current[vessel.id];
        }
        return;
      }

      currentVesselIds.add(vessel.id);

      const score = vessel.risk_score ?? 0;
      const isMuted = !!(vessel.is_inactive || vessel.is_resolved);
      const color = isMuted ? "#64748b" : vesselColor(vessel.risk_score);
      const isSelected = vessel.id === selectedVesselId;
      const h = isSelected ? 34 : score >= RISK_THRESHOLDS.verify ? 28 : 20;
      const course = vessel.latest_position.course_over_ground ?? 0;
      const strokeColor = isSelected ? "#182f3b" : "#fafaf7";
      const strokeWidth = isSelected ? 1.6 : 0.6;
      const vesselType = vessel.vessel_type ?? "other";
      const { hull, deck, bridge, viewBox, ratio } = vesselSvgPaths(vesselType);
      const w = Math.round(h * ratio);
      const lng = vessel.latest_position.longitude;
      const lat = vessel.latest_position.latitude;

      let markerData = markersRef.current[vessel.id];

      if (!markerData) {
        const el = document.createElement("div");
        el.style.cursor = "pointer";
        el.style.pointerEvents = "auto";
        el.setAttribute("data-vessel-id", vessel.id);
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.setAttribute("aria-label", `Inspect ${vessel.name}`);
        el.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            el.click();
          }
        });

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const vid = el.getAttribute("data-vessel-id");
          if (vid) onSelectVesselRef.current(vid);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map);

        markerData = { marker, el, state: null, lng, lat };
        markersRef.current[vessel.id] = markerData;
      }

      const { marker, el, state, lng: prevLng, lat: prevLat } = markerData;

      // Position update is cheap — always keep in sync via setLngLat (no DOM reflow).
      if (lng !== prevLng || lat !== prevLat) {
        marker.setLngLat([lng, lat]);
        markerData.lng = lng;
        markerData.lat = lat;
      }

      const point = map.project([lng, lat]);
      const container = map.getContainer();
      el.tabIndex = point.x >= 0 && point.x <= container.clientWidth && point.y >= 0 && point.y <= container.clientHeight ? 0 : -1;
      const riskLabel = vessel.risk_score == null ? "Not assessed" : `Risk ${Math.round(vessel.risk_score)}/100`;
      const assessmentTime = formatAssessmentTime(vessel.risk_assessed_at);
      el.title = `${vessel.name} (${vessel.mmsi}) — ${riskLabel}${assessmentTime ? ` · Last assessed ${assessmentTime}` : ""}${vessel.is_inactive && vessel.status_reason ? ` — ${vessel.status_reason}` : ""}`;
      el.setAttribute("aria-label", `Inspect ${vessel.name}, ${riskLabel}`);

      // Skip expensive innerHTML write unless visual state actually changed.
      const unchanged =
        state &&
        state.w === w &&
        state.h === h &&
        state.color === color &&
        state.stroke === strokeColor &&
        state.sw === strokeWidth &&
        state.type === vesselType &&
        state.selected === isSelected &&
        state.muted === isMuted &&
        state.course === course;

      if (unchanged) return;

      el.style.width = "44px";
      el.style.height = "44px";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.zIndex = isSelected ? "2" : "1";
      el.setAttribute("aria-pressed", String(isSelected));
      el.innerHTML = `
      <div style="width:${w}px;height:${h}px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}"
             style="transform:rotate(${course}deg);transition:transform 0.5s ease">
          <path d="${hull}" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>
          ${deck ? `<path d="${deck}" fill="rgba(255,255,255,0.10)" stroke="none"/>` : ""}
          <path d="${bridge}" fill="rgba(255,255,255,0.30)" stroke="rgba(255,255,255,0.12)" stroke-width="0.3"/>
        </svg>
      </div>`;

      markerData.state = { w, h, color, stroke: strokeColor, sw: strokeWidth, type: vesselType, selected: isSelected, muted: isMuted, course };
    });

    Object.keys(markersRef.current).forEach((vesselId) => {
      if (!currentVesselIds.has(vesselId)) {
        markersRef.current[vesselId].marker.remove();
        delete markersRef.current[vesselId];
      }
    });
  }, [vessels, selectedVesselId, hideNormal, showMarkers]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: mapContainer.current,
        style: buildMapStyle(mapMode, satelliteTiles),
        center: isDemo ? [-118.265, 33.725] : [10, 20],
        zoom: isDemo ? 12.5 : 2,
        pitch: 0,
        attributionControl: false,
        ...(!isDemo ? {
          transformConstrain: constrainLiveMap,
          bounds: WORLD_BOUNDS,
          fitBoundsOptions: { padding: { top: window.innerWidth < 640 ? 124 : 84, bottom: window.innerWidth < 1024 ? 112 : 64, left: 24, right: 24 } },
        } : mapContainer.current.clientWidth < 640 ? {
          bounds: [[-118.325, 33.66], [-118.205, 33.76]] as [[number, number], [number, number]],
          fitBoundsOptions: { padding: { top: 140, bottom: 180, left: 24, right: 60 } },
        } : {}),
      });
    } catch {
      // MapLibre can fail before it can emit an error event.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMapUnavailable(true);
      return;
    }

    mapRef.current = map;
    const tooltip = document.createElement("div");
    tooltip.className = "pointer-events-none absolute z-20 max-w-[240px] border border-[var(--workspace-border)] bg-[var(--workspace-surface)] px-3 py-2 text-sm text-[var(--workspace-ink)]";
    tooltip.setAttribute("role", "tooltip");
    tooltip.style.display = "none";
    map.getContainer().appendChild(tooltip);

    const hideVesselTooltip = () => {
      tooltip.style.display = "none";
      map.getCanvas().style.cursor = "";
    };
    const vesselAtPoint = (event: maplibregl.MapMouseEvent) => {
      if (map.getZoom() >= SHIP_MARKER_ZOOM || !map.getLayer("vessel-hit-targets")) return;
      const features = map.queryRenderedFeatures(event.point, { layers: ["vessel-hit-targets"] });
      const distance = (feature: maplibregl.MapGeoJSONFeature) => {
        if (feature.geometry.type !== "Point") return Infinity;
        const [longitude, latitude] = feature.geometry.coordinates;
        const wrappedLongitude = longitude + Math.round((map.getCenter().lng - longitude) / 360) * 360;
        const point = map.project([wrappedLongitude, latitude]);
        return Math.hypot(point.x - event.point.x, point.y - event.point.y);
      };
      return features.sort((a, b) => distance(a) - distance(b))[0];
    };
    const showVesselTooltip = (event: maplibregl.MapMouseEvent) => {
      const feature = vesselAtPoint(event);
      if (!feature) {
        hideVesselTooltip();
        return;
      }
      map.getCanvas().style.cursor = "pointer";
      tooltip.textContent = `${feature.properties.name} · ${feature.properties.mmsi}`;
      tooltip.style.display = "block";
      tooltip.style.left = `${Math.max(12, Math.min(event.point.x + 14, map.getContainer().clientWidth - tooltip.offsetWidth - 12))}px`;
      tooltip.style.top = `${Math.max(12, Math.min(event.point.y + 14, map.getContainer().clientHeight - tooltip.offsetHeight - 12))}px`;
    };
    const handleMapClick = (event: maplibregl.MapMouseEvent) => {
      const vesselId = vesselAtPoint(event)?.properties.id;
      if (typeof vesselId === "string") {
        hideVesselTooltip();
        onSelectVesselRef.current(vesselId);
        return;
      }
      mapClickRef.current?.([event.lngLat.lng, event.lngLat.lat]);
    };
    map.on("mousemove", showVesselTooltip);
    map.on("click", handleMapClick);
    map.getCanvas().addEventListener("mouseleave", hideVesselTooltip);

    let manualMove = false;
    const reportViewport = () => {
      const bounds = map.getBounds();
      const wrapLongitude = (value: number) => ((value + 180) % 360 + 360) % 360 - 180;
      const wholeWorld = bounds.getEast() - bounds.getWest() >= 360;
      viewportChangeRef.current?.({
        west: wholeWorld ? -180 : wrapLongitude(bounds.getWest()),
        east: wholeWorld ? 180 : wrapLongitude(bounds.getEast()),
        south: Math.max(-85, bounds.getSouth()),
        north: Math.min(85, bounds.getNorth()),
      }, manualMove);
      manualMove = false;
    };
    map.on("movestart", (event) => {
      manualMove = !!event.originalEvent;
      hideVesselTooltip();
    });
    map.on("resize", reportViewport);
    map.on("style.load", () => {
      hideVesselTooltip();
      applyMapPalette(map);
      styleLoadedRef.current = true;
      setStyleVersion((version) => version + 1);
    });

    map.on("error", () => {
      // Suppress tile loading errors (403s from tile providers are normal)
    });

    map.on("load", () => {
      setZoomLevel(map.getZoom());
      map.addControl(new maplibregl.NavigationControl(), "top-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
      map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: "nautical" }), "bottom-left");
      const center = map.getCenter();
      centerChangeRef.current?.([center.lng, center.lat]);
      reportViewport();

      map.on("moveend", () => {
        const nextCenter = map.getCenter();
        centerChangeRef.current?.([nextCenter.lng, nextCenter.lat]);
        reportViewport();
      });

      map.on("zoom", () => {
        setZoomLevel(map.getZoom());
      });

    });

    return () => {
      map.off("mousemove", showVesselTooltip);
      map.off("click", handleMapClick);
      map.getCanvas().removeEventListener("mouseleave", hideVesselTooltip);
      tooltip.remove();
      map.remove();
      mapRef.current = null;
      styleLoadedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    updateVesselPoints();
  }, [updateVesselPoints, styleVersion]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers, styleVersion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.on("moveend", updateMarkers);
    map.on("resize", updateMarkers);
    return () => {
      map.off("moveend", updateMarkers);
      map.off("resize", updateMarkers);
    };
  }, [updateMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const applied = appliedStyleRef.current;
    if (applied.mode === mapMode && applied.key === satelliteStyleKey) return;
    appliedStyleRef.current = { mode: mapMode, key: satelliteStyleKey };
    styleLoadedRef.current = false;
    map.setStyle(buildMapStyle(mapMode, satelliteTiles), { diff: false });
  }, [mapMode, satelliteStyleKey, satelliteTiles]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoadedRef.current) return;
    geofences.forEach((gf) => {
      if (map.getSource(`geofence-${gf.id}`)) return;
      const color = geofenceColor(gf.zone_type);
      map.addSource(`geofence-${gf.id}`, {
        type: "geojson",
        data: { type: "Feature", geometry: gf.geometry, properties: { name: gf.name, zone_type: gf.zone_type } },
      });
      map.addLayer({
        id: `geofence-fill-${gf.id}`, type: "fill", source: `geofence-${gf.id}`,
        paint: { "fill-color": color, "fill-opacity": 0.035 },
      });
      map.addLayer({
        id: `geofence-line-${gf.id}`, type: "line", source: `geofence-${gf.id}`,
        paint: { "line-color": color, "line-width": 1, "line-dasharray": [4, 3], "line-opacity": 0.4 },
      });
    });
  }, [geofences, styleVersion]);

  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    if (!isDemo && flyTo.zoom === 2) {
      mapRef.current.fitBounds(WORLD_BOUNDS, {
        padding: { top: window.innerWidth < 640 ? 124 : 84, bottom: window.innerWidth < 1024 ? 112 : 64, left: 24, right: 24 },
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700,
      });
      return;
    }
    mapRef.current.easeTo({
      center: flyTo.center,
      zoom: selectedVesselId ? Math.max(mapRef.current.getZoom(), 10) : flyTo.zoom,
      offset: selectedVesselId ? (mapRef.current.getContainer().clientWidth < 640
        ? [0, 60 - mapRef.current.getContainer().clientHeight * 0.34]
        : [-210, 0]) : [0, 0],
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450,
    });
  // Closing the detail panel should keep the current map position.
  }, [flyTo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Vessel trail when selected
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoadedRef.current) return;

    if (trailVesselIdRef.current !== selectedVesselId) {
      if (map.getLayer("vessel-trail")) map.removeLayer("vessel-trail");
      if (map.getSource("vessel-trail")) map.removeSource("vessel-trail");
      trailVesselIdRef.current = selectedVesselId;
    }
    if (!selectedVesselId) return;

    const trailColor = vesselColor(selectedRiskScore ?? null);

    let cancelled = false;
    api.getVesselDetail(selectedVesselId).then((detail) => {
      if (cancelled || !mapRef.current || !styleLoadedRef.current) return;
      const positions = detail.positions;
      if (!positions || positions.length < 2) return;

      // Break trail into segments at implausible position jumps
      // (avoids drawing straight lines over land when AIS data teleports)
      const segments: [number, number][][] = [];
      let currentSegment: [number, number][] = [[positions[0].longitude, positions[0].latitude]];

      for (let i = 1; i < positions.length; i++) {
        const prev = positions[i - 1];
        const curr = positions[i];
        const dtHours = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 3_600_000;
        if (dtHours <= 0) {
          currentSegment.push([curr.longitude, curr.latitude]);
          continue;
        }
        // Approximate distance in nautical miles using equirectangular projection
        const dLat = (curr.latitude - prev.latitude) * 60;
        const dLon = (curr.longitude - prev.longitude) * 60 * Math.cos((curr.latitude * Math.PI) / 180);
        const distNm = Math.sqrt(dLat * dLat + dLon * dLon);
        const impliedSpeed = distNm / dtHours;

        if (impliedSpeed > 60) {
          // Break — this jump is physically impossible, start a new segment
          if (currentSegment.length >= 2) segments.push(currentSegment);
          currentSegment = [[curr.longitude, curr.latitude]];
        } else {
          currentSegment.push([curr.longitude, curr.latitude]);
        }
      }
      if (currentSegment.length >= 2) segments.push(currentSegment);
      if (segments.length === 0) return;

      const data = {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "MultiLineString" as const,
          coordinates: segments,
        },
      };
      const source = map.getSource("vessel-trail") as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(data);
      } else {
        map.addSource("vessel-trail", { type: "geojson", data });
      }
      if (map.getLayer("vessel-trail")) {
        map.setPaintProperty("vessel-trail", "line-color", trailColor);
      } else {
        map.addLayer({
          id: "vessel-trail",
          type: "line",
          source: "vessel-trail",
          paint: {
            "line-color": trailColor,
            "line-width": 2,
            "line-opacity": 0.6,
          },
        });
      }
    }).catch((err) => {
      console.error("Failed to fetch vessel trail:", err);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedVesselId, selectedPositionTimestamp, selectedRiskScore, mapMode, satelliteStyleKey, styleVersion, api]);

  // Satellite imagery overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoadedRef.current) return;

    if (map.getLayer("sat-imagery")) map.removeLayer("sat-imagery");
    if (map.getSource("sat-imagery")) map.removeSource("sat-imagery");

    if (!satelliteOverlay) return;

    const [west, south, east, north] = satelliteOverlay.bbox;
    const overlayUrl = resolveSatelliteOverlayUrl(satelliteOverlay.imageSrc, satelliteOverlay.renderToken);
    if (!overlayUrl) return;

    map.addSource("sat-imagery", {
      type: "image",
      url: overlayUrl,
      coordinates: [
        [west, north],
        [east, north],
        [east, south],
        [west, south],
      ],
    });

    map.addLayer({
      id: "sat-imagery",
      type: "raster",
      source: "sat-imagery",
      paint: {
        "raster-opacity": 0.9,
        "raster-fade-duration": 0,
      },
    });
  }, [satelliteOverlay, mapMode, satelliteStyleKey, styleVersion]);

  return (
    <div className="absolute inset-0 lg:left-[300px]">
      <div
        ref={mapContainer}
        role="application"
        aria-label={`Vessel tracking map · ${vessels.length} tracked vessel${vessels.length === 1 ? "" : "s"}. Use the alert queue or search (Cmd+K) to select a vessel.`}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", background: mapMode === "chart" ? "#dbe6e8" : "#18282f" }}
      />
      {mapUnavailable && (
        <div role="status" className="absolute inset-0 flex items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <h2 className="text-sm font-semibold text-slate-100">Map unavailable in this browser</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">Enable graphics acceleration or use a browser with WebGL support to view the map.</p>
          </div>
        </div>
      )}
      {/* Base map toggle */}
      <div ref={styleMenuRef} aria-label="Map style" className="absolute bottom-[var(--map-tools-bottom)] right-3 z-10">
        {styleMenuOpen && <div id="map-style-options" className="mb-2 w-52 border border-[var(--workspace-border)] bg-[var(--workspace-surface)] p-1.5">
          <p className="px-3 py-2 text-xs font-medium text-slate-400">Map style</p>
          {([['chart', 'Chart'], ['maps', 'Hybrid'], ['satellite', 'Satellite']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={mapMode === value} onClick={() => { setMapMode(value); setStyleMenuOpen(false); }} className={`flex min-h-11 w-full items-center justify-between px-3 text-sm ${mapMode === value ? "bg-[var(--workspace-subtle)] text-[var(--workspace-ink)]" : "text-[var(--workspace-muted)] hover:bg-[var(--workspace-subtle)]"}`}>{label}{mapMode === value && <span aria-hidden="true">✓</span>}</button>)}
          <div className="mt-1 border-t border-[var(--workspace-border)] px-3 py-3 text-xs text-slate-300">
            <p className="mb-2 text-slate-400">Vessel risk score</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              {([[0, "Below 35"], [35, "35–59"], [60, "60–79"], [80, "80–100"]] as const).map(([score, label]) => <span key={label} className="flex items-center gap-2"><span className="h-2 w-2" style={{ backgroundColor: vesselColor(score) }} />{label}</span>)}
            </div>
            <p className="mt-2 text-slate-400">Based on detected behavior.</p>
          </div>
        </div>}
        <button type="button" aria-label="Change map style" aria-expanded={styleMenuOpen} aria-controls="map-style-options" disabled={mapUnavailable} onClick={() => setStyleMenuOpen(!styleMenuOpen)} className="flex min-h-11 min-w-11 items-center gap-2 border border-[var(--workspace-border)] bg-[var(--workspace-surface)] px-3 text-sm text-[var(--workspace-ink)] hover:bg-[var(--workspace-subtle)] disabled:opacity-40">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" /></svg>
          <span className="hidden min-[360px]:inline">Map style</span>
        </button>
      </div>

    </div>
  );
}


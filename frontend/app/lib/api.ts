import { demoApi } from "./demo-api";

export type DataMode = "demo" | "live";
export type PositionHistoryCursor = { timestamp: string; id: number };
export const DEFAULT_DATA_MODE: DataMode = "live";
export function getDataMode(value: string | null): DataMode {
  return value === "demo" || value === "live" ? value : DEFAULT_DATA_MODE;
}
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api";
export const IS_FREE_HOSTED_API = process.env.NEXT_PUBLIC_API_HOSTING === "render-free";

export type MapBounds = { west: number; south: number; east: number; north: number };
export type MapCoverage = {
  state: "watching" | "zoom_in" | "busy" | "superseded";
  subscribed: boolean;
  expires_in: number;
};

export function canWatchMap(bounds: MapBounds): boolean {
  const width = (bounds.east - bounds.west + 360) % 360 || 360;
  const height = bounds.north - bounds.south;
  return width <= 32 && height <= 24 && width * height <= 256;
}

export const watchMapCoverage = (
  clientId: string,
  revision: number,
  bounds: MapBounds | null,
  options: { background?: boolean; keepalive?: boolean } = {},
) =>
  fetchAPI<MapCoverage>("/map/coverage", {
    method: "POST",
    keepalive: options.keepalive,
    body: JSON.stringify({ client_id: clientId, revision, bounds, ...(options.background ? { background: true } : {}) }),
  });

// The FastAPI backend is hosted separately from this frontend. When it's down the
// browser throws an opaque TypeError, so surface the actual cause to the operator.
const OFFLINE_MESSAGE =
  "The live AIS service isn’t responding. Try again shortly or open the live demo.";

export class BackendOfflineError extends Error {
  constructor() {
    super(OFFLINE_MESSAGE);
    this.name = "BackendOfflineError";
  }
}

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: options?.signal ?? AbortSignal.timeout(8000),
      headers: { ...(options?.body ? { "Content-Type": "application/json" } : {}), ...options?.headers },
    });
  } catch {
    throw new BackendOfflineError();
  }
  // 502-504 means the platform can't reach the app. A 404 is ambiguous: the API uses it
  // for "vessel not found", but a deleted Railway app also 404s with its own JSON body —
  // only the latter lacks the `detail` field FastAPI always sends.
  if (res.status >= 502 && res.status <= 504) throw new BackendOfflineError();
  if (!res.headers.get("content-type")?.includes("application/json")) throw new BackendOfflineError();
  if (res.status === 404) {
    const body = await res.clone().json().catch(() => null);
    if (!body || typeof body.detail !== "string") throw new BackendOfflineError();
  }
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// ── Types ─────────────────────────────────────────────

export interface Position {
  timestamp: string;
  latitude: number;
  longitude: number;
  speed_over_ground: number | null;
  course_over_ground: number | null;
  heading: number | null;
}

export interface Vessel {
  id: string;
  mmsi: string;
  name: string;
  vessel_type: string;
  flag_state: string;
  length: number | null;
  beam: number | null;
  draft: number | null;
  imo: string | null;
  callsign: string | null;
  destination: string | null;
  latest_position: Position | null;
  risk_score: number | null;
  risk_assessed_at?: string | null;
  recommended_action: string | null;
  is_inactive?: boolean;
  is_resolved?: boolean;
  status_reason?: string | null;
}

export interface Weather {
  wind_speed_kt: number;
  wind_direction: string;
  visibility_nm: number;
  temperature_f: number | null;
  description: string;
}

export interface VesselDetail extends Vessel {
  alert_id?: string | null;
  alert_status?: string | null;
  alert_feedback?: string | null;
  operator_notes?: string[];
  positions: Position[];
  anomaly_signals: AnomalySignal[];
  explanation: string | null;
  inspection_deficiencies: number;
  last_inspection_date: string | null;
  weather: Weather | null;
}

export interface RiskHistoryPoint {
  vessel_id: string;
  risk_score: number;
  recommended_action: string;
  timestamp: string;
}

export interface AnomalySignal {
  anomaly_type: string;
  severity: number;
  description: string;
  details: Record<string, unknown> | null;
}

export interface Alert {
  id: string;
  vessel_id: string;
  vessel_name: string | null;
  vessel_mmsi: string | null;
  created_at: string;
  status: string;
  risk_score: number;
  recommended_action: string;
  explanation: string;
  anomaly_signals: AnomalySignal[];
}

export interface Geofence {
  id: string;
  name: string;
  zone_type: string;
  geometry: GeoJSON.Geometry;
  severity: string;
  description: string | null;
}

export interface VerificationRequest {
  id: string;
  alert_id: string | null;
  vessel_id: string;
  status: string;
  asset_type: string | null;
  asset_id: string | null;
  created_at: string;
  updated_at: string;
  result_confidence: number | null;
  result_notes: string | null;
  result_media_ref: string | null;
  satellite: SatelliteVerification | null;
}

export interface SatelliteBBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface SatelliteSearch {
  spread_deg: number | null;
  days_back: number | null;
  max_cloud_cover: number | null;
}

export interface SatelliteScene {
  acquired_at: string | null;
  satellite: string | null;
  resolution_m: number | null;
  cloud_cover_pct: number | null;
  status: string | null;
  catalog_id: string | null;
  note: string | null;
}

export interface SatelliteVerification {
  source: string | null;
  catalog_status: string | null;
  request_lat: number | null;
  request_lng: number | null;
  bbox: SatelliteBBox | null;
  search: SatelliteSearch | null;
  scene: SatelliteScene | null;
}

export interface SatelliteTileSource {
  tile_url: string;
  source: string;
  time_range: string;
  resolution: string;
  tile_size: number;
  max_zoom: number;
  attribution: string;
  note: string;
  sentinel2_available: boolean;
}

export interface SatelliteConstellationInfo {
  constellation: string;
  satellites: string[];
  resolution: string;
  revisit_days: number;
  swath_width_km: number;
  bands: number;
  orbit: string;
  data_access: string;
  configured: boolean;
  integration_status: string;
}

export interface SatelliteInfoResponse {
  configured: boolean;
  tiles: SatelliteTileSource;
  constellation: SatelliteConstellationInfo;
}

export interface SatelliteAcquisition {
  id: string | null;
  datetime: string | null;
  cloud_cover: number | null;
  satellite: string | null;
  processing_level: string | null;
  bbox: [number, number, number, number] | null;
  geometry: GeoJSON.Geometry | null;
  render_url: string | null;
}

export interface SatelliteSearchResponse {
  bbox: SatelliteBBox | null;
  focus?: { latitude: number; longitude: number } | null;
  results: SatelliteAcquisition[];
  count: number;
}

export interface Timeline {
  start: string | null;
  end: string | null;
  total_reports: number;
}

export interface Region {
  name: string;
  center: [number, number];
  zoom: number;
  description: string;
  bbox: [[number, number], [number, number]];
}

export interface IngestionStatus {
  running: boolean;
  connected: boolean;
  available: boolean;
  vessels_seen: number;
  positions_ingested: number;
  vessels_created: number;
  vessels_updated: number;
  last_alert_run: string | null;
  stream_stats: {
    messages_received: number;
    position_reports: number;
    static_data: number;
    errors: number;
    connected_since: string | null;
    regions?: string[];
  };
}

// ── Paginated Response ────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  last_report_at?: string | null;
}

export interface AlertAudit {
  action: string;
  details: string | null;
  timestamp: string;
}

export interface RiskHistogramBin {
  bin_start: number;
  bin_end: number;
  count_active: number;
  count_resolved: number;
}

export interface RiskTier {
  action: string;
  count: number;
  avg_signals: number;
  top_signals: Record<string, number>;
}

export interface RiskDistribution {
  histogram: RiskHistogramBin[];
  tiers: RiskTier[];
  unassessed_count?: number;
}

export interface DetectionMetrics {
  total_alerts: number;
  active_alerts: number;
  acknowledged: number;
  dismissed: number;
  confirmed_threats: number;
  false_positives: number;
  pending_feedback: number;
  precision: number | null;
}

export interface TimePositionEntry {
  vessel_id: string;
  vessel_name: string | null;
  vessel_type: string | null;
  mmsi: string | null;
  latitude: number;
  longitude: number;
  speed_over_ground: number | null;
  course_over_ground: number | null;
  heading: number | null;
  timestamp: string;
  risk_score: number | null;
  risk_assessed_at?: string | null;
  recommended_action: string | null;
}

export interface SatelliteSearchParams {
  vesselId?: string;
  west?: number;
  south?: number;
  east?: number;
  north?: number;
  spreadDeg?: number;
  daysBack?: number;
  maxCloudCover?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

// ── API Functions ─────────────────────────────────────

const liveApi = {
  getRegions: () => fetchAPI<Record<string, Region>>("/regions?explore=true"),
  getVessels: (region?: string, limit = 500, offset = 0, bounds?: MapBounds) => {
    const params = new URLSearchParams();
    if (region) params.set("region", region);
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    if (bounds) params.set("bounds", JSON.stringify(bounds));
    return fetchAPI<PaginatedResponse<Vessel>>(`/vessels?${params}`);
  },
  getVesselDetail: (id: string, alertId?: string) =>
    fetchAPI<VesselDetail>(`/vessels/${id}${alertId ? `?alert_id=${encodeURIComponent(alertId)}` : ""}`),
  getAlerts: (status?: string, region?: string, limit = 500, offset = 0, bounds?: MapBounds) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (region) params.set("region", region);
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    if (bounds) params.set("bounds", JSON.stringify(bounds));
    return fetchAPI<PaginatedResponse<Alert>>(`/alerts?${params}`);
  },
  getAlertDetail: (id: string) => fetchAPI<Alert>(`/alerts/${id}`),
  alertAction: (id: string, action: string, notes?: string, feedback?: string) =>
    fetchAPI<{ id: string; status: string; feedback: string | null }>(`/alerts/${id}/action`, {
      method: "POST",
      body: JSON.stringify({ action, notes: notes || null, feedback: feedback || null }),
    }),
  getAlertAudit: (id: string) => fetchAPI<AlertAudit[]>(`/alerts/${id}/audit`),
  getDetectionMetrics: (region?: string) => {
    const params = new URLSearchParams();
    if (region) params.set("region", region);
    const qs = params.toString();
    return fetchAPI<DetectionMetrics>(`/detection/metrics${qs ? `?${qs}` : ""}`);
  },
  getRiskDistribution: () => fetchAPI<RiskDistribution>("/analytics/distribution"),
  updateAlert: (id: string, status: string) =>
    fetchAPI(`/alerts/${id}?status=${status}`, { method: "PATCH" }),
  getGeofences: () => fetchAPI<Geofence[]>("/geofences"),
  getTimeline: () => fetchAPI<Timeline>("/scenario/timeline"),
  getSatelliteInfo: () => fetchAPI<SatelliteInfoResponse>("/satellite/info"),
  searchSatelliteImagery: (params: SatelliteSearchParams) => {
    const query = new URLSearchParams();
    if (params.daysBack != null) query.set("days_back", String(params.daysBack));
    if (params.maxCloudCover != null) query.set("max_cloud_cover", String(params.maxCloudCover));
    if (params.limit != null) query.set("limit", String(params.limit));
    if (params.dateFrom) query.set("date_from", params.dateFrom);
    if (params.dateTo) query.set("date_to", params.dateTo);

    if (params.vesselId) {
      if (params.spreadDeg != null) query.set("spread_deg", String(params.spreadDeg));
      return fetchAPI<SatelliteSearchResponse>(`/satellite/by-vessel/${params.vesselId}?${query}`);
    }

    if (
      params.west == null ||
      params.south == null ||
      params.east == null ||
      params.north == null
    ) {
      throw new Error("Satellite bbox search requires west, south, east, and north.");
    }

    query.set("west", String(params.west));
    query.set("south", String(params.south));
    query.set("east", String(params.east));
    query.set("north", String(params.north));
    return fetchAPI<SatelliteSearchResponse>(`/satellite/search?${query}`);
  },
  getSatelliteImageryUrl: (params: {
    west: number;
    south: number;
    east: number;
    north: number;
    width?: number;
    height?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const query = new URLSearchParams({
      west: String(params.west),
      south: String(params.south),
      east: String(params.east),
      north: String(params.north),
      width: String(params.width ?? 768),
      height: String(params.height ?? 768),
    });
    if (params.dateFrom) query.set("date_from", params.dateFrom);
    if (params.dateTo) query.set("date_to", params.dateTo);
    return `/api/satellite/imagery?${query.toString()}`;
  },
  createVerificationRequest: (
    alertId: string | null,
    vesselId: string,
    focus?: { latitude: number; longitude: number } | null,
  ) =>
    fetchAPI<VerificationRequest>("/verification-requests", {
      method: "POST",
      body: JSON.stringify({
        alert_id: alertId ?? null,
        vessel_id: vesselId,
        asset_type: "satellite",
        focus_lat: focus?.latitude ?? null,
        focus_lng: focus?.longitude ?? null,
      }),
    }),
  getVerificationRequest: (id: string) =>
    fetchAPI<VerificationRequest>(`/verification-requests/${id}`),
  getIngestionStatus: () => fetchAPI<IngestionStatus>("/ingestion/status"),
  getVesselReport: (vesselId: string, options: { positionCursor?: PositionHistoryCursor | null; alertOffset?: number; until?: string } = {}) => {
    const params = new URLSearchParams();
    if (options.positionCursor) {
      params.set("position_before", options.positionCursor.timestamp);
      params.set("position_before_id", String(options.positionCursor.id));
    }
    if (options.alertOffset !== undefined) params.set("alert_offset", String(options.alertOffset));
    if (options.until) params.set("until", options.until);
    return fetchAPI<Record<string, unknown>>(`/vessels/${vesselId}/report${params.size ? `?${params}` : ""}`);
  },
  getPositionsAtTime: (timestamp: string) =>
    fetchAPI<TimePositionEntry[]>(`/vessels/positions/at-time?timestamp=${encodeURIComponent(timestamp)}`),
  getRiskHistory: (vesselId: string, hours = 6) =>
    fetchAPI<RiskHistoryPoint[]>(`/vessels/${vesselId}/risk-history?hours=${hours}`),
};

export type Api = typeof liveApi;
export const getApi = (mode: DataMode): Api => mode === "demo" ? demoApi : liveApi;
export const api = getApi(DEFAULT_DATA_MODE);

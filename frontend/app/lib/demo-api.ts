import { demoScenario as snapshot } from "./demo-scenario";
import { riskLevel } from "./risk";
import type { Api, AlertAudit, SatelliteInfoResponse, VesselDetail } from "./api";
export const DEMO_SAVED_AT = snapshot.savedAt;
export const DEMO_DURATION_MS = 10 * 60_000;
export const DEMO_PLAYBACK_RATE = 10;
const replayStart = Date.parse(DEMO_SAVED_AT) - DEMO_DURATION_MS;
let replayElapsed = 0;

export function getDemoElapsed() {
  return replayElapsed;
}

export function setDemoElapsed(elapsed: number) {
  replayElapsed = Math.min(DEMO_DURATION_MS, Math.max(0, elapsed));
}

const alerts = structuredClone(snapshot.alerts);
const notes = new Map<string, string[]>();
const feedback = new Map<string, string>();
const audit = new Map<string, AlertAudit[]>();
const positions = snapshot.vessels.flatMap((vessel) => vessel.positions);
const times = positions.map((position) => position.timestamp).sort();

function findAlert(id: string) {
  const alert = alerts.find((entry) => entry.id === id);
  if (!alert) throw new Error("Demo alert not found.");
  return alert;
}

function vesselDetail(id: string): VesselDetail {
  const vessel = snapshot.vessels.find((entry) => entry.id === id);
  if (!vessel) throw new Error("Demo vessel not found.");
  const alert = alerts.find((entry) => entry.vessel_id === id);
  const resolved = alert?.status === "dismissed" || alert?.status === "resolved";
  const timestamp = replayStart + replayElapsed;
  const trail = vessel.positions.filter((position) => Date.parse(position.timestamp) <= timestamp);
  const previous = trail.at(-1);
  const next = vessel.positions[trail.length];
  if (previous && next) {
    const duration = Date.parse(next.timestamp) - Date.parse(previous.timestamp);
    const fraction = (timestamp - Date.parse(previous.timestamp)) / duration;
    const dLat = (next.latitude - previous.latitude) * 60;
    const dLon = (next.longitude - previous.longitude) * 60 * Math.cos(previous.latitude * Math.PI / 180);
    const speed = Math.hypot(dLat, dLon) / (duration / 3_600_000);
    // Preserve gaps in the scenario instead of animating impossible AIS jumps.
    if (duration <= 300_000 && speed <= 60 && fraction > 0) {
      const startCourse = previous.course_over_ground ?? 0;
      const turn = ((next.course_over_ground ?? startCourse) - startCourse + 540) % 360 - 180;
      trail.push({
        ...previous,
        timestamp: new Date(timestamp).toISOString(),
        latitude: previous.latitude + (next.latitude - previous.latitude) * fraction,
        longitude: previous.longitude + (next.longitude - previous.longitude) * fraction,
        course_over_ground: (startCourse + turn * fraction + 360) % 360,
      });
    }
  }
  return structuredClone({
    ...vessel,
    latest_position: trail.at(-1) ?? null,
    positions: trail,
    is_resolved: resolved,
    status_reason: resolved ? "Reviewed in this demo" : vessel.status_reason,
    operator_notes: notes.get(id) ?? [],
    alert_id: alert?.id,
    alert_status: alert?.status,
    alert_feedback: alert ? feedback.get(alert.id) : undefined,
  });
}

function paginate<T>(items: T[], limit: number, offset: number) {
  return structuredClone({ items: items.slice(offset, offset + limit), total: items.length, limit, offset });
}

const matchesRegion = (region?: string) => !region || region === "la_harbor";
const unavailable = () => { throw new Error("Live satellite requests are unavailable in the demo."); };

const satelliteInfo: SatelliteInfoResponse = {
  configured: false,
  tiles: {
    tile_url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    source: "Esri World Imagery", time_range: "Basemap mosaic", resolution: "Varies by location",
    tile_size: 256, max_zoom: 19, attribution: "Tiles © Esri",
    note: "Basemap imagery is not live vessel verification.", sentinel2_available: false,
  },
  constellation: {
    constellation: "Sentinel-2", satellites: [], resolution: "10 m", revisit_days: 5,
    swath_width_km: 290, bands: 13, orbit: "Sun-synchronous", data_access: "Unavailable in demo",
    configured: false, integration_status: "disabled",
  },
};

export const demoApi: Api = {
  getRegions: async () => structuredClone(snapshot.regions),
  getVessels: async (region, limit = 500, offset = 0) =>
    paginate(matchesRegion(region) ? snapshot.vessels.map((vessel) => vesselDetail(vessel.id)) : [], limit, offset),
  getVesselDetail: async (id) => vesselDetail(id),
  getAlerts: async (status, region, limit = 500, offset = 0) => paginate(
    matchesRegion(region)
      ? alerts.filter((alert) => !status || alert.status === status).sort((a, b) => b.risk_score - a.risk_score)
      : [],
    limit, offset,
  ),
  getAlertDetail: async (id) => structuredClone(findAlert(id)),
  alertAction: async (id, action, note, value) => {
    const alert = findAlert(id);
    const statuses: Record<string, string> = {
      acknowledge: "acknowledged", acknowledged: "acknowledged", dismiss: "dismissed",
      dismissed: "dismissed", resolve: "resolved", resolved: "resolved", pin: "pinned", pinned: "pinned",
    };
    if (statuses[action]) alert.status = statuses[action];
    if (note?.trim()) notes.set(alert.vessel_id, [...(notes.get(alert.vessel_id) ?? []), note.trim()]);
    if (value === "confirmed" || value === "false_positive") feedback.set(id, value);
    audit.set(id, [...(audit.get(id) ?? []), {
      action,
      details: note?.trim() || value || alert.status,
      timestamp: new Date().toISOString(),
    }]);
    return { id, status: alert.status, feedback: feedback.get(id) ?? null };
  },
  getAlertAudit: async (id) => structuredClone(audit.get(findAlert(id).id) ?? []),
  updateAlert: async (id, status) => {
    findAlert(id).status = status;
    return { id, status };
  },
  getDetectionMetrics: async (region) => {
    const items = matchesRegion(region) ? alerts : [];
    const confirmed = items.filter((alert) => feedback.get(alert.id) === "confirmed").length;
    const falsePositives = items.filter((alert) => feedback.get(alert.id) === "false_positive").length;
    return {
      total_alerts: items.length,
      active_alerts: items.filter((alert) => alert.status === "active").length,
      acknowledged: items.filter((alert) => alert.status === "acknowledged").length,
      dismissed: items.filter((alert) => alert.status === "dismissed").length,
      confirmed_threats: confirmed, false_positives: falsePositives,
      pending_feedback: items.filter((alert) => !feedback.has(alert.id) && alert.status !== "dismissed").length,
      precision: confirmed + falsePositives ? confirmed / (confirmed + falsePositives) : null,
    };
  },
  getRiskDistribution: async () => {
    const vessels = snapshot.vessels.map((vessel) => vesselDetail(vessel.id));
    const histogram = Array.from({ length: 10 }, (_, index) => {
      const inBin = vessels.filter((vessel) => Math.min(9, Math.floor((vessel.risk_score ?? 0) / 10)) === index);
      return {
        bin_start: index * 10, bin_end: (index + 1) * 10,
        count_active: inBin.filter((vessel) => !vessel.is_resolved).length,
        count_resolved: inBin.filter((vessel) => vessel.is_resolved).length,
      };
    });
    const tiers = ["escalate", "verify", "monitor", "normal"].map((action) => {
      const items = vessels.filter((vessel) => !vessel.is_resolved && riskLevel(vessel.risk_score) === action);
      const signals = items.flatMap((vessel) => vessel.anomaly_signals);
      const top_signals: Record<string, number> = {};
      for (const signal of signals) top_signals[signal.anomaly_type] = (top_signals[signal.anomaly_type] ?? 0) + 1;
      return { action, count: items.length, avg_signals: items.length ? signals.length / items.length : 0, top_signals };
    });
    return { histogram, tiers };
  },
  getGeofences: async () => structuredClone(snapshot.geofences),
  getTimeline: async () => ({ start: times[0] ?? null, end: times.at(-1) ?? null, total_reports: positions.length }),
  getSatelliteInfo: async () => structuredClone(satelliteInfo),
  searchSatelliteImagery: async () => unavailable(),
  getSatelliteImageryUrl: unavailable,
  createVerificationRequest: async () => unavailable(),
  getVerificationRequest: async () => unavailable(),
  getIngestionStatus: async () => ({
    running: false, connected: false, available: false,
    vessels_seen: snapshot.vessels.length, positions_ingested: positions.length,
    vessels_created: snapshot.vessels.length, vessels_updated: 0, last_alert_run: null,
    stream_stats: { messages_received: 0, position_reports: 0, static_data: 0, errors: 0, connected_since: null },
  }),
  getVesselReport: async (id) => {
    const vessel = vesselDetail(id);
    const alert = alerts.find((entry) => entry.vessel_id === id);
    return structuredClone({
      demo: true, scenario_time: new Date(replayStart + replayElapsed).toISOString(), generated_at: new Date().toISOString(),
      vessel, latest_position: vessel.latest_position,
      risk_assessment: { score: vessel.risk_score, recommended_action: vessel.recommended_action, explanation: vessel.explanation },
      anomaly_signals: vessel.anomaly_signals,
      position_trail: vessel.positions,
      alert_audit_trail: alert ? audit.get(alert.id) ?? [] : [],
      operator_notes: notes.get(id)?.join("\n") ?? null,
      verification_requests: [],
    });
  },
  getPositionsAtTime: async (timestamp) => snapshot.vessels.flatMap((vessel) => {
    const position = vessel.positions.findLast((entry) => Date.parse(entry.timestamp) <= Date.parse(timestamp));
    return position ? [{
      ...position, vessel_id: vessel.id, vessel_name: vessel.name, vessel_type: vessel.vessel_type,
      mmsi: vessel.mmsi, risk_score: vessel.risk_score ?? 0, recommended_action: vessel.recommended_action ?? "normal",
    }] : [];
  }),
  getRiskHistory: async (id, hours = 6) => {
    vesselDetail(id);
    const cutoff = Date.parse(DEMO_SAVED_AT) - hours * 3_600_000;
    return structuredClone((snapshot.history[id] ?? []).filter((point) => Date.parse(point.timestamp) >= cutoff));
  },
};

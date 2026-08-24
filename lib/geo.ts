// Client-side distance/ETA estimate for live tracking. There's no routing
// engine on the backend, so this is a straight-line (haversine) distance
// with a flat assumed average speed — good enough for "~8 min away", not
// meant to match a turn-by-turn ETA.

const EARTH_RADIUS_KM = 6371;
const ASSUMED_AVG_SPEED_KMH = 22; // urban driving/two-wheeler average

export function haversineDistanceKm(
  lat1: number, lng1: number, lat2: number, lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function estimateEtaMinutes(distanceKm: number, avgSpeedKmh = ASSUMED_AVG_SPEED_KMH): number {
  if (distanceKm <= 0) return 0;
  return Math.round((distanceKm / avgSpeedKmh) * 60);
}

// Distance below which we consider the worker to have arrived, rather
// than still "approaching" — GPS drift means this can't be zero.
export const ARRIVED_RADIUS_KM = 0.15;

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatEta(minutes: number): string {
  if (minutes <= 1) return 'Arriving now';
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `~${h}h ${m}m`;
}

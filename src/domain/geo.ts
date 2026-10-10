import type { LatLng, TrackPoint } from './types';

const R = 6371008.8; // mean Earth radius, meters
const toRad = (d: number) => (d * Math.PI) / 180;

export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function trackDistance(track: ReadonlyArray<LatLng>): number {
  let d = 0;
  for (let i = 1; i < track.length; i++) d += distanceMeters(track[i - 1], track[i]);
  return d;
}

export type BoundingBox = { minLat: number; maxLat: number; minLng: number; maxLng: number };

export function boundingBox(points: ReadonlyArray<LatLng>): BoundingBox | null {
  if (points.length === 0) return null;
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  return { minLat, maxLat, minLng, maxLng };
}

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

/**
 * Map region (center + deltas) that fits all points with padding.
 * `padding` is a fraction of the span added on each side (default 0.2). A minimum
 * delta keeps single-point or tiny tracks from zooming in absurdly far.
 */
export function regionForPoints(
  points: ReadonlyArray<LatLng>,
  padding = 0.2,
  minDelta = 0.005,
): MapRegion | null {
  const box = boundingBox(points);
  if (!box) return null;
  const latSpan = box.maxLat - box.minLat;
  const lngSpan = box.maxLng - box.minLng;
  return {
    latitude: (box.minLat + box.maxLat) / 2,
    longitude: (box.minLng + box.maxLng) / 2,
    latitudeDelta: Math.max(minDelta, latSpan * (1 + 2 * padding)),
    longitudeDelta: Math.max(minDelta, lngSpan * (1 + 2 * padding)),
  };
}

/** Total distance along a GPS track in meters. */
export function trackPointsDistance(track: ReadonlyArray<TrackPoint>): number {
  return trackDistance(track);
}

/** Speed in m/s between two fixes, derived from distance / time. Returns 0 if dt <= 0. */
export function derivedSpeed(a: TrackPoint, b: TrackPoint): number {
  const dt = (b.t - a.t) / 1000;
  if (dt <= 0) return 0;
  return distanceMeters(a, b) / dt;
}

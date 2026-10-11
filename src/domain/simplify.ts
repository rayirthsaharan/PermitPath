import type { TrackPoint } from './types';

// Flat-map projection (meters) around a reference latitude.
function project(p: TrackPoint, lat0: number): { x: number; y: number } {
  const R = 6371008.8;
  const k = Math.PI / 180;
  return { x: R * p.lng * k * Math.cos(lat0 * k), y: R * p.lat * k };
}

function perpendicularDistance(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * Douglas-Peucker line simplifying, tolerance in meters. Always keeps the first and last points.
 * Uses a loop, not recursion, so long tracks are safe.
 */
export function simplifyTrack(track: ReadonlyArray<TrackPoint>, toleranceM = 5): TrackPoint[] {
  const n = track.length;
  if (n <= 2) return track.slice();
  const lat0 = track[0].lat;
  const proj = track.map((p) => project(p, lat0));
  const keep = new Array<boolean>(n).fill(false);
  keep[0] = true;
  keep[n - 1] = true;
  const stack: Array<[number, number]> = [[0, n - 1]];
  while (stack.length) {
    const [s, e] = stack.pop()!;
    let maxD = -1;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpendicularDistance(proj[i], proj[s], proj[e]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (idx !== -1 && maxD > toleranceM) {
      keep[idx] = true;
      stack.push([s, idx], [idx, e]);
    }
  }
  return track.filter((_, i) => keep[i]);
}


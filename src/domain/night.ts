import { isNightAt } from './solar';
import type { NightRule, TrackPoint } from './types';

/** Any single interval between fixes is capped at this many seconds (GPS gaps must not inflate time). */
export const MAX_INTERVAL_SEC = 120;

export type DayNightSplit = { totalSec: number; nightSec: number };

/**
 * Walk the track and classify each interval between consecutive fixes as day
 * or night using the interval's midpoint time and midpoint location.
 *
 * Behavior for gaps: an interval longer than MAX_INTERVAL_SEC (120 s) is still
 * classified by its midpoint, but only 120 s of it is counted. Gaps therefore
 * never inflate logged time; the lost time is simply not counted. Intervals
 * with non-positive duration are ignored. Tracks with < 2 points return zeros.
 */
export function splitDayNight(
  track: ReadonlyArray<TrackPoint>,
  rule: NightRule,
  fixed?: { startHour: number; endHour: number },
): DayNightSplit {
  let totalSec = 0;
  let nightSec = 0;
  for (let i = 1; i < track.length; i++) {
    const a = track[i - 1];
    const b = track[i];
    const rawSec = (b.t - a.t) / 1000;
    if (rawSec <= 0) continue;
    const sec = Math.min(rawSec, MAX_INTERVAL_SEC);
    const mid = (a.t + b.t) / 2;
    const lat = (a.lat + b.lat) / 2;
    const lng = (a.lng + b.lng) / 2;
    totalSec += sec;
    if (isNightAt(mid, lat, lng, rule, fixed)) nightSec += sec;
  }
  return { totalSec, nightSec };
}

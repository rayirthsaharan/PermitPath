import { splitDayNight } from './night';
import { sunTimes } from './solar';
import type { TrackPoint } from './types';

const LAT = 36.2;
const LNG = -86.52;

function makeTrack(startMs: number, seconds: number, stepSec = 10): TrackPoint[] {
  const pts: TrackPoint[] = [];
  for (let s = 0; s <= seconds; s += stepSec) {
    pts.push({ t: startMs + s * 1000, lat: LAT, lng: LNG, speed: 10 });
  }
  return pts;
}

describe('splitDayNight', () => {
  const sun = sunTimes(2024, 6, 20, LAT, LNG);

  it('all-day drive has zero night', () => {
    const r = splitDayNight(makeTrack(sun.sunrise! + 3 * 3600000, 600), 'sun');
    expect(r.totalSec).toBe(600);
    expect(r.nightSec).toBe(0);
  });

  it('all-night drive is all night', () => {
    const r = splitDayNight(makeTrack(sun.sunset! + 3600000, 600), 'sun');
    expect(r.totalSec).toBe(600);
    expect(r.nightSec).toBe(600);
  });

  it('drive crossing sunset splits partially', () => {
    // Start 5 min before sunset, drive 15 min: ~300 s day, ~600 s night.
    const r = splitDayNight(makeTrack(sun.sunset! - 300000, 900), 'sun');
    expect(r.totalSec).toBe(900);
    expect(Math.abs(r.nightSec - 600)).toBeLessThanOrEqual(10);
  });

  it('caps long gaps at 120 s', () => {
    const t0 = sun.sunset! + 3600000;
    const r = splitDayNight(
      [
        { t: t0, lat: LAT, lng: LNG, speed: 5 },
        { t: t0 + 20 * 60000, lat: LAT, lng: LNG, speed: 5 },
      ],
      'sun',
    );
    expect(r.totalSec).toBe(120);
    expect(r.nightSec).toBe(120);
  });

  it('ignores empty / single-point / backwards tracks', () => {
    expect(splitDayNight([], 'sun')).toEqual({ totalSec: 0, nightSec: 0 });
    expect(splitDayNight(makeTrack(0, 0), 'sun')).toEqual({ totalSec: 0, nightSec: 0 });
    const back: TrackPoint[] = [
      { t: 2000, lat: LAT, lng: LNG, speed: 1 },
      { t: 1000, lat: LAT, lng: LNG, speed: 1 },
    ];
    expect(splitDayNight(back, 'sun').totalSec).toBe(0);
  });

  it('fixed rule uses local hours', () => {
    const night = new Date(2024, 5, 20, 21, 0, 0).getTime();
    const day = new Date(2024, 5, 20, 12, 0, 0).getTime();
    expect(splitDayNight(makeTrack(night, 300), 'fixed').nightSec).toBe(300);
    expect(splitDayNight(makeTrack(day, 300), 'fixed').nightSec).toBe(0);
  });
});

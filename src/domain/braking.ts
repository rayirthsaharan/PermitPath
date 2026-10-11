import type { BrakeSensitivity, HardBrakeEvent, MotionSample, TrackPoint } from './types';

export const BRAKE_THRESHOLDS: Record<BrakeSensitivity, number> = {
  low: 4.9, // 0.5 g
  medium: 3.9, // 0.4 g
  high: 3.2, // 0.33 g
};

export const BRAKE_CONFIG = {
  emaAlpha: 0.3,
  minDurationMs: 300,
  minSpeedBeforeMs: 4.5,
  minSpeedDropMs: 2.5,
  windowMs: 2000,
  debounceMs: 6000,
  /** A motion gap longer than this ends a spike. */
  maxMotionGapMs: 500,
  /** Keep this much GPS history. */
  historyMs: 30000,
} as const;

type Fix = { t: number; lat: number; lng: number; speed: number };
type Candidate = { t: number; peakT: number; peak: number; open: boolean };

export type BrakeDetector = {
  /** Feed an accelerometer sample (gravity removed). Returns newly confirmed events. */
  pushMotion(sample: MotionSample): HardBrakeEvent[];
  /** Feed a GPS fix. Returns newly confirmed events. */
  pushSpeed(point: TrackPoint): HardBrakeEvent[];
  /** Resolve any still-pending candidates using the data seen so far (call at end of drive). */
  finish(): HardBrakeEvent[];
  readonly events: ReadonlyArray<HardBrakeEvent>;
};

/**
 * Hard-brake detector. Watches how hard the phone shakes (smoothed, any orientation).
 * A spike must last 300 ms, then GPS must show a real speed drop within 2 s.
 * This ignores fumbles and low-speed bumps. Events within 6 s of the last one are dropped.
 */
export function createBrakeDetector(sensitivity: BrakeSensitivity): BrakeDetector {
  const threshold = BRAKE_THRESHOLDS[sensitivity];
  const cfg = BRAKE_CONFIG;

  let ema: number | null = null;
  let lastMotionT: number | null = null;
  let overStart: number | null = null;
  let current: Candidate | null = null; // spike that already became a candidate
  const pending: Candidate[] = [];
  const history: Fix[] = [];
  const events: HardBrakeEvent[] = [];
  let latestT = -Infinity;
  let prevFix: TrackPoint | null = null;

  function speedOf(p: TrackPoint): number {
    if (p.speed !== null && Number.isFinite(p.speed) && p.speed >= 0) return p.speed;
    if (!prevFix) return 0;
    const dt = (p.t - prevFix.t) / 1000;
    if (dt <= 0) return 0;
    // Flat-map math is accurate enough for short distances.
    const k = Math.PI / 180;
    const dy = (p.lat - prevFix.lat) * k * 6371008.8;
    const dx = (p.lng - prevFix.lng) * k * 6371008.8 * Math.cos(p.lat * k);
    return Math.hypot(dx, dy) / dt;
  }

  function corroborate(c: Candidate): Fix | null {
    const lo = c.peakT - cfg.windowMs;
    const hi = c.peakT + cfg.windowMs;
    let inWindow = history.filter((f) => f.t >= lo && f.t <= hi);
    // GPS may be sparse, so also use the last fix before the window.
    const before = [...history].reverse().find((f) => f.t < lo && lo - f.t <= 4000);
    if (before) inWindow = [before, ...inWindow];
    if (inWindow.length < 2) return null;
    let ok = false;
    for (let i = 0; i < inWindow.length && !ok; i++) {
      if (inWindow[i].speed < cfg.minSpeedBeforeMs) continue;
      for (let j = i + 1; j < inWindow.length; j++) {
        if (inWindow[i].speed - inWindow[j].speed >= cfg.minSpeedDropMs) {
          ok = true;
          break;
        }
      }
    }
    if (!ok) return null;
    // Location: the fix closest in time to the peak.
    let best = inWindow[0];
    for (const f of inWindow) if (Math.abs(f.t - c.peakT) < Math.abs(best.t - c.peakT)) best = f;
    return best;
  }

  function resolve(force: boolean): HardBrakeEvent[] {
    const out: HardBrakeEvent[] = [];
    // Candidates are added in time order.
    while (pending.length) {
      const c = pending[0];
      // A spike that is still going keeps updating its peak.
      if (c.open && !force) break;
      if (!force && latestT < c.t + cfg.windowMs) break;
      pending.shift();
      const fix = corroborate(c);
      if (!fix) continue;
      const last = events[events.length - 1];
      if (last && c.peakT - last.t < cfg.debounceMs) continue;
      const ev: HardBrakeEvent = { t: c.peakT, lat: fix.lat, lng: fix.lng, peakMs2: round2(c.peak) };
      events.push(ev);
      out.push(ev);
    }
    return out;
  }

  return {
    pushMotion(s) {
      latestT = Math.max(latestT, s.t);
      const mag = Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z);
      if (lastMotionT !== null && s.t - lastMotionT > cfg.maxMotionGapMs) {
        overStart = null;
        if (current) current.open = false;
        current = null;
      }
      lastMotionT = s.t;
      ema = ema === null ? mag : cfg.emaAlpha * mag + (1 - cfg.emaAlpha) * ema;
      if (ema >= threshold) {
        if (overStart === null) overStart = s.t;
        if (current) {
          if (ema > current.peak) {
            current.peak = ema;
            current.peakT = s.t;
          }
        } else if (s.t - overStart >= cfg.minDurationMs) {
          current = { t: s.t, peakT: s.t, peak: ema, open: true };
          pending.push(current);
        }
      } else {
        overStart = null;
        if (current) current.open = false;
        current = null;
      }
      return resolve(false);
    },

    pushSpeed(p) {
      latestT = Math.max(latestT, p.t);
      history.push({ t: p.t, lat: p.lat, lng: p.lng, speed: speedOf(p) });
      prevFix = p;
      const cutoff = latestT - cfg.historyMs;
      while (history.length && history[0].t < cutoff) history.shift();
      return resolve(false);
    },

    finish() {
      for (const c of pending) c.open = false;
      current = null;
      return resolve(true);
    },

    get events() {
      return events;
    },
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

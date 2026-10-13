import { derivedSpeed, distanceMeters } from './geo';
import type { TrackPoint } from './types';

export const LOCK_SPEED_MS = 2.2; // ~5 mph
export const UNLOCK_SPEED_MS = 0.9;
export const UNLOCK_HOLD_MS = 5000;
/** No GPS fix for this long while locked means the car has stopped. */
export const STALE_FIX_MS = 6000;
/** Moves smaller than this between fixes are GPS drift, not driving. */
export const JITTER_M = 4;
/** Only trust GPS silence if the car was already slowing (about 13 mph), so a tunnel doesn't unlock. */
export const STALE_MAX_SPEED_MS = 6;

export type MotionLockState = {
  locked: boolean;
  /** Time (ms) speed first dropped below the unlock speed; null if not slow. */
  slowSince: number | null;
  /** Previous fix, used to work out speed when the reported one is missing. */
  last: TrackPoint | null;
  /** Speed (m/s) used for the latest decision. */
  speed: number;
};

export function initialLockState(): MotionLockState {
  return { locked: false, slowSince: null, last: null, speed: 0 };
}

/** Reported speed if usable (not null, finite, >= 0); else worked out from the previous fix (0 for the first). */
export function effectiveSpeed(prev: TrackPoint | null, point: TrackPoint): number {
  if (point.speed !== null && Number.isFinite(point.speed) && point.speed >= 0) return point.speed;
  if (!prev) return 0;
  // A parked phone's GPS wanders a few meters; don't count that as driving.
  if (distanceMeters(prev, point) < JITTER_M) return 0;
  return derivedSpeed(prev, point);
}

/**
 * Update the lock for a new GPS fix. Lock at 2.2 m/s or more.
 * Unlock after speed stays under 0.9 m/s for 5 s. In between, stay locked and reset the timer.
 */
export function nextLockState(state: MotionLockState, point: TrackPoint): MotionLockState {
  const speed = effectiveSpeed(state.last, point);
  let { locked, slowSince } = state;
  if (speed >= LOCK_SPEED_MS) {
    locked = true;
    slowSince = null;
  } else if (locked) {
    if (speed < UNLOCK_SPEED_MS) {
      if (slowSince === null) slowSince = point.t;
      if (point.t - slowSince >= UNLOCK_HOLD_MS) {
        locked = false;
        slowSince = null;
      }
    } else {
      slowSince = null;
    }
  } else {
    slowSince = null;
  }
  return { locked, slowSince, last: point, speed };
}

/**
 * Time-only update, run every second. Unlocks once the car has been slow for 5 s,
 * or when no fix has come in for 6 s after slowing down (phones often stop reporting when parked).
 */
export function tickLockState(state: MotionLockState, nowMs: number): MotionLockState {
  if (!state.locked) return state;
  const slowLongEnough = state.slowSince !== null && nowMs - state.slowSince >= UNLOCK_HOLD_MS;
  const noRecentFix =
    state.last !== null && state.speed < STALE_MAX_SPEED_MS && nowMs - state.last.t >= STALE_FIX_MS;
  if (slowLongEnough || noRecentFix) {
    return { ...state, locked: false, slowSince: null, speed: noRecentFix ? 0 : state.speed };
  }
  return state;
}

/** Small wrapper that keeps the state for you. */
export function createMotionLock() {
  let state = initialLockState();
  return {
    push(point: TrackPoint): boolean {
      state = nextLockState(state, point);
      return state.locked;
    },
    tick(nowMs: number): boolean {
      state = tickLockState(state, nowMs);
      return state.locked;
    },
    get locked(): boolean {
      return state.locked;
    },
    get state(): MotionLockState {
      return state;
    },
    reset(): void {
      state = initialLockState();
    },
  };
}

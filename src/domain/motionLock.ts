import { derivedSpeed } from './geo';
import type { TrackPoint } from './types';

export const LOCK_SPEED_MS = 2.2; // ~5 mph
export const UNLOCK_SPEED_MS = 0.9;
export const UNLOCK_HOLD_MS = 5000;

export type MotionLockState = {
  locked: boolean;
  /** ms epoch when speed first dropped below the unlock speed (null if not currently slow). */
  slowSince: number | null;
  /** Previous fix, used to derive speed when the reported speed is missing/negative. */
  last: TrackPoint | null;
  /** Speed (m/s) used for the latest decision. */
  speed: number;
};

export function initialLockState(): MotionLockState {
  return { locked: false, slowSince: null, last: null, speed: 0 };
}

/** Reported speed when usable (non-null, finite, >= 0); otherwise derived from the previous fix (0 for the first fix). */
export function effectiveSpeed(prev: TrackPoint | null, point: TrackPoint): number {
  if (point.speed !== null && Number.isFinite(point.speed) && point.speed >= 0) return point.speed;
  return prev ? derivedSpeed(prev, point) : 0;
}

/**
 * Pure reducer for a new GPS fix.
 * - Lock when speed >= 2.2 m/s.
 * - While locked, unlock only after speed stays < 0.9 m/s for >= 5 s.
 *   Speeds between 0.9 and 2.2 m/s keep the lock and reset the slow timer.
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
 * Time-only update for when no new fix arrives (a stationary phone with a
 * distance filter stops reporting). Unlocks once the slow period has lasted 5 s.
 */
export function tickLockState(state: MotionLockState, nowMs: number): MotionLockState {
  if (state.locked && state.slowSince !== null && nowMs - state.slowSince >= UNLOCK_HOLD_MS) {
    return { ...state, locked: false, slowSince: null };
  }
  return state;
}

/** Small stateful convenience wrapper around the reducer. */
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

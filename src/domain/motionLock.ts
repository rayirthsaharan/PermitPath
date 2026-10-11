import { derivedSpeed } from './geo';
import type { TrackPoint } from './types';

export const LOCK_SPEED_MS = 2.2; // ~5 mph
export const UNLOCK_SPEED_MS = 0.9;
export const UNLOCK_HOLD_MS = 5000;

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
  return prev ? derivedSpeed(prev, point) : 0;
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
 * Time-only update for when no new fix arrives (a still phone stops reporting).
 * Unlocks once the slow period reaches 5 s.
 */
export function tickLockState(state: MotionLockState, nowMs: number): MotionLockState {
  if (state.locked && state.slowSince !== null && nowMs - state.slowSince >= UNLOCK_HOLD_MS) {
    return { ...state, locked: false, slowSince: null };
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

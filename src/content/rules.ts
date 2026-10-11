// Rules are configurable. VERIFY against the current Tennessee Driver Handbook /
// TN Dept. of Safety before each release.

export const rules = {
  requiredTotalHours: 50,
  requiredNightHours: 10,
  /** Minimum days the learner permit must be held before road-test eligibility. */
  minPermitDays: 180,
  /** No permit driving in this local-time window (verify current TN handbook). */
  curfew: { startHour: 22, endHour: 6 },
  /** Alternative "fixed" night definition: 18:00 -> 06:00 local (verify TN definition). */
  fixedNight: { startHour: 18, endHour: 6 },
  /** Lock the screen at or above this speed (m/s, ~5 mph). */
  motionLockSpeedMs: 2.2,
  /** Unlock only after speed stays below this (m/s)... */
  motionUnlockSpeedMs: 0.9,
  /** ...for at least this many seconds. */
  motionUnlockHoldSec: 5,
  /** Hard-brake limits (m/s^2) for each sensitivity. */
  brakeThresholdMs2: { low: 4.9, medium: 3.9, high: 3.2 },
  /** Smoothed strength must stay over the limit this long (ms). */
  brakeMinDurationMs: 300,
  /** How much to smooth the strength reading. */
  brakeEmaAlpha: 0.3,
  /** GPS check: speed before the spike must be at least (m/s, ~10 mph)... */
  brakeMinSpeedBeforeMs: 4.5,
  /** ...and speed must drop by at least this much (m/s) near the spike. */
  brakeMinSpeedDropMs: 2.5,
  brakeCorroborationWindowMs: 2000,
  /** Minimum time between hard-brake events (ms). */
  brakeDebounceMs: 6000,
} as const;

export const RULES_DISCLAIMER =
  'Rules summarized for convenience. Check the current Tennessee Driver Handbook / TN Dept. of Safety for official requirements.';

export const LOG_BANNER =
  'This log supports, but does not replace, the official Tennessee certification form. The parent/guardian must complete and sign the official form.';

export const LESSON_FOOTER =
  'Practice suggestion only. You decide if roads, traffic, and weather are right. Obey all traffic laws.';

// Short aliases.
export const requiredTotalHours = rules.requiredTotalHours;
export const requiredNightHours = rules.requiredNightHours;
export const minPermitDays = rules.minPermitDays;
export const curfew = rules.curfew;
export const fixedNight = rules.fixedNight;

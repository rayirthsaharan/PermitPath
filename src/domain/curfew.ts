import type { CurfewWindow } from './types';

/**
 * Does the span [startMs, endMs] overlap the curfew window in LOCAL time?
 * The window is [startHour, endHour) each day and may cross midnight
 * (e.g. 22 -> 6). Multi-day spans are handled by checking every local day the
 * span touches. Zero/negative-length spans are treated as a point in time.
 */
export function overlapsCurfew(startMs: number, endMs: number, curfew: CurfewWindow): boolean {
  const end = Math.max(startMs, endMs);
  const first = new Date(startMs);
  // Start one day earlier to catch a window that began the previous evening and crosses midnight.
  const dayCursor = new Date(first.getFullYear(), first.getMonth(), first.getDate() - 1);
  const last = new Date(end);
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  while (dayCursor.getTime() <= lastDay.getTime()) {
    const y = dayCursor.getFullYear();
    const m = dayCursor.getMonth();
    const d = dayCursor.getDate();
    const winStart = new Date(y, m, d, curfew.startHour, 0, 0, 0).getTime();
    const winEnd =
      curfew.endHour > curfew.startHour
        ? new Date(y, m, d, curfew.endHour, 0, 0, 0).getTime()
        : new Date(y, m, d + 1, curfew.endHour, 0, 0, 0).getTime();
    // Half-open overlap; a point in time counts when inside [winStart, winEnd).
    if (end === startMs) {
      if (startMs >= winStart && startMs < winEnd) return true;
    } else if (startMs < winEnd && end > winStart) {
      return true;
    }
    dayCursor.setDate(dayCursor.getDate() + 1);
  }
  return false;
}

import type { CurfewWindow } from './types';

/**
 * Does the time span touch the curfew window (local time)?
 * The window is [startHour, endHour) each day and may cross midnight (e.g. 22 -> 6).
 * Multi-day spans check every day touched. A zero-length span counts as one moment.
 */
export function overlapsCurfew(startMs: number, endMs: number, curfew: CurfewWindow): boolean {
  const end = Math.max(startMs, endMs);
  const first = new Date(startMs);
  // Start a day earlier to catch a window that began last evening.
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
    // Overlap check; a single moment counts if inside [winStart, winEnd).
    if (end === startMs) {
      if (startMs >= winStart && startMs < winEnd) return true;
    } else if (startMs < winEnd && end > winStart) {
      return true;
    }
    dayCursor.setDate(dayCursor.getDate() + 1);
  }
  return false;
}

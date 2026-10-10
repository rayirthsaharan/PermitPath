import {
  computeProgress,
  daysUntilEligible,
  eligibleDate,
  formatDuration,
  formatHours,
  permitDayNumber,
  thisWeekSummary,
} from './progress';
import type { Drive } from './types';

const drive = (over: Partial<Drive>): Drive => ({
  id: 'x',
  startedAt: 0,
  endedAt: 0,
  supervisorId: 's',
  source: 'gps',
  durationSec: 3600,
  nightSec: 0,
  distanceM: 0,
  weather: 'clear',
  skillIds: [],
  hardBrakes: [],
  curfewWarning: false,
  notes: '',
  ...over,
});

describe('progress', () => {
  it('computes totals, remaining, and percentages', () => {
    const p = computeProgress([
      drive({ durationSec: 3600 * 20, nightSec: 3600 * 2 }),
      drive({ durationSec: 3600 * 5, nightSec: 3600 * 1 }),
    ]);
    expect(p.driveCount).toBe(2);
    expect(p.totalHours).toBe(25);
    expect(p.nightHours).toBe(3);
    expect(p.totalHoursRemaining).toBe(25);
    expect(p.nightHoursRemaining).toBe(7);
    expect(p.totalPct).toBe(50);
    expect(p.nightPct).toBe(30);
    expect(p.totalComplete).toBe(false);
  });

  it('caps at 100% and 0 remaining; night cannot exceed duration', () => {
    const p = computeProgress([drive({ durationSec: 3600 * 60, nightSec: 3600 * 100 })]);
    expect(p.totalPct).toBe(100);
    expect(p.totalHoursRemaining).toBe(0);
    expect(p.nightHours).toBe(60);
    expect(p.nightComplete).toBe(true);
  });

  it('handles no drives', () => {
    const p = computeProgress([]);
    expect(p.totalHours).toBe(0);
    expect(p.totalPct).toBe(0);
    expect(p.totalHoursRemaining).toBe(50);
  });

  it('permit day number is 1-based and days-until uses issue + 180 days', () => {
    const now = new Date(2024, 5, 10, 15, 0).getTime(); // Jun 10, 2024 local
    expect(permitDayNumber('2024-06-10', now)).toBe(1);
    expect(permitDayNumber('2024-06-01', now)).toBe(10);
    expect(permitDayNumber('2024-06-11', now)).toBe(0); // future
    expect(permitDayNumber('garbage', now)).toBe(0);
    // issue Jun 10 + 180 days = Dec 7, 2024
    expect(eligibleDate('2024-06-10')).toBe('2024-12-07');
    expect(daysUntilEligible('2024-06-10', now)).toBe(180);
    expect(daysUntilEligible('2023-06-10', now)).toBe(0);
    const later = new Date(2024, 11, 7, 1, 0).getTime();
    expect(daysUntilEligible('2024-06-10', later)).toBe(0);
    const dayBefore = new Date(2024, 11, 6, 23, 0).getTime();
    expect(daysUntilEligible('2024-06-10', dayBefore)).toBe(1);
  });

  it('this-week summary counts Monday-start local week', () => {
    const now = new Date(2024, 5, 12, 12, 0).getTime(); // Wed Jun 12
    const mon = new Date(2024, 5, 10, 8, 0).getTime();
    const prevSun = new Date(2024, 5, 9, 20, 0).getTime();
    const w = thisWeekSummary(
      [
        drive({ startedAt: mon, durationSec: 1800, nightSec: 0 }),
        drive({ startedAt: prevSun, durationSec: 3600 }),
        drive({ startedAt: now - 3600000, durationSec: 1200, nightSec: 600 }),
      ],
      now,
    );
    expect(w.driveCount).toBe(2);
    expect(w.totalSec).toBe(3000);
    expect(w.nightSec).toBe(600);
  });

  it('formats durations', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(48 * 60)).toBe('48m');
    expect(formatDuration(100 * 60)).toBe('1h 40m');
    expect(formatDuration(3600 + 5 * 60)).toBe('1h 05m');
    expect(formatHours(21.54 * 3600)).toBe('21.5');
  });
});

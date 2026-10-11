import type { Drive } from './types';

export const SKILL_LEVEL_LABELS = ['Not yet', 'Introduced', 'Practicing', 'Confident'] as const;

export type Totals = { totalSec: number; nightSec: number; driveCount: number };

export function computeTotals(drives: ReadonlyArray<Pick<Drive, 'durationSec' | 'nightSec'>>): Totals {
  let totalSec = 0;
  let nightSec = 0;
  for (const d of drives) {
    totalSec += d.durationSec;
    nightSec += Math.min(d.nightSec, d.durationSec);
  }
  return { totalSec, nightSec, driveCount: drives.length };
}

export type ProgressRequirements = { requiredTotalHours: number; requiredNightHours: number };

export type Progress = Totals & {
  totalHours: number;
  nightHours: number;
  totalHoursRemaining: number;
  nightHoursRemaining: number;
  /** 0-100, never above 100 */
  totalPct: number;
  nightPct: number;
  totalComplete: boolean;
  nightComplete: boolean;
};

export function computeProgress(
  drives: ReadonlyArray<Pick<Drive, 'durationSec' | 'nightSec'>>,
  req: ProgressRequirements = { requiredTotalHours: 50, requiredNightHours: 10 },
): Progress {
  const t = computeTotals(drives);
  const totalHours = t.totalSec / 3600;
  const nightHours = t.nightSec / 3600;
  const pct = (h: number, r: number) => (r <= 0 ? 100 : Math.min(100, (h / r) * 100));
  return {
    ...t,
    totalHours,
    nightHours,
    totalHoursRemaining: Math.max(0, req.requiredTotalHours - totalHours),
    nightHoursRemaining: Math.max(0, req.requiredNightHours - nightHours),
    totalPct: pct(totalHours, req.requiredTotalHours),
    nightPct: pct(nightHours, req.requiredNightHours),
    totalComplete: totalHours >= req.requiredTotalHours,
    nightComplete: nightHours >= req.requiredNightHours,
  };
}

// ---- permit-holding date math (local dates, safe across clock changes) ----

function parseYmd(ymd: string): { y: number; m: number; d: number } | null {
  const mt = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!mt) return null;
  return { y: Number(mt[1]), m: Number(mt[2]), d: Number(mt[3]) };
}

/** Whole days between two local dates. */
function dayNumber(y: number, m: number, d: number): number {
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

function localDayNumber(ms: number): number {
  const dt = new Date(ms);
  return dayNumber(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

/** Permit day number: the issue date is day 1. 0 if the date is invalid or in the future. */
export function permitDayNumber(permitIssueDate: string, nowMs: number): number {
  const p = parseYmd(permitIssueDate);
  if (!p) return 0;
  const n = localDayNumber(nowMs) - dayNumber(p.y, p.m, p.d) + 1;
  return Math.max(0, n);
}

/** Local date (YYYY-MM-DD) when the permit has been held `minDays` days. */
export function eligibleDate(permitIssueDate: string, minDays = 180): string | null {
  const p = parseYmd(permitIssueDate);
  if (!p) return null;
  const dt = new Date(Date.UTC(p.y, p.m - 1, p.d + minDays));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** Days from today until permitIssueDate + minDays (0 once reached). */
export function daysUntilEligible(permitIssueDate: string, nowMs: number, minDays = 180): number {
  const p = parseYmd(permitIssueDate);
  if (!p) return minDays;
  const target = dayNumber(p.y, p.m, p.d) + minDays;
  return Math.max(0, target - localDayNumber(nowMs));
}

// ---- this week ----

export type WeekSummary = { driveCount: number; totalSec: number; nightSec: number };

/** Local midnight (ms) of the Monday on or before nowMs. */
export function startOfWeek(nowMs: number): number {
  const d = new Date(nowMs);
  const daysSinceMonday = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysSinceMonday).getTime();
}

/** Drives that started in the current local week (Monday start). */
export function thisWeekSummary(drives: ReadonlyArray<Drive>, nowMs: number): WeekSummary {
  const start = startOfWeek(nowMs);
  const inWeek = drives.filter((d) => d.startedAt >= start && d.startedAt <= nowMs);
  const t = computeTotals(inWeek);
  return { driveCount: t.driveCount, totalSec: t.totalSec, nightSec: t.nightSec };
}

/** "1h 40m", "48m", "0m". */
export function formatDuration(sec: number): string {
  const totalMin = Math.round(Math.max(0, sec) / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/** Decimal hours rounded to one place, e.g. 21.5. */
export function formatHours(sec: number): string {
  return (Math.round((sec / 3600) * 10) / 10).toFixed(1);
}

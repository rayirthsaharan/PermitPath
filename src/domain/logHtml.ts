import { LOG_BANNER, rules } from '../content/rules';
import { computeProgress, daysUntilEligible, eligibleDate, formatDuration, permitDayNumber, SKILL_LEVEL_LABELS } from './progress';
import type { Drive, Profile, Skill, SkillCategory, SkillRating, Supervisor, Weather } from './types';

export type LogHtmlInput = {
  profile: Profile;
  supervisors: ReadonlyArray<Supervisor>;
  drives: ReadonlyArray<Drive>;
  skills: ReadonlyArray<Skill>;
  ratings: ReadonlyArray<SkillRating>;
  categories?: ReadonlyArray<SkillCategory>;
  /** ms epoch */
  generatedAt: number;
};

/** Make text safe to put in HTML. */
export function escapeHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEATHER_LABEL: Record<Weather, string> = {
  clear: 'Clear',
  rain: 'Rain',
  fog: 'Fog',
  'snow-ice': 'Snow/ice',
};

/** "Jun 20, 2024" in device local time. */
export function formatLocalDate(ms: number): string {
  const d = new Date(ms);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "6:12 PM" in device local time. */
export function formatLocalTime(ms: number): string {
  const d = new Date(ms);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

function formatPermitDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

const minutes = (sec: number) => Math.round(sec / 60);

export function buildLogHtml(input: LogHtmlInput): string {
  const { profile, supervisors, drives, skills, ratings, generatedAt } = input;
  const e = escapeHtml;
  const sorted = [...drives].sort((a, b) => a.startedAt - b.startedAt);
  const supName = new Map(supervisors.map((s) => [s.id, s.name]));
  const prog = computeProgress(sorted, {
    requiredTotalHours: rules.requiredTotalHours,
    requiredNightHours: rules.requiredNightHours,
  });

  const driveRows = sorted
    .map((d) => {
      const noteParts: string[] = [];
      if (d.source === 'manual') noteParts.push('Manual entry');
      if (d.curfewWarning) noteParts.push('Overlaps curfew window');
      if (d.notes.trim()) noteParts.push(d.notes.trim());
      return `<tr>
<td>${e(formatLocalDate(d.startedAt))}</td>
<td>${e(formatLocalTime(d.startedAt))}</td>
<td>${e(formatLocalTime(d.endedAt))}</td>
<td class="num">${minutes(d.durationSec)}</td>
<td class="num">${minutes(d.nightSec)}</td>
<td>${e(supName.get(d.supervisorId) ?? 'Unknown')}</td>
<td>${e(WEATHER_LABEL[d.weather] ?? d.weather)}</td>
<td>${e(noteParts.join('; '))}</td>
</tr>`;
    })
    .join('\n');

  const levelOf = new Map(ratings.map((r) => [r.skillId, r]));
  const catTitle = new Map((input.categories ?? []).map((c) => [c.id, c.title]));
  const catOrder: string[] = [];
  for (const s of skills) if (!catOrder.includes(s.category)) catOrder.push(s.category);
  const skillSections = catOrder
    .map((cat) => {
      const rows = skills
        .filter((s) => s.category === cat)
        .map((s) => {
          const r = levelOf.get(s.id);
          const lvl = r?.level ?? 0;
          return `<tr><td>${e(s.title)}</td><td>${e(SKILL_LEVEL_LABELS[lvl])}</td><td class="num">${r?.practiceCount ?? 0}</td></tr>`;
        })
        .join('\n');
      return `<h3>${e(catTitle.get(cat) ?? cat)}</h3>
<table class="skills"><thead><tr><th>Skill</th><th>Level (parent-rated)</th><th class="num">Drives practiced</th></tr></thead>
<tbody>
${rows}
</tbody></table>`;
    })
    .join('\n');

  const supRows = supervisors
    .map(
      (s) =>
        `<li>${e(s.name)} (${e(s.relationship)})${s.attests21Plus ? ' &mdash; attests licensed driver age 21 or older' : ''}</li>`,
    )
    .join('\n');

  const elig = eligibleDate(profile.permitIssueDate, rules.minPermitDays);
  const daysHeld = permitDayNumber(profile.permitIssueDate, generatedAt);
  const daysLeft = daysUntilEligible(profile.permitIssueDate, generatedAt, rules.minPermitDays);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Supervised driving log - ${e(profile.firstName)}</title>
<style>
  @page { margin: 16mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111; font-size: 11pt; line-height: 1.35; margin: 0; padding: 16px; }
  h1 { font-size: 20pt; margin: 0 0 4px; }
  h2 { font-size: 13pt; margin: 22px 0 6px; border-bottom: 1px solid #999; padding-bottom: 2px; }
  h3 { font-size: 11pt; margin: 14px 0 4px; }
  .banner { border: 2px solid #111; padding: 10px 12px; font-weight: 600; margin: 12px 0; }
  .meta { color: #333; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0; }
  th, td { border: 1px solid #bbb; padding: 4px 6px; text-align: left; vertical-align: top; font-size: 10pt; }
  th { background: #eee; }
  .num { text-align: right; white-space: nowrap; }
  .totals td, .totals th { font-size: 11pt; }
  tr { page-break-inside: avoid; }
  .sig { margin-top: 28px; page-break-inside: avoid; }
  .sig .line { display: inline-block; border-bottom: 1px solid #111; width: 320px; height: 22px; margin-right: 24px; }
  .sig .dateline { width: 140px; }
  .sig p { margin: 18px 0 2px; }
  .small { font-size: 9pt; color: #444; }
</style>
</head>
<body>
<h1>Supervised Driving Log</h1>
<p class="meta">
  Teen: <strong>${e(profile.firstName)}</strong> &nbsp;|&nbsp;
  Permit issued: <strong>${e(formatPermitDate(profile.permitIssueDate))}</strong> &nbsp;|&nbsp;
  Generated: ${e(formatLocalDate(generatedAt))}
</p>
<div class="banner">${e(LOG_BANNER)}</div>

<h2>Totals</h2>
<table class="totals">
  <thead><tr><th></th><th class="num">Logged</th><th class="num">Required</th></tr></thead>
  <tbody>
    <tr><td>Total driving time</td><td class="num">${e(formatDuration(prog.totalSec))}</td><td class="num">${rules.requiredTotalHours} hours</td></tr>
    <tr><td>Night driving time (included in total)</td><td class="num">${e(formatDuration(prog.nightSec))}</td><td class="num">${rules.requiredNightHours} hours</td></tr>
    <tr><td>Number of drives</td><td class="num">${prog.driveCount}</td><td class="num"></td></tr>
    <tr><td>Days permit held</td><td class="num">${daysHeld}</td><td class="num">${rules.minPermitDays} days${elig ? ` (${e(formatPermitDate(elig))}; ${daysLeft} to go)` : ''}</td></tr>
  </tbody>
</table>

<h2>Supervising drivers</h2>
<ul>
${supRows || '<li>None recorded</li>'}
</ul>

<h2>Drives</h2>
<table>
  <thead><tr><th>Date</th><th>Start</th><th>End</th><th class="num">Total min</th><th class="num">Night min</th><th>Supervisor</th><th>Conditions</th><th>Notes</th></tr></thead>
  <tbody>
${driveRows || '<tr><td colspan="8">No drives logged yet.</td></tr>'}
  </tbody>
</table>
<p class="small">Night is determined by sunset and sunrise at the drive location (or a fixed 6 PM to 6 AM window, per the app setting). Times are shown in the device's local time.</p>

<h2>Skills summary</h2>
${skillSections || '<p>No skills recorded.</p>'}

<div class="sig">
  <p>Parent/guardian signature: <span class="line"></span> Date: <span class="line dateline"></span></p>
  <p>Printed name: <span class="line"></span></p>
  <p class="small">${e(LOG_BANNER)}</p>
</div>
</body>
</html>`;
}

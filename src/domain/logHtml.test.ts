import { buildLogHtml, escapeHtml, formatLocalTime } from './logHtml';
import type { Drive, Profile, Skill, Supervisor } from './types';

const profile: Profile = { firstName: 'Maya <script>alert(1)</script>', permitIssueDate: '2024-03-01' };
const supervisors: Supervisor[] = [
  { id: 's1', name: 'Dad & "Co" <b>', relationship: "Father's", attests21Plus: true },
];
const skills: Skill[] = [{ id: 'k1', category: 'basics', title: 'Mirrors <i>', whatGoodLooksLike: '' }];
const t0 = new Date(2024, 5, 20, 18, 12).getTime();
const drive: Drive = {
  id: 'd1',
  startedAt: t0,
  endedAt: t0 + 48 * 60000,
  supervisorId: 's1',
  source: 'manual',
  durationSec: 48 * 60,
  nightSec: 22 * 60,
  distanceM: 0,
  weather: 'rain',
  skillIds: [],
  hardBrakes: [],
  curfewWarning: true,
  notes: '</td><img src=x onerror=alert(1)>',
};

describe('buildLogHtml', () => {
  const html = buildLogHtml({
    profile,
    supervisors,
    drives: [drive],
    skills,
    ratings: [{ skillId: 'k1', level: 2, practiceCount: 3 }],
    categories: [{ id: 'basics', title: 'Vehicle basics' }],
    generatedAt: new Date(2024, 5, 21, 9, 0).getTime(),
  });

  it('is a complete HTML document containing the exact banner text', () => {
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain(
      'This log supports, but does not replace, the official Tennessee certification form. The parent/guardian must complete and sign the official form.',
    );
    expect(html).toContain('Parent/guardian signature');
  });

  it('escapes all user-provided text', () => {
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<b>');
    expect(html).not.toContain('<i>');
    expect(html).toContain('Maya &lt;script&gt;');
    expect(html).toContain('Dad &amp; &quot;Co&quot; &lt;b&gt;');
    expect(html).toContain('Father&#39;s');
  });

  it('renders drive details in local time with minutes and flags', () => {
    expect(html).toContain('Jun 20, 2024');
    expect(html).toContain(formatLocalTime(t0));
    expect(html).toContain('<td class="num">48</td>');
    expect(html).toContain('<td class="num">22</td>');
    expect(html).toContain('Manual entry');
    expect(html).toContain('Overlaps curfew window');
    expect(html).toContain('Rain');
    expect(html).toContain('Practicing');
    expect(html).toContain('Vehicle basics');
  });

  it('handles empty logs', () => {
    const empty = buildLogHtml({ profile, supervisors: [], drives: [], skills: [], ratings: [], generatedAt: 0 });
    expect(empty).toContain('No drives logged yet.');
  });

  it('escapeHtml handles non-strings', () => {
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(5)).toBe('5');
  });
});

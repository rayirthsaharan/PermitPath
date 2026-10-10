import { buildAnonymousSummary } from './summary';
import type { SurveyResponse } from './types';

const stages = [
  { id: 1, lessons: [{ id: 'a' }, { id: 'b' }] },
  { id: 2, lessons: [{ id: 'c' }] },
] as unknown as Parameters<typeof buildAnonymousSummary>[0]['stages'];

const surveys: SurveyResponse[] = [
  { kind: 'pre', respondent: 'teen', answers: { q1: 2, q2: 3 }, completedAt: 1 },
  { kind: 'post', respondent: 'teen', answers: { q1: 4, q2: 3 }, completedAt: 2 },
  { kind: 'pre', respondent: 'parent', answers: { q1: 1 }, completedAt: 1 },
];

describe('buildAnonymousSummary', () => {
  const s = buildAnonymousSummary({
    drives: [
      { durationSec: 3600 * 2.26, nightSec: 3600 * 0.5, lessonId: 'a' },
      { durationSec: 1800, nightSec: 0, lessonId: 'a' },
      { durationSec: 1800, nightSec: 0, lessonId: 'c' },
      { durationSec: 600, nightSec: 0 },
    ],
    stages,
    surveys,
    now: new Date(2024, 5, 20, 13, 45, 12).getTime(),
  });

  it('aggregates hours, lessons and stages', () => {
    expect(s.driveCount).toBe(4);
    expect(s.totalHours).toBe(3.4);
    expect(s.nightHours).toBe(0.5);
    expect(s.lessonsCompleted).toBe(2);
    expect(s.completedLessonIds).toEqual(['a', 'c']);
    expect(s.highestStageReached).toBe(2);
  });

  it('computes survey deltas only where both pre and post exist', () => {
    const q1 = s.surveyDeltas.find((d) => d.itemId === 'q1')!;
    expect(q1).toMatchObject({ teenPre: 2, teenPost: 4, teenDelta: 2, parentPre: 1 });
    expect(q1.parentDelta).toBeUndefined();
    expect(s.surveyDeltas.find((d) => d.itemId === 'q2')!.teenDelta).toBe(0);
  });

  it('contains only month-level time and no identifying fields', () => {
    expect(s.generatedMonth).toBe('2024-06');
    const json = JSON.stringify(s);
    expect(json).not.toMatch(/lat|lng|name|supervisor|startedAt|endedAt|notes/i);
    expect(json).not.toMatch(/\d{13}/); // no epoch timestamps
  });
});

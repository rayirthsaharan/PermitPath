import type { Drive, Stage, SurveyResponse } from './types';

export type SurveyDelta = {
  itemId: string;
  teenPre?: number;
  teenPost?: number;
  teenDelta?: number;
  parentPre?: number;
  parentPost?: number;
  parentDelta?: number;
};

export type AnonymousSummary = {
  version: 1;
  /** Month only, 'YYYY-MM'. */
  generatedMonth: string;
  driveCount: number;
  totalHours: number;
  nightHours: number;
  lessonsCompleted: number;
  completedLessonIds: string[];
  /** Highest stage that has at least one completed lesson (0 if none). */
  highestStageReached: number;
  stagesWithCompletedLessons: number[];
  surveyDeltas: SurveyDelta[];
};

export type SummaryInput = {
  drives: ReadonlyArray<Pick<Drive, 'durationSec' | 'nightSec' | 'lessonId'>>;
  stages: ReadonlyArray<Pick<Stage, 'id' | 'lessons'>>;
  surveys: ReadonlyArray<SurveyResponse>;
  /** ms epoch; only the year and month are used. */
  now: number;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Anonymous, opt-in export. Contains NO names, NO locations, and NO timestamps
 * finer than month. Only aggregates, lesson/stage ids, and survey answers.
 */
export function buildAnonymousSummary(input: SummaryInput): AnonymousSummary {
  const { drives, stages, surveys, now } = input;
  const totalSec = drives.reduce((a, d) => a + d.durationSec, 0);
  const nightSec = drives.reduce((a, d) => a + Math.min(d.nightSec, d.durationSec), 0);
  const lessonIds = [...new Set(drives.map((d) => d.lessonId).filter((x): x is string => !!x))].sort();

  const stageOf = new Map<string, number>();
  for (const s of stages) for (const l of s.lessons) stageOf.set(l.id, s.id);
  const reached = [...new Set(lessonIds.map((id) => stageOf.get(id)).filter((x): x is number => x !== undefined))].sort(
    (a, b) => a - b,
  );

  // Latest response per (kind, respondent).
  const latest = new Map<string, SurveyResponse>();
  for (const s of surveys) {
    const key = `${s.kind}:${s.respondent}`;
    const prev = latest.get(key);
    if (!prev || s.completedAt >= prev.completedAt) latest.set(key, s);
  }
  const itemIds = new Set<string>();
  for (const s of latest.values()) Object.keys(s.answers).forEach((k) => itemIds.add(k));
  const surveyDeltas: SurveyDelta[] = [...itemIds].sort().map((itemId) => {
    const teenPre = latest.get('pre:teen')?.answers[itemId];
    const teenPost = latest.get('post:teen')?.answers[itemId];
    const parentPre = latest.get('pre:parent')?.answers[itemId];
    const parentPost = latest.get('post:parent')?.answers[itemId];
    const row: SurveyDelta = { itemId };
    if (teenPre !== undefined) row.teenPre = teenPre;
    if (teenPost !== undefined) row.teenPost = teenPost;
    if (teenPre !== undefined && teenPost !== undefined) row.teenDelta = teenPost - teenPre;
    if (parentPre !== undefined) row.parentPre = parentPre;
    if (parentPost !== undefined) row.parentPost = parentPost;
    if (parentPre !== undefined && parentPost !== undefined) row.parentDelta = parentPost - parentPre;
    return row;
  });

  const d = new Date(now);
  return {
    version: 1,
    generatedMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    driveCount: drives.length,
    totalHours: round1(totalSec / 3600),
    nightHours: round1(nightSec / 3600),
    lessonsCompleted: lessonIds.length,
    completedLessonIds: lessonIds,
    highestStageReached: reached.length ? reached[reached.length - 1] : 0,
    stagesWithCompletedLessons: reached,
    surveyDeltas,
  };
}

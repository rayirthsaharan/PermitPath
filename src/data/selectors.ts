import { useMemo } from 'react';
import { useStore } from './store';
import { rules } from '../content/rules';
import { SKILLS, SKILL_CATEGORIES } from '../content/skills';
import { STAGES } from '../content/curriculum';
import { computeProgress, type Progress } from '../domain/progress';
import {
  allStageStatuses,
  completedLessonIds,
  nextSuggestedLesson,
  type CurriculumContext,
  type StageStatus,
} from '../domain/curriculum';
import type { Lesson } from '../domain/types';

/** Progress toward 50/10 hours. `now` is recomputed when drives/profile change. */
export function useProgress(): Progress & { now: number } {
  const drives = useStore((s) => s.drives);
  const profile = useStore((s) => s.profile);
  return useMemo(
    () => ({
      ...computeProgress(drives, {
        requiredTotalHours: rules.requiredTotalHours,
        requiredNightHours: rules.requiredNightHours,
      }),
      now: Date.now(),
    }),
    // profile included so permit-date-dependent consumers refresh together
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drives, profile],
  );
}

export function useCurriculumContext(): CurriculumContext {
  const drives = useStore((s) => s.drives);
  const ratings = useStore((s) => s.skillRatings);
  const overriddenStageIds = useStore((s) => s.overriddenStageIds);
  return useMemo(() => {
    const totalSec = drives.reduce((a, d) => a + d.durationSec, 0);
    return {
      stages: STAGES,
      totalHours: totalSec / 3600,
      ratings: Object.values(ratings),
      skills: SKILLS,
      categories: SKILL_CATEGORIES,
      completedLessonIds: completedLessonIds(drives),
      overriddenStageIds,
    };
  }, [drives, ratings, overriddenStageIds]);
}

/** Map of stage id -> status (unlocked / overridden / unmet reasons). */
export function useStageStatuses(): Map<number, StageStatus> {
  const ctx = useCurriculumContext();
  return useMemo(() => allStageStatuses(ctx), [ctx]);
}

/** Next suggested lesson, or null when everything unlocked is done. */
export function useNextLesson(): Lesson | null {
  const ctx = useCurriculumContext();
  return useMemo(() => nextSuggestedLesson(STAGES, ctx), [ctx]);
}

export function useSupervisorName(id: string | undefined): string {
  return useStore((s) => (id ? s.supervisors.find((x) => x.id === id)?.name ?? 'Unknown' : 'Unknown'));
}

/** Lesson ids with at least one saved drive. */
export function useCompletedLessonIds(): string[] {
  const ctx = useCurriculumContext();
  return ctx.completedLessonIds as string[];
}

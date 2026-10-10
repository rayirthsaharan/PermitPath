import { SKILL_LEVEL_LABELS } from './progress';
import type { Drive, Lesson, Skill, SkillCategory, SkillRating, Stage } from './types';

export type CurriculumContext = {
  /** All stages (needed to resolve `requiresLessonsFromStages`). */
  stages: ReadonlyArray<Stage>;
  /** Total logged hours so far. */
  totalHours: number;
  /** Parent ratings by skill. Missing skills count as level 0. */
  ratings: ReadonlyArray<Pick<SkillRating, 'skillId' | 'level'>>;
  /** Skill definitions (used to resolve category requirements). */
  skills: ReadonlyArray<Pick<Skill, 'id' | 'category' | 'title'>>;
  categories?: ReadonlyArray<SkillCategory>;
  /** Lesson ids with at least one saved drive. */
  completedLessonIds: ReadonlyArray<string>;
  /** Stage ids the parent chose to "Unlock anyway". */
  overriddenStageIds?: ReadonlyArray<number>;
};

export type StageStatus = {
  unlocked: boolean;
  /** True when unlocked only because of a manual override. */
  overridden: boolean;
  /**
   * Human-readable unmet gates. Empty when naturally unlocked. When `overridden`,
   * lists the gates that were bypassed.
   */
  reasons: string[];
};

const fmtHours = (h: number) => String(Math.round(h * 10) / 10);

/** Unique lesson ids that have at least one saved drive. */
export function completedLessonIds(drives: ReadonlyArray<Pick<Drive, 'lessonId'>>): string[] {
  const set = new Set<string>();
  for (const d of drives) if (d.lessonId) set.add(d.lessonId);
  return [...set];
}

export function stageStatus(stage: Stage, ctx: CurriculumContext): StageStatus {
  const reasons: string[] = [];
  const gate = stage.gate;

  if (ctx.totalHours + 1e-9 < gate.minHours) {
    reasons.push(`Log ${fmtHours(gate.minHours)} hours total (you have ${fmtHours(ctx.totalHours)}).`);
  }

  const levelOf = new Map<string, number>();
  for (const r of ctx.ratings) levelOf.set(r.skillId, r.level);

  for (const req of gate.skillReqs) {
    const label = SKILL_LEVEL_LABELS[req.minLevel];
    if (req.skillId) {
      const skill = ctx.skills.find((s) => s.id === req.skillId);
      if ((levelOf.get(req.skillId) ?? 0) < req.minLevel) {
        reasons.push(`${skill?.title ?? req.skillId}: reach "${label}".`);
      }
    } else if (req.categoryId) {
      const inCat = ctx.skills.filter((s) => s.category === req.categoryId);
      const short = inCat.filter((s) => (levelOf.get(s.id) ?? 0) < req.minLevel);
      if (short.length > 0) {
        const catTitle = ctx.categories?.find((c) => c.id === req.categoryId)?.title ?? req.categoryId;
        reasons.push(`${catTitle}: ${short.length} of ${inCat.length} skills still below "${label}".`);
      }
    }
  }

  const done = new Set(ctx.completedLessonIds);
  for (const sid of gate.requiresLessonsFromStages ?? []) {
    const req = ctx.stages.find((s) => s.id === sid);
    if (!req) continue;
    const doneCount = req.lessons.filter((l) => done.has(l.id)).length;
    if (doneCount < req.lessons.length) {
      reasons.push(`Complete the Stage ${sid} lessons (${doneCount} of ${req.lessons.length} done).`);
    }
  }

  if (reasons.length === 0) return { unlocked: true, overridden: false, reasons: [] };
  if (ctx.overriddenStageIds?.includes(stage.id)) return { unlocked: true, overridden: true, reasons };
  return { unlocked: false, overridden: false, reasons };
}

/** Status for every stage keyed by stage id. */
export function allStageStatuses(ctx: CurriculumContext): Map<number, StageStatus> {
  return new Map(ctx.stages.map((s) => [s.id, stageStatus(s, ctx)]));
}

/** First not-yet-completed lesson (in stage order) among unlocked stages; null if none. */
export function nextSuggestedLesson(stages: ReadonlyArray<Stage>, ctx: CurriculumContext): Lesson | null {
  const done = new Set(ctx.completedLessonIds);
  for (const stage of stages) {
    if (!stageStatus(stage, { ...ctx, stages }).unlocked) continue;
    const next = stage.lessons.find((l) => !done.has(l.id));
    if (next) return next;
  }
  return null;
}

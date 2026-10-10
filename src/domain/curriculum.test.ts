import { allStageStatuses, completedLessonIds, nextSuggestedLesson, stageStatus } from './curriculum';
import type { CurriculumContext } from './curriculum';
import type { Lesson, Skill, Stage } from './types';

const lesson = (id: string, stageId: number): Lesson => ({
  id,
  stageId,
  title: id,
  goal: '',
  estimatedMinutes: 10,
  bestTimes: '',
  corridorIds: [],
  skillIds: [],
  coachingCards: [],
  debriefPrompts: [],
  routeMode: 'nearby',
});

const stages: Stage[] = [
  { id: 1, title: 'One', theme: '', gate: { minHours: 0, skillReqs: [] }, lessons: [lesson('a', 1), lesson('b', 1)] },
  {
    id: 2,
    title: 'Two',
    theme: '',
    gate: { minHours: 2, skillReqs: [{ categoryId: 'basics', minLevel: 1 }] },
    lessons: [lesson('c', 2)],
  },
  {
    id: 3,
    title: 'Three',
    theme: '',
    gate: { minHours: 5, skillReqs: [{ skillId: 'turns', minLevel: 2 }], requiresLessonsFromStages: [1, 2] },
    lessons: [lesson('d', 3)],
  },
];

const skills: Pick<Skill, 'id' | 'category' | 'title'>[] = [
  { id: 'mirrors', category: 'basics', title: 'Mirrors' },
  { id: 'braking', category: 'basics', title: 'Braking' },
  { id: 'turns', category: 'res', title: 'Turns' },
];

const base = (over: Partial<CurriculumContext> = {}): CurriculumContext => ({
  stages,
  totalHours: 0,
  ratings: [],
  skills,
  categories: [{ id: 'basics', title: 'Vehicle basics' }],
  completedLessonIds: [],
  ...over,
});

describe('curriculum unlocks', () => {
  it('stage with no gate is always unlocked', () => {
    expect(stageStatus(stages[0], base())).toEqual({ unlocked: true, overridden: false, reasons: [] });
  });

  it('explains unmet hours and skill gates in plain language', () => {
    const s = stageStatus(stages[1], base({ totalHours: 1.25 }));
    expect(s.unlocked).toBe(false);
    expect(s.reasons).toHaveLength(2);
    expect(s.reasons[0]).toBe('Log 2 hours total (you have 1.3).');
    expect(s.reasons[1]).toBe('Vehicle basics: 2 of 2 skills still below "Introduced".');
  });

  it('unlocks when all gates are met (category needs every skill)', () => {
    const ratings = [
      { skillId: 'mirrors', level: 1 as const },
      { skillId: 'braking', level: 2 as const },
    ];
    expect(stageStatus(stages[1], base({ totalHours: 2, ratings })).unlocked).toBe(true);
    const partial = stageStatus(stages[1], base({ totalHours: 2, ratings: [ratings[0]] }));
    expect(partial.unlocked).toBe(false);
    expect(partial.reasons[0]).toContain('1 of 2');
  });

  it('requires prior-stage lessons and a specific skill level', () => {
    const s = stageStatus(stages[2], base({ totalHours: 10, completedLessonIds: ['a', 'c'] }));
    expect(s.unlocked).toBe(false);
    expect(s.reasons).toEqual([
      'Turns: reach "Practicing".',
      'Complete the Stage 1 lessons (1 of 2 done).',
    ]);
    const ok = stageStatus(
      stages[2],
      base({ totalHours: 10, completedLessonIds: ['a', 'b', 'c'], ratings: [{ skillId: 'turns', level: 3 }] }),
    );
    expect(ok.unlocked).toBe(true);
  });

  it('respects manual overrides but still lists bypassed gates', () => {
    const s = stageStatus(stages[2], base({ overriddenStageIds: [3] }));
    expect(s.unlocked).toBe(true);
    expect(s.overridden).toBe(true);
    expect(s.reasons.length).toBeGreaterThan(0);
  });

  it('allStageStatuses covers every stage', () => {
    const m = allStageStatuses(base());
    expect([...m.keys()]).toEqual([1, 2, 3]);
  });

  it('completedLessonIds is unique and ignores drives without lessons', () => {
    expect(completedLessonIds([{ lessonId: 'a' }, { lessonId: 'a' }, {}, { lessonId: 'c' }]).sort()).toEqual([
      'a',
      'c',
    ]);
  });

  it('suggests the first incomplete lesson in unlocked stages', () => {
    expect(nextSuggestedLesson(stages, base())?.id).toBe('a');
    expect(nextSuggestedLesson(stages, base({ completedLessonIds: ['a'] }))?.id).toBe('b');
    // Stage 2 locked -> after finishing stage 1, nothing else is suggested.
    expect(nextSuggestedLesson(stages, base({ completedLessonIds: ['a', 'b'] }))).toBeNull();
    const unlocked = base({
      completedLessonIds: ['a', 'b'],
      totalHours: 3,
      ratings: [
        { skillId: 'mirrors', level: 1 },
        { skillId: 'braking', level: 1 },
      ],
    });
    expect(nextSuggestedLesson(stages, unlocked)?.id).toBe('c');
  });
});

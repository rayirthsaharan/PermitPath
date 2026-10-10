// Integrity checks for src/content (ids resolve, card counts, etc.).
import { CORRIDORS } from '../content/corridors';
import { LESSONS, STAGES } from '../content/curriculum';
import { SKILLS, SKILL_CATEGORIES } from '../content/skills';
import { SURVEY_ITEMS } from '../content/surveys';

describe('content integrity', () => {
  const skillIds = new Set(SKILLS.map((s) => s.id));
  const catIds = new Set(SKILL_CATEGORIES.map((c) => c.id));
  const corridorIds = new Set(CORRIDORS.map((c) => c.id));

  it('skills have unique ids and valid categories', () => {
    expect(skillIds.size).toBe(SKILLS.length);
    expect(SKILLS.length).toBeGreaterThanOrEqual(28);
    for (const s of SKILLS) expect(catIds.has(s.category)).toBe(true);
    for (const c of SKILL_CATEGORIES) expect(SKILLS.some((s) => s.category === c.id)).toBe(true);
  });

  it('has 7 stages with unique lesson ids and valid references', () => {
    expect(STAGES.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    for (const l of LESSONS) {
      expect(l.coachingCards.length).toBeGreaterThanOrEqual(4);
      expect(l.coachingCards.length).toBeLessThanOrEqual(6);
      expect(l.debriefPrompts.length).toBeGreaterThanOrEqual(2);
      expect(l.debriefPrompts.length).toBeLessThanOrEqual(3);
      for (const id of l.skillIds) expect(skillIds.has(id)).toBe(true);
      for (const id of l.corridorIds) expect(corridorIds.has(id)).toBe(true);
    }
    for (const s of STAGES) {
      for (const l of s.lessons) expect(l.stageId).toBe(s.id);
      for (const r of s.gate.skillReqs) {
        if (r.skillId) expect(skillIds.has(r.skillId)).toBe(true);
        if (r.categoryId) expect(catIds.has(r.categoryId)).toBe(true);
      }
    }
  });

  it('stage 7 lessons are night or weather focused', () => {
    for (const l of STAGES[6].lessons) expect(l.isNight === true || l.weatherFocus !== undefined).toBe(true);
  });

  it('all corridors are unverified candidates; the roundabout entry has no waypoints', () => {
    for (const c of CORRIDORS) expect(c.verified).toBe(false);
    expect(CORRIDORS.find((c) => c.kind === 'roundabout')!.waypoints).toEqual([]);
  });

  it('has 6 survey items', () => {
    expect(SURVEY_ITEMS).toHaveLength(6);
  });
});

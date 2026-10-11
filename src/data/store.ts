import { create } from 'zustand';
import type {
  Drive,
  Profile,
  Settings,
  SkillLevel,
  SkillRating,
  Supervisor,
  SurveyResponse,
  TrackPoint,
} from '../domain/types';
import { simplifyTrack } from '../domain/simplify';
import * as storage from './storage';
import { newId } from './id';

export const DEFAULT_SETTINGS: Settings = { nightRule: 'sun', brakeSensitivity: 'medium' };

const sortDrives = (d: Drive[]) => [...d].sort((a, b) => b.startedAt - a.startedAt);

export type StoreState = {
  hydrated: boolean;
  profile: Profile | null;
  supervisors: Supervisor[];
  /** Newest first. */
  drives: Drive[];
  skillRatings: Record<string, SkillRating>;
  surveys: SurveyResponse[];
  settings: Settings;
  overriddenStageIds: number[];

  hydrate: () => Promise<void>;
  saveProfile: (profile: Profile) => Promise<void>;
  /** Returns the created supervisor (id generated). */
  addSupervisor: (s: Omit<Supervisor, 'id'>) => Promise<Supervisor>;
  updateSupervisor: (id: string, patch: Partial<Omit<Supervisor, 'id'>>) => Promise<void>;
  removeSupervisor: (id: string) => Promise<void>;
  /** Shortens and stores the track, saves the drive, updates skill practice counts. */
  addDrive: (drive: Drive, track?: TrackPoint[]) => Promise<void>;
  updateDrive: (id: string, patch: Partial<Omit<Drive, 'id'>>) => Promise<void>;
  deleteDrive: (id: string) => Promise<void>;
  getTrack: (id: string) => Promise<TrackPoint[]>;
  setSkillLevel: (skillId: string, level: SkillLevel) => Promise<void>;
  addSurvey: (s: SurveyResponse) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  overrideStage: (stageId: number) => Promise<void>;
  /** Delete all data (storage + memory). */
  resetAll: () => Promise<void>;
};

export const useStore = create<StoreState>((set, get) => ({
  hydrated: false,
  profile: null,
  supervisors: [],
  drives: [],
  skillRatings: {},
  surveys: [],
  settings: DEFAULT_SETTINGS,
  overriddenStageIds: [],

  async hydrate() {
    const [profile, supervisors, drives, skills, surveys, settings, curriculum] = await Promise.all([
      storage.getItem('profile'),
      storage.getItem('supervisors'),
      storage.getItem('drives'),
      storage.getItem('skills'),
      storage.getItem('surveys'),
      storage.getItem('settings'),
      storage.getItem('curriculum'),
    ]);
    set({
      hydrated: true,
      profile: profile ?? null,
      supervisors: supervisors ?? [],
      drives: sortDrives(drives ?? []),
      skillRatings: skills ?? {},
      surveys: surveys ?? [],
      settings: { ...DEFAULT_SETTINGS, ...(settings ?? {}) },
      overriddenStageIds: curriculum?.overriddenStageIds ?? [],
    });
  },

  async saveProfile(profile) {
    set({ profile });
    await storage.setItem('profile', profile);
  },

  async addSupervisor(s) {
    const sup: Supervisor = { ...s, id: newId() };
    const supervisors = [...get().supervisors, sup];
    set({ supervisors });
    await storage.setItem('supervisors', supervisors);
    return sup;
  },

  async updateSupervisor(id, patch) {
    const supervisors = get().supervisors.map((s) => (s.id === id ? { ...s, ...patch } : s));
    set({ supervisors });
    await storage.setItem('supervisors', supervisors);
  },

  async removeSupervisor(id) {
    const supervisors = get().supervisors.filter((s) => s.id !== id);
    set({ supervisors });
    await storage.setItem('supervisors', supervisors);
  },

  async addDrive(drive, track) {
    const drives = sortDrives([...get().drives.filter((d) => d.id !== drive.id), drive]);
    const skillRatings = { ...get().skillRatings };
    for (const skillId of new Set(drive.skillIds)) {
      const prev = skillRatings[skillId] ?? { skillId, level: 0 as SkillLevel, practiceCount: 0 };
      skillRatings[skillId] = {
        ...prev,
        practiceCount: prev.practiceCount + 1,
        lastPracticedAt: Math.max(prev.lastPracticedAt ?? 0, drive.endedAt),
      };
    }
    set({ drives, skillRatings });
    if (track && track.length > 0) await storage.setTrack(drive.id, simplifyTrack(track));
    await Promise.all([storage.setItem('drives', drives), storage.setItem('skills', skillRatings)]);
  },

  async updateDrive(id, patch) {
    const drives = sortDrives(get().drives.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    set({ drives });
    await storage.setItem('drives', drives);
  },

  async deleteDrive(id) {
    const target = get().drives.find((d) => d.id === id);
    if (!target) return;
    const drives = get().drives.filter((d) => d.id !== id);
    const skillRatings = { ...get().skillRatings };
    for (const skillId of new Set(target.skillIds)) {
      const prev = skillRatings[skillId];
      if (prev) skillRatings[skillId] = { ...prev, practiceCount: Math.max(0, prev.practiceCount - 1) };
    }
    set({ drives, skillRatings });
    await Promise.all([
      storage.setItem('drives', drives),
      storage.setItem('skills', skillRatings),
      storage.removeTrack(id),
    ]);
  },

  getTrack: (id) => storage.getTrack(id),

  async setSkillLevel(skillId, level) {
    const prev = get().skillRatings[skillId] ?? { skillId, level: 0 as SkillLevel, practiceCount: 0 };
    const skillRatings = { ...get().skillRatings, [skillId]: { ...prev, level } };
    set({ skillRatings });
    await storage.setItem('skills', skillRatings);
  },

  async addSurvey(s) {
    const surveys = [...get().surveys, s];
    set({ surveys });
    await storage.setItem('surveys', surveys);
  },

  async updateSettings(patch) {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    await storage.setItem('settings', settings);
  },

  async overrideStage(stageId) {
    const cur = get().overriddenStageIds;
    if (cur.includes(stageId)) return;
    const overriddenStageIds = [...cur, stageId];
    set({ overriddenStageIds });
    await storage.setItem('curriculum', { overriddenStageIds });
  },

  async resetAll() {
    await storage.clearAll();
    set({
      profile: null,
      supervisors: [],
      drives: [],
      skillRatings: {},
      surveys: [],
      settings: DEFAULT_SETTINGS,
      overriddenStageIds: [],
    });
  },
}));

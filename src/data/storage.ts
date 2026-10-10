import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Drive,
  Profile,
  Settings,
  SkillRating,
  Supervisor,
  SurveyResponse,
  TrackPoint,
  LatLng,
  Weather,
  HardBrakeEvent,
} from '../domain/types';

/** Snapshot persisted during recording for crash recovery. */
export type ActiveDriveSnapshot = {
  startedAt: number;
  savedAt: number;
  supervisorId: string;
  lessonId?: string;
  weather: Weather;
  track: TrackPoint[];
  hardBrakes: HardBrakeEvent[];
};

export type CurriculumState = { overriddenStageIds: number[] };

export type RouteCacheEntry = { coordinates: LatLng[]; source: 'mapbox' | 'overview'; savedAt: number };

export type StorageSchema = {
  profile: Profile;
  supervisors: Supervisor[];
  drives: Drive[];
  skills: Record<string, SkillRating>;
  surveys: SurveyResponse[];
  settings: Settings;
  activeDrive: ActiveDriveSnapshot;
  curriculum: CurriculumState;
};

type FixedKey = keyof StorageSchema;
export type TrackKey = `track:${string}`;
export type RouteCacheKey = `routeCache:${string}`;

export const KEY_PREFIX = 'pp:';
const k = (key: string) => KEY_PREFIX + key;

export async function getItem<K extends FixedKey>(key: K): Promise<StorageSchema[K] | null>;
export async function getItem<T = unknown>(key: TrackKey | RouteCacheKey): Promise<T | null>;
export async function getItem(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(k(key));
    return raw == null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setItem<K extends FixedKey>(key: K, value: StorageSchema[K]): Promise<void>;
export async function setItem(key: TrackKey | RouteCacheKey, value: unknown): Promise<void>;
export async function setItem(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(k(key), JSON.stringify(value));
}

export async function removeItem(key: FixedKey | TrackKey | RouteCacheKey): Promise<void> {
  await AsyncStorage.removeItem(k(key));
}

export const trackKey = (driveId: string): TrackKey => `track:${driveId}`;
export const routeCacheKey = (id: string): RouteCacheKey => `routeCache:${id}`;

export async function getTrack(driveId: string): Promise<TrackPoint[]> {
  return (await getItem<TrackPoint[]>(trackKey(driveId))) ?? [];
}
export const setTrack = (driveId: string, track: TrackPoint[]) => setItem(trackKey(driveId), track);
export const removeTrack = (driveId: string) => removeItem(trackKey(driveId));

/** Remove every key owned by this app. */
export async function clearAll(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const mine = keys.filter((key) => key.startsWith(KEY_PREFIX));
  if (mine.length) await AsyncStorage.multiRemove(mine);
}

/** All stored tracks keyed by drive id (used by backup). */
export async function getAllTracks(driveIds: string[]): Promise<Record<string, TrackPoint[]>> {
  const out: Record<string, TrackPoint[]> = {};
  for (const id of driveIds) out[id] = await getTrack(id);
  return out;
}

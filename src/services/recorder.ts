import { useSyncExternalStore } from 'react';
import * as Location from 'expo-location';
import { DeviceMotion } from 'expo-sensors';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { rules } from '../content/rules';
import { createBrakeDetector, type BrakeDetector } from '../domain/braking';
import { overlapsCurfew } from '../domain/curfew';
import { distanceMeters } from '../domain/geo';
import { initialLockState, nextLockState, tickLockState, type MotionLockState } from '../domain/motionLock';
import { splitDayNight } from '../domain/night';
import { isNightAt } from '../domain/solar';
import type { Drive, HardBrakeEvent, LatLng, NightRule, TrackPoint, Weather } from '../domain/types';
import { newId } from '../data/id';
import * as storage from '../data/storage';
import type { ActiveDriveSnapshot } from '../data/storage';
import { useStore } from '../data/store';

export type RecorderStatus = 'idle' | 'recording' | 'stopping';

export type RecorderState = {
  status: RecorderStatus;
  startedAt: number | null;
  elapsedSec: number;
  /** Movement lock engaged (screen must show nothing interactive). */
  locked: boolean;
  speedMs: number;
  distanceM: number;
  isNightNow: boolean;
  hardBrakeCount: number;
  lastPoint: TrackPoint | null;
  lessonId?: string;
  supervisorId: string | null;
  weather: Weather;
};

export type StartOptions = { supervisorId: string; lessonId?: string; weather: Weather };
export type StartResult = { ok: true } | { ok: false; reason: 'permission-denied' | 'error'; message?: string };
export type FinishedDrive = { drive: Drive; track: TrackPoint[] };

const SNAPSHOT_EVERY_MS = 30_000;
const KEEP_AWAKE_TAG = 'permitpath-drive';
const MAX_ACCURACY_M = 100;

const IDLE_STATE: RecorderState = {
  status: 'idle',
  startedAt: null,
  elapsedSec: 0,
  locked: false,
  speedMs: 0,
  distanceM: 0,
  isNightNow: false,
  hardBrakeCount: 0,
  lastPoint: null,
  supervisorId: null,
  weather: 'clear',
};

/** Pure-ish builder shared by stop() and finalizeRecovered(). */
function buildDrive(args: {
  startedAt: number;
  endedAt: number;
  supervisorId: string;
  lessonId?: string;
  weather: Weather;
  track: TrackPoint[];
  hardBrakes: HardBrakeEvent[];
  nightRule: NightRule;
  home?: LatLng;
}): FinishedDrive {
  const { startedAt, endedAt, track, nightRule } = args;
  const durationSec = Math.max(0, Math.round((endedAt - startedAt) / 1000));

  let nightSec = 0;
  if (track.length >= 2) {
    nightSec = Math.round(splitDayNight(track, nightRule, rules.fixedNight).nightSec);
  } else {
    const loc: LatLng | undefined = track[0] ?? args.home;
    if (loc && isNightAt(startedAt, loc.lat, loc.lng, nightRule, rules.fixedNight)) nightSec = durationSec;
  }
  nightSec = Math.min(nightSec, durationSec);

  let distanceM = 0;
  for (let i = 1; i < track.length; i++) distanceM += distanceMeters(track[i - 1], track[i]);

  const drive: Drive = {
    id: newId(),
    startedAt,
    endedAt,
    supervisorId: args.supervisorId,
    source: 'gps',
    durationSec,
    nightSec,
    distanceM: Math.round(distanceM),
    weather: args.weather,
    lessonId: args.lessonId,
    skillIds: [],
    hardBrakes: args.hardBrakes,
    curfewWarning: overlapsCurfew(startedAt, endedAt, rules.curfew),
    notes: '',
  };
  return { drive, track };
}

class DriveRecorder {
  private state: RecorderState = IDLE_STATE;
  private listeners = new Set<() => void>();

  private track: TrackPoint[] = [];
  private lock: MotionLockState = initialLockState();
  private detector: BrakeDetector | null = null;
  private hardBrakes: HardBrakeEvent[] = [];
  private locationSub: Location.LocationSubscription | null = null;
  private motionSub: { remove: () => void } | null = null;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private snapshotTimer: ReturnType<typeof setInterval> | null = null;

  // ---- external store plumbing ----
  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getState = (): RecorderState => this.state;

  private set(patch: Partial<RecorderState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  // ---- lifecycle ----
  async start(opts: StartOptions): Promise<StartResult> {
    if (this.state.status !== 'idle') return { ok: false, reason: 'error', message: 'Already recording' };
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') return { ok: false, reason: 'permission-denied' };

      const settings = useStore.getState().settings;
      const startedAt = Date.now();
      this.track = [];
      this.hardBrakes = [];
      this.lock = initialLockState();
      this.detector = createBrakeDetector(settings.brakeSensitivity);

      const home = useStore.getState().profile?.homeLocation;
      this.set({
        ...IDLE_STATE,
        status: 'recording',
        startedAt,
        supervisorId: opts.supervisorId,
        lessonId: opts.lessonId,
        weather: opts.weather,
        isNightNow: home ? isNightAt(startedAt, home.lat, home.lng, settings.nightRule, rules.fixedNight) : false,
      });

      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});

      this.locationSub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 10 },
        (loc) => this.onFix(loc),
      );
      await this.startMotion();

      this.tickTimer = setInterval(() => this.onTick(), 1000);
      this.snapshotTimer = setInterval(() => {
        void this.persistSnapshot();
      }, SNAPSHOT_EVERY_MS);
      void this.persistSnapshot();
      return { ok: true };
    } catch (e) {
      await this.teardown();
      this.set({ ...IDLE_STATE });
      return { ok: false, reason: 'error', message: e instanceof Error ? e.message : String(e) };
    }
  }

  private async startMotion() {
    try {
      const available = await DeviceMotion.isAvailableAsync();
      if (!available) return; // e.g. desktop web: skip braking
      DeviceMotion.setUpdateInterval(50);
      this.motionSub = DeviceMotion.addListener((m) => {
        const a = m.acceleration;
        if (!a || !this.detector) return;
        const events = this.detector.pushMotion({ t: Date.now(), x: a.x, y: a.y, z: a.z });
        this.collect(events);
      });
    } catch {
      this.motionSub = null;
    }
  }

  private collect(events: HardBrakeEvent[]) {
    if (events.length === 0) return;
    this.hardBrakes = [...this.hardBrakes, ...events];
    this.set({ hardBrakeCount: this.hardBrakes.length });
  }

  private onFix(loc: Location.LocationObject) {
    if (this.state.status !== 'recording') return;
    const { latitude, longitude, speed, accuracy } = loc.coords;
    if (accuracy != null && accuracy > MAX_ACCURACY_M) return;
    const point: TrackPoint = {
      t: loc.timestamp || Date.now(),
      lat: latitude,
      lng: longitude,
      speed: speed != null && Number.isFinite(speed) && speed >= 0 ? speed : null,
    };
    const prev = this.track[this.track.length - 1];
    this.track.push(point);
    this.lock = nextLockState(this.lock, point);
    const events = this.detector ? this.detector.pushSpeed(point) : [];
    const distanceM = this.state.distanceM + (prev ? distanceMeters(prev, point) : 0);
    const nightRule = useStore.getState().settings.nightRule;
    this.set({
      lastPoint: point,
      speedMs: this.lock.speed,
      locked: this.lock.locked,
      distanceM,
      isNightNow: isNightAt(Date.now(), point.lat, point.lng, nightRule, rules.fixedNight),
    });
    this.collect(events);
  }

  private onTick() {
    const s = this.state;
    if (s.status !== 'recording' || s.startedAt == null) return;
    const now = Date.now();
    this.lock = tickLockState(this.lock, now);
    const loc: LatLng | undefined = s.lastPoint ?? useStore.getState().profile?.homeLocation;
    const nightRule = useStore.getState().settings.nightRule;
    this.set({
      elapsedSec: Math.max(0, Math.floor((now - s.startedAt) / 1000)),
      locked: this.lock.locked,
      isNightNow: loc ? isNightAt(now, loc.lat, loc.lng, nightRule, rules.fixedNight) : s.isNightNow,
    });
  }

  private async persistSnapshot() {
    const s = this.state;
    if (s.status !== 'recording' || s.startedAt == null || !s.supervisorId) return;
    const snap: ActiveDriveSnapshot = {
      startedAt: s.startedAt,
      savedAt: Date.now(),
      supervisorId: s.supervisorId,
      lessonId: s.lessonId,
      weather: s.weather,
      track: this.track,
      hardBrakes: this.hardBrakes,
    };
    try {
      await storage.setItem('activeDrive', snap);
    } catch {
      /* best effort */
    }
  }

  private async teardown() {
    if (this.tickTimer) clearInterval(this.tickTimer);
    if (this.snapshotTimer) clearInterval(this.snapshotTimer);
    this.tickTimer = null;
    this.snapshotTimer = null;
    try {
      this.locationSub?.remove();
    } catch {
      /* ignore */
    }
    try {
      this.motionSub?.remove();
    } catch {
      /* ignore */
    }
    this.locationSub = null;
    this.motionSub = null;
    try {
      await deactivateKeepAwake(KEEP_AWAKE_TAG);
    } catch {
      /* ignore */
    }
  }

  /** Finish recording. Returns the drive WITHOUT saving it; the summary screen saves. */
  async stop(): Promise<FinishedDrive | null> {
    const s = this.state;
    if (s.status !== 'recording' || s.startedAt == null || !s.supervisorId) return null;
    this.set({ status: 'stopping' });
    const endedAt = Date.now();
    const finalEvents = this.detector ? this.detector.finish() : [];
    this.collect(finalEvents);
    await this.teardown();

    const settings = useStore.getState().settings;
    const result = buildDrive({
      startedAt: s.startedAt,
      endedAt,
      supervisorId: s.supervisorId,
      lessonId: s.lessonId,
      weather: s.weather,
      track: this.track,
      hardBrakes: this.hardBrakes,
      nightRule: settings.nightRule,
      home: useStore.getState().profile?.homeLocation,
    });
    await this.reset();
    return result;
  }

  /** Throw away the current recording. */
  async discard(): Promise<void> {
    await this.teardown();
    await this.reset();
  }

  private async reset() {
    this.track = [];
    this.hardBrakes = [];
    this.detector = null;
    this.lock = initialLockState();
    this.set({ ...IDLE_STATE });
    try {
      await storage.removeItem('activeDrive');
    } catch {
      /* ignore */
    }
  }

  // ---- crash recovery ----
  async recoverActiveDrive(): Promise<ActiveDriveSnapshot | null> {
    if (this.state.status !== 'idle') return null;
    return storage.getItem('activeDrive');
  }

  /** Build an unsaved Drive from a recovered snapshot and clear the snapshot. */
  async finalizeRecovered(snapshot: ActiveDriveSnapshot): Promise<FinishedDrive> {
    const lastT = snapshot.track.length ? snapshot.track[snapshot.track.length - 1].t : snapshot.savedAt;
    const endedAt = Math.max(snapshot.startedAt, Math.min(lastT, snapshot.savedAt));
    const result = buildDrive({
      startedAt: snapshot.startedAt,
      endedAt,
      supervisorId: snapshot.supervisorId,
      lessonId: snapshot.lessonId,
      weather: snapshot.weather,
      track: snapshot.track,
      hardBrakes: snapshot.hardBrakes,
      nightRule: useStore.getState().settings.nightRule,
      home: useStore.getState().profile?.homeLocation,
    });
    await storage.removeItem('activeDrive');
    return result;
  }

  async discardRecovered(): Promise<void> {
    await storage.removeItem('activeDrive');
  }
}

export const driveRecorder = new DriveRecorder();

/** Live recorder state. */
export function useDriveRecorder(): RecorderState {
  return useSyncExternalStore(driveRecorder.subscribe, driveRecorder.getState, driveRecorder.getState);
}

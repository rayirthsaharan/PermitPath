// Pure domain types. No React / React Native / Expo imports allowed in src/domain.

export type LatLng = { lat: number; lng: number };

/** GPS fix. `t` is ms since epoch; `speed` is m/s or null when unavailable. */
export type TrackPoint = { t: number; lat: number; lng: number; speed: number | null };

/** Linear acceleration with gravity removed, m/s^2. `t` is ms since epoch. */
export type MotionSample = { t: number; x: number; y: number; z: number };

export type NightRule = 'sun' | 'fixed';
export type BrakeSensitivity = 'low' | 'medium' | 'high';
export type Weather = 'clear' | 'rain' | 'fog' | 'snow-ice';
export type DriveSource = 'gps' | 'manual';

export type Profile = {
  firstName: string;
  /** Local calendar date of permit issue, 'YYYY-MM-DD'. */
  permitIssueDate: string;
  homeLocation?: LatLng;
};

export type Supervisor = {
  id: string;
  name: string;
  relationship: string;
  /** Attestation: "I am a licensed driver age 21 or older". */
  attests21Plus: boolean;
};

export type HardBrakeEvent = { t: number; lat: number; lng: number; peakMs2: number };

export type SkillLevel = 0 | 1 | 2 | 3;

export type SkillRating = {
  skillId: string;
  level: SkillLevel;
  practiceCount: number;
  lastPracticedAt?: number;
};

export type Drive = {
  id: string;
  /** ms since epoch */
  startedAt: number;
  /** ms since epoch */
  endedAt: number;
  supervisorId: string;
  source: DriveSource;
  durationSec: number;
  nightSec: number;
  distanceM: number;
  weather: Weather;
  lessonId?: string;
  skillIds: string[];
  hardBrakes: HardBrakeEvent[];
  curfewWarning: boolean;
  notes: string;
  /** Optional parent overall rating (1-5) of the drive. */
  parentRating?: number;
};

export type SurveyKind = 'pre' | 'post';
export type SurveyRespondent = 'teen' | 'parent';

export type SurveyResponse = {
  kind: SurveyKind;
  respondent: SurveyRespondent;
  /** survey item id -> Likert value 1..5 */
  answers: Record<string, number>;
  completedAt: number;
};

export type Settings = {
  nightRule: NightRule;
  brakeSensitivity: BrakeSensitivity;
  disclaimerAcceptedAt?: number;
  pledgeAcceptedAt?: number;
};

export type CurfewWindow = { startHour: number; endHour: number };

// ---- Content shapes: data lives in src/content, but the shapes live here so
// ---- the domain layer never imports from content. ----

export type Skill = {
  id: string;
  category: string;
  title: string;
  whatGoodLooksLike: string;
};

export type SkillCategory = { id: string; title: string };

export type CorridorKind = 'arterial' | 'roundabout' | 'interchange';

export type Corridor = {
  id: string;
  name: string;
  kind: CorridorKind;
  waypoints: LatLng[];
  whyItMatters: string;
  source: string;
  verified: boolean;
};

export type CoachingCardKind = 'watch' | 'say' | 'mistake' | 'why';
export type CoachingCard = { kind: CoachingCardKind; title: string; body: string };

export type RouteMode = 'corridor' | 'nearby';

export type Lesson = {
  id: string;
  stageId: number;
  title: string;
  goal: string;
  estimatedMinutes: number;
  bestTimes: string;
  corridorIds: string[];
  skillIds: string[];
  coachingCards: CoachingCard[];
  debriefPrompts: string[];
  routeMode: RouteMode;
  isNight?: boolean;
  weatherFocus?: Weather;
};

export type SkillReq = {
  /** Either a specific skill id or a category id (all skills in category must meet minLevel). */
  skillId?: string;
  categoryId?: string;
  minLevel: SkillLevel;
};

export type UnlockGate = {
  minHours: number;
  skillReqs: SkillReq[];
  requiresLessonsFromStages?: number[];
};

export type Stage = {
  id: number;
  title: string;
  theme: string;
  gate: UnlockGate;
  lessons: Lesson[];
};

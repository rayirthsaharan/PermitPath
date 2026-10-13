# PermitPath WilCo — Product, UI & Technical Plan

> Status: v0.1 plan (MVP). This document is the source of truth for the build.
> Implementers: follow the structure, names, and rules here. If something is
> ambiguous, choose the simplest option that keeps data on-device and keeps the
> driver's eyes off the phone.

## 1. Problem & product promise

Tennessee learner-permit holders must complete **50 supervised hours, including
10 at night**, and a parent/guardian signs a certification form. In practice
that time is unstructured, and families rarely rehearse the specific Mt. Juliet /
Wilson County roads where crashes concentrate.

**PermitPath WilCo** turns those 50 hours into a structured, local curriculum:

1. **Log** every drive by GPS with automatic night detection.
2. **Track** a skills checklist rated by the supervising parent.
3. **Progress** through a local practice curriculum that gradually introduces
   Mt. Juliet's high-injury corridors, roundabouts, and I-40 merges, with
   coaching cards for the parent.
4. **Flag** hard-braking moments (accelerometer + GPS) for the post-drive debrief.
5. **Print** a clean log that *supports, but does not replace*, the official
   Tennessee certification form.

### Non-goals (explicit)
- No crash-reduction claims anywhere in the app or marketing.
- No AI features. The sophistication is geospatial + sensor work.
- No accounts, no cloud sync, no analytics in the MVP.
- No turn-by-turn navigation. We suggest *practice areas and an overview route*;
  the parent decides where and when to drive.

## 2. Users

| User | Goal | Key moments |
|---|---|---|
| **Teen (permit holder, 15–16)** | Get to 50/10 hours, feel ready for the road test | Sees progress, picks next lesson, reviews debrief |
| **Supervising parent (21+)** | Teach effectively, sign the form honestly | Reads briefing before the drive, rates skills after, prints log |
| **Partner (police / THSO / driving school)** | Refer families, evaluate program | Receives an *opt-in, user-exported* anonymous summary (hours, lessons, survey deltas) |

The app is used on **one phone per family** (either teen's or parent's). It is
mounted or stowed during the drive; only the passenger interacts, and only when
stopped.

## 3. Rules & domain facts (configurable, verify before release)

All values live in `src/content/rules.ts` so they can be updated without code changes.

| Rule | Default | Note |
|---|---|---|
| Required total hours | 50 | TN Level 1 learner permit |
| Required night hours | 10 | Included in the 50 |
| Minimum permit holding period | 180 days | Road-test eligibility countdown |
| Night definition | Sunset → sunrise at the drive's location (NOAA solar calc) | `nightRule: 'sun' \| 'fixed'`; `fixed` = 18:00–06:00 alternative. **Verify TN definition.** |
| Permit curfew | No driving 22:00–06:00 | Drives overlapping this window get a non-blocking warning. **Verify current TN handbook.** |
| Supervisor | Licensed driver 21+ in front seat | Captured as an attestation checkbox per supervisor |

Every rule screen shows: *"Rules summarized for convenience. Check the current
Tennessee Driver Handbook / TN Dept. of Safety for official requirements."*

## 4. Feature specification

### 4.1 Onboarding (4 steps, ~90 seconds)
1. **Welcome** — what the app does, honest caveat ("It helps you practice
   deliberately. It can't promise fewer crashes.").
2. **Teen profile** — first name, permit issue date (date picker), home area
   (use current location or skip; stored on-device only, used as route origin).
3. **Supervisors** — add ≥1: name, relationship, checkbox "I am a licensed
   driver age 21 or older". Can add more later.
4. **Safety & privacy pledge** — three acknowledgements (all required):
   - "The screen locks while the car is moving. Only the passenger uses the app, only when stopped."
   - "Suggested routes are practice ideas, not guarantees of safety. The supervising adult decides if roads and conditions are appropriate."
   - "Your drives and locations stay on this phone unless you choose to export them."
   Then request foreground location permission and offer the **pre-program
   confidence survey** (optional, teen + parent).

### 4.2 Drive logger
- **Start drive sheet**: supervisor (default = last used), optional lesson
  (defaults to "next suggested"), weather (clear / rain / fog / snow-ice),
  pre-drive **briefing** = the lesson's coaching cards. Big "Start drive" button.
- **Recording** (`src/services/recorder.ts`):
  - `expo-location` `watchPositionAsync` (BestForNavigation, every 1 s, no distance filter so a parked phone keeps reporting).
  - `expo-sensors` `DeviceMotion` at 20 Hz for hard-brake detection.
  - `expo-keep-awake` keeps the screen on (screen is near-black to save power).
  - Track samples `{t, lat, lng, speed}` buffered in memory and flushed to
    storage every 30 s (crash-safe: an unfinished drive is recoverable on next launch).
- **Movement lock** (`src/domain/motionLock.ts`): locked when speed ≥ 2.2 m/s
  (≈5 mph); unlocks after speed < 0.9 m/s for ≥ 5 s, or after 6 s with no GPS fix once below ~13 mph (moves under 4 m are treated as GPS drift). When GPS speed is
  missing/negative, derive from consecutive fixes. While locked the screen shows
  only elapsed time, a NIGHT badge, and "Eyes on the road — app locked while
  moving." **No buttons are tappable while locked.**
- **Ending**: only when unlocked. "End drive" requires a 1-second press-and-hold
  (prevents pocket taps). Drives < 2 minutes prompt "Discard or keep?".
- **Night detection** (`src/domain/solar.ts`, `src/domain/night.ts`): split each
  drive's duration into day vs. night by walking the track (each interval between
  samples is classified by its midpoint time + location). A drive crossing sunset
  counts partially. Manual drives enter night minutes directly.
- **Curfew warning**: if any part of the drive falls 22:00–06:00 local, flag
  `curfewWarning` and show a neutral note in the summary.
- **Drive summary** (after ending): route map with hard-brake pins, duration,
  distance, night minutes, hard-brake count, *skills practiced* chips (tap to
  mark), quick parent skill ratings, notes, 3 debrief prompts from the lesson.
  Save → back to Home with updated progress.
- **Manual entry**: for drives taken without the phone — date, start/end time,
  night minutes, supervisor, weather, notes. Marked "Manual" in the log.

### 4.3 Skills checklist
`src/content/skills.ts` — ~30 skills in 8 categories:
Vehicle basics · Residential streets · Intersections & right-of-way ·
Roundabouts · Arterials & lane changes · Interstate (I-40) · Night ·
Weather & hazards · Parking.
Each skill has: `id`, `category`, `title`, `whatGoodLooksLike` (1–2 sentences).
Rating levels: **0 Not yet · 1 Introduced · 2 Practicing · 3 Confident**
(rated by the parent; the teen can self-rate separately for the survey). Store
`practiceCount` (# drives where marked practiced) and `lastPracticedAt`.

### 4.4 Progressive practice-route curriculum
`src/content/curriculum.ts` defines **7 stages**, each with 1–3 **lessons**.
Unlocking is gated by hours logged **and** prerequisite skill ratings (parent can
override with "Unlock anyway" + confirmation — the parent is in charge).

| Stage | Theme | Unlock gate (default) |
|---|---|---|
| 1 | Foundations: empty lot, controls, smooth braking | always |
| 2 | Quiet residential streets near home | 2 h + basics ≥ 1 |
| 3 | Collector roads & signalized intersections | 6 h + residential ≥ 2 |
| 4 | Roundabouts (new Mt. Juliet roundabouts) | 10 h + intersections ≥ 2 |
| 5 | High-injury corridors, off-peak → peak (e.g., N. Mt. Juliet Rd/SR-171, Lebanon Rd/US-70, Central Pike) | 16 h + stage 3 & 4 lessons done |
| 6 | I-40 merges & exits (Exit 226 SR-171, Exit 229 Beckwith Rd) | 24 h + arterial skills ≥ 2 |
| 7 | Night & weather repeats of stages 3–6 | 30 h (night lessons count toward the 10 night hours) |

Each **lesson** has: `id`, `stageId`, `title`, `goal`, `estimatedMinutes`,
`bestTimes` (e.g., "Sunday 7–9 AM"), `corridorIds`, `skillIds`, `coachingCards[]`,
`debriefPrompts[]`, and `routeMode`:
- `'corridor'` — overview route Home → corridor waypoints → Home.
- `'nearby'` — "pick a quiet street/lot near home" (no fixed route; parent chooses).

**Coaching cards** (for the parent; read **before** the drive and at stops):
`{ kind: 'watch' | 'say' | 'mistake' | 'why', title, body }`
- *watch*: what to look for ("Teen checks left, right, left again before a right-on-red").
- *say*: calm phrasing ("Ease off the gas now — we have room.").
- *mistake*: common error and fix.
- *why*: local context, citing the source (Safety Action Plan high-injury network).

**Corridors** `src/content/corridors.ts`:
`{ id, name, kind: 'arterial'|'roundabout'|'interchange', waypoints: LatLng[], whyItMatters, source, verified: boolean }`.
Seed with candidate corridors at **approximate** coordinates and
`verified: false`. **Release gate:** every corridor must be verified against the
Mt. Juliet Safety Action Plan high-injury network maps (18 roadways) and city
roundabout locations before public release. Unverified corridors show a
"Location pending verification" badge in the UI.

**Route generation** (`src/services/routing.ts`): if
`EXPO_PUBLIC_MAPBOX_TOKEN` is set, call Mapbox Directions REST
(`driving` profile, `overview=full`, `geometries=geojson`) Home → waypoints → Home.
Otherwise fall back to a straight-segment polyline through the waypoints and show
"Overview only — follow road signs and your supervisor." Routes are cached per
lesson. **No turn-by-turn instructions**, ever.

**Liability guardrails**: a one-time route disclaimer gate (stored timestamp),
a persistent footer on every lesson ("Practice suggestion only. You decide if
roads, traffic, and weather are right. Obey all traffic laws."), and
time-of-day guidance that starts corridors off-peak.

### 4.5 Hard-braking detection
`src/domain/braking.ts` — pure, unit-tested.
- Input: DeviceMotion `acceleration` (gravity removed, m/s²) at ~20 Hz + recent GPS speeds.
- Orientation-agnostic: use vector magnitude, smoothed by EMA (α = 0.3).
- Event when smoothed magnitude ≥ threshold for ≥ 300 ms **and**
  GPS corroboration: speed before ≥ 4.5 m/s (~10 mph) and speed drops ≥ 2.5 m/s
  within the 2 s window around the spike. (Corroboration rejects phone fumbles.)
- Thresholds: sensitivity `low` 4.9 m/s² (0.5 g), `medium` 3.9 (0.4 g, default), `high` 3.2 (0.33 g).
- Debounce: 6 s between events.
- Output `{ t, lat, lng, peakMs2 }`. Shown as pins + "talk about it" prompt, not a score.
  Copy is non-judgmental: "3 firm stops — worth a quick chat?".

### 4.6 Log & printable export
- **Log tab**: totals header (total / night / days held), drives grouped by month,
  each row: date, time range, duration, night portion, supervisor, badges
  (Manual, Lesson, Curfew). Tap → drive detail (edit supervisor/weather/notes, delete).
- **Export PDF** (`expo-print`): `src/domain/logHtml.ts` builds HTML (pure,
  testable): header (teen name, permit date, generated date), totals table, drive
  table (date, start, end, total min, night min, supervisor, conditions, notes),
  skills summary, and the banner: **"This log supports, but does not replace,
  the official Tennessee certification form. The parent/guardian must complete
  and sign the official form."** Signature/date lines at the end. Share via
  `expo-sharing`; on web use `Print.printAsync`.
- **Data export**: JSON backup (user-initiated share) and "Delete all data".

### 4.7 Confidence surveys (metrics)
Pre (onboarding/optional) and post (offered at 50 h). Teen and parent each answer
6 Likert items (1–5), e.g., "I feel confident merging onto I-40", "…navigating a
roundabout", "…driving at night", "…on N. Mt. Juliet Rd at rush hour". Results
screen shows pre vs. post per item. **Optional** "Share anonymous summary" builds
a JSON with hours, lessons completed, and survey deltas — no names, no locations.

### 4.8 Settings
Profile · Supervisors · Night rule · Brake sensitivity · Surveys · Export/backup ·
Delete all data · Sources & disclaimers · About (honest caveat: Wilson County
ranked 76th of 95 TN counties for teen crashes in a 2011–2015 TDH snapshot —
risk is real but not unusually high; this app is about deliberate practice).

## 5. UI design

### 5.1 Principles
1. **Glanceable progress.** Two rings (total, night) answer "how close are we?" in one look.
2. **Zero interaction while moving.** The drive screen is a near-black lock with one number.
3. **Parent-as-coach.** Coaching cards are short, scannable, and read *before* the drive.
4. **Calm, not gamified.** No streak shaming, no scores for braking. Encouraging, factual copy.
5. **Night-friendly.** Full dark theme; drive screen is always dark regardless of theme.
6. **Accessible.** ≥ 48 pt touch targets, Dynamic Type friendly, 4.5:1 contrast, labels on every icon.

### 5.2 Design tokens (`src/theme/tokens.ts`)
| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#F6F7F9` | `#0B1220` | screen background |
| `surface` | `#FFFFFF` | `#141D2F` | cards |
| `surfaceAlt` | `#EEF1F5` | `#1C2740` | chips, inputs |
| `border` | `#E1E5EB` | `#26324A` | hairlines |
| `text` | `#0F1A2A` | `#E9EEF6` | primary text |
| `textMuted` | `#5B6576` | `#98A4B8` | secondary text |
| `primary` | `#1D5FB8` | `#5C9DFF` | road-sign blue: actions, total ring |
| `onPrimary` | `#FFFFFF` | `#0B1220` | text on primary |
| `night` | `#5A4BD1` | `#9A8CFF` | night ring, night badges |
| `amber` | `#E0A400` | `#F5C542` | caution, curfew, hard-brake pins |
| `success` | `#1E8E5A` | `#3CC489` | completed, confident |
| `danger` | `#C0392B` | `#FF6B5E` | destructive |
| `driveBg` | `#05070C` | `#05070C` | locked drive screen (always) |

Spacing 4-pt grid (`xs 4, sm 8, md 12, lg 16, xl 24, xxl 32`). Radius: `card 16`,
`chip 999`, `button 14`. Type (system font): `hero 44/700` (drive timer),
`display 32/700`, `title 22/700`, `headline 17/600`, `body 16/400`,
`caption 13/500`. Icons: `@expo/vector-icons` Ionicons.

### 5.3 Navigation
expo-router. Bottom tabs: **Home · Routes · ● Drive · Skills · Log**. The
center Drive tab is a raised circular primary button that opens the Start Drive
sheet. Settings via gear icon in Home header. Onboarding is a gate in the root
layout when no profile exists. An unfinished drive on launch shows a
"Resume or save your last drive" banner.

### 5.4 Key screens (wireframes)

**Home**
```
┌──────────────────────────────────┐
│ Hi, Maya                    ⚙︎   │
│ Permit day 74 · road test in 106 │
│  ╭──────╮        ╭──────╮        │
│  │ 21.5 │        │  3.2 │        │
│  │ /50h │        │ /10h │        │
│  ╰total─╯        ╰night─╯        │
├──────────────────────────────────┤
│ NEXT LESSON · Stage 4            │
│ Your first roundabout            │
│ 25 min · best Sun 7–9 AM         │
│ [ View briefing ]  [ Start ▸ ]   │
├──────────────────────────────────┤
│ This week   2 drives · 1h 40m    │
│ Recent drives                     │
│ Tue 6:12 PM  48 min  🌙 22 min    │
│ Sun 8:05 AM  35 min  Lesson 3.2   │
└──────────────────────────────────┘
```

**Start Drive sheet** → supervisor chips · lesson picker · weather chips ·
collapsible briefing (coaching cards) · full-width "Start drive".

**Active drive (moving = locked)**
```
┌──────────────────────────────────┐   ← always #05070C
│                                  │
│            00:23:41              │   hero 44
│             🌙 NIGHT             │   (only when night)
│                                  │
│   Eyes on the road.              │
│   PermitPath is locked while     │
│   the car is moving.             │
└──────────────────────────────────┘
```
**Active drive (stopped)** → same timer + lesson card peek ("Coaching card 2/5"),
distance, and a press-and-hold "End drive" button.

**Drive summary** → map with route + amber brake pins · stat row (time / night /
distance / firm stops) · "Skills practiced" chips · parent quick-rate (0–3
segmented) for lesson skills · debrief prompts · notes · Save.

**Routes (curriculum)** → vertical stage path (numbered nodes connected by a
line, like a road); unlocked stages expanded with lesson cards; locked ones show
the gate ("Unlocks at 10 h + Intersections: Practicing"). Lesson cards show
✓ when completed (completed = ≥1 saved drive with that lesson).

**Lesson detail** → map (overview route or "pick nearby"), goal, best times,
"Why this road" (with source + verified badge), coaching cards carousel
(swipeable, colored by kind), debrief prompts, liability footer, "Start this lesson".

**Skills** → category sections with progress bar ("4/5 practicing+"); each row:
title, what-good-looks-like (expandable), 4-step segmented rating, practice count.

**Log** → totals header + "Export PDF" button, month sections, swipe/long-press
for edit/delete, "+ Add manual drive".

**Settings, Surveys, Sources** → standard grouped lists.

### 5.5 Component inventory (`src/components/`)
`Screen` (safe-area + scroll + bg), `Card`, `Button` (primary/secondary/ghost/danger,
`holdToConfirmMs` prop), `ProgressRing` (react-native-svg), `StatTile`, `Chip`,
`SegmentedRating`, `SectionHeader`, `CoachingCard`, `StageNode`, `LessonCard`,
`DriveRow`, `Badge`, `EmptyState`, `RouteMap` (`react-native-maps` on native;
`RouteMap.web.tsx` draws an SVG polyline on a plain panel), `LockOverlay`,
`DisclaimerFooter`.

## 6. Architecture

- **Expo (latest SDK) + TypeScript + expo-router.** Runs in Expo Go for the MVP.
- **Storage**: `@react-native-async-storage/async-storage` via a small
  repository layer (`src/data/storage.ts`). Keys: `profile`, `supervisors`,
  `drives` (metadata array), `track:<driveId>` (simplified polyline),
  `skills`, `surveys`, `settings`, `activeDrive`. Tracks are simplified with
  Douglas–Peucker (≈5 m tolerance) on save. Everything is on-device.
- **State**: `zustand` store (`src/data/store.ts`) hydrated from storage at
  launch; actions persist through the repository.
- **Domain logic is pure TypeScript** in `src/domain/` with Jest tests (no React
  Native imports there), so the core rules are verifiable in CI.
- **Sensors/services** in `src/services/` wrap Expo modules and feed the pure
  domain functions.
- Background location (screen-off logging) is **phase 2** (needs a dev build +
  `expo-task-manager`). The MVP keeps the screen awake on the locked drive screen.

```
app/
  _layout.tsx                 root: theme, store hydration, onboarding gate
  onboarding.tsx              4-step stepper
  (tabs)/_layout.tsx          tabs with raised center Drive button
  (tabs)/index.tsx            Home
  (tabs)/routes.tsx           Curriculum
  (tabs)/drive.tsx            placeholder → opens /drive/start
  (tabs)/skills.tsx           Skills
  (tabs)/log.tsx              Log
  drive/start.tsx             Start Drive (modal)
  drive/active.tsx            Recording + lock
  drive/summary/[id].tsx      Post-drive summary
  drive/manual.tsx            Manual entry
  log/[id].tsx                Drive detail / edit
  lesson/[id].tsx             Lesson detail
  settings/index.tsx          Settings
  settings/supervisors.tsx
  survey/[kind].tsx           pre | post
  sources.tsx                 Sources & disclaimers
src/
  theme/      tokens.ts, ThemeProvider.tsx (useTheme)
  components/ (see 5.5)
  content/    rules.ts, skills.ts, curriculum.ts, corridors.ts, surveys.ts, sources.ts
  domain/     types.ts, geo.ts, solar.ts, night.ts, curfew.ts, braking.ts,
              motionLock.ts, progress.ts, curriculum.ts (unlock logic),
              simplify.ts, logHtml.ts, summary.ts (anonymous export)
  data/       storage.ts, store.ts
  services/   recorder.ts, routing.ts, exportLog.ts, backup.ts
```

## 7. Metrics (what we measure — and don't)
- Hours logged (total / night), drives, lessons completed, stages reached.
- Pre/post confidence survey deltas (teen + parent).
- **Never** claim or display crash reduction.

## 8. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Distraction | Movement lock; no tappable UI while moving; hold-to-end; briefing before, debrief after |
| Liability for recommended routes | Disclaimer gate, persistent footer, overview-only routes, off-peak first, parent override, verified-corridor release gate |
| Location privacy | On-device only, no accounts, user-initiated exports, delete-all |
| Accelerometer false positives | GPS corroboration + debounce; non-judgmental copy |
| Rule drift (TN law changes) | Rules in one config file with "verify" notes and handbook link |
| Data accuracy of corridors | `verified` flag + badge; partner review (Mt. Juliet PD / THSO) before launch |

## 9. Partners
Mt. Juliet Police · Tennessee Highway Safety Office (Reduce TN Crashes school
program) · local driving schools. Partner asks: verify corridor list, review
coaching card copy, distribute via schools, optional anonymous survey summaries.

## 10. Build phases
1. **Foundation** — Expo scaffold, theme tokens, content files, pure domain logic + Jest tests.
2. **Data & services** — storage, zustand store, recorder, routing, PDF export, backup.
3. **UI** — components, onboarding, home, drive flow, routes/lessons, skills, log, settings, surveys.
4. **Verify** — typecheck, tests, web export smoke test + screenshots.
5. *(Post-MVP)* background location dev build, corridor verification with partners, store submission.

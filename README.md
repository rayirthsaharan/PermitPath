# PermitPath WilCo

A practice companion for Tennessee learner-permit holders in Mt. Juliet / Wilson County.
It logs the 50 supervised hours (10 at night), tracks a skills checklist, walks families
through a progressive local practice curriculum with parent coaching cards, flags
hard-braking moments for the debrief, and prints a log that supports — but does not
replace — the official Tennessee certification form.

See [`docs/PLAN.md`](docs/PLAN.md) for the full product, UI, and technical plan.

## Stack
Expo (SDK 57) · React Native · TypeScript · expo-router · zustand · AsyncStorage
(all data stays on-device) · expo-location / expo-sensors · react-native-maps ·
expo-print. No accounts, no analytics, no AI.

## Run
```bash
npm install
npx expo start          # scan with Expo Go, or press w for web preview
npm test                # domain logic tests (night split, braking, curfew, gating…)
npm run typecheck
```

Optional: set `EXPO_PUBLIC_MAPBOX_TOKEN` for road-following overview routes. Without it,
lessons show a straight-line overview through the practice corridor.

## Before public release
- Verify every corridor in `src/content/corridors.ts` against the Mt. Juliet Safety
  Action Plan high-injury network maps (all are currently `verified: false`, approximate).
- Confirm the night definition and permit curfew in `src/content/rules.ts` against the
  current Tennessee Driver Handbook.
- Background (screen-off) location requires a development build with `expo-task-manager`;
  the MVP keeps the screen awake on the locked drive screen.

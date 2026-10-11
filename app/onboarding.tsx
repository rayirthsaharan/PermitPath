import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Badge, Button, Card, Chip, Screen } from '../src/components';
import { Field, CheckRow, FieldLabel } from '../src/components/drive/Field';
import { DateTimeField, toYmd } from '../src/components/drive/DateTimeField';
import { ChipRow } from '../src/components/drive/pickers';
import { RULES_DISCLAIMER, rules } from '../src/content/rules';
import { useStore } from '../src/data/store';
import type { LatLng, Supervisor } from '../src/domain/types';
import { useTheme } from '../src/theme/ThemeProvider';

const RELATIONSHIPS = ['Parent', 'Guardian', 'Other adult'] as const;
const PLEDGES = [
  'The screen locks while the car is moving. Only the passenger uses the app, and only when stopped.',
  'Suggested routes are practice ideas, not guarantees of safety. The supervising adult decides if roads and conditions are appropriate.',
  'Your drives and locations stay on this phone unless you choose to export them.',
];
const STEP_TITLES = ['Welcome', 'About you', 'Supervisors', 'Safety pledge'];

type DraftSupervisor = Omit<Supervisor, 'id'>;

function StepDots({ step }: { step: number }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <View
        accessible
        accessibilityLabel={`Step ${step + 1} of ${STEP_TITLES.length}: ${STEP_TITLES[step]}`}
        style={{ flexDirection: 'row', gap: spacing.sm }}
      >
        {STEP_TITLES.map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              backgroundColor: i <= step ? colors.primary : colors.surfaceAlt,
            }}
          />
        ))}
      </View>
      <Text style={[typography.caption, { color: colors.textMuted }]}>
        Step {step + 1} of {STEP_TITLES.length} · {STEP_TITLES[step]}
      </Text>
    </View>
  );
}

export default function Onboarding() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const saveProfile = useStore((s) => s.saveProfile);
  const addSupervisor = useStore((s) => s.addSupervisor);
  const updateSettings = useStore((s) => s.updateSettings);

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // profile
  const today = useMemo(() => new Date(), []);
  const [firstName, setFirstName] = useState('');
  const [permitDate, setPermitDate] = useState<Date | null>(null);
  const [home, setHome] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locNote, setLocNote] = useState<string | null>(null);
  const [triedProfile, setTriedProfile] = useState(false);

  // supervisors
  const [sups, setSups] = useState<DraftSupervisor[]>([]);
  const [supName, setSupName] = useState('');
  const [supRel, setSupRel] = useState<string>('Parent');
  const [supAttests, setSupAttests] = useState(false);

  // pledge
  const [pledges, setPledges] = useState<boolean[]>([false, false, false]);

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const profileErrors = {
    name: firstName.trim() ? null : 'Please enter a first name.',
    date: !permitDate
      ? 'Enter the date the permit was issued.'
      : permitDate.getTime() > startOfToday + 86399999
        ? 'The permit date can’t be in the future.'
        : permitDate.getFullYear() < 2000
          ? 'That date looks too far back.'
          : null,
  };
  const profileValid = !profileErrors.name && !profileErrors.date;
  const draftValid = supName.trim().length > 0 && supAttests;
  const canAdvance =
    step === 0 ? true : step === 1 ? profileValid : step === 2 ? sups.length > 0 || draftValid : pledges.every(Boolean);

  const addDraft = () => {
    if (!draftValid) return;
    setSups((cur) => [...cur, { name: supName.trim(), relationship: supRel, attests21Plus: true }]);
    setSupName('');
    setSupAttests(false);
  };

  const useLocation = async () => {
    setLocating(true);
    setLocNote(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setLocNote('Location permission was not granted. You can skip this; it’s optional.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setHome({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      setLocNote('We couldn’t get your location right now. You can skip this; it’s optional.');
    } finally {
      setLocating(false);
    }
  };

  const next = () => {
    if (step === 1) {
      setTriedProfile(true);
      if (!profileValid) return;
    }
    if (step === 2) {
      if (draftValid) addDraft();
      else if (sups.length === 0) return;
    }
    setStep((s) => Math.min(STEP_TITLES.length - 1, s + 1));
  };

  const finish = async () => {
    if (!permitDate || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const toSave = sups.length > 0 ? sups : [];
      for (const s of toSave) await addSupervisor(s);
      await updateSettings({ pledgeAcceptedAt: Date.now() });
      // Save the profile last: the root layout uses it to know onboarding is done.
      await saveProfile({
        firstName: firstName.trim(),
        permitIssueDate: toYmd(permitDate),
        homeLocation: home ?? undefined,
      });
      try {
        await Location.requestForegroundPermissionsAsync();
      } catch {
        /* don't block on location */
      }
      setDone(true);
    } catch {
      setSaveError('We couldn’t save your setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ---------- final screen ----------
  if (done) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', gap: spacing.lg, paddingTop: spacing.xxl }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: colors.success + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="checkmark" size={48} color={colors.success} />
          </View>
          <Text style={[typography.display, { color: colors.text, textAlign: 'center' }]}>You&apos;re all set</Text>
          <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
            A quick confidence survey now gives you a starting point to compare against when you reach 50 hours. It takes about a minute and it&apos;s optional.
          </Text>
        </View>
        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          <Button label="Take a 1-minute confidence survey" size="lg" onPress={() => router.replace('/survey/pre')} />
          <Button label="Skip for now" variant="ghost" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  const isLast = step === STEP_TITLES.length - 1;

  return (
    <Screen scroll={false}>
      <StepDots step={step} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.lg }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 ? (
          <>
            <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.lg }}>
              <View
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: colors.primary + '1F',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="car-sport" size={44} color={colors.primary} />
              </View>
              <Text accessibilityRole="header" style={[typography.display, { color: colors.text, textAlign: 'center' }]}>
                PermitPath WilCo
              </Text>
              <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
                Turn your {rules.requiredTotalHours} supervised hours into deliberate practice on the roads around Mt. Juliet and Wilson County.
              </Text>
            </View>
            <Card>
              <View style={{ gap: spacing.md }}>
                {[
                  { icon: 'location-outline', text: 'Log each drive by GPS, with night time detected for you.' },
                  { icon: 'map-outline', text: 'Follow a local, step-by-step practice plan with coaching cards for the parent.' },
                  { icon: 'document-text-outline', text: 'Print a clean log to go with the official certification form.' },
                ].map((row) => (
                  <View key={row.text} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                    <Ionicons name={row.icon as React.ComponentProps<typeof Ionicons>['name']} size={24} color={colors.primary} />
                    <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{row.text}</Text>
                  </View>
                ))}
              </View>
            </Card>
            <Card accent={colors.amber}>
              <Text style={[typography.body, { color: colors.text }]}>
                <Text style={{ fontWeight: '700' }}>An honest note: </Text>
                it helps you practice deliberately. It can&apos;t promise fewer crashes.
              </Text>
            </Card>
            <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>
              Setup takes about 90 seconds. {RULES_DISCLAIMER}
            </Text>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
              Tell us about the driver
            </Text>
            <Field
              label="First name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              placeholder="e.g. Maya"
              maxLength={40}
              error={triedProfile ? profileErrors.name : null}
            />
            <DateTimeField
              label="Permit issue date"
              mode="date"
              value={permitDate}
              onChange={setPermitDate}
              maximumDate={today}
              error={triedProfile ? profileErrors.date : null}
              hint="Used to count your permit days toward road-test eligibility."
            />
            <View style={{ gap: spacing.sm }}>
              <FieldLabel>Home area (optional)</FieldLabel>
              {home ? (
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <Ionicons name="home" size={22} color={colors.success} />
                    <Text style={[typography.body, { color: colors.text, flex: 1 }]}>Home area saved on this phone.</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Remove home area"
                      onPress={() => setHome(null)}
                      style={{ minHeight: 48, justifyContent: 'center' }}
                    >
                      <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>Remove</Text>
                    </Pressable>
                  </View>
                </Card>
              ) : (
                <Button
                  label="Use my current location as home"
                  icon="locate-outline"
                  variant="secondary"
                  loading={locating}
                  onPress={useLocation}
                />
              )}
              {locNote ? <Text style={[typography.caption, { color: colors.textMuted }]}>{locNote}</Text> : null}
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                Stored only on this phone. It&apos;s used as the starting point for suggested practice routes.
              </Text>
            </View>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
              Who will supervise?
            </Text>
            <Text style={[typography.body, { color: colors.textMuted }]}>
              Add at least one licensed driver age 21 or older. You can add more later in Settings.
            </Text>

            {sups.map((s, i) => (
              <Card key={`${s.name}-${i}`}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[typography.headline, { color: colors.text }]}>{s.name}</Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>{s.relationship} · 21+</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${s.name}`}
                    onPress={() => setSups((cur) => cur.filter((_, j) => j !== i))}
                    style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="close-circle-outline" size={24} color={colors.textMuted} />
                  </Pressable>
                </View>
              </Card>
            ))}

            <Card>
              <View style={{ gap: spacing.md }}>
                <Text style={[typography.headline, { color: colors.text }]}>
                  {sups.length === 0 ? 'Add a supervisor' : 'Add another'}
                </Text>
                <Field label="Name" value={supName} onChangeText={setSupName} autoCapitalize="words" placeholder="e.g. Jordan" maxLength={40} />
                <View style={{ gap: spacing.xs }}>
                  <FieldLabel>Relationship</FieldLabel>
                  <ChipRow>
                    {RELATIONSHIPS.map((r) => (
                      <Chip key={r} label={r} selected={supRel === r} onPress={() => setSupRel(r)} />
                    ))}
                  </ChipRow>
                </View>
                <CheckRow checked={supAttests} onToggle={() => setSupAttests((v) => !v)}>
                  I am a licensed driver age 21 or older
                </CheckRow>
                <Button
                  label="Add supervisor"
                  icon="add"
                  variant="secondary"
                  disabled={!draftValid}
                  onPress={addDraft}
                />
              </View>
            </Card>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
              Safety &amp; privacy pledge
            </Text>
            <Text style={[typography.body, { color: colors.textMuted }]}>
              Please read and agree to each statement to continue.
            </Text>
            {PLEDGES.map((p, i) => (
              <CheckRow
                key={i}
                checked={pledges[i]}
                onToggle={() => setPledges((cur) => cur.map((v, j) => (j === i ? !v : v)))}
              >
                {p}
              </CheckRow>
            ))}
            <Badge label="Next: we'll ask for location permission, only used during drives" icon="location-outline" />
            {saveError ? <Text style={[typography.body, { color: colors.danger }]}>{saveError}</Text> : null}
          </>
        ) : null}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        {step > 0 ? (
          <View style={{ flex: 1 }}>
            <Button label="Back" variant="secondary" onPress={() => setStep((s) => Math.max(0, s - 1))} disabled={saving} />
          </View>
        ) : null}
        <View style={{ flex: 2 }}>
          {isLast ? (
            <Button label="Finish setup" icon="checkmark" loading={saving} disabled={!canAdvance} onPress={finish} />
          ) : (
            <Button label={step === 0 ? "Let's go" : 'Next'} disabled={!canAdvance} onPress={next} />
          )}
        </View>
      </View>
    </Screen>
  );
}

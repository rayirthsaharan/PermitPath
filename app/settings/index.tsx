import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Badge, Button, Chip, Screen } from '../../src/components';
import { confirmAction, notify } from '../../src/components/settings/dialogs';
import { SettingsGroup, SettingsRow } from '../../src/components/settings/SettingsGroup';
import { SurveyComparison } from '../../src/components/settings/SurveyComparison';
import { TextField } from '../../src/components/settings/TextField';
import { RULES_DISCLAIMER } from '../../src/content/rules';
import { useStore } from '../../src/data/store';
import type { BrakeSensitivity, NightRule, SurveyKind, SurveyRespondent } from '../../src/domain/types';
import { exportAnonymousSummary, exportBackupJson } from '../../src/services/backup';
import { useTheme } from '../../src/theme/ThemeProvider';

const NIGHT_RULES: { value: NightRule; label: string; body: string }[] = [
  { value: 'sun', label: 'Sunset to sunrise', body: 'Night is counted from sunset to sunrise at the place you drove, worked out from the drive’s location and date.' },
  { value: 'fixed', label: 'Fixed 6 PM–6 AM', body: 'Night is always 6 PM to 6 AM local time, no matter the season.' },
];

const SENSITIVITY: { value: BrakeSensitivity; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function isValidYmd(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export default function Settings() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const supervisors = useStore((s) => s.supervisors);
  const settings = useStore((s) => s.settings);
  const surveys = useStore((s) => s.surveys);
  const saveProfile = useStore((s) => s.saveProfile);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetAll = useStore((s) => s.resetAll);

  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [permitDate, setPermitDate] = useState(profile?.permitIssueDate ?? '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [busy, setBusy] = useState<'backup' | 'summary' | null>(null);

  const dateError = permitDate.length > 0 && !isValidYmd(permitDate) ? 'Use the format YYYY-MM-DD, for example 2026-03-14.' : undefined;
  const profileDirty = !!profile && (firstName.trim() !== profile.firstName || permitDate.trim() !== profile.permitIssueDate);
  const canSaveProfile = profileDirty && firstName.trim().length > 0 && isValidYmd(permitDate);

  const onSaveProfile = async () => {
    if (!profile) return;
    await saveProfile({ ...profile, firstName: firstName.trim(), permitIssueDate: permitDate.trim() });
    setProfileSaved(true);
  };

  const runExport = async (kind: 'backup' | 'summary') => {
    setBusy(kind);
    try {
      if (kind === 'backup') await exportBackupJson();
      else await exportAnonymousSummary();
    } catch (e) {
      notify('Export failed', e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const onDeleteAll = () =>
    confirmAction({
      title: 'Delete all data?',
      message: 'This removes your profile, supervisors, drives, tracks, skill ratings, and surveys from this phone.',
      confirmLabel: 'Continue',
      destructive: true,
      onConfirm: () =>
        confirmAction({
          title: 'Are you absolutely sure?',
          message: 'This can’t be undone. Consider exporting a backup first.',
          confirmLabel: 'Delete everything',
          destructive: true,
          onConfirm: () => {
            void resetAll().then(() => router.replace('/onboarding'));
          },
        }),
    });

  const surveyStatus = (kind: SurveyKind, who: SurveyRespondent) => surveys.some((s) => s.kind === kind && s.respondent === who);
  const hasBoth = (who: SurveyRespondent) => surveyStatus('pre', who) && surveyStatus('post', who);

  const activeRule = NIGHT_RULES.find((r) => r.value === settings.nightRule) ?? NIGHT_RULES[0];
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <SettingsGroup title="Profile">
        <TextField label="First name" value={firstName} onChangeText={(t) => { setFirstName(t); setProfileSaved(false); }} autoCapitalize="words" />
        <TextField
          label="Permit issue date"
          value={permitDate}
          onChangeText={(t) => { setPermitDate(t); setProfileSaved(false); }}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          error={dateError}
          helper="Used for permit day count and the road-test countdown."
        />
        <Button
          label={profileSaved && !profileDirty ? 'Saved' : 'Save profile'}
          icon={profileSaved && !profileDirty ? 'checkmark' : undefined}
          disabled={!canSaveProfile}
          onPress={() => void onSaveProfile()}
        />
      </SettingsGroup>

      <SettingsGroup title="Supervisors">
        <SettingsRow
          icon="people-outline"
          title="Manage supervisors"
          value={`${supervisors.length}`}
          onPress={() => router.push('/settings/supervisors')}
        />
      </SettingsGroup>

      <SettingsGroup title="Night rule" footer={RULES_DISCLAIMER}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {NIGHT_RULES.map((r) => (
            <Chip key={r.value} label={r.label} selected={settings.nightRule === r.value} onPress={() => void updateSettings({ nightRule: r.value })} />
          ))}
        </View>
        <Text style={[typography.body, { color: colors.textMuted }]}>{activeRule.body}</Text>
      </SettingsGroup>

      <SettingsGroup
        title="Brake sensitivity"
        footer="Firm stops are shown as pins and a prompt to talk about it afterward, not as a score. Higher sensitivity flags gentler stops."
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {SENSITIVITY.map((s) => (
            <Chip key={s.value} label={s.label} selected={settings.brakeSensitivity === s.value} onPress={() => void updateSettings({ brakeSensitivity: s.value })} />
          ))}
        </View>
      </SettingsGroup>

      <SettingsGroup title="Confidence surveys" footer="Six quick questions for the teen and the parent. Take one before you start and one after about 50 hours.">
        {(['pre', 'post'] as SurveyKind[]).map((kind) => (
          <View key={kind} style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
              <Text style={[typography.headline, { color: colors.text }]}>{kind === 'pre' ? 'Before the program' : 'After the program'}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Badge label="Teen" tone={surveyStatus(kind, 'teen') ? 'success' : 'neutral'} icon={surveyStatus(kind, 'teen') ? 'checkmark' : undefined} />
                <Badge label="Parent" tone={surveyStatus(kind, 'parent') ? 'success' : 'neutral'} icon={surveyStatus(kind, 'parent') ? 'checkmark' : undefined} />
              </View>
            </View>
            <Button
              label={surveyStatus(kind, 'teen') || surveyStatus(kind, 'parent') ? `Retake ${kind} survey` : `Take ${kind} survey`}
              variant="secondary"
              size="sm"
              onPress={() => router.push({ pathname: '/survey/[kind]', params: { kind } })}
            />
          </View>
        ))}
        {hasBoth('teen') ? <SurveyComparison surveys={surveys} respondent="teen" /> : null}
        {hasBoth('parent') ? <SurveyComparison surveys={surveys} respondent="parent" /> : null}
      </SettingsGroup>

      <SettingsGroup title="Data">
        <Button
          label="Export backup (JSON)"
          icon="download-outline"
          variant="secondary"
          loading={busy === 'backup'}
          onPress={() => void runExport('backup')}
        />
        <View style={{ gap: spacing.sm }}>
          <Button
            label="Share anonymous summary"
            icon="share-outline"
            variant="secondary"
            loading={busy === 'summary'}
            onPress={() => void runExport('summary')}
          />
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            Optional and only sent if you share it. Includes total and night hours, number of drives, which lessons and stages were completed, and survey answers.
            Leaves out names, locations, notes, and exact dates.
          </Text>
        </View>
        <Button label="Delete all data" icon="trash-outline" variant="danger" onPress={onDeleteAll} />
      </SettingsGroup>

      <SettingsGroup title="Sources & disclaimers">
        <SettingsRow icon="document-text-outline" title="Sources & disclaimers" onPress={() => router.push('/sources')} />
      </SettingsGroup>

      <SettingsGroup title="About">
        <Text style={[typography.body, { color: colors.text }]}>
          PermitPath WilCo helps you practice deliberately. It can’t promise fewer crashes. Wilson County ranked 76th of 95 Tennessee counties for teen crashes in a
          2011–2015 Tennessee Department of Health snapshot, so the risk is real but not unusually high. This app is about deliberate practice.
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>Version {version} · Everything stays on this phone unless you export it.</Text>
      </SettingsGroup>
    </Screen>
  );
}

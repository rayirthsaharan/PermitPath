import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, LockOverlay } from '../../src/components';
import { DriveCoachPeek } from '../../src/components/drive/DriveCoachPeek';
import { getLesson } from '../../src/content/curriculum';
import { setPendingDrive } from '../../src/data/pendingDrive';
import { driveRecorder, useDriveRecorder } from '../../src/services/recorder';
import { darkColors, radius, spacing, typography } from '../../src/theme/tokens';

const METERS_PER_MILE = 1609.344;

function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

function NightBadge() {
  const c = darkColors;
  return (
    <View
      accessible
      accessibilityLabel="Night driving"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.chip,
        backgroundColor: c.night + '2E',
      }}
    >
      <Ionicons name="moon" size={16} color={c.night} />
      <Text style={{ color: c.night, fontSize: 13, fontWeight: '700', letterSpacing: 1 }}>NIGHT</Text>
    </View>
  );
}

/** Always dark, regardless of the app theme (principle 5). */
export default function ActiveDrive() {
  const c = darkColors;
  const router = useRouter();
  const rec = useDriveRecorder();
  const { width } = useWindowDimensions();
  const endingRef = useRef(false);
  const [ending, setEnding] = useState(false);

  const lesson = rec.lessonId ? getLesson(rec.lessonId) : undefined;
  const locked = rec.locked;

  // Deep link / app restart with nothing recording: go home.
  useEffect(() => {
    if (rec.status === 'idle' && !endingRef.current) router.replace('/');
  }, [rec.status, router]);

  // No accidental exit while recording.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const endDrive = async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    setEnding(true);
    const result = await driveRecorder.stop();
    if (!result) {
      router.replace('/');
      return;
    }
    // Drives under 2 minutes get a keep/discard prompt on the summary screen.
    setPendingDrive(result);
    router.replace('/drive/summary/pending');
  };

  const pageWidth = Math.max(240, width - spacing.xl * 2);
  const miles = rec.distanceM / METERS_PER_MILE;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.driveBg }}>
      <StatusBar style="light" />
      <View
        style={{ flex: 1 }}
        pointerEvents={locked ? 'none' : 'auto'}
        accessibilityElementsHidden={locked}
        importantForAccessibility={locked ? 'no-hide-descendants' : 'auto'}
      >
        <ScrollView
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl, alignItems: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', gap: spacing.sm, paddingTop: spacing.lg }}>
            <Text
              accessibilityRole="timer"
              accessibilityLabel={`Elapsed time ${formatClock(rec.elapsedSec)}`}
              style={[typography.hero, { color: c.text, fontVariant: ['tabular-nums'] }]}
            >
              {formatClock(rec.elapsedSec)}
            </Text>
            {rec.isNightNow ? <NightBadge /> : null}
            <Text style={[typography.caption, { color: c.textMuted }]}>
              {lesson ? lesson.title : 'Free drive'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' }}>
            <View style={{ flex: 1, backgroundColor: c.surface, borderRadius: radius.card, padding: spacing.md, gap: 2 }}>
              <Text style={[typography.caption, { color: c.textMuted }]}>Distance</Text>
              <Text style={[typography.title, { color: c.text }]}>{miles.toFixed(1)} mi</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: c.surface, borderRadius: radius.card, padding: spacing.md, gap: 2 }}>
              <Text style={[typography.caption, { color: c.textMuted }]}>Firm stops</Text>
              <Text style={[typography.title, { color: c.text }]}>{rec.hardBrakeCount}</Text>
            </View>
          </View>

          {lesson ? (
            <View style={{ alignSelf: 'stretch' }}>
              <DriveCoachPeek cards={lesson.coachingCards} width={pageWidth} />
            </View>
          ) : (
            <Text style={[typography.body, { color: c.textMuted, textAlign: 'center' }]}>
              Free drive. Coaching cards appear when a lesson is selected.
            </Text>
          )}
        </ScrollView>

        <View style={{ padding: spacing.xl, paddingTop: spacing.sm }}>
          <Button
            label="End drive"
            icon="stop-circle"
            variant="danger"
            size="lg"
            holdToConfirmMs={1000}
            disabled={ending}
            onPress={endDrive}
          />
          <Text style={[typography.caption, { color: c.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>
            Press and hold for 1 second
          </Text>
        </View>
      </View>

      {locked ? (
        <LockOverlay>
          <View style={{ alignItems: 'center', gap: spacing.lg }}>
            <Text
              accessibilityRole="timer"
              accessibilityLabel={`Elapsed time ${formatClock(rec.elapsedSec)}`}
              style={[typography.hero, { color: c.text, fontVariant: ['tabular-nums'] }]}
            >
              {formatClock(rec.elapsedSec)}
            </Text>
            {rec.isNightNow ? <NightBadge /> : null}
            <Text style={[typography.body, { color: c.textMuted, textAlign: 'center', marginTop: spacing.lg }]}>
              Eyes on the road. PermitPath is locked while the car is moving.
            </Text>
          </View>
        </LockOverlay>
      ) : null}
    </SafeAreaView>
  );
}

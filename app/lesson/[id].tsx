import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Badge, Button, Card, DisclaimerFooter, EmptyState, RouteMap, Screen, SectionHeader, StatTile } from '../../src/components';
import { CoachingCarousel } from '../../src/components/curriculum/CoachingCarousel';
import { RouteDisclaimerGate } from '../../src/components/curriculum/RouteDisclaimerGate';
import { getCorridor } from '../../src/content/corridors';
import { getLesson } from '../../src/content/curriculum';
import { useCompletedLessonIds } from '../../src/data/selectors';
import { useStore } from '../../src/data/store';
import { getLessonRoute, type LessonRoute } from '../../src/services/routing';
import { useTheme } from '../../src/theme/ThemeProvider';

const MAP_HEIGHT = 220;

export default function LessonDetail() {
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = id ? getLesson(String(id)) : undefined;
  const home = useStore((s) => s.profile?.homeLocation);
  const completed = useCompletedLessonIds();

  const [route, setRoute] = useState<LessonRoute | null>(null);
  const homeLat = home?.lat;
  const homeLng = home?.lng;

  useEffect(() => {
    if (!lesson) return;
    let cancelled = false;
    setRoute(null);
    const origin = homeLat !== undefined && homeLng !== undefined ? { lat: homeLat, lng: homeLng } : undefined;
    getLessonRoute(lesson, origin)
      .then((r) => {
        if (!cancelled) setRoute(r);
      })
      .catch(() => {
        if (!cancelled) setRoute({ coordinates: [], source: 'none', note: 'Pick a quiet street or empty lot near home.' });
      });
    return () => {
      cancelled = true;
    };
  }, [lesson, homeLat, homeLng]);

  if (!lesson) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <EmptyState icon="help-circle-outline" title="Lesson not found" actionLabel="Back to practice path" onAction={() => router.back()} />
      </Screen>
    );
  }

  const corridors = lesson.corridorIds.map((cid) => getCorridor(cid)).filter((c): c is NonNullable<typeof c> => !!c);
  const whyCards = lesson.coachingCards.filter((c) => c.kind === 'why');
  const carouselCards = lesson.coachingCards.filter((c) => c.kind !== 'why');
  const isDone = completed.includes(lesson.id);

  return (
    <Screen scroll={false} noPadding edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            <Badge label={`Stage ${lesson.stageId}`} tone="primary" />
            {lesson.isNight ? <Badge label="Night" tone="night" icon="moon" /> : null}
            {isDone ? <Badge label="Completed" tone="success" icon="checkmark" /> : null}
          </View>
          <Text accessibilityRole="header" style={[typography.display, { color: colors.text }]}>
            {lesson.title}
          </Text>
        </View>

        {/* Map */}
        {route === null ? (
          <View
            accessibilityLabel="Loading route"
            style={{
              height: MAP_HEIGHT,
              borderRadius: radius.card,
              backgroundColor: colors.surfaceAlt,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
            }}
          >
            <ActivityIndicator color={colors.primary} />
            <Text style={[typography.caption, { color: colors.textMuted }]}>Loading route…</Text>
          </View>
        ) : route.source === 'none' ? (
          <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <Ionicons name="location-outline" size={28} color={colors.primary} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[typography.headline, { color: colors.text }]}>Pick a quiet street or empty lot near home</Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                No fixed route for this lesson. Your supervisor chooses where to practice.
              </Text>
            </View>
          </Card>
        ) : (
          <RouteMap
            route={route.coordinates}
            height={MAP_HEIGHT}
            caption={route.source === 'mapbox' ? 'Overview route' : 'Overview only — follow road signs and your supervisor.'}
          />
        )}

        {corridors.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <SectionHeader title="Where" />
            {corridors.map((c) => (
              <Card key={c.id} style={{ gap: spacing.sm }}>
                <Text style={[typography.headline, { color: colors.text }]}>{c.name}</Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  <Badge label={c.kind === 'interchange' ? 'Interchange' : c.kind === 'roundabout' ? 'Roundabout' : 'Arterial'} />
                  {!c.verified ? <Badge label="Location pending verification" tone="amber" icon="alert-circle" /> : null}
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        {/* Goal + timing */}
        <Card style={{ gap: spacing.sm }}>
          <Text style={[typography.caption, { color: colors.textMuted, textTransform: 'uppercase' }]}>Goal</Text>
          <Text style={[typography.body, { color: colors.text }]}>{lesson.goal}</Text>
        </Card>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <StatTile icon="time-outline" label="Time" value={`${lesson.estimatedMinutes} min`} />
          <View style={{ flex: 2 }}>
            <StatTile icon="sunny-outline" label="Best times" value={lesson.bestTimes} />
          </View>
        </View>

        {/* Why this road */}
        {whyCards.length > 0 || corridors.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <SectionHeader title="Why this road" />
            {corridors.map((c) => (
              <Card key={`why-${c.id}`} accent={colors.night} style={{ gap: spacing.xs }}>
                <Text style={[typography.headline, { color: colors.text }]}>{c.name}</Text>
                <Text style={[typography.body, { color: colors.text }]}>{c.whyItMatters}</Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>Source: {c.source}</Text>
              </Card>
            ))}
            {whyCards.map((c, i) => (
              <Card key={`whycard-${i}`} accent={colors.night} style={{ gap: spacing.xs }}>
                <Text style={[typography.headline, { color: colors.text }]}>{c.title}</Text>
                <Text style={[typography.body, { color: colors.text }]}>{c.body}</Text>
              </Card>
            ))}
          </View>
        ) : null}

        {/* Coaching */}
        {carouselCards.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <SectionHeader title="Coaching cards" subtitle="Read these before the drive. Swipe for more." />
            <CoachingCarousel cards={carouselCards} />
          </View>
        ) : null}

        {/* Debrief */}
        {lesson.debriefPrompts.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <SectionHeader title="After the drive" subtitle="Talk it through together when you're parked." />
            <Card style={{ gap: spacing.md }}>
              {lesson.debriefPrompts.map((p, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Text style={[typography.body, { color: colors.primary, fontWeight: '700' }]}>{i + 1}.</Text>
                  <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{p}</Text>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        <DisclaimerFooter />
      </ScrollView>

      <View
        style={{
          padding: spacing.lg,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Button
          label="Start this lesson"
          icon="car"
          size="lg"
          onPress={() => router.push({ pathname: '/drive/start', params: { lessonId: lesson.id } })}
        />
      </View>
      <RouteDisclaimerGate />
    </Screen>
  );
}

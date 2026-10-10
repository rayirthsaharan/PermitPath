import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import type { Lesson } from '../domain/types';
import { Badge } from './Badge';
import { Card } from './Card';

export type LessonCardProps = {
  lesson: Lesson;
  completed?: boolean;
  locked?: boolean;
  /** Mark as the suggested next lesson. */
  isNext?: boolean;
  onPress?: () => void;
};

export function LessonCard({ lesson, completed, locked, isNext, onPress }: LessonCardProps) {
  const { colors, typography } = useTheme();
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${lesson.title}. ${lesson.estimatedMinutes} minutes.${completed ? ' Completed.' : ''}${locked ? ' Locked.' : ''}`}
      style={{ opacity: locked ? 0.6 : 1 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {isNext ? <Badge label="Next" tone="primary" /> : null}
            {lesson.isNight ? <Badge label="Night" tone="night" icon="moon" /> : null}
          </View>
          <Text style={[typography.headline, { color: colors.text }]}>{lesson.title}</Text>
          <Text numberOfLines={2} style={[typography.caption, { color: colors.textMuted }]}>
            {lesson.estimatedMinutes} min · best {lesson.bestTimes}
          </Text>
        </View>
        {completed ? (
          <Ionicons name="checkmark-circle" size={26} color={colors.success} />
        ) : locked ? (
          <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        )}
      </View>
    </Card>
  );
}

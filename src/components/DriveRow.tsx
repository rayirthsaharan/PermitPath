import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { formatLocalTime } from '../domain/logHtml';
import { formatDuration } from '../domain/progress';
import type { Drive } from '../domain/types';
import { getLesson } from '../content/curriculum';
import { Badge } from './Badge';
import { Card } from './Card';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type DriveRowProps = {
  drive: Drive;
  supervisorName?: string;
  onPress?: () => void;
};

export function DriveRow({ drive, supervisorName, onPress }: DriveRowProps) {
  const { colors, typography } = useTheme();
  const d = new Date(drive.startedAt);
  const date = `${DAYS[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
  const range = `${formatLocalTime(drive.startedAt)} – ${formatLocalTime(drive.endedAt)}`;
  const lesson = drive.lessonId ? getLesson(drive.lessonId) : undefined;
  const nightPart = drive.nightSec > 0 ? `${formatDuration(drive.nightSec)} night` : null;
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${date}, ${range}, ${formatDuration(drive.durationSec)}${nightPart ? `, ${nightPart}` : ''}${supervisorName ? `, with ${supervisorName}` : ''}`}
    >
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={[typography.headline, { color: colors.text }]}>{date}</Text>
          <Text style={[typography.headline, { color: colors.text }]}>{formatDuration(drive.durationSec)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>{range}</Text>
          {nightPart ? <Text style={[typography.caption, { color: colors.night }]}>{nightPart}</Text> : null}
        </View>
        {supervisorName ? <Text style={[typography.caption, { color: colors.textMuted }]}>With {supervisorName}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {drive.source === 'manual' ? <Badge label="Manual" /> : null}
          {lesson ? <Badge label={`Lesson ${lesson.stageId}`} tone="primary" /> : null}
          {drive.curfewWarning ? <Badge label="Curfew" tone="amber" icon="warning" /> : null}
          {drive.hardBrakes.length > 0 ? <Badge label={`${drive.hardBrakes.length} firm stop${drive.hardBrakes.length === 1 ? '' : 's'}`} tone="amber" /> : null}
        </View>
      </View>
    </Card>
  );
}

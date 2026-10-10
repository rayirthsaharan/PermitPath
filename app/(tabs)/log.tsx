import React, { useMemo, useState } from 'react';
import { SectionList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, DriveRow, EmptyState, Screen, StatTile } from '../../src/components';
import { TabTitle } from '../../src/components/curriculum/TabTitle';
import { notify } from '../../src/components/settings/dialogs';
import { useProgress } from '../../src/data/selectors';
import { useStore } from '../../src/data/store';
import { formatHours, permitDayNumber } from '../../src/domain/progress';
import type { Drive } from '../../src/domain/types';
import { exportLogPdf } from '../../src/services/exportLog';
import { useTheme } from '../../src/theme/ThemeProvider';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type Section = { key: string; title: string; data: Drive[] };

function groupByMonth(drives: Drive[]): Section[] {
  const out: Section[] = [];
  for (const d of drives) {
    const dt = new Date(d.startedAt);
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    const last = out[out.length - 1];
    if (last && last.key === key) last.data.push(d);
    else out.push({ key, title: `${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`, data: [d] });
  }
  return out;
}

export default function Log() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const drives = useStore((s) => s.drives);
  const supervisors = useStore((s) => s.supervisors);
  const permitDate = useStore((s) => s.profile?.permitIssueDate);
  const progress = useProgress();
  const [exporting, setExporting] = useState(false);

  const sections = useMemo(() => groupByMonth(drives), [drives]);
  const supName = useMemo(() => new Map(supervisors.map((s) => [s.id, s.name])), [supervisors]);
  const days = permitDate ? permitDayNumber(permitDate, progress.now) : 0;

  const onExport = async () => {
    setExporting(true);
    try {
      await exportLogPdf();
    } catch (e) {
      notify('Could not export the log', e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const header = (
    <View style={{ gap: spacing.lg, paddingBottom: spacing.md }}>
      <TabTitle title="Drive log" />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <StatTile icon="car-outline" label="Total" value={`${formatHours(progress.totalSec)} h`} />
        <StatTile icon="moon" label="Night" value={`${formatHours(progress.nightSec)} h`} color={colors.night} />
        <StatTile icon="calendar-outline" label="Days held" value={days > 0 ? String(days) : '—'} />
      </View>
      <View style={{ gap: spacing.sm }}>
        <Button
          label="Export PDF"
          icon="document-text-outline"
          loading={exporting}
          disabled={drives.length === 0}
          onPress={() => void onExport()}
        />
        <Button label="+ Add manual drive" variant="secondary" onPress={() => router.push('/drive/manual')} />
      </View>
    </View>
  );

  return (
    <Screen scroll={false} noPadding>
      <SectionList
        sections={sections}
        keyExtractor={(d) => d.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={header}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl * 2 }}
        ListEmptyComponent={
          <EmptyState
            icon="car-outline"
            title="No drives yet"
            body="Start a drive from the center button, or add a drive you took without the phone."
          />
        }
        renderSectionHeader={({ section }) => (
          <Text
            accessibilityRole="header"
            style={[typography.headline, { color: colors.textMuted, paddingTop: spacing.md, paddingBottom: spacing.sm }]}
          >
            {section.title}
          </Text>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <DriveRow
            drive={item}
            supervisorName={supName.get(item.supervisorId)}
            onPress={() => router.push({ pathname: '/log/[id]', params: { id: item.id } })}
          />
        )}
      />
    </Screen>
  );
}

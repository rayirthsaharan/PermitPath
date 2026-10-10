import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SKILLS, SKILL_CATEGORIES } from '../content/skills';
import { buildLogHtml } from '../domain/logHtml';
import { useStore } from '../data/store';

/** Build the printable log HTML from current store state (null when there is no profile). */
export function buildCurrentLogHtml(): string | null {
  const s = useStore.getState();
  if (!s.profile) return null;
  return buildLogHtml({
    profile: s.profile,
    supervisors: s.supervisors,
    drives: [...s.drives].sort((a, b) => a.startedAt - b.startedAt),
    skills: SKILLS,
    ratings: Object.values(s.skillRatings),
    categories: SKILL_CATEGORIES,
    generatedAt: Date.now(),
  });
}

/** Native: render a PDF and open the share sheet. Web: browser print dialog. */
export async function exportLogPdf(): Promise<void> {
  const html = buildCurrentLogHtml();
  if (!html) throw new Error('Set up a profile before exporting the log.');
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'PermitPath practice log',
  });
}

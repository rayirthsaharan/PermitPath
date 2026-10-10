import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { STAGES } from '../content/curriculum';
import { buildAnonymousSummary } from '../domain/summary';
import { getAllTracks } from '../data/storage';
import { useStore } from '../data/store';

async function shareJson(filename: string, json: string, dialogTitle: string): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle });
}

const stamp = () => new Date().toISOString().slice(0, 10);

/** Full on-device backup (profile, supervisors, drives with tracks, skills, surveys, settings). */
export async function exportBackupJson(): Promise<void> {
  const s = useStore.getState();
  const tracks = await getAllTracks(s.drives.map((d) => d.id));
  const payload = {
    app: 'permitpath-wilco',
    version: 1,
    exportedAt: Date.now(),
    profile: s.profile,
    supervisors: s.supervisors,
    drives: s.drives,
    tracks,
    skills: s.skillRatings,
    surveys: s.surveys,
    settings: s.settings,
    curriculum: { overriddenStageIds: s.overriddenStageIds },
  };
  await shareJson(`permitpath-backup-${stamp()}.json`, JSON.stringify(payload, null, 2), 'PermitPath backup');
}

/** Opt-in anonymous summary: no names, no locations. */
export async function exportAnonymousSummary(): Promise<void> {
  const s = useStore.getState();
  const summary = buildAnonymousSummary({ drives: s.drives, stages: STAGES, surveys: s.surveys, now: Date.now() });
  await shareJson(`permitpath-summary-${stamp()}.json`, JSON.stringify(summary, null, 2), 'PermitPath anonymous summary');
}

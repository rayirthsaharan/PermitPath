import type { Drive, TrackPoint } from '../domain/types';

/** An unsaved, just-finished drive awaiting the summary screen (route: /drive/summary/pending). */
export type PendingDrive = { drive: Drive; track: TrackPoint[] };

let pending: PendingDrive | null = null;

export const setPendingDrive = (p: PendingDrive): void => {
  pending = p;
};
export const getPendingDrive = (): PendingDrive | null => pending;
export const clearPendingDrive = (): void => {
  pending = null;
};

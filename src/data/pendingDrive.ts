import type { Drive, TrackPoint } from '../domain/types';

/** A just-finished drive, not yet saved; waits for the summary screen. */
export type PendingDrive = { drive: Drive; track: TrackPoint[] };

let pending: PendingDrive | null = null;

export const setPendingDrive = (p: PendingDrive): void => {
  pending = p;
};
export const getPendingDrive = (): PendingDrive | null => pending;
export const clearPendingDrive = (): void => {
  pending = null;
};

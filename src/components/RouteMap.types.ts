import type { LatLng } from '../domain/types';

export type MapPin = { lat: number; lng: number; color?: string; title?: string };

export type RouteMapProps = {
  route?: LatLng[];
  pins?: MapPin[];
  height?: number;
  /** Shown as caption under the map (e.g. route note). */
  caption?: string;
};

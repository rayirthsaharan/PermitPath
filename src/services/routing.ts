import { getCorridor } from '../content/corridors';
import type { LatLng, Lesson } from '../domain/types';
import { getItem, routeCacheKey, setItem, type RouteCacheEntry } from '../data/storage';

export type LessonRoute = {
  coordinates: LatLng[];
  source: 'mapbox' | 'overview' | 'none';
  note: string;
};

const OVERVIEW_NOTE = 'Overview only — follow road signs and your supervisor.';
const MAPBOX_NOTE = 'Suggested overview route. Follow road signs and your supervisor; you decide what is safe.';
const NONE_NOTE = 'Pick a quiet street or lot near home. Your supervisor chooses where to practice.';
const TIMEOUT_MS = 8000;

/** Waypoints for a lesson, in corridor order. */
export function lessonWaypoints(lesson: Lesson): LatLng[] {
  return lesson.corridorIds.flatMap((id) => getCorridor(id)?.waypoints ?? []);
}

function cacheId(lessonId: string, origin?: LatLng): string {
  const o = origin ? `${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}` : 'none';
  return `${lessonId}@${o}`;
}

function overviewRoute(waypoints: LatLng[], origin?: LatLng): LatLng[] {
  return origin ? [origin, ...waypoints, origin] : waypoints;
}

async function fetchMapbox(token: string, stops: LatLng[]): Promise<LatLng[] | null> {
  // Mapbox allows up to 25 coordinates per request.
  const limited = stops.length > 25 ? stops.filter((_, i) => i % Math.ceil(stops.length / 25) === 0).slice(0, 25) : stops;
  const coords = limited.map((p) => `${p.lng},${p.lat}`).join(';');
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
    `?geometries=geojson&overview=full&steps=false&access_token=${encodeURIComponent(token)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const json = (await res.json()) as { routes?: { geometry?: { coordinates?: [number, number][] } }[] };
    const line = json.routes?.[0]?.geometry?.coordinates;
    if (!line || line.length < 2) return null;
    return line.map(([lng, lat]) => ({ lat, lng }));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Overview route for a lesson. Never returns turn-by-turn instructions.
 * Mapbox (if EXPO_PUBLIC_MAPBOX_TOKEN is set) -> straight polyline fallback -> none.
 */
export async function getLessonRoute(lesson: Lesson, origin?: LatLng): Promise<LessonRoute> {
  const waypoints = lessonWaypoints(lesson);
  if (lesson.routeMode === 'nearby' || waypoints.length === 0) {
    return { coordinates: [], source: 'none', note: NONE_NOTE };
  }

  const id = cacheId(lesson.id, origin);
  const cached = await getItem<RouteCacheEntry>(routeCacheKey(id));
  if (cached && cached.coordinates.length > 1) {
    return {
      coordinates: cached.coordinates,
      source: cached.source,
      note: cached.source === 'mapbox' ? MAPBOX_NOTE : OVERVIEW_NOTE,
    };
  }

  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (token) {
    const coordinates = await fetchMapbox(token, overviewRoute(waypoints, origin));
    if (coordinates) {
      try {
        await setItem(routeCacheKey(id), { coordinates, source: 'mapbox', savedAt: Date.now() } satisfies RouteCacheEntry);
      } catch {
        /* cache is best effort */
      }
      return { coordinates, source: 'mapbox', note: MAPBOX_NOTE };
    }
  }

  // Straight-line fallbacks are cheap to rebuild, so they are not cached.
  return { coordinates: overviewRoute(waypoints, origin), source: 'overview', note: OVERVIEW_NOTE };
}

import type { NightRule } from './types';

// NOAA solar calculator (https://gml.noaa.gov/grad/solcalc/calcdetails.html).
// Longitude is positive EAST (Tennessee is about -86.5).

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const MS_PER_MIN = 60000;

/** Julian day number at 0h UTC of the given calendar date (month is 1-12). */
function julianDay(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
}

const julianCentury = (jd: number) => (jd - 2451545.0) / 36525.0;

function sunDeclinationDeg(t: number): number {
  const L0 = (280.46646 + t * (36000.76983 + 0.0003032 * t)) % 360;
  const M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const Mr = rad(M);
  const C =
    Math.sin(Mr) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * Mr) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * Mr) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * t;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(rad(omega));
  const seconds = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813));
  const e0 = 23 + (26 + seconds / 60) / 60;
  const epsilon = e0 + 0.00256 * Math.cos(rad(omega));
  return deg(Math.asin(Math.sin(rad(epsilon)) * Math.sin(rad(lambda))));
}

/** Equation of time in minutes. */
function equationOfTime(t: number): number {
  const eps0 = (() => {
    const seconds = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813));
    return 23 + (26 + seconds / 60) / 60;
  })();
  const omega = 125.04 - 1934.136 * t;
  const epsilon = rad(eps0 + 0.00256 * Math.cos(rad(omega)));
  const L0 = rad((280.46646 + t * (36000.76983 + 0.0003032 * t)) % 360);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const M = rad(357.52911 + t * (35999.05029 - 0.0001537 * t));
  let y = Math.tan(epsilon / 2);
  y *= y;
  const E =
    y * Math.sin(2 * L0) -
    2 * e * Math.sin(M) +
    4 * e * y * Math.sin(M) * Math.cos(2 * L0) -
    0.5 * y * y * Math.sin(4 * L0) -
    1.25 * e * e * Math.sin(2 * M);
  return 4 * deg(E);
}

/** Event time in minutes after 0:00 UTC that day (can be below 0 or above 1440). null if the sun never crosses the horizon. */
function eventMinutesUTC(rise: boolean, jd: number, lat: number, lng: number): number | null {
  const t = julianCentury(jd);
  const eq = equationOfTime(t);
  const dec = rad(sunDeclinationDeg(t));
  const latR = rad(lat);
  const cosH = Math.cos(rad(90.833)) / (Math.cos(latR) * Math.cos(dec)) - Math.tan(latR) * Math.tan(dec);
  if (cosH > 1 || cosH < -1 || Number.isNaN(cosH)) return null;
  let ha = Math.acos(cosH);
  if (!rise) ha = -ha;
  const delta = lng + deg(ha);
  return 720 - 4 * delta - eq;
}

export type SunTimes = {
  /** UTC ms, or null when the sun does not rise/set that day. */
  sunrise: number | null;
  sunset: number | null;
  /** Set only when sunrise/sunset are null: 'day' = midnight sun, 'night' = polar night. */
  polar: 'day' | 'night' | null;
};

/**
 * Sunrise/sunset for a date (year, month 1-12, day) at lat/lng, as UTC ms.
 * Near the poles it returns nulls plus `polar`.
 */
export function sunTimes(year: number, month: number, day: number, lat: number, lng: number): SunTimes {
  const jd0 = julianDay(year, month, day);
  const dayStart = Date.UTC(year, month - 1, day);
  const calc = (rise: boolean): number | null => {
    const first = eventMinutesUTC(rise, jd0, lat, lng);
    if (first === null) return null;
    // Second pass using the first estimate for a better result.
    const second = eventMinutesUTC(rise, jd0 + first / 1440, lat, lng);
    return second === null ? null : dayStart + second * MS_PER_MIN;
  };
  const sunrise = calc(true);
  const sunset = calc(false);
  if (sunrise !== null && sunset !== null) return { sunrise, sunset, polar: null };
  const dec = sunDeclinationDeg(julianCentury(jd0 + 0.5));
  const noonElevation = 90 - Math.abs(lat - dec);
  return { sunrise: null, sunset: null, polar: noonElevation > -0.833 ? 'day' : 'night' };
}

/** Calendar date (UTC fields) of the local solar day that contains t. */
function solarDay(tMs: number, lng: number): { y: number; m: number; d: number } {
  const shifted = new Date(tMs + (lng / 15) * 3600000);
  return { y: shifted.getUTCFullYear(), m: shifted.getUTCMonth() + 1, d: shifted.getUTCDate() };
}

/**
 * Is the moment `tMs` at (lat, lng) night?
 * - 'sun': before sunrise or after sunset of that local solar day (polar day: never night, polar night: always).
 * - 'fixed': local hour >= 18 or < 6 (the `fixed` hours default to 18/6).
 */
export function isNightAt(
  tMs: number,
  lat: number,
  lng: number,
  rule: NightRule,
  fixed: { startHour: number; endHour: number } = { startHour: 18, endHour: 6 },
): boolean {
  if (rule === 'fixed') {
    const h = new Date(tMs).getHours();
    return fixed.startHour > fixed.endHour
      ? h >= fixed.startHour || h < fixed.endHour
      : h >= fixed.startHour && h < fixed.endHour;
  }
  const { y, m, d } = solarDay(tMs, lng);
  const s = sunTimes(y, m, d, lat, lng);
  if (s.sunrise === null || s.sunset === null) return s.polar === 'night';
  return tMs < s.sunrise || tMs > s.sunset;
}

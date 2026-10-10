import { isNightAt, sunTimes } from './solar';

const NASH = { lat: 36.16, lng: -86.78 };
const minutes = (a: number, b: number) => Math.abs(a - b) / 60000;

describe('solar', () => {
  it('Nashville summer solstice sunset ~ 01:09 UTC next day (8:09 PM CDT)', () => {
    const s = sunTimes(2024, 6, 20, NASH.lat, NASH.lng);
    expect(minutes(s.sunset!, Date.UTC(2024, 5, 21, 1, 9))).toBeLessThan(3);
  });

  it('Nashville summer solstice sunrise ~ 10:30 UTC (5:30 AM CDT)', () => {
    const s = sunTimes(2024, 6, 20, NASH.lat, NASH.lng);
    expect(minutes(s.sunrise!, Date.UTC(2024, 5, 20, 10, 30))).toBeLessThan(4);
  });

  it('Nashville winter solstice sunset ~ 22:37 UTC (4:37 PM CST)', () => {
    const s = sunTimes(2024, 12, 21, NASH.lat, NASH.lng);
    expect(minutes(s.sunset!, Date.UTC(2024, 11, 21, 22, 37))).toBeLessThan(3);
  });

  it('isNightAt (sun rule) flips around sunset and sunrise', () => {
    const s = sunTimes(2024, 6, 20, NASH.lat, NASH.lng);
    expect(isNightAt(s.sunset! - 10 * 60000, NASH.lat, NASH.lng, 'sun')).toBe(false);
    expect(isNightAt(s.sunset! + 10 * 60000, NASH.lat, NASH.lng, 'sun')).toBe(true);
    expect(isNightAt(s.sunrise! - 10 * 60000, NASH.lat, NASH.lng, 'sun')).toBe(true);
    expect(isNightAt(s.sunrise! + 10 * 60000, NASH.lat, NASH.lng, 'sun')).toBe(false);
  });

  it('noon is day and local midnight is night (sun rule)', () => {
    // Solar noon in Nashville ~ 18:00 UTC; local solar midnight ~ 06:00 UTC.
    expect(isNightAt(Date.UTC(2024, 2, 15, 18, 0), NASH.lat, NASH.lng, 'sun')).toBe(false);
    expect(isNightAt(Date.UTC(2024, 2, 15, 6, 0), NASH.lat, NASH.lng, 'sun')).toBe(true);
  });

  it('fixed rule uses device-local hours 18:00-06:00', () => {
    const at = (h: number) => new Date(2024, 5, 20, h, 0, 0).getTime();
    expect(isNightAt(at(17), 0, 0, 'fixed')).toBe(false);
    expect(isNightAt(at(18), 0, 0, 'fixed')).toBe(true);
    expect(isNightAt(at(23), 0, 0, 'fixed')).toBe(true);
    expect(isNightAt(at(5), 0, 0, 'fixed')).toBe(true);
    expect(isNightAt(at(6), 0, 0, 'fixed')).toBe(false);
    expect(isNightAt(at(12), 0, 0, 'fixed')).toBe(false);
  });

  it('handles polar day and polar night gracefully', () => {
    const summer = sunTimes(2024, 6, 21, 80, 0);
    expect(summer.sunrise).toBeNull();
    expect(summer.polar).toBe('day');
    expect(isNightAt(Date.UTC(2024, 5, 21, 0, 0), 80, 0, 'sun')).toBe(false);
    const winter = sunTimes(2024, 12, 21, 80, 0);
    expect(winter.polar).toBe('night');
    expect(isNightAt(Date.UTC(2024, 11, 21, 12, 0), 80, 0, 'sun')).toBe(true);
  });
});

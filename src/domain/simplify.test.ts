import { simplifyTrack } from './simplify';
import type { TrackPoint } from './types';

const pt = (i: number, lat: number, lng: number): TrackPoint => ({ t: i * 1000, lat, lng, speed: 10 });

describe('simplifyTrack', () => {
  it('returns short tracks unchanged', () => {
    expect(simplifyTrack([])).toEqual([]);
    const two = [pt(0, 36, -86), pt(1, 36.001, -86)];
    expect(simplifyTrack(two)).toEqual(two);
  });

  it('collapses a straight line to its endpoints', () => {
    const line = Array.from({ length: 50 }, (_, i) => pt(i, 36 + i * 0.0001, -86));
    const out = simplifyTrack(line, 5);
    expect(out).toHaveLength(2);
    expect(out[0]).toBe(line[0]);
    expect(out[1]).toBe(line[49]);
  });

  it('keeps a corner that deviates more than the tolerance', () => {
    const pts = [pt(0, 36, -86), pt(1, 36.0005, -86), pt(2, 36.0005, -85.9995), pt(3, 36.0005, -85.999)];
    const out = simplifyTrack(pts, 5);
    expect(out).toContain(pts[1]);
    expect(out[0]).toBe(pts[0]);
    expect(out[out.length - 1]).toBe(pts[3]);
  });

  it('drops a small wiggle under tolerance but keeps one above', () => {
    // ~1.1 m lateral deviation (0.00001 deg lng ~ 0.9 m)
    const small = [pt(0, 36, -86), pt(1, 36.0005, -86.00001), pt(2, 36.001, -86)];
    expect(simplifyTrack(small, 5)).toHaveLength(2);
    // ~45 m lateral deviation
    const big = [pt(0, 36, -86), pt(1, 36.0005, -86.0005), pt(2, 36.001, -86)];
    expect(simplifyTrack(big, 5)).toHaveLength(3);
  });
});

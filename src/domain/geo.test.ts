import { boundingBox, derivedSpeed, distanceMeters, regionForPoints, trackDistance } from './geo';

describe('geo', () => {
  it('haversine: 1 degree of latitude is ~111.2 km', () => {
    const d = distanceMeters({ lat: 36, lng: -86 }, { lat: 37, lng: -86 });
    expect(d).toBeGreaterThan(111000);
    expect(d).toBeLessThan(111400);
  });

  it('is zero for identical points and symmetric', () => {
    const a = { lat: 36.2, lng: -86.5 };
    const b = { lat: 36.17, lng: -86.47 };
    expect(distanceMeters(a, a)).toBe(0);
    expect(distanceMeters(a, b)).toBeCloseTo(distanceMeters(b, a), 6);
  });

  it('trackDistance sums segments', () => {
    const pts = [
      { lat: 36, lng: -86 },
      { lat: 36.001, lng: -86 },
      { lat: 36.002, lng: -86 },
    ];
    expect(trackDistance(pts)).toBeCloseTo(distanceMeters(pts[0], pts[2]), 3);
    expect(trackDistance([])).toBe(0);
  });

  it('boundingBox and regionForPoints', () => {
    expect(boundingBox([])).toBeNull();
    expect(regionForPoints([])).toBeNull();
    const r = regionForPoints([
      { lat: 36.0, lng: -86.0 },
      { lat: 36.1, lng: -86.2 },
    ])!;
    expect(r.latitude).toBeCloseTo(36.05, 6);
    expect(r.longitude).toBeCloseTo(-86.1, 6);
    expect(r.latitudeDelta).toBeCloseTo(0.1 * 1.4, 6);
    expect(r.longitudeDelta).toBeCloseTo(0.2 * 1.4, 6);
  });

  it('region applies a minimum delta for a single point', () => {
    const r = regionForPoints([{ lat: 36, lng: -86 }])!;
    expect(r.latitudeDelta).toBeGreaterThanOrEqual(0.005);
  });

  it('derivedSpeed', () => {
    const a = { t: 0, lat: 36, lng: -86, speed: null };
    const b = { t: 10000, lat: 36.0009, lng: -86, speed: null }; // ~100 m
    expect(derivedSpeed(a, b)).toBeGreaterThan(9.5);
    expect(derivedSpeed(a, b)).toBeLessThan(10.5);
    expect(derivedSpeed(b, a)).toBe(0);
  });
});

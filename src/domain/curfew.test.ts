import { overlapsCurfew } from './curfew';

const C = { startHour: 22, endHour: 6 };
const at = (d: number, h: number, mi = 0) => new Date(2024, 5, d, h, mi, 0).getTime();

describe('overlapsCurfew', () => {
  it('daytime drive does not overlap', () => {
    expect(overlapsCurfew(at(10, 9), at(10, 10), C)).toBe(false);
    expect(overlapsCurfew(at(10, 17), at(10, 21, 59), C)).toBe(false);
  });

  it('drive ending exactly at 22:00 does not overlap; one minute later does', () => {
    expect(overlapsCurfew(at(10, 21), at(10, 22), C)).toBe(false);
    expect(overlapsCurfew(at(10, 21, 30), at(10, 22, 1), C)).toBe(true);
  });

  it('late evening drive overlaps', () => {
    expect(overlapsCurfew(at(10, 22, 15), at(10, 22, 45), C)).toBe(true);
  });

  it('early morning before 6 overlaps (window began previous evening)', () => {
    expect(overlapsCurfew(at(11, 4), at(11, 5), C)).toBe(true);
    expect(overlapsCurfew(at(11, 5, 30), at(11, 6, 30), C)).toBe(true);
    expect(overlapsCurfew(at(11, 6), at(11, 7), C)).toBe(false);
  });

  it('multi-day drive spanning a whole day crosses a curfew', () => {
    expect(overlapsCurfew(at(10, 8), at(12, 8), C)).toBe(true);
  });

  it('works with a same-day (non-wrapping) window', () => {
    const w = { startHour: 13, endHour: 15 };
    expect(overlapsCurfew(at(10, 9), at(10, 12), w)).toBe(false);
    expect(overlapsCurfew(at(10, 14), at(10, 16), w)).toBe(true);
  });

  it('zero-length span is a point in time', () => {
    expect(overlapsCurfew(at(10, 23), at(10, 23), C)).toBe(true);
    expect(overlapsCurfew(at(10, 12), at(10, 12), C)).toBe(false);
  });
});

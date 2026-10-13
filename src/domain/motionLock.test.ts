import { createMotionLock, initialLockState, nextLockState, tickLockState } from './motionLock';
import type { TrackPoint } from './types';

const p = (tSec: number, speed: number | null, lat = 36.2, lng = -86.5): TrackPoint => ({
  t: tSec * 1000,
  lat,
  lng,
  speed,
});

describe('motionLock', () => {
  it('starts unlocked and stays unlocked when slow', () => {
    let s = initialLockState();
    s = nextLockState(s, p(0, 0));
    s = nextLockState(s, p(2, 1.5));
    expect(s.locked).toBe(false);
  });

  it('locks at >= 2.2 m/s', () => {
    const s = nextLockState(initialLockState(), p(0, 2.2));
    expect(s.locked).toBe(true);
  });

  it('does not unlock until < 0.9 m/s for >= 5 s', () => {
    let s = nextLockState(initialLockState(), p(0, 10));
    s = nextLockState(s, p(2, 0.5));
    expect(s.locked).toBe(true);
    s = nextLockState(s, p(4, 0.5));
    expect(s.locked).toBe(true);
    s = nextLockState(s, p(6, 0.5));
    expect(s.locked).toBe(true); // 4 s slow
    s = nextLockState(s, p(7, 0.5));
    expect(s.locked).toBe(false); // 5 s slow
  });

  it('a burst of movement resets the slow timer', () => {
    let s = nextLockState(initialLockState(), p(0, 10));
    s = nextLockState(s, p(2, 0.2));
    s = nextLockState(s, p(5, 1.5)); // creeping, between thresholds
    s = nextLockState(s, p(8, 0.2)); // slow timer restarts here
    s = nextLockState(s, p(10, 0.2));
    expect(s.locked).toBe(true);
    s = nextLockState(s, p(13, 0.2));
    expect(s.locked).toBe(false);
  });

  it('derives speed from consecutive fixes when speed is null or negative', () => {
    let s = nextLockState(initialLockState(), p(0, null, 36.2, -86.5));
    expect(s.locked).toBe(false); // first fix has nothing to derive from
    // ~100 m in 5 s = 20 m/s
    s = nextLockState(s, p(5, -1, 36.2009, -86.5));
    expect(s.locked).toBe(true);
    expect(s.speed).toBeGreaterThan(15);
  });

  it('tick unlocks when no new fixes arrive', () => {
    let s = nextLockState(initialLockState(), p(0, 10));
    s = nextLockState(s, p(2, 0));
    expect(tickLockState(s, 4000).locked).toBe(true);
    expect(tickLockState(s, 7000).locked).toBe(false);
  });

  it('unlocks within 10 s when the phone stops sending fixes after slowing down', () => {
    // Real-drive bug: last fix while braking at 3 m/s, then the phone goes quiet.
    let s = nextLockState(initialLockState(), p(0, 12));
    s = nextLockState(s, p(2, 3));
    expect(tickLockState(s, 7000).locked).toBe(true); // 5 s of silence
    expect(tickLockState(s, 8000).locked).toBe(false); // 6 s of silence
  });

  it('does not unlock on GPS silence at speed (e.g. a tunnel)', () => {
    let s = nextLockState(initialLockState(), p(0, 25));
    s = nextLockState(s, p(1, 25));
    expect(tickLockState(s, 30000).locked).toBe(true);
  });

  it('treats small GPS drift as stopped when speed is unknown', () => {
    let s = nextLockState(initialLockState(), p(0, 10));
    // 2 m wobble per second with no reported speed
    s = nextLockState(s, p(1, null, 36.20002, -86.5));
    s = nextLockState(s, p(2, -1, 36.2, -86.5));
    expect(s.speed).toBe(0);
    s = nextLockState(s, p(6, null, 36.20002, -86.5));
    expect(s.locked).toBe(false); // slow for 5 s
  });

  it('createMotionLock wrapper works', () => {
    const lock = createMotionLock();
    expect(lock.push(p(0, 8))).toBe(true);
    lock.push(p(2, 0));
    expect(lock.tick(8000)).toBe(false);
    lock.reset();
    expect(lock.locked).toBe(false);
  });
});

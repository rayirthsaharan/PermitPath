import { createBrakeDetector } from './braking';
import type { BrakeSensitivity, HardBrakeEvent, MotionSample, TrackPoint } from './types';

type Scenario = {
  /** magnitude (m/s^2) of motion at time tSec */
  accel: (tSec: number) => number;
  /** GPS speed at time tSec (1 Hz fixes) */
  speed: (tSec: number) => number;
  durationSec: number;
};

function run(sc: Scenario, sensitivity: BrakeSensitivity = 'medium'): HardBrakeEvent[] {
  const det = createBrakeDetector(sensitivity);
  const out: HardBrakeEvent[] = [];
  const T0 = 1_700_000_000_000;
  // Merge a 20 Hz motion stream and a 1 Hz GPS stream in time order.
  type Item = { t: number; motion?: MotionSample; fix?: TrackPoint };
  const items: Item[] = [];
  for (let ms = 0; ms <= sc.durationSec * 1000; ms += 50) {
    const m = sc.accel(ms / 1000);
    items.push({ t: ms, motion: { t: T0 + ms, x: m, y: 0, z: 0 } });
  }
  for (let s = 0; s <= sc.durationSec; s++) {
    items.push({
      t: s * 1000 + 1, // GPS slightly after the motion sample of the same instant
      fix: { t: T0 + s * 1000, lat: 36.2 + s * 0.0001, lng: -86.5, speed: sc.speed(s) },
    });
  }
  items.sort((a, b) => a.t - b.t);
  for (const it of items) {
    if (it.motion) out.push(...det.pushMotion(it.motion));
    if (it.fix) out.push(...det.pushSpeed(it.fix));
  }
  out.push(...det.finish());
  return out;
}

const brakeSpike = (t0: number, len: number, mag: number) => (t: number) =>
  t >= t0 && t < t0 + len ? mag : 0.2;

describe('braking detector', () => {
  it('confirms a real hard brake (spike + speed drop)', () => {
    const events = run({
      durationSec: 15,
      accel: brakeSpike(5, 1.2, 5.5),
      speed: (t) => (t < 5 ? 15 : Math.max(2, 15 - (t - 5) * 4)),
    });
    expect(events).toHaveLength(1);
    expect(events[0].peakMs2).toBeGreaterThan(3.9);
    expect(events[0].lat).toBeGreaterThan(36.2);
  });

  it('rejects a phone fumble (spike but speed does not drop)', () => {
    const events = run({ durationSec: 15, accel: brakeSpike(5, 1, 6), speed: () => 15 });
    expect(events).toHaveLength(0);
  });

  it('rejects a low-speed spike (speed before < 4.5 m/s)', () => {
    const events = run({
      durationSec: 15,
      accel: brakeSpike(5, 1, 6),
      speed: (t) => (t < 5 ? 4 : 0.5),
    });
    expect(events).toHaveLength(0);
  });

  it('ignores spikes shorter than 300 ms', () => {
    const events = run({
      durationSec: 15,
      accel: brakeSpike(5, 0.1, 8),
      speed: (t) => (t < 5 ? 15 : Math.max(2, 15 - (t - 5) * 4)),
    });
    expect(events).toHaveLength(0);
  });

  it('ignores gentle deceleration below the threshold', () => {
    const events = run({
      durationSec: 15,
      accel: brakeSpike(5, 2, 2.5),
      speed: (t) => (t < 5 ? 15 : Math.max(2, 15 - (t - 5) * 3)),
    });
    expect(events).toHaveLength(0);
  });

  it('debounces events within 6 s and allows later ones', () => {
    const accel = (t: number) =>
      (t >= 5 && t < 6.2) || (t >= 8 && t < 9.2) || (t >= 16 && t < 17.2) ? 5.5 : 0.2;
    // Speed: 20 until 5, falls to 10 by 8, 20 again by 12, falls from 16.
    const speed = (t: number) => {
      if (t < 5) return 20;
      if (t < 8) return 20 - (t - 5) * 3.5;
      if (t < 12) return 10 + (t - 8) * 2.5;
      if (t < 16) return 20;
      return Math.max(3, 20 - (t - 16) * 5);
    };
    const events = run({ durationSec: 25, accel, speed });
    expect(events).toHaveLength(2);
    expect(events[1].t - events[0].t).toBeGreaterThanOrEqual(6000);
  });

  it('higher sensitivity catches a milder stop that medium misses', () => {
    const sc: Scenario = {
      durationSec: 15,
      accel: brakeSpike(5, 1.2, 3.5),
      speed: (t) => (t < 5 ? 15 : Math.max(2, 15 - (t - 5) * 4)),
    };
    expect(run(sc, 'medium')).toHaveLength(0);
    expect(run(sc, 'high')).toHaveLength(1);
    expect(run({ ...sc, accel: brakeSpike(5, 1.2, 4.4) }, 'low')).toHaveLength(0);
  });

  it('is orientation-agnostic (works on any axis)', () => {
    const det = createBrakeDetector('medium');
    const T0 = 0;
    const out: HardBrakeEvent[] = [];
    for (let ms = 0; ms <= 12000; ms += 50) {
      const spike = ms >= 4000 && ms < 5200;
      out.push(...det.pushMotion({ t: T0 + ms, x: 0, y: spike ? -3 : 0, z: spike ? 4 : 0 }));
      if (ms % 1000 === 0) {
        const s = ms / 1000;
        out.push(
          ...det.pushSpeed({ t: T0 + ms, lat: 36, lng: -86, speed: s < 4 ? 14 : Math.max(2, 14 - (s - 4) * 4) }),
        );
      }
    }
    out.push(...det.finish());
    expect(out).toHaveLength(1);
  });
});

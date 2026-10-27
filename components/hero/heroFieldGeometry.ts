/**
 * heroFieldGeometry
 * -----------------
 * Deterministic, asset-free point-cloud generator for the "Odaa Field" hero.
 *
 * The Odaa (sycamore fig) is drawn procedurally — flared trunk, root buttresses,
 * a recursive branch system and a flat-topped umbrella canopy — and every vertex
 * is emitted as a single particle. No images are sampled, no DOM is touched and
 * the seeded PRNG guarantees the same tree on every build, so the hero looks
 * identical across reloads and machines.
 *
 * Output is a set of `Float32Array`s that map 1:1 onto BufferGeometry
 * attributes consumed by `OdaaField.tsx`.
 *
 *   tone 0 = bark   (trunk, roots, branches)
 *   tone 1 = canopy (leaf mass)
 *   tone 2 = ground (Caffee circle, assembly stones)
 *   tone 3 = spark  (ceremonial bands, drifting highlights)
 */

export type Vec3 = [number, number, number];

export interface OdaaFieldGeometry {
  count: number;
  /** home position, xyz */
  position: Float32Array;
  /** per-point scatter direction + jitter, xyz */
  aRandom: Float32Array;
  /** relative sprite size */
  aSize: Float32Array;
  /** stable 0..1 per-point seed (phase, colour pick, density culling) */
  aSeed: Float32Array;
  /** 0 bark · 1 canopy · 2 ground · 3 spark */
  aTone: Float32Array;
}

export interface OdaaFieldOptions {
  /** global point multiplier — 1 desktop, ~0.45 small phones */
  density?: number;
  /** PRNG seed */
  seed?: number;
}

const TAU = Math.PI * 2;

/** mulberry32 — tiny, fast, deterministic */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TRUNK_BASE_Y = -1.52;
const TRUNK_TOP_Y = 0.62;
const GROUND_Y = -1.63;

/** Trunk spine: 0 = ground, 1 = crown. Slight lean + organic S-curve. */
function spine(t: number): Vec3 {
  return [
    Math.sin(t * 1.7) * 0.1 + t * t * 0.14,
    TRUNK_BASE_Y + t * (TRUNK_TOP_Y - TRUNK_BASE_Y),
    Math.cos(t * 1.2) * 0.07,
  ];
}

/** Flared taper — heavy buttress at the ground, slender under the crown. */
function spineRadius(t: number): number {
  return 0.042 + 0.115 * Math.pow(1 - t, 1.35) + 0.17 * Math.pow(1 - t, 5.5);
}

export function createOdaaField(options: OdaaFieldOptions = {}): OdaaFieldGeometry {
  const density = Math.max(0.1, options.density ?? 1);
  const rand = mulberry32(options.seed ?? 0x6d2b79f5);

  const pos: number[] = [];
  const rnd: number[] = [];
  const size: number[] = [];
  const seed: number[] = [];
  const tone: number[] = [];

  const push = (x: number, y: number, z: number, toneIdx: number, s: number) => {
    pos.push(x, y, z);
    // scatter direction: outward from the axis, biased upward, random length
    const a = rand() * TAU;
    const u = rand() * 2 - 1;
    const s2 = Math.sqrt(Math.max(0, 1 - u * u));
    const mag = 0.45 + rand() * 0.95;
    rnd.push(Math.cos(a) * s2 * mag, u * mag * 0.85, Math.sin(a) * s2 * mag * 0.8);
    size.push(s);
    seed.push(rand());
    tone.push(toneIdx);
  };

  /* ---------------------------------------------------------------- trunk */
  const trunkPoints = Math.round(1500 * density);
  for (let i = 0; i < trunkPoints; i++) {
    const t = Math.pow(rand(), 0.72); // weight the heavy lower half
    const [cx, cy, cz] = spine(t);
    const r = spineRadius(t) * Math.pow(rand(), 0.5);
    const a = rand() * TAU;
    push(
      cx + Math.cos(a) * r,
      cy + (rand() - 0.5) * 0.025,
      cz + Math.sin(a) * r,
      0,
      0.85 + rand() * 0.5
    );
  }

  /* ---------------------------------------------------------------- roots */
  const ROOTS = 7;
  for (let i = 0; i < ROOTS; i++) {
    const az = (i / ROOTS) * TAU + 0.3;
    const n = Math.round(120 * density);
    for (let k = 0; k < n; k++) {
      const u = rand();
      const r = 0.05 + u * 0.62;
      const droop = -Math.pow(u, 1.6) * 0.15;
      push(
        Math.cos(az) * r,
        TRUNK_BASE_Y + droop + (rand() - 0.5) * 0.06,
        Math.sin(az) * r * 0.85,
        0,
        0.7 + rand() * 0.4
      );
    }
  }

  /* ------------------------------------------------------------- branches */
  /** sample a tapered tube around a quadratic bezier a → c → b */
  const tube = (a: Vec3, c: Vec3, b: Vec3, radius: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const t = rand();
      const it = 1 - t;
      const px = it * it * a[0] + 2 * it * t * c[0] + t * t * b[0];
      const py = it * it * a[1] + 2 * it * t * c[1] + t * t * b[1];
      const pz = it * it * a[2] + 2 * it * t * c[2] + t * t * b[2];
      const r = radius * (1 - t * 0.72) * Math.pow(rand(), 0.6);
      const ang = rand() * TAU;
      push(
        px + Math.cos(ang) * r,
        py + Math.sin(ang) * r * 0.9,
        pz + Math.sin(ang) * r,
        0,
        0.55 + rand() * 0.45
      );
    }
  };

  const tips: Vec3[] = [];
  const PRIMARIES = 9;
  for (let i = 0; i < PRIMARIES; i++) {
    const az = (i / PRIMARIES) * TAU + 0.22 + rand() * 0.16;
    const t = 0.45 + (i % 3) * 0.16 + rand() * 0.08;
    const base = spine(t);
    const reach = 1.15 + rand() * 0.55;
    const end: Vec3 = [
      Math.cos(az) * reach,
      1.42 + rand() * 0.5 + (i % 2) * 0.1,
      Math.sin(az) * reach * 0.8,
    ];
    const ctrl: Vec3 = [
      base[0] + Math.cos(az) * reach * 0.42,
      base[1] + 0.62 + rand() * 0.22,
      base[2] + Math.sin(az) * reach * 0.34,
    ];
    tube(base, ctrl, end, 0.055 + rand() * 0.02, Math.round(240 * density));
    tips.push(end);
  }

  /* ------------------------------------------------- canopy lobe scaffold */
  const lobes: { c: Vec3; r: Vec3 }[] = [];
  for (let i = 0; i < tips.length; i++) {
    const tip = tips[i];
    for (let k = 0; k < 3; k++) {
      const az = Math.atan2(tip[2], tip[0]) + (k - 1) * 0.55 + (rand() - 0.5) * 0.25;
      const reach = 0.72 + rand() * 0.42;
      const end: Vec3 = [
        tip[0] + Math.cos(az) * reach,
        tip[1] + 0.16 + rand() * 0.3,
        tip[2] + Math.sin(az) * reach * 0.85,
      ];
      const ctrl: Vec3 = [
        tip[0] + Math.cos(az) * reach * 0.35,
        tip[1] + 0.16,
        tip[2] + Math.sin(az) * reach * 0.3,
      ];
      tube(tip, ctrl, end, 0.03 + rand() * 0.012, Math.round(90 * density));
      lobes.push({
        c: end,
        r: [0.52 + rand() * 0.3, 0.3 + rand() * 0.16, 0.5 + rand() * 0.28],
      });
    }
    lobes.push({
      c: [tip[0], tip[1] + 0.3, tip[2]],
      r: [0.7 + rand() * 0.3, 0.4 + rand() * 0.2, 0.66 + rand() * 0.3],
    });
  }

  /* --------------------------------------------------------------- canopy */
  /** volumetric blob with a cheap sine-noise carve-out so it reads as foliage */
  const fillBlob = (c: Vec3, r: Vec3, count: number, carve: number) => {
    for (let i = 0; i < count; i++) {
      const u = rand() * 2 - 1;
      const phi = rand() * TAU;
      const rr = Math.cbrt(rand());
      const ring = Math.sqrt(Math.max(0, 1 - u * u));
      const x = Math.cos(phi) * ring * rr;
      const z = Math.sin(phi) * ring * rr;
      const y = u * rr;

      const n = Math.sin(x * 9.1 + y * 6.3 + c[0]) * Math.cos(z * 8.7 - x * 4.1 + c[2]);
      if (n > carve && rand() < 0.78) continue;

      push(c[0] + x * r[0], c[1] + y * r[1], c[2] + z * r[2], 1, 0.75 + rand() * 0.55);
    }
  };

  const canopyTotal = Math.round(6200 * density);
  const perLobe = Math.max(1, Math.round(canopyTotal / lobes.length));
  for (const lobe of lobes) {
    fillBlob(lobe.c, lobe.r, perLobe, 0.62);
  }

  // the umbrella: the wide, flat crown that gives the Odaa its silhouette
  fillBlob([0, 1.98, 0], [1.78, 0.44, 1.52], Math.round(1100 * density), 0.72);
  fillBlob([0, 2.24, 0], [1.15, 0.3, 1.02], Math.round(600 * density), 0.68);

  /* --------------------------------------------------------------- ground */
  const ringPoints = Math.round(700 * density);
  const RING_R = 1.42;
  for (let i = 0; i < ringPoints; i++) {
    const a = rand() * TAU;
    const rr = RING_R + (rand() - 0.5) * 0.07;
    push(
      Math.cos(a) * rr,
      GROUND_Y + (rand() - 0.5) * 0.025,
      Math.sin(a) * rr,
      2,
      0.7 + rand() * 0.6
    );
  }

  // twelve assembly stones (the Caffee seating circle)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const cx = Math.cos(a) * RING_R;
    const cz = Math.sin(a) * RING_R;
    const n = Math.round(42 * density);
    for (let k = 0; k < n; k++) {
      const rr = 0.03 + Math.pow(rand(), 2) * 0.1;
      const u = rand() * TAU;
      const v = Math.sqrt(rand());
      push(
        cx + Math.cos(u) * rr * v,
        GROUND_Y + rr * (1 - v) * 0.6,
        cz + Math.sin(u) * rr * v,
        2,
        1.1 + rand() * 0.6
      );
    }
  }

  /* --------------------------------------------------------------- sparks */
  // ceremonial ochre bands around the trunk
  for (const t of [0.26, 0.48, 0.7]) {
    const [cx, cy, cz] = spine(t);
    const r = spineRadius(t) + 0.018;
    const n = Math.round(180 * density);
    for (let i = 0; i < n; i++) {
      const a = rand() * TAU;
      push(
        cx + Math.cos(a) * r,
        cy + (rand() - 0.5) * 0.014,
        cz + Math.sin(a) * r,
        3,
        0.8 + rand() * 0.8
      );
    }
  }

  // drifting highlights along the canopy rim
  const sparks = Math.round(130 * density);
  for (let i = 0; i < sparks; i++) {
    const a = rand() * TAU;
    const rr = 0.9 + rand() * 1.25;
    push(
      Math.cos(a) * rr,
      1.56 + rand() * 0.55,
      Math.sin(a) * rr * 0.9,
      3,
      2 + rand() * 1.6
    );
  }

  return {
    count: pos.length / 3,
    position: new Float32Array(pos),
    aRandom: new Float32Array(rnd),
    aSize: new Float32Array(size),
    aSeed: new Float32Array(seed),
    aTone: new Float32Array(tone),
  };
}

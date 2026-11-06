import { random } from "remotion";

/**
 * The stylised Lekki road network, drawn by hand for this film (no tiles, no provider data).
 * World units = app points at zoom 1. Shared by the in-app day map (AppMap) and the S10 night map,
 * so both show the same place: a lagoon along the top with a creek running south, a curved
 * expressway bridging the creek, curved arterials, a roundabout, and street districts set at
 * different angles. Roads never run through water (except the expressway bridge).
 */

export type Pt = { x: number; y: number };
export type RoadClass = "minor" | "arterial" | "expressway";
export type Road = { pts: Pt[]; cls: RoadClass };

export const PICKUP: Pt = { x: 138, y: 372 };
export const DROP: Pt = { x: 296, y: 296 };
/** The route runs along district streets (x=138, y=330, x=242, y=296). */
export const ROUTE = "M138 372 L138 330 L242 330 L242 296 L296 296";

const X0 = -760;
const X1 = 1060;
const Y1 = 1060;

/* ------------------------------------------------------------------ water */

export const shoreY = (x: number) => 150 + 26 * Math.sin(x / 140 + 0.6) + 12 * Math.sin(x / 53 + 1.7) + (x > 420 && x < 760 ? -18 * Math.sin(((x - 420) / 340) * Math.PI) : 0);

const sample = (fn: (t: number) => Pt, n: number) => Array.from({ length: n + 1 }, (_, i) => fn(i / n));

/** Lagoon: everything north of the shoreline. */
export const LAGOON: Pt[] = [...sample((t) => ({ x: X0 + (X1 - X0) * t, y: shoreY(X0 + (X1 - X0) * t) }), 120), { x: X1, y: -600 }, { x: X0, y: -600 }];

/** A creek leaving the lagoon and winding south (the expressway bridges it). */
const creekX = (y: number) => 590 + 34 * Math.sin(y / 70) + (y - 150) * 0.12;
const creekW = (y: number) => 26 - Math.min(14, (y - 150) * 0.02);
export const CREEK: Pt[] = [
  ...sample((t) => {
    const y = 120 + t * 640;
    return { x: creekX(y) - creekW(y), y };
  }, 60),
  ...sample((t) => {
    const y = 760 - t * 640;
    return { x: creekX(y) + creekW(y), y };
  }, 60),
];

const inPoly = (p: Pt, poly: Pt[]) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
};
export const inWater = (p: Pt) => p.y < shoreY(p.x) + 6 || inPoly(p, CREEK);

/* ------------------------------------------------------------------ helpers */

const catmull = (ctrl: Pt[], per = 14): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)];
    const p1 = ctrl[i];
    const p2 = ctrl[i + 1];
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
};

const line = (a: Pt, b: Pt, n = 12): Pt[] => sample((t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }), n);

/** Split a polyline wherever it enters water (densely sampled), dropping the wet parts. */
const dry = (pts: Pt[]): Pt[][] => {
  const dense: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 6));
    for (let k = 0; k < n; k++) dense.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
  }
  dense.push(pts[pts.length - 1]);
  const out: Pt[][] = [];
  let cur: Pt[] = [];
  for (const p of dense) {
    if (inWater(p)) {
      if (cur.length > 2) out.push(cur);
      cur = [];
    } else cur.push(p);
  }
  if (cur.length > 2) out.push(cur);
  // thin the dense points back down (keep every 3rd + ends) so paths stay light
  return out.map((s) => s.filter((_, i) => i % 3 === 0 || i === s.length - 1));
};

/** A rotated street grid: lines spaced `gap` apart inside a w×h box centred on c, rotated by deg. */
const district = (seed: string, c: Pt, w: number, h: number, deg: number, gap: number, skip = 0.12): Pt[][] => {
  const r = (deg * Math.PI) / 180;
  const rot = (u: number, v: number): Pt => ({ x: c.x + u * Math.cos(r) - v * Math.sin(r), y: c.y + u * Math.sin(r) + v * Math.cos(r) });
  const out: Pt[][] = [];
  for (let u = -w / 2; u <= w / 2 + 0.1; u += gap) {
    if (random(`${seed}u${u}`) < skip) continue;
    const v0 = -h / 2 + (random(`${seed}u0${u}`) < 0.3 ? gap * Math.floor(random(`${seed}u1${u}`) * 3) : 0);
    const v1 = h / 2 - (random(`${seed}u2${u}`) < 0.3 ? gap * Math.floor(random(`${seed}u3${u}`) * 3) : 0);
    out.push(line(rot(u, v0), rot(u, v1)));
  }
  for (let v = -h / 2; v <= h / 2 + 0.1; v += gap * 0.86) {
    if (random(`${seed}v${v}`) < skip) continue;
    const u0 = -w / 2 + (random(`${seed}v0${v}`) < 0.3 ? gap * Math.floor(random(`${seed}v1${v}`) * 3) : 0);
    const u1 = w / 2 - (random(`${seed}v2${v}`) < 0.3 ? gap * Math.floor(random(`${seed}v3${v}`) * 3) : 0);
    out.push(line(rot(u0, v), rot(u1, v)));
  }
  return out;
};

/* ------------------------------------------------------------------ the network */

export const EXPRESSWAY: Pt[] = catmull([
  { x: X0, y: 318 },
  { x: -380, y: 286 },
  { x: -60, y: 268 },
  { x: 230, y: 262 },
  { x: 520, y: 246 },
  { x: 760, y: 222 },
  { x: X1, y: 200 },
]);

const ARTERIALS: Pt[][] = [
  // coastal road, gently curving under the district
  catmull([{ x: X0, y: 560 }, { x: -420, y: 520 }, { x: -120, y: 476 }, { x: 138, y: 470 }, { x: 420, y: 486 }, { x: 760, y: 452 }, { x: X1, y: 470 }]),
  // the district's long north–south avenue (the route starts on it)
  catmull([{ x: 138, y: 160 }, { x: 138, y: 330 }, { x: 138, y: 470 }, { x: 150, y: 700 }, { x: 196, y: Y1 }]),
  // a diagonal feeder from the south-west to the expressway
  catmull([{ x: -360, y: Y1 }, { x: -250, y: 760 }, { x: -110, y: 520 }, { x: -20, y: 268 }]),
  // an eastern road following the creek
  catmull([{ x: 700, y: Y1 }, { x: 680, y: 760 }, { x: 650, y: 520 }, { x: 560, y: 262 }]),
  // a southern loop
  catmull([{ x: -200, y: 840 }, { x: 140, y: 800 }, { x: 420, y: 830 }, { x: 700, y: 790 }]),
];

/** District A (around the route) is axis-aligned so the route reads as streets. */
const DISTRICT_A: Pt[][] = [
  ...[40, 92, 190, 242, 296, 350, 404].map((x, i) => line({ x: x + (i % 3) * 2, y: 186 + (i % 2) * 20 }, { x: x - (i % 2) * 3, y: 448 - (i % 3) * 18 })),
  ...[200, 242, 296, 330, 372, 418].map((y, i) => line({ x: -24 + (i % 2) * 40, y }, { x: 452 - (i % 3) * 30, y: y + (i % 2) * 2 })),
];

export const ROUNDABOUT: { c: Pt; r: number } = { c: { x: 138, y: 470 }, r: 16 };

export const ROADS: Road[] = (() => {
  const out: Road[] = [];
  const add = (pts: Pt[][], cls: RoadClass) => pts.forEach((p) => dry(p).forEach((s) => out.push({ pts: s, cls })));
  add(district("west", { x: -380, y: 560 }, 520, 420, 18, 54), "minor");
  add(district("east", { x: 820, y: 600 }, 440, 440, -12, 50), "minor");
  add(district("south", { x: 260, y: 860 }, 900, 300, 5, 58), "minor");
  add(district("north", { x: -260, y: 220 }, 520, 120, -6, 46, 0.25), "minor");
  add(DISTRICT_A, "minor");
  add(ARTERIALS, "arterial");
  out.push({ pts: EXPRESSWAY, cls: "expressway" }); // bridges the creek
  return out;
})();

export const PARKS: Pt[][] = [
  [{ x: 300, y: 340 }, { x: 346, y: 342 }, { x: 344, y: 368 }, { x: 298, y: 366 }],
  [{ x: 0, y: 252 }, { x: 36, y: 254 }, { x: 34, y: 290 }, { x: -2, y: 288 }],
  [{ x: 196, y: 376 }, { x: 236, y: 378 }, { x: 234, y: 414 }, { x: 194, y: 412 }],
  [{ x: 480, y: 560 }, { x: 560, y: 566 }, { x: 552, y: 640 }, { x: 474, y: 632 }],
];

export const toPath = (pts: Pt[]) => `M${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L")}`;
export const toPoly = (pts: Pt[]) => `${toPath(pts)} Z`;

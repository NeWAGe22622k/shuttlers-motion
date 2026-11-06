import React from "react";
import { interpolate, spring } from "remotion";
import { EASE, SPRING } from "../config/brand";

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Clamped tween a→b (frames), no overshoot by construction. */
export const tw = (f: number, a: number, b: number, from = 0, to = 1, easing: (t: number) => number = EASE.expoOut) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

/** Overshoot-clamped spring from frame `at`. */
export const sp = (f: number, at: number, cfg: { damping: number; stiffness: number; overshootClamping: true } = SPRING.snap) =>
  f <= at ? 0 : spring({ frame: f - at, fps: 30, config: { mass: 1, ...cfg } });

/** Pressed element: 1 → 0.96 for 4f, then back (expoOut, no overshoot). */
export const press = (f: number, at: number) => {
  if (f < at) return 1;
  if (f < at + 4) return mix(1, 0.96, tw(f, at, at + 1.5));
  return mix(0.96, 1, tw(f, at + 4, at + 10));
};

/** Hex → rgb() mix (instant colour changes and step-backs, never opacity). */
export const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const m = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * clamp(t));
  return `rgb(${m(16)},${m(8)},${m(0)})`;
};

/** Rounded-rect path (for evolvePath outlines and clip-path: path()). Starts top-centre, clockwise. */
export const rrectPath = (x: number, y: number, w: number, h: number, r: number) => {
  const cx = x + w / 2;
  return [
    `M${cx} ${y}`,
    `L${x + w - r} ${y}`,
    `A${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `L${x + w} ${y + h - r}`,
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `L${x + r} ${y + h}`,
    `A${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `L${x} ${y + r}`,
    `A${r} ${r} 0 0 1 ${x + r} ${y}`,
    "Z",
  ].join(" ");
};

/** Window helper: is f within [a, b). */
export const inW = (f: number, a: number, b: number) => f >= a && f < b;

export const Abs: React.FC<{ x: number; y: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ x, y, children, style }) => (
  <div style={{ position: "absolute", left: x, top: y, ...style }}>{children}</div>
);

/**
 * Monotone cubic (Fritsch–Carlson) through keyframes [frame, value]: passes every key exactly and
 * never overshoots between them. Used where a motion must hit given values on given frames (the reel).
 */
export const monotone = (keys: [number, number][]) => {
  const n = keys.length;
  const xs = keys.map((k) => k[0]);
  const ys = keys.map((k) => k[1]);
  const d = xs.slice(0, -1).map((x, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - x));
  // ends with zero velocity: the motion settles into its last key (no hard stop)
  const m = ys.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? 0 : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
};

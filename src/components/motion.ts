import React from "react";
import { interpolate, spring, random } from "remotion";
import { EASE, SPRING } from "../config/brand";

type SpringCfg = { damping: number; stiffness: number; mass?: number };

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Clamped tween between frames a→b. */
export const tw = (
  f: number,
  a: number,
  b: number,
  from = 0,
  to = 1,
  easing: (t: number) => number = EASE.out,
) => interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

/** Spring that starts at frame `start` (0 before). Works with fractional frames. */
export const sp = (f: number, start: number, cfg: SpringCfg = SPRING.pop, durationRestThreshold?: number) => {
  if (f <= start) return 0;
  return spring({ frame: f - start, fps: 30, config: { mass: 1, ...cfg }, durationRestThreshold });
};

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Frame-driven blur-in / blur-out (brief §4). Returns a style object. */
export const fx = (
  f: number,
  inAt: number | null,
  outAt: number | null = null,
  opts: { dy?: number; blur?: number; s0?: number; inDur?: number; outDur?: number } = {},
): React.CSSProperties => {
  const { dy = 28, blur = 14, s0 = 0.94, inDur = 12, outDur = 7 } = opts;
  let opacity = 1;
  let b = 0;
  let y = 0;
  let s = 1;
  if (inAt !== null) {
    const p = tw(f, inAt, inAt + inDur, 0, 1, EASE.out);
    const k = sp(f, inAt, SPRING.pop);
    opacity = tw(f, inAt, inAt + inDur * 0.66, 0, 1, EASE.out);
    b = blur * (1 - p);
    y = dy * (1 - k);
    s = mix(s0, 1, k);
  }
  if (outAt !== null && f >= outAt) {
    const q = tw(f, outAt, outAt + outDur, 0, 1, EASE.in);
    opacity *= 1 - q;
    b += 12 * q;
    s *= 1 + 0.05 * q;
  }
  return {
    opacity,
    filter: b > 0.05 ? `blur(${b.toFixed(2)}px)` : undefined,
    transform: `translateY(${y.toFixed(2)}px) scale(${s.toFixed(4)})`,
  };
};

/** Visible (1) between inAt and outAt with the brief's entrance/exit timings. */
export const vis = (f: number, inAt: number, outAt: number | null = null, inDur = 8, outDur = 7) => {
  let o = tw(f, inAt, inAt + inDur, 0, 1, EASE.out);
  if (outAt !== null) o *= 1 - tw(f, outAt, outAt + outDur, 0, 1, EASE.in);
  return o;
};

/** Pressed element: scale 0.96 for 4f then springs back. */
export const press = (f: number, at: number) => {
  if (f < at) return 1;
  if (f < at + 4) return mix(1, 0.96, tw(f, at, at + 2, 0, 1, EASE.out));
  return mix(0.96, 1, sp(f, at + 4, SPRING.snap));
};

/** Highlight bump used on service cards (scale 1.04 + glow for 6f). */
export const bump = (f: number, at: number, dur = 6) => {
  if (f < at || f > at + dur + 14) return 0;
  const up = tw(f, at, at + 3, 0, 1, EASE.out);
  const down = tw(f, at + dur, at + dur + 12, 0, 1, EASE.inOut);
  return up * (1 - down);
};

/** Idle drift (brief §4): y = 5·sin(frame/45), rotateX ±0.8°. */
export const drift = (f: number, phase = 0) => ({
  y: 5 * Math.sin((f + phase) / 45),
  rx: 0.8 * Math.sin((f + phase) / 60),
});

/** Seeded ±range value. */
export const jitter = (seed: string, range: number) => (random(seed) * 2 - 1) * range;

/** Approximate speed-based blur (px) for an animated value. */
export const speedBlur = (fn: (f: number) => number, f: number, k = 0.5, max = 24) =>
  Math.min(max, Math.abs(fn(f + 0.5) - fn(f - 0.5)) * k);

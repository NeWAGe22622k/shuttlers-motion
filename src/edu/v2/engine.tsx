import React from "react";
import { AbsoluteFill, random } from "remotion";
import { EASE } from "../../config/brand";
import { T } from "../../config/time";
import { clamp, mix, sp, tw } from "../../components/motion";

/**
 * Video 2 motion engine. Everything is a pure function of the absolute frame so the cuts stay
 * locked to the score in timing.json (edu.v2): beats every 15f from the drop, dead still in the
 * blackout and the halt, nothing after the button.
 */

export const V2 = T.edu.v2;
export const W = 1080;
export const H = 1920;
export const SIL: [number, number][] = [V2.sections.blackout as [number, number], V2.sections.halt as [number, number]];
export const silent = (f: number) => SIL.some(([a, b]) => f >= a && f < b);

/** 1 on every beat, decaying (k frames). Intro clock ticks at half strength; none in silences or after the button. */
export const beat = (f: number, k = 3.2) => {
  if (silent(f) || f >= V2.sections.button + 12) return 0;
  if (f < V2.sections.drop) return 0.5 * Math.exp(-(f % 15) / k);
  return Math.exp(-((f - V2.sections.drop) % 15) / k);
};

/** Time that stops during the silences (drifts and particles freeze, then resume without a jump). */
export const mt = (f: number) => {
  let t = f;
  for (const [a, b] of SIL) t -= Math.max(0, Math.min(f, b) - a);
  return t;
};

export type Key = [number, number, ((t: number) => number)?];
/** Piecewise keyframes [frame, value, easing-into-this-key]. */
export const keys = (f: number, ks: Key[]) => {
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    const [t1, v1, e] = ks[i];
    const [t0, v0] = ks[i - 1];
    if (f <= t1) return mix(v0, v1, (e ?? EASE.inOut)(clamp((f - t0) / Math.max(1e-6, t1 - t0))));
  }
  return ks[ks.length - 1][1];
};

type Cfg = { damping: number; stiffness: number; mass?: number };
/** A value that springs to new targets at given frames (overlapping, organic). */
export const springs = (f: number, start: number, moves: [number, number][], cfg: Cfg = { damping: 18, stiffness: 140 }) => {
  let v = start;
  for (const [at, to] of moves) v = mix(v, to, sp(f, at, cfg));
  return v;
};

/** Velocity of an animated value (units per frame). */
export const vel = (fn: (x: number) => number, f: number) => Math.abs(fn(f + 0.5) - fn(f - 0.5));

/** Damped shake after a hit. */
export const shake = (f: number, at: number, amp = 12, decay = 3.2, freq = 2.3) => (f < at ? 0 : amp * Math.exp(-(f - at) / decay) * Math.sin((f - at) * freq));

/** Quick decaying kick after a hit (0 → 1 → 0). */
export const kick = (f: number, at: number, decay = 4) => (f < at ? 0 : Math.exp(-(f - at) / decay));

/* ------------------------------------------------------------------ blur */

/** Directional motion blur on a whole layer (SVG gaussian, x/y separate). */
export const DirBlur: React.FC<{ id: string; x?: number; y?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ id, x = 0, y = 0, children, style }) => {
  const on = x > 0.35 || y > 0.35;
  return (
    <AbsoluteFill style={{ filter: on ? `url(#${id})` : undefined, ...style }}>
      {on ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={id} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`${x.toFixed(2)} ${y.toFixed(2)}`} />
          </filter>
        </svg>
      ) : null}
      {children}
    </AbsoluteFill>
  );
};

/** Inline (non-fill) directional blur wrapper for a positioned element. */
export const BlurBox: React.FC<{ id: string; x?: number; y?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ id, x = 0, y = 0, children, style }) => {
  const on = x > 0.35 || y > 0.35;
  return (
    <div style={{ filter: on ? `url(#${id})` : undefined, ...style }}>
      {on ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={id} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`${x.toFixed(2)} ${y.toFixed(2)}`} />
          </filter>
        </svg>
      ) : null}
      {children}
    </div>
  );
};

/** Ghost trail: the same render at earlier frames, fading (cheap camera-shutter feel). */
export const Ghosts: React.FC<{ f: number; n?: number; lag?: number; opacity?: number; render: (fr: number) => React.ReactNode }> = ({ f, n = 3, lag = 1.2, opacity = 0.28, render }) => (
  <>
    {Array.from({ length: n }, (_, i) => n - i).map((i) => (
      <AbsoluteFill key={i} style={{ opacity: opacity * (1 - (i - 1) / n) }}>
        {render(f - i * lag)}
      </AbsoluteFill>
    ))}
    <AbsoluteFill>{render(f)}</AbsoluteFill>
  </>
);

/* ------------------------------------------------------------------ depth: glow, specks, grid of rings */

/** Soft accent glow (radial). */
export const Glow: React.FC<{ x: number; y: number; r: number; color: string; a: number }> = ({ x, y, r, color, a }) =>
  a <= 0.003 ? null : (
    <AbsoluteFill style={{ background: `radial-gradient(circle at ${x}px ${y}px, ${hexA(color, a)} 0%, ${hexA(color, a * 0.45)} ${Math.round(r * 0.45)}px, ${hexA(color, 0)} ${Math.round(r)}px)`, pointerEvents: "none" }} />
  );

export const hexA = (hex: string, a: number) => {
  const v = Math.round(clamp(a) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${v}`;
};

/** Drifting specks in the accent: constant life in the frame, frozen in the silences. */
export const Specks: React.FC<{ f: number; color: string; n?: number; seed?: string; opacity?: number; rise?: number }> = ({ f, color, n = 34, seed = "sp", opacity = 1, rise = 1 }) => {
  const t = mt(f);
  const b = beat(f);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      {Array.from({ length: n }, (_, i) => {
        const r = (k: string) => random(`${seed}${k}${i}`);
        const depth = 0.3 + r("d") * 0.7;
        const x = (((r("x") * W + Math.sin(t / (28 + 20 * r("w")) + i) * 26 * depth + t * (r("v") - 0.5) * 0.7) % W) + W) % W;
        const y = (((r("y") * H - t * (0.35 + r("u") * 1.5) * depth * rise) % H) + H) % H;
        const s = (2.5 + r("s") * 7) * depth * (1 + 0.35 * b * depth);
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: 99, background: color, opacity: (0.1 + r("o") * 0.32) * depth }} />;
      })}
    </AbsoluteFill>
  );
};

/** Beat rings: a thin ring leaves a centre point on every beat and expands outward (sonar). */
export const BeatRings: React.FC<{ f: number; x: number; y: number; color: string; a?: number; r0?: number; r1?: number; from?: number }> = ({ f, x, y, color, a = 0.16, r0 = 260, r1 = 1300, from = 60 }) => {
  if (silent(f)) return null;
  const rings: React.ReactNode[] = [];
  for (let k = 0; k < 4; k++) {
    const born = Math.floor((f - from) / 15) * 15 + from - k * 15;
    if (born < from) continue;
    const p = (f - born) / 60;
    if (p < 0 || p > 1) continue;
    const r = mix(r0, r1, EASE.out(p));
    rings.push(<div key={born} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: 9999, border: `${mix(5, 1.5, p)}px solid ${color}`, opacity: a * (1 - p) }} />);
  }
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{rings}</AbsoluteFill>;
};

/* ------------------------------------------------------------------ hits */

/** Expanding shockwave ring(s). */
export const Shock: React.FC<{ f: number; at: number; x: number; y: number; color: string; size?: number; n?: number; dur?: number; width?: number; flat?: number }> = ({ f, at, x, y, color, size = 600, n = 2, dur = 18, width = 10, flat = 1 }) => {
  if (f < at || f > at + dur + (n - 1) * 4) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const p = tw(f, at + i * 4, at + i * 4 + dur, 0, 1, EASE.out);
        if (p <= 0 || p >= 1) return null;
        const r = (size / 2) * (0.12 + p);
        return <div key={i} style={{ position: "absolute", left: x - r, top: y - r * flat, width: r * 2, height: r * 2 * flat, borderRadius: "50%", border: `${width * (1 - p) + 1.2}px solid ${color}`, opacity: (1 - p) * (1 - i * 0.3), pointerEvents: "none" }} />;
      })}
    </>
  );
};

/** Radial impact lines bursting out from a point. */
export const Burst: React.FC<{ f: number; at: number; x: number; y: number; color: string; n?: number; r0?: number; r1?: number; len?: number; width?: number; dur?: number; seed?: string; rot?: number }> = ({ f, at, x, y, color, n = 12, r0 = 120, r1 = 420, len = 110, width = 9, dur = 9, seed = "b", rot = 0 }) => {
  if (f < at || f > at + dur) return null;
  const p = tw(f, at, at + dur, 0, 1, EASE.out);
  const R = Math.max(r0, r1) + len + 20;
  return (
    <svg width={R * 2} height={R * 2} viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`} style={{ position: "absolute", left: x - R, top: y - R, overflow: "visible", pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => {
        const a = ((i / n) * 360 + rot + (random(`${seed}a${i}`) - 0.5) * (240 / n)) * (Math.PI / 180);
        const r = mix(r0, r1, p) * (0.85 + random(`${seed}r${i}`) * 0.3);
        const l = len * (1 - p) * (0.7 + random(`${seed}l${i}`) * 0.6);
        return <line key={i} x1={Math.cos(a) * r} y1={Math.sin(a) * r} x2={Math.cos(a) * (r + l)} y2={Math.sin(a) * (r + l)} stroke={color} strokeWidth={width * (1 - p * 0.6)} strokeLinecap="round" />;
      })}
    </svg>
  );
};

/** Sparks: dots that fly out radially with drag and fade. */
export const Sparks: React.FC<{ f: number; at: number; x: number; y: number; color: string; n?: number; speed?: number; life?: number; size?: number; seed?: string; flat?: number }> = ({ f, at, x, y, color, n = 26, speed = 34, life = 40, size = 10, seed = "sk", flat = 1 }) => {
  const t = f - at;
  if (t < 0 || t > life) return null;
  const k = 0.1;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const v = speed * (0.35 + random(`${seed}v${i}`) * 0.65);
        const d = (v / k) * (1 - Math.exp(-k * t));
        const px = x + Math.cos(a) * d;
        const py = y + Math.sin(a) * d * flat - t * 0.6;
        const s = size * (0.5 + random(`${seed}s${i}`)) * (1 - t / life);
        return <div key={i} style={{ position: "absolute", left: px - s / 2, top: py - s / 2, width: s, height: s, borderRadius: 99, background: color, boxShadow: `0 0 ${s * 1.6}px ${color}`, opacity: 1 - (t / life) ** 2 }} />;
      })}
    </>
  );
};

/** Horizontal speed streaks (world rushing past). p = speed 0..1. */
export const SpeedLines: React.FC<{ f: number; color: string; p: number; n?: number; y0?: number; y1?: number; seed?: string; dir?: 1 | -1 }> = ({ f, color, p, n = 26, y0 = 0, y1 = H, seed = "sl", dir = -1 }) => {
  if (p <= 0.01) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => {
        const r = (k: string) => random(`${seed}${k}${i}`);
        const len = (120 + r("l") * 520) * p;
        const speed = (40 + r("v") * 90) * p;
        const span = W + len + 200;
        const x = dir < 0 ? W + 100 - ((r("x") * span + f * speed) % span) : ((r("x") * span + f * speed) % span) - len - 100;
        const y = y0 + r("y") * (y1 - y0);
        const th = 2 + r("t") * 6;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: len, height: th, borderRadius: th, background: color, opacity: (0.18 + r("o") * 0.5) * Math.min(1, p * 1.5) }} />;
      })}
    </AbsoluteFill>
  );
};

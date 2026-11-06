import React from "react";
import { AbsoluteFill, random, staticFile } from "remotion";
import { noise2D } from "@remotion/noise";
import { C, H, W } from "./brand";

/**
 * Gradient system (brief §3). Never two-stop linear, never static: every field position is
 * driven by @remotion/noise. Banding is killed by <Texture/> (2.5% seeded grain + a 4×4
 * ordered-dither tile) which sits over every frame.
 */

const sec = (f: number) => f / 30;

/** A drifting control point. ~40px/s at amp 220 and rate 0.18. */
export const drift = (seed: string, f: number, amp = 220, rate = 0.18) => ({
  x: noise2D(`${seed}x`, sec(f) * rate, 0) * amp,
  y: noise2D(`${seed}y`, 0, sec(f) * rate) * amp,
});

const a = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha.toFixed(3)})`;
};

/** One soft colour field (a large multi-stop ellipse). These are the background, never a halo behind type. */
const field = (hex: string, x: number, y: number, rx: number, ry: number, peak = 1) =>
  `radial-gradient(ellipse ${rx.toFixed(0)}px ${ry.toFixed(0)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px, ${a(hex, peak)} 0%, ${a(hex, peak * 0.82)} 22%, ${a(hex, peak * 0.45)} 48%, ${a(hex, peak * 0.14)} 72%, ${a(hex, 0)} 100%)`;

/* ------------------------------------------------------------------ G1 · Lagos 8:50 (night mesh) */

export const g1Css = (f: number, w = W, h = H) => {
  const p = [
    { c: C.deepIndigo, x: 0.18, y: 0.2, s: "g1a" },
    { c: C.deepGreen, x: 0.84, y: 0.78, s: "g1b" },
    { c: C.ink, x: 0.78, y: 0.12, s: "g1c" },
    { c: C.deepIndigo, x: 0.3, y: 0.95, s: "g1d" },
  ];
  const layers = p.map((q, i) => {
    const d = drift(q.s, f, 420, 0.32); // visibly moving: ~130px/s
    const r = i === 1 ? 1.0 : 0.85;
    return field(q.c, q.x * w + d.x, q.y * h + d.y, w * 0.62 * r, h * 0.78 * r, i === 2 ? 0.9 : 0.95);
  });
  return `${layers.join(", ")}, ${C.night}`;
};

export const G1: React.FC<{ f: number; style?: React.CSSProperties }> = ({ f, style }) => <AbsoluteFill style={{ background: g1Css(f), ...style }} />;

/* ------------------------------------------------------------------ G2 · Pod Flood (conic + mesh, indigo vein) */

export type G2Tone = "bright" | "onLight" | "end";

/**
 * Conic/mesh blend ctaGreen → priceGreen → deepGreen with a thin indigo vein, rotating slowly.
 * "onLight" is weighted to deepGreen so type filled with it holds AA contrast on G3 paper.
 */
export const g2Css = (f: number, tone: G2Tone = "bright", phase = 0): string => {
  if (tone === "end") return g2End(f);
  const rot = (phase + sec(f) * 14) % 360; // 14°/s
  const d = drift(`g2${tone}`, f, 18, 0.25);
  const cx = 38 + d.x;
  const cy = 46 + d.y;
  const stops =
    tone === "bright"
      ? [
          [C.ctaGreen, 0],
          [C.ctaGreen, 40],
          [C.priceGreen, 105],
          [C.deepGreen, 170],
          [C.deepGreen, 196],
          [C.indigo, 196],
          [C.indigo, 197.2],
          [C.deepGreen, 197.2],
          [C.priceGreen, 262],
          [C.ctaGreen, 320],
          [C.ctaGreen, 360],
        ]
      : [
          [C.deepGreen, 0],
          [C.deepGreen, 70],
          [C.priceGreen, 130],
          ["#0B8A4C", 165],
          [C.deepGreen, 228],
          [C.indigo, 228],
          [C.indigo, 229.2],
          [C.deepGreen, 229.2],
          ["#0B8A4C", 300],
          [C.deepGreen, 360],
        ];
  const conic = `conic-gradient(from ${rot.toFixed(2)}deg at ${cx.toFixed(1)}% ${cy.toFixed(1)}%, ${stops.map(([c, deg]) => `${c} ${deg}deg`).join(", ")})`;
  const m = drift(`g2m${tone}`, f, 22, 0.2);
  const meshColour = tone === "bright" ? C.ctaGreen : C.deepGreen;
  const mesh = `radial-gradient(ellipse 70% 60% at ${(72 + m.x).toFixed(1)}% ${(30 + m.y).toFixed(1)}%, ${a(meshColour, 0.7)} 0%, ${a(meshColour, 0.42)} 35%, ${a(meshColour, 0.12)} 70%, ${a(meshColour, 0)} 100%)`;
  return `${mesh}, ${conic}`;
};

/**
 * Full-frame Pod Flood for the end frame: the conic spins from a point off the top-left corner so
 * the deep greens sweep the edges (no vein: nothing line-like crosses the lockup) while the centre (where the ink lockup sits)
 * stays in the bright greens (ink on it ≥ 6:1).
 */
const g2End = (f: number) => {
  const rot = (sec(f) * 10) % 360;
  const d = drift("g2end", f, 60, 0.2);
  const conic = `conic-gradient(from ${(118 + rot).toFixed(2)}deg at ${(-18 + d.x / 20).toFixed(1)}% ${(-30 + d.y / 20).toFixed(1)}%, ${C.ctaGreen} 0deg, ${C.ctaGreen} 26deg, ${C.priceGreen} 52deg, ${C.deepGreen} 80deg, ${C.priceGreen} 108deg, ${C.ctaGreen} 140deg, ${C.ctaGreen} 360deg)`;
  const m1 = drift("g2e1", f, 120, 0.18);
  const m2 = drift("g2e2", f, 120, 0.18);
  return [
    field(C.ctaGreen, W * 0.5 + m1.x, H * 0.5 + m1.y, W * 0.42, H * 0.46, 0.85),
    field(C.deepGreen, W * 1.02 + m2.x, H * 1.05 + m2.y, W * 0.38, H * 0.5, 0.9),
    field(C.priceGreen, W * 0.05 + m2.y, H * 0.95 + m1.x, W * 0.35, H * 0.45, 0.7),
    conic,
  ].join(", ");
};

export const G2: React.FC<{ f: number; tone?: G2Tone; style?: React.CSSProperties }> = ({ f, tone = "bright", style }) => <AbsoluteFill style={{ background: g2Css(f, tone), ...style }} />;

/** Inline style that fills type with G2 (background-clip: text). */
export const g2Text = (f: number, tone: G2Tone = "onLight", phase = 0): React.CSSProperties => ({
  backgroundImage: g2Css(f, tone, phase),
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
});

/* ------------------------------------------------------------------ G3 · Paper */

export const g3Css = (f: number, w = W, h = H) => {
  const m = drift("g3m", f, 160, 0.16);
  const i = drift("g3i", f, 160, 0.16);
  return [
    field(C.mint, w * 0.08 + m.x, h * 0.1 + m.y, w * 0.7, h * 0.85, 1),
    field("#2B2BC8", w * 0.94 + i.x, h * 0.95 + i.y, w * 0.6, h * 0.8, 0.07),
    field("#DDF7E8", w * 0.55 + i.y, h * 0.5 + m.x, w * 0.35, h * 0.4, 0.35),
    C.paper,
  ].join(", ");
};

export const G3: React.FC<{ f: number; style?: React.CSSProperties }> = ({ f, style }) => <AbsoluteFill style={{ background: g3Css(f), ...style }} />;

/* ------------------------------------------------------------------ G4 · Stepped band */

export const G4_STEPS = [C.deepGreen, "#0C8B4D", C.priceGreen, C.ctaGreen, "#83F0B9", C.mint];

/** 6 hard steps (no blending), trailing edge → leading edge. */
export const g4Css = (dir = "90deg") => {
  const n = G4_STEPS.length;
  return `linear-gradient(${dir}, ${G4_STEPS.map((c, i) => `${c} ${((i / n) * 100).toFixed(3)}%, ${c} ${(((i + 1) / n) * 100).toFixed(3)}%`).join(", ")})`;
};

/* ------------------------------------------------------------------ texture: grain + ordered dither */

export const Texture: React.FC<{ f: number; on?: boolean; strength?: number; blend?: "overlay" | "normal" }> = ({ f, on = true, strength = 1, blend = "overlay" }) => {
  if (!on) return null;
  const k = Math.floor(f);
  const ox = Math.floor(random(`grain-x-${k}`) * 512);
  const oy = Math.floor(random(`grain-y-${k}`) * 512);
  return (
    <>
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("fx/grain.png")})`,
          backgroundPosition: `${ox}px ${oy}px`,
          backgroundSize: "512px 512px",
          mixBlendMode: blend,
          opacity: (blend === "overlay" ? 0.06 : 0.025) * strength,
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("fx/bayer4.png")})`,
          backgroundSize: "4px 4px",
          imageRendering: "pixelated",
          mixBlendMode: "overlay",
          opacity: 0.035 * strength,
          pointerEvents: "none",
        }}
      />
    </>
  );
};

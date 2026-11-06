import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { parsePath, reduceInstructions, serializeInstructions } from "@remotion/paths";
import { EASE, H, T, W } from "../config/brand";
import { g4Css } from "../config/gradients";
import { mix, tw } from "./motion";

/**
 * Scene transitions (brief §4). Never a fade:
 *   GradientWipe · a G4 stepped band (240px) on a 12° diagonal crosses the frame in 12f (expoInOut),
 *                  carrying the next scene behind it. Centred on the beat (at−6 → at+6).
 *   MaskGrow     · a shape grows from where it sits until it covers the frame; the next scene is inside it.
 */

const TAN = Math.tan((12 * Math.PI) / 180);
const BAND = 240;
const BAND_H = BAND / Math.cos((12 * Math.PI) / 180); // horizontal width of the band

/** x of the band's leading edge at row y, for leading-edge position e (at mid-height). */
const edgeX = (e: number, y: number) => e + TAN * (H / 2 - y);

export const wipeEdge = (f: number, at: number) => {
  const half = T.transitions.wipeDur / 2;
  const e0 = -TAN * (H / 2) - 40;
  const e1 = W + BAND_H + TAN * (H / 2) + 40;
  return mix(e0, e1, tw(f, at - half, at + half, 0, 1, EASE.expoInOut));
};

const leftOf = (e: number) => `polygon(-200px -200px, ${edgeX(e, -200).toFixed(1)}px -200px, ${edgeX(e, H + 200).toFixed(1)}px ${H + 200}px, -200px ${H + 200}px)`;

export const GradientWipe: React.FC<{ f: number; at: number; from: React.ReactNode; to: React.ReactNode }> = ({ f, at, from, to }) => {
  const half = T.transitions.wipeDur / 2;
  if (f < at - half) return <>{from}</>;
  if (f >= at + half) return <>{to}</>;
  const e = wipeEdge(f, at);
  return (
    <AbsoluteFill>
      <AbsoluteFill>{from}</AbsoluteFill>
      <AbsoluteFill style={{ clipPath: leftOf(e - BAND_H) }}>{to}</AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: e - BAND_H / 2 - BAND / 2,
          top: H / 2 - 900,
          width: BAND,
          height: 1800,
          transform: "rotate(12deg)",
          transformOrigin: "50% 50%",
          background: g4Css("90deg"),
        }}
      />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ path transforms */

export const mapPath = (d: string, fn: (x: number, y: number) => [number, number]) => {
  const ins = reduceInstructions(parsePath(d));
  const out = ins.map((i) => {
    switch (i.type) {
      case "M":
      case "L": {
        const [x, y] = fn(i.x, i.y);
        return { ...i, x, y };
      }
      case "C": {
        const [x1, y1] = fn(i.cp1x, i.cp1y);
        const [x2, y2] = fn(i.cp2x, i.cp2y);
        const [x, y] = fn(i.x, i.y);
        return { ...i, cp1x: x1, cp1y: y1, cp2x: x2, cp2y: y2, x, y };
      }
      default:
        return i;
    }
  });
  return serializeInstructions(out);
};

/** Place a local path (centred on 0,0) at (cx, cy), scaled by s and rotated by deg. */
export const placePath = (d: string, cx: number, cy: number, s: number, deg = 0) => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const sn = Math.sin(r);
  return mapPath(d, (x, y) => [cx + (x * c - y * sn) * s, cy + (x * sn + y * c) * s]);
};

const growEase = Easing.bezier(0.5, 0, 0.3, 1);

/** Scale factor for a mask-grow window: s0 → s1 on an exponential (constant-feel) zoom. */
export const growScale = (f: number, a: number, b: number, s0: number, s1: number) => {
  const t = tw(f, a, b, 0, 1, growEase);
  return s0 * Math.pow(s1 / s0, t);
};

/**
 * MaskGrow: `to` is shown inside `shape(f)` (a frame-space path) over `from`.
 * Before `a` only `from`; from `b` only `to`.
 */
export const MaskGrow: React.FC<{ f: number; a: number; b: number; from: React.ReactNode; to: React.ReactNode; shape: (f: number) => string }> = ({ f, a, b, from, to, shape }) => {
  if (f < a) return <>{from}</>;
  if (f >= b) return <>{to}</>;
  return (
    <AbsoluteFill>
      <AbsoluteFill>{from}</AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `path('${shape(f)}')` }}>{to}</AbsoluteFill>
    </AbsoluteFill>
  );
};

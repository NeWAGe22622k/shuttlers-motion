import React from "react";
import { measureText } from "@remotion/layout-utils";
import { C, EASE, M, TRACK, fontFamily } from "../config/brand";
import { g2Text, G2Tone } from "../config/gradients";
import { clamp, mix, tw } from "./motion";

/**
 * Type reveals (brief §4). None of them fade: everything is a hard mask, a slide or a scale.
 *   MaskRise  · each word rises from behind a hard baseline mask (8f expoOut, 2f stagger)
 *   Slice     · each line cut into 3 horizontal slices that slide in from alternating sides and lock
 *   FillSweep · ink outline first, then G2 sweeps through the letters left→right (10f)
 *   ScaleCut  · appears at 3× (cropped by the frame edge) and snaps to final size in 6f
 */

export type TypeProps = { size: number; weight?: number; color?: string; tracking?: string; lh?: number };

export const typeStyle = ({ size, weight = 700, color = C.ink, tracking, lh = 1.08 }: TypeProps): React.CSSProperties => ({
  fontFamily,
  fontSize: size,
  fontWeight: weight,
  color,
  letterSpacing: tracking ?? (size >= 100 ? TRACK.tight : "-0.01em"),
  lineHeight: lh,
  whiteSpace: "pre",
  fontVariantNumeric: "tabular-nums",
});

/** Greedy word wrap with real Google Sans metrics. */
export const wrapLines = (text: string, size: number, maxW: number, weight = 700, tracking = size >= 100 ? TRACK.tight : "-0.01em"): string[] => {
  const fits = (t: string) => measureText({ text: t, fontFamily, fontSize: size, fontWeight: String(weight), letterSpacing: tracking }).width <= maxW;
  // prefer breaking between sentences ("Open Shuttlers." / "Tap Pod.")
  if (!fits(text)) {
    const sentences = text.split(/(?<=\.) /);
    if (sentences.length > 1 && sentences.every(fits)) return sentences;
  }
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    const width = measureText({ text: next, fontFamily, fontSize: size, fontWeight: String(weight), letterSpacing: tracking }).width;
    if (width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
};

export const textWidth = (text: string, size: number, weight = 700, tracking = size >= 100 ? TRACK.tight : "-0.01em") =>
  measureText({ text, fontFamily, fontSize: size, fontWeight: String(weight), letterSpacing: tracking }).width;

/* ------------------------------------------------------------------ MaskRise */

export const MaskRise: React.FC<
  TypeProps & { f: number; at: number; lines: string[]; align?: "left" | "center"; fill?: React.CSSProperties; outAt?: number; style?: React.CSSProperties }
> = ({ f, at, lines, align = "left", fill, outAt, style, ...tp }) => {
  let wi = 0;
  return (
    <div style={{ ...typeStyle(tp), textAlign: align, ...style }}>
      {lines.map((ln, li) => (
        <div key={li} style={{ display: "block" }}>
          {ln.split(" ").map((w, i, arr) => {
            const k = wi++;
            const p = tw(f, at + k * M.maskStagger, at + k * M.maskStagger + M.maskRise, 0, 1, EASE.expoOut);
            // exit: words drop back below the same baseline (quintIn), in order
            const q = outAt === undefined ? 0 : tw(f, outAt + k, outAt + k + 6, 0, 1, EASE.quintIn);
            const y = (1 - p) * 112 + q * 112;
            return (
              <span key={i} style={{ display: "inline-block", clipPath: "inset(-0.35em -0.2em 0 -0.2em)", paddingBottom: "0.22em", marginBottom: "-0.22em", verticalAlign: "top" }}>
                <span style={{ display: "inline-block", transform: `translateY(${y.toFixed(2)}%)`, ...fill }}>{w}</span>
                {i < arr.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ Slice */

const SLICES: [number, number][] = [
  [0, 0.4],
  [0.4, 0.7],
  [0.7, 1],
];

/** Slice timing (brief revision): 6 frames, locking exactly on `lock` (a beat); at most 3 visibly split frames. */
export const SLICE_DUR = 6;
const sliceEase = (t: number) => 1 - Math.pow(1 - t, 8); // 3 frames in, the bands are within ~1px

/**
 * Each line is rendered three times, each copy clipped to one horizontal band of the glyph box;
 * the bands slide in from alternating sides and lock together exactly on `lock` (all lines at once).
 * `outAt` (optional) sends the bands back out to alternating sides in 3 frames (quintIn).
 */
export const Slice: React.FC<
  TypeProps & { f: number; lock: number; lines: string[]; dist?: number; outAt?: number; fill?: (li: number) => React.CSSProperties | undefined; style?: React.CSSProperties }
> = ({ f, lock, lines, dist = 300, outAt, fill, style, ...tp }) => {
  const ts = typeStyle(tp);
  const lh = tp.size * (tp.lh ?? 1.08);
  const a0 = lock - SLICE_DUR;
  if (outAt !== undefined && f >= outAt + 3) return null;
  return (
    <div style={{ position: "relative", ...style }}>
      {lines.map((ln, li) => {
        if (f < a0) return <div key={li} style={{ height: lh }} />;
        return (
          <div key={li} style={{ position: "relative", height: lh }}>
            {SLICES.map(([t0, t1], si) => {
              const side = (si + li) % 2 === 0 ? -1 : 1;
              const p = f >= lock ? 1 : sliceEase(clamp((f - a0) / SLICE_DUR));
              const q = outAt === undefined ? 0 : tw(f, outAt, outAt + 3, 0, 1, EASE.quintIn);
              const x = side * dist * (1 - p) - side * dist * 2.4 * q;
              return (
                <div
                  key={si}
                  style={{
                    ...ts,
                    position: "absolute",
                    left: 0,
                    top: 0,
                    clipPath: `inset(${(t0 * 100).toFixed(1)}% -40% ${((1 - t1) * 100).toFixed(1)}% -40%)`,
                    transform: `translateX(${x.toFixed(2)}px)`,
                    paddingBottom: "0.2em",
                    height: lh,
                  }}
                >
                  <span style={fill ? fill(li) : undefined}>{ln}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ FillSweep */

export const FillSweep: React.FC<TypeProps & { f: number; at: number; from?: number; text: string; tone?: G2Tone; stroke?: number; strokeColor?: string; style?: React.CSSProperties }> = ({
  f,
  at,
  from,
  text,
  tone = "onLight",
  stroke = 3,
  strokeColor = C.ink,
  style,
  ...tp
}) => {
  if (f < (from ?? at)) return null; // the ink outline cuts on (at `from`, default `at`)
  const p = tw(f, at, at + M.fillSweep, 0, 1, EASE.expoInOut);
  const ts = typeStyle(tp);
  return (
    <div style={{ position: "relative", ...style }}>
      <div style={{ ...ts, color: "transparent", WebkitTextStroke: `${stroke}px ${strokeColor}` }}>{text}</div>
      <div style={{ ...ts, position: "absolute", left: 0, top: 0, clipPath: `inset(-20% ${((1 - p) * 100).toFixed(2)}% -20% -5%)` }}>
        <span style={{ ...g2Text(f, tone), paddingBottom: "0.15em" }}>{text}</span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ ScaleCut */

/** 3× → 1× in 6f (expoOut). Hidden before `at` (a hard cut on). */
export const scaleCut = (f: number, at: number, from = 3) => (f < at ? 0 : mix(from, 1, tw(f, at, at + M.scaleCut, 0, 1, EASE.expoOut)));

export const ScaleCut: React.FC<{ f: number; at: number; origin?: string; from?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ f, at, origin = "50% 50%", from = 3, children, style }) => {
  const s = scaleCut(f, at, from);
  if (s === 0) return null;
  return <div style={{ transform: `scale(${s.toFixed(4)})`, transformOrigin: origin, ...style }}>{children}</div>;
};

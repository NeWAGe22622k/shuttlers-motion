import React from "react";
import { AbsoluteFill, random, staticFile } from "remotion";
import { EASE } from "../config/brand";
import { sp, tw } from "../components/motion";
import type { Seg } from "./content";
import { POPPINS } from "./theme";

const SNAP = { damping: 18, stiffness: 260 };

/**
 * Uber Drive Now-style entrance with the launch film's settle: the word drops in with vertical
 * motion blur, starting from a seeded tilt and a slight overscale that spring back to rest.
 */
export const dropStyle = (f: number, at: number, dist = 110, seed?: string): React.CSSProperties => {
  if (f < at) return { opacity: 0 };
  const k = sp(f, at, SNAP);
  const v = Math.abs(sp(f + 0.5, at, SNAP) - sp(f - 0.5, at, SNAP));
  const rot = seed ? (random(`${seed}-r`) * 2 - 1) * 6 : 0;
  const dx = seed ? (random(`${seed}-x`) * 2 - 1) * 18 : 0;
  return {
    opacity: tw(f, at, at + 3),
    transform: `translate(${dx * (1 - k)}px, ${(1 - k) * dist}px) rotate(${rot * (1 - k)}deg) scale(${1 + 0.08 * (1 - k)})`,
    filter: v > 0.02 ? `blur(${Math.min(16, v * 70)}px)` : undefined,
  };
};

/** Exit: words fly up and out with blur and a little spin (exits are quicker than entrances). */
export const liftStyle = (f: number, at: number, seed = "x"): React.CSSProperties => {
  if (f < at) return {};
  const p = tw(f, at, at + 5, 0, 1, EASE.in);
  const rot = (random(`${seed}-lr`) * 2 - 1) * 10;
  return { opacity: 1 - p, transform: `translateY(${-120 * p}px) rotate(${rot * p}deg) scale(${1 + 0.1 * p})`, filter: `blur(${12 * p}px)` };
};

/**
 * Kinetic statement. Each word drops in (settling from a seeded tilt); bold words arrive with a glow
 * in the frame's accent that cools over 18f. `punch` gives explicit frames (one per word or per line),
 * otherwise words stagger by 2f from `at`. Words fly out from `outAt`, staggered 1f.
 */
export const Statement: React.FC<{
  f: number;
  lines: Seg[][];
  at: number;
  size: number;
  color: string;
  punch?: number[];
  punchBy?: "word" | "line";
  outAt?: number | null;
  align?: "left" | "center";
  lineGap?: number;
  seed?: string;
  style?: React.CSSProperties;
}> = ({ f, lines, at, size, color, punch, punchBy, outAt = null, align = "left", lineGap = 0.04, seed = "st", style }) => {
  let wi = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: size * lineGap, alignItems: align === "center" ? "center" : "flex-start", ...style }}>
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start", columnGap: size * 0.24, fontFamily: POPPINS, fontSize: size, lineHeight: 1.0, letterSpacing: -size * 0.04, color }}>
          {line.flatMap((seg) =>
            seg.t.split(" ").map((w) => {
              const idx = wi++;
              const t0 = punch && punchBy === "word" ? punch[idx] : punch && punchBy === "line" ? punch[li] : at + idx * 2;
              const g = seg.b ? 1 - tw(f, t0, t0 + 18, 0, 1, EASE.inOut) : 0;
              const ws = `${seed}-${idx}`;
              const inS = dropStyle(f, t0, 110, ws);
              const outS = outAt !== null && f >= outAt + idx ? liftStyle(f, outAt + idx, ws) : null;
              return (
                <span
                  key={`${li}-${idx}`}
                  style={{
                    display: "inline-block",
                    fontWeight: seg.b ? 800 : 500,
                    textShadow: g > 0.02 && f >= t0 ? `0 0 ${size * 0.25 * g}px ${color}` : undefined,
                    ...(outS ?? inS),
                    opacity: (inS.opacity as number | undefined ?? 1) * ((outS?.opacity as number | undefined) ?? 1),
                  }}
                >
                  {w}
                </span>
              );
            }),
          )}
        </div>
      ))}
    </div>
  );
};

/** Card background that wipes in on the beat (6f, easeOut), alternating direction. */
export const CardBG: React.FC<{ f: number; at: number; bg: string; dir?: 1 | -1; instant?: boolean; children?: React.ReactNode }> = ({ f, at, bg, dir = 1, instant = false, children }) => {
  const p = instant ? 1 : tw(f, at, at + 6, 0, 1, EASE.out);
  const clip = dir === 1 ? `inset(0 0 0 ${(1 - p) * 100}%)` : `inset(0 ${(1 - p) * 100}% 0 0)`;
  return <AbsoluteFill style={{ background: bg, clipPath: clip }}>{children}</AbsoluteFill>;
};

/** Capital S mark, tinted to the frame's one accent. Icon alone always sits on the right (brief). */
export const SMark: React.FC<{ size: number; color: string; style?: React.CSSProperties }> = ({ size, color, style }) => (
  <div
    style={{
      width: size * (1212 / 1532),
      height: size,
      backgroundColor: color,
      WebkitMaskImage: `url(${staticFile("brand/shuttlers-mark.svg")})`,
      maskImage: `url(${staticFile("brand/shuttlers-mark.svg")})`,
      WebkitMaskSize: "contain",
      maskSize: "contain",
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      ...style,
    }}
  />
);

/** Right-pointing arrow drawn as a vector (Poppins' latin subset has no → glyph). */
export const Arrow: React.FC<{ size: number; color: string; p?: number; stroke?: number }> = ({ size, color, p = 1, stroke = 14 }) => (
  <svg width={size * 1.6} height={size} viewBox="0 0 160 100" style={{ display: "block", overflow: "visible" }}>
    <path d="M6 50 H140 M98 10 L144 50 L98 90" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="square" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
  </svg>
);

/** Horizontal (directional) motion blur for anything moving sideways. */
export const HBlur: React.FC<{ id: string; amount: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ id, amount, children, style }) => (
  <div style={{ position: "absolute", inset: 0, filter: amount > 0.3 ? `url(#${id})` : undefined, ...style }}>
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <filter id={id} x="-40%" y="-10%" width="180%" height="120%">
        <feGaussianBlur stdDeviation={`${amount.toFixed(2)} 0`} />
      </filter>
    </svg>
    {children}
  </div>
);

/** Small damped shake used when something lands hard. */
export const landShake = (f: number, at: number, amp = 10) => {
  if (f < at) return 0;
  const k = f - at;
  return amp * Math.exp(-k / 3) * Math.sin(k * 2.2);
};

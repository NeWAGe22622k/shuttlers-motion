import React from "react";
import { AbsoluteFill, Img, random, staticFile, getStaticFiles, interpolateColors } from "remotion";
import { C, EASE, SPRING, SHADOW, fontFamily, glow } from "../config/brand";
import { clamp, fx, mix, sp, tw } from "./motion";
import { useT } from "../config/time";

/* ---------------------------------------------------------------- assets */

let staticList: string[] | null = null;
const listStatic = () => {
  if (staticList === null) {
    try {
      staticList = getStaticFiles().map((f) => f.name);
    } catch {
      staticList = [];
    }
  }
  return staticList;
};
export const assetExists = (p: string) => {
  const l = listStatic();
  return l.length === 0 || l.includes(p);
};

/** Neutral placeholder for a missing asset (dashed outline + expected filename). Logged in MISSING_ASSETS.md. */
export const Placeholder: React.FC<{ name: string; w: number; h: number; style?: React.CSSProperties }> = ({ name, w, h, style }) => (
  <div
    style={{
      width: w,
      height: h,
      border: `2px dashed ${C.muted}`,
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: C.muted,
      fontFamily,
      fontSize: Math.max(10, Math.min(18, w / 14)),
      textAlign: "center",
      boxSizing: "border-box",
      ...style,
    }}
  >
    {name}
  </div>
);

export const Asset: React.FC<{ src: string; w: number; h?: number; style?: React.CSSProperties }> = ({ src, w, h, style }) =>
  assetExists(src) ? (
    <Img src={staticFile(src)} style={{ width: w, height: h ?? "auto", display: "block", ...style }} />
  ) : (
    <Placeholder name={src} w={w} h={h ?? w * 0.5} style={style} />
  );

/* ---------------------------------------------------------------- squircle app icon */

export const squirclePath = (s: number, n = 5) => {
  const pts: string[] = [];
  const N = 96;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const c = Math.cos(t);
    const si = Math.sin(t);
    const x = Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
    const y = Math.sign(si) * Math.pow(Math.abs(si), 2 / n);
    pts.push(`${(s / 2 + (x * s) / 2).toFixed(2)} ${(s / 2 + (y * s) / 2).toFixed(2)}`);
  }
  return `M${pts.join(" L")} Z`;
};

/** Shuttlers app icon (SVG from public/brand) with an iOS-style squircle mask and optional glint sweep (0..1). */
export const AppIcon: React.FC<{ size: number; glint?: number; shadow?: boolean; mask?: boolean; style?: React.CSSProperties }> = ({ size, glint = -1, shadow = true, mask = true, style }) => (
  <div style={{ width: size, height: size, position: "relative", filter: shadow ? `drop-shadow(0 ${size * 0.06}px ${size * 0.12}px rgba(16,17,17,.18))` : undefined, ...style }}>
    <div style={{ width: size, height: size, clipPath: mask ? `path('${squirclePath(size)}')` : undefined, position: "relative", overflow: "hidden" }}>
      <Asset src="brand/shuttlers-app-icon.svg" w={size} h={size} />
      {glint > 0 && glint < 1 ? (
        <div
          style={{
            position: "absolute",
            top: -size,
            left: mix(-size * 1.2, size * 1.6, glint),
            width: size * 0.32,
            height: size * 3,
            background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.75) 50%, rgba(255,255,255,0) 100%)",
            transform: "rotate(25deg)",
          }}
        />
      ) : null}
    </div>
  </div>
);

/* ---------------------------------------------------------------- texture */

export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.03 }) => {
  const f = Math.floor(useT());
  const ox = Math.floor(random(`gx${f}`) * 512);
  const oy = Math.floor(random(`gy${f}`) * 512);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile("fx/grain.png")})`,
        backgroundPosition: `${ox}px ${oy}px`,
        backgroundSize: "512px 512px",
        opacity: opacity * 2.4,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`, pointerEvents: "none" }} />
);

/* ---------------------------------------------------------------- Pod capsule */

export const Capsule: React.FC<{
  cx: number;
  cy: number;
  w?: number;
  h?: number;
  opacity?: number;
  glowAmt?: number;
  color?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ cx, cy, w = 72, h = 30, opacity = 1, glowAmt = 1, color = C.ctaGreen, children, style }) => (
  <div
    style={{
      position: "absolute",
      left: cx - w / 2,
      top: cy - h / 2,
      width: w,
      height: h,
      borderRadius: 999,
      background: `linear-gradient(180deg, rgba(255,255,255,.38) 0%, rgba(255,255,255,0) 46%), ${color}`,
      boxShadow: glowAmt > 0 ? `0 0 ${24 * glowAmt}px rgba(32,230,130,${0.55 * glowAmt}), inset 0 1px 0 rgba(255,255,255,.55)` : undefined,
      opacity,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Three bouncing typing dots. */
export const TypingDots: React.FC<{ f: number; color: string; size?: number; gap?: number }> = ({ f, color, size = 10, gap = 8 }) => (
  <div style={{ display: "flex", gap, alignItems: "center" }}>
    {[0, 1, 2].map((i) => {
      const ph = Math.sin((f - i * 4) / 4);
      return (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: 99,
            background: color,
            opacity: 0.45 + 0.55 * Math.max(0, ph),
            transform: `translateY(${-Math.max(0, ph) * size * 0.45}px)`,
          }}
        />
      );
    })}
  </div>
);

/* ---------------------------------------------------------------- text */

type Accent = Record<string, string>; // word (no punctuation) -> final colour

const bare = (w: string) => w.replace(/[^\p{L}\p{N}'’-]/gu, "");

/**
 * settleWords (brief §4): each word blurs in, starting from a seeded baseline offset (±14px)
 * and rotation (±3°) that springs to 0. Accent words start brandGreen with a glow and
 * cool to their final colour over 20f.
 */
export const SettleWords: React.FC<{
  text: string;
  at: number;
  size: number;
  weight?: number;
  color?: string;
  accents?: Accent;
  stagger?: number;
  seed?: string;
  outAt?: number | null;
  lineHeight?: number;
  align?: "left" | "center";
  letterSpacing?: number;
  maxWidth?: number;
  glowAll?: boolean;
  style?: React.CSSProperties;
}> = ({ text, at, size, weight = 700, color = C.ink, accents = {}, stagger = 3, seed = "w", outAt = null, lineHeight = 1.05, align = "left", letterSpacing, maxWidth, glowAll = false, style }) => {
  const f = useT();
  const words = text.split(" ");
  return (
    <div
      style={{
        fontFamily,
        fontSize: size,
        fontWeight: weight,
        lineHeight,
        letterSpacing: letterSpacing ?? (size >= 80 ? -size * 0.03 : -size * 0.01),
        textAlign: align,
        maxWidth,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        columnGap: size * 0.26,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const start = at + i * stagger;
        const k = sp(f, start, SPRING.pop);
        const base = fx(f, start, outAt, { dy: 0 });
        const dy = (random(`${seed}-y-${i}`) * 2 - 1) * 14;
        const rot = (random(`${seed}-r-${i}`) * 2 - 1) * 3;
        const accent = accents[bare(w)];
        const isAccent = accent !== undefined || glowAll;
        const cool = tw(f, start, start + 20, 0, 1, EASE.inOut);
        const final = accent ?? color;
        const col = isAccent ? interpolateColors(cool, [0, 1], [C.brandGreen, final]) : color;
        const glowA = isAccent ? 0.6 * (1 - cool * (accent === C.brandGreen ? 0.55 : 1)) : 0;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              color: col,
              opacity: base.opacity,
              filter: base.filter,
              textShadow: glowA > 0.01 ? glow(C.brandGreen, glowA) : undefined,
              transform: `translateY(${(dy + 28) * (1 - k)}px) rotate(${rot * (1 - k)}deg) scale(${mix(0.94, 1, k)})`,
              transformOrigin: "50% 80%",
              whiteSpace: "pre",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** One-line blur-in text. */
export const BlurText: React.FC<{ text: string; at: number; outAt?: number | null; size: number; weight?: number; color?: string; style?: React.CSSProperties }> = ({ text, at, outAt = null, size, weight = 500, color = C.ink, style }) => {
  const f = useT();
  return <div style={{ fontFamily, fontSize: size, fontWeight: weight, color, ...fx(f, at, outAt), ...style }}>{text}</div>;
};

/* ---------------------------------------------------------------- rolling numbers */

/** Slot-machine per-digit roll (easeOut, 2f stagger right-to-left). Non-digits blur in. */
export const Roll: React.FC<{ text: string; at: number; f: number; size: number; weight?: number; color?: string; dur?: number; style?: React.CSSProperties }> = ({ text, at, f, size, weight = 700, color = C.ink, dur = 14, style }) => {
  const chars = text.split("");
  const lh = size * 1.18;
  let r = 0;
  const order = chars.map((ch) => (/\d/.test(ch) ? 1 : 0));
  const rightIdx: number[] = [];
  for (let i = chars.length - 1; i >= 0; i--) {
    rightIdx[i] = r;
    if (order[i]) r++;
  }
  return (
    <span style={{ display: "inline-flex", fontFamily, fontSize: size, fontWeight: weight, color, fontVariantNumeric: "tabular-nums", lineHeight: `${lh}px`, height: lh, overflow: "hidden", ...style }}>
      {chars.map((ch, i) => {
        if (!/\d/.test(ch)) {
          const o = tw(f, at, at + 6, 0, 1);
          return (
            <span key={i} style={{ opacity: o, whiteSpace: "pre" }}>
              {ch}
            </span>
          );
        }
        const d = Number(ch);
        const s = at + rightIdx[i] * 2;
        const p = tw(f, s, s + dur, 0, 1, EASE.out);
        const pos = p * (10 + d);
        const v = Math.abs(tw(f + 0.5, s, s + dur, 0, 1, EASE.out) - tw(f - 0.5, s, s + dur, 0, 1, EASE.out)) * (10 + d);
        return (
          <span key={i} style={{ display: "inline-block", height: lh, overflow: "hidden", position: "relative" }}>
            <span style={{ display: "flex", flexDirection: "column", transform: `translateY(${-pos * lh}px)`, filter: v > 0.15 ? `blur(${Math.min(3, v * 1.6)}px)` : undefined }}>
              {Array.from({ length: 20 }, (_, k) => (
                <span key={k} style={{ height: lh }}>
                  {k % 10}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
};

/* ---------------------------------------------------------------- finger tap */

/** Soft fingertip (56px frame-space, white 40% + hairline ink border) with ripple. Coordinates in its parent space. */
export const Finger: React.FC<{ x: number; y: number; at: number; f: number; size?: number; from?: [number, number] }> = ({ x, y, at, f, size = 51, from = [70, 110] }) => {
  if (f < at - 12 || f > at + 22) return null;
  const appear = tw(f, at - 12, at - 1, 0, 1, EASE.out);
  const leave = tw(f, at + 8, at + 20, 0, 1, EASE.in);
  const px = x + from[0] * (1 - appear) + 40 * leave;
  const py = y + from[1] * (1 - appear) + 60 * leave;
  const s = f < at ? 1 : f < at + 3 ? mix(1, 0.85, tw(f, at, at + 3)) : mix(0.85, 1, sp(f, at + 3, SPRING.snap));
  const ring = tw(f, at, at + 12, 0, 1, EASE.out);
  const ringO = f >= at ? 1 - tw(f, at, at + 12, 0, 1, EASE.in) : 0;
  const op = appear * (1 - leave);
  return (
    <>
      {f >= at ? (
        <div
          style={{
            position: "absolute",
            left: x - (size * 2.2 * ring) / 2,
            top: y - (size * 2.2 * ring) / 2,
            width: size * 2.2 * ring,
            height: size * 2.2 * ring,
            borderRadius: 999,
            border: `2px solid rgba(16,17,17,${0.35 * ringO})`,
            background: `rgba(255,255,255,${0.15 * ringO})`,
            pointerEvents: "none",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: px - size / 2,
          top: py - size / 2,
          width: size,
          height: size,
          borderRadius: 999,
          background: "rgba(255,255,255,0.4)",
          border: "1px solid rgba(16,17,17,0.55)",
          boxShadow: "0 6px 16px rgba(16,17,17,.18)",
          backdropFilter: "blur(2px)",
          opacity: op,
          transform: `scale(${s})`,
          pointerEvents: "none",
        }}
      />
    </>
  );
};

/* ---------------------------------------------------------------- camera */

export const Camera: React.FC<{ scale?: number; x?: number; y?: number; rotate?: number; origin?: string; children: React.ReactNode }> = ({ scale = 1, x = 0, y = 0, rotate = 0, origin = "50% 50%", children }) => (
  <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`, transformOrigin: origin }}>{children}</AbsoluteFill>
);

/* ---------------------------------------------------------------- fleet car */

/**
 * Real fleet cut-out, used only OUTSIDE the phone. Adds a soft contact shadow, an
 * optional faint floor reflection and a directional (horizontal) motion blur.
 */
export const FleetCar: React.FC<{
  id: string;
  src: string;
  w: number;
  aspect: number; // h / w of the PNG
  x: number; // centre x
  ground: number; // y of the contact line
  flip?: boolean;
  opacity?: number;
  dip?: number;
  pitch?: number;
  blurX?: number;
  reflection?: boolean;
  glint?: number;
  extraFilter?: string;
}> = ({ id, src, w, aspect, x, ground, flip = false, opacity = 1, dip = 0, pitch = 0, blurX = 0, reflection = true, glint = -1, extraFilter }) => {
  const h = w * aspect;
  const fid = `mb-${id}`;
  const filt = [blurX > 0.3 ? `url(#${fid})` : "", extraFilter ?? ""].join(" ").trim() || undefined;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: ground - h, width: w, height: h, opacity }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={fid} x="-30%" y="-10%" width="160%" height="120%">
          <feGaussianBlur stdDeviation={`${blurX.toFixed(2)} 0`} />
        </filter>
      </svg>
      {/* contact shadow */}
      <div
        style={{
          position: "absolute",
          left: w * 0.06,
          top: h - h * 0.07 + dip,
          width: w * 0.88,
          height: h * 0.11,
          borderRadius: "50%",
          background: "rgba(16,17,17,.25)",
          filter: `blur(${Math.max(8, w * 0.018) + blurX * 0.4}px)`,
        }}
      />
      {reflection ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: h - 4 + dip,
            width: w,
            height: h,
            transform: `scaleY(-1) ${flip ? "scaleX(-1)" : ""}`,
            opacity: 0.1,
            WebkitMaskImage: "linear-gradient(0deg, rgba(0,0,0,.9) 0%, rgba(0,0,0,0) 32%)",
            maskImage: "linear-gradient(0deg, rgba(0,0,0,.9) 0%, rgba(0,0,0,0) 32%)",
            filter: filt,
          }}
        >
          <Asset src={src} w={w} h={h} />
        </div>
      ) : null}
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${dip}px) rotate(${pitch}deg) ${flip ? "scaleX(-1)" : ""}`, transformOrigin: "50% 90%", filter: filt }}>
        <Asset src={src} w={w} h={h} />
        {glint > 0 && glint < 1 ? (
          <div
            style={{
              position: "absolute",
              left: w * 0.06,
              top: h * 0.45,
              width: w * 0.14,
              height: w * 0.14,
              borderRadius: 999,
              background: "radial-gradient(circle, rgba(255,255,255,.95) 0%, rgba(255,255,255,.4) 30%, rgba(255,255,255,0) 70%)",
              opacity: Math.sin(glint * Math.PI),
              transform: `scale(${0.6 + glint})`,
              mixBlendMode: "screen",
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- misc */

export const IconChip: React.FC<{ icon: React.ReactNode; size?: number; bg?: string; style?: React.CSSProperties }> = ({ icon, size = 64, bg = C.white, style }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.32, background: bg, boxShadow: SHADOW, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{icon}</div>
);

export const Bloom: React.FC<{ color?: string; x?: string; y?: string; size?: number; opacity?: number }> = ({ color = C.mintPill, x = "50%", y = "50%", size = 70, opacity = 1 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at ${x} ${y}, ${color} 0%, rgba(255,255,255,0) ${size}%)`, opacity }} />
);

export { clamp };

/**
 * One fingertip for a whole list of taps. Taps closer than `chainGap` frames share a finger
 * that travels between them instead of a second finger appearing.
 */
export const FingerTrack: React.FC<{ f: number; taps: [number, number, number][]; size?: number; chainGap?: number }> = ({ f, taps, size = 51, chainGap = 22 }) => {
  const sorted = [...taps].sort((a, b) => a[0] - b[0]);
  const chains: [number, number, number][][] = [];
  for (const t of sorted) {
    const last = chains[chains.length - 1];
    if (last && t[0] - last[last.length - 1][0] <= chainGap) last.push(t);
    else chains.push([t]);
  }
  const chain = chains.find((c) => f >= c[0][0] - 12 && f <= c[c.length - 1][0] + 10);
  if (!chain) return null;
  const first = chain[0];
  const lastT = chain[chain.length - 1];
  const appear = tw(f, first[0] - 12, first[0] - 1, 0, 1, EASE.out);
  const leave = tw(f, lastT[0] + 4, lastT[0] + 10, 0, 1, EASE.in);
  let x = first[1] + 70 * (1 - appear);
  let y = first[2] + 110 * (1 - appear);
  for (let i = 0; i < chain.length - 1; i++) {
    const [a, ax, ay] = chain[i];
    const [b, bx, by] = chain[i + 1];
    if (f >= a + 3) {
      const m = tw(f, a + 3, b - 1, 0, 1, EASE.inOut);
      x = mix(ax, bx, m);
      y = mix(ay, by, m);
    }
  }
  x += 40 * leave;
  y += 60 * leave;
  let s = 1;
  for (const [at] of chain) {
    if (f >= at && f < at + 3) s = mix(1, 0.85, tw(f, at, at + 3));
    else if (f >= at + 3 && f < at + 16) s = mix(0.85, 1, sp(f, at + 3, SPRING.snap));
  }
  return (
    <>
      {chain.map(([at, tx, ty]) => {
        if (f < at || f > at + 12) return null;
        const ring = tw(f, at, at + 12, 0, 1, EASE.out);
        const ringO = 1 - tw(f, at, at + 12, 0, 1, EASE.in);
        const d = size * 2.2 * ring;
        return <div key={at} style={{ position: "absolute", left: tx - d / 2, top: ty - d / 2, width: d, height: d, borderRadius: 999, border: `2px solid rgba(16,17,17,${0.35 * ringO})`, background: `rgba(255,255,255,${0.15 * ringO})` }} />;
      })}
      <div
        style={{
          position: "absolute",
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: 999,
          background: "rgba(255,255,255,0.4)",
          border: "1px solid rgba(16,17,17,0.55)",
          boxShadow: "0 6px 16px rgba(16,17,17,.18)",
          opacity: appear * (1 - leave),
          transform: `scale(${s})`,
        }}
      />
    </>
  );
};

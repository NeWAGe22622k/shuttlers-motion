import React from "react";
import { AbsoluteFill, Audio, random, staticFile, useCurrentFrame } from "remotion";
import { EASE } from "../config/brand";
import { T } from "../config/time";
import { assetExists, Grain } from "../components/core";
import { mix, tw } from "../components/motion";
import type { EduCard } from "./content";
import { SMark } from "./kit";
import { BLACK, FORMATS, Fmt, pairColours } from "./theme";

/**
 * Motion engine shared by the education videos (the launch film's motion language inside the
 * brief's rules): a camera that never stops (push-in per card, drift, a pulse on every beat that
 * rests in the silences), transitions with directional motion blur, drifting particles and a soft
 * glow for depth. Scenes draw the content; the engine moves it.
 */

export type Cam = { s: number; x: number; y: number; r: number };
export type Ctx = {
  f: number;
  card: EduCard;
  fg: string;
  bg: string;
  F: (typeof FORMATS)[Fmt];
  fmt: Fmt;
  out?: number; // frame at which this card's words fly out
  next?: number;
  cam?: Cam;
};
export type Trans = "none" | "cut" | "flash" | "whip" | "whipV" | "zoom" | "circle";

const TD = 9; // transition length in frames (lands on the beat)

const inSilence = (f: number, silences: [number, number][]) => silences.some(([a, b]) => f >= a && f < b);

export const camera = (f: number, card: EduCard, next: number, silences: [number, number][], beatsFrom: number): Cam => {
  const p = Math.max(0, Math.min(1, (f - card.at) / Math.max(1, next - card.at)));
  const still = inSilence(f, silences);
  const push = 1 + 0.07 * EASE.out(p);
  const k = (f - beatsFrom) % T.beat;
  const pulse = f >= beatsFrom && !still ? 0.016 * Math.exp(-k / 3.2) : 0;
  const amp = still ? 0.35 : 1;
  return { s: push * (1 + pulse), x: 12 * Math.sin(f / 37) * amp, y: 9 * Math.sin(f / 49 + 1) * amp, r: 0.7 * Math.sin(f / 61) * amp };
};

/** Directional (x/y) motion blur on a whole layer. */
const DirBlur: React.FC<{ id: string; x: number; y: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ id, x, y, children, style }) => (
  <AbsoluteFill style={{ filter: x + y > 0.4 ? `url(#${id})` : undefined, ...style }}>
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation={`${x.toFixed(2)} ${y.toFixed(2)}`} />
      </filter>
    </svg>
    {children}
  </AbsoluteFill>
);

/** Drifting specks in the frame's accent (depth + constant motion). */
const Particles: React.FC<{ f: number; color: string; W: number; H: number; still: boolean }> = ({ f, color, W, H, still }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {Array.from({ length: 30 }, (_, i) => {
      const sp = still ? 0.15 : 1;
      const x = (random(`px${i}`) * W + Math.sin(f / (30 + i) + i) * 30 + f * (random(`pv${i}`) - 0.5) * 0.6 * sp) % W;
      const y = ((random(`py${i}`) * H - f * (0.4 + random(`pu${i}`) * 1.4) * sp) % H + H) % H;
      const s = 3 + random(`ps${i}`) * 7;
      return <div key={i} style={{ position: "absolute", left: (x + W) % W, top: y, width: s, height: s, borderRadius: 99, background: color, opacity: 0.12 + random(`po${i}`) * 0.3 }} />;
    })}
  </AbsoluteFill>
);

/** Soft glow that drifts behind the content (same hue as the accent, so still one accent per frame). */
const Glow: React.FC<{ f: number; fg: string; bg: string; W: number; H: number }> = ({ f, fg, bg, W, H }) => {
  const x = W * (0.5 + 0.25 * Math.sin(f / 70));
  const y = H * (0.55 + 0.15 * Math.sin(f / 53));
  const dark = bg === BLACK;
  return <AbsoluteFill style={{ background: `radial-gradient(circle at ${x}px ${y}px, ${dark ? fg + "26" : "#00000014"} 0%, transparent ${Math.round(W * 0.75)}px)` }} />;
};

export type FilmSpec = {
  cards: EduCard[];
  scenes: ((c: Ctx) => React.ReactNode)[];
  trans: Trans[]; // transition INTO card i
  origins?: ({ x: number; y: number } | undefined)[]; // circle-wipe origins (frame px)
  silences: [number, number][];
  beatsFrom: number;
  duration: number;
  audio: string;
  special?: (f: number, layer: (i: number, fr: number) => React.ReactNode) => React.ReactNode | null;
};

export const Film: React.FC<{ spec: FilmSpec; fmt: Fmt }> = ({ spec, fmt }) => {
  const f = useCurrentFrame();
  const F = FORMATS[fmt];
  const { cards, scenes, trans, silences, beatsFrom } = spec;
  let idx = 0;
  for (let i = 0; i < cards.length; i++) if (f >= cards[i].at) idx = i;
  const nextAt = (i: number) => (i + 1 < cards.length ? cards[i + 1].at : spec.duration);

  /** One card, fully dressed: background, glow, particles, camera, content. */
  const layer = (i: number, fr: number) => {
    const c = cards[i];
    const { fg, bg } = pairColours(c.pair);
    const cam = camera(fr, c, nextAt(i), silences, beatsFrom);
    const still = inSilence(fr, silences);
    const ctx: Ctx = { f: fr, card: c, fg, bg, F, fmt, out: nextAt(i) - 3, next: nextAt(i), cam };
    return (
      <AbsoluteFill style={{ background: bg }}>
        {c.pair !== "X" ? <Glow f={fr} fg={fg} bg={bg} W={F.W} H={F.H} /> : null}
        {c.pair !== "X" ? (
          <AbsoluteFill style={{ transform: `translate(${cam.x * 1.6}px, ${cam.y * 1.6}px)` }}>
            <Particles f={fr} color={fg} W={F.W} H={F.H} still={still} />
          </AbsoluteFill>
        ) : null}
        <AbsoluteFill style={{ transform: `translate(${cam.x}px, ${cam.y}px) rotate(${cam.r}deg) scale(${cam.s})`, transformOrigin: "50% 52%" }}>{scenes[i](ctx)}</AbsoluteFill>
      </AbsoluteFill>
    );
  };

  const special = spec.special ? spec.special(f, layer) : null;
  const card = cards[idx];
  const t = trans[idx] ?? "cut";
  const inT = idx > 0 && f < card.at + TD && t !== "none" && t !== "cut" && t !== "flash";
  let body: React.ReactNode;
  if (special) body = special;
  else if (!inT) {
    const flash = (t === "flash" || t === "cut") && idx > 0 ? 1 - tw(f, card.at, card.at + 5) : 0;
    body = (
      <>
        {layer(idx, f)}
        {t === "flash" && flash > 0 ? <AbsoluteFill style={{ background: pairColours(card.pair).fg, opacity: 0.55 * flash, mixBlendMode: "screen" }} /> : null}
      </>
    );
  } else {
    const q = tw(f, card.at, card.at + TD, 0, 1, EASE.inOut);
    const qIn = tw(f, card.at, card.at + TD - 1, 0, 1, EASE.out);
    const vel = (fn: (x: number) => number) => Math.abs(fn(f + 0.5) - fn(f - 0.5));
    const dir = idx % 2 ? 1 : -1;
    if (t === "whip" || t === "whipV") {
      const L = t === "whip" ? F.W : F.H;
      const outPos = (x: number) => -dir * tw(x, card.at, card.at + TD, 0, 1, EASE.inOut) * L * 0.7;
      const inPos = (x: number) => dir * (1 - tw(x, card.at, card.at + TD - 1, 0, 1, EASE.out)) * L;
      const bo = Math.min(40, vel(outPos) * 0.35);
      const bi = Math.min(40, vel(inPos) * 0.35);
      const tr = (v: number) => (t === "whip" ? `translateX(${v}px)` : `translateY(${v}px)`);
      body = (
        <>
          <DirBlur id={`o${idx}`} x={t === "whip" ? bo : 0} y={t === "whipV" ? bo : 0} style={{ transform: tr(outPos(f)) }}>
            {layer(idx - 1, f)}
          </DirBlur>
          <DirBlur id={`i${idx}`} x={t === "whip" ? bi : 0} y={t === "whipV" ? bi : 0} style={{ transform: tr(inPos(f)) }}>
            {layer(idx, f)}
          </DirBlur>
        </>
      );
    } else if (t === "zoom") {
      body = (
        <>
          <AbsoluteFill style={{ transform: `scale(${1 + 0.9 * q})`, opacity: 1 - q, filter: `blur(${16 * q}px)` }}>{layer(idx - 1, f)}</AbsoluteFill>
          <AbsoluteFill style={{ transform: `scale(${mix(0.8, 1, qIn)})`, opacity: Math.min(1, qIn * 1.6), filter: qIn < 1 ? `blur(${14 * (1 - qIn)}px)` : undefined }}>{layer(idx, f)}</AbsoluteFill>
        </>
      );
    } else {
      // circle wipe from an origin, with a ring in the incoming accent at its edge
      const o = spec.origins?.[idx] ?? { x: F.W / 2, y: F.H / 2 };
      const r = mix(0, Math.hypot(F.W, F.H), tw(f, card.at, card.at + TD, 0, 1, EASE.in));
      const { fg } = pairColours(card.pair);
      body = (
        <>
          {layer(idx - 1, f)}
          <AbsoluteFill style={{ clipPath: `circle(${r}px at ${o.x}px ${o.y}px)` }}>{layer(idx, f)}</AbsoluteFill>
          <div style={{ position: "absolute", left: o.x - r, top: o.y - r, width: r * 2, height: r * 2, borderRadius: 9999, boxShadow: `0 0 0 8px ${fg}, 0 0 40px 10px ${fg}88`, opacity: r > 2 ? 1 : 0 }} />
        </>
      );
    }
  }

  const { fg } = pairColours(card.pair);
  const k = (f - beatsFrom) % T.beat;
  const markPulse = f >= beatsFrom && !inSilence(f, silences) ? 1 + 0.06 * Math.exp(-k / 3) : 1;
  return (
    <AbsoluteFill style={{ background: BLACK, width: F.W, height: F.H, overflow: "hidden" }}>
      {body}
      {card.pair !== "X" && idx > 0 && idx < cards.length - 1 ? (
        <div style={{ position: "absolute", right: F.mark.right, bottom: F.mark.bottom, transform: `scale(${markPulse})`, transformOrigin: "100% 100%" }}>
          <SMark size={F.mark.size} color={fg} />
        </div>
      ) : null}
      <Grain opacity={0.025} />
      {assetExists(spec.audio) ? <Audio src={staticFile(spec.audio)} /> : null}
    </AbsoluteFill>
  );
};

/** Expanding shockwave ring (pin drops, clock snaps, landings). */
export const Shock: React.FC<{ f: number; at: number; color: string; size?: number; flat?: number }> = ({ f, at, color, size = 300, flat = 1 }) => {
  if (f < at || f > at + 16) return null;
  const p = tw(f, at, at + 16, 0, 1, EASE.out);
  const s = size * (0.2 + p);
  return <div style={{ position: "absolute", left: -s / 2, top: (-s * flat) / 2, width: s, height: s * flat, borderRadius: "50%", border: `${6 * (1 - p) + 1}px solid ${color}`, opacity: 1 - p }} />;
};

/** Ghost trail behind something moving fast (render fn at earlier frames, fading). */
export const Trailing: React.FC<{ f: number; n?: number; lag?: number; render: (fr: number) => React.ReactNode }> = ({ f, n = 3, lag = 1.6, render }) => (
  <>
    {Array.from({ length: n }, (_, i) => n - i).map((i) => (
      <AbsoluteFill key={i} style={{ opacity: 0.22 * (1 - i / (n + 1)) }}>
        {render(f - i * lag)}
      </AbsoluteFill>
    ))}
    <AbsoluteFill>{render(f)}</AbsoluteFill>
  </>
);

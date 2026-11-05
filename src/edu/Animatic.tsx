import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/fonts";
import { getInfo } from "@remotion/google-fonts/Poppins";
import { EASE } from "../config/brand";
import { T } from "../config/time";
import { assetExists } from "../components/core";
import { mix, sp, tw } from "../components/motion";
import { EDU, END_LINE, EduCard, Seg } from "./content";

// Poppins (brief), vendored woff2: the renderer here can't reach fonts.gstatic.com.
export const POPPINS = "Poppins";
const ranges = getInfo().unicodeRanges as Record<string, string>;
for (const w of ["400", "500", "600", "700", "800"]) {
  for (const s of ["latin", "latin-ext"]) {
    loadFont({ family: POPPINS, url: staticFile(`fonts/Poppins-${w}-${s}.woff2`), weight: w, style: "normal", unicodeRange: ranges[s], format: "woff2" });
  }
}

export const GREEN = "#20E682";
export const BLACK = "#000000";
const W = 1080;
const H = 1920;
const PAD = 96;

const colours = (pair: EduCard["pair"]) => (pair === "K" ? { bg: GREEN, fg: BLACK } : { bg: BLACK, fg: pair === "X" ? BLACK : GREEN });

/** Right-pointing arrow drawn as a vector (Poppins' latin subset has no → glyph). */
const Arrow: React.FC<{ size: number; color: string; p?: number }> = ({ size, color, p = 1 }) => (
  <svg width={size * 1.6} height={size} viewBox="0 0 160 100" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M6 50 H140 M98 10 L144 50 L98 90" fill="none" stroke={color} strokeWidth={14} strokeLinecap="square" strokeDasharray={300} strokeDashoffset={300 * (1 - p)} />
  </svg>
);

/** Capital S mark, tinted to the card's one accent (mask over the brand SVG). Icon alone → always on the right. */
const SMark: React.FC<{ size: number; color: string; style?: React.CSSProperties }> = ({ size, color, style }) => (
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

/** Booth-style entrance: word drops in with vertical motion blur, settling on a snap spring. */
const wordStyle = (f: number, at: number): React.CSSProperties => {
  if (f < at) return { opacity: 0 };
  const k = sp(f, at, { damping: 18, stiffness: 260 });
  const v = Math.abs(sp(f + 0.5, at, { damping: 18, stiffness: 260 }) - sp(f - 0.5, at, { damping: 18, stiffness: 260 }));
  return {
    opacity: tw(f, at, at + 3),
    transform: `translateY(${(1 - k) * 90}px)`,
    filter: v > 0.02 ? `blur(${Math.min(14, v * 60)}px)` : undefined,
  };
};

const fitSize = (lines: Seg[][]) => {
  const longest = Math.max(...lines.map((l) => l.map((s) => s.t).join(" ").length), 4);
  return Math.max(84, Math.min(200, (W - PAD * 2) / (longest * 0.58)));
};

const Card: React.FC<{ card: EduCard; next: number; f: number; first: boolean }> = ({ card, f, first }) => {
  const { bg, fg } = colours(card.pair);
  const wipe = first ? 1 : tw(f, card.at, card.at + 6, 0, 1, EASE.out);
  const size = fitSize(card.lines);
  // assign an entrance frame to every word (punch cards: one per beat)
  let wi = 0;
  const lineAt = (li: number) => (card.punchBy === "line" && card.punch ? card.punch[li] : null);
  return (
    <AbsoluteFill style={{ background: bg, clipPath: `inset(0 0 0 ${(1 - wipe) * 100}%)` }}>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: size * 0.08 }}>
        {card.lines.map((line, li) => (
          <div key={li} style={{ display: "flex", flexWrap: "wrap", columnGap: size * 0.26, fontFamily: POPPINS, fontSize: size, lineHeight: 1.02, letterSpacing: -size * 0.035, color: fg }}>
            {line.flatMap((seg) =>
              seg.t.split(" ").map((w) => {
                const idx = wi++;
                const at = card.punchBy === "word" && card.punch ? card.punch[idx] : lineAt(li) ?? card.at + 1 + idx * 2;
                return (
                  <span key={`${li}-${idx}`} style={{ fontWeight: seg.b ? 800 : 500, display: "inline-block", ...wordStyle(f, at) }}>
                    {w}
                  </span>
                );
              }),
            )}
          </div>
        ))}
        {card.arrow ? (
          <div style={{ marginTop: size * 0.2, ...wordStyle(f, card.at + 6) }}>
            <Arrow size={size * 0.9} color={fg} p={tw(f, card.at + 6, card.at + 16, 0, 1, EASE.out)} />
          </div>
        ) : null}
        {card.sub
          ? card.sub.map((line, i) => (
              <div key={`s${i}`} style={{ display: "flex", alignItems: "center", gap: 22, fontFamily: POPPINS, fontSize: 64, fontWeight: 500, color: fg, marginTop: 30, ...wordStyle(f, card.at + 8) }}>
                {line.map((s, j) => (s.t === "→" ? <Arrow key={j} size={46} color={fg} /> : <span key={j}>{s.t}</span>))}
              </div>
            ))
          : null}
      </div>
      {card.end ? (
        <>
          <div style={{ position: "absolute", left: PAD, bottom: 210, fontFamily: POPPINS, fontSize: 60, fontWeight: 700, color: fg, letterSpacing: -1, ...wordStyle(f, card.at + 10) }}>{END_LINE}</div>
          <div style={{ position: "absolute", right: PAD, bottom: 190, transform: `scale(${mix(0.6, 1, sp(f, card.at + 6))})`, transformOrigin: "100% 100%", opacity: tw(f, card.at + 6, card.at + 10) }}>
            <SMark size={150} color={fg} />
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/** Timing guide: timecode, bar.beat, card number and the brief's motion note for the card on screen. */
const Guides: React.FC<{ f: number; title: string; card: EduCard; idx: number }> = ({ f, title, card, idx }) => {
  const sec = Math.floor(f / 30);
  const ff = String(f % 30).padStart(2, "0");
  const bar = Math.floor(f / T.bar) + 1;
  const beat = Math.floor((f % T.bar) / T.beat) + 1;
  const style: React.CSSProperties = { position: "absolute", left: 40, right: 40, fontFamily: POPPINS, fontSize: 26, fontWeight: 600, color: card.pair === "K" ? BLACK : "#FFFFFF", opacity: 0.7, letterSpacing: 0.5 };
  return (
    <>
      <div style={{ ...style, top: 36, display: "flex", justifyContent: "space-between" }}>
        <span>ANIMATIC · {title}</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          0:{String(sec).padStart(2, "0")}.{ff} · bar {bar}.{beat} · card {idx + 1}
        </span>
      </div>
      <div style={{ ...style, bottom: 40, fontSize: 24, fontWeight: 500, opacity: 0.85 }}>{card.motion}</div>
    </>
  );
};

export const EduAnimatic: React.FC<{ video: "v1" | "v2"; guides?: boolean }> = ({ video, guides = true }) => {
  const f = useCurrentFrame();
  const V = EDU[video];
  const cards = V.cards;
  let idx = 0;
  for (let i = 0; i < cards.length; i++) if (f >= cards[i].at) idx = i;
  const prev = idx > 0 ? cards[idx - 1] : null;
  const cur = cards[idx];
  const next = idx + 1 < cards.length ? cards[idx + 1].at : T.edu.duration;
  const score = `audio/edu/score-edu${video.slice(1)}.wav`;
  return (
    <AbsoluteFill style={{ background: BLACK, width: W, height: H }}>
      {prev && f < cur.at + 7 ? <Card card={prev} next={cur.at} f={f} first /> : null}
      <Card card={cur} next={next} f={f} first={idx === 0} />
      {guides ? <Guides f={f} title={V.title} card={cur} idx={idx} /> : null}
      {assetExists(score) ? <Audio src={staticFile(score)} /> : null}
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { C, EASE, SPRING, fontFamily } from "../config/brand";
import { content } from "../config/content";
import { T, useFlags, useT } from "../config/time";
import { AppIcon, Capsule, IconChip, TypingDots, Vignette } from "../components/core";
import { I } from "../components/Icons";
import { fx, mix, sp, tw } from "../components/motion";
import { useFontsReady } from "../components/useFontsReady";

const S = T.hero.s1;
const SIZE = 56;
const WEIGHT = 600;
const LINE_H = 70;
const PAD_X = 40;
const PAD_Y = 26;
const LINES = [4, 2]; // words per line: "Need a safe, on-demand" / "ride-hailing service?"
const RIGHT = 1330; // outgoing bubble is right-anchored (chat style)
const TOP = 392;

export const S1Question: React.FC = () => {
  const f = useT();
  const flags = useFlags();
  const ready = useFontsReady();
  const words = content.s1.question.split(" ");
  const space = ready ? measureText({ text: " ", fontFamily, fontSize: SIZE, fontWeight: String(WEIGHT) }).width : 15;
  const widths = words.map((w) => (ready ? measureText({ text: w, fontFamily, fontSize: SIZE, fontWeight: String(WEIGHT) }).width : w.length * 28));
  const at = words.map((_, i) => S.wordsStart + i * S.wordStep);

  // layout: per-word x offset inside its line
  const pos: { line: number; x: number }[] = [];
  let idx = 0;
  LINES.forEach((n, li) => {
    let x = 0;
    for (let k = 0; k < n; k++, idx++) {
      pos.push({ line: li, x });
      x += widths[idx] + space;
    }
  });

  // bubble grows on a spring as each word arrives
  const lineW = [0, 0];
  words.forEach((_, i) => {
    const k = sp(f, at[i], SPRING.snap);
    lineW[pos[i].line] += (widths[i] + (pos[i].x > 0 ? space : 0)) * k;
  });
  const dotsW = 132;
  const textW = Math.max(lineW[0], lineW[1]);
  const firstK = sp(f, at[0], SPRING.snap);
  const bw = mix(dotsW, textW + PAD_X * 2, firstK);
  const line2 = sp(f, at[LINES[0]], SPRING.snap);
  const bh = PAD_Y * 2 + LINE_H + LINE_H * line2;
  const left = RIGHT - bw;

  const chips = !flags.cutdown;
  const safeIdx = 2;
  const odIdx = 3;
  const underline = (i: number, t0: number) => {
    const p = tw(f, t0, t0 + 9, 0, 1, EASE.out);
    if (p <= 0) return null;
    return (
      <div
        style={{
          position: "absolute",
          left: left + PAD_X + pos[i].x,
          top: TOP + PAD_Y + pos[i].line * LINE_H + 60,
          width: (widths[i] - (i === safeIdx ? 14 : 0)) * p,
          height: 6,
          borderRadius: 6,
          background: C.mint,
          boxShadow: `0 0 12px rgba(247,255,250,${0.6 * p})`,
        }}
      />
    );
  };
  const chipPop = (t0: number) => sp(f, t0, SPRING.pop);

  // incoming reply bubble (Shuttlers), its typing dots are the Pod capsule
  const reply = sp(f, S.replyIn, SPRING.pop);
  const replyY = TOP + bh + 46;

  return (
    <AbsoluteFill style={{ background: C.night, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 52% 48%, rgba(80,170,105,.10) 0%, rgba(80,170,105,0) 42%)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: TOP - 62, textAlign: "center", fontFamily, fontSize: 26, fontWeight: 500, color: "#8B8F95", ...fx(f, -12) }}>{content.s1.time}</div>

      {/* outgoing bubble */}
      <div style={{ position: "absolute", left, top: TOP, width: bw, height: bh, borderRadius: 38, background: C.ctaGreen, boxShadow: "0 20px 60px rgba(32,230,130,.18)" }}>
        <svg width="34" height="30" viewBox="0 0 34 30" style={{ position: "absolute", right: -9, bottom: -2 }}>
          <path d="M0 0 C 4 18 14 26 34 30 C 18 30 6 26 0 22 Z" fill={C.ctaGreen} />
        </svg>
        <div style={{ position: "absolute", left: 0, top: 0, width: bw, height: bh, display: "flex", alignItems: "center", justifyContent: "center", opacity: 1 - tw(f, at[0] - 2, at[0] + 3) }}>
          <TypingDots f={f} color={C.ink} size={13} gap={10} />
        </div>
      </div>
      {words.map((w, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: left + PAD_X + pos[i].x,
            top: TOP + PAD_Y + pos[i].line * LINE_H,
            fontFamily,
            fontSize: SIZE,
            fontWeight: WEIGHT,
            color: C.ink,
            lineHeight: `${LINE_H}px`,
            whiteSpace: "pre",
            letterSpacing: 0,
            ...fx(f, at[i], null, { dy: 18, blur: 12 }),
          }}
        >
          {w}
        </div>
      ))}
      {underline(safeIdx, S.safeHit)}
      {underline(odIdx, S.onDemandHit)}
      {chips && f >= S.safeHit ? (
        <div style={{ position: "absolute", left: left - 46, top: TOP - 58, transform: `scale(${chipPop(S.safeHit)}) rotate(${(1 - chipPop(S.safeHit)) * -24}deg)` }}>
          <IconChip icon={<I.shield size={34} color={C.priceGreen} stroke={2.2} />} size={76} bg={C.mintPill} />
        </div>
      ) : null}
      {chips && f >= S.onDemandHit ? (
        <div style={{ position: "absolute", left: RIGHT - 40, top: TOP - 66, transform: `scale(${chipPop(S.onDemandHit)}) rotate(${(1 - chipPop(S.onDemandHit)) * 24}deg)` }}>
          <IconChip icon={<I.bolt size={34} color={C.priceGreen} stroke={2.2} />} size={76} bg={C.mintPill} />
        </div>
      ) : null}

      {/* incoming reply */}
      {f >= S.replyIn ? (
        <div style={{ position: "absolute", left: 590, top: replyY, display: "flex", alignItems: "flex-end", gap: 16, opacity: Math.min(1, reply * 1.6), transform: `translateY(${(1 - reply) * 26}px) scale(${mix(0.7, 1, reply)})`, transformOrigin: "0% 100%" }}>
          <AppIcon size={52} shadow={false} />
          <div style={{ width: 150, height: 86, borderRadius: 34, background: C.bubbleDark, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Capsule cx={0} cy={0} w={86} h={36} style={{ position: "relative", left: 0, top: 0 }}>
              <TypingDots f={f} color={C.ink} size={9} gap={7} />
            </Capsule>
          </div>
        </div>
      ) : null}
      <Vignette strength={0.6} />
    </AbsoluteFill>
  );
};

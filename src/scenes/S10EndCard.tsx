import React from "react";
import { AbsoluteFill } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { C, EASE, SPRING, TYPE, fontFamily } from "../config/brand";
import { content } from "../config/content";
import { T, useT } from "../config/time";
import { AppIcon, Asset, Bloom, Capsule, SettleWords } from "../components/core";
import { drift, fx, mix, sp, tw } from "../components/motion";
import { useFontsReady } from "../components/useFontsReady";
import { CAPSULE_POS } from "./S9Recap";

const S = T.hero.s10;
const S10 = content.s10;
const LOCK = 76;

export const S10EndCard: React.FC = () => {
  const f = useT();
  const ready = useFontsReady();
  const d = drift(f);
  const icon = sp(f, S.icon, SPRING.pop);
  const glint = tw(f, S.icon + 3, S.icon + 13, 0, 1, EASE.inOut);
  const lock = fx(f, S.lockup);
  // lockup metrics (centred), capsule underline beneath "Pod"
  const wA = ready ? measureText({ text: `${S10.lockupA} `, fontFamily, fontSize: LOCK, fontWeight: "700" }).width : 380;
  const wB = ready ? measureText({ text: S10.lockupB, fontFamily, fontSize: LOCK, fontWeight: "700" }).width : 150;
  const lockLeft = 960 - (wA + wB) / 2;
  const podCx = lockLeft + wA + wB / 2;
  const LOCK_TOP = 410;
  const underY = LOCK_TOP + LOCK + 16;
  const slide = tw(f, S.lockup, S.lockup + 14, 0, 1, EASE.inOut);
  const capX = mix(CAPSULE_POS.x, podCx, slide);
  const capY = mix(CAPSULE_POS.y, underY, slide);
  const capW = mix(72, wB, slide);
  const capH = mix(30, 10, slide);
  const pills = [
    { label: S10.pills[0], src: "vehicles/app-daily-bus-onwhite.png", w: 62, pod: false },
    { label: S10.pills[1], src: "vehicles/app-pod-car.png", w: 64, pod: true },
    { label: S10.pills[2], src: "vehicles/app-rent-tag-onwhite.png", w: 34, pod: false },
  ];
  return (
    <AbsoluteFill style={{ background: C.white }}>
      <Bloom size={58} />
      <AbsoluteFill style={{ transform: `translateY(${d.y * 0.6}px)` }}>
        <div style={{ position: "absolute", left: 960 - 85, top: 205, transform: `scale(${icon})` }}>
          <AppIcon size={170} glint={glint} />
        </div>
        <div style={{ position: "absolute", left: lockLeft, top: LOCK_TOP, display: "flex", fontFamily, fontSize: LOCK, fontWeight: 700, letterSpacing: 0, whiteSpace: "pre", lineHeight: `${LOCK + 6}px`, ...lock }}>
          <span style={{ color: C.ink }}>{`${S10.lockupA} `}</span>
          <span style={{ color: C.brandGreen }}>{S10.lockupB}</span>
        </div>
        <Capsule cx={capX} cy={capY} w={capW} h={capH} glowAmt={0.8} />
        <SettleWords text={S10.tagline} at={S.tagline} size={TYPE.hero} align="center" accents={{ Pod: C.brandGreen }} seed="s10" style={{ position: "absolute", left: 0, right: 0, top: 560 }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 752, display: "flex", justifyContent: "center", gap: 18 }}>
          {pills.map((p, i) => {
            const at = S.pills + i * 3;
            const k = sp(f, at, SPRING.pop);
            const bounce = p.pod ? sp(f, at + 6, SPRING.pop) : 1;
            return (
              <div key={p.label} style={{ height: 66, padding: "0 26px 0 16px", borderRadius: 99, display: "flex", alignItems: "center", gap: 12, background: p.pod ? C.ctaGreen : C.white, border: p.pod ? "none" : `2px solid ${C.border}`, boxShadow: p.pod ? "0 10px 30px rgba(32,230,130,.35)" : undefined, fontFamily, fontSize: 30, fontWeight: 700, color: C.ink, opacity: Math.min(1, k * 1.5), transform: `translateY(${(1 - k) * 24}px) scale(${mix(0.7, 1, k) * (p.pod ? mix(1.12, 1, bounce) : 1)})` }}>
                <div style={{ width: 66, display: "flex", justifyContent: "center" }}>
                  <Asset src={p.src} w={p.w} style={p.pod ? undefined : { mixBlendMode: "multiply" }} />
                </div>
                {p.label}
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 866, textAlign: "center", fontFamily, fontSize: TYPE.small, fontWeight: 500, color: C.muted, ...fx(f, S.cta) }}>{S10.cta}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

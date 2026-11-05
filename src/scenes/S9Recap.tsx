import React from "react";
import { AbsoluteFill } from "remotion";
import { C, EASE, SPRING } from "../config/brand";
import { content } from "../config/content";
import { T, useT } from "../config/time";
import { Capsule, FleetCar, IconChip, SettleWords, Vignette } from "../components/core";
import { I } from "../components/Icons";
import { sp, speedBlur, tw } from "../components/motion";

const S = T.hero.s9;
export const CAPSULE_POS = { x: 960, y: 690 };
const BGS = [C.night, C.white, C.night, C.white];
const ICONS = [I.bolt, I.door, I.flat, I.shield];
const CARS: ({ src: string; aspect: number; w: number; flip: boolean } | null)[] = [
  { src: "vehicles/fleet-b-side-left.png", aspect: 315 / 698, w: 600, flip: true },
  { src: "vehicles/fleet-a-side-right.png", aspect: 322 / 794, w: 640, flip: false },
  { src: "vehicles/fleet-c-side-left-long.png", aspect: 434 / 1083, w: 660, flip: true },
  null,
];

const Flash: React.FC<{ i: number; f: number }> = ({ i, f }) => {
  const t0 = S.flashes[i];
  const dark = BGS[i] === C.night;
  const fg = dark ? C.white : C.ink;
  // circle wipe from the capsule (flash 0 inherits the S8 wipe)
  const r = i === 0 ? 2400 : 2400 * tw(f, t0, t0 + S.wipeDur, 0, 1, EASE.in);
  const chip = sp(f, t0 + 1, SPRING.pop);
  const cap = sp(f, t0 + 3, SPRING.pop);
  const Ico = ICONS[i];
  const car = CARS[i];
  const carX = (x: number) => -700 + 3320 * tw(x, t0, t0 + S.whipDur, 0, 1, EASE.inOut);
  const words = content.s9.words[i];
  return (
    <AbsoluteFill style={{ clipPath: `circle(${r}px at ${CAPSULE_POS.x}px ${CAPSULE_POS.y}px)`, background: BGS[i] }}>
      {dark ? <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, rgba(80,170,105,.12) 0%, rgba(80,170,105,0) 45%)" }} /> : <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${C.mintPill} 0%, rgba(255,255,255,0) 55%)` }} />}
      {car && f >= t0 && f <= t0 + S.whipDur + 1 ? <FleetCar id={`whip${i}`} src={car.src} w={car.w} aspect={car.aspect} x={carX(f)} ground={960} flip={car.flip} reflection={!dark} blurX={speedBlur(carX, f, 0.22, 60)} /> : null}
      <div style={{ position: "absolute", left: 960 - 60, top: 250, transform: `scale(${chip}) rotate(${(1 - chip) * 90}deg)` }}>
        <IconChip icon={<Ico size={56} color={dark ? C.ctaGreen : C.priceGreen} stroke={2.2} />} size={120} bg={dark ? "#17181E" : C.white} style={{ boxShadow: dark ? "0 0 0 1px #2a2b33, 0 20px 50px rgba(0,0,0,.5)" : undefined }} />
      </div>
      <SettleWords text={words} at={t0 + 1} size={140} color={fg} align="center" stagger={2} accents={i === 2 ? { surge: dark ? C.ctaGreen : C.brandGreen } : {}} seed={`s9-${i}`} style={{ position: "absolute", left: 0, right: 0, top: 420 }} />
      <Capsule cx={CAPSULE_POS.x} cy={CAPSULE_POS.y} w={72} h={30} style={{ transform: `scale(${cap})` }} />
      {dark ? <Vignette strength={0.55} /> : null}
    </AbsoluteFill>
  );
};

export const S9Recap: React.FC = () => {
  const f = useT();
  return (
    <AbsoluteFill style={{ background: C.night }}>
      {S.flashes.map((t0, i) => (f >= t0 ? <Flash key={i} i={i} f={f} /> : null))}
    </AbsoluteFill>
  );
};

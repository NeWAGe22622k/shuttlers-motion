import React from "react";
import { C, SPRING, TYPE } from "../config/brand";
import { content } from "../config/content";
import { T } from "../config/time";
import { SettleWords } from "../components/core";
import { LiftOut, isLifted } from "../components/LiftOut";
import { bump, mix, press, sp, tw } from "../components/motion";
import { HomeScreen, HOME_CARDS } from "../screens/Home";
import { ServiceCard } from "../components/ui";
import type { PhonePose } from "./PhoneAct";

const S = T.hero.s3;
const POD_SLOT = { x: HOME_CARDS.x[1], y: HOME_CARDS.top, w: HOME_CARDS.w, h: HOME_CARDS.h };

const badge = (f: number) => {
  const k = sp(f, S.podLift, SPRING.pop);
  return f < S.podLift ? { rot: 0, s: 1 } : { rot: mix(-8, 0, k), s: mix(0.6, 1, k) };
};

export const S3Screen: React.FC<{ f: number }> = ({ f }) => {
  const dim = tw(f, S.podLift, S.podLift + 8) * (1 - tw(f, S.podReturn, S.podReturn + 10));
  const b = badge(f);
  return (
    <HomeScreen
      daily={{ hi: bump(f, S.dailyHi), dim }}
      rent={{ hi: bump(f, S.rentHi), dim }}
      pod={{ ghost: isLifted(f, S.podLift, S.podReturn), press: press(f, S.tap) }}
      badgeRot={b.rot}
      badgeScale={b.s}
    />
  );
};

export const S3Story: React.FC<{ f: number; phone: PhonePose }> = ({ f, phone }) => {
  if (f < S.podLift || f > S.end + 10) return null;
  const b = badge(f);
  return (
    <>
      <LiftOut f={f} out={S.podLift} back={S.podReturn} slot={POD_SLOT} phone={phone} to={{ cx: 1160, cy: 372, scale: 1.7 }} glowRing={1}>
        <ServiceCard kind="pod" {...content.home.services.pod} badgeRot={b.rot} badgeScale={b.s} />
      </LiftOut>
      <SettleWords text={content.s3.caption} at={S.caption} outAt={S.podReturn} size={TYPE.title} accents={{ Pod: C.brandGreen }} seed="s3" maxWidth={760} style={{ position: "absolute", left: 1040, top: 560 }} />
    </>
  );
};

import React from "react";
import { C, EASE, TYPE } from "../config/brand";
import { content } from "../config/content";
import { T } from "../config/time";
import { SettleWords } from "../components/core";
import { press, tw } from "../components/motion";
import { PlanRideScreen, PlanState } from "../screens/PlanRide";

const S = T.hero.s4;

export const planState = (f: number): { st: PlanState; prev: number } => {
  const keys = S.keys;
  let letters = 0;
  for (const k of keys) if (f >= k) letters++;
  const lastKey = letters > 0 ? keys[letters - 1] : -999;
  const rowsIn = [0, 1, 2, 3].map((i) => (letters === 0 ? 0 : tw(f, lastKey + 2 + i * 2, lastKey + 8 + i * 2, 0, 1, EASE.out)));
  let pressed: PlanState["pressed"] = null;
  for (let i = 0; i < keys.length; i++) {
    if (f >= keys[i] && f < keys[i] + 5) pressed = { ch: content.s4.query[i], p: (f - keys[i]) / 5 };
  }
  const kbUp = tw(f, S.tapDest, S.tapDest + 14, 0, 1, EASE.out);
  const kbDown = tw(f, S.loading, S.loading + 10, 0, 1, EASE.in);
  return {
    prev: letters - 1,
    st: {
      searchP: tw(f, S.tapDest + 1, S.tapDest + 11, 0, 1, EASE.inOut),
      gps: [S.gps, S.gps + 14].map((t) => (f - t) / 20),
      currentIn: tw(f, S.currentIn, S.currentInEnd),
      letters,
      rowsIn,
      oldOut: letters > 1 ? tw(f, lastKey, lastKey + 3) : 1,
      chipsP: [0, 1, 2, 3].map((i) => tw(f, S.tapDest + 2 + i * 2, S.tapDest + 12 + i * 2, 0, 1, EASE.out)),
      progress: letters > 0 && f < S.typingEnd + 4 ? Math.min(1, (f - lastKey) / 6) : -1,
      rowHi: tw(f, S.tapResult, S.tapResult + 3),
      dim: tw(f, S.loading, S.loading + 3),
      spin: f,
      kb: kbUp * (1 - kbDown),
      pressed,
      caretOn: f < keys[0] ? Math.floor(f / 8) % 2 === 0 : f < S.typingEnd + 2 || Math.floor(f / 8) % 2 === 0,
      destPress: press(f, S.tapDest),
    },
  };
};

export const S4Screen: React.FC<{ f: number }> = ({ f }) => {
  const { st, prev } = planState(f);
  return <PlanRideScreen st={st} prevLetters={prev > 0 ? prev : undefined} />;
};

export const S4Story: React.FC<{ f: number }> = ({ f }) => {
  if (f < S.caption0 - 2 || f > S.end + 10) return null;
  return (
    <>
      <SettleWords text={content.s4.captions[0]} at={S.caption0} outAt={S.caption1 - 8} size={TYPE.caption} accents={{ where: C.brandGreen, you: C.brandGreen, are: C.brandGreen }} seed="s4a" maxWidth={720} style={{ position: "absolute", left: 1040, top: 470 }} />
      <SettleWords text={content.s4.captions[1]} at={S.caption1} outAt={S.push} size={TYPE.caption} accents={{ where: C.brandGreen, "you're": C.brandGreen, going: C.brandGreen }} seed="s4b" maxWidth={720} style={{ position: "absolute", left: 1040, top: 470 }} />
    </>
  );
};

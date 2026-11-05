import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { EASE } from "../config/brand";
import { assetExists, Grain } from "../components/core";
import { mix, tw } from "../components/motion";
import { SMark } from "./kit";
import { BLACK, Fmt, Pair, pairColours } from "./theme";
import { PhoneAct } from "./v2/act";
import { DirBlur, H, W, beat, vel } from "./v2/engine";
import { AwayShot, BlinkBackShot, BlinkShot, CatchShot, ClockShot, DIVE_ORIGIN, EndShot, HereShot, HowShot, PodSoloShot, PunchShot, YOURS_C, YoursShot } from "./v2/shots";

/**
 * Video 2 · How to book Pod Solo (Pod Now), 9:16 master.
 * Shots follow the brief's 16 cards on the score's beat grid (timing.json → edu.v2); transitions
 * ride the whooshes (whip pans with motion blur, a dive through the "0" of 8:50 into the drop,
 * slanted panel wipes, a circle wipe out of the glowing car) and the silences are hard cuts.
 */

const Black: React.FC<{ f: number }> = () => <AbsoluteFill style={{ background: BLACK }} />;

type Shot = { at: number; pair: Pair; mark: boolean; markUntil?: number; C: React.FC<{ f: number }> };
const SHOTS: Shot[] = [
  { at: 0, pair: "G", mark: false, C: ClockShot },
  { at: 60, pair: "K", mark: true, C: PunchShot },
  { at: 120, pair: "G", mark: true, C: PodSoloShot },
  { at: 150, pair: "K", mark: true, C: HowShot },
  { at: 180, pair: "G", mark: true, markUntil: 185, C: PhoneAct }, // the act draws its own mark (it wipes with the world)
  { at: 510, pair: "G", mark: true, C: BlinkShot },
  { at: 540, pair: "X", mark: false, C: Black },
  { at: 555, pair: "G", mark: true, C: BlinkBackShot },
  { at: 570, pair: "G", mark: true, C: HereShot },
  { at: 630, pair: "G", mark: true, C: YoursShot },
  { at: 690, pair: "K", mark: true, C: CatchShot },
  { at: 780, pair: "K", mark: true, C: AwayShot },
  { at: 840, pair: "G", mark: false, C: EndShot },
];

type Kind = "dive" | "whipL" | "whipU" | "panels" | "circle";
const TRANS: Record<number, { kind: Kind; a: number; b: number; o?: [number, number] }> = {
  60: { kind: "dive", a: 52, b: 60, o: DIVE_ORIGIN },
  120: { kind: "whipL", a: 115, b: 125 },
  150: { kind: "panels", a: 145, b: 155 },
  180: { kind: "whipU", a: 175, b: 185 },
  690: { kind: "circle", a: 683, b: 694, o: YOURS_C },
  780: { kind: "whipL", a: 775, b: 785 },
  840: { kind: "whipL", a: 835, b: 845 },
};

const layer = (i: number, f: number) => {
  const S = SHOTS[i].C;
  return <S f={f} />;
};

const SL = 0.3;
const edgeX = (e: number, y: number) => e + SL * (H / 2 - y);
const leftOf = (e: number) => `polygon(-80px -80px, ${edgeX(e, -80)}px -80px, ${edgeX(e, H + 80)}px ${H + 80}px, -80px ${H + 80}px)`;
const band = (e0: number, e1: number) => `polygon(${edgeX(e0, -80)}px -80px, ${edgeX(e1, -80)}px -80px, ${edgeX(e1, H + 80)}px ${H + 80}px, ${edgeX(e0, H + 80)}px ${H + 80}px)`;

const Body: React.FC<{ f: number }> = ({ f }) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].at) i = k;
  const nxt = SHOTS[i + 1];
  let from = -1;
  let to = -1;
  let tr: (typeof TRANS)[number] | null = null;
  if (nxt && TRANS[nxt.at] && f >= TRANS[nxt.at].a) {
    from = i;
    to = i + 1;
    tr = TRANS[nxt.at];
  } else if (i > 0 && TRANS[SHOTS[i].at] && f < TRANS[SHOTS[i].at].b) {
    from = i - 1;
    to = i;
    tr = TRANS[SHOTS[i].at];
  }
  if (!tr) return layer(i, f);
  const at = SHOTS[to].at;

  if (tr.kind === "whipL" || tr.kind === "whipU") {
    const horiz = tr.kind === "whipL";
    const L = horiz ? W : H;
    const T = tr;
    const pos = (x: number) => tw(x, T.a, T.b, 0, 1, EASE.inOut) * L;
    const d = pos(f);
    const blur = Math.min(70, vel(pos, f) * 0.42);
    const tf = (v: number) => (horiz ? `translateX(${v.toFixed(1)}px)` : `translateY(${v.toFixed(1)}px)`);
    return (
      <>
        {d < L - 2 ? (
          <DirBlur id={`wo${to}`} x={horiz ? blur : 0} y={horiz ? 0 : blur} style={{ transform: tf(-d) }}>
            {layer(from, f)}
          </DirBlur>
        ) : null}
        {d > 2 ? (
          <DirBlur id={`wi${to}`} x={horiz ? blur : 0} y={horiz ? 0 : blur} style={{ transform: tf(L - d) }}>
            {layer(to, f)}
          </DirBlur>
        ) : null}
      </>
    );
  }

  if (tr.kind === "panels") {
    const q = tw(f, tr.a, tr.b, 0, 1, EASE.inOut);
    const e = mix(-SL * (H / 2 + 80) - 300, W + SL * (H / 2 + 80) + 40, q);
    const nb = pairColours(SHOTS[to].pair).bg;
    return (
      <>
        <AbsoluteFill style={{ transform: `translateX(${(-90 * q).toFixed(1)}px)` }}>{layer(from, f)}</AbsoluteFill>
        <AbsoluteFill style={{ background: nb, clipPath: band(e + 64, e + 170) }} />
        <AbsoluteFill style={{ background: nb, clipPath: band(e + 236, e + 266) }} />
        <AbsoluteFill style={{ clipPath: leftOf(e) }}>
          <AbsoluteFill style={{ transform: `translateX(${(140 * (1 - q)).toFixed(1)}px)` }}>{layer(to, f)}</AbsoluteFill>
        </AbsoluteFill>
      </>
    );
  }

  if (tr.kind === "circle") {
    const o = tr.o!;
    const q = tw(f, tr.a, tr.b, 0, 1, EASE.in);
    const R = Math.hypot(Math.max(o[0], W - o[0]), Math.max(o[1], H - o[1])) + 40;
    const r = mix(0, R, q);
    return (
      <>
        <AbsoluteFill style={{ transform: `scale(${mix(1, 1.1, q).toFixed(4)})`, transformOrigin: `${o[0]}px ${o[1]}px` }}>{layer(from, f)}</AbsoluteFill>
        <AbsoluteFill style={{ clipPath: `circle(${r.toFixed(1)}px at ${o[0]}px ${o[1]}px)` }}>
          <AbsoluteFill style={{ transform: `scale(${mix(1.3, 1, tw(f, tr.a, tr.b + 6, 0, 1, EASE.out)).toFixed(4)})`, transformOrigin: `${o[0]}px ${o[1]}px` }}>{layer(to, f)}</AbsoluteFill>
        </AbsoluteFill>
      </>
    );
  }

  // dive: the camera flies through the counter of the "0" in 8:50; the drop cuts in on pure green
  const o = tr.o!;
  if (f >= at) return layer(to, f);
  const q = tw(f, tr.a, at - 0.6, 0, 1, (t) => t);
  const s = Math.exp(Math.log(46) * q);
  const zoomed = (k: number, op: number, key: string) => (
    <AbsoluteFill key={key} style={{ transform: `scale(${(s * k).toFixed(4)})`, transformOrigin: `${o[0]}px ${o[1]}px`, opacity: op }}>
      {layer(from, f)}
    </AbsoluteFill>
  );
  return (
    <>
      {zoomed(1, 1, "m")}
      {q > 0.05 ? zoomed(1.12, 0.3 * q, "e1") : null}
      {q > 0.05 ? zoomed(1.26, 0.18 * q, "e2") : null}
    </>
  );
};

const Mark: React.FC<{ f: number }> = ({ f }) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].at) i = k;
  const S = SHOTS[i];
  if (!S.mark || (S.markUntil !== undefined && f >= S.markUntil)) return null;
  // during an outgoing whip the incoming shot's mark takes over at the cut frame
  const { fg } = pairColours(S.pair);
  return (
    <div style={{ position: "absolute", right: 170, bottom: 430, transform: `scale(${(1 + 0.06 * beat(f)).toFixed(4)})`, transformOrigin: "100% 100%" }}>
      <SMark size={92} color={fg} />
    </div>
  );
};

const Audio2: React.FC = () => (assetExists("audio/edu/score-edu2.wav") ? <Audio src={staticFile("audio/edu/score-edu2.wav")} /> : null);

export const EduVideo2: React.FC<{ fmt?: Fmt }> = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BLACK, width: W, height: H, overflow: "hidden" }}>
      <Body f={f} />
      <Mark f={f} />
      <Grain opacity={0.03} />
      <Audio2 />
    </AbsoluteFill>
  );
};

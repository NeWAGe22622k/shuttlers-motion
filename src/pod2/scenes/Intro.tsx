import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { C, EASE, PHONE, T, TYPE, W } from "../config/brand";
import { s1, s2, s3, s4 } from "../config/content";
import { G1, G3 } from "../config/gradients";
import { FlapDigit } from "../components/kit";
import { mix, tw } from "../components/motion";
import { PodAt } from "../components/Pod";
import { phonePose, projectApp } from "../components/Phone";
import { FillSweep, MaskRise, ScaleCut, Slice, textWidth, typeStyle } from "../components/type";
import { POS } from "../screens/Screens";

/* ================================================================== S1 · "Let's get you moving." (0–60) */

// Digit glyphs 260px tall (Google Sans figures ≈ 0.716em), on real split-flap cards, centred above the line.
const CLOCK = { font: Math.round(260 / 0.716), w: 286, h: 410, gap: 26, colon: 96, top: 236, lineTop: 236 + 410 + 64 };

export const S1: React.FC = () => {
  const f = useCurrentFrame();
  const R = T.s1;
  const push = 1 + 0.08 * (f / 60); // slow push-in from f0, never still
  const [hh, m1From, m2From] = [s1.clockFrom[0], s1.clockFrom[2], s1.clockFrom[3]];
  const [m1To, m2To] = [s1.clockTo[2], s1.clockTo[3]];
  const p = tw(f, R.flip[0], R.flip[1], 0, 1, EASE.linear);
  const split = (R.flipLeafSplit - R.flip[0]) / (R.flip[1] - R.flip[0]);
  const total = CLOCK.w * 3 + CLOCK.gap * 2 + CLOCK.colon;
  const x0 = (W - total) / 2;
  return (
    <AbsoluteFill>
      <G1 f={f} />
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(4)})`, transformOrigin: "960px 540px" }}>
        <div style={{ position: "absolute", left: x0, top: CLOCK.top, display: "flex", alignItems: "center", gap: CLOCK.gap }}>
          <FlapDigit from={hh} to={hh} p={0} w={CLOCK.w} h={CLOCK.h} font={CLOCK.font} />
          <div style={{ width: CLOCK.colon - CLOCK.gap, height: CLOCK.h, position: "relative" }}>
            {[0.34, 0.66].map((y) => (
              <div key={y} style={{ position: "absolute", left: (CLOCK.colon - CLOCK.gap) / 2 - 17, top: CLOCK.h * y - 17, width: 34, height: 34, borderRadius: 7, background: C.white }} />
            ))}
          </div>
          <FlapDigit from={m1From} to={m1To} p={p} split={split} w={CLOCK.w} h={CLOCK.h} font={CLOCK.font} />
          <FlapDigit from={m2From} to={m2To} p={p} split={split} w={CLOCK.w} h={CLOCK.h} font={CLOCK.font} />
        </div>
        <MaskRise f={f} at={R.line} lines={[s1.line]} size={TYPE.title} color={C.white} align="center" style={{ position: "absolute", left: 0, width: W, top: CLOCK.lineTop }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ================================================================== S2 · "Like, right now." (60–120) */

export const S2: React.FC = () => {
  const f = useCurrentFrame();
  const R = T.s2;
  const [w1, w2, w3] = s2.line.split(" "); // "Like," "right" "now."
  const slide = -40 * tw(f, T.scenes.s2[0], T.scenes.s2[1], 0, 1, EASE.linear);
  const small = TYPE.hero;
  const big = 400;
  const xLike = 150;
  const xRight = xLike + textWidth(`${w1} `, small);
  const wLike = textWidth(w1, small);
  const wRight = textWidth(w2, small);
  const yTop = 210;
  const xNow = 1050;
  const yNow = 470;
  const wNow = textWidth(w3, big);
  return (
    <AbsoluteFill>
      <G3 f={f} />
      <AbsoluteFill style={{ transform: `translateX(${slide.toFixed(2)}px)` }}>
        <ScaleCut f={f} at={R.words[0]} origin={`${wLike / 2}px 50%`} style={{ position: "absolute", left: xLike, top: yTop }}>
          <div style={typeStyle({ size: small })}>{w1}</div>
        </ScaleCut>
        <ScaleCut f={f} at={R.words[1]} origin={`${wRight / 2}px 50%`} style={{ position: "absolute", left: xRight, top: yTop }}>
          <div style={typeStyle({ size: small })}>{w2}</div>
        </ScaleCut>
        <ScaleCut f={f} at={R.words[2]} origin={`${Math.min(wNow / 2, 440)}px 50%`} style={{ position: "absolute", left: xNow, top: yNow }}>
          <FillSweep f={f} at={R.sweep[0]} from={R.words[2]} text={w3} size={big} stroke={5} />
        </ScaleCut>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ================================================================== the Pod across S3 → S4 */

const HERO = { x: 960, y: 430, size: 640 };

/** Pod pose from the arc-in (S3) to the travel into the phone's Pod tile (S4). */
export const introPod = (f: number) => {
  const A = T.s3.arc;
  const e = tw(f, A[0], A[1], 0, 1, EASE.expoOut);
  // quadratic arc in from bottom-left
  const P0 = { x: -420, y: 1320 };
  const P1 = { x: 260, y: 440 };
  const P2 = { x: HERO.x, y: HERO.y };
  const u = 1 - e;
  let x = u * u * P0.x + 2 * u * e * P1.x + e * e * P2.x;
  let y = u * u * P0.y + 2 * u * e * P1.y + e * e * P2.y;
  let heading = 90 + mix(-35, 0, e) + 2 * Math.max(0, (f - A[1]) / 30); // keeps turning 2°/s once landed
  let size = HERO.size;
  const tr = T.s4.travel;
  const k = tw(f, tr[0], tr[1], 0, 1, EASE.expoOut);
  if (k > 0) {
    const tile = projectApp(POS.podTile.x + POS.podTile.w / 2, POS.podTile.y + POS.podTile.h / 2, phonePose(tr[1]));
    x = mix(x, tile.x, k);
    y = mix(y, tile.y, k);
    heading = mix(heading, 0, k);
    size = mix(size, POS.podTile.h * PHONE.scale * tile.k * 0.86, k);
  }
  return { x, y, heading, size };
};

const PodLayer: React.FC = () => {
  const f = useCurrentFrame();
  const p = introPod(f);
  return (
    <AbsoluteFill>
      <PodAt f={f} x={p.x} y={p.y} size={p.size} heading={p.heading} seatFill={tw(f, T.s3.seat[0], T.s3.seat[1], 0, 1, EASE.expoOut)} />
    </AbsoluteFill>
  );
};

/** Motion blur only on the fast frames (arc-in, travel). */
const IntroPod: React.FC<{ f: number }> = ({ f }) => {
  const fast = (f >= T.s3.arc[0] && f < T.s3.arc[0] + 8) || (f >= T.s4.travel[0] && f < T.s4.travel[0] + 8);
  return fast ? (
    <CameraMotionBlur shutterAngle={180} samples={8}>
      <PodLayer />
    </CameraMotionBlur>
  ) : (
    <PodLayer />
  );
};

/* ================================================================== S3 · "Pod Solo." (120–150) */

export const S3: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <G3 f={f} />
      <IntroPod f={f} />
      <Slice f={f} lock={T.s3.lineLock} lines={[s3.line]} size={TYPE.word} style={{ position: "absolute", left: (W - textWidth(s3.line, TYPE.word)) / 2, top: 740 }} />
    </AbsoluteFill>
  );
};

/* ================================================================== S4 · "Here's how." (150–180) */

export const S4: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <G3 f={f} />
      <MaskRise f={f} at={T.s4.line} lines={[s4.line]} size={TYPE.title} align="center" style={{ position: "absolute", left: 0, width: W, top: 770 }} />
      <IntroPod f={f} />
    </AbsoluteFill>
  );
};


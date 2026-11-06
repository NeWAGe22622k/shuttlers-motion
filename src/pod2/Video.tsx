import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { AppIcon, assetExists } from "../components/core";
import { useFontsReady } from "../components/useFontsReady";
import { EASE, ICON, PHONE, T } from "./config/brand";
import { Texture } from "./config/gradients";
import { rrectPath, tw } from "./components/motion";
import { phonePose, projectApp } from "./components/Phone";
import { GradientWipe, MaskGrow, growScale } from "./components/transitions";
import { S1, S2, S3, S4 } from "./scenes/Intro";
import { PhoneScene } from "./scenes/PhoneAct";
import { S10, S11, S12, S13, S14, S9 } from "./scenes/Outro";
import { POS } from "./screens/Screens";

/**
 * PodVideo2-9x16 · How to book Pod Solo (Pod Now), revision 3. 1080×1920, 30fps, 990f (33s).
 * Every scene reads the absolute frame (no Sequences), so transitions can render two scenes at
 * once and <CameraMotionBlur> can resample any moving layer. All frame numbers: config/timing.json.
 */

const TR = T.transitions;
const HALF = TR.wipeDur / 2;
const SC = T.scenes;

/** S4 → S5: the phone's Pod tile (where the Pod just landed) grows to fill the frame. */
const tileMaskPath = (f: number) => {
  const [a] = TR.maskGrowPodTile;
  const [, b] = TR.maskGrowPodTile;
  const t = POS.podTile;
  const c = projectApp(t.x + t.w / 2, t.y + t.h / 2, phonePose(f));
  const s = growScale(f, a, b, 1, 16);
  const w = t.w * PHONE.scale * c.k * s;
  const h = t.h * PHONE.scale * c.k * s;
  return rrectPath(c.x - w / 2, c.y - h / 2, w, h, Math.min(w, h) * 0.14);
};

const Scenes: React.FC<{ f: number }> = ({ f }) => {
  const [w1, w2] = TR.wipe;
  if (f < w1 - HALF) return <S1 />;
  if (f < w1 + HALF) return <GradientWipe f={f} at={w1} from={<S1 />} to={<S2 />} />;
  if (f < SC.s3[0]) return <S2 />;
  if (f < w2 - HALF) return <S3 />;
  if (f < w2 + HALF) return <GradientWipe f={f} at={w2} from={<S3 />} to={<S4 />} />;
  if (f < TR.maskGrowPodTile[0]) return <S4 />;
  if (f < TR.maskGrowPodTile[1]) return <MaskGrow f={f} a={TR.maskGrowPodTile[0]} b={TR.maskGrowPodTile[1]} from={<S4 />} to={<PhoneScene />} shape={tileMaskPath} />;
  if (f < SC.s9[0]) return <PhoneScene />; // steps 1–4, then 10-pod-booked and 11-finding-pod in full
  if (f < SC.s10[0]) return <S9 />;
  if (f < SC.s11[0]) return <S10 />;
  if (f < SC.s12[0]) return <S11 />;
  if (f < SC.s13[0]) return <S12 />;
  if (f < SC.s14[0]) return <S13 />;
  return <S14 />; // hard cut on the f930 beat
};

/** The Shuttlers app icon, top-right, in place from f0; a hard mask wipe takes it away at f930. */
const PersistentIcon: React.FC<{ f: number }> = ({ f }) => {
  const [a, b] = T.s14.iconOut;
  const p = tw(f, a, b, 0, 1, EASE.expoInOut);
  if (p >= 1) return null;
  return (
    <div style={{ position: "absolute", left: ICON.x, top: ICON.y, width: ICON.size, height: ICON.size, clipPath: `inset(0 0 0 ${(p * 100).toFixed(2)}%)` }}>
      <AppIcon size={ICON.size} shadow={false} />
    </div>
  );
};

export const PodVideo2: React.FC<{ grain?: boolean; audio?: boolean }> = ({ grain = true, audio = true }) => {
  const f = useCurrentFrame();
  const ready = useFontsReady();
  if (!ready) return null;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Scenes f={f} />
      <Texture f={f} on={grain} />
      <PersistentIcon f={f} />
      {audio && assetExists("audio/score-v2.wav") ? <Audio src={staticFile("audio/score-v2.wav")} /> : null}
    </AbsoluteFill>
  );
};

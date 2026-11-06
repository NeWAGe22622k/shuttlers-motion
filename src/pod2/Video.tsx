import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { assetExists } from "../components/core";
import { useFontsReady } from "../components/useFontsReady";
import { PHONE, T } from "./config/brand";
import { Texture } from "./config/gradients";
import { rrectPath } from "./components/motion";
import { phonePose, projectApp } from "./components/Phone";
import { GradientWipe, MaskGrow, growScale } from "./components/transitions";
import { S1, S2, S3, S4 } from "./scenes/Intro";
import { PhoneScene } from "./scenes/PhoneAct";
import { Black, podMaskPath, S10, S11, S12, S13, S14, S9 } from "./scenes/Outro";
import { POS } from "./screens/Screens";

/**
 * PodVideo2-16x9 · How to book Pod Solo (Pod Now). 1920×1080, 30fps, 900f.
 * Every scene reads the absolute frame (no Sequences), so transitions can render two scenes at
 * once and <CameraMotionBlur> can resample any moving layer. All frame numbers: config/timing.json.
 */

const TR = T.transitions;
const HALF = TR.wipeDur / 2;

/** S4 → S5: the phone's Pod tile (where the Pod just landed) grows to fill the frame. */
const tileMaskPath = (f: number) => {
  const [a, b] = TR.maskGrowPodTile;
  const t = POS.podTile;
  const c = projectApp(t.x + t.w / 2, t.y + t.h / 2, phonePose(f));
  const s = growScale(f, a, b, 1, 24);
  const w = t.w * PHONE.scale * c.k * s;
  const h = t.h * PHONE.scale * c.k * s;
  return rrectPath(c.x - w / 2, c.y - h / 2, w, h, Math.min(w, h) * 0.14);
};

const Scenes: React.FC<{ f: number }> = ({ f }) => {
  const [w1, w2, w3] = TR.wipe;
  if (f < w1 - HALF) return <S1 />;
  if (f < w1 + HALF) return <GradientWipe f={f} at={w1} from={<S1 />} to={<S2 />} />;
  if (f < T.scenes.s3[0]) return <S2 />;
  if (f < w2 - HALF) return <S3 />;
  if (f < w2 + HALF) return <GradientWipe f={f} at={w2} from={<S3 />} to={<S4 />} />;
  if (f < TR.maskGrowPodTile[0]) return <S4 />;
  if (f < TR.maskGrowPodTile[1]) return <MaskGrow f={f} a={TR.maskGrowPodTile[0]} b={TR.maskGrowPodTile[1]} from={<S4 />} to={<PhoneScene />} shape={tileMaskPath} />;
  if (f < T.scenes.s9[0]) return <PhoneScene />;
  if (f < TR.maskGrowEye[1]) return <S9 />; // S9 grows its own eye window to black (f540–555)
  if (f < T.scenes.s10[0]) return <Black />;
  if (f < TR.maskGrowPodMarker[0]) return <S10 />;
  if (f < TR.maskGrowPodMarker[1]) return <MaskGrow f={f} a={TR.maskGrowPodMarker[0]} b={TR.maskGrowPodMarker[1]} from={<S10 />} to={<S11 />} shape={podMaskPath} />;
  if (f < T.scenes.s12[0]) return <S11 />;
  if (f < T.scenes.s13[0]) return <S12 />;
  if (f < w3 - HALF) return <S13 />;
  if (f < w3 + HALF) return <GradientWipe f={f} at={w3} from={<S13 />} to={<S14 />} />;
  return <S14 />;
};

export const PodVideo2: React.FC<{ grain?: boolean; audio?: boolean }> = ({ grain = true, audio = true }) => {
  const f = useCurrentFrame();
  const ready = useFontsReady();
  if (!ready) return null;
  const black = f >= TR.maskGrowEye[1] && f < T.scenes.s10[0];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Scenes f={f} />
      {!black ? <Texture f={f} on={grain} /> : null}
      {audio && assetExists("audio/score-v2.wav") ? <Audio src={staticFile("audio/score-v2.wav")} /> : null}
    </AbsoluteFill>
  );
};

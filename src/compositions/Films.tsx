import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { T, TimeProvider, linearMap, type Flags } from "../config/time";
import { assetExists, Grain } from "../components/core";
import { S1Question } from "../scenes/S1Question";
import { S2GotYou } from "../scenes/S2GotYou";
import { PhoneAct } from "../scenes/PhoneAct";
import { S9Recap } from "../scenes/S9Recap";
import { S10EndCard } from "../scenes/S10EndCard";

const H = T.hero;

const Score: React.FC<{ file: string }> = ({ file }) => (assetExists(file) ? <Audio src={staticFile(file)} /> : null);

/** PodHero-16x9: 1920×1080, 30fps, 960f. Hand-offs happen inside absolute Sequences (no TransitionSeries overlap). */
export const PodHero: React.FC = () => (
  <AbsoluteFill style={{ background: "#fff" }}>
    <Sequence from={H.s1.start} durationInFrames={H.s1.end - H.s1.start} name="S1 Question">
      <TimeProvider map={(f) => f + H.s1.start}>
        <S1Question />
      </TimeProvider>
    </Sequence>
    <Sequence from={H.s2.start} durationInFrames={H.s2.end - H.s2.start} name="S2 Got you">
      <TimeProvider map={(f) => f + H.s2.start}>
        <S2GotYou />
      </TimeProvider>
    </Sequence>
    <Sequence from={H.s3.start} durationInFrames={H.s9.start - H.s3.start} name="S3–S8 Phone act">
      <TimeProvider map={(f) => f + H.s3.start}>
        <PhoneAct />
      </TimeProvider>
    </Sequence>
    <Sequence from={H.s9.start} durationInFrames={H.s9.end - H.s9.start} name="S9 Recap">
      <TimeProvider map={(f) => f + H.s9.start}>
        <S9Recap />
      </TimeProvider>
    </Sequence>
    <Sequence from={H.s10.start} durationInFrames={H.s10.end - H.s10.start} name="S10 End card">
      <TimeProvider map={(f) => f + H.s10.start}>
        <S10EndCard />
      </TimeProvider>
    </Sequence>
    <Grain />
    <Score file="audio/score-hero.wav" />
  </AbsoluteFill>
);

const SCENES: Record<string, React.FC> = { s1: S1Question, s2: S2GotYou, phone: PhoneAct, s10: S10EndCard };

/** PodCutdown-16x9: the hero scenes replayed through linear time remaps (timing.json → cutdown.segments). */
export const PodCutdown: React.FC = () => (
  <AbsoluteFill style={{ background: "#fff" }}>
    {T.cutdown.segments.map((seg, i) => {
      const Scene = SCENES[seg.scene];
      const flags: Flags = { cutdown: true };
      if ("pushOutAt" in seg) flags.pushOutAt = seg.pushOutAt as number;
      if ("phoneEntry" in seg) flags.phoneEntry = seg.phoneEntry as Flags["phoneEntry"];
      return (
        <Sequence key={i} from={seg.cut[0]} durationInFrames={seg.cut[1] - seg.cut[0]} name={`${seg.scene} ${seg.hero[0]}–${seg.hero[1]}`}>
          <TimeProvider map={linearMap(seg.cut[0], seg.cut[1], seg.hero[0], seg.hero[1])} flags={flags}>
            <Scene />
          </TimeProvider>
        </Sequence>
      );
    })}
    <Grain />
    <Score file="audio/score-cutdown.wav" />
  </AbsoluteFill>
);

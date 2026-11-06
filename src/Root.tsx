import React from "react";
import { Composition } from "remotion";
import { T } from "./config/time";
import { PodCutdown, PodHero } from "./compositions/Films";
import { ComponentsPreview } from "./compositions/ComponentsPreview";
import { ScreenCheck } from "./compositions/ScreenCheck";
import { EduAnimatic } from "./edu/Animatic";
import { EduVideo1 } from "./edu/Video1";
import { EduVideo2 } from "./edu/Video2";
import { PodPreview } from "./edu/PodPreview";
import { ScreenCheck2 } from "./pod2/ScreenCheck2";
import { PodVideo2 } from "./pod2/Video";
import { Components2 } from "./pod2/Preview";
import timing2 from "./pod2/config/timing.json";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="PodHero-16x9" component={PodHero} durationInFrames={T.hero.duration} fps={T.fps} width={1920} height={1080} />
    <Composition id="PodCutdown-16x9" component={PodCutdown} durationInFrames={T.cutdown.duration} fps={T.fps} width={1920} height={1080} />
    <Composition id="Components-Preview" component={ComponentsPreview} durationInFrames={120} fps={T.fps} width={1920} height={1080} />
    {/* Education videos (brief: Shuttlers Pod Education Videos), timing animatics on the generated scores */}
    <Composition id="Edu1-Animatic" component={EduAnimatic} durationInFrames={T.edu.duration} fps={T.fps} width={1080} height={1920} defaultProps={{ video: "v1" as const, guides: true }} />
    <Composition id="Edu2-Animatic" component={EduAnimatic} durationInFrames={T.edu.duration} fps={T.fps} width={1080} height={1920} defaultProps={{ video: "v2" as const, guides: true }} />
    <Composition id="Edu1-9x16" component={EduVideo1} durationInFrames={T.edu.duration} fps={T.fps} width={1080} height={1920} defaultProps={{ fmt: "9x16" as const }} />
    <Composition id="Edu2-9x16" component={EduVideo2} durationInFrames={T.edu.duration} fps={T.fps} width={1080} height={1920} defaultProps={{ fmt: "9x16" as const }} />
    <Composition id="Edu-PodPreview" component={PodPreview} durationInFrames={1} fps={30} width={2000} height={1000} />
    {/* Build aid: one rebuilt screen at 393×852 with an optional ReferenceOverlay (props: screen, overlay). */}
    {/* Video 2 · How to book Pod Solo (Pod Now), 16:9 (brief: "Shuttlers Pod — Video 2 … 16:9") */}
    <Composition id="PodVideo2-16x9" component={PodVideo2} durationInFrames={timing2.duration} fps={timing2.fps} width={1920} height={1080} defaultProps={{ grain: true, audio: true }} />
    <Composition id="Components-Preview-V2" component={Components2} durationInFrames={120} fps={30} width={1920} height={1080} />
    {/* PodVideo2-16x9 build aid: rebuilt screen + 3× reference overlay (props: screen, overlay). */}
    <Composition id="ScreenCheck2" component={ScreenCheck2} durationInFrames={1} fps={30} width={393} height={852} defaultProps={{ screen: "home" as const, overlay: 0.5 }} />
    <Composition id="ScreenCheck" component={ScreenCheck} durationInFrames={1} fps={30} width={393} height={852} defaultProps={{ screen: "home", overlay: 0 }} />
  </>
);

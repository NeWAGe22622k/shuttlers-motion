import React from "react";
import { AbsoluteFill } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { C, EASE, SPRING, TYPE } from "../config/brand";
import { content } from "../config/content";
import { T, TimeProvider, useFlags, useT } from "../config/time";
import { AppIcon, Bloom, Finger, SettleWords, squirclePath } from "../components/core";
import { mix, sp, speedBlur, tw } from "../components/motion";
import { S1Question } from "./S1Question";
import { PhoneAct } from "./PhoneAct";

const S = T.hero.s2;
const ICON = 220;
const ICX = 700;
const ICY = 540;

// frame-rect of the shrinking card / growing icon
const shrinkRect = (f: number) => {
  const p = tw(f, S.shrink, S.shrink + S.shrinkDur, 0, 1, EASE.inOut);
  return { w: mix(1920, ICON, p), h: mix(1080, ICON, p), cx: mix(960, ICX, p), cy: mix(540, ICY, p), p };
};
const zoomRect = (f: number) => {
  const p = tw(f, S.zoomStart, S.zoomEnd - 5, 0, 1, EASE.inOut);
  return { w: mix(ICON, 1920, p), h: mix(ICON, 1080, p), cx: mix(ICX, 960, p), cy: mix(ICY, 540, p), p };
};

/** Fit a 1920×1080 layer into a w×h window (cover). */
const Cover: React.FC<{ w: number; h: number; children: React.ReactNode }> = ({ w, h, children }) => {
  const s = Math.max(w / 1920, h / 1080);
  return <div style={{ position: "absolute", left: (w - 1920 * s) / 2, top: (h - 1080 * s) / 2, width: 1920, height: 1080, transform: `scale(${s})`, transformOrigin: "0 0" }}>{children}</div>;
};

const Inner: React.FC = () => {
  const f = useT();
  const flags = useFlags();
  const land = sp(f, S.iconLand, SPRING.pop);
  const pushOut = flags.pushOutAt !== undefined ? tw(f, flags.pushOutAt, flags.pushOutAt + 14, 0, 1, EASE.out) : 0;
  const allowZoom = flags.pushOutAt === undefined;

  // phase A: S1 frame shrinks into the icon
  if (f < S.iconLand) {
    const r = shrinkRect(f);
    const radius = mix(0, ICON * 0.225, r.p);
    const blur = speedBlur((x) => shrinkRect(x).w, f, 0.012, 10);
    return (
      <AbsoluteFill style={{ background: C.white }}>
        <Bloom opacity={r.p} />
        <div style={{ position: "absolute", left: r.cx - r.w / 2, top: r.cy - r.h / 2, width: r.w, height: r.h, borderRadius: radius, overflow: "hidden", filter: blur > 0.3 ? `blur(${blur}px)` : undefined, boxShadow: `0 ${20 * r.p}px ${60 * r.p}px rgba(16,17,17,${0.18 * r.p})` }}>
          <Cover w={r.w} h={r.h}>
            <TimeProvider map={() => S.shrink - 1}>
              <S1Question />
            </TimeProvider>
          </Cover>
          <div style={{ position: "absolute", inset: 0, opacity: tw(f, S.shrink + 5, S.shrink + S.shrinkDur, 0, 1) }}>
            <AppIcon size={Math.max(r.w, r.h)} shadow={false} mask={false} style={{ marginLeft: (r.w - Math.max(r.w, r.h)) / 2, marginTop: (r.h - Math.max(r.w, r.h)) / 2 }} />
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // phase C: app-open zoom into the rebuilt homepage
  const z = allowZoom ? zoomRect(f) : { w: ICON, h: ICON, cx: ICX, cy: ICY, p: 0 };
  const zooming = allowZoom && f >= S.zoomStart;
  const glint = tw(f, S.glint, S.glint + S.glintDur, 0, 1, EASE.inOut);
  const tapS = allowZoom ? (f >= S.tap && f < S.tap + 4 ? mix(1, 0.94, tw(f, S.tap, S.tap + 2)) : f >= S.tap + 4 ? mix(0.94, 1, sp(f, S.tap + 4, SPRING.snap)) : 1) : 1;
  const iconScale = (zooming ? 1 : mix(0.6, 1, land)) * tapS;
  const homeO = tw(f, S.zoomStart + 8, S.zoomEnd - 6, 0, 1, EASE.inOut);
  const size = zooming ? Math.max(z.w, z.h) : ICON;

  return (
    <AbsoluteFill style={{ background: C.white, transform: `translateX(${-30 * pushOut}%)` }}>
      <Bloom opacity={1 - z.p} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}>
        <SettleWords text={content.s2.answer} at={S.answer} outAt={allowZoom ? S.zoomStart : null} size={TYPE.hero} accents={{ Got: C.ink }} seed="s2" style={{ position: "absolute", left: ICX + ICON / 2 + 56, top: ICY - 70 }} />
      </div>
      {zooming ? (
        <div style={{ position: "absolute", left: z.cx - z.w / 2, top: z.cy - z.h / 2, width: z.w, height: z.h, borderRadius: mix(ICON * 0.225, 0, z.p), overflow: "hidden", boxShadow: `0 20px 60px rgba(16,17,17,${0.18 * (1 - z.p)})` }}>
          <AppIcon size={size} shadow={false} mask={false} style={{ marginLeft: (z.w - size) / 2, marginTop: (z.h - size) / 2 }} />
          <div style={{ position: "absolute", inset: 0, opacity: homeO }}>
            <Cover w={z.w} h={z.h}>
              <TimeProvider map={() => T.hero.s3.start}>
                <PhoneAct />
              </TimeProvider>
            </Cover>
          </div>
        </div>
      ) : (
        <div style={{ position: "absolute", left: ICX - ICON / 2, top: ICY - ICON / 2, transform: `scale(${iconScale})`, opacity: Math.min(1, land * 2 + 0.4) }}>
          <AppIcon size={ICON} glint={glint} />
        </div>
      )}
      {allowZoom ? <Finger x={ICX + 10} y={ICY + 12} at={S.tap} f={f} size={56} from={[90, 140]} /> : null}
      {pushOut > 0 ? <AbsoluteFill style={{ background: `rgba(16,17,17,${0.2 * pushOut})` }} /> : null}
    </AbsoluteFill>
  );
};

export const S2GotYou: React.FC = () => {
  const f = useT();
  const fast = (f >= S.shrink && f < S.iconLand) || (f >= S.zoomStart && f < S.zoomEnd - 4);
  return fast ? (
    <CameraMotionBlur shutterAngle={180} samples={8}>
      <Inner />
    </CameraMotionBlur>
  ) : (
    <Inner />
  );
};

export { squirclePath };

import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { EASE, LIFT, PHONE, SAFE, SPRING, STORY, T, TYPE } from "../config/brand";
import { app, s5, s6, s7, s8, trip } from "../config/content";
import { G3, g2Text } from "../config/gradients";
import { ServiceCard } from "../../components/ui";
import { RollText } from "../components/kit";
import { mix, press, sp, tw } from "../components/motion";
import { FingerLayer, Phone3D, Pose, Tap, phonePose, projectApp } from "../components/Phone";
import { Slice, typeStyle, wrapLines } from "../components/type";
import {
  DestRow,
  FareSheet,
  HomeScreen,
  KeyboardLayer,
  LoadingOverlay,
  OptionRow,
  OptionsScreen,
  OptionsState,
  PayRow,
  PaySheet,
  PlanScreen,
  POS,
  Push,
  SearchScreen,
  SuccessScreen,
} from "../screens/Screens";

/**
 * Steps 1–4 (f180–510): one persistent 3D phone (1000px tall) on G3 paper, step copy in the story
 * zone. For each step the camera pushes into the part of the screen that matters (glide spring,
 * overshoot-clamped) and pulls back before the next. One element per step lifts out of the phone
 * into the story zone at 1.6×. Inside the phone every screen change is an iOS push.
 */

const R5 = T.s5;
const R6 = T.s6;
const R7 = T.s7;
const R8 = T.s8;
const ST = T.story;

/* ------------------------------------------------------------------ typing (one key per entry in timing.json) */

const KEYS = R6.keys;
const lettersAt = (f: number) => KEYS.filter((k) => f >= k).length;

/* ------------------------------------------------------------------ camera */

type Cam = { z: number; rx: number; ry: number; sx: number; sy: number };

export const cameraAt = (f: number, pose: Pose = phonePose(f)): Cam => {
  const cx = PHONE.cx;
  const cy = PHONE.cy + pose.dy;
  let c: Cam = { z: 1, rx: cx, ry: cy, sx: cx, sy: cy };
  for (const k of T.camera.keys as { at: number; roi?: number[]; zoom: number }[]) {
    let target: Cam = { z: 1, rx: cx, ry: cy, sx: cx, sy: cy };
    if (k.roi && k.zoom !== 1) {
      const r = projectApp(k.roi[0], k.roi[1], pose);
      target = { z: k.zoom, rx: r.x, ry: r.y, sx: T.camera.to[0], sy: T.camera.to[1] };
    }
    const t = sp(f, k.at, SPRING.glide);
    c = { z: mix(c.z, target.z, t), rx: mix(c.rx, target.rx, t), ry: mix(c.ry, target.ry, t), sx: mix(c.sx, target.sx, t), sy: mix(c.sy, target.sy, t) };
  }
  return c;
};

const camApply = (c: Cam, p: { x: number; y: number }) => ({ x: (p.x - c.rx) * c.z + c.sx, y: (p.y - c.ry) * c.z + c.sy });

/* ------------------------------------------------------------------ the screen inside, per frame */

const optionsState = (f: number): OptionsState => ({
  rows: 1,
  rowIn: [0, 1, 2].map((i) => tw(f, R7.rows[0] + i * R7.rowStagger, R7.rows[0] + i * R7.rowStagger + 8, 0, 1, EASE.expoOut)),
  sel: tw(f, R7.selWipe[0], R7.selWipe[1], 0, 1, EASE.expoOut),
  border: tw(f, R7.selWipe[0], R7.selWipe[1], 0, 1, EASE.expoOut),
  rowPress: press(f, R7.tapPodSolo),
  contPress: press(f, R7.tapContinue),
  roll: R7.roll as [number, number],
});

const MapAndSheets: React.FC<{ f: number }> = ({ f }) => {
  const fareP = tw(f, R7.fare[0], R7.fare[1], 0, 1, EASE.expoOut);
  const payP = tw(f, R8.sheet[0], R8.sheet[1], 0, 1, EASE.expoOut);
  return (
    <>
      <OptionsScreen
        f={f}
        route={f < R6.route[0] ? -1 : tw(f, R6.route[0], R6.route[1], 0, 1, EASE.expoInOut)}
        pin={tw(f, R6.pinDrop[0], R6.pinDrop[1], 0, 1, EASE.expoOut)}
        pinRing={tw(f, R6.pinRing[0], R6.pinRing[1], 0, 1, EASE.expoOut)}
        st={optionsState(f)}
      />
      {fareP > 0 ? (
        <div style={{ position: "absolute", left: 0, top: (1 - fareP) * 620, width: 393, height: 852 }}>
          <FareSheet f={f} roll={R7.maxPayRoll as [number, number]} />
        </div>
      ) : null}
      {f >= R8.sheet[0] ? (
        <>
          {/* flat scrim: snaps on with the sheet (no dim fade) */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(16,17,17,0.28)" }} />
          <div style={{ position: "absolute", left: 0, top: (1 - payP) * 720, width: 393, height: 852 }}>
            <PaySheet f={f} />
          </div>
        </>
      ) : null}
    </>
  );
};

const Search: React.FC<{ f: number; overlay: boolean }> = ({ f, overlay }) => {
  const letters = lettersAt(f);
  const t4 = KEYS[3];
  const refresh = f < t4 ? tw(f, KEYS[0], KEYS[0] + R6.refreshDur, 0, 1, EASE.expoOut) : tw(f, t4, t4 + R6.refreshDur, 0, 1, EASE.expoOut);
  return (
    <>
      <SearchScreen f={f} letters={letters} caret={letters < s6.query.length || Math.floor(f / 8) % 2 === 0} refresh={refresh} refreshFrom={f < t4 ? 0 : 1} resultPress={press(f, R6.tapResult)} />
      {overlay && f >= R6.loading[0] && f < R6.loading[1] ? <LoadingOverlay spin={f} /> : null}
    </>
  );
};

const AppScreen: React.FC<{ f: number }> = ({ f }) => {
  const pulse = R5.pulses.map((a) => (f >= a && f < a + R5.pulseDraw * 2 ? (f - a) / (R5.pulseDraw * 2) : 0)).find((p) => p > 0) ?? 0;
  const homeS = <HomeScreen pulse={pulse} tilePress={press(f, R5.tap)} />;
  const plan = <PlanScreen locateRing={tw(f, R6.locateRing[0], R6.locateRing[1], 0, 1, EASE.expoOut)} destPress={press(f, R6.tapDest)} />;
  const pushP = (w: number[]) => tw(f, w[0], w[1], 0, 1, EASE.expoOut);
  let screen: React.ReactNode;
  if (f < R5.push[0]) screen = homeS;
  else if (f < R5.push[1]) screen = <Push p={pushP(R5.push)} from={homeS} to={plan} />;
  else if (f < R6.searchPush[0]) screen = plan;
  else if (f < R6.searchPush[1]) screen = <Push p={pushP(R6.searchPush)} from={plan} to={<Search f={f} overlay={false} />} />;
  else if (f < R6.mapPush[0]) screen = <Search f={f} overlay />;
  else if (f < R6.mapPush[1]) screen = <Push p={pushP(R6.mapPush)} from={<Search f={f} overlay={false} />} to={<MapAndSheets f={f} />} />;
  else if (f < R8.success[0]) screen = <MapAndSheets f={f} />;
  else {
    const c0 = R8.check[0];
    const succ = <SuccessScreen ring={tw(f, c0, c0 + 4, 0, 1, EASE.expoOut)} fill={tw(f, c0 + 4, c0 + 7, 0, 1, EASE.expoOut)} check={tw(f, c0 + 5, R8.check[1], 0, 1, EASE.expoOut)} />;
    screen = f < R8.success[1] ? <Push p={pushP(R8.success)} from={<MapAndSheets f={f} />} to={succ} /> : succ;
  }
  // keyboard: arrives with "Plan your ride", stays put through search, drops when the result is tapped
  const kbX = f < R5.push[1] ? (1 - pushP(R5.push)) * 393 : 0;
  const kbHide = tw(f, R6.loading[0], R6.loading[1], 0, 1, EASE.expoOut);
  const n = lettersAt(f);
  const pressed = n > 0 && f - KEYS[n - 1] < 2 && f < R6.tapResult ? s6.query[n - 1] : null;
  return (
    <>
      {screen}
      {f >= R5.push[0] && kbHide < 1 && f < R6.mapPush[1] ? (
        <div style={{ position: "absolute", left: kbX, top: 0, width: 393, height: 852 }}>
          <KeyboardLayer hide={kbHide} pressed={pressed} />
        </div>
      ) : null}
    </>
  );
};

const TAP_POS: [number, number][] = [
  [POS.podTile.x + POS.podTile.w / 2, POS.podTile.y + POS.podTile.h / 2],
  [POS.destRow.x, POS.destRow.y],
  [POS.topResult.x, POS.topResult.y],
  [POS.podSoloRow.x, POS.podSoloRow.y],
  [POS.continueBtn.x, POS.continueBtn.y],
  [POS.cardRow.x, POS.cardRow.y],
];
const TAPS: Tap[] = T.taps.map((at, i) => ({ at, x: TAP_POS[i][0], y: TAP_POS[i][1] }));

/* ------------------------------------------------------------------ story zone: numeral + line + lift-out */

const STEPS = [
  { n: s5.step, text: s5.line },
  { n: s6.step, text: s6.line },
  { n: s7.step, text: s7.line },
  { n: s8.step, text: s8.line },
];

// Google Sans: cap top sits at (halfLeading + 0.211em) below the line-box top (ascent .927, descent .244, cap .716)
const capTop = (size: number, lh: number) => ((lh - 1.171) / 2 + 0.211) * size;
const NUM = { x: STORY.x0, y: STORY.top, w: 160, h: TYPE.numeral };
const LINE = { x: STORY.x0 + 160, lh: 1.08 };
const LINE_Y = NUM.y + capTop(TYPE.numeral, 1) - capTop(TYPE.step, LINE.lh);
const LINE_W = SAFE.x1 - LINE.x; // lines may run to the title-safe edge
const linesOf = (i: number) => wrapLines(STEPS[i].text, TYPE.step, LINE_W);
const liftTop = (i: number) => NUM.y + Math.max(NUM.h, linesOf(i).length * TYPE.step * LINE.lh) + 48;

const stepOf = (f: number) => ST.numerals.reduce((acc, a, i) => (f >= a ? i : acc), 0);

/** Each new numeral replaces the last with a vertical roll: old rolls up, new rolls up from below (10f expoOut). */
const Numerals: React.FC<{ f: number }> = ({ f }) => {
  const k = stepOf(f);
  const at = ST.numerals[k];
  const p = tw(f, at, at + ST.numeralRoll, 0, 1, EASE.expoOut);
  const num = (i: number, y: number) => (
    <div key={i} style={{ position: "absolute", left: 0, top: y, ...typeStyle({ size: TYPE.numeral, lh: 1 }) }}>
      <span style={g2Text(f, "onLight", i * 60)}>{STEPS[i].n}</span>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: NUM.x, top: NUM.y, width: NUM.w, height: NUM.h, overflow: "hidden" }}>
      {k > 0 && p < 1 ? num(k - 1, -p * NUM.h) : null}
      {f >= at ? num(k, (1 - p) * NUM.h) : null}
    </div>
  );
};

const Lines: React.FC<{ f: number }> = ({ f }) => {
  const k = stepOf(f);
  return (
    <>
      {[k - 1, k].map((i) => {
        if (i < 0) return null;
        const outAt = i < STEPS.length - 1 ? ST.numerals[i + 1] : undefined;
        if (outAt !== undefined && f >= outAt + 3) return null;
        return <Slice key={i} f={f} lock={ST.lineLocks[i]} lines={linesOf(i)} size={TYPE.step} outAt={outAt} dist={260} style={{ position: "absolute", left: LINE.x, top: LINE_Y }} />;
      })}
    </>
  );
};

/** One lift-out per step: the element flies out of the phone (from its on-screen rect, camera and 3D pose included) to the story zone at 1.6×. */
const LIFTS = [
  { at: R5.lift, rect: POS.liftTile, node: () => <ServiceCard kind="pod" {...app.home.services.pod} /> },
  { at: R6.lift, rect: POS.liftDest, node: () => <DestRow /> },
  {
    at: R7.lift,
    rect: POS.liftPodSolo,
    node: (f: number) => <OptionRow kind="pod" title={app.options.podSolo.title} sub={app.options.podSolo.sub} unit={app.options.podSolo.unit} price={<RollText text={trip.podPrice} f={f} a={0} b={1} size={16} />} sel={1} border={1} />,
  },
  { at: R8.lift, rect: POS.liftCard, node: () => <PayRow i={0} sel={1} /> },
];

const Lift: React.FC<{ f: number; i: number; pose: Pose; cam: Cam }> = ({ f, i, pose, cam }) => {
  const L = LIFTS[i];
  if (f < L.at) return null;
  const exitAt = i < STEPS.length - 1 ? ST.numerals[i + 1] : T.phone.out;
  const q = tw(f, exitAt, exitAt + 8, 0, 1, EASE.quintIn);
  if (q >= 1) return null;
  const r = L.rect;
  const src = projectApp(r.x + r.w / 2, r.y + r.h / 2, pose);
  const srcC = camApply(cam, src);
  const sSrc = PHONE.scale * src.k * cam.z;
  const sDst = PHONE.scale * LIFT.scale;
  const dst = { x: STORY.x0 + (r.w * sDst) / 2, y: liftTop(i) + (r.h * sDst) / 2 };
  const p = sp(f, L.at, SPRING.glide);
  const x = mix(srcC.x, dst.x, p) + q * 1200;
  const y = mix(srcC.y, dst.y, p);
  const s = mix(sSrc, sDst, p);
  const tilt = 1 - p;
  return (
    <div style={{ position: "absolute", left: x - (r.w * s) / 2, top: y - (r.h * s) / 2, width: r.w * s, height: r.h * s, perspective: 1800 }}>
      {/* flat, hard-edged lift shadow (ink 10%, no blur) */}
      <div style={{ position: "absolute", left: 14 * p, top: 18 * p, width: r.w * s, height: r.h * s, borderRadius: 16 * s, background: "rgba(16,17,17,0.10)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: r.w, height: r.h, transformOrigin: "0 0", transform: `rotateY(${(pose.ry * tilt).toFixed(2)}deg) rotateX(${(pose.rx * tilt).toFixed(2)}deg) scale(${s.toFixed(4)})` }}>
        {L.node(f)}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ the act */

export const PhoneScene: React.FC = () => {
  const f = useCurrentFrame();
  const pose = phonePose(f);
  const cam = cameraAt(f, pose);
  const k = stepOf(f);
  return (
    <AbsoluteFill>
      <G3 f={f} />
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${(cam.sx - cam.rx * cam.z).toFixed(2)}px, ${(cam.sy - cam.ry * cam.z).toFixed(2)}px) scale(${cam.z.toFixed(4)})` }}>
        <Phone3D f={f} pose={pose} screen={<AppScreen f={f} />} glass={<FingerLayer f={f} taps={TAPS} windows={T.finger.windows} />} />
      </AbsoluteFill>
      <Numerals f={f} />
      <Lines f={f} />
      {[k - 1, k].map((i) => (i >= 0 ? <Lift key={i} f={f} i={i} pose={pose} cam={cam} /> : null))}
    </AbsoluteFill>
  );
};


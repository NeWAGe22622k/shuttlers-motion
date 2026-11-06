import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { EASE, M, STORY, T, TYPE } from "../config/brand";
import { s5, s6, s7, s8 } from "../config/content";
import { G3, g2Text } from "../config/gradients";
import { press, tw } from "../components/motion";
import { FingerLayer, Phone3D, Tap } from "../components/Phone";
import { Slice, scaleCut, textWidth, typeStyle, wrapLines } from "../components/type";
import { FareSheet, HomeScreen, KeyboardLayer, LoadingOverlay, OptionsScreen, OptionsState, PaySheet, PlanScreen, POS, Push, SearchScreen, SuccessScreen } from "../screens/Screens";

/**
 * Steps 1–4 (f180–510): one persistent 3D phone on G3 paper, step copy in the story zone.
 * Inside the phone every screen change is an iOS push; every tap is a fingertip ring on the glass.
 */

const R5 = T.s5;
const R6 = T.s6;
const R7 = T.s7;
const R8 = T.s8;

/* ------------------------------------------------------------------ typing */

const typedAt = (n: number) => R6.type[0] + ((n - 1) * (R6.type[1] - R6.type[0])) / (s6.query.length - 1);
const lettersAt = (f: number) => {
  let n = 0;
  for (let i = 1; i <= s6.query.length; i++) if (f >= typedAt(i)) n = i;
  return n;
};

/* ------------------------------------------------------------------ the screen inside, per frame */

const optionsState = (f: number): OptionsState => ({
  rows: 1,
  rowIn: [0, 1, 2].map((i) => tw(f, R7.rows[0] + i * R7.rowStagger, R7.rows[0] + i * R7.rowStagger + 12, 0, 1, EASE.expoOut)),
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
  const t4 = typedAt(4);
  const refresh = f < t4 ? tw(f, R6.type[0], R6.type[0] + R6.refreshDur, 0, 1, EASE.expoOut) : tw(f, t4, t4 + R6.refreshDur, 0, 1, EASE.expoOut);
  return (
    <>
      <SearchScreen f={f} letters={letters} caret={letters < s6.query.length || Math.floor(f / 8) % 2 === 0} refresh={refresh} refreshFrom={f < t4 ? 0 : 1} resultPress={press(f, R6.tapResult)} />
      {overlay && f >= R6.loading[0] && f < R6.loading[1] ? <LoadingOverlay spin={f} /> : null}
    </>
  );
};

const AppScreen: React.FC<{ f: number }> = ({ f }) => {
  const pulse = R5.pulses.map((a) => (f >= a && f < a + R5.pulseDraw * 2 ? (f - a) / (R5.pulseDraw * 2) : 0)).find((p) => p > 0) ?? 0;
  const home = <HomeScreen pulse={pulse} tilePress={press(f, R5.tap)} />;
  const plan = <PlanScreen locateRing={tw(f, R6.locateRing[0], R6.locateRing[1], 0, 1, EASE.expoOut)} destPress={press(f, R6.tapDest)} />;
  const pushP = (w: number[]) => tw(f, w[0], w[1], 0, 1, EASE.expoOut);
  let screen: React.ReactNode;
  if (f < R5.push[0]) screen = home;
  else if (f < R5.push[1]) screen = <Push p={pushP(R5.push)} from={home} to={plan} />;
  else if (f < R6.searchPush[0]) screen = plan;
  else if (f < R6.searchPush[1]) screen = <Push p={pushP(R6.searchPush)} from={plan} to={<Search f={f} overlay={false} />} />;
  else if (f < R6.mapPush[0]) screen = <Search f={f} overlay />;
  else if (f < R6.mapPush[1]) screen = <Push p={pushP(R6.mapPush)} from={<Search f={f} overlay={false} />} to={<MapAndSheets f={f} />} />;
  else if (f < R8.success[0]) screen = <MapAndSheets f={f} />;
  else {
    const succ = <SuccessScreen ring={tw(f, R8.check[0], R8.check[0] + 5, 0, 1, EASE.expoOut)} fill={tw(f, R8.check[0] + 5, R8.check[0] + 8, 0, 1, EASE.expoOut)} check={tw(f, R8.check[0] + 6, R8.check[1], 0, 1, EASE.expoOut)} />;
    screen = f < R8.success[1] ? <Push p={pushP(R8.success)} from={<MapAndSheets f={f} />} to={succ} /> : succ;
  }
  // keyboard: arrives with "Plan your ride", stays put through search, drops when the result is tapped
  const kbX = f < R5.push[1] ? (1 - pushP(R5.push)) * 393 : 0;
  const kbHide = tw(f, R6.loading[0], R6.loading[1], 0, 1, EASE.expoOut);
  const n = lettersAt(f);
  const pressed = n > 0 && f - typedAt(n) < 2 && f < R6.tapResult ? s6.query[n - 1] : null;
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

/* ------------------------------------------------------------------ story zone */

const STEPS = [
  { at: R5.numeral, line: R5.line, n: s5.step, text: s5.line },
  { at: R6.numeral, line: R6.line, n: s6.step, text: s6.line },
  { at: R7.numeral, line: R7.line, n: s7.step, text: s7.line },
  { at: R8.numeral, line: R8.line, n: s8.step, text: s8.line },
];
const NUM = { top: STORY.top, clipH: 236, offset: -72 };

const Story: React.FC<{ f: number }> = ({ f }) => {
  const k = STEPS.reduce((acc, s, i) => (f >= s.at ? i : acc), 0);
  const zoneW = STORY.x1 - STORY.x0;
  return (
    <>
      {/* numerals: cropped by the top of the story zone; the old one slides out as the new one scale-cuts in */}
      <div style={{ position: "absolute", left: STORY.x0, top: NUM.top, width: zoneW, height: NUM.clipH, overflow: "hidden" }}>
        {STEPS.map((s, i) => {
          if (i > k || i < k - 1) return null;
          const out = i < k ? tw(f, STEPS[i + 1].at, STEPS[i + 1].at + M.scaleCut, 0, 1, EASE.expoOut) : 0;
          if (out >= 1) return null;
          const sc = scaleCut(f, s.at);
          if (sc === 0) return null;
          const w = textWidth(s.n, TYPE.numeral);
          const push = 1 + 0.02 * Math.max(0, (f - s.at) / 30);
          return (
            <div key={i} style={{ position: "absolute", left: -out * (w + 120), top: NUM.offset, transform: `scale(${(sc * push).toFixed(4)})`, transformOrigin: `${w / 2}px 60%` }}>
              <div style={{ ...typeStyle({ size: TYPE.numeral, lh: 1 }) }}>
                <span style={{ ...g2Text(f, "onLight", i * 60) }}>{s.n}</span>
              </div>
            </div>
          );
        })}
      </div>
      {STEPS.map((s, i) => {
        if (i > k || i < k - 1) return null;
        if (f < s.line) return null;
        const outAt = i < STEPS.length - 1 ? STEPS[i + 1].at - 5 : undefined;
        if (outAt !== undefined && f > outAt + 9) return null;
        const lines = wrapLines(s.text, TYPE.step, zoneW);
        const push = 1 + 0.02 * Math.max(0, (f - s.line) / 30);
        return (
          <div key={i} style={{ position: "absolute", left: STORY.x0, top: 438, transform: `scale(${push.toFixed(4)})`, transformOrigin: "0 0" }}>
            <Slice f={f} at={s.line} lines={lines} size={TYPE.step} outAt={outAt} dist={360} />
          </div>
        );
      })}
    </>
  );
};

/* ------------------------------------------------------------------ the act */

export const PhoneScene: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <G3 f={f} />
      <Phone3D f={f} screen={<AppScreen f={f} />} glass={<FingerLayer f={f} taps={TAPS} windows={T.finger.windows} />} />
      <Story f={f} />
    </AbsoluteFill>
  );
};


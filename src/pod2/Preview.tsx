import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useFontsReady } from "../components/useFontsReady";
import { C, fontFamily, PHONE } from "./config/brand";
import { G1, G2, G3, g4Css, Texture } from "./config/gradients";
import { Breath, Eye, Handset, Pin, SleepFace } from "./components/Icons";
import { FlapDigit, RollText } from "./components/kit";
import { FingerLayer } from "./components/Phone";
import { PodAt } from "./components/Pod";
import { FillSweep, MaskRise, Slice } from "./components/type";
import { FareSheet, HomeScreen, OptionsScreen, PayScreen, PlanScreen, SearchScreen, SuccessScreen } from "./screens/Screens";
import { AppMap } from "./screens/AppMap";

/**
 * Components-Preview-V2. Page 1 (f0–59): every component in every state. Page 2 (f60–119): every
 * rebuilt screen. Gradients keep drifting so the sheet is a live check of the motion system too.
 */

const Label: React.FC<{ x: number; y: number; t: string; color?: string }> = ({ x, y, t, color = C.muted }) => (
  <div style={{ position: "absolute", left: x, top: y, fontFamily, fontSize: 15, fontWeight: 600, color, letterSpacing: 0.4 }}>{t}</div>
);

const Swatch: React.FC<{ x: number; y: number; t: string; children: React.ReactNode }> = ({ x, y, t, children }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 210, height: 120 }}>
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 12 }}>{children}</div>
    <Label x={0} y={128} t={t} />
  </div>
);

const Page1: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <G3 f={f} />
    {/* gradients */}
    <Swatch x={60} y={40} t="G1 Lagos 8:50">
      <G1 f={f} style={{ transform: "scale(0.11)", transformOrigin: "0 0", width: 1920, height: 1080 }} />
    </Swatch>
    <Swatch x={290} y={40} t="G2 Pod Flood">
      <G2 f={f} />
    </Swatch>
    <Swatch x={520} y={40} t="G2 end">
      <G2 f={f} tone="end" />
    </Swatch>
    <Swatch x={750} y={40} t="G3 Paper">
      <G3 f={f} style={{ transform: "scale(0.11)", transformOrigin: "0 0", width: 1920, height: 1080 }} />
    </Swatch>
    <Swatch x={980} y={40} t="G4 Stepped band">
      <div style={{ position: "absolute", inset: 0, background: g4Css("90deg") }} />
    </Swatch>
    {/* THE POD */}
    {[
      { t: "hero", p: {} },
      { t: "seatFill .5", p: { seatFill: 0.5 } },
      { t: "seatFill 1", p: { seatFill: 1 } },
      { t: "bodyFlood .5", p: { seatFill: 1, bodyFlood: 0.5 } },
      { t: "bodyFlood 1", p: { seatFill: 1, bodyFlood: 1 } },
      { t: "lights · door ajar", p: { headlights: "white" as const, door: 0 } },
    ].map((v, i) => (
      <React.Fragment key={v.t}>
        <PodAt f={f} x={130 + i * 180} y={420} size={260} {...v.p} />
        <Label x={70 + i * 180} y={570} t={v.t} />
      </React.Fragment>
    ))}
    <PodAt f={f} x={1180} y={420} size={60} variant="marker" heading={90} />
    <Label x={1140} y={470} t="marker" />
    {/* icons */}
    {[
      ["eye open", <Eye size={84} lid={0} />],
      ["eye half", <Eye size={84} lid={0.5} />],
      ["eye shut", <Eye size={84} lid={1} />],
      ["handset", <Handset size={84} rock={0} />],
      ["handset 12°", <Handset size={84} rock={12} />],
      ["face open", <SleepFace size={84} close={0} />],
      ["face shut", <SleepFace size={84} close={1} />],
      ["breath", <Breath size={84} draw={1} phase={f / 6} />],
      ["pin", <Pin size={84} />],
      ["pin outline", <Pin size={84} outline />],
    ].map(([t, el], i) => (
      <React.Fragment key={t as string}>
        <div style={{ position: "absolute", left: 70 + i * 120, top: 640 }}>{el as React.ReactNode}</div>
        <Label x={70 + i * 120} y={736} t={t as string} />
      </React.Fragment>
    ))}
    {/* flap + roll */}
    <div style={{ position: "absolute", left: 1300, top: 40, display: "flex", gap: 16, background: C.night, padding: 16, borderRadius: 12 }}>
      {[0, 0.3, 0.5, 0.75, 1].map((p) => (
        <FlapDigit key={p} from="4" to="5" p={p} w={90} h={130} font={104} />
      ))}
    </div>
    <div style={{ position: "absolute", left: 1300, top: 230 }}>
      <RollText text="₦2,903.17" f={f % 30} a={0} b={20} size={56} color={C.priceGreen} />
    </div>
    {/* type reveals, mid-flight and landed */}
    <MaskRise f={f % 30} at={0} lines={["maskRise words"]} size={56} style={{ position: "absolute", left: 1300, top: 330 }} />
    <Slice f={f % 30} lock={6} lines={["slice locks"]} size={56} style={{ position: "absolute", left: 1300, top: 420 }} />
    <div style={{ position: "absolute", left: 1300, top: 510 }}>
      <FillSweep f={f % 30} at={6} text="fillSweep" size={72} />
    </div>
    {/* fingertip + tap ring */}
    <div style={{ position: "absolute", left: 1350, top: 820, width: 393, height: 200, transform: `scale(${PHONE.scale})`, transformOrigin: "0 0" }}>
      <FingerLayer f={(f % 30) + 100} taps={[{ at: 110, x: 60, y: 60 }]} windows={[[96, 140]]} />
      <FingerLayer f={115} taps={[{ at: 110, x: 200, y: 60 }]} windows={[]} />
    </div>
    <Label x={1350} y={950} t="fingertip · press · tap ring" />
    <Texture f={f} />
  </AbsoluteFill>
);

const Page2: React.FC<{ f: number }> = ({ f }) => {
  const opts = { rows: 1, rowIn: [1, 1, 1], sel: 1, border: 1, rowPress: 1, contPress: 1, roll: [0, 1] as [number, number] };
  const screens: [string, React.ReactNode][] = [
    ["01 home", <HomeScreen pulse={0.3} />],
    ["02 plan", <PlanScreen locateRing={0.4} />],
    ["03 search", <SearchScreen f={f} letters={9} caret refresh={1} refreshFrom={0} />],
    ["05/06 options", <OptionsScreen f={f} route={1} pin={1} pinRing={0} st={opts} />],
    [
      "07 fare",
      <>
        <AppMap f={f} route={1} pin={1} view={{ dx: 0, dy: -110, z: 1 }} />
        <FareSheet f={f} roll={[0, 1]} />
      </>,
    ],
    ["08 pay", <PayScreen f={f} sheetY={0} />],
    ["09 success", <SuccessScreen ring={1} fill={1} check={1} />],
  ];
  const sc = 0.5;
  return (
    <AbsoluteFill>
      <G3 f={f} />
      {screens.map(([t, el], i) => (
        <div key={t} style={{ position: "absolute", left: 60 + i * 260, top: 80 }}>
          <div style={{ width: 393 * sc, height: 852 * sc, overflow: "hidden", borderRadius: 18, boxShadow: "0 0 0 2px #101111" }}>
            <div style={{ width: 393, height: 852, transform: `scale(${sc})`, transformOrigin: "0 0", position: "relative", background: "#fff" }}>{el}</div>
          </div>
          <Label x={0} y={852 * sc + 14} t={t} />
        </div>
      ))}
      <Texture f={f} />
    </AbsoluteFill>
  );
};

export const Components2: React.FC = () => {
  const f = useCurrentFrame();
  const ready = useFontsReady();
  if (!ready) return null;
  return f < 60 ? <Page1 f={f} /> : <Page2 f={f} />;
};

import React from "react";
import { AbsoluteFill } from "remotion";
import { ReferenceOverlay } from "../components/ReferenceOverlay";
import { useFontsReady } from "../components/useFontsReady";
import { StatusBar } from "./components/Phone";
import { KeyboardLayer, FareSheet, HomeScreen, LoadingOverlay, OptionsScreen, PayScreen, PlanScreen, PodBookedScreen, FindingPodScreen, SearchScreen, SuccessScreen } from "./screens/Screens";
import { AppMap } from "./screens/AppMap";

/** Build aid: one rebuilt screen at 393×852 with the 3× reference laid over it at `overlay` opacity. */
export type Screen2 = "home" | "plan" | "search" | "loading" | "options-loading" | "options" | "fare" | "pay" | "success" | "booked" | "finding";
const REF: Record<Screen2, string> = {
  home: "screens/01-home.png",
  plan: "screens/02-plan-your-ride.png",
  search: "screens/03-search-results.png",
  loading: "screens/04-search-tap-loading.png",
  "options-loading": "screens/05-options-loading.png",
  options: "screens/06-ride-options.png",
  fare: "screens/07-fare-summary.png",
  pay: "screens/08-payment-method.png",
  success: "screens/09-payment-success.png",
  booked: "screens/10-pod-booked.png",
  finding: "screens/11-finding-pod.png",
};

export const ScreenCheck2: React.FC<{ screen: Screen2; overlay: number }> = ({ screen, overlay }) => {
  const ready = useFontsReady();
  if (!ready) return null;
  const f = 600;
  const opts = { rows: 1, rowIn: [1, 1, 1], sel: 0, border: 0, rowPress: 1, contPress: 1, roll: [0, 1] as [number, number] };
  const body = {
    home: <HomeScreen />,
    plan: (
      <>
        <PlanScreen />
        <KeyboardLayer hide={0} pressed={null} />
      </>
    ),
    search: (
      <>
        <SearchScreen f={f} letters={9} caret refresh={1} refreshFrom={0} />
        <KeyboardLayer hide={0} pressed={null} />
      </>
    ),
    loading: (
      <>
        <SearchScreen f={f} letters={9} caret={false} refresh={1} refreshFrom={0} />
        <LoadingOverlay spin={f} />
      </>
    ),
    "options-loading": <OptionsScreen f={f} route={1} pin={1} pinRing={0} st={{ ...opts, rowIn: [0, 0, 0] }} />,
    options: <OptionsScreen f={f} route={1} pin={1} pinRing={0} st={{ ...opts, sel: 1, border: 1 }} />,
    fare: (
      <>
        <AppMap f={f} route={1} pin={1} view={{ dx: 0, dy: -110, z: 1 }} />
        <FareSheet f={f} roll={[0, 1]} />
      </>
    ),
    pay: <PayScreen f={f} sheetY={0} />,
    success: <SuccessScreen ring={1} fill={1} check={1} />,
    booked: <PodBookedScreen shapes={1} />,
    finding: <FindingPodScreen f={f} progress={0.1} />,
  }[screen];
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      {body}
      <StatusBar />
      <ReferenceOverlay src={REF[screen]} opacity={overlay} on={overlay > 0} />
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill } from "remotion";
import { ReferenceOverlay } from "../components/ReferenceOverlay";
import { useFontsReady } from "../components/useFontsReady";
import { StatusBar } from "./components/Phone";
import { CompletingSheets, FareSheet, FindingPodScreen, HomeScreen, KeyboardLayer, MapBackdrop, OptionsScreen, PayScreen, PlanScreen, PodBookedScreen, SearchScreen, SuccessScreen } from "./screens/Screens";

/** Build aid: one rebuilt screen at 393×852 with its 3× reference screenshot laid over it at `overlay` opacity. */
export type Screen2 = "home" | "home-pressed" | "plan" | "plan-open" | "search" | "search-tap" | "options-loading" | "options" | "fare" | "pay" | "completing" | "success" | "booked" | "finding";
const REF: Record<Screen2, string> = {
  home: "screens/01-home.png",
  "home-pressed": "screens/01b-home-pod-pressed.png",
  plan: "screens/02-plan-your-ride.png",
  "plan-open": "screens/02a-plan-your-ride-open.png",
  search: "screens/03b-search-destination.png",
  "search-tap": "screens/04-search-tap.png",
  "options-loading": "screens/05-options-loading.png",
  options: "screens/06-ride-options.png",
  fare: "screens/07-fare-summary.png",
  pay: "screens/08-payment-method.png",
  completing: "screens/08b-completing-payment.png",
  success: "screens/09-payment-success.png",
  booked: "screens/10-pod-booked.png",
  finding: "screens/11-finding-pod.png",
};

export const ScreenCheck2: React.FC<{ screen: Screen2; overlay: number }> = ({ screen, overlay }) => {
  const ready = useFontsReady();
  if (!ready) return null;
  const f = 600;
  const opts = { dailyIn: 1, rowIn: [1, 1, 1], rowPress: 1, contPress: 1, contReady: false, roll: [0, 1] as [number, number] };
  const body = {
    home: <HomeScreen />,
    "home-pressed": <HomeScreen tileDark={1} tileScale={0.97} />,
    plan: <PlanScreen />,
    "plan-open": (
      <>
        <PlanScreen focused caret />
        <KeyboardLayer hide={0} pressed={null} />
      </>
    ),
    search: (
      <>
        <SearchScreen letters={6} caret refresh={1} />
        <KeyboardLayer hide={0} pressed={null} />
      </>
    ),
    "search-tap": (
      <>
        <SearchScreen letters={6} caret={false} refresh={1} tapDim />
        <KeyboardLayer hide={0} pressed={null} />
      </>
    ),
    "options-loading": <OptionsScreen f={f} route={1} pin={1} pinRing={0} st={{ ...opts, rowIn: [0, 0, 0] }} />,
    options: <OptionsScreen f={f} route={1} pin={1} pinRing={0} st={opts} />,
    fare: (
      <>
        <MapBackdrop f={f} />
        <FareSheet f={f} roll={[0, 1]} />
      </>
    ),
    pay: <PayScreen f={f} sheetY={0} />,
    completing: (
      <>
        <MapBackdrop f={f} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(16,17,17,0.28)" }} />
        <CompletingSheets spin={f} k={1} />
      </>
    ),
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

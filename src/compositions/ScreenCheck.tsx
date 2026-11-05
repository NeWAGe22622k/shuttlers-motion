import React from "react";
import { AbsoluteFill } from "remotion";
import { HomeScreen } from "../screens/Home";
import { PlanRideScreen, PLAN_DEFAULT } from "../screens/PlanRide";
import { FareSheet, MapStage, OptionsSheet, PaymentSheet, VIEWS } from "../screens/Trip";
import { BookedScreen, SuccessScreen } from "../screens/Booked";
import { FindingSheet, PilotSheet } from "../screens/Pilot";
import { ReferenceOverlay } from "../components/ReferenceOverlay";
import { StatusBar } from "../components/Phone";
import { content } from "../config/content";

const TR = content.trip;

export const SCREENS: Record<string, { ref?: string; el: React.ReactNode }> = {
  home: { ref: "screens/01-home.png", el: <HomeScreen /> },
  plan: { ref: "screens/02-plan-your-ride.png", el: <PlanRideScreen st={{ ...PLAN_DEFAULT, kb: 1 }} /> },
  search: { ref: "screens/03-search-results.png", el: <PlanRideScreen st={{ ...PLAN_DEFAULT, searchP: 1, letters: 9, kb: 1, caretOn: true }} /> },
  loading: { ref: "screens/04-search-tap-loading.png", el: <PlanRideScreen st={{ ...PLAN_DEFAULT, searchP: 1, letters: 9, kb: 0, dim: 1, spin: 3 }} /> },
  optionsLoading: {
    ref: "screens/05-options-loading.png",
    el: (
      <>
        <MapStage st={{ view: VIEWS.options, compact: 0, routeP: 1, pickupS: 1, dropS: 1, distChip: 1 }} />
        <OptionsSheet rowState={["skeleton", "skeleton", "skeleton"]} rowIn={[0, 0, 0]} prices={[]} sel={0} hop={0} spin={0} />
      </>
    ),
  },
  options: {
    ref: "screens/06-ride-options.png",
    el: (
      <>
        <MapStage st={{ view: VIEWS.options, compact: 0, routeP: 1, pickupS: 1, dropS: 1, distChip: 1 }} />
        <OptionsSheet rowState={["default", "default", "default"]} rowIn={[1, 1, 1]} prices={[TR.dailyPrice, TR.podPrice]} sel={1} hop={0} spin={0} />
      </>
    ),
  },
  fare: {
    ref: "screens/07-fare-summary.png",
    el: (
      <>
        <MapStage st={{ view: VIEWS.fare, compact: 1, routeP: 1, pickupS: 1, dropS: 1, distChip: 0 }} />
        <FareSheet maxPay={TR.maxPay} />
      </>
    ),
  },
  payment: {
    ref: "screens/08-payment-method.png",
    el: (
      <>
        <MapStage st={{ view: VIEWS.fare, compact: 1, routeP: 1, pickupS: 1, dropS: 1, distChip: 0, dim: 0.35 }} />
        <PaymentSheet rowsIn={[1, 1, 1, 1]} countdown="4:50" sel={0} contFill={0} />
      </>
    ),
  },
  success: { ref: "screens/09-payment-success.png", el: <SuccessScreen circle={1} check={1} /> },
  booked: { ref: "screens/10-pod-booked.png", el: <BookedScreen ribbons={1} pieces={1} confettiT={-1} life={40} /> },
  finding: {
    ref: "screens/11-finding-pod.png",
    el: (
      <>
        <MapStage st={{ view: VIEWS.finding, compact: 1, routeP: 1, pickupS: 1, dropS: 1, distChip: 0 }} />
        <FindingSheet p={0.15} />
      </>
    ),
  },
  pilot: {
    el: (
      <>
        <MapStage st={{ view: VIEWS.finding, compact: 1, routeP: 1, pickupS: 1, dropS: 1, distChip: 0, car: { t: 1, opacity: 1 } }} />
        <PilotSheet eta={<span>&nbsp;3 min</span>} />
      </>
    ),
  },
};

export const ScreenCheck: React.FC<{ screen: string; overlay: number }> = ({ screen, overlay }) => {
  const s = SCREENS[screen];
  return (
    <AbsoluteFill style={{ background: "#fff", overflow: "hidden" }}>
      {s.el}
      <StatusBar />
      {s.ref ? <ReferenceOverlay src={s.ref} opacity={overlay} on={overlay > 0} /> : null}
    </AbsoluteFill>
  );
};

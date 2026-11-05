import React from "react";
import { Trail } from "@remotion/motion-blur";
import { C, EASE, SPRING, TYPE } from "../config/brand";
import { content } from "../config/content";
import { T, useT } from "../config/time";
import { FleetCar, Roll, SettleWords } from "../components/core";
import { LiftOut, isLifted } from "../components/LiftOut";
import { fx, press, sp, speedBlur, tw } from "../components/motion";
import { RideOptionRow, BtnState } from "../components/ui";
import { FareSheet, FARE_SHEET_TOP, MapStage, OptionsSheet, OPTIONS_SHEET_TOP, OPTION_ROW_Y, PaymentSheet, PAY_SHEET_TOP, VIEWS, lerpView } from "../screens/Trip";
import type { PhonePose } from "./PhoneAct";

const S5 = T.hero.s5;
const S6 = T.hero.s6;
const S7 = T.hero.s7;
const TR = content.trip;

const btn = (f: number, at: number): BtnState => (f >= at && f < at + 4 ? "pressed" : "default");

/** Map + sheets for S5 → S7 (frames s4.push … s7.success). */
export const TripScreen: React.FC<{ f: number }> = ({ f }) => {
  const viewT = tw(f, S5.fareRise + 2, S6.sheetRiseEnd - 2, 0, 1, EASE.inOut);
  const optTop = f < S5.fareRise ? OPTIONS_SHEET_TOP + (852 - OPTIONS_SHEET_TOP) * (1 - tw(f, S5.skeleton, S5.skeleton + 12, 0, 1, EASE.out)) : OPTIONS_SHEET_TOP + (852 - OPTIONS_SHEET_TOP) * tw(f, S5.fareRise, S5.fareRise + 12, 0, 1, EASE.in);
  const fareTop = 852 - (852 - FARE_SHEET_TOP) * tw(f, S6.sheetRise, S6.sheetRise + 18, 0, 1, EASE.out) + (852 - FARE_SHEET_TOP) * tw(f, S7.sheetUp, S7.sheetUp + 14, 0, 1, EASE.in);
  const payTop = 852 - (852 - PAY_SHEET_TOP) * tw(f, S7.sheetUp, S7.sheetUp + 14, 0, 1, EASE.out);
  const rowIn = [0, 1, 2].map((i) => tw(f, S5.resolve + i * S5.resolveStagger, S5.resolve + i * S5.resolveStagger + 8, 0, 1, EASE.out));
  const prices = [
    <Roll key="d" text={TR.dailyPrice} at={S5.resolve + 2} f={f} size={16} />,
    <Roll key="p" text={TR.podPrice} at={S5.resolve + S5.resolveStagger + 2} f={f} size={16} />,
  ];
  const lockK = sp(f, S6.lock, SPRING.pop);
  const pulse = Math.sin(Math.PI * tw(f, S6.lock + 2, S6.lock + 16));
  const secs = content.s7.countdownFrom - Math.max(0, Math.floor((f - S7.sheetUp) / 30));
  const countdown = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <>
      <MapStage
        st={{
          view: lerpView(VIEWS.options, VIEWS.fare, viewT),
          compact: tw(f, S5.fareRise + 4, S6.sheetRise + 16),
          routeP: tw(f, S5.routeDraw, S5.routeDrawEnd, 0, 1, EASE.inOut),
          pickupS: sp(f, S5.markerPickup, SPRING.pop),
          dropS: sp(f, S5.markerDrop, SPRING.pop),
          distChip: sp(f, S5.distanceChip, SPRING.pop) * (1 - tw(f, S5.fareRise, S5.fareRise + 8)),
          dim: 0.35 * tw(f, S7.sheetUp, S7.sheetUp + 12),
        }}
      />
      {optTop < 852 ? (
        <OptionsSheet top={optTop} rowState={rowIn.map((r) => (r > 0 ? "default" : "skeleton"))} rowIn={rowIn} prices={prices} sel={tw(f, S5.select, S5.select + 7, 0, 1, EASE.out)} hop={7 * Math.sin(Math.PI * tw(f, S5.select, S5.select + 10))} spin={f} ghostPod={isLifted(f, S5.lift, S5.liftReturn)} cont={btn(f, S5.tap)} />
      ) : null}
      {fareTop < 852 ? <FareSheet top={fareTop} maxPay={<Roll text={TR.maxPay} at={S6.maxPayRoll} f={f} size={20} color={C.priceGreen} />} lock={lockK} pulse={pulse} ghostMax={isLifted(f, S6.rowLift, S6.rowReturn)} pay={btn(f, S6.tapPay)} /> : null}
      {payTop < 852 ? <PaymentSheet top={payTop} rowsIn={[0, 1, 2, 3].map((i) => tw(f, S7.sheetUp + 7 + i * 3, S7.sheetUp + 15 + i * 3, 0, 1, EASE.out))} countdown={countdown} sel={tw(f, S7.tapCard, S7.tapCard + 6, 0, 1, EASE.out)} cardPress={press(f, S7.tapCard)} contFill={tw(f, S7.tapCard + 2, S7.tapContinue, 0, 1, EASE.inOut)} cont={btn(f, S7.tapContinue)} /> : null}
    </>
  );
};

/* ----------------------------------------------------------------- story */

const carX = (f: number) => 2380 + (1420 - 2380) * tw(f, S5.carIn, S5.carIn + 13, 0, 1, EASE.out);

const ArrivingCar: React.FC = () => {
  const f = useT();
  const arrive = S5.carIn + 11;
  const k = f - arrive;
  const bounce = k > 0 ? Math.exp(-k / 5) * Math.sin(k / 1.9) : 0;
  const brake = tw(f, S5.carIn + 7, arrive, 0, 1) * (1 - tw(f, arrive, arrive + 10));
  const out = fx(f, null, S5.liftReturn);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out.opacity as number, filter: out.filter }}>
      <FleetCar id="s5car" src="vehicles/fleet-a-34.png" w={620} aspect={613 / 938} x={carX(f)} ground={968} dip={6 * Math.max(0, bounce) + 2 * brake} pitch={-1 * brake - 0.6 * bounce} blurX={speedBlur(carX, f, 0.25, 26)} />
    </div>
  );
};

export const S5Story: React.FC<{ f: number; phone: PhonePose }> = ({ f, phone }) => {
  if (f < S5.lift - 2 || f > S5.end + 10) return null;
  return (
    <>
      <SettleWords text={content.s5.caption} at={S5.lift} outAt={S5.liftReturn} size={TYPE.caption} accents={{ minutes: C.brandGreen }} seed="s5" style={{ position: "absolute", left: 1040, top: 150 }} />
      <LiftOut f={f} out={S5.lift} back={S5.liftReturn} slot={{ x: 17, y: OPTIONS_SHEET_TOP + OPTION_ROW_Y[1], w: 358, h: 68 }} phone={phone} to={{ cx: 1353, cy: 330, scale: 1.6 }}>
        <RideOptionRow kind="pod" {...TR.podSolo} price={TR.podPrice} unit={TR.podSolo.unit} sel={1} lifted />
      </LiftOut>
      {f >= S5.carIn - 1 && f < S5.liftReturn + 9 ? (
        <Trail layers={4} lagInFrames={0.35} trailOpacity={0.55}>
          <ArrivingCar />
        </Trail>
      ) : null}
    </>
  );
};

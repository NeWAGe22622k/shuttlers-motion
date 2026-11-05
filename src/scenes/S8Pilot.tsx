import React from "react";
import { AbsoluteFill } from "remotion";
import { Trail } from "@remotion/motion-blur";
import { C, EASE, SPRING, TYPE } from "../config/brand";
import { content } from "../config/content";
import { T, useT } from "../config/time";
import { Capsule, FleetCar, IconChip, SettleWords } from "../components/core";
import { I } from "../components/Icons";
import { LiftOut, isLifted } from "../components/LiftOut";
import { mix, sp, speedBlur, tw } from "../components/motion";
import { toFrame } from "../components/Phone";
import { PICKUP, worldToScreen } from "../components/StylisedMap";
import { FindingSheet, FINDING_SHEET_TOP, PilotSheet, PILOT_BADGE_Y } from "../screens/Pilot";
import { MapStage, VIEWS } from "../screens/Trip";
import type { PhonePose } from "./PhoneAct";

const S = T.hero.s8;
const S8C = content.s8;

const Eta: React.FC<{ f: number }> = ({ f }) => {
  const p = tw(f, S.badgeLift + 22, S.badgeLift + 30, 0, 1, EASE.inOut);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontVariantNumeric: "tabular-nums", color: "#3e4240", fontWeight: 600 }}>
      <span style={{ display: "inline-block", height: 15, overflow: "hidden", position: "relative", width: 8 }}>
        <span style={{ position: "absolute", left: 0, top: -15 * p, display: "flex", flexDirection: "column", lineHeight: "15px" }}>
          <span>{S8C.etaFrom}</span>
          <span>{S8C.etaTo}</span>
        </span>
      </span>
      &nbsp;{S8C.etaUnit}
    </span>
  );
};

export const S8Screen: React.FC<{ f: number }> = ({ f }) => {
  const pilotIn = tw(f, S.accepted + 4, S.accepted + 8);
  const radar = [0, 1, 2].map((i) => (f - (S.finding + i * S.radarStep)) / 30);
  return (
    <>
      <MapStage st={{ view: VIEWS.finding, compact: 1, routeP: 1, pickupS: 1, dropS: 1, distChip: 0, radar, car: f >= S.carDrive - 2 ? { t: tw(f, S.carDrive, S.carDrive + 30, 0, 1, EASE.inOut), opacity: tw(f, S.carDrive - 2, S.carDrive + 3) } : null }} />
      {pilotIn < 1 ? <FindingSheet p={mix(0.15, 1, tw(f, S.finding, S.accepted - 2, 0, 1, EASE.out))} done={sp(f, S.accepted, SPRING.pop)} /> : null}
      {pilotIn > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: pilotIn }}>
          <PilotSheet eta={<Eta f={f} />} rowsIn={[0, 1, 2, 3].map((i) => tw(f, S.accepted + 5 + i * 3, S.accepted + 13 + i * 3, 0, 1, EASE.out))} ghostBadge={isLifted(f, S.badgeLift, null)} />
        </div>
      ) : null}
    </>
  );
};

const carX = (f: number) => 2400 + (1390 - 2400) * tw(f, S.fleetIn, S.fleetIn + 16, 0, 1, EASE.out);

const EvCar: React.FC = () => {
  const f = useT();
  const arrive = S.fleetIn + 14;
  const k = f - arrive;
  const bounce = k > 0 ? Math.exp(-k / 5) * Math.sin(k / 1.9) : 0;
  const brake = tw(f, S.fleetIn + 9, arrive, 0, 1) * (1 - tw(f, arrive, arrive + 10));
  return <FleetCar id="s8car" src="vehicles/fleet-c-34.png" w={640} aspect={576 / 1033} x={carX(f)} ground={985} dip={6 * Math.max(0, bounce) + 2 * brake} pitch={-1 * brake - 0.6 * bounce} blurX={speedBlur(carX, f, 0.25, 26)} glint={tw(f, arrive + 4, arrive + 18, 0, 1, (t) => t)} />;
};

/** Frame-space position of the capsule car marker at the pickup pin. */
export const capsuleFrame = (phone: PhonePose) => {
  const s = worldToScreen(PICKUP, VIEWS.finding, 393, 852);
  return toFrame(s.x, s.y, phone.cx, phone.cy, phone.scale);
};

export const S8Story: React.FC<{ f: number; phone: PhonePose }> = ({ f, phone }) => {
  if (f < S.fleetIn - 2) return null;
  const chip = sp(f, S.badgeLift + 4, SPRING.pop);
  // capsule grows into a circle wipe → S9
  const o = capsuleFrame(phone);
  const g = tw(f, S.wipe, S.wipe + 5, 0, 1, EASE.out);
  const r = mix(0, 2300, tw(f, S.wipe + 4, S.wipeEnd, 0, 1, EASE.in));
  return (
    <>
      <Trail layers={4} lagInFrames={0.35} trailOpacity={0.55}>
        <EvCar />
      </Trail>
      <LiftOut f={f} out={S.badgeLift} back={null} slot={{ x: 20, y: FINDING_SHEET_TOP + PILOT_BADGE_Y, w: 353, h: 44 }} phone={phone} to={{ cx: 1330, cy: 176, scale: 1.7 }} radius={12}>
        <div style={{ width: 353, height: 44, borderRadius: 12, background: C.mintPill, display: "flex", alignItems: "center", gap: 10, padding: "0 14px", boxSizing: "border-box" }}>
          <I.shield size={20} color={C.priceGreen} stroke={2.2} />
          <div style={{ fontFamily: "Google Sans", fontSize: 13.5, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>{S8C.badge}</div>
        </div>
      </LiftOut>
      {f >= S.badgeLift + 4 ? (
        <div style={{ position: "absolute", left: 1722, top: 132, transform: `scale(${chip}) rotate(${(1 - chip) * 270}deg)` }}>
          <IconChip icon={<I.shield size={40} color={C.priceGreen} stroke={2.2} />} size={84} bg={C.white} />
        </div>
      ) : null}
      {S8C.captions.map((line, i) => (
        <SettleWords key={i} text={line} at={S.captions[i]} size={TYPE.title} accents={i === 1 ? { assessed: C.brandGreen, and: C.brandGreen, trained: C.brandGreen } : {}} seed={`s8-${i}`} style={{ position: "absolute", left: 990, top: 268 + i * 92, whiteSpace: "nowrap" }} />
      ))}
      {f >= S.wipe ? (
        <AbsoluteFill>
          <Capsule cx={o.x} cy={o.y} w={mix(50, 120, g)} h={mix(26, 120, g)} glowAmt={1} />
          {r > 1 ? <div style={{ position: "absolute", left: o.x - r, top: o.y - r, width: r * 2, height: r * 2, borderRadius: 9999, background: C.night, boxShadow: `0 0 0 10px ${C.ctaGreen}, 0 0 60px 20px rgba(32,230,130,.5)` }} /> : null}
        </AbsoluteFill>
      ) : null}
    </>
  );
};

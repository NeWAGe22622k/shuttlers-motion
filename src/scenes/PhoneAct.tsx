import React from "react";
import { AbsoluteFill } from "remotion";
import { C, EASE, LAYOUT, SPRING } from "../config/brand";
import { T, useFlags, useT } from "../config/time";
import { Bloom, FingerTrack } from "../components/core";
import { Push } from "../components/LiftOut";
import { drift, mix, sp, tw } from "../components/motion";
import { PhoneBody, PhoneRig, toFrame } from "../components/Phone";
import { S3Screen, S3Story } from "./S3Home";
import { S4Screen, S4Story } from "./S4Search";
import { S5Story, TripScreen } from "./S5Options";
import { S6Story } from "./S6NoSurge";
import { BookedFrozen, S7Screen, S7Story } from "./S7Booked";
import { S8Screen, S8Story } from "./S8Pilot";

const H = T.hero;
export type PhonePose = { cx: number; cy: number; scale: number };

// Fingertip taps inside the phone (app points)
const TAPS: [number, number, number][] = [
  [H.s3.tap, 196, 479],
  [H.s4.tapDest, 190, 231],
  [H.s4.tapResult, 190, 231],
  [H.s5.tap, 196, 777],
  [H.s6.tapPay, 196, 618],
  [H.s7.tapCard, 196, 409],
  [H.s7.tapContinue, 196, 769],
];

const FULL_ZOOM = 1920 / (LAYOUT.phone.screenW * LAYOUT.phone.scale);
const FOCUS = { x: 196.5, y: 300 }; // app point centred when the app is full-frame

export const phonePose = (f: number): PhonePose & { ry: number; rx: number } => {
  const shift = sp(f, H.s6.cameraShift, SPRING.camera);
  const punch = sp(f, H.s7.popper, SPRING.camera) - sp(f, H.s8.start, SPRING.camera);
  const d = drift(f);
  return { cx: 560 - 80 * shift, cy: 540 + d.y, scale: 1 + 0.06 * punch, ry: -10, rx: 5 + d.rx };
};

const Screen: React.FC<{ f: number }> = ({ f }) => {
  if (f < H.s3.push) return <S3Screen f={f} />;
  if (f < H.s3.push + 14) return <Push f={f} at={H.s3.push} from={<S3Screen f={f} />} to={<S4Screen f={f} />} />;
  if (f < H.s4.push) return <S4Screen f={f} />;
  if (f < H.s4.push + 14) return <Push f={f} at={H.s4.push} from={<S4Screen f={f} />} to={<TripScreen f={f} />} />;
  if (f < H.s7.start) return <TripScreen f={f} />;
  if (f < H.s8.start) return <S7Screen f={f} />;
  if (f < H.s8.start + 14) return <Push f={f} at={H.s8.start} from={<BookedFrozen f={f} />} to={<S8Screen f={f} />} />;
  return <S8Screen f={f} />;
};

export const PhoneAct: React.FC = () => {
  const f = useT();
  const flags = useFlags();
  const pushEntry = flags.phoneEntry === "push";
  const pose = phonePose(f);
  // S3 pull-back from the full-frame app (skipped when the cutdown pushes the phone in)
  const pull = pushEntry ? 1 : tw(f, H.s3.pullback, H.s3.pullbackEnd, 0, 1, EASE.inOut);
  const q = toFrame(FOCUS.x, FOCUS.y, pose.cx, 540, 1);
  const zs = Math.pow(FULL_ZOOM, 1 - pull);
  const fx0 = mix(960, q.x, pull);
  const fy0 = mix(540, q.y, pull);
  const tx = fx0 - zs * q.x;
  const ty = fy0 - zs * q.y;
  const enter = pushEntry ? 1 - tw(f, H.s3.start + 8, H.s3.start + 20, 0, 1, EASE.out) : 0;

  return (
    <AbsoluteFill style={{ background: C.white, transform: `translateX(${enter * 100}%)`, boxShadow: enter > 0 ? "-30px 0 60px rgba(16,17,17,.18)" : undefined }}>
      <Bloom x="72%" y="46%" size={60} opacity={0.7 * pull} />
      <AbsoluteFill style={{ transform: `translate(${tx}px, ${ty}px) scale(${zs})`, transformOrigin: "0 0" }}>
        <PhoneRig cx={pose.cx} cy={pose.cy} scale={pose.scale} ry={pose.ry * pull} rx={pose.rx * pull}>
          <PhoneBody
            overlay={<FingerTrack f={f} taps={TAPS} />}
          >
            <Screen f={f} />
          </PhoneBody>
        </PhoneRig>
      </AbsoluteFill>
      {pull >= 1 ? (
        <AbsoluteFill>
          <S3Story f={f} phone={pose} />
          <S4Story f={f} />
          <S5Story f={f} phone={pose} />
          <S6Story f={f} phone={pose} />
          <S7Story f={f} />
          <S8Story f={f} phone={pose} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

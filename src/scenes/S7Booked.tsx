import React from "react";
import { evolvePath } from "@remotion/paths";
import { C, EASE, SPRING, TYPE, fontFamily } from "../config/brand";
import { content } from "../config/content";
import { T } from "../config/time";
import { IconChip, SettleWords } from "../components/core";
import { I } from "../components/Icons";
import { fx, mix, sp, tw } from "../components/motion";
import { BookedScreen, SuccessScreen } from "../screens/Booked";
import { TripScreen } from "./S5Options";

const S = T.hero.s7;

/** Payment successful: the capsule becomes the successTeal check circle, then the check draws on. */
const SuccessAt: React.FC<{ f: number }> = ({ f }) => {
  const sheet = 852 - (852 - 495) * tw(f, S.success - 2, S.success + 8, 0, 1, EASE.out);
  const m = tw(f, S.success + 2, S.success + 8, 0, 1, EASE.inOut);
  const check = tw(f, S.success + 7, S.success + 7 + S.checkDraw, 0, 1, EASE.out);
  const CHECK = "M12 21 L18 27 L29 15";
  const ev = evolvePath(Math.max(0.0001, check), CHECK);
  const pop = sp(f, S.success + 2, SPRING.pop);
  return (
    <>
      <SuccessScreen sheetTop={sheet} circle={0} check={0} titleStyle={fx(f, S.success + 4)} subStyle={fx(f, S.success + 7)} />
      {/* capsule → check circle */}
      <div
        style={{
          position: "absolute",
          left: 196.5 - mix(52, 42, m) / 2,
          top: sheet + 124 - mix(22, 42, m) / 2,
          width: mix(52, 42, m),
          height: mix(22, 42, m),
          borderRadius: 99,
          background: m < 1 ? `color-mix(in srgb, ${C.successTeal} ${m * 100}%, ${C.ctaGreen})` : C.successTeal,
          boxShadow: `0 0 ${16 * (1 - m)}px rgba(32,230,130,.6)`,
          transform: `scale(${mix(0.6, 1, pop)})`,
        }}
      >
        {check > 0 ? (
          <svg width={42} height={42} viewBox="0 0 42 42" style={{ position: "absolute", left: 0, top: 0 }}>
            <path d={CHECK} fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
          </svg>
        ) : null}
      </div>
    </>
  );
};

const BookedAt: React.FC<{ f: number }> = ({ f }) => {
  const t = f - S.popper;
  const shake = t >= 0 ? 7 * Math.exp(-t / 5) * Math.sin(t / 1.4) : 0;
  return <BookedScreen ribbons={tw(f, S.popper, S.popper + 20, 0, 1, EASE.out)} pieces={tw(f, S.popper + 3, S.popper + 12, 0, 1, EASE.out)} confettiT={t} life={S.confettiLife} shake={shake} titleStyle={fx(f, S.popper + 6)} subStyle={fx(f, S.popper + 12, null, { dy: 12, blur: 8 })} />;
};

/** Phone content for S7 (payment sheet is part of TripScreen until success). */
export const S7Screen: React.FC<{ f: number }> = ({ f }) => {
  const successIn = tw(f, S.success - 2, S.success + 2);
  const bookedIn = tw(f, S.booked, S.booked + 4);
  return (
    <>
      {successIn < 1 ? <TripScreen f={f} /> : null}
      {successIn > 0 && bookedIn < 1 ? (
        <div style={{ position: "absolute", inset: 0, opacity: successIn }}>
          <SuccessAt f={f} />
        </div>
      ) : null}
      {bookedIn > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: bookedIn }}>
          <BookedAt f={f} />
        </div>
      ) : null}
    </>
  );
};

export const BookedFrozen: React.FC<{ f: number }> = ({ f }) => <BookedAt f={f} />;

export const S7Story: React.FC<{ f: number }> = ({ f }) => {
  if (f < S.caption - 2 || f > S.success + 10) return null;
  const icons = [<I.card size={34} color={C.ink} stroke={2} />, <I.bank size={34} color={C.ink} stroke={2} />, <I.ussd size={34} color={C.ink} />];
  const labels = content.s7.methodChips;
  return (
    <>
      <SettleWords text={content.s7.caption} at={S.caption} outAt={S.success - 4} size={TYPE.caption} accents={{ card: C.brandGreen, transfer: C.brandGreen, USSD: C.brandGreen }} seed="s7" maxWidth={760} style={{ position: "absolute", left: 1000, top: 380 }} />
      <div style={{ position: "absolute", left: 1000, top: 560, display: "flex", gap: 22 }}>
        {icons.map((ic, i) => {
          const at = S.caption + 6 + i * 3;
          const k = sp(f, at, SPRING.pop);
          const st = fx(f, at, S.success - 4);
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: st.opacity, filter: st.filter, transform: `translateY(${(1 - k) * 24}px) rotate(${(1 - k) * 90}deg)` }}>
              <IconChip icon={ic} size={88} />
              <div style={{ fontFamily, fontSize: 24, fontWeight: 600, color: C.muted }}>{labels[i]}</div>
            </div>
          );
        })}
      </div>
    </>
  );
};

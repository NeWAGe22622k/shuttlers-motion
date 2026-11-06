import React from "react";
import { C, EASE, M, PHONE, fontFamily } from "../config/brand";
import { home } from "../config/content";
import { clamp, mix, tw } from "./motion";

/**
 * Generic phone (designed for this film): black body, 64px radius, 10px bezel, pill camera,
 * no platform marks. Screen 393×852 app points → 430×932px. Floats in 3D (perspective 1800,
 * rotateY −10°, rotateX 5°) and never sits still: the pose drifts a little every frame.
 */

const S = PHONE.scale;
const SW = PHONE.appW * S; // 430
const SH = PHONE.appH * S; // 932
const BW = SW + PHONE.bezel * 2;
const BH = SH + PHONE.bezel * 2;

export type Pose = { ry: number; rx: number; dy: number; s: number };

export const phonePose = (f: number): Pose => ({
  ry: PHONE.ry + 1.4 * Math.sin(f / 62),
  rx: PHONE.rx + 0.9 * Math.sin(f / 47 + 1),
  dy: 7 * Math.sin(f / 51),
  s: 1,
});

/** Project an app point (393×852 space) to frame pixels for a pose (matches the CSS below). */
export const projectApp = (ax: number, ay: number, pose: Pose) => {
  const x = (ax - PHONE.appW / 2) * S * pose.s;
  const y = (ay - PHONE.appH / 2) * S * pose.s;
  const rx = (pose.rx * Math.PI) / 180;
  const ry = (pose.ry * Math.PI) / 180;
  // CSS: rotateY(ry) rotateX(rx) → rotateX applied first
  const y1 = y * Math.cos(rx);
  const z1 = y * Math.sin(rx);
  const x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
  const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
  const k = PHONE.perspective / (PHONE.perspective - z2);
  return { x: PHONE.cx + x2 * k, y: PHONE.cy + pose.dy + y1 * k, k };
};

export const StatusBar: React.FC<{ dark?: boolean; time?: string }> = ({ dark = false, time = home.time }) => {
  const col = dark ? C.white : C.ink;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: PHONE.appW, height: 54, zIndex: 50 }}>
      <div style={{ position: "absolute", left: 40, top: 17, fontFamily, fontWeight: 600, fontSize: 16, color: col, fontVariantNumeric: "tabular-nums" }}>{time}</div>
      <div style={{ position: "absolute", right: 30, top: 21, display: "flex", gap: 6, alignItems: "center" }}>
        <svg width="18" height="12" viewBox="0 0 18 12">
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 4.6} y={9 - i * 2.6} width="3.2" height={3 + i * 2.6} rx="0.8" fill={col} />
          ))}
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12">
          <path d="M8 11.2l2.3-2.6a3.3 3.3 0 0 0-4.6 0z" fill={col} />
          <path d="M3.6 6.4a6.3 6.3 0 0 1 8.8 0" stroke={col} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M1.2 3.8a9.8 9.8 0 0 1 13.6 0" stroke={col} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12">
          <rect x="0.6" y="0.6" width="22" height="10.8" rx="3.2" fill="none" stroke={col} strokeWidth="1.2" />
          <rect x="2.4" y="2.4" width="15" height="7.2" rx="1.8" fill={col} />
          <rect x="23.8" y="4" width="1.6" height="4" rx="0.8" fill={col} />
        </svg>
      </div>
    </div>
  );
};

/** The phone, centred on PHONE.cx/cy. `screen` and `glass` are laid out in app points. */
export const Phone3D: React.FC<{ f: number; screen: React.ReactNode; glass?: React.ReactNode; darkStatus?: boolean; pose?: Pose }> = ({ f, screen, glass, darkStatus = false, pose = phonePose(f) }) => (
  <div style={{ position: "absolute", left: PHONE.cx - BW / 2, top: PHONE.cy - BH / 2 + pose.dy, width: BW, height: BH, perspective: PHONE.perspective, perspectiveOrigin: "50% 50%" }}>
    <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${pose.ry.toFixed(3)}deg) rotateX(${pose.rx.toFixed(3)}deg) scale(${pose.s})` }}>
      {/* flat, hard-edged offset shadow (ink 10%, no blur) */}
      <div style={{ position: "absolute", left: 30, top: 36, width: BW, height: BH, borderRadius: PHONE.radius, background: "rgba(16,17,17,0.10)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: BW, height: BH, borderRadius: PHONE.radius, background: "#0B0B0D", boxShadow: "inset 0 0 0 1.5px #2A2B30" }}>
        <div style={{ position: "absolute", left: PHONE.bezel, top: PHONE.bezel, width: SW, height: SH, borderRadius: PHONE.radius - PHONE.bezel, overflow: "hidden", background: C.white, isolation: "isolate" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: PHONE.appW, height: PHONE.appH, transform: `scale(${S})`, transformOrigin: "0 0" }}>
            {screen}
            <StatusBar dark={darkStatus} />
            <div style={{ position: "absolute", left: PHONE.appW / 2 - 62, top: 11, width: 124, height: 36, borderRadius: 18, background: "#050506", zIndex: 60 }} />
            {glass}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ fingertip + tap ring */

export type Tap = { at: number; x: number; y: number };

/**
 * Hard-edged fingertip (56px, 2px ink stroke, mint fill). It glides between taps (expoInOut,
 * landing 3f before each tap), presses 1→0.88 and back (expoOut), and each tap throws a
 * single 2px ring out to 120px whose stroke width shrinks to 0. Enters/exits by sliding off the
 * bottom of the glass (clipped by the screen), never by fading.
 */
export const FingerLayer: React.FC<{ f: number; taps: Tap[]; windows: number[][] }> = ({ f, taps, windows }) => {
  const win = windows.find(([a, b]) => f >= a && f < b);
  const rings = taps.map((t) => {
    if (f < t.at || f > t.at + M.ringGrow) return null;
    const p = tw(f, t.at, t.at + M.ringGrow, 0, 1, EASE.expoOut);
    const d = mix(56, 120, p) / S;
    const sw = (2 * (1 - p)) / S;
    if (sw < 0.02) return null;
    return <div key={t.at} style={{ position: "absolute", left: t.x - d / 2, top: t.y - d / 2, width: d, height: d, borderRadius: 999, boxSizing: "border-box", border: `${sw.toFixed(3)}px solid ${C.ink}` }} />;
  });
  if (!win) return <>{rings}</>;
  const [a, b] = win;
  const inWin = taps.filter((t) => t.at >= a && t.at < b);
  if (inWin.length === 0) return <>{rings}</>;
  const OFF = { x: 300, y: 980 };
  let x: number;
  let y: number;
  // first approach lands M.fingerTravel frames before the first tap
  const first = inWin[0];
  const arrive0 = first.at - 3;
  const p0 = tw(f, arrive0 - M.fingerTravel, arrive0, 0, 1, EASE.expoOut);
  x = mix(OFF.x, first.x, p0);
  y = mix(OFF.y, first.y, p0);
  for (let i = 1; i < inWin.length; i++) {
    const t = inWin[i];
    const prev = inWin[i - 1];
    const go = Math.max(prev.at + 6, t.at - 3 - M.fingerTravel);
    const p = tw(f, go, t.at - 3, 0, 1, EASE.expoInOut);
    if (p > 0) {
      x = mix(prev.x, t.x, p);
      y = mix(prev.y, t.y, p);
    }
  }
  const last = inWin[inWin.length - 1];
  const out = tw(f, last.at + 6, b, 0, 1, EASE.quintIn);
  x = mix(x, OFF.x, out);
  y = mix(y, OFF.y + 80, out);
  let sc = 1;
  for (const t of inWin) {
    if (f >= t.at && f < t.at + 2) sc = mix(1, 0.88, tw(f, t.at, t.at + 2, 0, 1, EASE.expoOut));
    else if (f >= t.at + 2 && f < t.at + 12) sc = mix(0.88, 1, tw(f, t.at + 2, t.at + 12, 0, 1, EASE.expoOut));
  }
  const d = 56 / S;
  return (
    <>
      {rings}
      <div style={{ position: "absolute", left: x - d / 2, top: y - d / 2, width: d, height: d, borderRadius: 999, background: C.mint, border: `${(2 / S).toFixed(3)}px solid ${C.ink}`, boxSizing: "border-box", transform: `scale(${clamp(sc, 0.5, 1).toFixed(4)})` }} />
    </>
  );
};

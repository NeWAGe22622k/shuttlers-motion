import React from "react";
import { C, EASE, LAYOUT, SHADOW, SPRING } from "../config/brand";
import { drift, mix, sp, tw } from "./motion";
import { toFrame } from "./Phone";

const PS = LAYOUT.phone.scale;

/** 0→1 when lifting (glide spring), back to 0 on return (glide spring). */
export const liftProgress = (f: number, out: number, back: number | null) => {
  const a = sp(f, out, SPRING.glide);
  // the return mirrors the glide but lands in 8f so the next tap hits a settled slot
  const b = back === null ? 0 : tw(f, back, back + 8, 0, 1, EASE.inOut);
  return Math.max(0, Math.min(1.02, a * (1 - b)));
};

/** Is the slot in the phone currently ghosted (20%)? */
export const isLifted = (f: number, out: number, back: number | null) => f >= out && liftProgress(f, out, back) > 0.015;

/**
 * Lift-out (brief §4): a component inside the phone detaches, travels on the glide spring into
 * the story zone, scales up, gains the 3-layer shadow and tilts 4° toward camera.
 * `slot` is the element's rect in app points; `phone` is the phone's frame pose.
 */
export const LiftOut: React.FC<{
  f: number;
  out: number;
  back: number | null;
  slot: { x: number; y: number; w: number; h: number };
  phone: { cx: number; cy: number; scale: number };
  to: { cx: number; cy: number; scale: number };
  radius?: number;
  glowRing?: number; // 0..1 capsule glow ring behind the card
  children: React.ReactNode;
}> = ({ f, out, back, slot, phone, to, radius = 16, glowRing = 0, children }) => {
  const p = liftProgress(f, out, back);
  if (f < out || p <= 0.015) return null;
  const from = toFrame(slot.x + slot.w / 2, slot.y + slot.h / 2, phone.cx, phone.cy, phone.scale);
  const s0 = PS * phone.scale;
  const s1 = s0 * to.scale;
  const d = drift(f, 20);
  const cx = mix(from.x, to.cx, p);
  const cy = mix(from.y, to.cy, p) + d.y * p;
  const s = mix(s0, s1, p);
  const shadowO = Math.min(1, p * 1.3);
  const ringPulse = glowRing > 0 ? 0.55 + 0.45 * Math.sin((f - out) / 5) : 0;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: LAYOUT.W, height: LAYOUT.H, perspective: 1400, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: cx - slot.w / 2,
          top: cy - slot.h / 2,
          width: slot.w,
          height: slot.h,
          transform: `scale(${s}) rotateY(${-4 * p}deg) rotateX(${(2 + d.rx) * p}deg)`,
          transformOrigin: "50% 50%",
        }}
      >
        {glowRing > 0 ? (
          <div
            style={{
              position: "absolute",
              inset: -7,
              borderRadius: radius + 7,
              border: `2.5px solid ${C.ctaGreen}`,
              boxShadow: `0 0 ${18 + 14 * ringPulse}px rgba(32,230,130,${0.55 * glowRing * ringPulse}), inset 0 0 12px rgba(32,230,130,${0.3 * glowRing})`,
              opacity: glowRing * tw(f, out + 4, out + 12, 0, 1, EASE.out),
            }}
          />
        ) : null}
        <div style={{ position: "absolute", inset: 0, borderRadius: radius, boxShadow: SHADOW, opacity: shadowO }} />
        <div style={{ position: "relative" }}>{children}</div>
      </div>
    </div>
  );
};

/** iOS-style push inside the phone: new slides 100%→0 (easeOut 14f), old moves −30% and dims 20%. */
export const Push: React.FC<{ f: number; at: number; dur?: number; from: React.ReactNode; to: React.ReactNode; back?: boolean }> = ({ f, at, dur = 14, from, to, back = false }) => {
  const p = tw(f, at, at + dur, 0, 1, EASE.out);
  if (p <= 0) return <>{from}</>;
  if (p >= 1) return <>{to}</>;
  const dir = back ? -1 : 1;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${-30 * p * dir}%)`, overflow: "hidden" }}>
        {from}
        <div style={{ position: "absolute", inset: 0, background: `rgba(16,17,17,${0.2 * p})` }} />
      </div>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${100 * (1 - p) * dir}%)`, boxShadow: "-12px 0 30px rgba(16,17,17,.12)", overflow: "hidden", background: "#fff" }}>{to}</div>
    </>
  );
};

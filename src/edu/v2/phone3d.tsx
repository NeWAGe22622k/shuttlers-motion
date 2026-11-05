import React from "react";
import { LAYOUT } from "../../config/brand";
import { PhoneBody } from "../../components/Phone";
import { H, W } from "./engine";

const { screenW: SW, screenH: SH, scale: PS, bezel: BZ, radius: PR } = LAYOUT.phone;
export { PS, SW, SH };
export const BW = SW * PS + BZ * 2; // 450 body px
export const BH = SH * PS + BZ * 2; // 952 body px
/** App point → phone-body px. */
export const bx = (x: number) => BZ + x * PS;
export const by = (y: number) => BZ + y * PS;

export type Pose = { cx: number; cy: number; s: number; rx: number; ry: number; rz: number; z: number };

/**
 * A phone that lives in real 3D: a fixed perspective camera at the frame centre, the body in a
 * preserve-3d group with a few millimetres of thickness, and `children` placed in the same group
 * (use <At/>) so anything lifted off the glass pops out with true parallax as the phone turns.
 */
export const Phone3D: React.FC<{
  pose: Pose;
  persp?: number;
  origin?: [number, number];
  screen: React.ReactNode;
  overlay?: React.ReactNode;
  time?: string;
  darkStatus?: boolean;
  rim?: string;
  children?: React.ReactNode;
}> = ({ pose, persp = 2300, origin = [W / 2, H * 0.5], screen, overlay, time, darkStatus, rim, children }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, perspective: persp, perspectiveOrigin: `${origin[0]}px ${origin[1]}px`, pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        left: pose.cx - BW / 2,
        top: pose.cy - BH / 2,
        width: BW,
        height: BH,
        transformStyle: "preserve-3d",
        transform: `translateZ(${pose.z}px) rotateZ(${pose.rz}deg) rotateY(${pose.ry}deg) rotateX(${pose.rx}deg) scale3d(${pose.s},${pose.s},${pose.s})`,
      }}
    >
      {/* thickness: stacked slabs behind the glass catch the light as the phone turns */}
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} style={{ position: "absolute", inset: 0, borderRadius: PR, background: i === 8 ? "#050506" : i % 3 === 0 ? "#3b3c42" : "#202126", transform: `translateZ(${-(i + 1) * 1.5}px)` }} />
      ))}
      <div style={{ position: "absolute", inset: 0, borderRadius: PR, boxShadow: rim ? `0 0 0 2.5px ${rim}` : undefined }}>
        <PhoneBody time={time} darkStatus={darkStatus} overlay={overlay}>
          {screen}
        </PhoneBody>
      </div>
      {children}
    </div>
  </div>
);

/** Place app-point content (w×h, laid out in app points) on/above the glass at height z. */
export const At: React.FC<{ x: number; y: number; w: number; h: number; z?: number; t?: string; origin?: string; children: React.ReactNode; style?: React.CSSProperties; preserve?: boolean }> = ({ x, y, w, h, z = 0, t = "", origin = "50% 50%", children, style, preserve = false }) => (
  <div style={{ position: "absolute", left: bx(x), top: by(y), width: w * PS, height: h * PS, transformStyle: preserve ? "preserve-3d" : undefined, transform: `translateZ(${z}px) ${t}`, transformOrigin: origin, ...style }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transform: `scale(${PS})`, transformOrigin: "0 0" }}>{children}</div>
  </div>
);

/** A soft contact shadow on the glass under something lifted to height z (spreads and fades as it rises). */
export const LiftShadow: React.FC<{ x: number; y: number; w: number; h: number; lift: number; radius?: number; dark?: number }> = ({ x, y, w, h, lift, radius = 16, dark = 0.35 }) =>
  lift <= 0.01 ? null : (
    <div
      style={{
        position: "absolute",
        left: bx(x) + 10 * lift,
        top: by(y) + 26 * lift,
        width: w * PS,
        height: h * PS,
        borderRadius: radius * PS,
        background: `rgba(10,12,12,${dark * Math.min(1, lift * 1.4) * (1 - 0.45 * lift)})`,
        filter: `blur(${(6 + 22 * lift).toFixed(1)}px)`,
        transform: "translateZ(0.5px)",
      }}
    />
  );

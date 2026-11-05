import React from "react";
import { C, LAYOUT, fontFamily } from "../config/brand";
import { content } from "../config/content";

const { screenW: SW, screenH: SH, scale: PS, bezel: BZ, radius: PR } = LAYOUT.phone;

/** Generic status bar glyphs (signal, wifi, battery). */
export const StatusBar: React.FC<{ dark?: boolean; time?: string }> = ({ dark = false, time = content.home.time }) => {
  const col = dark ? "#fff" : C.ink;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: 54, zIndex: 50, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 40, top: 17, fontFamily, fontWeight: 600, fontSize: 16, color: col, fontVariantNumeric: "tabular-nums" }}>{time}</div>
      <div style={{ position: "absolute", right: 30, top: 21, display: "flex", gap: 6, alignItems: "center" }}>
        <svg width="18" height="12" viewBox="0 0 18 12">
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 4.6} y={9 - i * 2.6} width="3.2" height={3 + i * 2.6} rx="0.8" fill={col} opacity={i === 3 ? 0.35 : 1} />
          ))}
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12">
          <path d="M8 11.2l2.3-2.6a3.3 3.3 0 0 0-4.6 0z" fill={col} />
          <path d="M3.6 6.4a6.3 6.3 0 0 1 8.8 0" stroke={col} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M1.2 3.8a9.8 9.8 0 0 1 13.6 0" stroke={col} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12">
          <rect x="0.6" y="0.6" width="22" height="10.8" rx="3.2" fill="none" stroke={col} strokeOpacity="0.4" strokeWidth="1.2" />
          <rect x="2.4" y="2.4" width="15" height="7.2" rx="1.8" fill={col} />
          <rect x="23.8" y="4" width="1.6" height="4" rx="0.8" fill={col} opacity="0.4" />
        </svg>
      </div>
    </div>
  );
};

/**
 * Generic, unbranded phone: black body, 64px radius, 10px bezel, small pill camera.
 * Children are laid out in 393×852 app points; the screen is scaled ×1.094 to 430×932.
 */
export const PhoneBody: React.FC<{ children: React.ReactNode; darkStatus?: boolean; overlay?: React.ReactNode; time?: string }> = ({ children, darkStatus = false, overlay, time }) => {
  const sw = SW * PS;
  const sh = SH * PS;
  return (
    <div
      style={{
        width: sw + BZ * 2,
        height: sh + BZ * 2,
        borderRadius: PR,
        background: "linear-gradient(145deg, #2a2b2f 0%, #0c0c0e 40%, #18181b 100%)",
        padding: BZ,
        boxSizing: "border-box",
        position: "relative",
        boxShadow: "0 2px 0 1px #3a3b40 inset, 0 0 0 1.5px #050506",
      }}
    >
      <div style={{ width: sw, height: sh, borderRadius: PR - BZ, overflow: "hidden", position: "relative", background: C.white, isolation: "isolate" }}>
        <div style={{ width: SW, height: SH, transform: `scale(${PS})`, transformOrigin: "0 0", position: "relative" }}>
          {children}
          <StatusBar dark={darkStatus} time={time} />
          {overlay}
        </div>
        {/* pill camera */}
        <div style={{ position: "absolute", left: sw / 2 - 46, top: 14, width: 92, height: 27, borderRadius: 99, background: "#050506", zIndex: 60 }} />
        {/* glass reflection */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,.07) 0%, rgba(255,255,255,0) 32%)", pointerEvents: "none", zIndex: 61 }} />
      </div>
    </div>
  );
};

/** Places the phone in frame space with the 3D float. */
export const PhoneRig: React.FC<{
  cx: number;
  cy: number;
  scale?: number;
  ry?: number;
  rx?: number;
  children: React.ReactNode;
}> = ({ cx, cy, scale = 1, ry = -10, rx = 5, children }) => {
  const w = SW * PS + BZ * 2;
  const h = SH * PS + BZ * 2;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: LAYOUT.W, height: LAYOUT.H, perspective: 1800, perspectiveOrigin: `${cx}px ${cy}px` }}>
      {/* deep soft floor shadow */}
      <div
        style={{
          position: "absolute",
          left: cx - w * 0.42 * scale + 30,
          top: cy + h * 0.47 * scale,
          width: w * 0.84 * scale,
          height: 46 * scale,
          borderRadius: "50%",
          background: "rgba(16,17,17,.22)",
          filter: `blur(${26 * scale}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: cx - w / 2,
          top: cy - h / 2,
          width: w,
          height: h,
          transform: `scale(${scale}) rotateY(${ry}deg) rotateX(${rx}deg)`,
          transformStyle: "preserve-3d",
          borderRadius: PR,
          boxShadow: "0 60px 120px rgba(16,17,17,.22), 0 24px 48px rgba(16,17,17,.14)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Map a point in app points (393×852) to frame px for a phone at (cx,cy,scale). Ignores the small 3D tilt. */
export const toFrame = (x: number, y: number, cx: number, cy: number, scale = 1) => ({
  x: cx + (x - SW / 2) * PS * scale * 0.985,
  y: cy + (y - SH / 2) * PS * scale,
});

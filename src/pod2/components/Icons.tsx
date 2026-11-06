import React from "react";
import { evolvePath } from "@remotion/paths";
import { C } from "../config/brand";
import { clamp, mix } from "./motion";

/**
 * Hand-drawn line icons for this film (24-unit grid, 2.5 rounded strokes, ink). No icon pack.
 * Each one carries its own animation parameter.
 */

type Base = { size: number; color?: string; style?: React.CSSProperties };
const SW = 2.5;

const Svg: React.FC<Base & { children: React.ReactNode }> = ({ size, style, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", overflow: "visible", ...style }}>
    {children}
  </svg>
);

/* ------------------------------------------------------------------ eye (lid: 0 open → 1 closed) */

export const EYE_PATH = "M 1.5 12 C 5 6.2 19 6.2 22.5 12 C 19 17.8 5 17.8 1.5 12 Z";

export const Eye: React.FC<Base & { lid: number }> = ({ size, color = C.ink, lid, style }) => {
  const p = clamp(lid);
  const cy = mix(6.2, 17.8, p);
  const lidD = `M 1.5 12 C 5 ${cy} 19 ${cy} 22.5 12`;
  const id = `eye${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <Svg size={size} style={style}>
      <defs>
        <clipPath id={id}>
          <path d={`${lidD} L 24 24 L 0 24 Z`} />
        </clipPath>
      </defs>
      <circle cx={12} cy={12} r={3.6} fill={color} clipPath={`url(#${id})`} />
      <path d="M 1.5 12 C 5 17.8 19 17.8 22.5 12" stroke={color} strokeWidth={SW} />
      <path d={lidD} stroke={color} strokeWidth={SW} />
    </Svg>
  );
};

/* ------------------------------------------------------------------ phone handset (rock in degrees) */

export const Handset: React.FC<Base & { rock: number }> = ({ size, color = C.ink, rock, style }) => (
  <Svg size={size} style={style}>
    <g transform={`rotate(${rock} 12 12)`}>
      <path
        d="M 6.2 3.5 L 8.9 3.5 L 10.4 7.6 L 8.3 9.1 C 9.3 11.4 11.6 13.8 14.4 15.2 L 15.9 13.1 L 20 14.6 L 20 17.3 C 20 18.8 18.8 20.1 17.3 20 C 10 19.4 4.6 14 4 6.7 C 3.9 5.1 4.9 3.5 6.2 3.5 Z"
        stroke={color}
        strokeWidth={SW}
      />
    </g>
  </Svg>
);

/* ------------------------------------------------------------------ sleeping face (close: eyes draw shut) */

export const SleepFace: React.FC<Base & { close: number }> = ({ size, color = C.ink, close, style }) => {
  const p = clamp(close);
  const L = "M 6.8 10.6 C 7.6 12 9.4 12 10.2 10.6";
  const R = "M 13.8 10.6 C 14.6 12 16.4 12 17.2 10.6";
  const eL = evolvePath(Math.max(0.0001, p), L);
  const eR = evolvePath(Math.max(0.0001, p), R);
  return (
    <Svg size={size} style={style}>
      <circle cx={12} cy={12} r={9.6} stroke={color} strokeWidth={SW} />
      {/* open eyes are short upright lines; on the beat they swap for lid arcs that draw shut */}
      {p <= 0 ? (
        <>
          <path d="M 8.5 9.2 L 8.5 10.9" stroke={color} strokeWidth={SW} />
          <path d="M 15.5 9.2 L 15.5 10.9" stroke={color} strokeWidth={SW} />
        </>
      ) : (
        <>
          <path d={L} stroke={color} strokeWidth={SW} strokeDasharray={eL.strokeDasharray} strokeDashoffset={eL.strokeDashoffset} />
          <path d={R} stroke={color} strokeWidth={SW} strokeDasharray={eR.strokeDasharray} strokeDashoffset={eR.strokeDashoffset} />
        </>
      )}
      <path d="M 10 15.6 L 14 15.6" stroke={color} strokeWidth={SW} />
    </Svg>
  );
};

/* ------------------------------------------------------------------ breath (draw 0..1, then flow by phase) */

const wave = (phase: number, y0: number, amp: number, x0 = 2, x1 = 22) => {
  const pts: string[] = [];
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const y = y0 + amp * Math.sin(((x - x0) / (x1 - x0)) * Math.PI * 2.5 + phase);
    pts.push(`${x.toFixed(3)} ${y.toFixed(3)}`);
  }
  return `M ${pts.join(" L ")}`;
};

export const Breath: React.FC<Base & { draw: number; phase: number }> = ({ size, color = C.ink, draw, phase, style }) => {
  const d1 = wave(phase, 9.5, 2.4);
  const d2 = wave(phase + 1.3, 16, 1.8, 5, 19);
  const e1 = evolvePath(Math.max(0.0001, clamp(draw)), d1);
  const e2 = evolvePath(Math.max(0.0001, clamp(draw * 1.25 - 0.25)), d2);
  return (
    <Svg size={size} style={style}>
      {draw > 0 ? <path d={d1} stroke={color} strokeWidth={SW} strokeDasharray={e1.strokeDasharray} strokeDashoffset={e1.strokeDashoffset} /> : null}
      {draw > 0.2 ? <path d={d2} stroke={color} strokeWidth={SW} strokeDasharray={e2.strokeDasharray} strokeDashoffset={e2.strokeDashoffset} /> : null}
    </Svg>
  );
};

/* ------------------------------------------------------------------ map pin */

export const PIN_PATH = "M 12 22.5 C 12 22.5 4.5 15 4.5 9.6 A 7.5 7.5 0 0 1 19.5 9.6 C 19.5 15 12 22.5 12 22.5 Z";

export const Pin: React.FC<Base & { fill?: string; dot?: string; outline?: boolean }> = ({ size, color = C.ink, fill = C.indigo, dot = C.white, outline = false, style }) => (
  <Svg size={size} style={style}>
    <path d={PIN_PATH} fill={outline ? "none" : fill} stroke={outline ? color : fill} strokeWidth={SW} />
    <circle cx={12} cy={9.6} r={2.7} fill={outline ? "none" : dot} stroke={outline ? color : "none"} strokeWidth={SW} />
  </Svg>
);

import React from "react";
import { C } from "../config/brand";
import { g2Css } from "../config/gradients";
import { clamp } from "./motion";

/**
 * THE POD (brief §5): a top-down car drawn for this film. Local units, nose up (heading 0),
 * centred on 0,0: 200 wide × 392 long. White body, ctaGreen rim, dark see-through roof with
 * four seats (driver front-left), small wheels, flat headlight shapes.
 */

export const POD_W = 200;
export const POD_L = 392;

export const POD_BODY =
  "M -78 -184 C -40 -199 40 -199 78 -184 C 94 -176 98 -152 98 -122 L 100 142 C 100 172 92 190 70 194 C 30 199 -30 199 -70 194 C -92 190 -100 172 -100 142 L -98 -122 C -98 -152 -94 -176 -78 -184 Z";
const ROOF = "M -70 -100 C -40 -122 40 -122 70 -100 L 74 128 C 74 150 60 160 40 162 L -40 162 C -60 160 -74 150 -74 128 Z";
const SEATS = [
  { x: -58, y: -72, w: 46, h: 54 }, // driver (front-left)
  { x: 12, y: -72, w: 46, h: 54 }, // front passenger (front-right) ← the lit seat
  { x: -58, y: 24, w: 46, h: 56 },
  { x: 12, y: 24, w: 46, h: 56 },
];
export const LIT_SEAT = { x: 35, y: -45 };

const WHEELS = [
  [-108, -150],
  [94, -150],
  [-108, 104],
  [94, 104],
];

const useUid = () => `pod${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;

export type PodProps = {
  f: number;
  /** body length on screen, px */
  size: number;
  heading?: number;
  variant?: "hero" | "marker";
  seatFill?: number;
  bodyFlood?: number;
  headlights?: "grey" | "white";
  /** door seam: 0 ajar → 1 shut (hero only) */
  door?: number;
  style?: React.CSSProperties;
};

export const Pod: React.FC<PodProps> = ({ f, size, heading = 0, variant = "hero", seatFill = 0, bodyFlood = 0, headlights = "grey", door = 1, style }) => {
  const id = useUid();
  const s = size / POD_L;
  const marker = variant === "marker";
  const rim = (marker ? 2.5 : 6) / s; // 6px rim on screen (2.5px on the small map marker)
  const sf = clamp(seatFill);
  const fl = clamp(bodyFlood);
  const seat = SEATS[1];
  // flood circle grows from the lit seat until it covers the whole body (farthest corner ≈ 260 units)
  const floodR = fl * 262;
  const head = headlights === "white" ? C.white : "#B9BEBC";
  const doorAng = (1 - clamp(door)) * 13;
  return (
    <svg
      width={POD_W * s + 40 * s}
      height={POD_L * s + 40 * s}
      viewBox={`${-POD_W / 2 - 20} ${-POD_L / 2 - 20} ${POD_W + 40} ${POD_L + 40}`}
      style={{ overflow: "visible", transform: `rotate(${heading}deg)`, display: "block", ...style }}
    >
      <defs>
        <clipPath id={`${id}b`}>
          <path d={POD_BODY} />
        </clipPath>
        <clipPath id={`${id}c`}>
          <circle cx={LIT_SEAT.x} cy={LIT_SEAT.y} r={floodR} />
        </clipPath>
        <clipPath id={`${id}s`}>
          <rect x={seat.x - 2} y={seat.y - 2} width={seat.w + 4} height={(seat.h + 4) * sf} />
        </clipPath>
      </defs>
      {/* wheels sit under the body */}
      {WHEELS.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={14} height={50} rx={6} fill={C.ink} />
      ))}
      {/* mirrors */}
      <rect x={-112} y={-82} width={16} height={9} rx={4} fill={C.ink} />
      <rect x={96} y={-82} width={16} height={9} rx={4} fill={C.ink} />
      <path d={POD_BODY} fill={C.white} />
      {fl > 0 ? (
        <g clipPath={`url(#${id}b)`}>
          <g clipPath={`url(#${id}c)`}>
            <foreignObject x={-POD_W / 2 - 4} y={-POD_L / 2 - 4} width={POD_W + 8} height={POD_L + 8}>
              <div style={{ width: "100%", height: "100%", background: g2Css(f, "bright", 30) }} />
            </foreignObject>
          </g>
        </g>
      ) : null}
      {/* flat headlights and tail lights */}
      <path d="M -84 -170 L -46 -184 L -42 -176 L -80 -160 Z" fill={head} />
      <path d="M 84 -170 L 46 -184 L 42 -176 L 80 -160 Z" fill={head} />
      <rect x={-78} y={182} width={34} height={7} rx={3} fill={C.ink} />
      <rect x={44} y={182} width={34} height={7} rx={3} fill={C.ink} />
      {/* bonnet crease */}
      {!marker ? <path d="M -40 -150 C -14 -158 14 -158 40 -150" fill="none" stroke={C.border} strokeWidth={3} strokeLinecap="round" /> : null}
      {/* see-through roof */}
      <path d={ROOF} fill="#16191A" fillOpacity={0.93} />
      {SEATS.map((q, i) => (
        <g key={i}>
          <rect x={q.x} y={q.y} width={q.w} height={q.h} rx={11} fill="#3A3F3E" />
          {!marker ? <rect x={q.x + 8} y={q.y + q.h - 12} width={q.w - 16} height={6} rx={3} fill="#525857" /> : null}
        </g>
      ))}
      {/* steering wheel in front of the driver */}
      <circle cx={-35} cy={-88} r={13} fill="none" stroke="#8A908E" strokeWidth={4} />
      {/* lit seat: fills ctaGreen front → back (a moving clip edge) */}
      {sf > 0 ? (
        <g clipPath={`url(#${id}s)`}>
          <rect x={seat.x} y={seat.y} width={seat.w} height={seat.h} rx={11} fill={C.ctaGreen} />
        </g>
      ) : null}
      {/* passenger door seam (snaps shut in S10) */}
      {!marker ? (
        <g transform={`rotate(${doorAng} 92 -64)`}>
          <path d="M 92 -64 L 92 26" stroke={C.ink} strokeWidth={2 / s} strokeLinecap="round" />
        </g>
      ) : null}
      <path d={POD_BODY} fill="none" stroke={C.ctaGreen} strokeWidth={rim} strokeLinejoin="round" />
    </svg>
  );
};

/** Pixel box of a rendered <Pod/> (it adds 20 units of room on each side). */
export const podBox = (size: number) => {
  const s = size / POD_L;
  return { w: (POD_W + 40) * s, h: (POD_L + 40) * s };
};

/** A Pod centred on (x, y) in its parent. */
export const PodAt: React.FC<PodProps & { x: number; y: number }> = ({ x, y, ...p }) => {
  const b = podBox(p.size);
  return (
    <div style={{ position: "absolute", left: x - b.w / 2, top: y - b.h / 2, width: b.w, height: b.h }}>
      <Pod {...p} />
    </div>
  );
};

import React from "react";
import { staticFile } from "remotion";
import data from "./podPaths.json";
import { GREEN } from "./theme";

/**
 * The Pod, as it appears in the Shuttlers app (3/4 view, facing right), vectorised from the app's
 * own illustration (tools/trace_pod.py) so it stays sharp at any size. Badge uses the brand green
 * and the real S mark. Options: headlights, door (side panel lifts open to a glowing seat), shadow.
 */
const [, , VW, VH] = data.viewBox;
const grey = (t: number) => {
  const v = Math.round(Math.max(0, Math.min(1, t)) * 255);
  return `rgb(${v},${v},${Math.min(255, v + 6)})`;
};
const B = data.badge;
// side panel (the door) in viewBox units, around the badge
const HINGE = 292;
const DOOR = "M455 345 C 600 300 1000 285 1330 290 L1385 470 C 1300 560 1240 640 1215 700 L 640 720 C 560 650 500 520 455 345 Z";

export const PodIcon: React.FC<{ id: string; width: number; lights?: number; door?: number; seatGlow?: number; shadow?: boolean; bg?: string; style?: React.CSSProperties }> = ({
  id,
  width,
  lights = 0,
  door = 0,
  seatGlow = 0,
  shadow = true,
  bg = "#000",
  style,
}) => (
  <svg width={width} height={(width * VH) / VW} viewBox={`0 0 ${VW} ${VH}`} style={{ display: "block", overflow: "visible", ...style }}>
    <defs>
      <mask id={`pm-${id}`}>
        <image href={staticFile("brand/shuttlers-mark-white.svg")} x={B.cx - B.rx * 0.55} y={B.cy - B.ry * 0.62} width={B.rx * 1.1} height={B.ry * 1.24} preserveAspectRatio="xMidYMid meet" />
      </mask>
      <radialGradient id={`ps-${id}`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#000" stopOpacity={0.55} />
        <stop offset="1" stopColor="#000" stopOpacity={0} />
      </radialGradient>
      <linearGradient id={`pb-${id}`} x1="0" x2="1">
        <stop offset="0" stopColor="#fff" stopOpacity={0.55 * lights} />
        <stop offset="1" stopColor="#fff" stopOpacity={0} />
      </linearGradient>
    </defs>
    {shadow ? <ellipse cx={VW * 0.52} cy={VH * 0.94} rx={VW * 0.5} ry={VH * 0.07} fill={`url(#ps-${id})`} /> : null}
    {lights > 0 ? <path d={`M${VW * 0.965} ${VH * 0.6} L${VW * 1.7} ${VH * 0.38} L${VW * 1.7} ${VH * 0.98} L${VW * 0.965} ${VH * 0.74} Z`} fill={`url(#pb-${id})`} /> : null}
    <clipPath id={`pc-${id}`}>
      <path d={data.layers[0].d} fillRule="evenodd" />
    </clipPath>
    <linearGradient id={`pg-${id}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#fff" stopOpacity={0.18} />
      <stop offset="0.55" stopColor="#fff" stopOpacity={0} />
      <stop offset="1" stopColor="#000" stopOpacity={0.16} />
    </linearGradient>
    <g clipPath={`url(#pc-${id})`}>
      {data.layers.map((l) => (
        <path key={l.name} d={l.d} fill={l.tone < 0 ? `rgb(${data.colours.tire.join(",")})` : grey(l.tone + 0.03)} fillRule="evenodd" />
      ))}
      <rect x={0} y={0} width={VW} height={VH} fill={`url(#pg-${id})`} />
    </g>
    {lights > 0 ? <path d={`M${VW * 0.9} ${VH * 0.6} Q${VW * 0.95} ${VH * 0.58} ${VW * 0.975} ${VH * 0.63}`} stroke="#fff" strokeWidth={22} strokeLinecap="round" fill="none" opacity={lights} style={{ filter: `drop-shadow(0 0 30px rgba(255,255,255,${0.9 * lights}))` }} /> : null}
    {door > 0.01 ? (
      <g>
        <path d={DOOR} fill="#1b1f24" />
        <path d="M820 640 C 820 520 870 470 950 470 L1040 470 C 1100 470 1130 520 1130 580 L1130 660 Z" fill={GREEN} opacity={0.35 + 0.65 * seatGlow} style={{ filter: `drop-shadow(0 0 ${40 * seatGlow}px ${GREEN})` }} />
      </g>
    ) : null}
    {door > 0.01 ? (
      <g transform={`translate(0 ${HINGE}) scale(1 ${1 - 1.6 * door}) skewX(${-6 * door}) translate(0 ${-HINGE})`}>
        <path d={DOOR} fill={door > 0.5 ? grey(0.78) : grey(0.96)} stroke={grey(0.7)} strokeWidth={6} />
      </g>
    ) : null}
    {door < 0.45 ? (
      <g transform={`translate(0 ${HINGE}) scale(1 ${1 - 1.6 * door}) translate(0 ${-HINGE})`}>
        <ellipse cx={B.cx} cy={B.cy} rx={B.rx} ry={B.ry} fill={GREEN} />
        <rect x={B.cx - B.rx} y={B.cy - B.ry} width={B.rx * 2} height={B.ry * 2} fill="#0b0d0e" mask={`url(#pm-${id})`} />
      </g>
    ) : null}
  </svg>
);

import React from "react";
import { evolvePath } from "@remotion/paths";
import { C, fontFamily } from "../config/brand";
import { app } from "../config/content";
import { Pin } from "../components/Icons";
import { PodAt } from "../components/Pod";
import { clamp, mix } from "../components/motion";

/**
 * The in-app map, drawn by hand in app points (no tiles, no provider branding).
 * World = screen at view {dx:0, dy:0, z:1}; that framing matches 05/06 (route between the
 * route card and the options sheet).
 */

export const PICKUP = { x: 138, y: 372 };
export const DROP = { x: 296, y: 296 };
export const ROUTE = "M138 372 L138 330 L242 330 L242 296 L296 296";

const WATER = "M-300 -200 L700 -200 L700 150 C 610 176 540 118 462 148 C 384 178 322 112 246 142 C 170 172 104 126 30 158 C -60 196 -140 150 -300 172 Z";
const PARKS = ["M318 360 L382 364 L378 414 L314 408 Z", "M-4 250 L58 254 L54 302 L-8 298 Z", "M176 176 L226 180 L222 216 L172 212 Z", "M70 420 L120 424 L118 470 L66 466 Z"];
const MINOR_V = [-14, 40, 92, 190, 296, 350, 404, 452];
const MINOR_H = [196, 240, 380, 420, 470, 520, 570, 620, 680];
const ART_V = [138, 242];
const ART_H = [296, 330];
const EXPY = "M-200 262 C 20 280 200 246 600 210";

export type MapView = { dx: number; dy: number; z: number };

export const toScreen = (p: { x: number; y: number }, v: MapView) => ({ x: (p.x + v.dx) * v.z, y: (p.y + v.dy) * v.z });

export const AppMap: React.FC<{
  f: number;
  view?: MapView;
  route?: number; // draw progress, <0 hidden
  pin?: number; // 0 → 1 drop progress (pin falls 1 pin-height onto the drop point)
  pinRing?: number; // 0 → 1 ring on the map surface (stroke shrinks to 0)
  pod?: boolean;
  dropDot?: boolean;
}> = ({ f, view = { dx: 0, dy: 0, z: 1 }, route = -1, pin = 0, pinRing = 0, pod = true, dropDot = false }) => {
  const v = view;
  const ev = route > 0 ? evolvePath(clamp(route, 0.0001, 1), ROUTE) : null;
  const P = toScreen(PICKUP, v);
  const D = toScreen(DROP, v);
  const pinH = 34;
  const labels: [string, number, number, number][] = [
    [app.map.labels[0], 330, 272, 9],
    [app.map.labels[1], 60, 206, 9],
    [app.map.labels[2], 330, 394, 13],
    [app.map.labels[3], 300, 176, 9],
    [app.map.labels[4], 196, 360, 9],
  ];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 393, height: 852, overflow: "hidden", background: C.map.land }}>
      <svg width={393} height={852} style={{ position: "absolute", left: 0, top: 0 }}>
        <g transform={`scale(${v.z}) translate(${v.dx} ${v.dy})`}>
          <path d={WATER} fill={C.map.water} />
          {PARKS.map((d, i) => (
            <path key={i} d={d} fill={C.map.park} />
          ))}
          <g fill="none" strokeLinecap="round">
            {MINOR_V.map((x, i) => (
              <path key={`v${i}`} d={`M${x} 150 L${x + 6} 900`} stroke={C.map.road} strokeWidth={2.4} />
            ))}
            {MINOR_H.map((y, i) => (
              <path key={`h${i}`} d={`M-60 ${y} L460 ${y + 4}`} stroke={C.map.road} strokeWidth={2.4} />
            ))}
            {ART_V.map((x, i) => (
              <path key={`av${i}`} d={`M${x} 150 L${x} 900`} stroke={C.map.casing} strokeWidth={7} />
            ))}
            {ART_H.map((y, i) => (
              <path key={`ah${i}`} d={`M-60 ${y} L460 ${y}`} stroke={C.map.casing} strokeWidth={7} />
            ))}
            {ART_V.map((x, i) => (
              <path key={`bv${i}`} d={`M${x} 150 L${x} 900`} stroke={C.map.road} strokeWidth={5} />
            ))}
            {ART_H.map((y, i) => (
              <path key={`bh${i}`} d={`M-60 ${y} L460 ${y}`} stroke={C.map.road} strokeWidth={5} />
            ))}
            <path d={EXPY} stroke={C.map.casing} strokeWidth={12} />
            <path d={EXPY} stroke={C.map.road} strokeWidth={9} />
          </g>
          {ev ? <path d={ROUTE} fill="none" stroke={C.ink} strokeWidth={6 / v.z} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} /> : null}
        </g>
      </svg>
      {labels.map(([t, x, y, s]) => {
        const q = toScreen({ x, y }, v);
        return (
          <div key={t} style={{ position: "absolute", left: q.x, top: q.y, transform: "translate(-50%,-50%)", fontFamily, fontSize: s, fontWeight: 600, letterSpacing: 1.1, color: C.map.label, whiteSpace: "nowrap" }}>
            {t}
          </div>
        );
      })}
      {/* pickup ring dot */}
      <div style={{ position: "absolute", left: P.x - 8, top: P.y - 8, width: 16, height: 16, borderRadius: 99, background: C.white, border: `4.5px solid ${C.priceGreen}`, boxSizing: "border-box" }} />
      {pod ? <PodAt f={f} x={P.x} y={P.y + 30} size={34} variant="marker" heading={0} /> : null}
      {dropDot ? <div style={{ position: "absolute", left: D.x - 8, top: D.y - 8, width: 16, height: 16, borderRadius: 99, background: C.white, border: `4.5px solid ${C.indigo}`, boxSizing: "border-box" }} /> : null}
      {/* pin-landing ring on the map surface (an ellipse: it lies flat), stroke shrinks to 0 */}
      {pinRing > 0 && pinRing < 1 ? (
        <div
          style={{
            position: "absolute",
            left: D.x - mix(8, 46, pinRing),
            top: D.y - mix(4, 20, pinRing),
            width: mix(16, 92, pinRing),
            height: mix(8, 40, pinRing),
            borderRadius: "50%",
            boxSizing: "border-box",
            border: `${(2 * (1 - pinRing)).toFixed(3)}px solid ${C.ink}`,
          }}
        />
      ) : null}
      {/* hard contact shadow under the pin once it lands */}
      {pin >= 1 ? <div style={{ position: "absolute", left: D.x - 6, top: D.y - 2, width: 12, height: 4, borderRadius: "50%", background: "rgba(16,17,17,.18)" }} /> : null}
      {pin > 0 ? (
        <div style={{ position: "absolute", left: D.x - pinH / 2, top: D.y - pinH * (22.5 / 24) - (1 - pin) * pinH * 2.2 }}>
          <Pin size={pinH} fill={C.indigo} />
        </div>
      ) : null}
    </div>
  );
};

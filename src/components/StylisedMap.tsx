import React from "react";
import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { random } from "remotion";
import { C, fontFamily } from "../config/brand";
import { content } from "../config/content";
import { Capsule } from "./core";
import { TopDownCar } from "./Icons";
import { RingDot } from "./ui";

// World coordinates (app points at zoom 1). Drawn by hand: no map tiles, no provider branding.
export const ROUTE = "M120 390 L96 404 L94 298 L108 296 L160 346 L262 338 L264 246 L298 246 L298 216";
export const PICKUP = { x: 120, y: 390 };
export const DROP = { x: 298, y: 216 };
export const APPROACH = "M-60 436 L116 434 L120 392";

const WATER = [
  "M-420 -320 L820 -320 L820 120 C 720 150 640 70 560 110 C 470 150 420 60 330 90 C 250 120 210 40 150 70 C 90 100 40 150 -40 120 C -140 85 -230 160 -420 140 Z",
  "M-420 600 L820 600 L820 900 L-420 900 Z",
  "M150 70 C 170 120 140 160 120 200 C 100 240 60 250 20 236 L 30 214 C 70 222 96 200 110 170 C 126 136 136 100 128 76 Z",
];
const PARKS = [
  "M360 380 L430 384 L428 450 L356 446 Z",
  "M-40 230 L20 232 L18 276 L-44 272 Z",
  "M470 170 L540 176 L534 222 L466 214 Z",
];
const EXPRESSWAY = "M-420 236 C -200 250 0 300 160 318 C 320 334 520 300 820 286";

const minorRoads = (() => {
  const out: string[] = [];
  for (let i = 0; i < 26; i++) {
    const x = -380 + i * 46 + (random(`rx${i}`) - 0.5) * 18;
    out.push(`M${x.toFixed(1)} ${(130 + random(`ry${i}`) * 40).toFixed(1)} L${(x + (random(`rk${i}`) - 0.5) * 30).toFixed(1)} 600`);
  }
  for (let j = 0; j < 12; j++) {
    const y = 150 + j * 40 + (random(`hy${j}`) - 0.5) * 12;
    out.push(`M-420 ${y.toFixed(1)} L820 ${(y + (random(`hk${j}`) - 0.5) * 24).toFixed(1)}`);
  }
  return out;
})();

const ARTERIALS = ["M94 120 L94 600", "M264 120 L264 600", "M-420 404 L820 410", "M-420 246 L820 246", "M40 436 L700 434"];

export type MapView = { cx: number; cy: number; zoom: number };

export const worldToScreen = (p: { x: number; y: number }, v: MapView, w: number, h: number) => ({
  x: w / 2 + (p.x - v.cx) * v.zoom,
  y: h / 2 + (p.y - v.cy) * v.zoom,
});

export const StylisedMap: React.FC<{
  w: number;
  h: number;
  view: MapView;
  route?: number; // 0..1 draw progress (-1 hides)
  pickup?: number; // marker scale
  drop?: number;
  car?: { t: number; opacity: number } | null; // along APPROACH
  radar?: number[]; // ring progress values 0..1
  labels?: boolean;
  dim?: number;
}> = ({ w, h, view, route = 1, pickup = 1, drop = 1, car = null, radar = [], labels = true, dim = 0 }) => {
  const vb = `${view.cx - w / 2 / view.zoom} ${view.cy - h / 2 / view.zoom} ${w / view.zoom} ${h / view.zoom}`;
  const z = view.zoom;
  const ev = route >= 0 ? evolvePath(Math.max(0.0001, route), ROUTE) : null;
  const P = worldToScreen(PICKUP, view, w, h);
  const D = worldToScreen(DROP, view, w, h);
  let carPos: { x: number; y: number; a: number } | null = null;
  if (car) {
    const L = getLength(APPROACH);
    const pt = getPointAtLength(APPROACH, Math.max(0, Math.min(1, car.t)) * L) ?? PICKUP;
    const pt2 = getPointAtLength(APPROACH, Math.min(L, Math.max(0, Math.min(1, car.t)) * L + 2)) ?? PICKUP;
    const s = worldToScreen(pt, view, w, h);
    carPos = { ...s, a: (Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180) / Math.PI };
  }
  const labelPos: [string, number, number][] = [
    [content.map.labels[0], 330, 232],
    [content.map.labels[1], 40, 330],
    [content.map.labels[2], 360, 300],
    [content.map.labels[3], -40, 360],
    [content.map.labels[4], 420, 262],
  ];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, overflow: "hidden", background: C.map.land }}>
      <svg width={w} height={h} viewBox={vb} style={{ position: "absolute", left: 0, top: 0 }}>
        {WATER.map((d, i) => (
          <path key={i} d={d} fill={C.map.water} />
        ))}
        {PARKS.map((d, i) => (
          <path key={i} d={d} fill={C.map.park} />
        ))}
        <g fill="none" strokeLinecap="round">
          {minorRoads.map((d, i) => (
            <path key={i} d={d} stroke={C.map.road} strokeWidth={2.2 / Math.sqrt(z)} />
          ))}
          {ARTERIALS.map((d, i) => (
            <path key={`a${i}`} d={d} stroke={C.map.casing} strokeWidth={6.5 / Math.sqrt(z)} />
          ))}
          {ARTERIALS.map((d, i) => (
            <path key={`b${i}`} d={d} stroke={C.map.road} strokeWidth={4.5 / Math.sqrt(z)} />
          ))}
          <path d={EXPRESSWAY} stroke={C.map.casing} strokeWidth={11 / Math.sqrt(z)} />
          <path d={EXPRESSWAY} stroke={C.map.road} strokeWidth={8 / Math.sqrt(z)} />
        </g>
        {ev ? <path d={ROUTE} fill="none" stroke={C.ink} strokeWidth={5.5 / z} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} /> : null}
      </svg>
      {labels
        ? labelPos.map(([t, x, y]) => {
            const s = worldToScreen({ x, y }, view, w, h);
            return (
              <div key={t} style={{ position: "absolute", left: s.x, top: s.y, transform: "translate(-50%,-50%)", fontFamily, fontSize: 9.5, fontWeight: 600, letterSpacing: 1.2, color: C.map.label, whiteSpace: "nowrap" }}>
                {t}
              </div>
            );
          })
        : null}
      {labels ? (
        <div style={{ position: "absolute", left: worldToScreen({ x: 520, y: 296 }, view, w, h).x, top: worldToScreen({ x: 520, y: 296 }, view, w, h).y, transform: "translate(-50%,-50%) rotate(-4deg)", fontFamily, fontSize: 9, fontWeight: 600, color: "#8C9497", whiteSpace: "nowrap" }}>{content.map.road}</div>
      ) : null}
      {radar.map((p, i) =>
        p > 0 && p < 1 ? (
          <div key={i} style={{ position: "absolute", left: P.x - 70 * p, top: P.y - 70 * p, width: 140 * p, height: 140 * p, borderRadius: 999, border: `2px solid ${C.ctaGreen}`, background: `rgba(32,230,130,${0.18 * (1 - p)})`, opacity: 1 - p }} />
        ) : null,
      )}
      {pickup > 0.01 ? <RingDot color={C.priceGreen} size={15} style={{ position: "absolute", left: P.x - 7.5, top: P.y - 7.5, transform: `scale(${pickup})`, boxShadow: "0 2px 6px rgba(16,17,17,.25)" }} /> : null}
      {drop > 0.01 ? <RingDot color={C.indigo} size={15} style={{ position: "absolute", left: D.x - 7.5, top: D.y - 7.5, transform: `scale(${drop})`, boxShadow: "0 2px 6px rgba(16,17,17,.25)" }} /> : null}
      {carPos ? (
        <div style={{ position: "absolute", left: carPos.x, top: carPos.y, transform: `translate(-50%,-50%) rotate(${carPos.a}deg)`, opacity: car!.opacity }}>
          <Capsule cx={0} cy={0} w={50} h={26} glowAmt={0.8} style={{ position: "relative", left: 0, top: 0 }}>
            <TopDownCar w={34} />
          </Capsule>
        </div>
      ) : null}
      {dim > 0 ? <div style={{ position: "absolute", inset: 0, background: `rgba(16,17,17,${dim})` }} /> : null}
    </div>
  );
};

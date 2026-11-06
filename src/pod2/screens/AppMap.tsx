import React from "react";
import { evolvePath } from "@remotion/paths";
import { C, fontFamily } from "../config/brand";
import { app } from "../config/content";
import { Pin } from "../components/Icons";
import { PodAt } from "../components/Pod";
import { clamp, mix } from "../components/motion";
import { CREEK, DROP, LAGOON, PARKS, PICKUP, ROADS, ROUNDABOUT, ROUTE, toPath, toPoly } from "../components/RoadNet";

/**
 * The in-app map, drawn from the shared road network (components/RoadNet.ts): no tiles, no
 * provider branding. World = screen at view {dx:0, dy:0, z:1}; that framing matches 05/06
 * (route between the route card and the options sheet).
 */

export { DROP, PICKUP, ROUTE };

export type MapView = { dx: number; dy: number; z: number };

export const toScreen = (p: { x: number; y: number }, v: MapView) => ({ x: (p.x + v.dx) * v.z, y: (p.y + v.dy) * v.z });

const W_BY_CLASS = { minor: [3.4, 2.4], arterial: [7.5, 5.5], expressway: [12, 9] } as const;

const Roads: React.FC = React.memo(() => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    {(["minor", "arterial", "expressway"] as const).map((cls) => (
      <g key={cls}>
        {ROADS.filter((r) => r.cls === cls).map((r, i) => (
          <path key={`c${i}`} d={toPath(r.pts)} stroke={C.map.casing} strokeWidth={W_BY_CLASS[cls][0]} />
        ))}
        {ROADS.filter((r) => r.cls === cls).map((r, i) => (
          <path key={`r${i}`} d={toPath(r.pts)} stroke={C.map.road} strokeWidth={W_BY_CLASS[cls][1]} />
        ))}
      </g>
    ))}
    <circle cx={ROUNDABOUT.c.x} cy={ROUNDABOUT.c.y} r={ROUNDABOUT.r} stroke={C.map.casing} strokeWidth={7.5} />
    <circle cx={ROUNDABOUT.c.x} cy={ROUNDABOUT.c.y} r={ROUNDABOUT.r} stroke={C.map.road} strokeWidth={5.5} />
    <circle cx={ROUNDABOUT.c.x} cy={ROUNDABOUT.c.y} r={ROUNDABOUT.r - 6} fill={C.map.park} />
  </g>
));

export const AppMap: React.FC<{
  f: number;
  view?: MapView;
  route?: number; // draw progress, <0 hidden
  pin?: number; // 0 → 1 drop progress (pin falls onto the drop point)
  pinRing?: number; // 0 → 1 ring on the map surface (stroke shrinks to 0)
  pod?: boolean;
}> = ({ f, view = { dx: 0, dy: 0, z: 1 }, route = -1, pin = 0, pinRing = 0, pod = true }) => {
  const v = view;
  const ev = route > 0 ? evolvePath(clamp(route, 0.0001, 1), ROUTE) : null;
  const P = toScreen(PICKUP, v);
  const D = toScreen(DROP, v);
  const pinH = 34;
  const labels: [string, number, number, number][] = [
    [app.map.labels[0], 350, 214, 9],
    [app.map.labels[1], 40, 118, 9],
    [app.map.labels[2], 340, 404, 13],
    [app.map.labels[3], 300, 112, 9],
    [app.map.labels[4], 214, 352, 8.5],
  ];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 393, height: 852, overflow: "hidden", background: C.map.land }}>
      <svg width={393} height={852} style={{ position: "absolute", left: 0, top: 0 }}>
        <g transform={`scale(${v.z}) translate(${v.dx} ${v.dy})`}>
          {PARKS.map((p, i) => (
            <path key={i} d={toPoly(p)} fill={C.map.park} />
          ))}
          <Roads />
          <path d={toPoly(LAGOON)} fill={C.map.water} />
          <path d={toPoly(CREEK)} fill={C.map.water} />
          {/* the expressway bridge over the creek sits above the water */}
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
      <div style={{ position: "absolute", left: P.x - 8, top: P.y - 8, width: 16, height: 16, borderRadius: 99, background: C.white, border: `4.5px solid ${C.priceGreen}`, boxSizing: "border-box" }} />
      {pod ? <PodAt f={f} x={P.x} y={P.y + 30} size={34} variant="marker" heading={0} /> : null}
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
      {pin >= 1 ? <div style={{ position: "absolute", left: D.x - 6, top: D.y - 2, width: 12, height: 4, borderRadius: "50%", background: "rgba(16,17,17,.18)" }} /> : null}
      {pin > 0 ? (
        <div style={{ position: "absolute", left: D.x - pinH / 2, top: D.y - pinH * (22.5 / 24) - (1 - pin) * pinH * 2.2 }}>
          <Pin size={pinH} fill={C.indigo} />
        </div>
      ) : null}
    </div>
  );
};

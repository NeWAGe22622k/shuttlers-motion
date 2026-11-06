import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { evolvePath, getLength } from "@remotion/paths";
import { C, EASE, H, T, TYPE, W } from "../config/brand";
import { s10, s11, s12, s13, s14, s9 } from "../config/content";
import { G1, G2, G3, Texture } from "../config/gradients";
import { Asset } from "../../components/core";
import { SMark } from "../../edu/kit";
import { Breath, Handset, Pin, SleepFace } from "../components/Icons";
import { CREEK, LAGOON, PICKUP, Pt, ROADS, ROUNDABOUT, toPath, toPoly } from "../components/RoadNet";
import { FindingPodScreen, PodBookedScreen } from "../screens/Screens";
import { clamp, mix, mixHex, tw } from "../components/motion";
import { POD_BODY, POD_L, PodAt } from "../components/Pod";
import { growScale, placePath } from "../components/transitions";
import { FillSweep, MaskRise, ScaleCut, Slice, SLICE_DUR, textWidth, wrapLines } from "../components/type";

/* ================================================================== S9 · "Blink." (510–570) */

/**
 * The eye (240px) blinks twice. Each time the lid reopens, the eye shape has become a window onto
 * the app: first 10-pod-booked ("Your Pod is booked"), then 11-finding-pod (progress bar moving).
 * From f540 the window grows to fill the frame and the inside cuts to black.
 */
export const EYE = { x: 960, y: 330, size: T.s9.eyeSize };
const U = EYE.size / 24; // px per icon unit
const EYE_STROKE = 2.5 * U;
const almond = (cy: number) => `M 1.5 12 C 5 ${cy} 19 ${cy} 22.5 12 C 19 17.8 5 17.8 1.5 12 Z`; // region below the lid
const LOWER = "M 1.5 12 C 5 17.8 19 17.8 22.5 12";
const lidCurve = (cy: number) => `M 1.5 12 C 5 ${cy} 19 ${cy} 22.5 12`;
const place = (d: string, s: number) => placePath(placePath(d, -12, -12, 1), EYE.x, EYE.y, s);

const blinkLid = (f: number, [a, b]: number[]) => {
  const mid = (a + b) / 2;
  return f < a || f >= b ? 0 : f < mid ? tw(f, a, mid, 0, 1, EASE.expoInOut) : tw(f, mid, b, 1, 0, EASE.expoInOut);
};

/** Window scale (×U): 1 until the first reopen, opens to windowScale, then the f540 grow fills the frame. */
const eyeScale = (f: number) => {
  const [b1] = T.s9.blinks;
  const mid1 = (b1[0] + b1[1]) / 2;
  const open = mix(1, T.s9.windowScale, tw(f, mid1, b1[1] + 2, 0, 1, EASE.expoOut)) * (1 + 0.004 * Math.max(0, f - b1[1])); // keeps pushing in
  const [g0, g1] = T.transitions.maskGrowEye;
  return f < g0 ? open : growScale(f, g0, g1, open, 140);
};

export const S9: React.FC = () => {
  const f = useCurrentFrame();
  const [b1, b2] = T.s9.blinks;
  const mid1 = (b1[0] + b1[1]) / 2;
  const mid2 = (b2[0] + b2[1]) / 2;
  const lid = Math.max(blinkLid(f, b1), blinkLid(f, b2));
  const cy = mix(6.2, 17.8, lid);
  const sc = eyeScale(f);
  const s = U * sc;
  const grow = 1 + 0.05 * ((f - T.scenes.s9[0]) / 30);
  // what the window shows
  const screen = f < mid1 ? null : f < mid2 ? "booked" : f < T.transitions.eyeContentUntil ? "finding" : "black";
  // booked: popper shapes + "Your Pod is booked" + body; finding: title, progress bar, quote
  const roi = screen === "booked" ? { x: 196, y: 482 } : { x: 196, y: 560 };
  const k = (screen === "booked" ? 1.15 : 1.3) * (sc / T.s9.windowScale); // content px per app point, follows the window
  return (
    <AbsoluteFill>
      <G3 f={f} />
      <div style={{ position: "absolute", left: 0, top: 640, width: W, textAlign: "center", transform: `scale(${grow.toFixed(4)})`, transformOrigin: "50% 50%" }}>
        <div style={{ fontFamily: "Google Sans", fontSize: TYPE.word, fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, lineHeight: 1.08 }}>{s9.line}</div>
      </div>
      {screen ? (
        <AbsoluteFill style={{ clipPath: `path('${place(almond(cy), s)}')`, background: screen === "black" ? "#000" : C.white }}>
          {screen !== "black" ? (
            <div style={{ position: "absolute", left: EYE.x - roi.x * k, top: EYE.y - roi.y * k, width: 393, height: 852, transform: `scale(${k.toFixed(4)})`, transformOrigin: "0 0" }}>
              {screen === "booked" ? (
                <PodBookedScreen shapes={tw(f, mid1, mid1 + 10, 0, 1, EASE.expoOut)} />
              ) : (
                <FindingPodScreen f={f} progress={tw(f, mid2, T.transitions.eyeContentUntil, 0.12, 0.46, EASE.linear)} />
              )}
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {f < T.transitions.maskGrowEye[0] ? (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          {!screen ? (
            <>
              <defs>
                <clipPath id="eyeLid">
                  <path d={place(almond(cy), s)} />
                </clipPath>
              </defs>
              <circle cx={EYE.x} cy={EYE.y} r={3.6 * s} fill={C.ink} clipPath="url(#eyeLid)" />
            </>
          ) : null}
          <path d={place(LOWER, s)} fill="none" stroke={C.ink} strokeWidth={EYE_STROKE} strokeLinecap="round" />
          <path d={place(lidCurve(cy), s)} fill="none" stroke={C.ink} strokeWidth={EYE_STROKE} strokeLinecap="round" />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

/** f555–570: one beat of pure black that keeps a 1px grain flicker. */
export const Black: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      <Texture f={f} blend="normal" strength={0.6} />
      <div style={{ position: "absolute", left: Math.floor(random(`blk-x${Math.floor(f)}`) * W), top: Math.floor(random(`blk-y${Math.floor(f)}`) * H), width: 1, height: 1, background: "#1A1A1A" }} />
    </AbsoluteFill>
  );
};

/* ================================================================== S10 · "And your Pod is here." (570–630) */

/** The night map is the day map's road network, as white strokes over G1, pickup at PIN_AT. */
const NIGHT = { k: 1.7, pin: { x: 960, y: 640 } };
export const PARK = { x: 960, y: 762, size: 230, heading: 0 };
const toNight = (p: Pt) => ({ x: (p.x - PICKUP.x) * NIGHT.k + NIGHT.pin.x, y: (p.y - PICKUP.y) * NIGHT.k + NIGHT.pin.y });

type Stroke = { d: string; len: number; delay: number; w: number; a: number };
const NIGHT_STROKES: Stroke[] = (() => {
  const out: Stroke[] = [];
  const style = { minor: { w: 1.3, a: 0.34 }, arterial: { w: 2.6, a: 0.62 }, expressway: { w: 4.2, a: 0.82 }, shore: { w: 2.2, a: 0.7 } } as const;
  const add = (pts: Pt[], cls: keyof typeof style) => {
    const fp = pts.map(toNight);
    // split at the vertex nearest the pin; both halves draw outward from there
    let best = 0;
    let bd = Infinity;
    fp.forEach((p, i) => {
      const d = Math.hypot(p.x - NIGHT.pin.x, p.y - NIGHT.pin.y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    for (const part of [fp.slice(0, best + 1).reverse(), fp.slice(best)]) {
      if (part.length < 2) continue;
      const d = toPath(part);
      out.push({ d, len: getLength(d), delay: bd, ...style[cls] });
    }
  };
  ROADS.forEach((r) => add(r.pts, r.cls));
  add(LAGOON.slice(0, LAGOON.length - 2), "shore");
  add(CREEK, "shore");
  return out;
})();
const MAX_D = Math.hypot(W, H);

const NightMap: React.FC<{ f: number }> = ({ f }) => {
  const [a, b] = T.s10.roads;
  const half = (b - a) / 2;
  const rb = toNight(ROUNDABOUT.c);
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d={toPoly(LAGOON.map(toNight))} fill="rgba(166,203,227,0.10)" />
      <path d={toPoly(CREEK.map(toNight))} fill="rgba(166,203,227,0.10)" />
      {NIGHT_STROKES.map((st, i) => {
        const t0 = a + (st.delay / MAX_D) * half * 1.6;
        const p = tw(f, t0, t0 + half, 0, 1, EASE.expoOut);
        if (p <= 0) return null;
        return <path key={i} d={st.d} fill="none" stroke={`rgba(255,255,255,${st.a})`} strokeWidth={st.w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${st.len} ${st.len}`} strokeDashoffset={st.len * (1 - p)} />;
      })}
      {f >= a + half ? <circle cx={rb.x} cy={rb.y} r={ROUNDABOUT.r * NIGHT.k} fill="none" stroke="rgba(255,255,255,0.62)" strokeWidth={2.6} /> : null}
    </svg>
  );
};

export const S10: React.FC = () => {
  const f = useCurrentFrame();
  const R = T.s10;
  const push = 1 + 0.02 * ((f - T.scenes.s10[0]) / 30);
  return (
    <AbsoluteFill>
      <G1 f={f} />
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(4)})`, transformOrigin: `${PARK.x}px ${PARK.y}px` }}>
        <NightMap f={f} />
        <div style={{ position: "absolute", left: NIGHT.pin.x - 45, top: NIGHT.pin.y - 90 * (22.5 / 24) }}>
          <Pin size={90} fill={C.ctaGreen} dot={C.ink} />
        </div>
        <PodAt f={f} x={PARK.x} y={PARK.y} size={PARK.size} heading={PARK.heading} headlights={f >= R.headlights ? "white" : "grey"} door={f >= R.door ? 1 : 0} />
      </AbsoluteFill>
      <MaskRise f={f} at={R.line} lines={[s10.line]} size={TYPE.title} color={C.white} align="center" style={{ position: "absolute", left: 0, width: W, top: 96 }} />
    </AbsoluteFill>
  );
};

/** S10 → S11: the parked Pod's body grows to fill the frame. */
export const podMaskPath = (f: number) => {
  const [a, b] = T.transitions.maskGrowPodMarker;
  const push = 1 + 0.02 * ((f - T.scenes.s10[0]) / 30);
  const s0 = (PARK.size / POD_L) * push;
  return placePath(POD_BODY, PARK.x, PARK.y, growScale(f, a, b, s0, 14), PARK.heading);
};

/* ================================================================== S11 · "All yours." (630–690) */

const S12POD = { x: 520, y: 560, size: 470, heading: 0 };

export const S11: React.FC = () => {
  const f = useCurrentFrame();
  const R = T.s11;
  const t0 = T.scenes.s11[0];
  const glide = tw(f, T.scenes.s11[1] - 12, T.scenes.s11[1], 0, 1, EASE.expoInOut);
  const heading = 90 + 2 * ((f - t0) / 30);
  return (
    <AbsoluteFill>
      <G3 f={f} />
      <PodAt
        f={f}
        x={mix(960, S12POD.x, glide)}
        y={mix(430, S12POD.y, glide)}
        size={mix(640, S12POD.size, glide)}
        heading={mix(heading, 0, glide)}
        seatFill={tw(f, R.seat[0], R.seat[1], 0, 1, EASE.expoOut)}
        bodyFlood={tw(f, R.flood[0], R.flood[1], 0, 1, EASE.expoOut)}
      />
      <div style={{ position: "absolute", left: (W - textWidth(s11.line, TYPE.word)) / 2, top: 750 }}>
        <FillSweep f={f} at={R.line} text={s11.line} size={TYPE.word} />
      </div>
    </AbsoluteFill>
  );
};

/* ================================================================== S12 · Catch a call / nap / breath (690–780) */

const ROAD_X = S12POD.x;

/** Top-down city sliding past: ground layer (roads, parks) and a faster rooftop layer for parallax. */
const ScrollMap: React.FC<{ f: number }> = ({ f }) => {
  const t = (f - T.scenes.s12[0]) / 30;
  const yA = t * 420; // px travelled by the ground
  const yB = t * 620; // rooftops are nearer: faster
  const CELL = 300;
  const rows = Math.ceil(H / CELL) + 2;
  const k0 = Math.floor(yA / CELL);
  const kb0 = Math.floor(yB / CELL);
  const vroads = [70, 300, ROAD_X, 760, 1010, 1290, 1560, 1840];
  return (
    <AbsoluteFill style={{ background: C.map.land, overflow: "hidden" }}>
      {/* ground */}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: rows }, (_, r) => {
          const k = k0 - r + 1;
          const y = yA - k * CELL;
          return (
            <g key={k} transform={`translate(0 ${y.toFixed(2)})`}>
              {vroads.slice(0, -1).map((x, i) => {
                const seed = `${k}-${i}`;
                const park = random(`park${seed}`) < 0.22 && x !== ROAD_X && vroads[i + 1] !== ROAD_X;
                const water = random(`water${seed}`) < 0.06;
                if (!park && !water) return null;
                return <rect key={i} x={x + 14} y={14} width={vroads[i + 1] - x - 28} height={CELL - 28} fill={water ? C.map.water : C.map.park} />;
              })}
              <path d={`M -20 0 L ${W + 20} 0`} stroke={C.map.casing} strokeWidth={14} />
              <path d={`M -20 0 L ${W + 20} 0`} stroke={C.map.road} strokeWidth={10} />
              <path d={`M -20 ${CELL / 2} L ${W + 20} ${CELL / 2}`} stroke={C.map.road} strokeWidth={4} />
            </g>
          );
        })}
        {vroads.map((x) => (
          <g key={x}>
            <path d={`M ${x} -20 L ${x} ${H + 20}`} stroke={C.map.casing} strokeWidth={x === ROAD_X ? 84 : 14} />
            <path d={`M ${x} -20 L ${x} ${H + 20}`} stroke={C.map.road} strokeWidth={x === ROAD_X ? 78 : 10} />
          </g>
        ))}
        {/* lane dashes on the Pod's road move with the ground */}
        <path d={`M ${ROAD_X} -60 L ${ROAD_X} ${H + 60}`} stroke={C.map.casing} strokeWidth={4} strokeDasharray="34 46" strokeDashoffset={-(yA % 80)} />
      </svg>
      {/* rooftops (hard 10% offset shadow, no blur) */}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: Math.ceil(H / CELL) + 2 }, (_, r) => {
          const k = kb0 - r + 1;
          const y = yB - k * CELL;
          return (
            <g key={k} transform={`translate(0 ${y.toFixed(2)})`}>
              {vroads.slice(0, -1).map((x, i) => {
                if (x === ROAD_X || vroads[i + 1] === ROAD_X) return null;
                const seed = `${k}-${i}`;
                if (random(`roof${seed}`) < 0.45) return null;
                const bw = (vroads[i + 1] - x) * mix(0.35, 0.62, random(`rw${seed}`));
                const bh = CELL * mix(0.3, 0.55, random(`rh${seed}`));
                const bx = x + 24 + random(`rx${seed}`) * (vroads[i + 1] - x - bw - 48);
                const by = 30 + random(`ry${seed}`) * (CELL - bh - 60);
                return (
                  <g key={i}>
                    <rect x={bx + 14} y={by + 18} width={bw} height={bh} fill="rgba(16,17,17,0.10)" />
                    <rect x={bx} y={by} width={bw} height={bh} fill="#F8F9F8" stroke={C.map.casing} strokeWidth={2} />
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

const ROWS_Y = [250, 470, 690];
const ICON = 120;
const TEXT_X = 1110;

export const S12: React.FC = () => {
  const f = useCurrentFrame();
  const R = T.s12;
  const icons = [
    (c: string) => <Handset size={ICON} color={c} rock={f < R.phoneRock[0] ? 0 : 12 * Math.sin(Math.PI * tw(f, R.phoneRock[0], R.phoneRock[1], 0, 2, EASE.expoInOut))} />,
    (c: string) => <SleepFace size={ICON} color={c} close={f < R.napClose[0] ? 0 : tw(f, R.napClose[0], R.napClose[1], 0.0001, 1, EASE.expoOut)} />,
    (c: string) => <Breath size={ICON} color={c} draw={tw(f, R.breathDraw[0], R.breathDraw[1], 0, 1, EASE.expoOut)} phase={-(f - R.beats[2]) / 6} />,
  ];
  return (
    <AbsoluteFill>
      <ScrollMap f={f} />
      <PodAt f={f} x={S12POD.x} y={S12POD.y} size={S12POD.size} heading={0} seatFill={1} bodyFlood={1} />
      {s12.lines.map((ln, i) => {
        const at = R.beats[i];
        if (f < at - SLICE_DUR) return null; // the line slices in to lock on the beat; the icon lands on it
        const next = R.beats[i + 1];
        const back = next === undefined ? 0 : tw(f, next, next + 6, 0, 1, EASE.expoOut);
        const col = mixHex(C.ink, C.muted, back);
        const sc = mix(1, 0.85, back);
        return (
          <div key={i} style={{ position: "absolute", left: 960, top: ROWS_Y[i] - ICON / 2, transform: `scale(${sc.toFixed(4)})`, transformOrigin: "0 50%" }}>
            <ScaleCut f={f} at={at} from={2} style={{ position: "absolute", left: 0, top: 0 }}>
              {icons[i](col)}
            </ScaleCut>
            <div style={{ position: "absolute", left: TEXT_X - 960, top: ICON / 2 - (TYPE.step * 1.08) / 2 }}>
              <Slice f={f} lock={at} lines={[ln]} size={TYPE.step} color={col} />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const S12_POD = S12POD;

/* ================================================================== S13 · "Pod Solo." (780–840) */

const CAR = { w: 660, srcW: 501, srcH: 332, contactY: 0.86 };
/** The road the car drives along: a ctaGreen line in perspective, from the bottom edge to a vanishing point. */
const ROAD = { a: { x: 1458, y: 1100 }, v: { x: 600, y: 330 }, w0: 30, w1: 2 };
const C0 = { x: 960, y: 653 }; // the car's contact point once settled (on the road)

const RoadLine: React.FC<{ t: number }> = ({ t }) => {
  if (t <= 0) return null;
  const { a, v, w0, w1 } = ROAD;
  const dx = v.x - a.x;
  const dy = v.y - a.y;
  const L = Math.hypot(dx, dy);
  const nx = -dy / L;
  const ny = dx / L;
  const e = { x: a.x + dx * t, y: a.y + dy * t };
  const we = mix(w0, w1, t) / 2;
  const pts = [
    [a.x + nx * (w0 / 2), a.y + ny * (w0 / 2)],
    [e.x + nx * we, e.y + ny * we],
    [e.x - nx * we, e.y - ny * we],
    [a.x - nx * (w0 / 2), a.y - ny * (w0 / 2)],
  ];
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d={`M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L")} Z`} fill={C.ctaGreen} />
    </svg>
  );
};

export const S13: React.FC = () => {
  const f = useCurrentFrame();
  const R = T.s13;
  const settle = tw(f, R.settle[0], R.settle[1], 0, 1, EASE.expoInOut); // sits on the Pod's spot at the cut, then moves onto the road
  const pull = tw(f, R.pull[0], R.pull[1], 0, 1, EASE.quintIn); // speed ramp: starts slow, accelerates away
  const start = { x: S12POD.x, y: S12POD.y + 140 };
  const onRoad = { x: mix(C0.x, ROAD.v.x, 0.62 * pull), y: mix(C0.y, ROAD.v.y, 0.62 * pull) };
  const cx = mix(start.x, onRoad.x, settle);
  const cy = mix(start.y, onRoad.y, settle);
  const s = mix(mix(0.78, 1, settle), 0.4, pull);
  const k = CAR.w / CAR.srcW;
  const h = CAR.srcH * k;
  // the Pod outline from S12 erases off the car on the cut
  const o = tw(f, R.outline[0], R.outline[1], 0, 1, EASE.linear);
  const outline = placePath(POD_BODY, S12POD.x, S12POD.y, S12POD.size / POD_L, 0);
  const ev = evolvePath(Math.max(0.0001, 1 - o), outline);
  return (
    <AbsoluteFill>
      <G3 f={f} />
      <RoadLine t={tw(f, R.road[0], R.road[1], 0, 1, EASE.expoOut)} />
      <div style={{ position: "absolute", left: cx - CAR.w / 2, top: cy - h * CAR.contactY, width: CAR.w, height: h, transform: `scale(${s.toFixed(4)})`, transformOrigin: `50% ${CAR.contactY * 100}%` }}>
        {/* flat, hard-edged contact shadow (ink 18%, no blur) */}
        <svg width={CAR.w} height={h} viewBox={`0 0 ${CAR.srcW} ${CAR.srcH}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <ellipse cx={250} cy={262} rx={262} ry={44} transform="rotate(8 250 262)" fill="rgba(16,17,17,0.18)" />
        </svg>
        <Asset src="vehicles/fleet-a-rear34.png" w={CAR.w} style={{ position: "absolute", left: 0, top: 0 }} />
      </div>
      {o < 1 ? (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d={outline} fill="none" stroke={C.ctaGreen} strokeWidth={6} strokeLinejoin="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
        </svg>
      ) : null}
      {/* bottom-left, clear of the road */}
      <Slice f={f} lock={R.lineLock} lines={[s13.line]} size={TYPE.word} style={{ position: "absolute", left: 120, top: 820 }} />
    </AbsoluteFill>
  );
};

/* ================================================================== S14 · end frame "Pod Now." (840–900) */

export const S14: React.FC = () => {
  const f = useCurrentFrame();
  const R = T.s14;
  const push = 1 + 0.02 * tw(f, R.push[0], R.push[1], 0, 1, EASE.linear) + 0.008 * tw(f, T.scenes.s14[0], R.push[0], 0, 1, EASE.linear);
  const tagSize = TYPE.step;
  const gap = 44;
  const tagW = s14.tags.map((t) => textWidth(t, tagSize));
  const total = tagW.reduce((a, b) => a + b, 0) + gap * (s14.tags.length - 1);
  let x = (W - total) / 2;
  return (
    <AbsoluteFill>
      <G2 f={f} tone="end" />
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(4)})`, transformOrigin: "50% 50%" }}>
        <ScaleCut f={f} at={R.mark} style={{ position: "absolute", left: W / 2 - 66, top: 168 }}>
          <SMark size={168} color={C.ink} />
        </ScaleCut>
        <MaskRise f={f} at={R.line} lines={wrapLines(s14.line, TYPE.hero, 1600)} size={TYPE.hero} align="center" style={{ position: "absolute", left: 0, width: W, top: 410 }} />
        {s14.tags.map((t, i) => {
          const el = <Slice key={t} f={f} lock={R.tagLocks[i]} lines={[t]} size={tagSize} style={{ position: "absolute", left: x, top: 660 }} />;
          x += tagW[i] + gap;
          return el;
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { evolvePath } from "@remotion/paths";
import { C, EASE, H, SAFE, T, TYPE, W } from "../config/brand";
import { s10, s11, s12, s13, s14, s9 } from "../config/content";
import { G1, G3 } from "../config/gradients";
import { Asset } from "../../components/core";
import { SMark } from "../../edu/kit";
import { Breath, Handset, SleepFace } from "../components/Icons";
import { mix, mixHex, tw } from "../components/motion";
import { POD_BODY, POD_L, PodAt } from "../components/Pod";
import { placePath } from "../components/transitions";
import { FillSweep, MaskRise, ScaleCut, Slice, SLICE_DUR, textWidth, typeStyle } from "../components/type";

/* ================================================================== S9 · "Blink" (600–660) */

/**
 * Only the word, 220px, centred on G3. The word itself blinks: a top and a bottom mask close over
 * the letters to a 6px slit and reopen (4f each way, expoInOut), closed exactly on the cue frames.
 * After the second blink the slit closes completely, and the film cuts to S10 on f660.
 */
const WORD = { size: T.s9.word, cy: 865 };
// Google Sans: baseline at (halfLeading + .927em), cap top at baseline − .716em (line-height 1)
const BASE = ((1 - 1.171) / 2 + 0.927) * WORD.size;
const CAP = BASE - 0.716 * WORD.size;
const EYE_LINE = (CAP + BASE) / 2; // where the lids meet

const lidAt = (f: number) => {
  const h = T.s9.blinkHalf;
  let c = 0;
  for (const b of T.s9.blinks) {
    if (f >= b - h && f < b) c = Math.max(c, tw(f, b - h, b, 0, 1, EASE.expoInOut));
    else if (f >= b && f < b + h) c = Math.max(c, tw(f, b, b + h, 1, 0, EASE.expoInOut));
  }
  const [a, z] = T.s9.close;
  const mid = (a + z) / 2;
  if (f >= a) c = f < mid ? Math.max(c, tw(f, a, mid, 0, 1, EASE.expoInOut)) : 1 + tw(f, mid, z, 0, 1, EASE.expoInOut); // >1: the slit itself closes
  return c;
};

export const S9: React.FC = () => {
  const f = useCurrentFrame();
  const c = lidAt(f);
  const slit = T.s9.slit / 2;
  const close = Math.min(1, c);
  const shut = Math.max(0, c - 1);
  const topInset = mix(0, EYE_LINE - slit, close) + slit * shut;
  const botInset = mix(0, WORD.size - EYE_LINE - slit, close) + slit * shut;
  const grow = 1 + 0.05 * ((f - T.scenes.s9[0]) / 30);
  return (
    <AbsoluteFill>
      <G3 f={f} />
      <div style={{ position: "absolute", left: 0, top: WORD.cy - EYE_LINE, width: W, display: "flex", justifyContent: "center", transform: `scale(${grow.toFixed(4)})`, transformOrigin: `50% ${EYE_LINE}px` }}>
        <div style={{ ...typeStyle({ size: WORD.size, lh: 1 }), clipPath: `inset(${topInset.toFixed(2)}px -20px ${botInset.toFixed(2)}px -20px)` }}>{s9.line}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ================================================================== S10 · "And your Pod is here" (660–720) */

/**
 * Premium arrival: G1 night mesh (slow drift) over a dark glossy floor with a hard horizon line.
 * The white EV drives in from the right (fast in, expoOut stop, motion blur only while fast), stops
 * centre on a hard contact shadow, with a faint mirrored reflection that is part of the floor.
 * Its headlight shapes switch on (flat fill) as it stops.
 */
const EV = { src: "vehicles/fleet-c-34.png", srcW: 1033, srcH: 576, w: 900, cy: 1100, horizon: 1172 };
const EVK = EV.w / EV.srcW;
const EVH = EV.srcH * EVK;
// headlight shapes traced on fleet-c-34 (source px)
const LIGHTS = [
  "M 284 268 L 330 246 L 420 230 L 476 224 L 470 242 L 420 258 L 340 274 L 292 278 Z",
  "M 48 258 L 56 236 L 80 212 L 84 226 L 72 250 L 56 266 Z",
];

export const evX = (f: number) => mix(W / 2 + 1500, W / 2, tw(f, T.s10.carIn[0], T.s10.carIn[1], 0, 1, EASE.expoOut));

const EVCar: React.FC<{ lights: boolean; withShadow?: boolean }> = ({ lights, withShadow = true }) => (
  <div style={{ position: "relative", width: EV.w, height: EVH }}>
    {withShadow ? (
      <svg width={EV.w} height={EVH} viewBox={`0 0 ${EV.srcW} ${EV.srcH}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <ellipse cx={520} cy={522} rx={510} ry={46} transform="rotate(-5 520 522)" fill="rgba(0,0,0,0.6)" />
      </svg>
    ) : null}
    <Asset src={EV.src} w={EV.w} style={{ position: "absolute", left: 0, top: 0 }} />
    <svg width={EV.w} height={EVH} viewBox={`0 0 ${EV.srcW} ${EV.srcH}`} style={{ position: "absolute", left: 0, top: 0 }}>
      {LIGHTS.map((d) => (
        <path key={d} d={d} fill={lights ? C.white : "#2C2F36"} />
      ))}
    </svg>
  </div>
);

const EVLayer: React.FC = () => {
  const f = useCurrentFrame();
  const x = evX(f);
  const top = EV.cy - EVH / 2;
  const lights = f >= T.s10.headlights;
  return (
    <AbsoluteFill>
      {/* reflection: a flipped copy in the floor, 20%, masked off within 200px (part of the floor, not a dissolve) */}
      <div
        style={{
          position: "absolute",
          left: x - EV.w / 2,
          top: top + EVH - 18,
          width: EV.w,
          height: EVH,
          transform: "scaleY(-1)",
          transformOrigin: "50% 0",
          opacity: 0.2,
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 0px, rgba(0,0,0,0.5) 90px, rgba(0,0,0,0) 200px)",
          maskImage: "linear-gradient(to top, rgba(0,0,0,1) 0px, rgba(0,0,0,0.5) 90px, rgba(0,0,0,0) 200px)",
        }}
      >
        <EVCar lights={lights} withShadow={false} />
      </div>
      <div style={{ position: "absolute", left: x - EV.w / 2, top }}>
        <EVCar lights={lights} />
      </div>
    </AbsoluteFill>
  );
};

export const S10: React.FC = () => {
  const f = useCurrentFrame();
  const R = T.s10;
  const push = 1 + 0.03 * ((f - T.scenes.s10[0]) / 60);
  const fast = f >= R.blur[0] && f < R.blur[1];
  return (
    <AbsoluteFill>
      {/* G1 flipped so its green field sits up behind the headline, never on the horizon (no glow read) */}
      <G1 f={f * 0.35} style={{ transform: "scaleY(-1)" }} />
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(4)})`, transformOrigin: `50% ${EV.cy}px` }}>
        {/* glossy floor: a darker band with a hard horizon line (no glow) */}
        <div style={{ position: "absolute", left: -40, top: EV.horizon, width: W + 80, height: H - EV.horizon + 80, background: "linear-gradient(180deg, #0B0C12 0%, #07080C 45%, #050508 100%)" }} />
        <div style={{ position: "absolute", left: -40, top: EV.horizon, width: W + 80, height: 2, background: "rgba(255,255,255,0.16)" }} />
        {fast ? (
          <CameraMotionBlur shutterAngle={180} samples={8}>
            <EVLayer />
          </CameraMotionBlur>
        ) : (
          <EVLayer />
        )}
      </AbsoluteFill>
      <MaskRise f={f} at={R.line} lines={s10.lines} size={TYPE.title} color={C.white} align="center" style={{ position: "absolute", left: 0, width: W, top: 420 }} />
    </AbsoluteFill>
  );
};

/* ================================================================== S11 · "All yours" (720–780) */

/** The match cut: THE POD appears exactly where the car stood, nose left, at the car's length. */
const MATCH = { x: W / 2, y: EV.cy + 30, size: EV.w * 0.94, heading: 270 };
const S11POD = { x: W / 2, y: 820, size: 700 };
export const S12POD = { x: W / 2, y: 560, size: 470, heading: 0 };

export const S11: React.FC = () => {
  const f = useCurrentFrame();
  const R = T.s11;
  const t0 = T.scenes.s11[0];
  const up = tw(f, t0 + 2, t0 + 14, 0, 1, EASE.expoInOut);
  const glide = tw(f, R.glide[0], R.glide[1], 0, 1, EASE.expoInOut);
  const spin = 2 * ((f - t0) / 30);
  let x = mix(MATCH.x, S11POD.x, up);
  let y = mix(MATCH.y, S11POD.y, up);
  let size = mix(MATCH.size, S11POD.size, up);
  let heading = MATCH.heading + spin;
  x = mix(x, S12POD.x, glide);
  y = mix(y, S12POD.y, glide);
  size = mix(size, S12POD.size, glide);
  heading = mix(heading, 360, glide);
  return (
    <AbsoluteFill>
      <G3 f={f} />
      <PodAt f={f} x={x} y={y} size={size} heading={heading} seatFill={tw(f, R.seat[0], R.seat[1], 0, 1, EASE.expoOut)} bodyFlood={tw(f, R.flood[0], R.flood[1], 0, 1, EASE.expoOut)} />
      <div style={{ position: "absolute", left: (W - textWidth(s11.line, TYPE.word)) / 2, top: 1150 }}>
        <FillSweep f={f} at={R.line} text={s11.line} size={TYPE.word} />
      </div>
    </AbsoluteFill>
  );
};

/* ================================================================== S12 · Catch a call / nap / breath (780–870) */

const ROAD_X = S12POD.x;

/** Top-down city sliding past: ground layer (roads, parks) and a faster rooftop layer for parallax. */
const ScrollMap: React.FC<{ f: number }> = ({ f }) => {
  const t = (f - T.scenes.s12[0]) / 30;
  const yA = t * 420;
  const yB = t * 620;
  const CELL = 300;
  const rows = Math.ceil(H / CELL) + 2;
  const k0 = Math.floor(yA / CELL);
  const kb0 = Math.floor(yB / CELL);
  const vroads = [60, 300, ROAD_X, 780, 1020];
  return (
    <AbsoluteFill style={{ background: C.map.land, overflow: "hidden" }}>
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
        <path d={`M ${ROAD_X} -60 L ${ROAD_X} ${H + 60}`} stroke={C.map.casing} strokeWidth={4} strokeDasharray="34 46" strokeDashoffset={-(yA % 80)} />
      </svg>
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

const ROWS_Y = [1030, 1200, 1370];
const ICON = 110;
const ICON_X = SAFE.x0 + 10;
const TEXT_X = ICON_X + ICON + 40;

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
        if (f < at - SLICE_DUR) return null;
        const next = R.beats[i + 1];
        const back = next === undefined ? 0 : tw(f, next, next + 6, 0, 1, EASE.expoOut);
        const col = mixHex(C.ink, C.muted, back);
        const sc = mix(1, 0.85, back);
        return (
          <div key={i} style={{ position: "absolute", left: ICON_X, top: ROWS_Y[i] - ICON / 2, transform: `scale(${sc.toFixed(4)})`, transformOrigin: "0 50%" }}>
            <ScaleCut f={f} at={at} from={2} style={{ position: "absolute", left: 0, top: 0 }}>
              {icons[i](col)}
            </ScaleCut>
            <div style={{ position: "absolute", left: TEXT_X - ICON_X, top: ICON / 2 - (TYPE.step * 1.08) / 2 }}>
              <Slice f={f} lock={at} lines={[ln]} size={TYPE.step} color={col} />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ================================================================== S13 · "Pod Solo" (870–930) */

const CAR = { w: 860, srcW: 501, srcH: 332, contactY: 0.86 };
/** The road the car drives along: a ctaGreen line in perspective, from the bottom edge to a vanishing point. */
const C0 = { x: W / 2, y: 1190 }; // the car's contact point once settled (on the road)
const ROAD = { a: { x: C0.x + 340 * 2, y: C0.y + 350 * 2 }, v: { x: C0.x - 340, y: C0.y - 350 }, w0: 34, w1: 2 };

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
  const settle = tw(f, R.settle[0], R.settle[1], 0, 1, EASE.expoInOut);
  const pull = tw(f, R.pull[0], R.pull[1], 0, 1, EASE.quintIn); // speed ramp: starts slow, accelerates away
  const start = { x: S12POD.x, y: S12POD.y + 200 };
  const onRoad = { x: mix(C0.x, ROAD.v.x, 0.62 * pull), y: mix(C0.y, ROAD.v.y, 0.62 * pull) };
  const cx = mix(start.x, onRoad.x, settle);
  const cy = mix(start.y, onRoad.y, settle);
  const s = mix(mix(0.6, 1, settle), 0.4, pull);
  const h = CAR.srcH * (CAR.w / CAR.srcW);
  const o = tw(f, R.outline[0], R.outline[1], 0, 1, EASE.linear);
  const outline = placePath(POD_BODY, S12POD.x, S12POD.y, S12POD.size / POD_L, 0);
  const ev = evolvePath(Math.max(0.0001, 1 - o), outline);
  return (
    <AbsoluteFill>
      <G3 f={f} />
      <RoadLine t={tw(f, R.road[0], R.road[1], 0, 1, EASE.expoOut)} />
      <div style={{ position: "absolute", left: cx - CAR.w / 2, top: cy - h * CAR.contactY, width: CAR.w, height: h, transform: `scale(${s.toFixed(4)})`, transformOrigin: `50% ${CAR.contactY * 100}%` }}>
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
      <Slice f={f} lock={R.lineLock} lines={[s13.line]} size={TYPE.word} style={{ position: "absolute", left: (W - textWidth(s13.line, TYPE.word)) / 2, top: 300 }} />
    </AbsoluteFill>
  );
};

/* ================================================================== S14 · end card (930–990) */

/**
 * Solid night, everything flat ctaGreen: S mark (200px, centred at y≈720) with "Shuttlers" set in
 * Google Sans 700 under it, "Pod Now" (160px, maskRise f940), then Safe · Set · Smooth as a spaced
 * 56px row slicing in one per half-beat. The whole lockup pushes in 2% over f930–990.
 */
const END = { markH: 200, markCy: 720, logo: 64, line: 1000, tags: 1220, tagSize: 56, tagGap: 64 };

export const S14: React.FC = () => {
  const f = useCurrentFrame();
  const R = T.s14;
  const push = 1 + 0.02 * tw(f, R.push[0], R.push[1], 0, 1, EASE.linear);
  const tagW = s14.tags.map((t) => textWidth(t, END.tagSize));
  const total = tagW.reduce((a, b) => a + b, 0) + END.tagGap * (s14.tags.length - 1);
  let x = (W - total) / 2;
  const markW = END.markH * (1212 / 1532);
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(4)})`, transformOrigin: "50% 50%" }}>
        <ScaleCut f={f} at={R.mark} style={{ position: "absolute", left: W / 2 - markW / 2, top: END.markCy - END.markH / 2 }}>
          <SMark size={END.markH} color={C.ctaGreen} />
        </ScaleCut>
        <div style={{ position: "absolute", left: 0, width: W, top: END.markCy + END.markH / 2 + 18, textAlign: "center", ...typeStyle({ size: END.logo, color: C.ctaGreen, lh: 1.1 }) }}>{s14.logo}</div>
        <MaskRise f={f} at={R.line} lines={[s14.line]} size={TYPE.hero} color={C.ctaGreen} align="center" style={{ position: "absolute", left: 0, width: W, top: END.line }} />
        {s14.tags.map((t, i) => {
          const el = <Slice key={t} f={f} lock={R.tagLocks[i]} lines={[t]} size={END.tagSize} color={C.ctaGreen} style={{ position: "absolute", left: x, top: END.tags }} />;
          x += tagW[i] + END.tagGap;
          return el;
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

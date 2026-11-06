import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { evolvePath } from "@remotion/paths";
import { C, EASE, H, T, TYPE, W } from "../config/brand";
import { s10, s11, s12, s13, s14, s9 } from "../config/content";
import { G1, G2, G3, Texture } from "../config/gradients";
import { Asset } from "../../components/core";
import { SMark } from "../../edu/kit";
import { Breath, EYE_PATH, Eye, Handset, Pin, SleepFace } from "../components/Icons";
import { clamp, mix, mixHex, tw } from "../components/motion";
import { POD_BODY, POD_L, PodAt } from "../components/Pod";
import { growScale, placePath } from "../components/transitions";
import { FillSweep, MaskRise, ScaleCut, Slice, textWidth, wrapLines } from "../components/type";

/* ================================================================== S9 · "Blink." (510–570) */

export const EYE = { x: 960, y: 330, size: 170 };
export const eyeMaskPath = (f: number) => {
  const [a, b] = T.transitions.maskGrowEye;
  const s0 = EYE.size / 24;
  const s = growScale(f, a, b, s0, 340);
  return placePath(placePath(EYE_PATH, -12, -12, 1), EYE.x, EYE.y, s);
};

export const S9: React.FC = () => {
  const f = useCurrentFrame();
  const B = T.s9.blink;
  const mid = (B[0] + B[1]) / 2;
  const lid = f < mid ? tw(f, B[0], mid, 0, 1, EASE.expoInOut) : tw(f, mid, B[1], 1, 0, EASE.expoInOut);
  const grow = 1 + 0.05 * ((f - T.scenes.s9[0]) / 30);
  return (
    <AbsoluteFill>
      <G3 f={f} />
      <div style={{ position: "absolute", left: EYE.x - EYE.size / 2, top: EYE.y - EYE.size / 2 }}>
        <Eye size={EYE.size} lid={lid} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 470, width: W, textAlign: "center", transform: `scale(${grow.toFixed(4)})`, transformOrigin: "50% 50%" }}>
        <div style={{ fontFamily: "Google Sans", fontSize: TYPE.hero, fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, lineHeight: 1.08 }}>{s9.line}</div>
      </div>
    </AbsoluteFill>
  );
};

/** f540–570: inside the eye there is only black; one beat of pure black keeps a 1px grain flicker. */
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

export const PARK = { x: 960, y: 700, size: 250, heading: 90 };

type Seg = { x1: number; y1: number; x2: number; y2: number; w: number };
const CITY: Seg[] = (() => {
  const out: Seg[] = [];
  const P = PARK;
  const hs = [-470, -330, -175, 0, 150, 300, 430];
  const vs = [-900, -650, -420, -230, 0, 240, 470, 700, 920];
  hs.forEach((dy, i) => out.push({ x1: -50, y1: P.y + dy + (random(`ch${i}`) - 0.5) * 24, x2: W + 50, y2: P.y + dy + (random(`ch2${i}`) - 0.5) * 60, w: dy === 0 ? 3 : 1.5 }));
  vs.forEach((dx, i) => out.push({ x1: P.x + dx + (random(`cv${i}`) - 0.5) * 30, y1: -50, x2: P.x + dx + (random(`cv2${i}`) - 0.5) * 90, y2: H + 50, w: dx === 0 || dx === 470 ? 3 : 1.5 }));
  out.push({ x1: -50, y1: 980, x2: W + 50, y2: 120, w: 4 }); // expressway
  return out;
})();

/** Fine white road lines over G1, each drawn outward from the point nearest the pin. */
const CityLines: React.FC<{ f: number }> = ({ f }) => {
  const [a, b] = T.s10.roads;
  const P = { x: PARK.x, y: PARK.y };
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      {CITY.flatMap((s, i) => {
        const dx = s.x2 - s.x1;
        const dy = s.y2 - s.y1;
        const t = clamp(((P.x - s.x1) * dx + (P.y - s.y1) * dy) / (dx * dx + dy * dy));
        const nx = s.x1 + dx * t;
        const ny = s.y1 + dy * t;
        const dist = Math.hypot(nx - P.x, ny - P.y);
        const delay = (dist / 1100) * (b - a) * 0.5;
        const p = tw(f, a + delay, a + delay + (b - a) * 0.5, 0, 1, EASE.expoOut);
        if (p <= 0) return [];
        return [
          [nx, ny, s.x1, s.y1],
          [nx, ny, s.x2, s.y2],
        ].map(([x0, y0, x1, y1], j) => {
          const d = `M ${x0.toFixed(1)} ${y0.toFixed(1)} L ${x1.toFixed(1)} ${y1.toFixed(1)}`;
          const ev = evolvePath(Math.max(0.0001, p), d);
          return <path key={`${i}-${j}`} d={d} stroke={s.w > 2 ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.3)"} strokeWidth={s.w} strokeLinecap="round" fill="none" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />;
        });
      })}
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
        <CityLines f={f} />
        <div style={{ position: "absolute", left: PARK.x - 45, top: PARK.y - 150 }}>
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
      <div style={{ position: "absolute", left: (W - textWidth(s11.line, TYPE.title)) / 2, top: 780 }}>
        <FillSweep f={f} at={R.line} text={s11.line} size={TYPE.title} />
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
        if (f < at) return null;
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
              <Slice f={f} at={at} lines={[ln]} size={TYPE.step} color={col} dist={380} />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const S12_POD = S12POD;

/* ================================================================== S13 · "Pod Solo." (780–840) */

const CAR = { w: 660, srcW: 501, srcH: 332 };

export const S13: React.FC = () => {
  const f = useCurrentFrame();
  const R = T.s13;
  const settle = tw(f, R.settle[0], R.settle[1], 0, 1, EASE.expoInOut); // sits on the Pod's spot at the cut, then moves
  const pull = tw(f, R.pull[0], R.pull[1], 0, 1, EASE.quintIn);
  const cx = mix(S12POD.x, 960, settle);
  const cy = mix(S12POD.y, 470, settle) - 80 * pull;
  const s = mix(mix(0.78, 1, settle), 0.5, pull);
  const k = CAR.w / CAR.srcW;
  const h = CAR.srcH * k;
  // the Pod outline from S12 erases off the car on the cut
  const o = tw(f, R.outline[0], R.outline[1], 0, 1, EASE.linear);
  const outline = placePath(POD_BODY, S12POD.x, S12POD.y, S12POD.size / POD_L, 0);
  const ev = evolvePath(Math.max(0.0001, 1 - o), outline);
  return (
    <AbsoluteFill>
      <G3 f={f} />
      <div style={{ position: "absolute", left: cx - CAR.w / 2, top: cy - h / 2, width: CAR.w, height: h, transform: `scale(${s.toFixed(4)})`, transformOrigin: "50% 80%" }}>
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
      <Slice f={f} at={R.line} lines={[s13.line]} size={TYPE.title} style={{ position: "absolute", left: (W - textWidth(s13.line, TYPE.title)) / 2, top: 790 }} />
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
          const el = <Slice key={t} f={f} at={R.tags[i]} lines={[t]} size={tagSize} dur={6} dist={300} style={{ position: "absolute", left: x, top: 660 }} />;
          x += tagW[i] + gap;
          return el;
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

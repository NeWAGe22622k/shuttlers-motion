import React from "react";
import { random, staticFile } from "remotion";
import { EASE } from "../config/brand";
import { mix, tw } from "../components/motion";
import { POPPINS } from "./theme";

/* All art is vector, in exactly two colours per frame: fg (the accent) and bg. */

type C = { fg: string; bg: string };

/* ------------------------------------------------------------------ S badge (mask of the white S mark, tinted) */
const SBadge: React.FC<C & { id: string; cx: number; cy: number; r: number }> = ({ id, cx, cy, r, fg, bg }) => (
  <g>
    <defs>
      <mask id={`sm-${id}`}>
        <image href={staticFile("brand/shuttlers-mark-white.svg")} x={cx - r * 0.55} y={cy - r * 0.7} width={r * 1.1} height={r * 1.4} preserveAspectRatio="xMidYMid meet" />
      </mask>
    </defs>
    <circle cx={cx} cy={cy} r={r} fill={bg} />
    <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={fg} mask={`url(#sm-${id})`} />
  </g>
);

/* ------------------------------------------------------------------ Pod, side view (facing right) */
export const PodSide: React.FC<
  C & { id: string; width: number; lights?: number; door?: number; wheel?: number; badge?: boolean; seatGlow?: number; style?: React.CSSProperties }
> = ({ id, width, fg, bg, lights = 0, door = 0, wheel = 0, badge = true, seatGlow = 0, style }) => {
  const BODY =
    "M40 172 L36 128 C40 96 56 78 76 70 C96 60 116 54 140 52 L300 48 C330 48 352 62 372 84 C384 96 396 104 412 106 L468 110 C488 112 500 124 504 146 L500 170 L442 172 A42 42 0 0 0 358 172 L172 172 A42 42 0 0 0 88 172 Z";
  const GLASS = "M96 118 C102 90 118 72 150 66 L296 62 C328 64 350 86 366 116 Z";
  const hinge = 232;
  const sx = mix(1, 0.28, door);
  return (
    <svg width={width} height={(width * 230) / 520} viewBox="0 0 520 230" style={{ overflow: "visible", display: "block", ...style }}>
      {/* headlight beam */}
      {lights > 0 ? (
        <>
          <defs>
            <linearGradient id={`beam-${id}`} x1="0" x2="1">
              <stop offset="0" stopColor={fg} stopOpacity={0.35 * lights} />
              <stop offset="1" stopColor={fg} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d="M498 120 L760 70 L760 196 L498 136 Z" fill={`url(#beam-${id})`} />
        </>
      ) : null}
      <path d={BODY} fill={fg} />
      <path d={GLASS} fill={bg} />
      <rect x={226} y={60} width={10} height={60} fill={fg} />
      {/* door opening (revealed as the rear door swings out) */}
      {door > 0.01 ? (
        <g opacity={Math.min(1, door * 2)}>
          <path d="M140 66 L232 62 L232 170 L146 170 L138 120 Z" fill={bg} />
          <path d="M166 104 C166 92 176 86 186 86 L198 86 C206 86 212 92 212 100 L212 150 L170 150 Z" fill={fg} opacity={0.85} />
          {seatGlow > 0 ? <path d="M166 104 C166 92 176 86 186 86 L198 86 C206 86 212 92 212 100 L212 150 L170 150 Z" fill="none" stroke={fg} strokeWidth={6} opacity={seatGlow} /> : null}
        </g>
      ) : null}
      {/* rear door (hinged at its front edge, swings toward camera) */}
      <g transform={`translate(${hinge} 0) scale(${sx} 1) skewY(${-7 * door}) translate(${-hinge} 0)`}>
        <path d="M140 66 L232 62 L232 170 L146 170 L138 120 Z" fill={fg} stroke={bg} strokeWidth={door > 0.01 ? 3 : 0} />
        <path d="M146 116 C150 92 160 76 176 72 L226 70 L226 116 Z" fill={bg} />
        <rect x={150} y={128} width={22} height={6} rx={3} fill={bg} />
      </g>
      {/* door seams */}
      <path d="M340 66 L344 170" stroke={bg} strokeWidth={3} />
      {door < 0.01 ? <path d="M232 62 L232 170" stroke={bg} strokeWidth={3} /> : null}
      <rect x={252} y={128} width={22} height={6} rx={3} fill={bg} />
      {/* lights */}
      <path d="M472 118 C484 118 494 122 498 132 L476 134 Z" fill={bg} />
      {lights > 0 ? <circle cx={488} cy={127} r={10 + 6 * lights} fill={fg} opacity={0.0} /> : null}
      <rect x={38} y={112} width={10} height={20} rx={4} fill={bg} />
      {badge ? <SBadge id={id} cx={300} cy={136} r={17} fg={fg} bg={bg} /> : null}
      {/* wheels */}
      {[130, 400].map((cx) => (
        <g key={cx} transform={`rotate(${wheel} ${cx} 176)`}>
          <circle cx={cx} cy={176} r={34} fill={fg} stroke={bg} strokeWidth={5} />
          <circle cx={cx} cy={176} r={19} fill={bg} />
          {[0, 72, 144, 216, 288].map((a) => (
            <rect key={a} x={cx - 2.5} y={176 - 18} width={5} height={14} fill={fg} transform={`rotate(${a} ${cx} 176)`} />
          ))}
          <circle cx={cx} cy={176} r={6} fill={fg} />
        </g>
      ))}
    </svg>
  );
};

/* ------------------------------------------------------------------ Seat map, top-down (Pilot + 3 passenger seats) */
export const SEATS = [
  { x: 172, y: 168 }, // front passenger
  { x: 80, y: 312 }, // rear left
  { x: 172, y: 312 }, // rear right
];
export const SeatMap: React.FC<
  C & {
    width: number;
    stretch?: number; // 0: body hugs the solo seat → 1: full car
    solo?: number; // index of the lit seat (Pod Solo)
    lit?: number[]; // 0..1 fill per passenger seat
    outline?: number; // opacity of the empty seat outlines
    glow?: number;
    style?: React.CSSProperties;
  }
> = ({ width, fg, bg, stretch = 1, solo, lit = [0, 0, 0], outline = 1, glow = 0, style }) => {
  const focus = solo !== undefined ? SEATS[solo] : { x: 126, y: 240 };
  const s = mix(0.42, 1, stretch);
  const cx = mix(focus.x + 24, 150, stretch);
  const cy = mix(focus.y + 34, 260, stretch);
  return (
    <svg width={width} height={(width * 520) / 300} viewBox="0 0 300 520" style={{ overflow: "visible", display: "block", ...style }}>
      <g transform={`translate(${cx} ${cy}) scale(${s}) translate(-150 -260)`}>
        <rect x={30} y={20} width={240} height={480} rx={96} fill="none" stroke={fg} strokeWidth={10 / s} />
        <path d="M66 120 Q150 84 234 120" fill="none" stroke={fg} strokeWidth={8 / s} />
        <path d="M76 430 Q150 452 224 430" fill="none" stroke={fg} strokeWidth={6 / s} />
        {[
          [22, 100],
          [264, 100],
          [22, 380],
          [264, 380],
        ].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width={14} height={60} rx={6} fill={fg} opacity={stretch} />
        ))}
      </g>
      {/* Pilot seat with wheel */}
      <g opacity={stretch}>
        <rect x={80} y={168} width={48} height={68} rx={14} fill="none" stroke={fg} strokeWidth={6} opacity={outline} />
        <circle cx={104} cy={146} r={16} fill="none" stroke={fg} strokeWidth={5} opacity={outline} />
      </g>
      {SEATS.map((p, i) => {
        const on = Math.max(lit[i] ?? 0, solo === i ? 1 : 0);
        const vis = solo === i ? 1 : stretch;
        return (
          <g key={i} opacity={vis}>
            <rect x={p.x} y={p.y} width={48} height={68} rx={14} fill={fg} opacity={on} style={on > 0.5 && glow > 0 ? { filter: `drop-shadow(0 0 ${14 * glow}px ${fg})` } : undefined} />
            <rect x={p.x} y={p.y} width={48} height={68} rx={14} fill="none" stroke={fg} strokeWidth={6} opacity={Math.max(outline, on)} />
          </g>
        );
      })}
    </svg>
  );
};

/* ------------------------------------------------------------------ Fare tag (₦), splittable into N slices */
export const FareTagSlice: React.FC<C & { width: number; i: number; n: number; style?: React.CSSProperties }> = ({ width, i, n, fg, bg, style }) => {
  const h = width * 0.56;
  const sw = width / n;
  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} style={{ position: "absolute", overflow: "visible", ...style }}>
      <defs>
        <clipPath id={`slice-${i}-${n}`}>
          <rect x={sw * i} y={-10} width={sw} height={h + 20} />
        </clipPath>
      </defs>
      <g clipPath={`url(#slice-${i}-${n})`}>
        <path d={`M${h * 0.32} 0 H${width - 14} Q${width} 0 ${width} 14 V${h - 14} Q${width} ${h} ${width - 14} ${h} H${h * 0.32} L0 ${h / 2} Z`} fill={fg} />
        <circle cx={h * 0.36} cy={h / 2} r={h * 0.09} fill={bg} />
        <text x={width * 0.62} y={h * 0.72} textAnchor="middle" fontFamily={POPPINS} fontWeight={800} fontSize={h * 0.62} fill={bg}>
          ₦
        </text>
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------------ Map pin */
export const Pin: React.FC<C & { size: number; style?: React.CSSProperties }> = ({ size, fg, bg, style }) => (
  <svg width={size} height={size * 1.32} viewBox="0 0 100 132" style={{ overflow: "visible", display: "block", ...style }}>
    <path d="M50 128 C50 128 8 78 8 46 A42 42 0 0 1 92 46 C92 78 50 128 50 128 Z" fill={fg} />
    <circle cx={50} cy={46} r={16} fill={bg} />
  </svg>
);

/* ------------------------------------------------------------------ Lagos street texture + racing route */
export const ROUTE_MAIN = "M150 760 C 220 700 260 640 330 600 S 470 520 520 430";
export const ROUTE_BRANCHES = ["M520 430 C 600 360 690 320 790 210", "M520 430 C 620 450 720 520 820 600", "M520 430 C 500 330 470 250 420 150"];
export const BRANCH_ENDS = [
  { x: 790, y: 210 },
  { x: 820, y: 600 },
  { x: 420, y: 150 },
];
const STREETS = (() => {
  const out: string[] = [];
  for (let i = 0; i < 16; i++) {
    const x = 20 + i * 58 + (random(`sx${i}`) - 0.5) * 20;
    out.push(`M${x} -20 L${x + (random(`sk${i}`) - 0.5) * 80} 920`);
  }
  for (let j = 0; j < 14; j++) {
    const y = 30 + j * 64 + (random(`sy${j}`) - 0.5) * 20;
    out.push(`M-20 ${y} L920 ${y + (random(`sl${j}`) - 0.5) * 70}`);
  }
  return out;
})();
export const MapRace: React.FC<C & { size: number; grid: number; main: number; branches: number[]; style?: React.CSSProperties }> = ({ size, fg, grid, main, branches, style }) => (
  <svg width={size} height={size} viewBox="0 0 900 900" style={{ overflow: "visible", display: "block", ...style }}>
    <g opacity={0.2 * grid} stroke={fg} strokeWidth={2} fill="none">
      {STREETS.map((d, i) => (
        <path key={i} d={d} />
      ))}
      <path d="M-20 820 C 200 790 300 860 520 830 S 820 760 920 800" strokeWidth={5} />
      <path d="M-20 300 C 160 340 320 240 520 280 S 760 360 920 300" strokeWidth={8} opacity={0.6} />
    </g>
    <path d={ROUTE_MAIN} fill="none" stroke={fg} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - main} style={{ filter: `drop-shadow(0 0 10px ${fg})` }} />
    {ROUTE_BRANCHES.map((d, i) => (
      <path key={i} d={d} fill="none" stroke={fg} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - (branches[i] ?? 0)} />
    ))}
  </svg>
);

/* ------------------------------------------------------------------ Clock that spins and snaps to now */
export const Clock: React.FC<C & { size: number; hour: number; minute: number; style?: React.CSSProperties }> = ({ size, fg, bg, hour, minute, style }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{ display: "block", ...style }}>
    <circle cx={100} cy={100} r={90} fill={fg} />
    <circle cx={100} cy={100} r={80} fill={bg} />
    {Array.from({ length: 12 }, (_, i) => (
      <rect key={i} x={97} y={26} width={6} height={i % 3 === 0 ? 18 : 10} fill={fg} transform={`rotate(${i * 30} 100 100)`} />
    ))}
    <rect x={95} y={52} width={10} height={52} rx={5} fill={fg} transform={`rotate(${hour} 100 100)`} />
    <rect x={97} y={34} width={6} height={70} rx={3} fill={fg} transform={`rotate(${minute} 100 100)`} />
    <circle cx={100} cy={100} r={9} fill={fg} />
  </svg>
);

/* ------------------------------------------------------------------ Calendar card with a page flip */
export const Calendar: React.FC<C & { width: number; flip: number; top: string[]; body: string[]; style?: React.CSSProperties }> = ({ width, fg, bg, flip, top, body, style }) => {
  const h = width * 1.05;
  const page = (i: number) => (
    <div style={{ position: "absolute", inset: 0, borderRadius: width * 0.08, background: fg, overflow: "hidden" }}>
      <div style={{ height: h * 0.26, background: fg, borderBottom: `${width * 0.02}px solid ${bg}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: POPPINS, fontWeight: 800, fontSize: width * 0.12, color: bg, letterSpacing: 2 }}>{top[i]}</div>
      <div style={{ height: h * 0.74, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: POPPINS, fontWeight: 800, fontSize: width * 0.2, color: bg, letterSpacing: -2, textAlign: "center", lineHeight: 1 }}>{body[i]}</div>
    </div>
  );
  return (
    <div style={{ position: "relative", width, height: h, perspective: 1600, ...style }}>
      {/* rings */}
      {[0.28, 0.72].map((x) => (
        <div key={x} style={{ position: "absolute", left: width * x - 10, top: -26, width: 20, height: 52, borderRadius: 10, background: fg, zIndex: 5, border: `5px solid ${bg}` }} />
      ))}
      {page(1)}
      {flip < 1 ? (
        <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 0%", transform: `rotateX(${-flip * 100}deg)`, backfaceVisibility: "hidden", opacity: flip > 0.9 ? 0 : 1 }}>{page(0)}</div>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ Gate */
export const Gate: React.FC<C & { width: number; style?: React.CSSProperties }> = ({ width, fg, style }) => (
  <svg width={width} height={width * 0.9} viewBox="0 0 200 180" style={{ display: "block", ...style }}>
    <rect x={0} y={20} width={16} height={160} fill={fg} />
    <rect x={184} y={20} width={16} height={160} fill={fg} />
    {Array.from({ length: 7 }, (_, i) => (
      <rect key={i} x={28 + i * 22} y={50} width={8} height={130} fill={fg} />
    ))}
    <rect x={16} y={60} width={168} height={8} fill={fg} />
    <rect x={16} y={140} width={168} height={8} fill={fg} />
  </svg>
);

/* ------------------------------------------------------------------ Icons that orbit the steady fare card */
export const Rain: React.FC<C & { size: number; t: number }> = ({ size, fg, t }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", overflow: "visible" }}>
    <path d="M26 62 H74 A18 18 0 0 0 72 26 A26 26 0 0 0 24 34 A14 14 0 0 0 26 62 Z" fill={fg} />
    {[34, 52, 70].map((x, i) => {
      const y = 70 + (((t * 3 + i * 9) % 26) as number);
      return <rect key={x} x={x - 3} y={y} width={6} height={12} rx={3} fill={fg} />;
    })}
  </svg>
);
export const Traffic: React.FC<C & { size: number }> = ({ size, fg, bg }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
    <rect x={32} y={6} width={36} height={88} rx={14} fill={fg} />
    {[24, 50, 76].map((y) => (
      <circle key={y} cx={50} cy={y} r={10} fill={bg} />
    ))}
  </svg>
);

/* ------------------------------------------------------------------ AC vent + cold air ripples */
export const Vent: React.FC<C & { width: number; t: number; style?: React.CSSProperties }> = ({ width, fg, t, style }) => (
  <svg width={width} height={width * 0.9} viewBox="0 0 300 270" style={{ display: "block", overflow: "visible", ...style }}>
    <rect x={20} y={20} width={260} height={120} rx={28} fill="none" stroke={fg} strokeWidth={10} />
    {[50, 80, 110].map((y) => (
      <rect key={y} x={44} y={y - 4} width={212} height={8} rx={4} fill={fg} />
    ))}
    {[0, 1, 2, 3].map((i) => {
      const p = ((t / 22 + i / 4) % 1 + 1) % 1;
      const y = 160 + p * 110;
      return (
        <path
          key={i}
          d={`M${60 - p * 30} ${y} q 30 -14 60 0 t 60 0 t 60 0 t 60 0`}
          fill="none"
          stroke={fg}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={(1 - p) * 0.9}
          transform={`translate(${-p * 10} 0) scale(${1 + p * 0.25} 1)`}
          style={{ transformOrigin: "150px 0px" }}
        />
      );
    })}
  </svg>
);

/** Frost: seeded ice-crystal branches growing in from the frame edges (p 0..1). */
export const Frost: React.FC<{ W: number; H: number; color: string; p: number }> = ({ W, H, color, p }) => {
  const branches: { d: string; delay: number }[] = [];
  const seeds = 22;
  for (let i = 0; i < seeds; i++) {
    const side = i % 4;
    const u = random(`fr${i}`);
    const [x0, y0, ang] = side === 0 ? [u * W, 0, 90] : side === 1 ? [W, u * H, 180] : side === 2 ? [u * W, H, 270] : [0, u * H, 0];
    const len = 120 + random(`fl${i}`) * 220;
    const a = ((ang + (random(`fa${i}`) - 0.5) * 50) * Math.PI) / 180;
    const x1 = x0 + Math.cos(a) * len;
    const y1 = y0 + Math.sin(a) * len;
    let d = `M${x0.toFixed(0)} ${y0.toFixed(0)} L${x1.toFixed(0)} ${y1.toFixed(0)}`;
    for (let k = 1; k <= 3; k++) {
      const bx = x0 + Math.cos(a) * len * (k / 4);
      const by = y0 + Math.sin(a) * len * (k / 4);
      const bl = len * 0.28 * (1 - k / 5);
      for (const s of [-1, 1]) {
        const b = a + (s * 55 * Math.PI) / 180;
        d += ` M${bx.toFixed(0)} ${by.toFixed(0)} L${(bx + Math.cos(b) * bl).toFixed(0)} ${(by + Math.sin(b) * bl).toFixed(0)}`;
      }
    }
    branches.push({ d, delay: random(`fd${i}`) * 0.4 });
  }
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {branches.map((b, i) => {
        const q = Math.max(0, Math.min(1, (p - b.delay) / 0.6));
        return <path key={i} d={b.d} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" opacity={0.55} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - q} />;
      })}
    </svg>
  );
};

/* ------------------------------------------------------------------ Rear-view mirror with the Pilot (flat, illustrated, not a real person) */
export const MirrorPilot: React.FC<C & { width: number; nod: number; style?: React.CSSProperties }> = ({ width, fg, bg, nod, style }) => (
  <svg width={width} height={width * 0.46} viewBox="0 0 500 230" style={{ display: "block", overflow: "visible", ...style }}>
    <rect x={238} y={-60} width={24} height={70} fill={fg} />
    <rect x={10} y={10} width={480} height={210} rx={70} fill={fg} />
    <rect x={26} y={26} width={448} height={178} rx={56} fill={bg} />
    <clipPath id="mirror-clip">
      <rect x={26} y={26} width={448} height={178} rx={56} />
    </clipPath>
    <g clipPath="url(#mirror-clip)">
      {/* shoulders + head; the head tips down and back up for the nod */}
      <path d="M120 240 C130 180 190 160 250 160 C310 160 370 180 380 240 Z" fill={fg} />
      <g transform={`rotate(${nod * 9} 250 168) translate(0 ${nod * 6})`}>
        <rect x={232} y={130} width={36} height={40} fill={fg} />
        <ellipse cx={250} cy={104} rx={52} ry={60} fill={fg} />
        {/* cap */}
        <path d="M196 92 C198 52 226 38 252 38 C280 38 306 54 306 92 Z" fill={fg} />
        <rect x={190} y={86} width={124} height={12} rx={6} fill={bg} opacity={0.35} />
        {/* sunglasses */}
        <rect x={208} y={100} width={38} height={22} rx={8} fill={bg} />
        <rect x={254} y={100} width={38} height={22} rx={8} fill={bg} />
        <rect x={244} y={106} width={12} height={5} fill={bg} />
        {/* smile */}
        <path d="M232 140 Q250 152 268 140" fill="none" stroke={bg} strokeWidth={5} strokeLinecap="round" />
      </g>
    </g>
  </svg>
);

/* ------------------------------------------------------------------ Speed streaks behind a launching Pod */
export const Streaks: React.FC<{ color: string; p: number; width: number; height: number }> = ({ color, p, width, height }) => (
  <svg width={width} height={height} style={{ position: "absolute", overflow: "visible" }}>
    {Array.from({ length: 9 }, (_, i) => {
      const y = (i / 8) * height;
      const len = width * (0.3 + random(`st${i}`) * 0.6) * p;
      return <rect key={i} x={-len * (0.4 + random(`so${i}`) * 0.4)} y={y} width={len} height={6} rx={3} fill={color} opacity={0.5 * p} />;
    })}
  </svg>
);

export const ease = EASE;
export { tw };

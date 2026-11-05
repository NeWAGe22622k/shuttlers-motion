import React from "react";
import { evolvePath } from "@remotion/paths";
import { random } from "remotion";
import { C } from "../config/brand";

// Party popper rebuilt as SVG (from 10-pod-booked.png) in the confetti palette. App points.
const RIBBONS = [
  { d: "M30 330 C 10 260 40 190 84 128", color: "#FFA9EB", w: 20 },
  { d: "M150 330 C 120 290 170 250 210 262 C 250 274 236 320 270 306 C 300 294 300 250 342 268", color: "#79EDB1", w: 15 },
  { d: "M150 330 C 180 300 200 248 236 246 C 262 244 262 290 296 286", color: "#20E682", w: 9 },
  { d: "M78 384 L 266 430", color: "#66D1FF", w: 19 },
];

export const PartyPopper: React.FC<{ p: number; pieces: number; shake?: number }> = ({ p, pieces, shake = 0 }) => (
  <svg width={393} height={500} viewBox="0 0 393 500" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    <defs>
      <linearGradient id="cone" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#20E682" />
        <stop offset="1" stopColor="#A6F5CD" />
      </linearGradient>
    </defs>
    {RIBBONS.map((r, i) => {
      const ev = evolvePath(Math.max(0.0001, Math.min(1, p * 1.15 - i * 0.05)), r.d);
      return <path key={i} d={r.d} fill="none" stroke={r.color} strokeWidth={r.w} strokeLinecap="butt" strokeLinejoin="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />;
    })}
    <g opacity={pieces} transform={`translate(0 ${(1 - pieces) * 20})`}>
      <path d="M166 128 L184 120 L176 156 L160 160 Z" fill="#FFDE3D" />
      <rect x="84" y="248" width="24" height="24" fill="#FF94E6" transform="rotate(18 96 260)" />
      <path d="M64 330 L80 318 L84 352 L68 362 Z" fill="#8E8EF1" />
      <rect x="266" y="346" width="25" height="25" fill="#FFDE3D" transform="rotate(8 278 358)" />
      <rect x="152" y="466" width="24" height="24" fill="#A6A6F5" transform="rotate(-10 164 478)" />
      <circle cx="248" cy="172" r="27" fill="#20E682" />
      <path d="M221 172 a27 27 0 0 0 54 0 Z" fill="#79EDB1" />
      <path d="M282 212 L287 228 L302 233 L287 238 L282 254 L277 238 L262 233 L277 228 Z" fill="#66D1FF" />
    </g>
    <g transform={`rotate(${shake} 30 420)`}>
      {/* cone body */}
      <path d="M-40 520 L -70 250 C -30 200 60 210 130 300 C 150 330 150 420 120 470 Z" fill="url(#cone)" />
      {/* mouth */}
      <ellipse cx="64" cy="330" rx="62" ry="150" transform="rotate(-26 64 330)" fill="#E6FFF2" />
      <ellipse cx="66" cy="332" rx="52" ry="138" transform="rotate(-26 66 332)" fill={C.popperCone} />
    </g>
  </svg>
);

/** Seeded confetti burst with gravity, drag and spin (closed-form). t = frames since fire. */
export const Confetti: React.FC<{ t: number; life: number; origin: [number, number]; count?: number; spread?: [number, number]; speed?: [number, number] }> = ({ t, life, origin, count = 90, spread = [-95, 15], speed = [9, 22] }) => {
  if (t < 0 || t > life) return null;
  const g = 0.55;
  const k = 0.07;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = ((spread[0] + random(`ca${i}`) * (spread[1] - spread[0])) * Math.PI) / 180;
        const v = speed[0] + random(`cv${i}`) * (speed[1] - speed[0]);
        const vx = Math.cos(a) * v;
        const vy = Math.sin(a) * v;
        const e = Math.exp(-k * t);
        const x = origin[0] + (vx / k) * (1 - e);
        const y = origin[1] + ((vy + g / k) / k) * (1 - e) - (g * t) / k;
        const rot = random(`cr${i}`) * 360 + t * (random(`cs${i}`) * 2 - 1) * 22;
        const col = C.confetti[Math.floor(random(`cc${i}`) * C.confetti.length)];
        const shape = random(`ct${i}`);
        const size = 6 + random(`cz${i}`) * 7;
        const fade = t > life - 12 ? (life - t) / 12 : 1;
        const flip = Math.abs(Math.cos((t + i) / 4));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: shape < 0.33 ? size * 0.5 : size,
              height: shape < 0.33 ? size * 1.8 : size,
              borderRadius: shape > 0.75 ? 99 : 1.5,
              background: col,
              opacity: fade,
              transform: `rotate(${rot}deg) scaleY(${0.35 + 0.65 * flip})`,
            }}
          />
        );
      })}
    </>
  );
};

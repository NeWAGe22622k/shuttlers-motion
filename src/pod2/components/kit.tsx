import React from "react";
import { random } from "remotion";
import { C, EASE, fontFamily } from "../config/brand";
import { clamp, mix, tw } from "./motion";

/* ------------------------------------------------------------------ rolling digits */

/**
 * Prices roll per digit: each digit column scrolls through 0–9 (hard clip, no fade) and locks,
 * right-most first. Non-digits are static. Hidden (blank columns) before `a`.
 */
export const RollText: React.FC<{ text: string; f: number; a: number; b: number; size: number; weight?: number; color?: string; style?: React.CSSProperties }> = ({ text, f, a, b, size, weight = 700, color = C.ink, style }) => {
  const chars = text.split("");
  const digits = chars.map((c, i) => ({ c, i })).filter((d) => /\d/.test(d.c));
  const n = digits.length;
  const lh = size * 1.2;
  return (
    <span style={{ display: "inline-flex", fontFamily, fontSize: size, fontWeight: weight, color, fontVariantNumeric: "tabular-nums", lineHeight: `${lh}px`, height: lh, overflow: "hidden", verticalAlign: "top", ...style }}>
      {chars.map((ch, i) => {
        if (!/\d/.test(ch)) return <span key={i}>{ch}</span>;
        const k = digits.findIndex((d) => d.i === i);
        const order = n - 1 - k; // right-most locks first
        const span = b - a;
        const end = a + span * (0.55 + 0.45 * (1 - order / Math.max(1, n - 1)));
        const p = tw(f, a, end, 0, 1, EASE.expoOut);
        const target = Number(ch);
        const spins = 2 + Math.floor(random(`roll${text}${i}`) * 2);
        const pos = mix(target + 10 * spins, target, p); // in digit units
        if (f < a) return <span key={i} style={{ display: "inline-block", width: "0.6em" }} />;
        return (
          <span key={i} style={{ display: "inline-block", position: "relative", width: "0.6em", height: lh, overflow: "hidden" }}>
            <span style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${(-(pos % 10) * lh).toFixed(2)}px)` }}>
              {Array.from({ length: 11 }, (_, j) => (
                <span key={j} style={{ display: "block", height: lh, textAlign: "center", width: "0.6em" }}>
                  {j % 10}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
};

/* ------------------------------------------------------------------ split-flap clock */

/**
 * A real split-flap card: two separate halves with a hinge gap between them and hinge pins at the
 * sides. On a flip the old digit's top leaf rotates down on rotateX about the hinge (quintIn), then
 * the new digit's bottom leaf lands (expoOut). The glyph is centred on the hinge, so the gap cuts it
 * the way a real flap display does. `p`: 0 → 1 over the whole flip (top leaf until `split`).
 */
export const FlapDigit: React.FC<{ from: string; to: string; p: number; split?: number; w: number; h: number; font: number; gap?: number }> = ({ from, to, p, split = 0.5, w, h, font, gap = 8 }) => {
  const top = clamp(p / split);
  const bot = clamp((p - split) / (1 - split));
  const topA = EASE.quintIn(top) * 90;
  const botA = (1 - EASE.expoOut(bot)) * 90;
  const half = (h - gap) / 2;
  const R = 22;
  const tile = "#17181E";
  const shade = (t: number) => {
    const v = Math.round(0x17 + (0x0a - 0x17) * clamp(t));
    return `rgb(${v},${v + 1},${v + 7})`;
  };
  const Half: React.FC<{ ch: string; part: "top" | "bottom"; bg?: string }> = ({ ch, part, bg = tile }) => (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: half, overflow: "hidden", background: bg, borderRadius: part === "top" ? `${R}px ${R}px 4px 4px` : `4px 4px ${R}px ${R}px` }}>
      <div style={{ position: "absolute", left: 0, top: part === "top" ? 0 : -(half + gap), width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", fontFamily, fontWeight: 700, fontSize: font, lineHeight: 1, color: C.white, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
        {ch}
      </div>
    </div>
  );
  const at = (y: number, children: React.ReactNode, style?: React.CSSProperties) => <div style={{ position: "absolute", left: 0, top: y, width: w, height: half, ...style }}>{children}</div>;
  return (
    <div style={{ position: "relative", width: w, height: h, perspective: 1600 }}>
      {/* static halves: the new top sits behind the falling leaf; the old bottom stays until the new leaf lands */}
      {at(0, <Half ch={p > 0 ? to : from} part="top" />)}
      {at(half + gap, <Half ch={bot >= 1 ? to : from} part="bottom" />)}
      {p > 0 && top < 1 ? at(0, <Half ch={from} part="top" bg={shade(top)} />, { transformOrigin: `50% ${half + gap / 2}px`, transform: `rotateX(${(-topA).toFixed(2)}deg)`, backfaceVisibility: "hidden" }) : null}
      {top >= 1 && bot < 1 ? at(half + gap, <Half ch={to} part="bottom" bg={shade(1 - bot)} />, { transformOrigin: `50% ${-gap / 2}px`, transform: `rotateX(${botA.toFixed(2)}deg)` }) : null}
      {/* hinge pins */}
      {[-6, w - 6].map((x) => (
        <div key={x} style={{ position: "absolute", left: x, top: half + gap / 2 - 14, width: 12, height: 28, borderRadius: 4, background: "#2A2C34" }} />
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ generic keyboard (designed) */

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
export const KB_H = 300;
const keyPos = (ch: string) => {
  for (let r = 0; r < 3; r++) {
    const i = ROWS[r].indexOf(ch);
    if (i >= 0) {
      const n = ROWS[r].length;
      const total = n * 33 + (n - 1) * 6;
      return { x: (393 - total) / 2 + i * 39, y: 12 + r * 56 };
    }
  }
  return null;
};

/** Generic keyboard, no platform marks. `pressed` key shows a hard-edged preview while held. */
export const Keyboard: React.FC<{ pressed?: string | null }> = ({ pressed }) => {
  const key: React.CSSProperties = { position: "absolute", width: 33, height: 44, borderRadius: 7, background: "#FCFCFD", boxShadow: "0 1px 0 rgba(16,17,17,.22)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily, fontSize: 21, color: C.ink };
  const grey: React.CSSProperties = { ...key, background: "#B9BCC3" };
  const pk = pressed ? keyPos(pressed) : null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 393, height: KB_H, background: "#D9DBDF" }}>
      {ROWS.join("")
        .split("")
        .map((ch) => {
          const p = keyPos(ch)!;
          return (
            <div key={ch} style={{ ...key, left: p.x, top: p.y, background: pressed === ch ? "#E4E5E8" : "#FCFCFD" }}>
              {ch}
            </div>
          );
        })}
      <div style={{ ...grey, left: 8, top: 124, width: 44 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="1.7" strokeLinejoin="round">
          <path d="M12 4l8 8h-4.5v7h-7v-7H4z" />
        </svg>
      </div>
      <div style={{ ...grey, left: 341, top: 124, width: 44 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round">
          <path d="M9 5h11v14H9l-6-7z" />
          <path d="M12 9.5l5 5M17 9.5l-5 5" />
        </svg>
      </div>
      <div style={{ ...grey, left: 8, top: 180, width: 88, fontSize: 16 }}>123</div>
      <div style={{ ...key, left: 102, top: 180, width: 188 }} />
      <div style={{ ...key, left: 296, top: 180, width: 89, background: C.ink }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4 4" />
        </svg>
      </div>
      {pk ? (
        <div style={{ position: "absolute", left: pk.x - 9, top: pk.y - 58, width: 51, height: 102, borderRadius: 10, background: "#FCFCFD", boxShadow: "0 0 0 1px rgba(16,17,17,.12)", fontFamily, fontSize: 34, color: C.ink, display: "flex", justifyContent: "center", paddingTop: 6, boxSizing: "border-box" }}>
          {pressed}
        </div>
      ) : null}
    </div>
  );
};

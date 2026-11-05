import React from "react";
import { EASE } from "../../config/brand";
import { mix, sp, tw } from "../../components/motion";
import { POPPINS } from "../theme";

export type Seg = { t: string; b?: boolean };
export type Mode = "mask" | "slam" | "pop" | "drop" | "none";

const wordTimes = (lines: Seg[][], at: number | number[], stagger: number) => {
  const out: number[] = [];
  let i = 0;
  for (const line of lines) for (const seg of line) for (const _w of seg.t.split(" ")) out.push(Array.isArray(at) ? at[Math.min(i++, at.length - 1)] : at + i++ * stagger);
  return out;
};

/**
 * Kinetic type. mask: words rise out of a baseline mask with a slight swing (the house reveal);
 * slam: words crash in from 2.6x with blur; pop: overshoot spring; drop: fall in with vertical blur.
 * Exits leave upward through the same mask, a frame apart.
 */
export const Words: React.FC<{
  f: number;
  lines: Seg[][];
  at: number | number[];
  stagger?: number;
  size: number;
  color: string;
  mode?: Mode;
  outAt?: number | null;
  align?: "left" | "center";
  lh?: number;
  weights?: [number, number];
  tracking?: number;
  style?: React.CSSProperties;
  wordStyle?: (i: number, word: string) => React.CSSProperties;
}> = ({ f, lines, at, stagger = 2, size, color, mode = "mask", outAt = null, align = "left", lh = 1.04, weights = [500, 800], tracking, style, wordStyle }) => {
  const times = wordTimes(lines, at, stagger);
  let wi = 0;
  const ls = tracking ?? (size >= 110 ? -0.045 : -0.025);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start", ...style }}>
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", flexWrap: "nowrap", justifyContent: align === "center" ? "center" : "flex-start", columnGap: size * 0.24, fontFamily: POPPINS, fontSize: size, lineHeight: lh, letterSpacing: `${ls}em`, color, whiteSpace: "nowrap" }}>
          {line.flatMap((seg) =>
            seg.t.split(" ").map((w) => {
              const i = wi++;
              const t0 = times[i];
              const q = outAt === null ? 0 : tw(f, outAt + i, outAt + i + 6, 0, 1, EASE.in);
              const weight = seg.b ? weights[1] : weights[0];
              const extra = wordStyle ? wordStyle(i, w) : {};
              if (mode === "mask") {
                const k = tw(f, t0, t0 + 11, 0, 1, EASE.out);
                return (
                  <span key={i} style={{ display: "inline-block", overflow: "hidden", padding: "0.08em 0.05em 0.2em", margin: "-0.08em -0.05em -0.2em", verticalAlign: "top" }}>
                    <span style={{ display: "inline-block", fontWeight: weight, transform: `translateY(${(1 - k) * 118 - q * 118}%) rotate(${(1 - k) * 8}deg)`, transformOrigin: "0% 100%", visibility: f < t0 ? "hidden" : undefined, ...extra }}>{w}</span>
                  </span>
                );
              }
              let st: React.CSSProperties = {};
              if (mode === "slam") {
                const k = sp(f, t0, { damping: 15, stiffness: 280 });
                const b = 16 * (1 - tw(f, t0, t0 + 5));
                st = { opacity: tw(f, t0, t0 + 2), transform: `scale(${f < t0 ? 0 : mix(2.6, 1, k)})`, filter: f >= t0 && b > 0.3 ? `blur(${b.toFixed(1)}px)` : undefined };
              } else if (mode === "pop") {
                const k = sp(f, t0, { damping: 11, stiffness: 210, mass: 0.8 });
                st = { opacity: tw(f, t0, t0 + 3), transform: `scale(${k}) rotate(${(1 - k) * -10}deg)` };
              } else if (mode === "drop") {
                const k = sp(f, t0, { damping: 18, stiffness: 260 });
                const v = Math.abs(sp(f + 0.5, t0, { damping: 18, stiffness: 260 }) - sp(f - 0.5, t0, { damping: 18, stiffness: 260 }));
                st = { opacity: tw(f, t0, t0 + 3), transform: `translateY(${(1 - k) * size * 0.8}px)`, filter: v > 0.02 ? `blur(${Math.min(14, v * 60).toFixed(1)}px)` : undefined };
              } else {
                st = { opacity: f >= t0 ? 1 : 0 };
              }
              if (q > 0) st = { ...st, opacity: (Number(st.opacity ?? 1)) * (1 - q), transform: `${st.transform ?? ""} translateY(${-q * size * 0.6}px)`, filter: `blur(${(q * 12).toFixed(1)}px)` };
              return (
                <span key={i} style={{ display: "inline-block", fontWeight: weight, transformOrigin: "50% 60%", ...st, ...extra }}>
                  {w}
                </span>
              );
            }),
          )}
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ split-flap tile */

export type FlipVal = { at: number; text: string; bg: string; fg: string };

const TileFace: React.FC<{ w: number; h: number; font: number; v: FlipVal; radius: number; weight?: number; tracking?: number }> = ({ w, h, font, v, radius, weight = 800, tracking = -0.04 }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
    <rect x={0} y={0} width={w} height={h} rx={radius} fill={v.bg} />
    <text x={w / 2} y={h / 2 + font * 0.352} textAnchor="middle" fontFamily={POPPINS} fontWeight={weight} fontSize={font} letterSpacing={`${tracking}em`} fill={v.fg}>
      {v.text}
    </text>
  </svg>
);

/**
 * Split-flap tile. `seq` is the value timeline; each change flips mechanically over `dur` frames:
 * the old top flap falls toward camera, then the new bottom flap lands (with shading).
 */
export const FlipTile: React.FC<{ f: number; w: number; h: number; font: number; seq: FlipVal[]; dur?: number; radius?: number; seam?: string; seamOpacity?: number; weight?: number; tracking?: number }> = ({ f, w, h, font, seq, dur = 8, radius, seam, seamOpacity = 0.85, weight, tracking }) => {
  const r = radius ?? Math.min(w, h) * 0.1;
  let i = 0;
  for (let k = 0; k < seq.length; k++) if (f >= seq[k].at) i = k;
  const cur = seq[i];
  const prev = i > 0 ? seq[i - 1] : null;
  const flipping = prev && f < cur.at + dur;
  const p = flipping ? tw(f, cur.at, cur.at + dur, 0, 1, EASE.inOut) : 1;
  const half = (v: FlipVal, which: "top" | "bottom", extra: React.CSSProperties = {}, shade = 0) => (
    <div style={{ position: "absolute", left: 0, top: which === "top" ? 0 : h / 2, width: w, height: h / 2, overflow: "hidden", backfaceVisibility: "hidden", ...extra }}>
      <div style={{ position: "absolute", left: 0, top: which === "top" ? 0 : -h / 2 }}>
        <TileFace w={w} h={h} font={font} v={v} radius={r} weight={weight} tracking={tracking} />
      </div>
      {shade > 0.01 ? <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${shade})` }} /> : null}
    </div>
  );
  const seamCol = seam ?? cur.fg;
  return (
    <div style={{ position: "relative", width: w, height: h, perspective: h * 3.2 }}>
      {!flipping ? (
        <>
          {half(cur, "top")}
          {half(cur, "bottom")}
        </>
      ) : (
        <>
          {half(cur, "top")}
          {half(prev!, "bottom", {}, 0.25 * Math.min(1, p * 2))}
          {p < 0.5 ? half(prev!, "top", { transformOrigin: "50% 100%", transform: `rotateX(${-p * 2 * 90}deg)` }, 0.45 * p * 2) : half(cur, "bottom", { transformOrigin: "50% 0%", transform: `rotateX(${(1 - (p - 0.5) * 2) * 90}deg)` }, 0.4 * (1 - (p - 0.5) * 2))}
        </>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: h / 2 - Math.max(2, h * 0.008), height: Math.max(3, h * 0.016), background: seamCol, opacity: seamOpacity }} />
    </div>
  );
};

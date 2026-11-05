import React from "react";
import { C, EASE, SPRING, TYPE, fontFamily } from "../config/brand";
import { content } from "../config/content";
import { T } from "../config/time";
import { Capsule, SettleWords } from "../components/core";
import { I } from "../components/Icons";
import { LiftOut } from "../components/LiftOut";
import { fx, mix, sp, tw } from "../components/motion";
import { FARE_MAXROW_Y, FARE_SHEET_TOP, MaxPayRow } from "../screens/Trip";
import type { PhonePose } from "./PhoneAct";

const S = T.hero.s6;
const S6C = content.s6;

// Chart geometry (story zone opened to x 960–1800 once the phone eases left)
const X0 = 990;
const X1 = 1790;
const BASE = 800;
const FLAT = 640;
const HOURS = [6, 23];
const DEMAND = [0.3, 0.55, 0.93, 0.7, 0.42, 0.37, 0.4, 0.5, 0.82, 0.6, 0.44, 0.52, 0.6, 0.5, 0.56, 0.78, 0.95, 0.72];
const PEAKS = [
  { t: 8, icon: "clock" as const },
  { t: 14, icon: "cloud" as const },
  { t: 22, icon: "moon" as const },
];
const hx = (t: number) => X0 + ((t - HOURS[0]) / (HOURS[1] - HOURS[0])) * (X1 - X0);
const hy = (v: number) => BASE - v * 400;

const curvePath = (() => {
  const pts = DEMAND.map((v, i) => [hx(HOURS[0] + i), hy(v)]);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
})();

const Chart: React.FC<{ f: number }> = ({ f }) => {
  const draw = tw(f, S.chart, S.chartDrawEnd, 0, 1, (t) => t);
  const out = fx(f, null, S.chartOut);
  const axisO = tw(f, S.chart, S.chart + 8);
  // capsule → flat line
  const capPop = sp(f, S.chart, SPRING.pop);
  const stretch = tw(f, S.chart + 6, S.chartDrawEnd - 4, 0, 1, EASE.inOut);
  const thin = tw(f, S.chart + 6, S.chart + 20, 0, 1, EASE.inOut);
  const lineW = mix(72, X1 - X0, stretch);
  const lineH = mix(30, 5, thin);
  const label = sp(f, S.chartDrawEnd - 2, SPRING.pop);
  return (
    <div style={{ position: "absolute", inset: 0, ...out, transform: undefined }}>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id="draw">
            <rect x={X0 - 4} y={0} width={(X1 - X0 + 8) * draw} height={1080} />
          </clipPath>
          <linearGradient id="dfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D9DCDB" />
            <stop offset="1" stopColor="#EEF0EF" />
          </linearGradient>
        </defs>
        <line x1={X0} x2={X1} y1={BASE} y2={BASE} stroke={C.border} strokeWidth={2} opacity={axisO} />
        <g clipPath="url(#draw)">
          <path d={`${curvePath} L${X1} ${BASE} L${X0} ${BASE} Z`} fill="url(#dfill)" />
          <path d={curvePath} fill="none" stroke="#B9BEBC" strokeWidth={3} strokeLinejoin="round" />
        </g>
      </svg>
      {content.s6.axis.map((a, i) => {
        const x = [hx(6), hx(12), hx(18), hx(23)][i];
        return (
          <div key={a} style={{ position: "absolute", left: x, top: BASE + 16, transform: `translateX(${i === 0 ? 0 : i === 3 ? -100 : -50}%)`, fontFamily, fontSize: 28, fontWeight: 500, color: C.muted, opacity: axisO, whiteSpace: "nowrap" }}>
            {a}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: X0 + 16, top: BASE - 52, fontFamily, fontSize: 26, fontWeight: 600, color: "#4D5250", opacity: tw(f, S.chart + 10, S.chart + 18) }}>{S6C.demandLabel}</div>
      {PEAKS.map((p, i) => {
        const x = hx(p.t);
        const y = hy(DEMAND[p.t - HOURS[0]]);
        const at = S.chart + (S.chartDrawEnd - S.chart) * ((x - X0) / (X1 - X0));
        const k = sp(f, at, SPRING.pop);
        if (f < at) return null;
        const Ico = I[p.icon];
        const anchor = i === 2 ? -88 : -50;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y - 76, transform: `translateX(${anchor}%) translateY(${(1 - k) * 18}px) scale(${mix(0.6, 1, k)})`, opacity: Math.min(1, k * 1.5), display: "flex", alignItems: "center", gap: 10, height: 52, padding: "0 20px 0 14px", borderRadius: 99, background: C.white, boxShadow: "0 1px 2px rgba(16,17,17,.06), 0 8px 24px rgba(16,17,17,.10)", fontFamily, fontSize: 26, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>
            <Ico size={26} color={C.ink} stroke={2} />
            {S6C.peaks[i]}
          </div>
        );
      })}
      {f >= S.chart ? (
        <Capsule cx={X0 + lineW / 2} cy={FLAT} w={lineW} h={lineH} glowAmt={1} style={{ transform: `scale(${f < S.chart + 6 ? capPop : 1})`, transformOrigin: "0% 50%" }} />
      ) : null}
      {f >= S.chartDrawEnd - 2 ? (
        <div style={{ position: "absolute", left: X1, top: FLAT + 22, transform: `translateX(-100%) scale(${mix(0.7, 1, label)})`, transformOrigin: "100% 0%", opacity: Math.min(1, label * 1.5), display: "flex", alignItems: "center", gap: 10, height: 46, padding: "0 18px", borderRadius: 99, background: C.ink, fontFamily, fontSize: 26, fontWeight: 700, color: C.white, whiteSpace: "nowrap" }}>
          <div style={{ width: 12, height: 12, borderRadius: 99, background: C.ctaGreen, boxShadow: `0 0 10px ${C.ctaGreen}` }} />
          {S6C.podLine}
        </div>
      ) : null}
    </div>
  );
};

export const S6Story: React.FC<{ f: number; phone: PhonePose }> = ({ f, phone }) => {
  if (f < S.chart - 2 || f > S.end + 10) return null;
  return (
    <>
      {f < S.chartOut + 9 ? (
        <>
          <SettleWords text={S6C.title} at={S.title} outAt={S.chartOut} size={TYPE.hero} glowAll accents={{ No: C.ink, surge: C.brandGreen }} seed="s6t" style={{ position: "absolute", left: X0 - 6, top: 84 }} />
          <SettleWords text={S6C.sub} at={S.sub} outAt={S.chartOut} size={40} weight={500} color={C.muted} stagger={2} seed="s6s" maxWidth={800} lineHeight={1.2} style={{ position: "absolute", left: X0, top: 226 }} />
          <Chart f={f} />
        </>
      ) : null}
      <LiftOut f={f} out={S.rowLift} back={S.rowReturn} slot={{ x: 20, y: FARE_SHEET_TOP + FARE_MAXROW_Y, w: 353, h: 40 }} phone={phone} to={{ cx: 1360, cy: 400, scale: 1.6 }} radius={14}>
        <MaxPayRow maxPay={content.trip.maxPay} lock={1} bg />
      </LiftOut>
      <SettleWords text={S6C.maxLine} at={S.maxLine} outAt={S.rowReturn} size={TYPE.caption} accents={{ most: C.brandGreen }} seed="s6m" maxWidth={720} style={{ position: "absolute", left: 1050, top: 500 }} />
    </>
  );
};

import React from "react";
import { C, fontFamily } from "../config/brand";
import { content } from "../config/content";
import { I } from "../components/Icons";
import { Keyboard, KB_H } from "../components/Keyboard";
import { Chip, IconCircle, PlaceRow, RingDot, Spinner } from "../components/ui";
import { mix } from "../components/motion";

const S4 = content.s4;

export type PlanState = {
  searchP: number; // 0 plan mode → 1 search mode
  gps: number[]; // locate-icon ping rings 0..1
  currentIn: number;
  letters: number; // typed letters
  rowsIn: number[]; // entrance progress for each of 4 result rows (current set)
  oldOut: number; // 0..1 fade of previous result set
  chipsP: number[]; // 4 chips slide-in progress
  progress: number; // green search line 0..1 (<0 hidden)
  rowHi: number;
  dim: number;
  spin: number;
  kb: number; // keyboard 0..1
  pressed: { ch: string; p: number } | null;
  caretOn: boolean;
  destPress?: number;
};

export const PLAN_DEFAULT: PlanState = { searchP: 0, gps: [], currentIn: 1, letters: 0, rowsIn: [1, 1, 1, 1], oldOut: 1, chipsP: [1, 1, 1, 1], progress: -1, rowHi: 0, dim: 0, spin: 0, kb: 0, pressed: null, caretOn: false };

// Result rows Y positions (search mode)
export const SEARCH_ROW_Y = [205, 257, 340, 392];

const resultSet = (letters: number) => {
  const final = letters >= S4.interim.finalFrom;
  return {
    locations: final ? S4.locations : S4.interim.locations,
    busStops: final ? S4.busStops : S4.interim.busStops,
    counts: S4.interim.counts[Math.max(0, Math.min(S4.interim.counts.length - 1, letters - 1))],
  };
};

const Results: React.FC<{ letters: number; rowsIn: number[]; opacity: number; rowHi: number }> = ({ letters, rowsIn, opacity, rowHi }) => {
  const set = resultSet(letters);
  const rows = [
    ...set.locations.map((r) => ({ ...r, icon: "pin" as const })),
    ...set.busStops.map((r) => ({ ...r, icon: "bus" as const })),
  ];
  return (
    <>
      {rows.map((r, i) => (
        <div key={i} style={{ position: "absolute", left: 17, top: SEARCH_ROW_Y[i], width: 358, opacity: opacity * rowsIn[i], transform: `translateY(${(1 - rowsIn[i]) * 10}px)` }}>
          <PlaceRow icon={r.icon} title={r.title} sub={r.sub} h={52} hi={i === 0 ? rowHi : 0} />
        </div>
      ))}
    </>
  );
};

export const PlanRideScreen: React.FC<{ st: PlanState; prevLetters?: number }> = ({ st, prevLetters }) => {
  const sp = st.searchP;
  const set = resultSet(Math.max(1, st.letters));
  const query = S4.query.slice(0, st.letters);
  // search field morphs out of the destination row
  const fieldTop = mix(220, 68, sp);
  return (
    <div style={{ position: "absolute", inset: 0, background: C.white, fontFamily, overflow: "hidden" }}>
      {/* ---------- plan mode ---------- */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - sp, transform: `translateY(${-sp * 30}px)` }}>
        <IconCircle size={42} style={{ position: "absolute", left: 17, top: 66 }}>
          <I.arrowLeft size={21} color={C.ink} stroke={2.2} />
        </IconCircle>
        <div style={{ position: "absolute", left: 0, right: 0, top: 76, textAlign: "center", fontSize: 17, fontWeight: 600, color: C.ink }}>{S4.title}</div>
        <div style={{ position: "absolute", left: 17, top: 120, height: 34, padding: "0 12px", borderRadius: 99, background: C.card, display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 600, color: C.ink }}>
          <I.clock size={17} color={C.ink} stroke={1.8} />
          {S4.leaveNow}
          <I.chevronDown size={14} color={C.ink} />
        </div>
        {/* route card */}
        <div style={{ position: "absolute", left: 17, top: 165, width: 358, height: 100, borderRadius: 20, border: `2px solid ${C.ink}`, boxSizing: "border-box", background: C.white, transform: `scale(${st.destPress ?? 1})` }}>
          <div style={{ position: "absolute", left: 14, top: 16, display: "flex", alignItems: "center", gap: 12, width: 326 }}>
            <RingDot color={C.priceGreen} size={12} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>{content.trip.pickup}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.brandGreen, opacity: st.currentIn, whiteSpace: "nowrap" }}>{S4.current}</span>
            <div style={{ flex: 1 }} />
            <div style={{ position: "relative" }}>
              <I.locate size={20} color={C.ink} stroke={1.7} />
              {st.gps.map((p, i) =>
                p > 0 && p < 1 ? (
                  <div key={i} style={{ position: "absolute", left: 10 - 24 * p, top: 10 - 24 * p, width: 48 * p, height: 48 * p, borderRadius: 999, border: `2px solid ${C.ctaGreen}`, opacity: 1 - p, background: `rgba(32,230,130,${0.25 * (1 - p)})` }} />
                ) : null,
              )}
            </div>
          </div>
          <div style={{ position: "absolute", left: 19, top: 38, width: 2, height: 18, background: `repeating-linear-gradient(${C.border} 0 3px, transparent 3px 6px)` }} />
          <div style={{ position: "absolute", left: 14, top: 66, display: "flex", alignItems: "center", gap: 12, width: 326 }}>
            <RingDot color={C.indigo} size={12} />
            <span style={{ fontSize: 13.5, fontWeight: 500, color: "#9a9e9c", whiteSpace: "nowrap" }}>{S4.destPlaceholder}</span>
            <div style={{ flex: 1 }} />
            <I.swap size={19} color={C.ink} stroke={1.7} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 17, top: 270, width: 358 }}>
          {S4.recents.map((r, i) => (
            <PlaceRow key={i} icon="history" title={r.title} sub={r.sub} tag={r.tag} />
          ))}
        </div>
      </div>

      {/* ---------- search mode ---------- */}
      {sp > 0.001 ? (
        <>
          <div style={{ position: "absolute", left: 17, top: fieldTop, width: 358, height: 45, borderRadius: 23, border: `2px solid ${C.ink}`, boxSizing: "border-box", background: C.white, display: "flex", alignItems: "center", padding: "0 12px", gap: 8, opacity: Math.min(1, sp * 2) }}>
            <I.chevronLeft size={18} color={C.ink} stroke={2} />
            <span style={{ fontSize: 15, fontWeight: 600, color: C.ink, flex: 1, display: "flex", alignItems: "center" }}>
              {query}
              {st.caretOn ? <span style={{ width: 2, height: 19, background: C.brandGreen, marginLeft: 1, borderRadius: 1 }} /> : null}
            </span>
            {st.letters > 0 ? <I.xCircle size={20} color="#8D918F" /> : null}
          </div>
          {/* chips */}
          <div style={{ position: "absolute", left: 17, top: 122, display: "flex", gap: 8, opacity: sp }}>
            {S4.chips.map((c, i) => {
              const counts = [set.counts[0], set.counts[1], set.counts[2], null];
              return (
                <div key={c.label} style={{ transform: `translateX(${(1 - st.chipsP[i]) * 260}px)`, opacity: st.chipsP[i] }}>
                  <Chip label={c.label} count={st.letters > 0 ? counts[i] : null} selected={i === 0} />
                </div>
              );
            })}
          </div>
          {st.progress >= 0 ? (
            <div style={{ position: "absolute", left: 17, top: 159, width: 358 * st.progress, height: 2, borderRadius: 2, background: C.priceGreen, opacity: st.progress < 1 ? 1 : 0 }} />
          ) : null}
          {st.letters > 0 ? (
            <div style={{ opacity: sp }}>
              <div style={{ position: "absolute", left: 17, top: 180, width: 358, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>
                  {S4.locationsTitle} <span style={{ color: C.muted, fontWeight: 500, fontSize: 11.5, marginLeft: 4 }}>{set.counts[1]}</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.brandGreen, display: "flex", alignItems: "center", gap: 2 }}>
                  {S4.viewAll} <I.chevronRight size={13} color={C.brandGreen} stroke={2.4} />
                </span>
              </div>
              <div style={{ position: "absolute", left: 17, top: 318, fontSize: 13, fontWeight: 600, color: C.ink }}>
                {S4.busStopsTitle} <span style={{ color: C.muted, fontWeight: 500, fontSize: 11.5, marginLeft: 4 }}>{set.counts[2]}</span>
              </div>
              {prevLetters !== undefined && st.oldOut < 1 ? <Results letters={prevLetters} rowsIn={[1, 1, 1, 1]} opacity={1 - st.oldOut} rowHi={0} /> : null}
              <Results letters={st.letters} rowsIn={st.rowsIn} opacity={1} rowHi={st.rowHi} />
              <div style={{ position: "absolute", left: 33, top: 458, width: 326, height: 56, borderRadius: 12, background: C.card, display: "flex", alignItems: "center", gap: 10, padding: "0 14px", boxSizing: "border-box" }}>
                <I.info size={18} color={C.muted} stroke={1.7} />
                <span style={{ fontSize: 11.5, color: "#5d615f", fontWeight: 500, lineHeight: 1.35 }}>{S4.info}</span>
              </div>
              <div style={{ position: "absolute", left: 130, top: 540, height: 42, padding: "0 16px", borderRadius: 99, border: `1.5px solid ${C.priceGreen}`, display: "flex", alignItems: "center", fontSize: 13, fontWeight: 600, color: C.priceGreen }}>{S4.showAll}</div>
            </div>
          ) : null}
        </>
      ) : null}

      {/* keyboard */}
      <div style={{ position: "absolute", left: 0, top: 852 - KB_H * st.kb, opacity: st.kb > 0 ? 1 : 0 }}>
        <Keyboard pressed={st.pressed} />
      </div>

      {/* loading overlay (04) */}
      {st.dim > 0 ? (
        <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${0.35 * st.dim})` }}>
          <div style={{ position: "absolute", left: 156, top: 433, width: 80, height: 80, borderRadius: 14, background: `rgba(70,70,70,${0.92 * st.dim})`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.9 + 0.1 * st.dim})` }}>
              <Spinner size={30} color="#ffffff" t={st.spin} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

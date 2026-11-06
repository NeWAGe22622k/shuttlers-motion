import React from "react";
import { useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { evolvePath } from "@remotion/paths";
import { C, EASE, T, fontFamily } from "../config/brand";
import { app, home, s6, trip } from "../config/content";
import { I } from "../../components/Icons";
import { Asset } from "../../components/core";
import { Chip, IconCircle, PlaceRow, RecentHomeRow, ServiceCard, Spinner } from "../../components/ui";
import { KB_H, Keyboard, RollText } from "../components/kit";
import { clamp, mix, monotone, press, rrectPath, tw } from "../components/motion";
import { AppMap, MapView } from "./AppMap";

/**
 * Screens 01–09 rebuilt at 393×852 app points from public/screens (match them with
 * <ScreenCheck2 overlay>). Personal data removed: greeting from content.ts, no notification
 * count, no profile card, no empty-wallet row. No "Pod Commute".
 */

export const POS = {
  podTile: { x: 140, y: 410, w: 112, h: 138, r: 16 },
  destRow: { x: 200, y: 231 },
  topResult: { x: 190, y: 231 },
  optionsTop: 427,
  podSoloRow: { x: 196, y: 427 + 24 + 77 + 34 },
  continueBtn: { x: 196, y: 427 + 322 + 28 },
  fareTop: 294,
  payTop: 197,
  cardRow: { x: 196, y: 381 + 28 },
  // lift-out source rects (app points)
  liftTile: { x: 140, y: 410, w: 112, h: 138 },
  liftDest: { x: 17, y: 160, w: 358, h: 50 },
  liftPodSolo: { x: 17, y: 427 + 24 + 77, w: 358, h: 68 },
  liftCard: { x: 20, y: 381, w: 353, h: 57 },
};

const Btn: React.FC<{ label: React.ReactNode; w: number; h?: number; bg?: string; color?: string; scale?: number; style?: React.CSSProperties }> = ({ label, w, h = 52, bg = C.ctaGreen, color = C.ink, scale = 1, style }) => (
  <div style={{ width: w, height: h, borderRadius: 14, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily, fontWeight: 600, fontSize: 16, color, transform: `scale(${scale})`, ...style }}>{label}</div>
);

const Back: React.FC<{ top?: number; white?: boolean }> = ({ top = 66, white = false }) => (
  <div style={{ position: "absolute", left: 17, top, width: 42, height: 42, borderRadius: 99, background: white ? C.white : C.card, boxShadow: white ? "0 0 0 1px rgba(16,17,17,.08)" : undefined, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <I.arrowLeft size={21} color={C.ink} stroke={2.2} />
  </div>
);

/* ================================================================== 01 · Home */

/** Pod tile pulse: a 2px ctaGreen outline that draws around the tile and erases (no glow). */
const TilePulse: React.FC<{ p: number }> = ({ p }) => {
  if (p <= 0 || p >= 1) return null;
  const t = POS.podTile;
  const d = rrectPath(t.x - 4, t.y - 4, t.w + 8, t.h + 8, t.r + 4);
  // draw on 0→0.5, erase from the tail 0.5→1
  const head = clamp(p * 2);
  const tail = clamp(p * 2 - 1);
  const ev = evolvePath(Math.max(0.0001, head - tail), d);
  const len = Number(ev.strokeDasharray.split(" ")[0]);
  return (
    <svg width={393} height={852} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d={d} fill="none" stroke={C.ctaGreen} strokeWidth={2} strokeLinecap="round" strokeDasharray={`${(len * (head - tail)).toFixed(2)} ${len * 2}`} strokeDashoffset={(-len * tail).toFixed(2)} />
    </svg>
  );
};

export const HomeScreen: React.FC<{ pulse?: number; tilePress?: number }> = ({ pulse = 0, tilePress = 1 }) => {
  const H = app.home;
  const cardsX = [17, 140, 263];
  return (
    <div style={{ position: "absolute", inset: 0, background: C.white, fontFamily, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 17, top: 70, display: "flex", alignItems: "center", gap: 5 }}>
        <I.pin size={18} color={C.brandGreen} stroke={1.8} />
        <span style={{ fontSize: 16.5, fontWeight: 500, color: C.ink }}>{H.location}</span>
        <I.chevronDown size={14} color={C.ink} />
      </div>
      <IconCircle size={40} style={{ position: "absolute", left: 288, top: 62 }}>
        <I.bell size={21} color={C.ink} stroke={1.8} />
      </IconCircle>
      <IconCircle size={40} style={{ position: "absolute", left: 336, top: 62 }}>
        <I.qr size={21} color={C.ink} stroke={1.8} />
      </IconCircle>
      <div style={{ position: "absolute", left: 17, top: 112, fontSize: 28, fontWeight: 600, color: C.ink, letterSpacing: -0.4 }}>{home.greeting}</div>
      <div style={{ position: "absolute", left: 17, top: 168, width: 358, height: 53, borderRadius: 27, background: C.white, boxShadow: "0 0 0 1px #E4E6E4", display: "flex", alignItems: "center", padding: "0 8px 0 18px", boxSizing: "border-box", gap: 10 }}>
        <I.search size={22} color={C.muted} stroke={1.8} />
        <span style={{ flex: 1, fontSize: 16, color: "#8E9290", fontWeight: 500 }}>{H.whereTo}</span>
        <div style={{ height: 34, padding: "0 10px", borderRadius: 99, background: C.card, display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: C.ink }}>
          <I.clock size={17} color={C.ink} stroke={1.8} />
          {H.now}
          <I.chevronDown size={14} color={C.ink} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 17, top: 228, width: 358 }}>
        {H.recents.map((r, i) => (
          <RecentHomeRow key={i} {...r} divider={i === 0} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 17, top: 378, width: 358, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 17, fontWeight: 600, color: C.ink }}>{H.servicesTitle}</span>
        <IconCircle size={30}>
          <I.chevronRight size={16} color={C.ink} />
        </IconCircle>
      </div>
      <div style={{ position: "absolute", left: cardsX[0], top: POS.podTile.y }}>
        <ServiceCard kind="daily" {...H.services.daily} />
      </div>
      <div style={{ position: "absolute", left: cardsX[1], top: POS.podTile.y }}>
        <ServiceCard kind="pod" {...H.services.pod} state={{ press: tilePress }} />
      </div>
      <div style={{ position: "absolute", left: cardsX[2], top: POS.podTile.y }}>
        <ServiceCard kind="rent" {...H.services.rent} />
      </div>
      <TilePulse p={pulse} />
      <div style={{ position: "absolute", left: 17, top: 572, width: 358, height: 160, borderRadius: 18, overflow: "hidden", background: "#EEF6F0" }}>
        <div style={{ position: "absolute", left: 16, top: 26, fontSize: 21, fontWeight: 700, color: C.brandGreen, letterSpacing: -0.4 }}>{H.bannerTitle}</div>
        <div style={{ position: "absolute", left: 16, top: 52, fontSize: 21, fontWeight: 500, color: C.ink, letterSpacing: -0.4 }}>{H.bannerSub}</div>
        <div style={{ position: "absolute", left: 168, top: 32 }}>
          <Asset src="vehicles/app-pod-car-large.png" w={230} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 17, top: 738, width: 358, height: 62, borderRadius: 31, background: C.white, boxShadow: "0 0 0 1px #E8E9E8", display: "flex", alignItems: "center", padding: "0 6px", boxSizing: "border-box" }}>
        {H.tabs.map((t, i) => {
          const Ico = [I.home, I.services, I.bookings, I.account][i];
          const active = i === 0;
          return (
            <div key={t} style={{ flex: 1, height: 50, borderRadius: 25, background: active ? "#F0F1F0" : undefined, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
              <Ico size={20} color={active ? C.brandGreen : "#8D918F"} stroke={1.8} />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: active ? C.brandGreen : "#8D918F" }}>{t}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ================================================================== 02 · Plan your ride */

export const PlanScreen: React.FC<{ locateRing?: number; destPress?: number }> = ({ locateRing = 0, destPress = 1 }) => {
  const P = app.plan;
  const r = clamp(locateRing);
  return (
    <div style={{ position: "absolute", inset: 0, background: C.white, fontFamily, overflow: "hidden" }}>
      <Back />
      <div style={{ position: "absolute", left: 0, right: 0, top: 76, textAlign: "center", fontSize: 17, fontWeight: 600, color: C.ink }}>{P.title}</div>
      <div style={{ position: "absolute", left: 17, top: 120, height: 34, padding: "0 12px", borderRadius: 99, background: C.card, display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 600, color: C.ink }}>
        <I.clock size={17} color={C.ink} stroke={1.8} />
        {P.leaveNow}
        <I.chevronDown size={14} color={C.ink} />
      </div>
      <div style={{ position: "absolute", left: 17, top: 165, width: 358, height: 100, borderRadius: 20, border: `2px solid ${C.ink}`, boxSizing: "border-box", background: C.white }}>
        <div style={{ position: "absolute", left: 14, top: 16, display: "flex", alignItems: "center", gap: 12, width: 326 }}>
          <div style={{ width: 12, height: 12, borderRadius: 99, border: `3.4px solid ${C.priceGreen}`, boxSizing: "border-box", flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>{trip.pickup}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.brandGreen, whiteSpace: "nowrap" }}>{P.current}</span>
          <div style={{ flex: 1 }} />
          <div style={{ position: "relative" }}>
            <I.locate size={20} color={C.ink} stroke={1.7} />
            {r > 0 && r < 1 ? (
              <div style={{ position: "absolute", left: 10 - mix(10, 26, r), top: 10 - mix(10, 26, r), width: 2 * mix(10, 26, r), height: 2 * mix(10, 26, r), borderRadius: 99, boxSizing: "border-box", border: `${(2 * (1 - r)).toFixed(3)}px solid ${C.ink}` }} />
            ) : null}
          </div>
        </div>
        <div style={{ position: "absolute", left: 19, top: 38, width: 2, height: 18, background: `repeating-linear-gradient(${C.border} 0 3px, transparent 3px 6px)` }} />
        <div style={{ position: "absolute", left: 4, top: 52, width: 346, height: 36, borderRadius: 10, transform: `scale(${destPress})`, display: "flex", alignItems: "center", gap: 12, paddingLeft: 10, boxSizing: "border-box" }}>
          <div style={{ width: 12, height: 12, borderRadius: 99, border: `3.4px solid ${C.indigo}`, boxSizing: "border-box", flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, fontWeight: 500, color: "#8E9290", whiteSpace: "nowrap" }}>{P.destPlaceholder}</span>
          <div style={{ flex: 1 }} />
          <div style={{ paddingRight: 12 }}>
            <I.swap size={19} color={C.ink} stroke={1.7} />
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 17, top: 272, width: 358 }}>
        {P.recents.map((rr, i) => (
          <PlaceRow key={i} icon="history" title={rr.title} sub={rr.sub} tag={rr.tag} />
        ))}
      </div>
    </div>
  );
};

/* ================================================================== 03 · Search results (typing) */

export const SEARCH_ROW_Y = [205, 257, 340, 392];

const rowsFor = (letters: number) => {
  const S = app.search;
  const set = letters >= 4 ? S.final : S.interim[0];
  return [...set.locations.map((r) => ({ ...r, icon: "pin" as const })), ...set.busStops.map((r) => ({ ...r, icon: "bus" as const }))];
};

/** letters typed; `refresh`: 0..1 push of the latest result set (old rows leave upward, new rows rise into each slot). */
export const SearchScreen: React.FC<{ f: number; letters: number; caret: boolean; refresh: number; refreshFrom: number; resultPress?: number }> = ({ f, letters, caret, refresh, refreshFrom, resultPress = 1 }) => {
  const S = app.search;
  const counts = letters > 0 ? S.counts[Math.min(S.counts.length - 1, letters - 1)] : null;
  const cur = rowsFor(letters);
  const old = refreshFrom > 0 ? rowsFor(refreshFrom) : null;
  const first = letters > 0 && refreshFrom === 0; // first result set rises in from empty
  return (
    <div style={{ position: "absolute", inset: 0, background: C.white, fontFamily, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 17, top: 68, width: 358, height: 45, borderRadius: 23, border: `2px solid ${C.ink}`, boxSizing: "border-box", background: C.white, display: "flex", alignItems: "center", padding: "0 12px", gap: 8 }}>
        <I.chevronLeft size={18} color={C.ink} stroke={2} />
        <span style={{ fontSize: 15, fontWeight: 600, color: C.ink, flex: 1, display: "flex", alignItems: "center", whiteSpace: "pre" }}>
          {s6.query.slice(0, letters)}
          {caret ? <span style={{ width: 2, height: 19, background: C.brandGreen, marginLeft: 1, borderRadius: 1 }} /> : null}
        </span>
        {letters > 0 ? <I.xCircle size={20} color="#8D918F" /> : null}
      </div>
      <div style={{ position: "absolute", left: 17, top: 122, display: "flex", gap: 8 }}>
        {S.chips.map((c, i) => (
          <Chip key={c} label={c} count={counts && i < 3 ? counts[i] : null} selected={i === 0} />
        ))}
      </div>
      {letters > 0 ? (
        <>
          <div style={{ position: "absolute", left: 17, top: 180, width: 358, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>
              {S.locationsTitle} <span style={{ color: C.muted, fontWeight: 500, fontSize: 11.5, marginLeft: 4, fontVariantNumeric: "tabular-nums" }}>{counts![1]}</span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.brandGreen, display: "flex", alignItems: "center", gap: 2 }}>
              {S.viewAll} <I.chevronRight size={13} color={C.brandGreen} stroke={2.4} />
            </span>
          </div>
          <div style={{ position: "absolute", left: 17, top: 318, fontSize: 13, fontWeight: 600, color: C.ink }}>
            {S.busStopsTitle} <span style={{ color: C.muted, fontWeight: 500, fontSize: 11.5, marginLeft: 4, fontVariantNumeric: "tabular-nums" }}>{counts![2]}</span>
          </div>
          {SEARCH_ROW_Y.map((y, i) => {
            const p = clamp(refresh * 1.6 - i * 0.2); // 1-row stagger
            const showOld = old && p < 1;
            return (
              <div key={i} style={{ position: "absolute", left: 17, top: y, width: 358, height: 52, overflow: "hidden", transform: i === 0 ? `scale(${resultPress})` : undefined }}>
                {showOld ? (
                  <div style={{ position: "absolute", left: 0, top: -p * 52, width: 358 }}>
                    <PlaceRow icon={old![i].icon} title={old![i].title} sub={old![i].sub} h={52} />
                  </div>
                ) : null}
                {first || old ? (
                  <div style={{ position: "absolute", left: 0, top: (1 - p) * 52, width: 358 }}>
                    <PlaceRow icon={cur[i].icon} title={cur[i].title} sub={cur[i].sub} h={52} />
                  </div>
                ) : (
                  <PlaceRow icon={cur[i].icon} title={cur[i].title} sub={cur[i].sub} h={52} />
                )}
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 33, top: 458, width: 326, height: 56, borderRadius: 12, background: C.card, display: "flex", alignItems: "center", gap: 10, padding: "0 14px", boxSizing: "border-box" }}>
            <I.info size={18} color={C.muted} stroke={1.7} />
            <span style={{ fontSize: 11.5, color: "#5d615f", fontWeight: 500, lineHeight: 1.35 }}>{S.info}</span>
          </div>
        </>
      ) : null}
    </div>
  );
};

/** Keyboard as system UI: it stays put while app screens push underneath. y: 0 shown → 1 hidden. */
export const KeyboardLayer: React.FC<{ hide: number; pressed: string | null }> = ({ hide, pressed }) => (
  <div style={{ position: "absolute", left: 0, top: 852 - KB_H + hide * (KB_H + 20) }}>
    <Keyboard pressed={pressed} />
  </div>
);

/** 04 · loading: the overlay snaps on and off (no dim fade). */
export const LoadingOverlay: React.FC<{ spin: number }> = ({ spin }) => (
  <div style={{ position: "absolute", inset: 0, background: "rgba(16,17,17,0.32)" }}>
    <div style={{ position: "absolute", left: 156, top: 386, width: 80, height: 80, borderRadius: 14, background: "#4A4B4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner size={30} color="#ffffff" t={spin} />
    </div>
  </div>
);

/* ================================================================== 05/06/07 · map + sheets */

const RouteCard: React.FC = () => (
  <div style={{ position: "absolute", left: 17, top: 116, width: 358, height: 136, borderRadius: 16, background: C.white, boxShadow: "0 0 0 1px rgba(16,17,17,.07)", fontFamily }}>
    {[trip.pickup, trip.dropoff].map((t, i) => (
      <div key={i} style={{ position: "absolute", left: 16, top: 13 + i * 46, right: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 12, height: 12, borderRadius: 99, border: `3.4px solid ${i === 0 ? C.priceGreen : C.indigo}`, boxSizing: "border-box", flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.linkGreen }}>{app.map.change}</span>
      </div>
    ))}
    <div style={{ position: "absolute", left: 21, top: 36, width: 1.5, height: 18, background: C.border }} />
    <div style={{ position: "absolute", left: 8, top: 92, height: 32, padding: "0 11px", borderRadius: 99, background: C.card, display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: C.ink }}>
      <I.clock size={16} color={C.ink} stroke={1.8} />
      {app.map.leaving}
      <I.chevronDown size={13} color={C.ink} />
    </div>
  </div>
);

const DistancePill: React.FC<{ top?: number }> = ({ top = 381 }) => (
  <div style={{ position: "absolute", right: 14, top, height: 31, padding: "0 12px", borderRadius: 99, background: C.white, boxShadow: "0 0 0 1px rgba(16,17,17,.08)", display: "flex", alignItems: "center", fontFamily, fontSize: 12.5, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>{trip.distance}</div>
);

const SheetBox: React.FC<{ top: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ top, children, style }) => (
  <div style={{ position: "absolute", left: 0, top, width: 393, height: 852 - top + 40, background: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, boxShadow: "0 -1px 0 rgba(16,17,17,.08)", overflow: "hidden", ...style }}>
    <div style={{ position: "absolute", left: 196.5 - 18, top: 9, width: 36, height: 4.5, borderRadius: 9, background: "#D9DBDA" }} />
    {children}
  </div>
);

type OptKind = "daily" | "pod" | "rent";
const OPT_IMG: Record<OptKind, { src: string; w: number }> = {
  daily: { src: "vehicles/app-daily-bus-onwhite.png", w: 64 },
  pod: { src: "vehicles/app-pod-car.png", w: 62 },
  rent: { src: "vehicles/app-rent-tag-onwhite.png", w: 34 },
};

/** Ride option row. Selection: mint fill wipes out from the tap point; a 2px linkGreen border draws on. */
export const OptionRow: React.FC<{ kind: OptKind; title: string; sub: string; price?: React.ReactNode; unit?: string; sel?: number; border?: number; tapX?: number; scale?: number }> = ({ kind, title, sub, price, unit, sel = 0, border = 0, tapX = 179, scale = 1 }) => {
  const d = rrectPath(1, 1, 356, 66, 15);
  const ev = border > 0 ? evolvePath(clamp(border, 0.0001, 1), d) : null;
  return (
    <div style={{ width: 358, height: 68, position: "relative", transform: `scale(${scale})`, fontFamily }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 16, background: C.white, boxShadow: `inset 0 0 0 1px ${C.border}`, overflow: "hidden" }}>
        {sel > 0 ? <div style={{ position: "absolute", inset: 0, background: C.mint, clipPath: `circle(${(sel * 380).toFixed(1)}px at ${tapX}px 34px)` }} /> : null}
      </div>
      {ev ? (
        <svg width={358} height={68} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={d} fill="none" stroke={C.linkGreen} strokeWidth={2} strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: 0, top: 0, width: 86, height: 68, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Asset src={OPT_IMG[kind].src} w={OPT_IMG[kind].w} style={kind !== "pod" ? { mixBlendMode: "multiply" } : undefined} />
      </div>
      <div style={{ position: "absolute", left: 86, top: 15 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{title}</div>
        <div style={{ fontSize: 11.5, fontWeight: 500, color: C.muted, marginTop: 2 }}>{sub}</div>
      </div>
      {price ? (
        <div style={{ position: "absolute", right: 14, top: 13, textAlign: "right" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontVariantNumeric: "tabular-nums", height: 19.2 }}>{price}</div>
          <div style={{ fontSize: 9.5, fontWeight: 500, color: C.muted, marginTop: 3 }}>{unit}</div>
        </div>
      ) : null}
    </div>
  );
};

const Skeleton: React.FC<{ spin: number }> = ({ spin }) => (
  <div style={{ width: 358, height: 68, borderRadius: 16, background: C.card, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Spinner size={14} t={spin} />
  </div>
);

export type OptionsState = {
  rows: number; // 0 skeletons → rows slide up (0..1 with stagger baked in by caller)
  rowIn: number[]; // per-row 0..1
  sel: number;
  border: number;
  rowPress: number;
  contPress: number;
  roll: [number, number];
};

/** 05/06: map, route card, distance, options sheet (skeletons → Daily / Pod Solo / Rent). */
export const OptionsScreen: React.FC<{ f: number; route: number; pin: number; pinRing: number; st: OptionsState; view?: MapView }> = ({ f, route, pin, pinRing, st }) => {
  const O = app.options;
  const top = POS.optionsTop;
  const rows = [
    <OptionRow key="d" kind="daily" title={O.daily.title} sub={O.daily.sub} unit={O.daily.unit} price={<RollText text={trip.dailyPrice} f={f} a={st.roll[0]} b={st.roll[1]} size={16} />} />,
    <OptionRow key="p" kind="pod" title={O.podSolo.title} sub={O.podSolo.sub} unit={O.podSolo.unit} price={<RollText text={trip.podPrice} f={f} a={st.roll[0] + 2} b={st.roll[1] + 2} size={16} />} sel={st.sel} border={st.border} tapX={POS.podSoloRow.x - 17} scale={st.rowPress} />,
    <OptionRow key="r" kind="rent" title={O.rent.title} sub={O.rent.sub} />,
  ];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <AppMap f={f} route={route} pin={pin} pinRing={pinRing} />
      <Back white />
      <RouteCard />
      {route >= 1 ? <DistancePill /> : null}
      <SheetBox top={top}>
        {[0, 1, 2].map((i) => {
          const p = st.rowIn[i] ?? 0;
          return (
            <div key={i} style={{ position: "absolute", left: 17, top: 24 + i * 77, width: 358, height: 68, overflow: "hidden", borderRadius: 16 }}>
              {p < 1 ? (
                <div style={{ position: "absolute", left: 0, top: -p * 77 }}>
                  <Skeleton spin={f} />
                </div>
              ) : null}
              {p > 0 ? <div style={{ position: "absolute", left: 0, top: (1 - p) * 77 }}>{rows[i]}</div> : null}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 17, top: 322 }}>
          <Btn label={O.cta} w={358} h={56} scale={st.contPress} />
        </div>
      </SheetBox>
    </div>
  );
};

/** 07 · fare summary sheet (rises over 06). Only the trip values from content.ts are shown. */
export const FareSheet: React.FC<{ f: number; roll: [number, number] }> = ({ f, roll }) => {
  const F = app.fare;
  const row = (label: string, value: string, y: number) => (
    <div style={{ position: "absolute", left: 17, top: y, width: 358, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily, fontSize: 12.5 }}>
      <span style={{ color: "#4B4F4D", fontWeight: 500 }}>{label}</span>
      <span style={{ color: C.ink, fontWeight: 600, maxWidth: 230, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
  return (
    <SheetBox top={POS.fareTop}>
      <div style={{ position: "absolute", left: 17, top: 40, fontFamily, fontSize: 16, fontWeight: 700, color: C.ink }}>{F.title}</div>
      <div style={{ position: "absolute", left: 17, top: 62, fontFamily, fontSize: 11.5, fontWeight: 500, color: C.muted }}>{trip.distance}</div>
      <div style={{ position: "absolute", right: 20, top: 34 }}>
        <Asset src="vehicles/app-pod-car.png" w={86} />
      </div>
      {row(F.pickup, trip.pickup, 106)}
      {row(F.dropoff, trip.dropoff, 132)}
      {row(F.rideFare, trip.podPrice, 158)}
      <div style={{ position: "absolute", left: 17, top: 196, width: 358, height: 1, background: "#EFF0EF" }} />
      <div style={{ position: "absolute", left: 17, top: 216, width: 358, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{F.mostYouPay}</span>
        <RollText text={trip.maxPay} f={f} a={roll[0]} b={roll[1]} size={21} color={C.priceGreen} />
      </div>
      <div style={{ position: "absolute", left: 17, top: 408 }}>
        <Btn label={`${F.pay} ${trip.maxPay}`} w={358} h={50} style={{ fontSize: 14 }} />
      </div>
      <div style={{ position: "absolute", left: 17, top: 466 }}>
        <Btn label={F.cancel} w={358} h={50} bg={C.card} style={{ fontSize: 14 }} />
      </div>
    </SheetBox>
  );
};

/* ================================================================== 08 · payment sheet with the slot reel */

const PAY_ICONS = () => [<I.card size={19} color={C.ink} stroke={1.8} />, <I.bank size={19} color={C.ink} stroke={1.8} />, <I.ussd size={19} color={C.ink} />, <I.building size={19} color={C.ink} stroke={1.8} />];

export const PayRow: React.FC<{ i: number; sel: number; scale?: number }> = ({ i, sel, scale = 1 }) => {
  const icons = PAY_ICONS();
  return (
    <div style={{ width: 353, height: 57, borderRadius: 14, background: C.white, boxShadow: `inset 0 0 0 ${sel > 0 ? 2 : 1}px ${sel > 0 ? C.linkGreen : C.border}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 12, fontFamily, boxSizing: "border-box", transform: `scale(${scale})` }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: C.card, display: "flex", alignItems: "center", justifyContent: "center" }}>{icons[i]}</div>
      <div style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: C.ink }}>{app.pay.methods[i]}</div>
      <div style={{ width: 20, height: 20, borderRadius: 99, border: `1.5px solid ${sel > 0 ? C.linkGreen : "#C9CCCA"}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 11 * sel, height: 11 * sel, borderRadius: 99, background: C.linkGreen }} />
      </div>
    </div>
  );
};

const REEL_STEP = 66;
const REEL_TOP = 184; // inside the sheet (sheet top 197 → rows at 381)

const REEL_KEYS: [number, number][] = [[T.s8.reelStart, T.s8.reelTicks.length], ...T.s8.reelTicks.map((t, k): [number, number] => [t, T.s8.reelTicks.length - 1 - k])];
export const reelPos = monotone(REEL_KEYS);

/** Reads the frame itself so <CameraMotionBlur> can resample it. */
const Reel: React.FC = () => {
  const f = useCurrentFrame();
  const R = T.s8;
  const n = app.pay.methods.length;
  const pos = reelPos(f); // rows still to travel: crosses an integer exactly on each tick frame, settles on Card
  const sel = tw(f, R.radio[0], R.radio[1], 0, 1, EASE.expoOut);
  const base = Math.floor(pos);
  const rows: React.ReactNode[] = [];
  for (let j = -1; j <= n + 1; j++) {
    const k = base + j;
    const i = ((k % n) + n) % n;
    const y = (k - pos) * REEL_STEP;
    if (y < -REEL_STEP || y > n * REEL_STEP) continue;
    rows.push(
      <div key={k} style={{ position: "absolute", left: 0, top: y }}>
        <PayRow i={i} sel={i === 0 && pos === 0 ? sel : 0} scale={i === 0 && pos === 0 ? press(f, R.tapCard) : 1} />
      </div>,
    );
  }
  return <div style={{ position: "absolute", inset: 0 }}>{rows}</div>;
};

export const PaySheet: React.FC<{ f: number }> = ({ f }) => {
  const P = app.pay;
  const R = T.s8;
  const secs = P.countdownFrom - Math.max(0, Math.floor((f - R.sheet[0]) / 30));
  const blur = f >= R.reelBlur[0] && f < R.reelBlur[1];
  const ready = f >= R.tapCard;
  return (
    <SheetBox top={POS.payTop}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 26, textAlign: "center", fontFamily, fontSize: 16.5, fontWeight: 700, color: C.ink }}>{P.title}</div>
      <div style={{ position: "absolute", right: 22, top: 24 }}>
        <I.close size={22} color={C.ink} stroke={2} />
      </div>
      <div style={{ position: "absolute", left: 104, top: 70, width: 185, height: 50, borderRadius: 99, background: C.mint, display: "flex", alignItems: "center", justifyContent: "center", fontFamily, fontSize: 24, fontWeight: 700, color: C.priceGreen, fontVariantNumeric: "tabular-nums" }}>{trip.maxPay}</div>
      <div style={{ position: "absolute", left: 20, top: 133, width: 353, height: 38, borderRadius: 10, background: C.card, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", boxSizing: "border-box", fontFamily }}>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: "#5d615f" }}>{P.finishIn}</span>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`}</span>
      </div>
      <div style={{ position: "absolute", left: 20, top: REEL_TOP, width: 353, height: P.methods.length * REEL_STEP - 9, overflow: "hidden" }}>
        {blur ? (
          <CameraMotionBlur shutterAngle={180} samples={8}>
            <Reel />
          </CameraMotionBlur>
        ) : (
          <Reel />
        )}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 528, height: 1, background: "#EFF0EF" }} />
      <div style={{ position: "absolute", left: 20, top: 545 }}>
        <Btn label={P.cta} w={353} h={54} bg={ready ? C.ctaGreen : C.card} color={ready ? C.ink : "#A5A9A7"} />
      </div>
    </SheetBox>
  );
};

/** 08 backdrop: the map, with a flat scrim that snaps on with the sheet. */
export const PayScreen: React.FC<{ f: number; sheetY: number }> = ({ f, sheetY }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
    <AppMap f={f} route={1} pin={1} view={{ dx: 0, dy: -150, z: 1 }} />
    <div style={{ position: "absolute", inset: 0, background: "rgba(16,17,17,0.28)" }} />
    <div style={{ position: "absolute", left: 0, top: sheetY, width: 393, height: 852 }}>
      <PaySheet f={f} />
    </div>
  </div>
);

/* ================================================================== 09 · payment successful */

export const SuccessScreen: React.FC<{ ring: number; fill: number; check: number }> = ({ ring, fill, check }) => {
  const S = app.success;
  const cx = 196.5;
  const cy = 619;
  const r = 21;
  // the ring draws on (2.5 stroke), then its stroke widens inward until it is a solid disc
  const sw = mix(2.5, r, clamp(fill));
  const rr = r - sw / 2;
  const circle = `M ${cx} ${cy - rr} A ${rr} ${rr} 0 1 1 ${cx - 0.01} ${cy - rr}`;
  const tick = `M ${cx - 9} ${cy + 0.5} L ${cx - 2.5} ${cy + 7} L ${cx + 10} ${cy - 6}`;
  const er = evolvePath(clamp(ring, 0.0001, 1), circle);
  const ec = evolvePath(clamp(check, 0.0001, 1), tick);
  return (
    <div style={{ position: "absolute", inset: 0, background: C.card, overflow: "hidden" }}>
      <SheetBox top={494}>
        <div style={{ position: "absolute", right: 22, top: 28 }}>
          <I.close size={22} color={C.ink} stroke={2} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 168, textAlign: "center", fontFamily, fontSize: 17, fontWeight: 700, color: C.ink }}>{S.title}</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 197, textAlign: "center", fontFamily, fontSize: 13, fontWeight: 500, color: C.muted }}>{S.sub}</div>
        <div style={{ position: "absolute", left: 20, top: 248 }}>
          <Btn label={S.cta} w={353} h={54} />
        </div>
      </SheetBox>
      <svg width={393} height={852} style={{ position: "absolute", left: 0, top: 0 }}>
        {ring > 0 ? <path d={circle} fill="none" stroke={C.successTeal} strokeWidth={sw} strokeDasharray={er.strokeDasharray} strokeDashoffset={er.strokeDashoffset} /> : null}
        {check > 0 ? <path d={tick} fill="none" stroke={fill >= 0.5 ? C.white : C.successTeal} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={ec.strokeDasharray} strokeDashoffset={ec.strokeDashoffset} /> : null}
      </svg>
    </div>
  );
};

/* ================================================================== push (inside the phone) */

/** iOS push: new 100% → 0, old 0 → −30%. No dimming. */
export const Push: React.FC<{ p: number; from: React.ReactNode; to: React.ReactNode; vertical?: boolean }> = ({ p, from, to, vertical = false }) => {
  if (p <= 0) return <>{from}</>;
  if (p >= 1) return <>{to}</>;
  const ax = vertical ? "Y" : "X";
  const dim = vertical ? 852 : 393;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, transform: `translate${ax}(${(-0.3 * p * dim).toFixed(2)}px)` }}>{from}</div>
      <div style={{ position: "absolute", inset: 0, transform: `translate${ax}(${((1 - p) * dim).toFixed(2)}px)` }}>{to}</div>
    </>
  );
};

/* ================================================================== lift-out pieces */

/** The route card's destination row, as a standalone piece (S6 lift-out). Source rect: POS.destCardRow. */
export const DestRow: React.FC = () => (
  <div style={{ width: 358, height: 50, borderRadius: 14, background: C.white, boxShadow: `inset 0 0 0 1px ${C.border}`, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", boxSizing: "border-box", fontFamily }}>
    <div style={{ width: 12, height: 12, borderRadius: 99, border: `3.4px solid ${C.indigo}`, boxSizing: "border-box", flexShrink: 0 }} />
    <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, flex: 1, whiteSpace: "nowrap" }}>{trip.dropoff}</span>
    <span style={{ fontSize: 13, fontWeight: 600, color: C.linkGreen }}>{app.map.change}</span>
  </div>
);

/* ================================================================== 10 · Your Pod is booked (flat popper) */

const POP = { cone: "#193440", pink: "#FFA9EB", green: "#79EDB1", mint: "#A6F5CD", blue: "#66D1FF", yellow: "#FFDE3D", lilac: "#8E8EF1" };

/**
 * Rebuilt 10-pod-booked. The party popper is flat shapes only: the cone and ribbons hold still,
 * and the shapes slide in from the cone's mouth (`shapes` 0 → 1, expoOut by the caller). No particles.
 */
export const PodBookedScreen: React.FC<{ shapes: number }> = ({ shapes }) => {
  const B = app.booked;
  const k = clamp(shapes);
  const mouth = { x: 150, y: 330 };
  const pieces: { x: number; y: number; el: React.ReactNode }[] = [
    { x: 210, y: 120, el: <path d="M0 0 L22 -4 L18 22 L-2 18 Z" fill={POP.yellow} /> },
    { x: 300, y: 210, el: <rect width={24} height={24} rx={3} transform="rotate(18)" fill={POP.lilac} /> },
    { x: 250, y: 168, el: <circle r={22} fill={POP.green} /> },
    { x: 330, y: 300, el: <path d="M0 -16 L5 -5 L16 0 L5 5 L0 16 L-5 5 L-16 0 L-5 -5 Z" fill={POP.blue} /> },
    { x: 120, y: 120, el: <path d="M0 0 L18 2 L14 20 L-3 16 Z" fill={POP.yellow} /> },
    { x: 280, y: 380, el: <rect width={20} height={20} rx={3} transform="rotate(-12)" fill={POP.lilac} /> },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, background: C.white, fontFamily, overflow: "hidden" }}>
      <svg width={393} height={480} style={{ position: "absolute", left: 0, top: 40 }}>
        {/* ribbons: still */}
        <path d="M60 300 C 40 220 110 190 90 120 C 76 70 120 40 150 60" fill="none" stroke={POP.pink} strokeWidth={16} strokeLinecap="round" />
        <path d="M170 310 C 200 240 260 280 280 220 C 296 170 340 180 360 140" fill="none" stroke={POP.green} strokeWidth={14} strokeLinecap="round" />
        <path d="M120 360 C 180 360 220 420 300 400" fill="none" stroke={POP.blue} strokeWidth={12} strokeLinecap="round" />
        {/* shapes slide in from the mouth */}
        {pieces.map((p, i) => {
          const q = clamp(k * 1.3 - i * 0.06);
          const x = mix(mouth.x, p.x, q);
          const y = mix(mouth.y, p.y, q);
          return q > 0 ? (
            <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
              {p.el}
            </g>
          ) : null;
        })}
        {/* cone (still), stripes */}
        <path d="M-30 480 L-60 420 L150 300 L190 360 Z" fill={POP.cone} />
        <path d="M30 450 L5 400 L50 375 L78 425 Z" fill={POP.green} />
        <path d="M110 405 L85 355 L120 335 L148 385 Z" fill={POP.mint} />
      </svg>
      <div style={{ position: "absolute", right: 22, top: 82 }}>
        <I.close size={22} color={C.ink} stroke={2} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 552, textAlign: "center", fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: -0.3 }}>{B.title}</div>
      <div style={{ position: "absolute", left: 32, right: 32, top: 592, textAlign: "center", fontSize: 13.5, fontWeight: 500, color: "#5d615f", lineHeight: 1.45 }}>{B.body}</div>
      <div style={{ position: "absolute", left: 20, top: 748 }}>
        <Btn label={B.cta} w={353} h={50} style={{ fontSize: 14 }} />
      </div>
    </div>
  );
};

/* ================================================================== 11 · Finding your Pod */

export const FindingPodScreen: React.FC<{ f: number; progress: number }> = ({ f, progress }) => {
  const F = app.finding;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", fontFamily }}>
      <AppMap f={f} route={1} pin={1} view={{ dx: -40, dy: 40, z: 1.25 }} />
      <Back white />
      <div style={{ position: "absolute", left: 17, top: 120, width: 358, height: 40, borderRadius: 12, background: C.white, boxShadow: "0 0 0 1px rgba(16,17,17,.07)", display: "flex", alignItems: "center", gap: 8, padding: "0 12px", boxSizing: "border-box", fontSize: 11.5, fontWeight: 600, color: C.ink }}>
        <div style={{ width: 11, height: 11, borderRadius: 99, border: `3px solid ${C.priceGreen}`, boxSizing: "border-box" }} />
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>{trip.pickup}</span>
        <div style={{ width: 11, height: 11, borderRadius: 99, border: `3px solid ${C.indigo}`, boxSizing: "border-box", marginLeft: 8 }} />
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>{trip.dropoff}</span>
      </div>
      <SheetBox top={468}>
        <div style={{ position: "absolute", left: 17, top: 36, fontSize: 16, fontWeight: 700, color: C.ink }}>{F.title}</div>
        <div style={{ position: "absolute", left: 17, right: 30, top: 60, fontSize: 11.5, fontWeight: 500, color: "#5d615f", lineHeight: 1.4 }}>
          {trip.pickup} → {trip.dropoff}, {F.placeSub}
        </div>
        <div style={{ position: "absolute", left: 17, top: 100, width: 358, height: 7, borderRadius: 99, background: "#D4D4D8", overflow: "hidden" }}>
          <div style={{ width: `${(clamp(progress) * 100).toFixed(2)}%`, height: 7, borderRadius: 99, background: C.priceGreen }} />
        </div>
        <div style={{ position: "absolute", left: 17, top: 132, width: 358, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{F.quoted}</span>
          <span style={{ fontSize: 19, fontWeight: 700, color: C.priceGreen, fontVariantNumeric: "tabular-nums" }}>{trip.podPrice}</span>
        </div>
        <div style={{ position: "absolute", left: 17, top: 196 }}>
          <Btn label={F.cancel} w={96} h={42} bg={C.card} style={{ fontSize: 13.5 }} />
        </div>
      </SheetBox>
    </div>
  );
};

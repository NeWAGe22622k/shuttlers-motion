import React from "react";
import { evolvePath } from "@remotion/paths";
import { C, fontFamily } from "../config/brand";
import { app, home, s6, trip } from "../config/content";
import { I } from "../../components/Icons";
import { Asset } from "../../components/core";
import { Chip, IconCircle, PlaceRow, Spinner } from "../../components/ui";
import { KB_H, Keyboard, RollText } from "../components/kit";
import { clamp, mix, rrectPath } from "../components/motion";
import { AppMap, MapView } from "./AppMap";

/**
 * Screens rebuilt at 393×852 app points from the revision-6 screenshots (public/screens, 3×):
 * check any of them with <ScreenCheck2 screen=… overlay=0.5>. Kept as shown (greeting, profile
 * card, banner, tab bar, Pod Shared row), except: the map is drawn (no provider logo), no
 * "Evening peak" on the fare summary, no Personal wallet row, and no full stops.
 */

export const POS = {
  podTile: { x: 140, y: 490, w: 113, h: 133, r: 16 },
  destRow: { x: 200, y: 269 },
  topResult: { x: 196, y: 239 },
  optionsTop: 428,
  podSoloRow: { x: 196, y: 451 + 77 + 34 },
  continueBtn: { x: 196, y: 777 },
  fareTop: 281,
  payBtn: { x: 196, y: 726 },
  payTop: 196,
  cardRow: { x: 196, y: 381 + 27 },
  payContinue: { x: 196, y: 770 },
  // lift-out source rects (app points)
  liftTile: { x: 140, y: 490, w: 113, h: 133 },
  liftDest: { x: 17, y: 160, w: 358, h: 50 },
  liftPodSolo: { x: 17, y: 451 + 77, w: 358, h: 68 },
  liftCard: { x: 17, y: 381, w: 359, h: 55 },
};

const Btn: React.FC<{ label: React.ReactNode; w: number; h?: number; bg?: string; color?: string; scale?: number; style?: React.CSSProperties }> = ({ label, w, h = 52, bg = C.ctaGreen, color = C.ink, scale = 1, style }) => (
  <div style={{ width: w, height: h, borderRadius: 14, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily, fontWeight: 600, fontSize: 16, color, transform: `scale(${scale})`, ...style }}>{label}</div>
);

const Back: React.FC<{ top?: number }> = ({ top = 66 }) => (
  <div style={{ position: "absolute", left: 17, top, width: 42, height: 42, borderRadius: 99, background: C.white, boxShadow: "0 0 0 1px rgba(16,17,17,.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <I.arrowLeft size={21} color={C.ink} stroke={2.2} />
  </div>
);

const Dot: React.FC<{ color: string; size?: number }> = ({ color, size = 12 }) => <div style={{ width: size, height: size, borderRadius: 99, border: `${size * 0.28}px solid ${color}`, boxSizing: "border-box", flexShrink: 0, background: C.white }} />;

const SheetBox: React.FC<{ top: number; children: React.ReactNode; style?: React.CSSProperties; grabber?: boolean }> = ({ top, children, style, grabber = true }) => (
  <div style={{ position: "absolute", left: 0, top, width: 393, height: 852 - top + 40, background: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, boxShadow: "0 -1px 0 rgba(16,17,17,.08)", overflow: "hidden", ...style }}>
    {grabber ? <div style={{ position: "absolute", left: 196.5 - 18, top: 9, width: 36, height: 4.5, borderRadius: 9, background: "#D9DBDA" }} /> : null}
    {children}
  </div>
);

/* ================================================================== 01 · Home (01b: Pod pressed) */

/** Pod tile pulse: a 2px ctaGreen outline that draws around the tile and erases (no glow). */
const TilePulse: React.FC<{ p: number }> = ({ p }) => {
  if (p <= 0 || p >= 1) return null;
  const t = POS.podTile;
  const d = rrectPath(t.x - 4, t.y - 4, t.w + 8, t.h + 8, t.r + 4);
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

type Kind = "daily" | "pod" | "rent";
const TILE_IMG: Record<Kind, { src: string; w: number; top: number }> = {
  daily: { src: "vehicles/app-daily-bus-onbg.png", w: 98, top: 24 },
  pod: { src: "vehicles/app-pod-car-onbg.png", w: 96, top: 30 },
  rent: { src: "vehicles/app-rent-tag-onbg.png", w: 50, top: 14 },
};

/** Service tile. `dark` 0→1 darkens the fill #F4F5F4 → #E6E8E6 (01b, pressed). */
export const ServiceTile: React.FC<{ kind: Kind; dark?: number; scale?: number }> = ({ kind, dark = 0, scale = 1 }) => {
  const S = app.home.services[kind];
  const img = TILE_IMG[kind];
  const bg = dark > 0 ? `rgb(${Math.round(mix(0xf4, 0xe6, dark))},${Math.round(mix(0xf5, 0xe8, dark))},${Math.round(mix(0xf4, 0xe6, dark))})` : C.card;
  return (
    <div style={{ width: 113, height: 133, borderRadius: 16, background: bg, position: "relative", overflow: "hidden", fontFamily, transform: `scale(${scale})` }}>
      <div style={{ position: "absolute", left: (113 - img.w) / 2, top: img.top, mixBlendMode: "multiply" }}>
        <Asset src={img.src} w={img.w} />
      </div>
      {kind === "pod" ? <div style={{ position: "absolute", right: 7, top: 8, height: 15, padding: "0 6px", borderRadius: 4, background: C.indigo, color: C.white, fontSize: 8.5, fontWeight: 600, display: "flex", alignItems: "center" }}>{app.home.services.pod.badge}</div> : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 98, textAlign: "center", fontSize: 13.5, fontWeight: 600, color: C.ink }}>{S.title}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 117, textAlign: "center", fontSize: 9.5, fontWeight: 500, color: C.muted, whiteSpace: "nowrap" }}>{S.sub}</div>
    </div>
  );
};

export const HomeScreen: React.FC<{ pulse?: number; tileDark?: number; tileScale?: number }> = ({ pulse = 0, tileDark = 0, tileScale = 1 }) => {
  const H = app.home;
  const cardsX = [16.5, 140, 263.5];
  return (
    <div style={{ position: "absolute", inset: 0, background: C.white, fontFamily, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 17, top: 73, display: "flex", alignItems: "center", gap: 6 }}>
        <I.pin size={18} color={C.brandGreen} stroke={1.8} />
        <span style={{ fontSize: 16.5, fontWeight: 500, color: C.ink }}>{H.location}</span>
        <I.chevronDown size={14} color={C.ink} />
      </div>
      <IconCircle size={42} style={{ position: "absolute", left: 286, top: 62 }}>
        <I.bell size={21} color={C.ink} stroke={1.8} />
      </IconCircle>
      <div style={{ position: "absolute", left: 314, top: 66, width: 8, height: 8, borderRadius: 99, background: C.priceGreen, border: `1.5px solid ${C.card}` }} />
      <IconCircle size={42} style={{ position: "absolute", left: 335, top: 62 }}>
        <I.qr size={21} color={C.ink} stroke={1.8} />
      </IconCircle>
      <div style={{ position: "absolute", left: 17, top: 113, fontSize: 29, fontWeight: 600, color: C.ink, letterSpacing: -0.4 }}>{home.greeting}</div>
      <div style={{ position: "absolute", left: 16.5, top: 169, width: 360, height: 59, borderRadius: 29.5, background: C.white, boxShadow: "0 0 0 1px #E4E6E4", display: "flex", alignItems: "center", padding: "0 9px 0 18px", boxSizing: "border-box", gap: 10 }}>
        <I.search size={22} color={C.ink} stroke={1.8} />
        <span style={{ flex: 1, fontSize: 15.5, color: C.ink, fontWeight: 600 }}>{H.whereTo}</span>
        <div style={{ height: 36, padding: "0 11px", borderRadius: 99, background: C.white, boxShadow: "0 0 0 1px #E4E6E4", display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, color: C.ink }}>
          <I.clock size={16} color={C.ink} stroke={1.8} />
          {H.now}
          <I.chevronDown size={13} color={C.ink} />
        </div>
      </div>
      {H.recents.map((r, i) => (
        <div key={i} style={{ position: "absolute", left: 17, top: 245 + i * 49, width: 359, height: 40, display: "flex", alignItems: "center", gap: 12 }}>
          <IconCircle size={28}>
            <I.history size={15} color={C.muted} />
          </IconCircle>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{r.title}</div>
            <div style={{ fontSize: 11.5, fontWeight: 500, color: C.muted, marginTop: 1 }}>{r.sub}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{r.code}</div>
            <div style={{ fontSize: 11.5, fontWeight: 500, color: C.ink, marginTop: 1, fontVariantNumeric: "tabular-nums" }}>{r.time}</div>
          </div>
        </div>
      ))}
      {/* profile card (kept as shown) */}
      <div style={{ position: "absolute", left: 16.5, top: 367, width: 360, height: 61, borderRadius: 18, background: C.ink }}>
        <div style={{ position: "absolute", left: 16, top: 24, width: 13, height: 13, borderRadius: 99, background: C.redPin }} />
        <div style={{ position: "absolute", left: 38, top: 13, fontSize: 13, fontWeight: 600, color: C.white }}>{H.profile.title}</div>
        <div style={{ position: "absolute", left: 38, top: 32, fontSize: 11.5, fontWeight: 500, color: "#C9CCCA" }}>
          <b style={{ color: C.white }}>{H.profile.done}</b> {H.profile.sub}
        </div>
      </div>
      <div style={{ position: "absolute", left: 17, top: 448, width: 359, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 17, fontWeight: 600, color: C.ink }}>{H.servicesTitle}</span>
        <IconCircle size={28}>
          <I.chevronRight size={15} color={C.ink} />
        </IconCircle>
      </div>
      {(["daily", "pod", "rent"] as const).map((k, i) => (
        <div key={k} style={{ position: "absolute", left: cardsX[i], top: POS.podTile.y }}>
          <ServiceTile kind={k} dark={k === "pod" ? tileDark : 0} scale={k === "pod" ? tileScale : 1} />
        </div>
      ))}
      <TilePulse p={pulse} />
      <div style={{ position: "absolute", left: 16.5, top: 650, width: 360, height: 150, borderRadius: 18, overflow: "hidden", background: "#EAF5EE" }}>
        <div style={{ position: "absolute", left: 14, top: 26, fontSize: 21, fontWeight: 700, color: C.brandGreen, letterSpacing: -0.5 }}>{H.bannerTitle}</div>
        <div style={{ position: "absolute", left: 14, top: 49, fontSize: 21, fontWeight: 500, color: C.ink, letterSpacing: -0.5 }}>{H.bannerSub}</div>
        <div style={{ position: "absolute", left: 158, top: 6 }}>
          <Asset src="vehicles/app-pod-car-large.png" w={240} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 16.5, top: 741, width: 360, height: 64, borderRadius: 32, background: C.white, boxShadow: "0 0 0 1px #E8E9E8", display: "flex", alignItems: "center", padding: "0 6px", boxSizing: "border-box" }}>
        {H.tabs.map((t, i) => {
          const Ico = [I.home, I.services, I.bookings, I.account][i];
          const active = i === 0;
          return (
            <div key={t} style={{ flex: 1, height: 52, borderRadius: 26, background: active ? "#EFF1EF" : undefined, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
              <Ico size={20} color={active ? C.brandGreen : "#8D918F"} stroke={1.8} />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: active ? C.brandGreen : "#8D918F" }}>{t}</span>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 17, top: 823, width: 359, display: "flex", justifyContent: "space-between", fontSize: 14.5, fontWeight: 700, color: C.ink }}>
        {H.frequent}
        <span style={{ color: C.linkGreen, fontSize: 12.5, fontWeight: 600 }}>{H.viewAll}</span>
      </div>
    </div>
  );
};

/* ================================================================== 02 / 02a · Plan your ride (full-screen modal) */

export const PlanScreen: React.FC<{ locateRing?: number; destPress?: number; focused?: boolean; caret?: boolean }> = ({ locateRing = 0, destPress = 1, focused = false, caret = false }) => {
  const P = app.plan;
  const r = clamp(locateRing);
  return (
    <div style={{ position: "absolute", inset: 0, background: C.white, fontFamily, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 22, top: 74 }}>
        <I.arrowLeft size={24} color={C.ink} stroke={2.2} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 75, textAlign: "center", fontSize: 16.5, fontWeight: 600, color: C.ink }}>{P.title}</div>
      <div style={{ position: "absolute", left: 17, top: 130, width: 359, height: 163, borderRadius: 20, boxShadow: focused ? `inset 0 0 0 2px ${C.ink}` : "inset 0 0 0 1px #E2E4E2", background: C.white }}>
        <div style={{ position: "absolute", left: 8, top: 10, right: 8, height: 44, borderRadius: 14, background: C.mint, display: "flex", alignItems: "center", padding: "0 8px 0 12px", gap: 10 }}>
          <div style={{ width: 18, height: 18, borderRadius: 99, background: C.priceGreen, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <I.clock size={13} color={C.white} stroke={2.2} />
          </div>
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: C.priceGreen }}>{P.leaving}</span>
          <div style={{ height: 32, padding: "0 13px", borderRadius: 99, background: C.white, boxShadow: "0 0 0 1px #E2E4E2", display: "flex", alignItems: "center", fontSize: 13, fontWeight: 600, color: C.ink }}>{P.change}</div>
        </div>
        <div style={{ position: "absolute", left: 16, top: 74, right: 14, display: "flex", alignItems: "center", gap: 13 }}>
          <Dot color={C.priceGreen} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>{trip.pickup}</span>
          <div style={{ position: "relative" }}>
            <I.locate size={20} color={C.muted} stroke={1.7} />
            {r > 0 && r < 1 ? <div style={{ position: "absolute", left: 10 - mix(10, 26, r), top: 10 - mix(10, 26, r), width: 2 * mix(10, 26, r), height: 2 * mix(10, 26, r), borderRadius: 99, boxSizing: "border-box", border: `${(2 * (1 - r)).toFixed(3)}px solid ${C.ink}` }} /> : null}
          </div>
        </div>
        <div style={{ position: "absolute", left: 21.5, top: 96, width: 1.5, height: 28, background: `repeating-linear-gradient(${C.border} 0 3px, transparent 3px 6px)` }} />
        <div style={{ position: "absolute", left: 4, top: 120, width: 351, height: 38, borderRadius: 10, transform: `scale(${destPress})`, display: "flex", alignItems: "center", gap: 13, padding: "0 10px 0 12px", boxSizing: "border-box" }}>
          <Dot color={C.indigo} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#8E9290", whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>
            {caret ? <span style={{ width: 2, height: 17, background: C.ink, marginRight: 1, borderRadius: 1 }} /> : null}
            {P.destPlaceholder}
          </span>
          <I.swap size={18} color={C.muted} stroke={1.7} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 17, top: 293, width: 359 }}>
        {P.recents.map((rr, i) => (
          <PlaceRow key={i} icon="history" title={rr.title} sub={rr.sub} tag={rr.tag} h={55} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 17, top: 755 }}>
        <Btn label={P.search} w={359} h={55} color={C.white} />
      </div>
    </div>
  );
};

/* ================================================================== 03b / 04 · Search the destination */

export const SEARCH_ROW_Y = [217, 261, 364, 416];

const RouteIcon: React.FC = () => (
  <div style={{ width: 30, height: 30, borderRadius: 99, background: "#ECECFD", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.indigo} strokeWidth={2} strokeLinecap="round">
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
    </svg>
  </div>
);

/** letters typed; every keystroke pushes the result rows up (`refresh` 0..1 of the latest push). `tapDim`: 04's flat tap state. */
export const SearchScreen: React.FC<{ letters: number; caret: boolean; refresh: number; resultPress?: number; tapDim?: boolean }> = ({ letters, caret, refresh, resultPress = 1, tapDim = false }) => {
  const S = app.search;
  const rows = [...S.rows.locations.map((r) => ({ ...r, icon: "pin" as const })), ...S.rows.busStops.map((r) => ({ ...r, icon: "bus" as const }))];
  const header = (t: { title: string; count: string }, top: number) => (
    <div style={{ position: "absolute", left: 17, top, width: 359, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>
        {t.title} <span style={{ color: C.muted, fontWeight: 500, fontSize: 11, marginLeft: 3 }}>{t.count}</span>
      </span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: C.linkGreen, display: "flex", alignItems: "center", gap: 2 }}>
        {S.viewAll} <I.chevronRight size={12} color={C.linkGreen} stroke={2.4} />
      </span>
    </div>
  );
  return (
    <div style={{ position: "absolute", inset: 0, background: C.white, fontFamily, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 17, top: 68, width: 359, height: 54, borderRadius: 27, boxShadow: `inset 0 0 0 2px ${C.ink}`, background: C.white, display: "flex", alignItems: "center", padding: "0 14px 0 18px", gap: 10 }}>
        <I.chevronLeft size={18} color={C.ink} stroke={2} />
        <span style={{ fontSize: 15, fontWeight: 600, color: C.ink, flex: 1, display: "flex", alignItems: "center", whiteSpace: "pre" }}>
          {s6.query.slice(0, letters)}
          {caret ? <span style={{ width: 2, height: 19, background: C.ink, marginLeft: 1, borderRadius: 1 }} /> : null}
        </span>
        {letters > 0 ? <I.xCircle size={20} color="#8D918F" /> : null}
      </div>
      <div style={{ position: "absolute", left: 17, top: 131, display: "flex", gap: 8 }}>
        {S.chips.map((c, i) => (
          <Chip key={c.label} label={c.label} count={letters > 0 && c.count ? (c.count as unknown as number) : null} selected={i === 0} />
        ))}
      </div>
      {letters > 0 ? (
        <>
          {header(S.locations, 190)}
          {header(S.busStops, 337)}
          {header(S.routes, 483)}
          {SEARCH_ROW_Y.map((y, i) => {
            const p = clamp(refresh * 1.4 - i * 0.12);
            return (
              <div key={i} style={{ position: "absolute", left: 17, top: y, width: 359, height: 46, overflow: "hidden", transform: i === 0 ? `scale(${resultPress})` : undefined, background: tapDim && i === 0 ? "rgba(16,17,17,0.06)" : undefined, borderRadius: 10 }}>
                <div style={{ position: "absolute", left: 0, top: -p * 46 }}>
                  <PlaceRow icon={rows[i].icon} title={rows[i].title} sub={rows[i].sub} h={46} />
                </div>
                <div style={{ position: "absolute", left: 0, top: (1 - p) * 46 }}>
                  <PlaceRow icon={rows[i].icon} title={rows[i].title} sub={rows[i].sub} h={46} />
                </div>
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 17, top: 509, width: 359, display: "flex", alignItems: "center", gap: 12 }}>
            <RouteIcon />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{S.rows.route.code}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: C.muted, marginTop: 1 }}>
                {S.rows.route.sub[0]} → {S.rows.route.sub[1]}
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{S.rows.route.time}</span>
          </div>
        </>
      ) : null}
      {tapDim ? <div style={{ position: "absolute", inset: 0, background: "rgba(16,17,17,0.10)" }} /> : null}
    </div>
  );
};

/** Keyboard as system UI: it stays put while app screens push underneath. hide: 0 shown → 1 hidden. */
export const KeyboardLayer: React.FC<{ hide: number; pressed: string | null }> = ({ hide, pressed }) => (
  <div style={{ position: "absolute", left: 0, top: 852 - KB_H + hide * (KB_H + 20) }}>
    <Keyboard pressed={pressed} />
  </div>
);

/* ================================================================== 05 / 06 · map + ride options */

const RouteCard: React.FC = () => (
  <div style={{ position: "absolute", left: 17, top: 117, width: 359, height: 134, borderRadius: 16, background: C.white, boxShadow: "0 0 0 1px rgba(16,17,17,.07)", fontFamily }}>
    {[trip.pickup, trip.dropoff].map((t, i) => (
      <div key={i} style={{ position: "absolute", left: 16, top: 12 + i * 46, right: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <Dot color={i === 0 ? C.priceGreen : C.indigo} />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.linkGreen }}>{app.map.change}</span>
      </div>
    ))}
    <div style={{ position: "absolute", left: 21.5, top: 36, width: 1.5, height: 18, background: C.border }} />
    <div style={{ position: "absolute", left: 10, top: 92, height: 32, padding: "0 11px", borderRadius: 99, boxShadow: "0 0 0 1px #E2E4E2", display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: C.ink }}>
      <I.clock size={15} color={C.ink} stroke={1.8} />
      {app.map.leaving}
      <I.chevronDown size={12} color={C.ink} />
    </div>
  </div>
);

/** The compact route pill on 07 / 08 / 08b / 11. */
const RoutePill: React.FC = () => (
  <div style={{ position: "absolute", left: 17, top: 104, width: 359, height: 32, borderRadius: 12, background: C.white, boxShadow: "0 0 0 1px rgba(16,17,17,.07)", display: "flex", alignItems: "center", gap: 7, padding: "0 12px", boxSizing: "border-box", fontFamily, fontSize: 10.5, fontWeight: 600, color: C.ink }}>
    <Dot color={C.priceGreen} size={11} />
    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: 112 }}>{trip.pickup}</span>
    <I.arrowRight size={12} color={C.muted} stroke={2} />
    <Dot color={C.indigo} size={11} />
    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: 140 }}>{trip.dropoff}</span>
  </div>
);

const DistancePill: React.FC = () => (
  <div style={{ position: "absolute", right: 14, top: 382, height: 31, padding: "0 12px", borderRadius: 99, background: C.white, boxShadow: "0 0 0 1px rgba(16,17,17,.08)", display: "flex", alignItems: "center", fontFamily, fontSize: 12, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>{trip.distance}</div>
);

const OPT_IMG: Record<Kind, { src: string; w: number }> = {
  daily: { src: "vehicles/app-daily-bus-onwhite.png", w: 64 },
  pod: { src: "vehicles/app-pod-car.png", w: 62 },
  rent: { src: "vehicles/app-rent-tag-onwhite.png", w: 34 },
};

/** Ride option row as in 06. `grey`: unavailable (Daily, Pod Shared). `sel`: mint fill + 2px green border. */
export const OptionRow: React.FC<{ kind: Kind; title: string; sub: string; price?: React.ReactNode; unit?: string; sel?: number; border?: number; scale?: number; grey?: boolean; action?: string }> = ({ kind, title, sub, price, unit, sel = 0, scale = 1, grey = false, action }) => (
  <div style={{ width: 358, height: 68, position: "relative", transform: `scale(${scale})`, fontFamily }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: 16, background: sel > 0 ? C.mint : C.white, boxShadow: `inset 0 0 0 ${sel > 0 ? 2 : 1}px ${sel > 0 ? C.linkGreen : C.border}` }} />
    <div style={{ position: "absolute", left: 0, top: 0, width: 86, height: 68, display: "flex", alignItems: "center", justifyContent: "center", filter: grey ? "saturate(0.15) brightness(1.08)" : undefined }}>
      <Asset src={OPT_IMG[kind].src} w={OPT_IMG[kind].w} style={kind !== "pod" ? { mixBlendMode: "multiply" } : undefined} />
    </div>
    <div style={{ position: "absolute", left: 86, top: grey && kind === "daily" ? 10 : 15, width: action ? 140 : 200 }}>
      <div style={{ fontSize: 14.5, fontWeight: 600, color: grey ? "#8E9290" : C.ink }}>{title}</div>
      <div style={{ fontSize: 11, fontWeight: 500, color: C.muted, marginTop: 2, lineHeight: 1.3 }}>{sub}</div>
    </div>
    {action ? (
      <div style={{ position: "absolute", right: 12, top: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.priceGreen} strokeWidth={2} strokeLinecap="round">
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
        <span style={{ fontSize: 10, fontWeight: 600, color: C.priceGreen }}>{action}</span>
      </div>
    ) : null}
    {price ? (
      <div style={{ position: "absolute", right: 14, top: 14, textAlign: "right" }}>
        <div style={{ fontSize: 15.5, fontWeight: 700, color: C.ink, fontVariantNumeric: "tabular-nums", height: 19 }}>{price}</div>
        <div style={{ fontSize: 9.5, fontWeight: 500, color: C.muted, marginTop: 3 }}>{unit}</div>
      </div>
    ) : null}
  </div>
);

const Skeleton: React.FC<{ spin: number }> = ({ spin }) => (
  <div style={{ width: 358, height: 68, borderRadius: 16, background: C.card, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Spinner size={18} t={spin} color={C.priceGreen} />
  </div>
);

export type OptionsState = {
  dailyIn: number; // 0 skeleton → 1 resolved (Daily resolves first)
  rowIn: number[]; // Pod Solo, Pod Shared, Rent
  rowPress: number;
  contPress: number;
  contReady: boolean; // Continue turns full green once Pod Solo is tapped
  roll: [number, number];
};

const OPT_ROWS_TOP = 451;

export const OptionsScreen: React.FC<{ f: number; route: number; pin: number; pinRing: number; st: OptionsState; view?: MapView }> = ({ f, route, pin, pinRing, st }) => {
  const O = app.options;
  const rows = [
    <OptionRow key="d" kind="daily" title={O.daily.title} sub={O.daily.sub} grey action={O.daily.action} />,
    <OptionRow key="p" kind="pod" title={O.podSolo.title} sub={O.podSolo.sub} unit={O.podSolo.unit} price={<RollText text={trip.podPrice} f={f} a={st.roll[0]} b={st.roll[1]} size={15.5} />} sel={1} scale={st.rowPress} />,
    <OptionRow key="s" kind="pod" title={O.podShared.title} sub={O.podShared.sub} grey />,
    <OptionRow key="r" kind="rent" title={O.rent.title} sub={O.rent.sub} />,
  ];
  const ins = [st.dailyIn, ...st.rowIn];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <AppMap f={f} route={route} pin={pin} pinRing={pinRing} />
      <Back />
      <RouteCard />
      {route >= 1 ? <DistancePill /> : null}
      <SheetBox top={POS.optionsTop}>
        {rows.map((row, i) => {
          const p = ins[i] ?? 0;
          return (
            <div key={i} style={{ position: "absolute", left: 17, top: OPT_ROWS_TOP - POS.optionsTop + i * 77, width: 358, height: 68, overflow: "hidden", borderRadius: 16 }}>
              {p < 1 ? (
                <div style={{ position: "absolute", left: 0, top: -p * 77 }}>
                  <Skeleton spin={f} />
                </div>
              ) : null}
              {p > 0 ? <div style={{ position: "absolute", left: 0, top: (1 - p) * 77 }}>{row}</div> : null}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, right: 0, top: 738 - POS.optionsTop, height: 140, background: C.white }} />
        <div style={{ position: "absolute", left: 17, top: 749 - POS.optionsTop }}>
          <Btn label={O.cta} w={359} h={57} bg={st.contReady ? C.ctaGreen : "#7DEDB2"} scale={st.contPress} />
        </div>
      </SheetBox>
    </div>
  );
};

/* ================================================================== 07 · fare summary */

export const FareSheet: React.FC<{ f: number; roll: [number, number]; payPress?: number }> = ({ f, roll, payPress = 1 }) => {
  const F = app.fare;
  const T0 = POS.fareTop;
  const row = (label: string, value: string, y: number) => (
    <div style={{ position: "absolute", left: 17, top: y - T0, width: 359, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily, fontSize: 12 }}>
      <span style={{ color: "#4B4F4D", fontWeight: 500 }}>{label}</span>
      <span style={{ color: C.ink, fontWeight: 600, maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
  const small: React.CSSProperties = { fontFamily, fontSize: 9.8, fontWeight: 500, color: "#4B4F4D", lineHeight: 1.35 };
  return (
    <SheetBox top={T0}>
      <div style={{ position: "absolute", left: 17, top: 316 - T0, fontFamily, fontSize: 15.5, fontWeight: 700, color: C.ink }}>{F.title}</div>
      <div style={{ position: "absolute", left: 17, top: 338 - T0, fontFamily, fontSize: 10.5, fontWeight: 500, color: C.muted }}>{trip.fareMeta}</div>
      <div style={{ position: "absolute", right: 18, top: 298 - T0 }}>
        <Asset src="vehicles/app-pod-car.png" w={86} />
      </div>
      {row(F.pickup, trip.pickup, 380)}
      {row(F.dropoff, trip.dropoff, 406)}
      {row(F.rideFare, trip.podPrice, 433)}
      {row(F.held, trip.held, 460)}
      <div style={{ position: "absolute", left: 17, top: 503 - T0, width: 359, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{F.mostYouPay}</span>
        <RollText text={trip.maxPay} f={f} a={roll[0]} b={roll[1]} size={19} color={C.priceGreen} />
      </div>
      <div style={{ position: "absolute", left: 17, top: 532 - T0, ...small }}>
        <div>{F.notes[0]}</div>
        <div>{F.notes[1]}</div>
        <div style={{ marginTop: 8 }}>{F.notes[2]}</div>
        <div style={{ marginTop: 8 }}>{F.collect[0]}</div>
        <div>{F.collect[1]}</div>
      </div>
      <div style={{ position: "absolute", left: 17, top: 641 - T0, width: 15, height: 15, borderRadius: 2, boxShadow: `inset 0 0 0 1.6px ${C.ink}` }} />
      <div style={{ position: "absolute", left: 42, top: 638 - T0, ...small, fontSize: 9.2 }}>
        {F.consent.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 17, top: 703 - T0 }}>
        <Btn label={`${F.pay} ${trip.maxPay}`} w={359} h={46} scale={payPress} style={{ fontSize: 13.5 }} />
      </div>
      <div style={{ position: "absolute", left: 17, top: 755 - T0 }}>
        <Btn label={F.cancel} w={359} h={46} bg={C.card} style={{ fontSize: 13.5 }} />
      </div>
    </SheetBox>
  );
};

/** 07 / 08 / 08b backdrop: the map framed on the route, with the compact route pill. */
export const MapBackdrop: React.FC<{ f: number }> = ({ f }) => (
  <>
    <AppMap f={f} route={1} pin={1} view={{ dx: 0, dy: -110, z: 1 }} />
    <div style={{ position: "absolute", left: 17, top: 60, width: 36, height: 36, borderRadius: 99, background: C.white, boxShadow: "0 0 0 1px rgba(16,17,17,.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <I.chevronLeft size={18} color={C.ink} stroke={2.2} />
    </div>
    <RoutePill />
  </>
);

/* ================================================================== 08 · payment method (no Personal wallet row) */

const PAY_ICONS = () => [<I.card size={19} color={C.ink} stroke={1.8} />, <I.bank size={19} color={C.ink} stroke={1.8} />, <I.ussd size={19} color={C.ink} />, <I.building size={19} color={C.ink} stroke={1.8} />];

/** sel 0..1: green border + the green check fills (Card only, ever). */
export const PayRow: React.FC<{ i: number; sel: number; scale?: number }> = ({ i, sel, scale = 1 }) => {
  const icons = PAY_ICONS();
  const on = sel > 0;
  return (
    <div style={{ width: 359, height: 55, borderRadius: 14, background: C.white, boxShadow: `inset 0 0 0 ${on ? 2 : 1}px ${on ? C.priceGreen : C.border}`, display: "flex", alignItems: "center", padding: "0 14px 0 16px", gap: 12, fontFamily, boxSizing: "border-box", transform: `scale(${scale})` }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: C.card, display: "flex", alignItems: "center", justifyContent: "center" }}>{icons[i]}</div>
      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.ink }}>{app.pay.methods[i]}</div>
      <div style={{ position: "relative", width: 20, height: 20, borderRadius: 99, boxShadow: `inset 0 0 0 1.5px ${on ? C.priceGreen : "#D6D8D6"}` }}>
        {on ? (
          <div style={{ position: "absolute", left: 10 - 10 * sel, top: 10 - 10 * sel, width: 20 * sel, height: 20 * sel, borderRadius: 99, background: C.priceGreen, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {sel > 0.6 ? <I.check size={13} color={C.white} stroke={3} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const PaySheet: React.FC<{ secs: number; cardSel: number; cardPress?: number; contPress?: number }> = ({ secs, cardSel, cardPress = 1, contPress = 1 }) => {
  const P = app.pay;
  const T0 = POS.payTop;
  return (
    <SheetBox top={T0} grabber={false}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 221 - T0, textAlign: "center", fontFamily, fontSize: 16, fontWeight: 700, color: C.ink }}>{P.title}</div>
      <div style={{ position: "absolute", right: 22, top: 220 - T0 }}>
        <I.close size={22} color={C.ink} stroke={2} />
      </div>
      <div style={{ position: "absolute", left: 196.5 - 82, top: 273 - T0, width: 164, height: 44, borderRadius: 99, background: C.mint, display: "flex", alignItems: "center", justifyContent: "center", fontFamily, fontSize: 23, fontWeight: 700, color: C.priceGreen, fontVariantNumeric: "tabular-nums" }}>{trip.maxPay}</div>
      <div style={{ position: "absolute", left: 17, top: 331 - T0, width: 359, height: 34, borderRadius: 10, background: C.card, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", boxSizing: "border-box", fontFamily }}>
        <span style={{ fontSize: 11.5, fontWeight: 500, color: "#5d615f" }}>{P.finishIn}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`}</span>
      </div>
      {P.methods.map((m, i) => (
        <div key={m} style={{ position: "absolute", left: 17, top: 381 - T0 + i * 66 }}>
          <PayRow i={i} sel={i === 0 ? cardSel : 0} scale={i === 0 ? cardPress : 1} />
        </div>
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 728 - T0, height: 1, background: "#EFF0EF" }} />
      <div style={{ position: "absolute", left: 17, top: 743 - T0 }}>
        <Btn label={P.cta} w={359} h={55} scale={contPress} />
      </div>
    </SheetBox>
  );
};

/** ScreenCheck / preview helper: 08 as a whole screen. */
export const PayScreen: React.FC<{ f: number; sheetY: number }> = ({ f, sheetY }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
    <MapBackdrop f={f} />
    <div style={{ position: "absolute", inset: 0, background: "rgba(16,17,17,0.28)" }} />
    <div style={{ position: "absolute", left: 0, top: sheetY, width: 393, height: 852 }}>
      <PaySheet secs={app.pay.countdownFrom} cardSel={1} />
    </div>
  </div>
);

/* ================================================================== 08b · completing your payment */

export const CompletingSheets: React.FC<{ spin: number; k: number }> = ({ spin, k }) => {
  const C8 = app.completing;
  const up = clamp(k);
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: (1 - up) * 400, width: 393, height: 852 }}>
        <SheetBox top={468}>
          <div style={{ position: "absolute", left: 20, top: 33, fontFamily, fontSize: 14.5, fontWeight: 700, color: C.ink }}>{C8.title}</div>
          <div style={{ position: "absolute", left: 20, top: 55, width: 320, fontFamily, fontSize: 10.5, fontWeight: 500, color: C.muted, lineHeight: 1.35 }}>{C8.sub}</div>
          <div style={{ position: "absolute", left: 20, right: 20, top: 104, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#4B4F4D" }}>{C8.toPay}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.priceGreen, fontVariantNumeric: "tabular-nums" }}>{trip.maxPay}</span>
          </div>
        </SheetBox>
      </div>
      <div style={{ position: "absolute", left: 0, top: (1 - up) * 300, width: 393, height: 852 }}>
        <SheetBox top={598} grabber={false}>
          <div style={{ position: "absolute", right: 22, top: 24 }}>
            <I.close size={22} color={C.ink} stroke={2} />
          </div>
          <div style={{ position: "absolute", left: 196.5 - 11, top: 99 }}>
            <Spinner size={22} t={spin} color={C.priceGreen} stroke={3} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 165, textAlign: "center", fontFamily, fontSize: 16.5, fontWeight: 700, color: C.ink }}>{C8.spinTitle}</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 193, textAlign: "center", fontFamily, fontSize: 12, fontWeight: 500, color: C.muted, lineHeight: 1.4 }}>
            {C8.spinSub.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
        </SheetBox>
      </div>
    </>
  );
};

/* ================================================================== 10 · Your Pod is booked (flat popper) */

const POP = { cone: "#193440", pink: "#FFA9EB", green: "#79EDB1", mint: "#A6F5CD", blue: "#66D1FF", yellow: "#FFDE3D", lilac: "#8E8EF1" };

/** The party popper as flat shapes: cone and ribbons hold still; shapes slide in from the mouth. No particles. */
const Popper: React.FC<{ shapes: number }> = ({ shapes }) => {
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
    <svg width={393} height={480} style={{ position: "absolute", left: 0, top: 40 }}>
      <path d="M60 300 C 40 220 110 190 90 120 C 76 70 120 40 150 60" fill="none" stroke={POP.pink} strokeWidth={16} strokeLinecap="round" />
      <path d="M170 310 C 200 240 260 280 280 220 C 296 170 340 180 360 140" fill="none" stroke={POP.green} strokeWidth={14} strokeLinecap="round" />
      <path d="M120 360 C 180 360 220 420 300 400" fill="none" stroke={POP.blue} strokeWidth={12} strokeLinecap="round" />
      {pieces.map((p, i) => {
        const q = clamp(k * 1.3 - i * 0.06);
        return q > 0 ? (
          <g key={i} transform={`translate(${mix(mouth.x, p.x, q).toFixed(1)} ${mix(mouth.y, p.y, q).toFixed(1)})`}>
            {p.el}
          </g>
        ) : null;
      })}
      <path d="M-30 480 L-60 420 L150 300 L190 360 Z" fill={POP.cone} />
      <path d="M30 450 L5 400 L50 375 L78 425 Z" fill={POP.green} />
      <path d="M110 405 L85 355 L120 335 L148 385 Z" fill={POP.mint} />
    </svg>
  );
};

export const PodBookedScreen: React.FC<{ shapes: number }> = ({ shapes }) => {
  const B = app.booked;
  return (
    <div style={{ position: "absolute", inset: 0, background: C.white, fontFamily, overflow: "hidden" }}>
      <Popper shapes={shapes} />
      <div style={{ position: "absolute", right: 22, top: 82 }}>
        <I.close size={22} color={C.ink} stroke={2} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 554, textAlign: "center", fontSize: 23, fontWeight: 700, color: C.ink, letterSpacing: -0.3 }}>{B.title}</div>
      <div style={{ position: "absolute", left: 28, right: 28, top: 593, textAlign: "center", fontSize: 13.5, fontWeight: 500, color: "#5d615f", lineHeight: 1.5 }}>
        {B.body.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 17, top: 748 }}>
        <Btn label={B.cta} w={359} h={50} style={{ fontSize: 14 }} />
      </div>
    </div>
  );
};

/* ================================================================== 09 · payment successful (over the dimmed popper) */

export const SuccessScreen: React.FC<{ ring: number; fill: number; check: number }> = ({ ring, fill, check }) => {
  const S = app.success;
  const cx = 196.5;
  const cy = 618;
  const r = 21;
  const sw = mix(2.5, r, clamp(fill));
  const rr = r - sw / 2;
  const circle = `M ${cx} ${cy - rr} A ${rr} ${rr} 0 1 1 ${cx - 0.01} ${cy - rr}`;
  const tick = `M ${cx - 9} ${cy + 0.5} L ${cx - 2.5} ${cy + 7} L ${cx + 10} ${cy - 6}`;
  const er = evolvePath(clamp(ring, 0.0001, 1), circle);
  const ec = evolvePath(clamp(check, 0.0001, 1), tick);
  return (
    <div style={{ position: "absolute", inset: 0, background: C.white, overflow: "hidden" }}>
      <Popper shapes={1} />
      <div style={{ position: "absolute", right: 22, top: 82 }}>
        <I.close size={22} color={C.ink} stroke={2} />
      </div>
      <div style={{ position: "absolute", inset: 0, background: "rgba(16,17,17,0.32)" }} />
      <SheetBox top={495} grabber={false}>
        <div style={{ position: "absolute", right: 22, top: 26 }}>
          <I.close size={22} color={C.ink} stroke={2} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 166, textAlign: "center", fontFamily, fontSize: 16.5, fontWeight: 700, color: C.ink }}>{S.title}</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 195, textAlign: "center", fontFamily, fontSize: 12.5, fontWeight: 500, color: C.muted }}>{S.sub}</div>
        <div style={{ position: "absolute", left: 17, top: 247 }}>
          <Btn label={S.cta} w={359} h={55} />
        </div>
      </SheetBox>
      <svg width={393} height={852} style={{ position: "absolute", left: 0, top: 0 }}>
        {ring > 0 ? <path d={circle} fill="none" stroke={C.successTeal} strokeWidth={sw} strokeDasharray={er.strokeDasharray} strokeDashoffset={er.strokeDashoffset} /> : null}
        {check > 0 ? <path d={tick} fill="none" stroke={fill >= 0.5 ? C.white : C.successTeal} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={ec.strokeDasharray} strokeDashoffset={ec.strokeDashoffset} /> : null}
      </svg>
    </div>
  );
};

/* ================================================================== 11 · Finding your Pod */

export const FindingPodScreen: React.FC<{ f: number; progress: number }> = ({ f, progress }) => {
  const F = app.finding;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", fontFamily }}>
      <AppMap f={f} route={1} pin={1} view={{ dx: -40, dy: 40, z: 1.25 }} />
      <div style={{ position: "absolute", left: 17, top: 60, width: 36, height: 36, borderRadius: 99, background: C.white, boxShadow: "0 0 0 1px rgba(16,17,17,.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <I.chevronLeft size={18} color={C.ink} stroke={2.2} />
      </div>
      <RoutePill />
      <SheetBox top={470}>
        <div style={{ position: "absolute", left: 17, top: 33, fontSize: 15.5, fontWeight: 700, color: C.ink }}>{F.title}</div>
        <div style={{ position: "absolute", left: 17, right: 24, top: 55, fontSize: 11, fontWeight: 500, color: "#5d615f", lineHeight: 1.4 }}>
          {trip.pickup} → {trip.dropoff}
        </div>
        <div style={{ position: "absolute", left: 17, top: 93, width: 359, height: 7, borderRadius: 99, background: "#D4D4D8", overflow: "hidden" }}>
          <div style={{ width: `${(clamp(progress) * 100).toFixed(2)}%`, height: 7, borderRadius: 99, background: C.priceGreen }} />
        </div>
        <div style={{ position: "absolute", left: 17, top: 126, width: 359, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: "#4B4F4D" }}>{F.quoted}</span>
          <span style={{ fontSize: 19, fontWeight: 700, color: C.priceGreen, fontVariantNumeric: "tabular-nums" }}>{trip.podPrice}</span>
        </div>
        <div style={{ position: "absolute", left: 17, top: 156, fontSize: 10.5, fontWeight: 500, color: C.muted }}>{F.govt}</div>
        <div style={{ position: "absolute", left: 17, top: 195 }}>
          <Btn label={F.cancel} w={89} h={43} bg={C.card} style={{ fontSize: 13.5 }} />
        </div>
      </SheetBox>
    </div>
  );
};

/* ================================================================== push (inside the phone) */

/** iOS push: new 100% → 0, old 0 → −30%. No dimming. `vertical`: a modal sliding up over the old screen (which stays). */
export const Push: React.FC<{ p: number; from: React.ReactNode; to: React.ReactNode; vertical?: boolean }> = ({ p, from, to, vertical = false }) => {
  if (p <= 0) return <>{from}</>;
  if (p >= 1) return <>{to}</>;
  if (vertical)
    return (
      <>
        <div style={{ position: "absolute", inset: 0 }}>{from}</div>
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${((1 - p) * 852).toFixed(2)}px)` }}>{to}</div>
      </>
    );
  return (
    <>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${(-0.3 * p * 393).toFixed(2)}px)` }}>{from}</div>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${((1 - p) * 393).toFixed(2)}px)` }}>{to}</div>
    </>
  );
};

/* ================================================================== lift-out pieces */

/** The route card's destination row, as a standalone piece (S6 lift-out). */
export const DestRow: React.FC = () => (
  <div style={{ width: 358, height: 50, borderRadius: 14, background: C.white, boxShadow: `inset 0 0 0 1px ${C.border}`, display: "flex", alignItems: "center", gap: 12, padding: "0 16px", boxSizing: "border-box", fontFamily }}>
    <Dot color={C.indigo} />
    <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, flex: 1, whiteSpace: "nowrap" }}>{trip.dropoff}</span>
    <span style={{ fontSize: 13, fontWeight: 600, color: C.linkGreen }}>{app.map.change}</span>
  </div>
);

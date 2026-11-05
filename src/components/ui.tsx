import React from "react";
import { C, fontFamily, glow } from "../config/brand";
import { I } from "./Icons";
import { Asset } from "./core";

// App UI kit rebuilt from the reference screenshots (all units are app points, 393-wide screen).

export type BtnState = "default" | "pressed" | "loading" | "disabled";

export const Button: React.FC<{ label: string; w?: number; h?: number; state?: BtnState; tone?: "cta" | "grey"; scale?: number; fill?: number; style?: React.CSSProperties; spin?: number }> = ({ label, w = 353, h = 52, state = "default", tone = "cta", scale = 1, fill, style, spin = 0 }) => {
  const disabled = state === "disabled";
  const ctaBg = fill !== undefined ? mixHex(C.card, C.ctaGreen, fill) : C.ctaGreen;
  const bg = tone === "grey" || disabled ? (fill !== undefined && tone === "cta" ? ctaBg : C.card) : ctaBg;
  const fg = disabled && (fill === undefined || fill < 0.5) ? "#A5A9A7" : C.ink;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 14,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
        fontWeight: 600,
        fontSize: 16,
        color: fg,
        transform: `scale(${state === "pressed" ? 0.96 : scale})`,
        filter: state === "pressed" ? "brightness(0.94)" : undefined,
        ...style,
      }}
    >
      {state === "loading" ? <Spinner size={22} color={C.ink} t={spin} /> : label}
    </div>
  );
};

export const Spinner: React.FC<{ size?: number; color?: string; t?: number; stroke?: number }> = ({ size = 18, color = C.priceGreen, t = 0, stroke = 2.4 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `rotate(${t * 18}deg)`, display: "block" }}>
    <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={stroke} />
    <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
  </svg>
);

export const Chip: React.FC<{ label: string; count?: number | null; selected?: boolean; style?: React.CSSProperties; countNode?: React.ReactNode }> = ({ label, count, selected = false, style, countNode }) => (
  <div
    style={{
      height: 30,
      padding: "0 12px",
      borderRadius: 999,
      background: selected ? C.priceGreen : C.card,
      color: selected ? C.white : C.ink,
      display: "flex",
      alignItems: "center",
      gap: 7,
      fontFamily,
      fontSize: 12.5,
      fontWeight: 600,
      whiteSpace: "nowrap",
      flexShrink: 0,
      ...style,
    }}
  >
    {label}
    {count !== undefined && count !== null ? <span style={{ fontSize: 10.5, fontWeight: 500, opacity: selected ? 0.9 : 0.55, fontVariantNumeric: "tabular-nums" }}>{countNode ?? count}</span> : null}
  </div>
);

export const IconCircle: React.FC<{ size?: number; bg?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ size = 32, bg = C.card, children, style }) => (
  <div style={{ width: size, height: size, borderRadius: 999, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, ...style }}>{children}</div>
);

export const RingDot: React.FC<{ color: string; size?: number; style?: React.CSSProperties }> = ({ color, size = 12, style }) => (
  <div style={{ width: size, height: size, borderRadius: 999, border: `${size * 0.28}px solid ${color}`, background: "#fff", boxSizing: "border-box", flexShrink: 0, ...style }} />
);

export const Grabber: React.FC<{ top?: number }> = ({ top = 9 }) => <div style={{ position: "absolute", left: 196.5 - 18, top, width: 36, height: 4.5, borderRadius: 9, background: "#D9DBDA" }} />;

export const Sheet: React.FC<{ top: number; children: React.ReactNode; shadow?: boolean; style?: React.CSSProperties }> = ({ top, children, shadow = true, style }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top,
      width: 393,
      height: 852 - top + 200,
      background: C.white,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      boxShadow: shadow ? "0 -8px 30px rgba(16,17,17,.10)" : undefined,
      ...style,
    }}
  >
    {children}
  </div>
);

/* ------------------------------------------------ home */

export type CardState = { hi?: number; dim?: number; ghost?: boolean; press?: number; lifted?: boolean };

export const ServiceCard: React.FC<{ kind: "daily" | "pod" | "rent"; title: string; sub: string; badge?: string; state?: CardState; badgeRot?: number; badgeScale?: number; onWhite?: boolean }> = ({ kind, title, sub, badge, state = {}, badgeRot = 0, badgeScale = 1 }) => {
  const { hi = 0, dim = 0, ghost = false, press = 1, lifted = false } = state;
  const img = {
    daily: { src: "vehicles/app-daily-bus-onbg.png", w: 98, top: 22 },
    pod: { src: "vehicles/app-pod-car-onbg.png", w: 96, top: 30 },
    rent: { src: "vehicles/app-rent-tag-onbg.png", w: 50, top: 14 },
  }[kind];
  return (
    <div
      style={{
        width: 112,
        height: 138,
        borderRadius: 16,
        background: C.card,
        position: "relative",
        opacity: ghost ? 0.2 : 1 - dim * 0.5,
        filter: dim > 0.01 ? `blur(${dim * 3}px)` : undefined,
        transform: `scale(${(1 + hi * 0.04) * press})`,
        boxShadow: hi > 0.01 ? `0 0 ${22 * hi}px rgba(32,230,130,${0.55 * hi}), 0 0 0 ${2 * hi}px rgba(32,230,130,${0.8 * hi})` : lifted ? "0 1px 2px rgba(16,17,17,.06), 0 10px 30px rgba(16,17,17,.08), 0 40px 80px rgba(16,17,17,.10)" : undefined,
        fontFamily,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: (112 - img.w) / 2, top: img.top }}>
        <Asset src={img.src} w={img.w} />
      </div>
      {badge ? (
        <div
          style={{
            position: "absolute",
            right: 7,
            top: 8,
            height: 15,
            padding: "0 6px",
            borderRadius: 4,
            background: C.indigo,
            color: C.white,
            fontSize: 8.5,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            transform: `rotate(${badgeRot}deg) scale(${badgeScale})`,
          }}
        >
          {badge}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 100, textAlign: "center", fontSize: 13.5, fontWeight: 600, color: C.ink }}>{title}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 118, textAlign: "center", fontSize: 10, fontWeight: 500, color: C.muted }}>{sub}</div>
    </div>
  );
};

export const RecentHomeRow: React.FC<{ title: string; sub: string; code: string; time: string; divider?: boolean }> = ({ title, sub, code, time, divider = true }) => (
  <div style={{ height: 62, display: "flex", alignItems: "center", gap: 12, position: "relative", fontFamily, borderBottom: divider ? `1px solid ${C.card}` : undefined }}>
    <IconCircle size={30}>
      <I.history size={16} color={C.muted} />
    </IconCircle>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{title}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: C.muted, marginTop: 2 }}>{sub}</div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
      <div style={{ height: 22, padding: "0 8px", borderRadius: 6, background: C.card, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", color: C.ink }}>{code}</div>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{time}</div>
    </div>
  </div>
);

/* ------------------------------------------------ search / plan */

export const PlaceRow: React.FC<{ icon: "history" | "pin" | "bus"; title: string; sub: string; tag?: string; hi?: number; h?: number }> = ({ icon, title, sub, tag, hi = 0, h = 56 }) => (
  <div style={{ height: h, display: "flex", alignItems: "center", gap: 12, fontFamily, borderBottom: `1px solid ${C.card}`, position: "relative", background: hi > 0 ? `rgba(16,17,17,${0.06 * hi})` : undefined, margin: "0 -17px", padding: "0 17px" }}>
    {icon === "history" ? (
      <IconCircle size={30}>
        <I.history size={16} color={C.muted} />
      </IconCircle>
    ) : icon === "pin" ? (
      <IconCircle size={30} bg={C.pinPink}>
        <I.mapPin size={16} color={C.pinRed} />
      </IconCircle>
    ) : (
      <IconCircle size={30} bg={C.mintPill}>
        <I.bus size={16} color={C.brandGreen} />
      </IconCircle>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
      <div style={{ fontSize: 11.5, fontWeight: 500, color: C.muted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>
    </div>
    {tag ? <div style={{ height: 19, padding: "0 7px", borderRadius: 5, background: C.card, fontSize: 9.5, fontWeight: 600, color: "#4b4f4d", display: "flex", alignItems: "center" }}>{tag}</div> : null}
  </div>
);

/* ------------------------------------------------ ride options */

export type RowState = "default" | "selected" | "disabled" | "skeleton";

export const RideOptionRow: React.FC<{
  kind: "daily" | "pod" | "rent";
  title: string;
  sub: string;
  price?: React.ReactNode;
  unit?: string;
  state?: RowState;
  sel?: number; // 0..1 selection progress
  hop?: number;
  spin?: number;
  ghost?: boolean;
  lifted?: boolean;
}> = ({ kind, title, sub, price, unit, state = "default", sel = 0, hop = 0, spin = 0, ghost = false, lifted = false }) => {
  if (state === "skeleton") {
    return (
      <div style={{ width: 358, height: 68, borderRadius: 16, background: C.card, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size={14} t={spin} />
      </div>
    );
  }
  const s = state === "selected" ? 1 : sel;
  const img = {
    daily: { src: "vehicles/app-daily-bus-onwhite.png", w: 64 },
    pod: { src: "vehicles/app-pod-car.png", w: 62 },
    rent: { src: "vehicles/app-rent-tag-onwhite.png", w: 34 },
  }[kind];
  return (
    <div
      style={{
        width: 358,
        height: 68,
        borderRadius: 16,
        background: C.white,
        boxSizing: "border-box",
        border: `${1 + s}px solid ${s > 0.5 ? C.linkGreen : C.border}`,
        position: "relative",
        overflow: "hidden",
        fontFamily,
        display: "flex",
        alignItems: "center",
        opacity: ghost ? 0.2 : state === "disabled" ? 0.45 : 1,
        boxShadow: lifted ? "0 1px 2px rgba(16,17,17,.06), 0 10px 30px rgba(16,17,17,.08), 0 40px 80px rgba(16,17,17,.10)" : undefined,
      }}
    >
      {/* capsule selection fill slides in from the left */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${s * 100}%`, background: C.mint, borderRadius: 14 }} />
      <div style={{ position: "relative", width: 86, display: "flex", justifyContent: "center", transform: `translateY(${-hop}px)` }}>
        <Asset src={img.src} w={img.w} style={kind === "daily" || kind === "rent" ? { mixBlendMode: "multiply" } : undefined} />
      </div>
      <div style={{ position: "relative", flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{title}</div>
        <div style={{ fontSize: 11.5, fontWeight: 500, color: C.muted, marginTop: 2 }}>{sub}</div>
      </div>
      {price ? (
        <div style={{ position: "relative", textAlign: "right", paddingRight: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{price}</div>
          <div style={{ fontSize: 9.5, fontWeight: 500, color: C.muted }}>{unit}</div>
        </div>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------ payment */

export const PayMethodRow: React.FC<{ icon: React.ReactNode; label: string; sel?: number; press?: number }> = ({ icon, label, sel = 0, press = 1 }) => (
  <div style={{ width: 353, height: 57, borderRadius: 14, border: `1px solid ${sel > 0.5 ? C.linkGreen : C.border}`, boxSizing: "border-box", display: "flex", alignItems: "center", padding: "0 16px", gap: 12, fontFamily, background: C.white, transform: `scale(${press})` }}>
    <div style={{ width: 36, height: 36, borderRadius: 9, background: C.card, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
    <div style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: C.ink }}>{label}</div>
    <div style={{ width: 20, height: 20, borderRadius: 99, border: `1.5px solid ${sel > 0 ? C.linkGreen : "#C9CCCA"}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 11 * sel, height: 11 * sel, borderRadius: 99, background: C.linkGreen }} />
    </div>
  </div>
);

export const ProgressBar: React.FC<{ p: number; w?: number; h?: number }> = ({ p, w = 353, h = 7 }) => (
  <div style={{ width: w, height: h, borderRadius: 99, background: C.track, overflow: "hidden" }}>
    <div style={{ width: `${Math.max(0, Math.min(1, p)) * 100}%`, height: h, borderRadius: 99, background: C.priceGreen }} />
  </div>
);

export const ShieldBadge: React.FC<{ text: string; w?: number; style?: React.CSSProperties }> = ({ text, w = 353, style }) => (
  <div style={{ width: w, height: 44, borderRadius: 12, background: C.mintPill, display: "flex", alignItems: "center", gap: 10, padding: "0 14px", boxSizing: "border-box", fontFamily, ...style }}>
    <I.shield size={20} color={C.priceGreen} stroke={2.2} />
    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>{text}</div>
  </div>
);

/* ------------------------------------------------ helpers */

export function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const m = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * Math.max(0, Math.min(1, t)));
  return `rgb(${m(16)},${m(8)},${m(0)})`;
}

export const glowGreen = (a: number) => glow(C.brandGreen, a);

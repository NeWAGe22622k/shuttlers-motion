import React from "react";
import { C, fontFamily } from "../config/brand";
import { content } from "../config/content";
import { I } from "../components/Icons";
import { Asset } from "../components/core";
import { MapView, StylisedMap } from "../components/StylisedMap";
import { Button, BtnState, Grabber, PayMethodRow, RideOptionRow, RingDot, RowState, Sheet } from "../components/ui";
import { mix } from "../components/motion";

const TR = content.trip;

export const VIEWS: Record<string, MapView> = {
  options: { cx: 196, cy: 449, zoom: 0.62 },
  fare: { cx: 196, cy: 732, zoom: 0.5 },
  finding: { cx: 196, cy: 436, zoom: 1.0 },
};

export const lerpView = (a: MapView, b: MapView, t: number): MapView => ({
  cx: mix(a.cx, b.cx, t),
  cy: mix(a.cy, b.cy, t),
  zoom: a.zoom * Math.pow(b.zoom / a.zoom, t),
});

/* ------------------------------------------------ map stage (05/06 → 07/08/11) */

export type MapStageState = {
  view: MapView;
  compact: number; // 0 = big route card (05/06), 1 = compact route pill (07/08/11)
  routeP: number;
  pickupS: number;
  dropS: number;
  distChip: number;
  car?: { t: number; opacity: number } | null;
  radar?: number[];
  dim?: number;
};

export const MapStage: React.FC<{ st: MapStageState }> = ({ st }) => {
  const k = st.compact;
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily }}>
      <StylisedMap w={393} h={852} view={st.view} route={st.routeP} pickup={st.pickupS} drop={st.dropS} car={st.car ?? null} radar={st.radar ?? []} />
      {/* back button */}
      <div style={{ position: "absolute", left: 17, top: mix(66, 52, k), width: 42, height: 42, borderRadius: 99, background: C.white, boxShadow: "0 2px 10px rgba(16,17,17,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {k > 0.5 ? <I.chevronLeft size={20} color={C.ink} stroke={2.2} /> : <I.arrowLeft size={21} color={C.ink} stroke={2.2} />}
      </div>
      {/* big route card */}
      {k < 1 ? (
        <div style={{ position: "absolute", left: 17, top: 120, width: 358, height: 132, borderRadius: 16, background: C.white, boxShadow: "0 4px 18px rgba(16,17,17,.12)", opacity: 1 - k, transform: `translateY(${-k * 16}px) scaleY(${1 - k * 0.3})`, transformOrigin: "50% 0%" }}>
          <div style={{ position: "absolute", left: 16, top: 13, right: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <RingDot color={C.priceGreen} size={12} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, flex: 1, whiteSpace: "nowrap" }}>{TR.pickup}</span>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: C.linkGreen }}>{TR.change}</span>
          </div>
          <div style={{ position: "absolute", left: 21, top: 36, width: 1.5, height: 18, background: C.border }} />
          <div style={{ position: "absolute", left: 16, top: 58, right: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <RingDot color={C.indigo} size={12} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{TR.dropoff}</span>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: C.linkGreen }}>{TR.change}</span>
          </div>
          <div style={{ position: "absolute", left: 8, top: 89, height: 32, padding: "0 11px", borderRadius: 99, background: C.card, display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: C.ink }}>
            <I.clock size={16} color={C.ink} stroke={1.8} />
            {TR.leaving}
            <I.chevronDown size={13} color={C.ink} />
          </div>
        </div>
      ) : null}
      {/* compact route pill */}
      {k > 0 ? (
        <div style={{ position: "absolute", left: 17, top: 103, width: 358, height: 36, borderRadius: 10, background: C.white, boxShadow: "0 3px 12px rgba(16,17,17,.12)", display: "flex", alignItems: "center", gap: 8, padding: "0 12px", boxSizing: "border-box", opacity: k, fontSize: 11.5, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>
          <RingDot color={C.priceGreen} size={12} />
          <span style={{ width: 128, overflow: "hidden", textOverflow: "ellipsis" }}>{TR.pickup}</span>
          <div style={{ width: 18, height: 18, borderRadius: 99, border: `1px solid #C9CCCA`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <I.arrowRight size={11} color={C.muted} stroke={2} />
          </div>
          <RingDot color={C.indigo} size={12} />
          <span style={{ width: 128, overflow: "hidden", textOverflow: "ellipsis" }}>{TR.dropoff}</span>
        </div>
      ) : null}
      {/* distance chip */}
      {st.distChip > 0.01 ? (
        <div style={{ position: "absolute", left: 268, top: 381, height: 31, padding: "0 12px", borderRadius: 99, background: C.white, boxShadow: "0 2px 10px rgba(16,17,17,.15)", display: "flex", alignItems: "center", fontSize: 12.5, fontWeight: 600, color: C.ink, transform: `scale(${st.distChip})`, transformOrigin: "100% 50%", opacity: Math.min(1, st.distChip * 2), fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{TR.distance}</div>
      ) : null}
      {st.dim ? <div style={{ position: "absolute", inset: 0, background: `rgba(16,17,17,${st.dim})` }} /> : null}
    </div>
  );
};

/* ------------------------------------------------ ride options sheet (05/06) */

export const OPTION_ROW_Y = [24, 101, 178]; // relative to sheet top (427)
export const OPTIONS_SHEET_TOP = 427;

export const OptionsSheet: React.FC<{
  top?: number;
  rowState: RowState[];
  rowIn: number[]; // resolve progress per row
  prices: React.ReactNode[];
  sel: number;
  hop: number;
  spin: number;
  ghostPod?: boolean;
  cont?: BtnState;
}> = ({ top = OPTIONS_SHEET_TOP, rowState, rowIn, prices, sel, hop, spin, ghostPod = false, cont = "default" }) => {
  const rows = [
    { kind: "daily" as const, ...TR.daily, price: prices[0], unit: TR.daily.unit },
    { kind: "pod" as const, ...TR.podSolo, price: prices[1], unit: TR.podSolo.unit },
    { kind: "rent" as const, ...TR.rent, price: undefined, unit: undefined },
  ];
  return (
    <Sheet top={top}>
      <Grabber />
      {rows.map((r, i) => (
        <div key={i} style={{ position: "absolute", left: 17, top: OPTION_ROW_Y[i] }}>
          {rowState[i] === "skeleton" || rowIn[i] < 1 ? (
            <div style={{ position: "absolute", opacity: 1 - rowIn[i] }}>
              <RideOptionRow kind={r.kind} title="" sub="" state="skeleton" spin={spin + i * 3} />
            </div>
          ) : null}
          {rowIn[i] > 0 ? (
            <div style={{ opacity: rowIn[i], transform: `translateY(${(1 - rowIn[i]) * 8}px)` }}>
              <RideOptionRow kind={r.kind} title={r.title} sub={r.sub} price={r.price} unit={r.unit} sel={i === 1 ? sel : 0} hop={i === 1 ? hop : 0} ghost={i === 1 && ghostPod} />
            </div>
          ) : null}
        </div>
      ))}
      <div style={{ position: "absolute", left: 17, top: 322 }}>
        <Button label={TR.continue} w={358} h={56} state={cont} />
      </div>
    </Sheet>
  );
};

/* ------------------------------------------------ fare summary sheet (07) */

export const FARE_SHEET_TOP = 293;
export const FARE_MAXROW_Y = 222; // "Most you will pay" row, relative to sheet

export const FareSheet: React.FC<{ top?: number; maxPay: React.ReactNode; lock?: number; pulse?: number; ghostMax?: boolean; pay?: BtnState }> = ({ top = FARE_SHEET_TOP, maxPay, lock = 0, pulse = 0, ghostMax = false, pay = "default" }) => {
  const rows: [string, string][] = [
    [TR.fareRows[0], TR.pickup],
    [TR.fareRows[1], TR.dropoff],
    [TR.fareRows[2], TR.podPrice],
    [TR.fareRows[3], TR.held],
  ];
  return (
    <Sheet top={top}>
      <Grabber />
      <div style={{ position: "absolute", left: 20, top: 36, fontFamily }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{TR.podSolo.title}</div>
        <div style={{ fontSize: 11.5, fontWeight: 500, color: C.muted, marginTop: 3 }}>{TR.distanceShort}</div>
      </div>
      <div style={{ position: "absolute", left: 270, top: 28 }}>
        <Asset src="vehicles/app-pod-car-large.png" w={104} />
      </div>
      {rows.map(([l, v], i) => (
        <div key={l} style={{ position: "absolute", left: 20, right: 20, top: 98 + i * 26, display: "flex", justifyContent: "space-between", fontFamily, fontSize: 13, gap: 20 }}>
          <span style={{ color: C.muted, fontWeight: 500, whiteSpace: "nowrap" }}>{l}</span>
          <span style={{ color: C.ink, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontVariantNumeric: "tabular-nums" }}>{v}</span>
        </div>
      ))}
      <MaxPayRow maxPay={maxPay} lock={lock} pulse={pulse} style={{ position: "absolute", left: 20, top: FARE_MAXROW_Y, opacity: ghostMax ? 0.2 : 1 }} />
      <div style={{ position: "absolute", left: 20, top: 302 }}>
        <Button label={`${TR.pay} ${TR.maxPay}`} w={353} h={46} state={pay} style={{ fontSize: 14 }} />
      </div>
      <div style={{ position: "absolute", left: 20, top: 356 }}>
        <Button label={TR.cancel} w={353} h={44} tone="grey" style={{ fontSize: 14 }} />
      </div>
    </Sheet>
  );
};

export const MaxPayRow: React.FC<{ maxPay: React.ReactNode; lock?: number; pulse?: number; style?: React.CSSProperties; bg?: boolean }> = ({ maxPay, lock = 0, pulse = 0, style, bg = false }) => (
  <div style={{ width: 353, height: 40, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily, boxSizing: "border-box", background: bg ? C.white : undefined, borderRadius: bg ? 14 : 0, padding: bg ? "0 16px" : 0, ...style }}>
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: C.ink }}>
      {TR.mostYouPay}
      {lock > 0.01 ? (
        <span style={{ display: "inline-flex", transform: `translateY(${(1 - Math.min(1, lock)) * -26}px) scale(${lock})`, opacity: Math.min(1, lock * 2) }}>
          <I.lock size={16} color={C.priceGreen} stroke={2.2} />
        </span>
      ) : null}
    </span>
    <span style={{ fontSize: 20, fontWeight: 700, color: C.priceGreen, transform: `scale(${1 + pulse * 0.08})`, transformOrigin: "100% 50%", textShadow: pulse > 0.01 ? `0 0 ${18 * pulse}px rgba(13,172,92,${0.5 * pulse})` : undefined }}>{maxPay}</span>
  </div>
);

/* ------------------------------------------------ payment sheet (08) */

export const PAY_SHEET_TOP = 197;

export const PaymentSheet: React.FC<{ top?: number; rowsIn: number[]; countdown: string; sel: number; cardPress?: number; contFill: number; cont?: BtnState }> = ({ top = PAY_SHEET_TOP, rowsIn, countdown, sel, cardPress = 1, contFill, cont = "default" }) => {
  const icons = [<I.card size={19} color={C.ink} stroke={1.8} />, <I.bank size={19} color={C.ink} stroke={1.8} />, <I.ussd size={19} color={C.ink} />, <I.building size={19} color={C.ink} stroke={1.8} />];
  return (
    <Sheet top={top}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 26, textAlign: "center", fontFamily, fontSize: 16.5, fontWeight: 700, color: C.ink }}>{content.s7.sheetTitle}</div>
      <div style={{ position: "absolute", right: 22, top: 24 }}>
        <I.close size={22} color={C.ink} stroke={2} />
      </div>
      <div style={{ position: "absolute", left: 110, top: 74, width: 174, height: 46, borderRadius: 99, background: C.mintPill, display: "flex", alignItems: "center", justifyContent: "center", fontFamily, fontSize: 24, fontWeight: 700, color: C.priceGreen, fontVariantNumeric: "tabular-nums" }}>{TR.maxPay}</div>
      <div style={{ position: "absolute", left: 20, top: 134, width: 353, height: 38, borderRadius: 10, background: C.card, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", boxSizing: "border-box", fontFamily }}>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: "#5d615f" }}>{content.s7.finishIn}</span>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{countdown}</span>
      </div>
      {content.s7.methods.map((m, i) => (
        <div key={m} style={{ position: "absolute", left: 20, top: 184 + i * 66, opacity: rowsIn[i], transform: `translateY(${(1 - rowsIn[i]) * 14}px)` }}>
          <PayMethodRow icon={icons[i]} label={m} sel={i === 0 ? sel : 0} press={i === 0 ? cardPress : 1} />
        </div>
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 528, height: 1, background: "#EFF0EF" }} />
      <div style={{ position: "absolute", left: 20, top: 545 }}>
        <Button label={content.s7.continuePay} w={353} h={54} tone="cta" state={contFill < 0.5 ? "disabled" : cont} fill={contFill} />
      </div>
    </Sheet>
  );
};

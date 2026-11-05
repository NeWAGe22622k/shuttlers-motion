import React from "react";
import { C, fontFamily } from "../config/brand";
import { I } from "../components/Icons";
import { DROP, MapView, PICKUP, StylisedMap, worldToScreen } from "../components/StylisedMap";
import { Button, BtnState, Grabber, PayMethodRow, RideOptionRow, RingDot, Sheet } from "../components/ui";
import { mix } from "../components/motion";
import { V2_APP } from "./content";
import { Pin } from "./art";

// Video 2 phone screens (app points, 393×852), rebuilt with the copy from the Nov 2026 Pod Solo screenshots.
const A = V2_APP;
const VIEW: MapView = { cx: 196, cy: 449, zoom: 0.62 };

/** Route card (pickup is already "Current"; the drop-off fills in once the pin lands). */
export const RouteCard: React.FC<{ dropIn: number; typed?: number; caret?: boolean }> = ({ dropIn, typed, caret = false }) => (
  <div style={{ position: "absolute", left: 17, top: 120, width: 358, height: 132, borderRadius: 16, background: C.white, boxShadow: "0 4px 18px rgba(16,17,17,.12)", fontFamily }}>
    <div style={{ position: "absolute", left: 16, top: 13, right: 16, display: "flex", alignItems: "center", gap: 10 }}>
      <RingDot color={C.priceGreen} size={12} />
      <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{A.plan.pickup}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: C.brandGreen, whiteSpace: "nowrap" }}>{A.plan.current}</span>
    </div>
    <div style={{ position: "absolute", left: 21, top: 36, width: 1.5, height: 18, background: C.border }} />
    <div style={{ position: "absolute", left: 16, top: 58, right: 16, display: "flex", alignItems: "center", gap: 10 }}>
      <RingDot color={C.indigo} size={12} />
      <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", opacity: dropIn }}>
        {typed === undefined ? A.plan.dropoff : A.plan.dropoff.slice(0, Math.max(0, Math.floor(typed)))}
        {caret ? <span style={{ display: "inline-block", width: 1.6, height: 15, marginLeft: 1, verticalAlign: -2, background: C.indigo }} /> : null}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.linkGreen, opacity: dropIn }}>{A.plan.change}</span>
    </div>
    <div style={{ position: "absolute", left: 8, top: 89, height: 32, padding: "0 11px", borderRadius: 99, background: C.card, display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: C.ink }}>
      <I.clock size={16} color={C.ink} stroke={1.8} />
      {A.plan.leaving}
      <I.chevronDown size={13} color={C.ink} />
    </div>
  </div>
);

const BackButton: React.FC = () => (
  <div style={{ position: "absolute", left: 17, top: 66, width: 42, height: 42, borderRadius: 99, background: C.white, boxShadow: "0 2px 10px rgba(16,17,17,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <I.arrowLeft size={21} color={C.ink} stroke={2.2} />
  </div>
);

/** Step 2: pickup already set where you are; the destination pin drops with a soft thud. */
export const SetDestinationScreen: React.FC<{ pinK: number; route: number; ping: number; showPin?: boolean; typed?: number; caret?: boolean; hideCard?: boolean }> = ({ pinK, route, ping, showPin = true, typed, caret, hideCard = false }) => {
  const P = worldToScreen(PICKUP, VIEW, 393, 852);
  const D = worldToScreen(DROP, VIEW, 393, 852);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <StylisedMap w={393} h={852} view={VIEW} route={route > 0 ? route : -1} pickup={1} drop={0} radar={[ping, (ping + 0.5) % 1]} />
      {showPin && pinK > 0.001 ? (
        <div style={{ position: "absolute", left: D.x - 17, top: D.y - 44 - (1 - pinK) * 160, opacity: Math.min(1, pinK * 2) }}>
          <Pin size={34} fg={C.indigo} bg={C.white} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: P.x - 30, top: P.y + 10, fontFamily, fontSize: 10, fontWeight: 700, color: C.priceGreen, letterSpacing: 0.5 }}>{""}</div>
      <BackButton />
      {hideCard ? <RouteCardGhost /> : <RouteCard dropIn={Math.min(1, pinK * 1.5)} typed={typed} caret={caret} />}
    </div>
  );
};

/** The route card's slot while the card itself is lifted off the glass (20% ghost). */
const RouteCardGhost: React.FC = () => <div style={{ position: "absolute", left: 17, top: 120, width: 358, height: 132, borderRadius: 16, background: C.white, opacity: 0.2 }} />;

export const DEST_PIN = () => {
  const D = worldToScreen(DROP, VIEW, 393, 852);
  return { x: D.x, y: D.y };
};
export const PICKUP_PT = () => worldToScreen(PICKUP, VIEW, 393, 852);

/** Step 3: ride options — tap Pod Solo, then "Continue with Pod Solo" (two taps, two beats). */
export const RideOptionsScreen: React.FC<{ sel: number; cont: BtnState; rowsIn: number; ghostPod?: boolean; spin?: number; dimOthers?: number }> = ({ sel, cont, rowsIn, ghostPod = false, spin = 0, dimOthers = 0 }) => {
  const O = A.options;
  const rows = [
    <RideOptionRow key="d" kind="daily" title={O.daily.title} sub={O.daily.sub} state="disabled" />,
    <RideOptionRow key="p" kind="pod" title={O.podSolo.title} sub={O.podSolo.sub} price={O.podSolo.price} unit={O.podSolo.unit} sel={sel} ghost={ghostPod} />,
    <RideOptionRow key="s" kind="pod" title={O.podShared.title} sub={O.podShared.sub} state="disabled" />,
    <RideOptionRow key="r" kind="rent" title={O.rent.title} sub={O.rent.sub} />,
  ];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <StylisedMap w={393} h={852} view={VIEW} route={1} pickup={1} drop={1} />
      <BackButton />
      <RouteCard dropIn={1} />
      <div style={{ position: "absolute", left: 266, top: 381, height: 31, padding: "0 12px", borderRadius: 99, background: C.white, boxShadow: "0 2px 10px rgba(16,17,17,.15)", display: "flex", alignItems: "center", fontFamily, fontSize: 12.5, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>{O.distance}</div>
      <Sheet top={427}>
        <Grabber />
        {rows.map((r, i) => (
          <div key={i} style={{ position: "absolute", left: 17, top: 24 + i * 77, opacity: Math.min(1, Math.max(0, rowsIn * 4 - i)) * (i === 1 ? 1 : 1 - 0.55 * dimOthers), transform: `translateY(${(1 - Math.min(1, Math.max(0, rowsIn * 4 - i))) * 10}px)` }}>
            {r}
          </div>
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, height: 140, background: C.white }} />
        <div style={{ position: "absolute", left: 17, top: 322 }}>
          <Button label={O.cta} w={358} h={56} state={cont} fill={mix(0.55, 1, sel)} spin={spin} />
        </div>
      </Sheet>
    </div>
  );
};

/** Step 4: payment options flick past; one is tapped on the beat. */
export const PAY_ICONS = () => [<I.card size={19} color={C.ink} stroke={1.8} />, <I.bank size={19} color={C.ink} stroke={1.8} />, <I.ussd size={19} color={C.ink} />, <I.card size={19} color={C.ink} stroke={1.8} />, <I.building size={19} color={C.ink} stroke={1.8} />];

export const PaymentScreen: React.FC<{ hi: number; sel: number; cardPress: number; secs: number; cont: number; ghost?: number[] }> = ({ hi, sel, cardPress, secs, cont, ghost = [] }) => {
  const P = A.pay;
  const icons = [<I.card size={19} color={C.ink} stroke={1.8} />, <I.bank size={19} color={C.ink} stroke={1.8} />, <I.ussd size={19} color={C.ink} />, <I.card size={19} color={C.ink} stroke={1.8} />, <I.building size={19} color={C.ink} stroke={1.8} />];
  const countdown = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <StylisedMap w={393} h={852} view={{ cx: 196, cy: 732, zoom: 0.5 }} route={1} pickup={1} drop={1} dim={0.35} />
      <Sheet top={150}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 26, textAlign: "center", fontFamily, fontSize: 16.5, fontWeight: 700, color: C.ink }}>{P.title}</div>
        <div style={{ position: "absolute", right: 22, top: 24 }}>
          <I.close size={22} color={C.ink} stroke={2} />
        </div>
        <div style={{ position: "absolute", left: 110, top: 72, width: 174, height: 46, borderRadius: 99, background: C.mintPill, display: "flex", alignItems: "center", justifyContent: "center", fontFamily, fontSize: 24, fontWeight: 700, color: C.priceGreen, fontVariantNumeric: "tabular-nums" }}>{P.amount}</div>
        <div style={{ position: "absolute", left: 20, top: 132, width: 353, height: 38, borderRadius: 10, background: C.card, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", boxSizing: "border-box", fontFamily }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: "#5d615f" }}>{P.finishIn}</span>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{countdown}</span>
        </div>
        {P.methods.map((m, i) => {
          const h = Math.max(0, 1 - Math.abs(hi - i) * 1.4);
          return (
            <div key={m} style={{ position: "absolute", left: 20, top: 182 + i * 66, transform: `translateX(${h * 6}px)`, opacity: 1 - 0.8 * (ghost[i] ?? 0) }}>
              <div style={{ position: "absolute", inset: -3, borderRadius: 16, border: `2px solid ${C.linkGreen}`, opacity: h * 0.9 }} />
              <PayMethodRow icon={icons[i]} label={m} sel={i === 0 ? sel : 0} press={i === 0 ? cardPress : 1} />
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, right: 0, top: 528, height: 1, background: "#EFF0EF" }} />
        <div style={{ position: "absolute", left: 20, top: 545 }}>
          <Button label={P.cta} w={353} h={54} state={cont < 0.5 ? "disabled" : "default"} fill={cont} />
        </div>
      </Sheet>
    </div>
  );
};

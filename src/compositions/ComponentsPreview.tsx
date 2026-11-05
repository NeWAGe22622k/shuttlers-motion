import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, fontFamily } from "../config/brand";
import { content } from "../config/content";
import { AppIcon, Capsule, FleetCar, IconChip, Roll } from "../components/core";
import { I } from "../components/Icons";
import { Keyboard } from "../components/Keyboard";
import { Button, Chip, PayMethodRow, ProgressBar, RideOptionRow, ServiceCard, ShieldBadge, Spinner } from "../components/ui";
import { PhoneBody } from "../components/Phone";
import { SCREENS } from "./ScreenCheck";

const TR = content.trip;

const Cell: React.FC<{ label: string; children: React.ReactNode; w?: number }> = ({ label, children, w }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8, width: w }}>
    <div style={{ fontFamily, fontSize: 13, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
    {children}
  </div>
);

/** Components-Preview: page 1 (frames 0–59) every component in every state; page 2 (60–119) every rebuilt screen. */
export const ComponentsPreview: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= 60) {
    const keys = Object.keys(SCREENS);
    return (
      <AbsoluteFill style={{ background: "#ECEEED", padding: 30, display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 18, alignContent: "flex-start" }}>
        {keys.map((k) => (
          <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 196, height: 426, overflow: "hidden", borderRadius: 18, boxShadow: "0 4px 16px rgba(0,0,0,.12)", position: "relative" }}>
              <div style={{ width: 393, height: 852, transform: "scale(0.4987)", transformOrigin: "0 0", position: "relative", background: "#fff" }}>{SCREENS[k].el}</div>
            </div>
            <div style={{ fontFamily, fontSize: 14, fontWeight: 600, color: C.ink }}>{k}</div>
          </div>
        ))}
        <div style={{ transform: "scale(0.45)", transformOrigin: "0 0", width: 203, height: 428 }}>
          <PhoneBody>{SCREENS.home.el}</PhoneBody>
        </div>
      </AbsoluteFill>
    );
  }
  const s = 1.0;
  return (
    <AbsoluteFill style={{ background: "#F7F8F7", padding: 40 }}>
      <div style={{ transform: `scale(${s})`, transformOrigin: "0 0", width: 1840 / s, display: "flex", flexWrap: "wrap", gap: 26, alignItems: "flex-start" }}>
        <Cell label="Button · default / pressed / loading / disabled" w={1180}>
          <div style={{ display: "flex", gap: 12 }}>
            <Button label="Continue" w={180} />
            <Button label="Continue" w={180} state="pressed" />
            <Button label="Continue" w={180} state="loading" spin={f} />
            <Button label="Continue to payment" w={200} state="disabled" />
            <Button label="Cancel" w={120} tone="grey" />
          </div>
        </Cell>
        <Cell label="Chip · default / selected">
          <div style={{ display: "flex", gap: 8 }}>
            <Chip label="Top results" count={12} selected />
            <Chip label="Locations" count={12} />
            <Chip label="Routes" />
          </div>
        </Cell>
        <Cell label="Service card · default / highlight / pressed / dimmed / ghost">
          <div style={{ display: "flex", gap: 12 }}>
            <ServiceCard kind="daily" {...content.home.services.daily} />
            <ServiceCard kind="pod" {...content.home.services.pod} state={{ hi: 1 }} />
            <ServiceCard kind="pod" {...content.home.services.pod} state={{ press: 0.96 }} />
            <ServiceCard kind="rent" {...content.home.services.rent} state={{ dim: 1 }} />
            <ServiceCard kind="pod" {...content.home.services.pod} state={{ ghost: true }} />
          </div>
        </Cell>
        <Cell label="Ride option · default / selected / disabled / loading">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <RideOptionRow kind="daily" {...TR.daily} price={TR.dailyPrice} unit={TR.daily.unit} />
            <RideOptionRow kind="pod" {...TR.podSolo} price={TR.podPrice} unit={TR.podSolo.unit} state="selected" />
            <RideOptionRow kind="rent" {...TR.rent} state="disabled" />
            <RideOptionRow kind="rent" title="" sub="" state="skeleton" spin={f} />
          </div>
        </Cell>
        <Cell label="Payment method · default / selected / pressed">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PayMethodRow icon={<I.card size={19} color={C.ink} />} label="Card" />
            <PayMethodRow icon={<I.card size={19} color={C.ink} />} label="Card" sel={1} />
            <PayMethodRow icon={<I.bank size={19} color={C.ink} />} label="Bank Transfer" press={0.96} />
          </div>
        </Cell>
        <Cell label="Progress · badge · spinner · roll">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <ProgressBar p={0.35} w={300} />
            <ShieldBadge text={content.s8.badge} w={300} />
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Spinner t={f} />
              <Roll text={TR.maxPay} at={0} f={f} size={22} color={C.priceGreen} />
            </div>
          </div>
        </Cell>
        <Cell label="Pod capsule · app icon · chips">
          <div style={{ display: "flex", gap: 16, alignItems: "center", position: "relative", height: 90 }}>
            <div style={{ position: "relative", width: 90, height: 40 }}>
              <Capsule cx={45} cy={20} />
            </div>
            <AppIcon size={80} glint={(f % 30) / 30} />
            <IconChip icon={<I.shield size={30} color={C.priceGreen} />} size={64} />
            <IconChip icon={<I.bolt size={30} color={C.priceGreen} />} size={64} bg={C.mintPill} />
          </div>
        </Cell>
        <Cell label="Keyboard · key pressed" w={393}>
          <div style={{ position: "relative", width: 393, height: 300 }}>
            <Keyboard pressed={{ ch: "f", p: 0.5 }} />
          </div>
        </Cell>
        <Cell label="Fleet car · contact shadow + reflection" w={420}>
          <div style={{ position: "relative", width: 420, height: 300 }}>
            <FleetCar id="pv" src="vehicles/fleet-a-34.png" w={400} aspect={613 / 938} x={210} ground={280} />
          </div>
        </Cell>
      </div>
    </AbsoluteFill>
  );
};

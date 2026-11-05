import React from "react";
import { C, fontFamily } from "../config/brand";
import { content } from "../config/content";
import { I } from "../components/Icons";
import { Asset } from "../components/core";
import { CardState, IconCircle, RecentHomeRow, ServiceCard } from "../components/ui";

const H = content.home;

// Rebuilt from 01-home.png. Personal data removed: greeting from content, no notification
// count, no "Complete your profile" card (sections below move up to close the gap).
export const HOME_CARDS = { top: 410, x: [17, 140, 263], w: 112, h: 138 };

export const HomeScreen: React.FC<{
  daily?: CardState;
  pod?: CardState;
  rent?: CardState;
  badgeRot?: number;
  badgeScale?: number;
}> = ({ daily = {}, pod = {}, rent = {}, badgeRot = 0, badgeScale = 1 }) => (
  <div style={{ position: "absolute", inset: 0, background: C.white, fontFamily, overflow: "hidden" }}>
    {/* location row */}
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
    <div style={{ position: "absolute", left: 17, top: 112, fontSize: 28, fontWeight: 600, color: C.ink, letterSpacing: -0.4 }}>{H.greeting}</div>
    {/* where to */}
    <div style={{ position: "absolute", left: 17, top: 168, width: 358, height: 53, borderRadius: 27, background: C.white, boxShadow: "0 0 0 1px #ECEDEC, 0 6px 18px rgba(16,17,17,.07)", display: "flex", alignItems: "center", padding: "0 8px 0 18px", boxSizing: "border-box", gap: 10 }}>
      <I.search size={22} color={C.muted} stroke={1.8} />
      <span style={{ flex: 1, fontSize: 16, color: "#9a9e9c", fontWeight: 500 }}>{H.whereTo}</span>
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
    {/* services */}
    <div style={{ position: "absolute", left: 17, top: 378, width: 358, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 17, fontWeight: 600, color: C.ink }}>{H.servicesTitle}</span>
      <IconCircle size={30}>
        <I.chevronRight size={16} color={C.ink} />
      </IconCircle>
    </div>
    <div style={{ position: "absolute", left: HOME_CARDS.x[0], top: HOME_CARDS.top }}>
      <ServiceCard kind="daily" {...H.services.daily} state={daily} />
    </div>
    <div style={{ position: "absolute", left: HOME_CARDS.x[1], top: HOME_CARDS.top }}>
      <ServiceCard kind="pod" {...H.services.pod} state={pod} badgeRot={badgeRot} badgeScale={badgeScale} />
    </div>
    <div style={{ position: "absolute", left: HOME_CARDS.x[2], top: HOME_CARDS.top }}>
      <ServiceCard kind="rent" {...H.services.rent} state={rent} />
    </div>
    {/* banner */}
    <div style={{ position: "absolute", left: 17, top: 572, width: 358, height: 160, borderRadius: 18, overflow: "hidden", background: "linear-gradient(120deg, #F3F7F4 0%, #EAF6EF 55%, #E2F3E9 100%)" }}>
      <div style={{ position: "absolute", left: 16, top: 26, fontSize: 21, fontWeight: 700, color: C.brandGreen, letterSpacing: -0.4 }}>{H.bannerTitle}</div>
      <div style={{ position: "absolute", left: 16, top: 52, fontSize: 21, fontWeight: 500, color: C.ink, letterSpacing: -0.4 }}>{H.bannerSub}</div>
      <div style={{ position: "absolute", left: 168, top: 32 }}>
        <Asset src="vehicles/app-pod-car-large.png" w={230} />
      </div>
    </div>
    {/* tab bar */}
    <div style={{ position: "absolute", left: 17, top: 738, width: 358, height: 62, borderRadius: 31, background: "rgba(255,255,255,.96)", boxShadow: "0 0 0 1px #EEEFEE, 0 10px 30px rgba(16,17,17,.12)", display: "flex", alignItems: "center", padding: "0 6px", boxSizing: "border-box" }}>
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

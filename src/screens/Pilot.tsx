import React from "react";
import { C, fontFamily } from "../config/brand";
import { content } from "../config/content";
import { I } from "../components/Icons";
import { Asset } from "../components/core";
import { Button, Grabber, ProgressBar, Sheet, ShieldBadge } from "../components/ui";

const S8 = content.s8;
const TR = content.trip;

export const FINDING_SHEET_TOP = 470;

/** 11 Finding your Pod. `done` morphs the progress bar into a check. */
export const FindingSheet: React.FC<{ top?: number; p: number; done?: number }> = ({ top = FINDING_SHEET_TOP, p, done = 0 }) => (
  <Sheet top={top}>
    <Grabber />
    <div style={{ position: "absolute", left: 20, top: 34, fontFamily, fontSize: 15, fontWeight: 700, color: C.ink }}>{S8.findingTitle}</div>
    <div style={{ position: "absolute", left: 20, top: 56, width: 340, fontFamily, fontSize: 11, fontWeight: 600, color: C.muted, lineHeight: 1.4 }}>{S8.findingRoute}</div>
    <div style={{ position: "absolute", left: 20, top: 94 }}>
      <div style={{ opacity: 1 - done }}>
        <ProgressBar p={p} />
      </div>
      {done > 0 ? (
        <div style={{ position: "absolute", left: 176 - 14 * done, top: -10, width: 28 * done, height: 28 * done, borderRadius: 99, background: C.priceGreen, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <I.check size={18 * done} color="#fff" stroke={3} />
        </div>
      ) : null}
    </div>
    <div style={{ position: "absolute", left: 20, right: 20, top: 128, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>{TR.quoted}</span>
      <span style={{ fontSize: 18, fontWeight: 700, color: C.priceGreen, fontVariantNumeric: "tabular-nums" }}>{TR.podPrice}</span>
    </div>
    <div style={{ position: "absolute", left: 20, top: 156, fontFamily, fontSize: 11, fontWeight: 600, color: C.muted }}>{TR.govt}</div>
    <div style={{ position: "absolute", left: 20, top: 190 }}>
      <Button label={TR.cancel} w={90} h={44} tone="grey" style={{ fontSize: 14 }} />
    </div>
  </Sheet>
);

/** Flat, neutral illustrated avatar (not a real person). */
export const Avatar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: "block", flexShrink: 0 }}>
    <circle cx="24" cy="24" r="24" fill={C.mintPill} />
    <clipPath id="avc">
      <circle cx="24" cy="24" r="24" />
    </clipPath>
    <g clipPath="url(#avc)">
      <path d="M6 50 C 8 36 16 31 24 31 C 32 31 40 36 42 50 Z" fill="#2E6B4A" />
      <path d="M20 27 h8 v6 c0 2 -8 2 -8 0 z" fill="#8A5A3C" />
      <circle cx="24" cy="20" r="8.5" fill="#9C6644" />
      <path d="M15.6 18.5 C 16 12 20 10.5 24 10.5 C 28.5 10.5 32 12.5 32.4 18 C 30 15.5 27 14.6 24 14.6 C 21 14.6 18 15.6 15.6 18.5 Z" fill="#1E1E22" />
    </g>
  </svg>
);

export const PILOT_BADGE_Y = 196; // relative to sheet top

/** Designed Pilot-assigned sheet (no screenshot): app style, row layout and type from 07. */
export const PilotSheet: React.FC<{ top?: number; eta: React.ReactNode; rowsIn?: number[]; ghostBadge?: boolean }> = ({ top = FINDING_SHEET_TOP, eta, rowsIn = [1, 1, 1, 1], ghostBadge = false }) => {
  const r = (i: number): React.CSSProperties => ({ opacity: rowsIn[i], transform: `translateY(${(1 - rowsIn[i]) * 12}px)` });
  return (
    <Sheet top={top}>
      <Grabber />
      <div style={{ position: "absolute", left: 20, top: 34, fontFamily, fontSize: 16, fontWeight: 700, color: C.ink, ...r(0) }}>{S8.title}</div>
      <div style={{ position: "absolute", left: 20, right: 20, top: 70, display: "flex", alignItems: "center", gap: 12, fontFamily, ...r(1) }}>
        <Avatar />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: C.ink }}>{S8.pilotName}</div>
          <div style={{ fontSize: 11.5, fontWeight: 500, color: C.muted, marginTop: 3, display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
            {S8.pilotSub}
            {eta}
          </div>
        </div>
        <Asset src="vehicles/app-pod-car-large.png" w={104} />
      </div>
      <div style={{ position: "absolute", left: 20, top: 140, display: "flex", alignItems: "center", gap: 10, fontFamily, ...r(2) }}>
        <div style={{ height: 32, padding: "0 12px", borderRadius: 99, background: C.card, display: "flex", alignItems: "center", fontSize: 14, fontWeight: 700, color: C.ink, letterSpacing: 0.8, fontVariantNumeric: "tabular-nums" }}>{S8.plate}</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>{S8.carLabel}</span>
      </div>
      <div style={{ position: "absolute", left: 20, top: PILOT_BADGE_Y, opacity: ghostBadge ? 0.2 * rowsIn[3] : rowsIn[3], transform: r(3).transform }}>
        <ShieldBadge text={S8.badge} />
      </div>
    </Sheet>
  );
};

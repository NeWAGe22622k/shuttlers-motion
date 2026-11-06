import { Easing } from "remotion";
import { fontFamily, fontsReady } from "../../config/brand";
import timing from "./timing.json";

// PodVideo2-16x9 tokens (brief §3–4). Google Sans is loaded once by src/config/brand.ts
// (vendored woff2 subsets, 400–700, latin-ext carries ₦).
export { fontFamily, fontsReady };
export const T = timing;

export const C = {
  ctaGreen: "#20E682",
  deepGreen: "#0A6B3D",
  priceGreen: "#0DAC5C",
  brandGreen: "#50AA69",
  linkGreen: "#4EA964",
  mint: "#E6FFF2",
  indigo: "#4848E4",
  deepIndigo: "#1E1E6E",
  ink: "#101111",
  night: "#09090E",
  card: "#F4F5F4",
  border: "#DFE0DF",
  muted: "#747876",
  successTeal: "#006156",
  white: "#FFFFFF",
  paper: "#F7F8F6",
  pinkPin: "#FDECEC",
  redPin: "#E5484D",
  map: { land: "#E9ECEC", road: "#FFFFFF", casing: "#DDE2E3", water: "#A6CBE3", park: "#CFE9C8", label: "#8E979A" },
} as const;

/** No overshoot anywhere (brief §4). */
export const EASE = {
  expoOut: Easing.bezier(0.16, 1, 0.3, 1),
  expoInOut: Easing.bezier(0.87, 0, 0.13, 1),
  quintIn: Easing.bezier(0.64, 0, 0.78, 0),
  linear: (t: number) => t,
};

/** Springs are only ever used with overshootClamping. */
export const SPRING = {
  snap: { damping: 30, stiffness: 300, overshootClamping: true },
  glide: { damping: 40, stiffness: 120, overshootClamping: true },
} as const;

/** Minimum 48px for film type (in-phone UI and its lift-outs are app UI at app sizes). */
export const TYPE = { hero: 160, title: 104, step: 80, small: 48, numeral: 220, word: 160 };
export const TRACK = { tight: "-0.02em" };

// Portrait master (revision 3): 1080×1920. Text and key UI stay inside SAFE (platform UI covers the
// bottom and the right edge).
export const W = 1080;
export const H = 1920;
export const SAFE = { x0: 90, x1: 990, y0: 250, y1: 1480 };

/** Phone: centred, 760px wide (screen scale ≈1.93), top at y≈560; 10px bezel outside, 64px outer radius. */
const PHONE_SCALE = 760 / 393;
const PHONE_TOP = 560;
export const PHONE = {
  cx: 540,
  cy: PHONE_TOP + 10 + (852 * PHONE_SCALE) / 2,
  top: PHONE_TOP,
  appW: 393,
  appH: 852,
  scale: PHONE_SCALE,
  bezel: 10,
  radius: 64,
  perspective: 2400,
  ry: -6,
  rx: 3,
};
/** Step numeral + step line sit above the phone, left-aligned (y 260–520). */
export const STORY = { x0: 90, x1: 990, top: 268, bottom: 520 };
/** Lift-outs overlay the lower part of the phone, centred (y 1150–1450), at up to 2.6 px per app point, max 860px wide. */
export const LIFT = { cx: 540, cy: 1300, maxW: 860, maxScale: 2.6 };
/** Persistent app icon, top-right, f0–929. */
export const ICON = { x: 902, y: 150, size: 88 };

/** Motion constants (durations in frames; brief §4). */
export const M = {
  maskRise: 8,
  maskStagger: 2,
  slice: 8,
  fillSweep: 10,
  scaleCut: 6,
  push: 10,
  pressDur: 4,
  ringGrow: 14,
  fingerTravel: 9,
};

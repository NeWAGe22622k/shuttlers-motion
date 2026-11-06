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

export const TYPE = { hero: 160, title: 104, step: 72, small: 40, numeral: 280 };
export const TRACK = { tight: "-0.02em" };

export const W = 1920;
export const H = 1080;
export const SAFE = { x0: 96, x1: 1824, y0: 60, y1: 1020 };

/** Phone: screen 393×852 app points scaled to 430×932, 10px bezel outside, 64px outer radius. */
export const PHONE = {
  cx: 560,
  cy: 540,
  appW: 393,
  appH: 852,
  scale: 430 / 393,
  bezel: 10,
  radius: 64,
  perspective: 1800,
  ry: -10,
  rx: 5,
};
export const STORY = { x0: 1040, x1: 1800, top: 196 };

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

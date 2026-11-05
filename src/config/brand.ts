import { Easing, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { getInfo } from "@remotion/google-fonts/GoogleSans";

// Google Sans for everything (variable, 400–700). The woff2 subsets are the exact files
// @remotion/google-fonts points at (see getInfo()), vendored into public/fonts because the
// headless renderer here can't reach fonts.gstatic.com through the sandbox proxy.
// latin-ext carries the Naira sign (U+20A6); symbols carries the → arrow.
export const fontFamily = "Google Sans";
const ranges = getInfo().unicodeRanges as Record<string, string>;
const SUBSETS = ["latin", "latin-ext", "symbols"] as const;
export const fontsReady = Promise.all(
  SUBSETS.map((s) =>
    loadFont({
      family: fontFamily,
      url: staticFile(`fonts/GoogleSans-${s}.woff2`),
      weight: "400 700",
      style: "normal",
      unicodeRange: ranges[s],
      format: "woff2",
    }),
  ),
);

export const C = {
  brandGreen: "#50AA69",
  linkGreen: "#4EA964",
  ctaGreen: "#20E682",
  priceGreen: "#0DAC5C",
  mint: "#F7FFFA",
  mintPill: "#E6FFF2",
  indigo: "#4848E4",
  ink: "#101111",
  night: "#09090E",
  card: "#F4F5F4",
  border: "#DFE0DF",
  muted: "#747876",
  track: "#D4D4D8",
  successTeal: "#006156",
  white: "#FFFFFF",
  bubbleDark: "#1C1D22",
  map: {
    land: "#E9ECEC",
    road: "#FFFFFF",
    casing: "#DDE2E3",
    water: "#A6CBE3",
    park: "#CFE9C8",
    label: "#9AA3A6",
  },
  confetti: ["#20E682", "#79EDB1", "#A6F5CD", "#66D1FF", "#FFA9EB", "#FF94E6", "#FFDE3D", "#8E8EF1"],
  popperCone: "#193440",
  pinRed: "#E5484D",
  pinPink: "#FDECEC",
} as const;

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
};

export const SPRING = {
  pop: { damping: 12, stiffness: 180, mass: 0.8 },
  snap: { damping: 22, stiffness: 320, mass: 1 },
  glide: { damping: 28, stiffness: 90, mass: 1 },
  camera: { damping: 40, stiffness: 60, mass: 1 },
};

export const SHADOW =
  "0 1px 2px rgba(16,17,17,.06), 0 10px 30px rgba(16,17,17,.08), 0 40px 80px rgba(16,17,17,.10)";

export const TYPE = { hero: 120, title: 84, caption: 56, small: 32 };

export const RADIUS = { card: 20, sheet: 32, button: 24, chip: 999, appButton: 14 };

// Frame layout (1920×1080)
export const LAYOUT = {
  W: 1920,
  H: 1080,
  safe: { x0: 96, x1: 1824, y0: 60, y1: 1020 },
  phone: { cx: 560, cy: 540, screenW: 393, screenH: 852, scale: 430 / 393, bezel: 10, radius: 64 },
  story: { x0: 1040, x1: 1800 },
};

export const glow = (color: string, alpha = 0.6, r = 28) => {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `0 0 ${r}px ${color}${a}`;
};

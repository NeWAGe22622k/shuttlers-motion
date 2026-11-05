import { staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { getInfo } from "@remotion/google-fonts/Poppins";

// Poppins (brief), vendored woff2: the renderer here can't reach fonts.gstatic.com.
export const POPPINS = "Poppins";
const ranges = getInfo().unicodeRanges as Record<string, string>;
for (const w of ["400", "500", "600", "700", "800"]) {
  for (const s of ["latin", "latin-ext"]) {
    loadFont({ family: POPPINS, url: staticFile(`fonts/Poppins-${w}-${s}.woff2`), weight: w, style: "normal", unicodeRange: ranges[s], format: "woff2" });
  }
}

// Brief: green on black or black on green, one accent per frame.
export const GREEN = "#20E682";
export const BLACK = "#000000";
export type Pair = "G" | "K" | "X";
export const pairColours = (pair: Pair) => (pair === "K" ? { bg: GREEN, fg: BLACK } : { bg: BLACK, fg: pair === "X" ? BLACK : GREEN });

// Format layout. 9:16 is the master; 1:1 and 16:9 reuse the same scenes with these anchors.
export type Fmt = "9x16" | "1x1" | "16x9";
export const FORMATS: Record<Fmt, { W: number; H: number; pad: number; textTop: number; textSize: number; art: { cx: number; cy: number; s: number }; mark: { right: number; bottom: number; size: number } }> = {
  // Safe area for TikTok/Reels UI: keep copy and marks inside x 72–960, y 220–1500.
  "9x16": { W: 1080, H: 1920, pad: 90, textTop: 300, textSize: 150, art: { cx: 540, cy: 1130, s: 1 }, mark: { right: 170, bottom: 430, size: 92 } },
  "1x1": { W: 1080, H: 1080, pad: 80, textTop: 110, textSize: 118, art: { cx: 540, cy: 690, s: 0.62 }, mark: { right: 80, bottom: 70, size: 72 } },
  "16x9": { W: 1920, H: 1080, pad: 120, textTop: 330, textSize: 132, art: { cx: 1380, cy: 560, s: 0.72 }, mark: { right: 110, bottom: 80, size: 76 } },
};

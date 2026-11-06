// Usage: node tools/stills.mjs <compositionId> <frame> [frame...]  -> out/qa/<prefix>-<frame>.png
// Optional: PROPS='{"grain":false}' to pass input props. PREFIX=... to override the file prefix.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";

const [id, ...frames] = process.argv.slice(2);
const prefix = process.env.PREFIX ?? (id === "PodHero-16x9" ? "f" : id === "PodCutdown-16x9" ? "c" : id === "PodVideo2-16x9" ? "v2" : id);
const inputProps = process.env.PROPS ? JSON.parse(process.env.PROPS) : {};
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = [
  process.env.REMOTION_CHROME,
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell",
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
].find((p) => p && fs.existsSync(p));
const puppeteerInstance = await openBrowser("chrome", { browserExecutable });
const composition = await selectComposition({ serveUrl, id, puppeteerInstance, inputProps });
fs.mkdirSync("out/qa", { recursive: true });
for (const fr of frames) {
  const t = Date.now();
  await renderStill({ composition, serveUrl, frame: Number(fr), output: `out/qa/${prefix}-${fr}.png`, puppeteerInstance, imageFormat: "png", inputProps });
  console.log(`${prefix}-${fr} ${Date.now() - t}ms`);
}
await puppeteerInstance.close({ silent: true });

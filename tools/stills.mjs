// Usage: node tools/stills.mjs <compositionId> <frame> [frame...]  -> out/qa/<prefix>-<frame>.png
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "node:path";

const [id, ...frames] = process.argv.slice(2);
const prefix = id === "PodHero-16x9" ? "f" : id === "PodCutdown-16x9" ? "c" : id;
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const puppeteerInstance = await openBrowser("chrome", { browserExecutable });
const composition = await selectComposition({ serveUrl, id, puppeteerInstance });
for (const fr of frames) {
  const t = Date.now();
  await renderStill({ composition, serveUrl, frame: Number(fr), output: `out/qa/${prefix}-${fr}.png`, puppeteerInstance, imageFormat: "png" });
  console.log(`${prefix}-${fr} ${Date.now() - t}ms`);
}
await puppeteerInstance.close({ silent: true });

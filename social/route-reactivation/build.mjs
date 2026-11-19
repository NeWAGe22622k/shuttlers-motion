// Route reactivation social set: builds posts.html and renders each frame to PNG.
// Run from the repo root: node social/route-reactivation/build.mjs
// Edit COPY / ROUTES below, then re-run.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out");
mkdirSync(OUT, { recursive: true });

// ---- Fill these in before posting -------------------------------------------------
// Routes coming back: code, A → B, morning departure, evening return.
// IKR131/IKR653/IKR690/ECO-SRL103 from the Shuttlers route flyers on Drive;
// IKR573/BDR3/YAB184 supplied by the marketing team.
const SLIDE_A = {
  label: "IKORODU ROAD",
  routes: [
    { code: "IKR131", from: "Ojota", to: "Ikate, Lekki", am: "7:00 AM", pm: "5:15 PM" },
    { code: "IKR573", from: "Ojota", to: "Elf Bus Stop, Lekki", am: "7:00 AM", pm: "4:15 PM" },
    { code: "IKR653", from: "Ojota", to: "Sandfill, VI", am: "7:45 AM", pm: "7:00 PM" },
    { code: "IKR690", from: "Ojota", to: "Sandfill, VI", am: "8:00 AM", pm: "5:30 PM" },
  ],
};
const SLIDE_B = {
  label: "SURULERE · BADORE · YABA",
  routes: [
    { code: "ECO-SRL103", from: "Surulere", to: "Sandfill, VI", am: "6:15 AM", pm: "5:15 PM" },
    { code: "BDR3", from: "Cooperative Villa, Badore", to: "Oando, Marina", am: "5:45 AM", pm: "5:15 PM" },
    { code: "YAB184", from: "Jibowu Bus Stop", to: "Eko Hotel Roundabout", am: "6:30 AM", pm: "5:30 PM" },
  ],
};
const START = "Monday, [DATE]";
// ------------------------------------------------------------------------------------

const GREEN = "#20E682";
const BLACK = "#000000";

// Shuttlers mark: the S path from the app icon, recoloured via currentColor.
const iconSvg = readFileSync(join(HERE, "../../public/brand/shuttlers-mark.svg"), "utf8")
  .replace(/fill="#000000"/g, 'fill="currentColor"')
  .replace("<svg ", '<svg class="mark" ');

const font = (w) => `
@font-face{font-family:Poppins;font-weight:${w};src:url(../../public/fonts/Poppins-${w}-latin.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}
@font-face{font-family:Poppins;font-weight:${w};src:url(../../public/fonts/Poppins-${w}-latin-ext.woff2) format("woff2");unicode-range:U+0100-02AF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20CF,U+2113,U+2C60-2C7F,U+A720-A7FF;}`;

// Route line: paused (dashed, hollow stops) → live (solid green, filled stops).
const routeLine = (w = 920, live = GREEN, dim = "#3A3B3D", labelInk = "#8A8D90") => {
  const y = 70;
  const split = Math.round(w * 0.36);
  const stopsPaused = [24, split * 0.55];
  const stopsLive = [split + (w - split) * 0.28, split + (w - split) * 0.62];
  const end = w - 34;
  return `<svg viewBox="0 0 ${w} 140" width="${w}" height="140" class="route">
    <line x1="24" y1="${y}" x2="${split}" y2="${y}" stroke="${dim}" stroke-width="10" stroke-linecap="round" stroke-dasharray="2 26"/>
    <line x1="${split}" y1="${y}" x2="${end}" y2="${y}" stroke="${live}" stroke-width="12" stroke-linecap="round"/>
    ${stopsPaused.map((x) => `<circle cx="${x}" cy="${y}" r="15" fill="${BLACK}" stroke="${dim}" stroke-width="6"/>`).join("")}
    ${stopsLive.map((x) => `<circle cx="${x}" cy="${y}" r="16" fill="${live}"/><circle cx="${x}" cy="${y}" r="6" fill="${BLACK}"/>`).join("")}
    <circle cx="${end}" cy="${y}" r="30" fill="${live}"/><circle cx="${end}" cy="${y}" r="11" fill="${BLACK}"/>
    <text x="24" y="${y + 62}" fill="${labelInk}" font-family="Poppins" font-weight="600" font-size="22" letter-spacing="3">PAUSED</text>
    <text x="${end + 30}" y="${y + 62}" fill="${live}" font-family="Poppins" font-weight="700" font-size="22" letter-spacing="3" text-anchor="end">LIVE AGAIN</text>
  </svg>`;
};

// Route cards: code + morning/evening times on top, A → B underneath.
const arrow = `<svg class="arr" viewBox="0 0 32 20"><path d="M2 10h26M20 3l8 7-8 7" fill="none" stroke="#20E682" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const sun = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5" fill="#8A8D90"/><g stroke="#8A8D90" stroke-width="2" stroke-linecap="round"><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></g></svg>`;
const moon = `<svg viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="#8A8D90"/></svg>`;
const cards = (g) => `
  <div class="glabel">${g.label}</div>
  <div class="cards">${g.routes.map((r) => `
    <div class="card">
      <div class="top"><b>${r.code}</b><div class="times"><span>${sun}${r.am}</span><span>${moon}${r.pm}</span></div></div>
      <div class="ab">${r.from}${arrow}${r.to}</div>
    </div>`).join("")}
  </div>`;
const swipeArrow = `<svg viewBox="0 0 32 20" style="width:26px;height:16px;margin-left:12px"><path d="M2 10h26M20 3l8 7-8 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const footer = (ink, sub, right = "shuttlers.co") => `
  <div class="foot" style="color:${ink}">
    <div class="brand">${iconSvg}</div>
    <span class="url" style="color:${sub};display:flex;align-items:center">${right}</span>
  </div>`;
const swipe = (txt) => `${txt}${swipeArrow}`;

const pill = `<div class="pill" style="border-color:#2A2B2D;color:${GREEN}"><i style="background:${GREEN}"></i>ROUTE UPDATE</div>`;
const headA = `<h1 class="hero sm" style="color:#fff">Your favourite route<br>is <em style="color:${GREEN}">live again.</em></h1>`;
const headB = `<h1 class="hero sm" style="color:#fff">More routes,<br><em style="color:${GREEN}">back on the road.</em></h1>`;

const frames = [
  {
    id: "01-routes-ikorodu-road-4x5",
    w: 1080, h: 1350, bg: BLACK,
    html: `<div class="pad">${pill}${headA}${cards(SLIDE_A)}</div>
      ${footer("#fff", "#8A8D90", swipe("Swipe for more routes"))}`,
  },
  {
    id: "02-routes-surulere-badore-yaba-4x5",
    w: 1080, h: 1350, bg: BLACK,
    html: `<div class="pad">${pill}${headB}${cards(SLIDE_B)}
        <p class="note" style="color:#B9BCBE">Search your route code on the Shuttlers app and book your seat.</p></div>
      ${footer("#fff", "#8A8D90", swipe("How to book"))}`,
  },
  {
    id: "03-same-ride-4x5",
    w: 1080, h: 1350, bg: GREEN,
    html: `
      <div class="pad">
        <div class="kicker" style="color:${BLACK}">WHAT'S WAITING FOR YOU</div>
        <h2 class="h2" style="color:${BLACK}">Same ride<br>you missed.</h2>
        <ul class="list" style="color:${BLACK}">
          <li><b>01</b><span>A guaranteed seat, booked before you leave home</span></li>
          <li><b>02</b><span>AC on, no bus-stop wahala</span></li>
          <li><b>03</b><span>Scheduled pickups you can plan your morning around</span></li>
        </ul>
      </div>
      ${footer(BLACK, "rgba(0,0,0,.6)")}`,
  },
  {
    id: "04-how-to-book-4x5",
    w: 1080, h: 1350, bg: BLACK,
    html: `
      <div class="pad">
        <div class="kicker" style="color:${GREEN}">GET BACK ON BOARD</div>
        <h2 class="h2" style="color:#fff">Three taps<br>and you're <em style="color:${GREEN}">in.</em></h2>
        <ol class="steps">
          <li><span class="n">1</span><span>Open the Shuttlers app</span></li>
          <li><span class="n">2</span><span>Search your route code</span></li>
          <li><span class="n">3</span><span>Book your seat</span></li>
        </ol>
        <div class="cta" style="background:${GREEN};color:${BLACK}">Book on the app · link in bio</div>
      </div>
      ${footer("#fff", "#8A8D90")}`,
  },
  {
    id: "05-story-1-9x16",
    w: 1080, h: 1920, bg: BLACK, story: true,
    html: `<div class="pad story">${pill}${headA}${cards(SLIDE_A)}
        <div class="next">More routes in the next story${swipeArrow}</div></div>
      ${footer("#fff", "#8A8D90")}`,
  },
  {
    id: "06-story-2-9x16",
    w: 1080, h: 1920, bg: BLACK, story: true,
    html: `<div class="pad story">${pill}${headB}${cards(SLIDE_B)}
        <div class="cta" style="background:${GREEN};color:${BLACK}">Tap to book your seat</div></div>
      ${footer("#fff", "#8A8D90")}`,
  },
];

const css = `
${["400", "500", "600", "700", "800"].map(font).join("")}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#1a1a1a;font-family:Poppins,sans-serif;-webkit-font-smoothing:antialiased;padding:40px;display:flex;flex-wrap:wrap;gap:40px}
.frame{position:relative;overflow:hidden;flex:none}
.pad{position:absolute;inset:0;padding:88px 80px 0}
.pad.story{padding-top:220px}
.pill{display:inline-flex;align-items:center;gap:14px;border:2px solid;border-radius:999px;padding:14px 26px;font-weight:600;font-size:24px;letter-spacing:4px}
.pill i{width:12px;height:12px;border-radius:50%}
.hero{font-weight:800;font-size:168px;line-height:.98;letter-spacing:-.035em;word-spacing:.1em;margin-top:64px}
.hero em,.h2 em{font-style:normal}
.lede{font-weight:400;font-size:38px;line-height:1.4;margin-top:48px;max-width:860px}
.routewrap{margin-top:96px}
.story .routewrap{margin-top:140px}
.kicker{font-weight:700;font-size:24px;letter-spacing:4px}
.h2{font-weight:800;font-size:104px;line-height:1;letter-spacing:-.035em;word-spacing:.1em;margin-top:40px}
.list{list-style:none;margin-top:84px;display:flex;flex-direction:column;gap:0}
.list li{display:flex;gap:36px;align-items:baseline;padding:34px 0;border-top:3px solid rgba(0,0,0,.85);font-size:40px;line-height:1.3;font-weight:500}
.list li:last-child{border-bottom:3px solid rgba(0,0,0,.85)}
.list b{font-weight:700;font-size:26px;letter-spacing:2px;min-width:52px}
.steps{list-style:none;margin-top:84px;display:flex;flex-direction:column;gap:28px}
.steps li{display:flex;align-items:center;gap:32px;color:#fff;font-size:44px;font-weight:500}
.steps .n{width:84px;height:84px;border-radius:50%;border:3px solid #20E682;color:#20E682;display:grid;place-items:center;font-weight:700;font-size:36px;flex:none}
.cta{display:inline-block;margin-top:84px;border-radius:999px;padding:30px 52px;font-weight:700;font-size:34px}
.story .cta{margin-top:72px}
.chips{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:84px}
.chip{background:#000;color:#20E682;border-radius:22px;padding:30px 0;text-align:center;font-weight:700;font-size:40px;letter-spacing:2px}
.hero.sm{font-size:72px;line-height:1.05;letter-spacing:-.03em;margin-top:36px}
.glabel{margin-top:52px;color:#8A8D90;font-weight:600;font-size:20px;letter-spacing:4px}
.cards{display:flex;flex-direction:column;gap:18px;margin-top:20px}
.card{background:#111214;border:1px solid #222326;border-radius:28px;padding:26px 32px 28px}
.card .top{display:flex;justify-content:space-between;align-items:center}
.card b{color:#20E682;font-size:30px;font-weight:700;letter-spacing:.5px}
.card .times{display:flex;gap:30px;color:#fff;font-size:26px;font-weight:600}
.card .times span{display:flex;align-items:center;gap:10px}
.card .times svg{width:24px;height:24px}
.card .ab{margin-top:12px;color:#fff;font-size:36px;font-weight:600;line-height:1.25;letter-spacing:-.01em}
.card .arr{display:inline-block;width:30px;height:20px;margin:0 16px;vertical-align:middle;position:relative;top:-3px}
.next{display:flex;align-items:center;margin-top:44px;color:#8A8D90;font-size:28px;font-weight:500}
.note{font-size:30px;margin-top:44px;line-height:1.4;max-width:820px}
.foot{position:absolute;left:80px;right:80px;bottom:72px;display:flex;justify-content:space-between;align-items:center}
.brand{display:flex;align-items:center;gap:6px;font-weight:700;font-size:40px;letter-spacing:-.02em}
.mark{width:64px;height:80px}
.frame.story .foot{bottom:300px}
.url{font-size:26px;font-weight:500}
`;

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Route reactivation posts</title><style>${css}</style></head><body>
${frames.map((f) => `<section class="frame${f.story ? " story" : ""}" id="f-${f.id}" style="width:${f.w}px;height:${f.h}px;background:${f.bg}">${f.html}</section>`).join("\n")}
</body></html>`;

const htmlPath = join(HERE, "posts.html");
writeFileSync(htmlPath, html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 2000 }, deviceScaleFactor: 1 });
await page.goto("file://" + htmlPath);
await page.evaluate(() => document.fonts.ready);
for (const f of frames) {
  await page.locator(`#f-${f.id}`).screenshot({ path: join(OUT, `${f.id}.png`) });
  console.log("wrote", `out/${f.id}.png`);
}
await browser.close();

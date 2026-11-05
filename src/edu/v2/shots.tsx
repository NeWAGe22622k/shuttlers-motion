import React from "react";
import { AbsoluteFill, random, staticFile } from "remotion";
import { EASE } from "../../config/brand";
import { clamp, mix, sp, tw } from "../../components/motion";
import { BreathIcon, CallIcon, Pin, SeatMap, SleepIcon } from "../art";
import { PodIcon } from "../PodIcon";
import { EDU, END_LINE } from "../content";
import { Arrow } from "../kit";
import { BLACK, GREEN, POPPINS } from "../theme";
import { BlurBox, Burst, Ghosts, Glow, H, Shock, Sparks, SpeedLines, Specks, V2, W, beat, keys, kick, mt, shake, vel } from "./engine";
import { FlipTile, Words } from "./type";

const CARDS = EDU.v2.cards;
const SFX = V2.sfx;
const POD_AR = 1008 / 2320; // PodIcon height / width

/* ------------------------------------------------------------------ shared */

const Stage: React.FC<{ bg: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ bg, children, style }) => <AbsoluteFill style={{ background: bg, overflow: "hidden", ...style }}>{children}</AbsoluteFill>;

/** Camera for a shot: push-in across the shot + beat pulse + slow drift, frozen in the silences. */
const Cam: React.FC<{ f: number; from: number; to: number; push?: number; origin?: string; extra?: string; children: React.ReactNode }> = ({ f, from, to, push = 0.06, origin = "50% 50%", extra = "", children }) => {
  const p = clamp((f - from) / (to - from));
  const t = mt(f);
  const s = 1 + push * EASE.out(p) + 0.014 * beat(f);
  return <AbsoluteFill style={{ transform: `translate(${(6 * Math.sin(t / 31)).toFixed(2)}px, ${(5 * Math.sin(t / 43 + 1)).toFixed(2)}px) rotate(${(0.35 * Math.sin(t / 57)).toFixed(3)}deg) scale(${s.toFixed(4)}) ${extra}`, transformOrigin: origin }}>{children}</AbsoluteFill>;
};

/* ------------------------------------------------------------------ 0 · Let's get you moving. (0–60) */

const CLK = { cx: 540, cy: 1085, size: 300 };
const TW = CLK.size * 0.62;
const GAP = CLK.size * 0.06;
const COLON = CLK.size * 0.22;
const CX0 = CLK.cx - (3 * TW + COLON + 3 * GAP) / 2;
const TILE_X = [CX0, CX0 + TW + GAP + COLON + GAP, CX0 + 2 * TW + 3 * GAP + COLON];
/** Frame point of the "0" in 8:50 (the camera dives through its counter into the drop). */
export const DIVE_ORIGIN: [number, number] = [TILE_X[2] + TW / 2, CLK.cy];
const TICKS = SFX.clockTicks; // 0 15 30 45

const Dial: React.FC<{ f: number }> = ({ f }) => {
  let lit = 0;
  TICKS.forEach((t) => (lit += 15 * tw(f, t, t + 6, 0, 1, EASE.out)));
  const R = 470;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const major = i % 15 === 0;
        const on = i < lit;
        const head = on && i > lit - 2;
        const r0 = R - (major ? 46 : 26);
        return <line key={i} x1={CLK.cx + Math.cos(a) * r0} y1={CLK.cy + Math.sin(a) * r0} x2={CLK.cx + Math.cos(a) * R} y2={CLK.cy + Math.sin(a) * R} stroke={GREEN} strokeWidth={major ? 9 : 5} strokeLinecap="round" opacity={on ? 1 : 0.16} style={head ? { filter: `drop-shadow(0 0 12px ${GREEN})` } : undefined} />;
      })}
    </svg>
  );
};

export const ClockShot: React.FC<{ f: number }> = ({ f }) => {
  const words = ["Let's", "get", "you"];
  const settle = tw(f, 0, 50, 0, 1, EASE.inOut);
  const tick = TICKS.reduce((a, t) => a + kick(f, t, 3), 0);
  const colon = 0.35 + 0.65 * TICKS.reduce((a, t) => Math.max(a, kick(f, t, 5)), 0);
  const mv = (x: number) => (x < 39 ? 1 : 1 - (x < 45 ? EASE.in(tw(x, 39, 45)) * 1.0 : 1 + 0.04 * Math.exp(-(x - 45) / 3) * Math.sin((x - 45) * 1.2))) * 820;
  const mvBlur = Math.min(40, vel(mv, f) * 0.5);
  return (
    <Stage bg={BLACK}>
      <Glow x={CLK.cx} y={CLK.cy} r={900} color={GREEN} a={0.08 + 0.12 * tw(f, 0, 50)} />
      <Specks f={f} color={GREEN} seed="clk" n={26} />
      <AbsoluteFill style={{ transform: `scale(${1 + 0.1 * EASE.inOut(clamp(f / 60)) + 0.012 * tick})`, transformOrigin: `${DIVE_ORIGIN[0]}px ${DIVE_ORIGIN[1]}px` }}>
        <Dial f={f} />
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, perspective: 1600, perspectiveOrigin: `${CLK.cx}px ${CLK.cy}px` }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `rotateX(${(1 - settle) * 16}deg) rotateY(${(1 - settle) * -12}deg)`, transformOrigin: `${CLK.cx}px ${CLK.cy}px` }}>
            {[
              [{ at: 0, text: "8", bg: GREEN, fg: BLACK }],
              [
                { at: 0, text: "4", bg: GREEN, fg: BLACK },
                { at: 45, text: "5", bg: GREEN, fg: BLACK },
              ],
              [
                { at: 0, text: "9", bg: GREEN, fg: BLACK },
                { at: 45, text: "0", bg: GREEN, fg: BLACK },
              ],
            ].map((seq, i) => (
              <div key={i} style={{ position: "absolute", left: TILE_X[i], top: CLK.cy - CLK.size / 2, transform: `translateY(${-14 * kick(f, 45, 4) * (i > 0 ? 1 : 0)}px)` }}>
                <FlipTile f={f} w={TW} h={CLK.size} font={CLK.size * 0.78} seq={seq} dur={7} radius={CLK.size * 0.1} weight={700} tracking={0} seamOpacity={0.85 * (1 - tw(f, 51, 54))} />
              </div>
            ))}
            {[-1, 1].map((d) => (
              <div key={d} style={{ position: "absolute", left: TILE_X[0] + TW + GAP + COLON / 2 - 15, top: CLK.cy + d * 52 - 15, width: 30, height: 30, borderRadius: 6, background: GREEN, opacity: colon, boxShadow: `0 0 ${18 * colon}px ${GREEN}` }} />
            ))}
          </div>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 90, top: 300 }}>
        <Words f={f} lines={[[{ t: words[0] }, { t: words[1] }]]} at={[1, 15]} size={128} color={GREEN} />
        <div style={{ display: "flex", columnGap: 128 * 0.24, alignItems: "flex-start" }}>
          <Words f={f} lines={[[{ t: words[2] }]]} at={[30]} size={128} color={GREEN} />
          <BlurBox id="mvb" x={mvBlur} style={{ transform: `translateX(${mv(f)}px)`, opacity: f < 39 ? 0 : 1 }}>
            <span style={{ fontFamily: POPPINS, fontSize: 128, fontWeight: 500, lineHeight: 1.04, letterSpacing: "-0.045em", color: GREEN, whiteSpace: "nowrap" }}>moving.</span>
          </BlurBox>
        </div>
      </div>
      <SpeedLines f={f} color={GREEN} p={f >= 39 ? tw(f, 39, 42) * (1 - tw(f, 45, 52)) : 0} n={9} y0={440} y1={560} seed="mv" dir={-1} />
    </Stage>
  );
};

/* ------------------------------------------------------------------ 1 · Like, right now. (60–120) */

export const PunchShot: React.FC<{ f: number }> = ({ f }) => {
  const words = ["Like,", "right", "now."];
  const T = V2.wordHits; // 60 75 90
  const size = 300;
  const ys = [520, 810, 1100];
  const sx = T.reduce((a, t) => a + shake(f, t + 2, 16, 3, 2.4), 0);
  const sy = T.reduce((a, t) => a + shake(f, t + 2, 10, 3, 3.1), 0);
  const punch = 1 + T.reduce((a, t) => a + 0.05 * kick(f, t + 1, 4), 0);
  const ant = 1 - 0.035 * tw(f, 104, 114, 0, 1, EASE.inOut);
  const under = sp(f, 96, { damping: 15, stiffness: 160 });
  return (
    <Stage bg={GREEN}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,.16) 100%)" }} />
      <Specks f={f} color={BLACK} seed="pn" n={22} opacity={0.6} />
      <AbsoluteFill style={{ transform: `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) scale(${(punch * ant).toFixed(4)})`, transformOrigin: "50% 45%" }}>
        {words.map((w, i) => {
          const t0 = T[i];
          if (f < t0) return null;
          const k = sp(f, t0, { damping: 15, stiffness: 300 });
          const b = 18 * (1 - tw(f, t0, t0 + 5));
          let squash = 0;
          for (let j = i + 1; j < 3; j++) squash += kick(f, T[j] + 2, 3);
          const echo = tw(f, t0 + 2, t0 + 16, 0, 1, EASE.out);
          const style: React.CSSProperties = { position: "absolute", left: 90, top: ys[i], fontFamily: POPPINS, fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: "-0.05em", color: BLACK, whiteSpace: "nowrap", transformOrigin: "30% 55%" };
          return (
            <React.Fragment key={w}>
              {echo > 0 && echo < 1 ? <div style={{ ...style, color: "transparent", WebkitTextStroke: `4px ${BLACK}`, transform: `scale(${1 + 0.5 * echo})`, opacity: 0.55 * (1 - echo) }}>{w}</div> : null}
              <div style={{ ...style, opacity: tw(f, t0, t0 + 2), transform: `translateY(${(-16 * squash).toFixed(2)}px) scale(${mix(2.8, 1, k).toFixed(4)}, ${(mix(2.8, 1, k) * (1 - 0.08 * squash)).toFixed(4)})`, filter: b > 0.3 ? `blur(${b.toFixed(1)}px)` : undefined }}>{w}</div>
              <Burst f={f} at={t0 + 2} x={90 + 330} y={ys[i] + 150} color={BLACK} n={16} r0={250} r1={560} len={130} width={10} dur={9} seed={`p${i}`} />
            </React.Fragment>
          );
        })}
        {f >= 96 ? <div style={{ position: "absolute", left: 96, top: ys[2] + 300, width: 640 * under, height: 34, borderRadius: 17, background: BLACK }} /> : null}
      </AbsoluteFill>
    </Stage>
  );
};

/* ------------------------------------------------------------------ 2 · Pod Solo. (120–150) */

const podIn = (f: number) => sp(f, 120, { damping: 13, stiffness: 125 });

const SwingPod: React.FC<{ f: number; id: string }> = ({ f, id }) => {
  const k = podIn(f);
  const x = mix(1650, 540, k);
  const y = mix(1060, 1190, k) - 110 * Math.sin(Math.PI * clamp(k));
  const rot = (1 - k) * 24;
  const land = 131;
  const bounce = f > land ? 7 * Math.exp(-(f - land) / 4) * Math.sin((f - land) / 1.5) : 0;
  const lights = f < 127 ? 0 : f < 129 ? 1 : f < 130 ? 0.25 : tw(f, 130, 133);
  const door = tw(f, 133, 142, 0, 1, EASE.out);
  const w = 960;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - (w * POD_AR) / 2 + bounce, transform: `rotate(${rot}deg)`, transformOrigin: "30% 90%" }}>
      <PodIcon id={id} width={w} lights={lights} door={door} seatGlow={tw(f, 136, 146) * (0.85 + 0.15 * Math.sin((f - 136) / 3))} />
    </div>
  );
};

export const PodSoloShot: React.FC<{ f: number }> = ({ f }) => {
  const k = podIn(f);
  const xv = vel((x) => mix(1650, 540, podIn(x)), f);
  return (
    <Stage bg={BLACK}>
      <Glow x={540} y={1330} r={760} color={GREEN} a={0.26 * clamp(k)} />
      <Specks f={f} color={GREEN} seed="ps" n={24} />
      <Cam f={f} from={120} to={150} push={0.045} extra={`translate(${shake(f, 131, 8, 3, 2.2).toFixed(2)}px, 0px)`}>
        <div style={{ position: "absolute", left: 90, top: 470 }}>
          <Words f={f} lines={[[{ t: "Pod", b: true }, { t: "Solo.", b: true }]]} at={[121, 124]} size={190} color={GREEN} />
        </div>
        <div style={{ position: "absolute", left: 540 - 430, top: 1395, width: 860, height: 70, borderRadius: "50%", background: `radial-gradient(ellipse at center, rgba(32,230,130,${0.35 * clamp(k)}) 0%, rgba(32,230,130,0) 70%)` }} />
        <SpeedLines f={f} color={GREEN} p={(1 - tw(f, 124, 133)) * (f >= 120 ? 1 : 0)} n={16} y0={1020} y1={1360} seed="pod" dir={1} />
        <BlurBox id="podb" x={Math.min(34, xv * 0.32)} style={{ position: "absolute", inset: 0 }}>
          <Ghosts f={f} n={3} lag={1.1} opacity={xv > 4 ? 0.3 : 0} render={(fr) => <SwingPod f={fr} id={`ps${Math.round(fr * 10)}`} />} />
        </BlurBox>
      </Cam>
    </Stage>
  );
};

/* ------------------------------------------------------------------ 3 · Here's how. (150–180) */

export const HowShot: React.FC<{ f: number }> = ({ f }) => {
  const draw = tw(f, 159, 168, 0, 1, EASE.out);
  const bob = 22 * kick(f, 165, 4) * Math.sin((f - 165) * 0.9);
  const ant = -60 * tw(f, 169, 174, 0, 1, EASE.inOut);
  const launch = (x: number) => 1600 * tw(x, 174, 181, 0, 1, EASE.in);
  const ly = launch(f);
  const stretch = 1 + Math.min(1.4, vel(launch, f) / 160);
  return (
    <Stage bg={GREEN}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 40% 40%, rgba(0,0,0,0) 45%, rgba(0,0,0,.14) 100%)" }} />
      <Specks f={f} color={BLACK} seed="hw" n={22} opacity={0.6} />
      <Cam f={f} from={150} to={180} push={0.05}>
        <div style={{ position: "absolute", left: 90, top: 520 }}>
          <Words f={f} lines={[[{ t: "Here's" }], [{ t: "how." }]]} at={[151, 155]} size={260} color={BLACK} lh={1.0} />
        </div>
        <div style={{ position: "absolute", left: 120, top: 1120 + bob + ant + ly, transform: `rotate(90deg) scale(${stretch}, 1)`, transformOrigin: "0% 50%" }}>
          <Arrow size={150} color={BLACK} p={draw} stroke={22} />
        </div>
      </Cam>
    </Stage>
  );
};

/* ------------------------------------------------------------------ 8/9 · Blink. (510–540, 555–570) */

const almond = (o: number) => `M10 90 Q150 ${(90 - 112 * o).toFixed(2)} 290 90 Q150 ${(90 + 112 * o).toFixed(2)} 10 90 Z`;

const EyeV2: React.FC<{ id: string; w: number; lid: number; px: number; py: number; fg: string; bg: string }> = ({ id, w, lid, px, py, fg, bg }) => {
  const o = Math.max(0.025, 1 - lid);
  return (
    <svg width={w} height={w * 0.6} viewBox="0 0 300 180" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <clipPath id={`ec-${id}`}>
          <path d={almond(o)} />
        </clipPath>
      </defs>
      <path d={almond(o)} fill={fg} />
      <g clipPath={`url(#ec-${id})`}>
        <circle cx={150 + px} cy={90 + py} r={52} fill={bg} />
        <circle cx={150 + px} cy={90 + py} r={25} fill={fg} />
        <circle cx={169 + px} cy={71 + py} r={9} fill={bg} />
      </g>
      {lid > 0.55 ? <path d="M10 90 Q150 150 290 90" fill="none" stroke={fg} strokeWidth={12} strokeLinecap="round" /> : null}
    </svg>
  );
};

/** The whole frame closes/opens like an eyelid (k: 0 shut → 1 open). */
const lens = (k: number, cy = 1180) => {
  const c = (k * 4600).toFixed(1);
  return `path('M -140 ${cy} Q 540 ${(cy - Number(c)).toFixed(1)} 1220 ${cy} Q 540 ${(cy + Number(c)).toFixed(1)} -140 ${cy} Z')`;
};

const BlinkFrame: React.FC<{ f: number; slamAt?: number | null; lid: number; px: number; eyeIn: number; wordBlink: number }> = ({ f, slamAt = null, lid, px, eyeIn, wordBlink }) => {
  const k = slamAt === null ? 1 : sp(f, slamAt, { damping: 14, stiffness: 300 });
  const b = slamAt === null ? 0 : 14 * (1 - tw(f, slamAt, slamAt + 4));
  return (
    <>
      <Glow x={540} y={1180} r={800} color={GREEN} a={0.14} />
      <Specks f={f} color={GREEN} seed="bl" n={20} />
      <div style={{ position: "absolute", left: 90, top: 470, fontFamily: POPPINS, fontWeight: 800, fontSize: 300, lineHeight: 1, letterSpacing: "-0.05em", color: GREEN, whiteSpace: "nowrap", transformOrigin: "40% 58%", transform: `scale(${mix(1.4, 1, k).toFixed(4)}, ${(mix(1.4, 1, k) * (1 - 0.92 * wordBlink)).toFixed(4)})`, filter: b > 0.3 ? `blur(${b.toFixed(1)}px)` : undefined, opacity: slamAt === null || f >= slamAt ? 1 : 0 }}>
        Blink.
      </div>
      <div style={{ position: "absolute", left: 540 - 360, top: 1180 - 216, transform: `scale(${eyeIn})`, transformOrigin: "50% 50%" }}>
        <EyeV2 id={`e${slamAt ?? 0}`} w={720} lid={lid} px={px} py={0} fg={GREEN} bg={BLACK} />
      </div>
    </>
  );
};

export const BlinkShot: React.FC<{ f: number }> = ({ f }) => {
  const blink = Math.sin(Math.PI * tw(f, SFX.blink[0] - 3, SFX.blink[0] + 5, 0, 1, EASE.inOut));
  const px = keys(f, [
    [512, 0],
    [514, -46],
    [517, -46],
    [519, 46],
    [521, 46],
    [523, 0],
  ]);
  const close = tw(f, 531, 540, 0, 1, EASE.inOut);
  return (
    <Stage bg={BLACK}>
      <AbsoluteFill style={{ clipPath: close > 0 ? lens(mix(2.2, 0, close)) : undefined }}>
        <Cam f={f} from={510} to={540} push={0.04}>
          <BlinkFrame f={f} slamAt={510} lid={Math.max(blink, close)} px={px} eyeIn={sp(f, 512, { damping: 12, stiffness: 190 })} wordBlink={blink} />
        </Cam>
      </AbsoluteFill>
    </Stage>
  );
};

export const BlinkBackShot: React.FC<{ f: number }> = ({ f }) => {
  const open = tw(f, 555, 564, 0, 1, EASE.inOut);
  const lid = 1 - tw(f, 557, 565, 0, 1, EASE.out);
  return (
    <Stage bg={BLACK}>
      <AbsoluteFill style={{ clipPath: open < 1 ? lens(mix(0, 2.2, open)) : undefined }}>
        <AbsoluteFill style={{ transform: `scale(${mix(1.1, 1, open)})` }}>
          <Cam f={f} from={555} to={570} push={0.03}>
            <BlinkFrame f={f} lid={lid} px={0} eyeIn={1} wordBlink={0} />
          </Cam>
        </AbsoluteFill>
      </AbsoluteFill>
    </Stage>
  );
};

/* ------------------------------------------------------------------ 10 · And your Pod is here. (570–630, dead still) */

const HERE = { cx: 515, cy: 1180, w: 820 };

export const HereShot: React.FC<{ f: number }> = ({ f }) => {
  const door = f < SFX.door[0] ? 0 : Math.min(1.06, tw(f, SFX.door[0], SFX.door[0] + 6, 0, 1.06, EASE.out)) - 0.06 * tw(f, SFX.door[0] + 6, SFX.door[0] + 10);
  const seat = tw(f, SFX.door[0] + 1, SFX.door[0] + 12) + 0.25 * tw(f, 615, 630, 0, 1, EASE.in);
  const push = 1 + 0.025 * ((f - 570) / 60) + 0.014 * tw(f, SFX.door[0], SFX.door[0] + 6, 0, 1, EASE.out);
  const doorX = HERE.cx - HERE.w / 2 + HERE.w * 0.42;
  const top = HERE.cy - (HERE.w * POD_AR) / 2;
  return (
    <Stage bg={BLACK}>
      <Glow x={540} y={1200} r={820} color={GREEN} a={0.1} />
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(5)})`, transformOrigin: "50% 62%" }}>
        <div style={{ position: "absolute", left: 90, top: 330, fontFamily: POPPINS, fontWeight: 800, fontSize: 150, lineHeight: 1.04, letterSpacing: "-0.045em", color: GREEN }}>
          <div>And your</div>
          <div>Pod is here.</div>
        </div>
        <div style={{ position: "absolute", left: HERE.cx - 380, top: HERE.cy + 140, width: 760, height: 100, borderRadius: "50%", border: `4px solid ${GREEN}`, opacity: 0.4 }} />
        <div style={{ position: "absolute", left: doorX - 260, top: HERE.cy + 100, width: 520, height: 190, borderRadius: "50%", background: `radial-gradient(ellipse at center, rgba(32,230,130,${0.55 * seat}) 0%, rgba(32,230,130,0) 70%)` }} />
        <div style={{ position: "absolute", left: HERE.cx - 85, top: top - 300 }}>
          <Pin size={170} fg={GREEN} bg={BLACK} />
        </div>
        <div style={{ position: "absolute", left: HERE.cx - HERE.w / 2, top }}>
          <PodIcon id="here" width={HERE.w} lights={0.35} door={door} seatGlow={Math.min(1, seat)} />
        </div>
        <Shock f={f} at={SFX.door[0]} x={doorX + 40} y={HERE.cy} color={GREEN} size={760} n={1} dur={24} width={4} />
      </AbsoluteFill>
    </Stage>
  );
};

/* ------------------------------------------------------------------ 11 · All yours. (630–690) */

export const YOURS_C: [number, number] = [520, 1150];

export const YoursShot: React.FC<{ f: number }> = ({ f }) => {
  const k = sp(f, 631, { damping: 16, stiffness: 120 });
  const flash = 1 - tw(f, 630, 637);
  const glowT = SFX.glow[0]; // 640
  const pull = mix(2.2, 1, sp(f, 630, { damping: 20, stiffness: 100 }));
  return (
    <Stage bg={BLACK}>
      <Glow x={YOURS_C[0]} y={YOURS_C[1]} r={950} color={GREEN} a={0.12 + 0.3 * tw(f, glowT, glowT + 10) - 0.12 * tw(f, glowT + 10, glowT + 40)} />
      <Specks f={f} color={GREEN} seed="yo" n={30} />
      <Cam f={f} from={630} to={690} push={0.05}>
        <div style={{ position: "absolute", left: 90, top: 380 }}>
          <Words f={f} lines={[[{ t: "All" }, { t: "yours." }]]} at={[631, 634]} size={180} color={GREEN} mode="slam" />
        </div>
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, perspective: 1700, perspectiveOrigin: `${YOURS_C[0]}px ${YOURS_C[1] - 300}px` }}>
          <div style={{ position: "absolute", left: YOURS_C[0] - 220, top: YOURS_C[1] - 381, transform: `rotateX(30deg) rotateZ(${keys(f, [[630, -14], [690, 8]]).toFixed(2)}deg) scale(${pull.toFixed(4)})`, transformOrigin: "50% 50%" }}>
            <SeatMap width={440} fg={GREEN} bg={BLACK} stretch={clamp(k, 0, 1.04)} solo={2} outline={0.6} glow={0.6 + 0.4 * Math.sin((f - 630) / 4)} carGlow={tw(f, glowT, glowT + 16, 0, 1, EASE.out)} />
          </div>
        </div>
        <Shock f={f} at={glowT} x={YOURS_C[0]} y={YOURS_C[1]} color={GREEN} size={1500} n={3} dur={22} width={8} flat={0.55} />
        <Sparks f={f} at={glowT} x={YOURS_C[0]} y={YOURS_C[1]} color={GREEN} n={34} speed={40} life={44} size={11} seed="yours" flat={0.7} />
      </Cam>
      {flash > 0 ? <AbsoluteFill style={{ background: GREEN, opacity: 0.55 * flash }} /> : null}
    </Stage>
  );
};

/* ------------------------------------------------------------------ 12 · Catch a call / a nap / your breath. (690–780) */

const STREET_GRID = (() => {
  const out: string[] = [];
  for (let i = 0; i < 15; i++) {
    const x = -900 + i * 200 + (random(`gx${i}`) - 0.5) * 60;
    out.push(`M${x} -2600 L${x + (random(`gk${i}`) - 0.5) * 140} 2600`);
  }
  for (let j = 0; j < 26; j++) {
    const y = -2600 + j * 200 + (random(`gy${j}`) - 0.5) * 60;
    out.push(`M-1000 ${y} L2000 ${y + (random(`gl${j}`) - 0.5) * 120}`);
  }
  return out;
})();

const Ground: React.FC<{ f: number; color: string; speed: number }> = ({ f, color, speed }) => {
  const off = ((mt(f) * speed) % 400) + 400;
  return (
    <AbsoluteFill style={{ perspective: 900, perspectiveOrigin: "50% 18%", WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0) 12%, rgba(0,0,0,1) 42%)", maskImage: "linear-gradient(180deg, rgba(0,0,0,0) 12%, rgba(0,0,0,1) 42%)" }}>
      <svg width={3000} height={5200} viewBox="-1000 -2600 3000 5200" style={{ position: "absolute", left: W / 2 - 1500, top: H * 0.66 - 2600, transform: `rotateX(64deg) translateY(${off}px)`, transformOrigin: "50% 50%" }}>
        <g stroke={color} fill="none" strokeWidth={9} opacity={0.17}>
          {STREET_GRID.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const CatchShot: React.FC<{ f: number }> = ({ f }) => {
  const P = CARDS[13].punch!; // 690 720 750
  const icons = [CallIcon, SleepIcon, BreathIcon];
  const second = ["a call.", "a nap.", "your breath."];
  // badge: pops in at 690, flips (rotateY) to the next icon on each beat
  const pop = sp(f, P[0], { damping: 11, stiffness: 200 });
  let ang = 0;
  let face = 0;
  for (let i = 1; i < 3; i++) {
    const q = tw(f, P[i] - 3, P[i] + 5, 0, 1, EASE.inOut);
    if (q > 0 && q < 1) {
      ang = q < 0.5 ? q * 180 : (q - 1) * 180;
      face = q < 0.5 ? i - 1 : i;
    } else if (q >= 1) face = i;
  }
  const hit = P.reduce((a, t) => a + kick(f, t, 4), 0);
  const Ico = icons[face];
  return (
    <Stage bg={GREEN}>
      <Ground f={f} color={BLACK} speed={10} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 42%, rgba(0,0,0,0) 35%, rgba(0,0,0,.14) 100%)" }} />
      <Specks f={f} color={BLACK} seed="ct" n={18} opacity={0.5} />
      <Cam f={f} from={690} to={780} push={0.05}>
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, perspective: 1400 }}>
          <div style={{ position: "absolute", left: 540 - 165, top: 760 - 165, width: 330, height: 330, transform: `scale(${(pop * (1 + 0.12 * hit)).toFixed(4)}) rotateY(${ang.toFixed(2)}deg) rotate(${((1 - pop) * -30).toFixed(2)}deg)`, borderRadius: 9999, background: BLACK, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 30px 70px rgba(0,0,0,.25)" }}>
            <Ico size={190} fg={GREEN} bg={BLACK} t={f - P[face]} />
          </div>
        </div>
        {P.map((t, i) => (
          <Burst key={t} f={f} at={t} x={540} y={760} color={BLACK} n={14} r0={200} r1={360} len={80} width={9} dur={9} seed={`c${i}`} rot={i * 13} />
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, top: 1010, display: "flex", justifyContent: "center" }}>
          <Words f={f} lines={[[{ t: "Catch" }]]} at={[691]} size={150} color={BLACK} align="center" />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1168, height: 176, overflow: "hidden" }}>
          {second.map((s, i) => {
            const D = 210;
            const tin = i === 0 ? P[0] + 2 : P[i] - 2;
            const tout = i < 2 ? P[i + 1] - 2 : 100000;
            const ein = i === 0 ? EASE.out : EASE.inOut;
            const yAt = (x: number) => (1 - tw(x, tin, tin + 9, 0, 1, ein)) * D - tw(x, tout, tout + 9, 0, 1, EASE.inOut) * D;
            if (f < tin || f > tout + 9) return null;
            const vb = vel(yAt, f);
            return (
              <div key={s} style={{ position: "absolute", left: 0, right: 0, top: 4, textAlign: "center", transform: `translateY(${yAt(f).toFixed(2)}px)`, fontFamily: POPPINS, fontWeight: 500, fontSize: 150, lineHeight: 1.04, letterSpacing: "-0.045em", color: BLACK, whiteSpace: "nowrap", filter: vb > 3 ? `blur(${Math.min(9, vb * 0.18).toFixed(1)}px)` : undefined }}>
                {s}
              </div>
            );
          })}
        </div>
      </Cam>
    </Stage>
  );
};

/* ------------------------------------------------------------------ 13 · Pod Solo. pulls away (780–840) */

const speedAt = (f: number) => keys(f, [
  [780, 0],
  [796, 0],
  [828, 86, EASE.in],
  [840, 150, EASE.in],
]);
const distAt = (f: number) => {
  let d = 0;
  for (let t = 780; t < f; t++) d += speedAt(t + 0.5) * Math.min(1, f - t);
  return d;
};

export const AwayShot: React.FC<{ f: number }> = ({ f }) => {
  const v = speedAt(f);
  const d = distAt(f);
  const p = v / 150;
  const carX = (x: number) => 540 + (x > 826 ? (x - 826) ** 2 * 4.2 : 0);
  const cx = carX(f);
  const blur = Math.min(46, vel(carX, f) * 0.35) + p * 6;
  const squat = -2.2 * tw(f, 794, 799, 0, 1, EASE.out) * (1 - 0.5 * tw(f, 805, 826));
  const idle = f < 796 ? 0.9 * Math.sin(f * 2.7) : 1.6 * p * Math.sin(f * 3.3);
  const w = 920;
  const skew = -10 * tw(f, 826, 838, 0, 1, EASE.in);
  return (
    <Stage bg={GREEN}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 55%, rgba(0,0,0,0) 40%, rgba(0,0,0,.14) 100%)" }} />
      <Specks f={f} color={BLACK} seed="aw" n={18} opacity={0.5} />
      <SpeedLines f={f} color={BLACK} p={p} n={30} y0={780} y1={1470} seed="away" dir={-1} />
      <Cam f={f} from={780} to={840} push={0.04}>
        <div style={{ position: "absolute", left: 90, top: 470, transform: `skewX(${skew}deg)`, transformOrigin: "0% 100%" }}>
          <Words f={f} lines={[[{ t: "Pod", b: true }, { t: "Solo.", b: true }]]} at={[781, 784]} size={190} color={BLACK} />
        </div>
        {/* road: dashed centre line streaming past */}
        <div style={{ position: "absolute", left: 0, top: 1372, width: W, height: 12, overflow: "hidden" }}>
          {Array.from({ length: 12 }, (_, i) => {
            const x = ((((i * 180 - d) % 2160) + 2160) % 2160) - 180;
            return <div key={i} style={{ position: "absolute", left: x, top: 0, width: 110 + 160 * p, height: 12, borderRadius: 6, background: BLACK, opacity: 0.55 }} />;
          })}
        </div>
        <div style={{ position: "absolute", left: 0, top: 1404, width: W, height: 4, background: BLACK, opacity: 0.18 }} />
        <BlurBox id="awayb" x={blur} style={{ position: "absolute", left: cx - w / 2, top: 1135 - (w * POD_AR) / 2 + idle, transform: `rotate(${squat}deg)`, transformOrigin: "20% 92%" }}>
          <PodIcon id="away" width={w} lights={1} />
        </BlurBox>
      </Cam>
    </Stage>
  );
};

/* ------------------------------------------------------------------ 14 · Pod Now. end frame (840–900) */

export const EndShot: React.FC<{ f: number }> = ({ f }) => {
  const btn = V2.sections.button;
  const words = END_LINE.split(" "); // Safe. Set. Smooth.
  const wt = [849, 855, 862];
  const under = sp(f, 847, { damping: 16, stiffness: 150 });
  const mark = sp(f, 856, { damping: 11, stiffness: 170 });
  const hit = kick(f, btn, 5);
  const glint = tw(f, btn, btn + 12, 0, 1, EASE.inOut);
  return (
    <Stage bg={BLACK}>
      <Glow x={420} y={780} r={900} color={GREEN} a={0.12 + 0.12 * hit + 0.03 * Math.sin((f - 840) / 9)} />
      <Specks f={f} color={GREEN} seed="end" n={24} />
      <AbsoluteFill style={{ transform: `scale(${(1 + 0.035 * hit).toFixed(4)})`, transformOrigin: "50% 50%" }}>
        <div style={{ position: "absolute", left: 90, top: 380 }}>
          <Words f={f} lines={[[{ t: "Pod", b: true }], [{ t: "Now.", b: true }]]} at={[841, 845]} size={290} color={GREEN} mode="slam" lh={1.0} />
        </div>
        <div style={{ position: "absolute", left: 100, top: 1000, width: 640 * clamp(under, 0, 1.05), height: 32, borderRadius: 16, background: GREEN, boxShadow: `0 0 ${24 + 30 * hit}px rgba(32,230,130,${0.5 + 0.4 * hit})` }} />
        <div style={{ position: "absolute", left: 90, bottom: 440, display: "flex", columnGap: 22 }}>
          {words.map((w, i) => {
            const k = sp(f, wt[i], { damping: 11, stiffness: 210 });
            return (
              <span key={w} style={{ display: "inline-block", fontFamily: POPPINS, fontSize: 66, fontWeight: 800, letterSpacing: "-0.02em", color: GREEN, opacity: tw(f, wt[i], wt[i] + 3), transform: `translateY(${((1 - k) * 40).toFixed(2)}px) scale(${(0.6 + 0.4 * k).toFixed(4)})`, transformOrigin: "0% 100%" }}>
                {w}
              </span>
            );
          })}
        </div>
        <div style={{ position: "absolute", right: 170, bottom: 430, transform: `scale(${(mark * (1 + 0.16 * hit)).toFixed(4)}) rotate(${((1 - mark) * -90).toFixed(2)}deg)`, transformOrigin: "60% 60%" }}>
          <GlintMark size={92 * 1.9} color={GREEN} g={glint} />
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

/** The S mark with a light sweep across it (g 0→1); tint of the accent only. */
const GlintMark: React.FC<{ size: number; color: string; g: number }> = ({ size, color, g }) => {
  const url = `url(${staticFile("brand/shuttlers-mark.svg")})`;
  const c = mix(-40, 140, g);
  const bg = g > 0 && g < 1 ? `linear-gradient(115deg, ${color} ${c - 18}%, #A6F5CD ${c}%, ${color} ${c + 18}%)` : color;
  return <div style={{ width: (size * 1212) / 1532, height: size, background: bg, WebkitMaskImage: url, maskImage: url, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" }} />;
};

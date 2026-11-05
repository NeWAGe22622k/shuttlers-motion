import React from "react";
import { AbsoluteFill } from "remotion";
import { C, EASE } from "../../config/brand";
import { content } from "../../config/content";
import { AppIcon, Finger, FingerTrack, Roll } from "../../components/core";
import { Push } from "../../components/LiftOut";
import { bump, clamp, mix, press, sp, tw } from "../../components/motion";
import { BtnState, PayMethodRow, RideOptionRow, ServiceCard } from "../../components/ui";
import { HomeScreen } from "../../screens/Home";
import { Pin } from "../art";
import { V2_APP } from "../content";
import { DEST_PIN, PAY_ICONS, PICKUP_PT, PaymentScreen, RideOptionsScreen, RouteCard, SetDestinationScreen } from "../appV2";
import { SMark } from "../kit";
import { BLACK, GREEN } from "../theme";
import { BeatRings, Burst, Glow, H, Sparks, Specks, V2, W, beat, kick, mt, shake } from "./engine";
import { At, BH, LiftShadow, PS, Phone3D, Pose, bx, by } from "./phone3d";
import { FlipTile, Seg, Words } from "./type";

/**
 * Steps 1–4 (frames 180–510) as one continuous shot: a single 3D phone the camera keeps moving
 * around while the world wipes colour behind it on every step. App pieces lift off the glass
 * (Pod tile, route card, Pod Solo row), the destination pin falls from the sky, and the payment
 * options fan out into a 3D picker that flicks on the beat.
 */

const SFX = V2.sfx;
const TAP = SFX.tap; // 210 Pod tile · 390 Pod Solo row · 405 Continue · 495 Card
const PIN_AT = SFX.pin[0]; // 285
const FLICK = SFX.flick; // 450 458 466 474 482
export const ACT_STEPS = [180, 270, 360, 450];
const WIPES = [270, 360, 450];
const PUSHES = [266, 356, 440];
const PAIRS = [
  { bg: BLACK, fg: GREEN },
  { bg: GREEN, fg: BLACK },
  { bg: BLACK, fg: GREEN },
  { bg: GREEN, fg: BLACK },
];
const LINES: Seg[][][] = [
  [[{ t: "Open Shuttlers." }], [{ t: "Tap Pod." }]],
  [[{ t: "Set your" }], [{ t: "destination." }]],
  [[{ t: "Choose" }], [{ t: "Pod Solo." }]],
  [[{ t: "Pay your way." }]],
];
const stepOf = (f: number) => (f < WIPES[0] ? 0 : f < WIPES[1] ? 1 : f < WIPES[2] ? 2 : 3);

/* ------------------------------------------------------------------ world + wipes */

const World: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const { bg, fg } = PAIRS[k];
  const dark = bg === BLACK;
  return (
    <AbsoluteFill style={{ background: bg }}>
      <Glow x={540} y={1060} r={980} color={dark ? GREEN : "#000000"} a={dark ? 0.22 : 0.12} />
      <BeatRings f={f} x={540} y={1060} color={fg} a={dark ? 0.22 : 0.18} r0={330} r1={1300} />
      <Specks f={f} color={fg} seed={`w${k}`} n={30} />
      {f >= 185 ? (
        <div style={{ position: "absolute", right: 170, bottom: 430, transform: `scale(${1 + 0.06 * beat(f)})`, transformOrigin: "100% 100%" }}>
          <SMark size={92} color={fg} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const SL = 0.34; // wipe edge slant (dx per dy): a "/" edge, top leading
const edgeX = (e: number, y: number) => e + SL * (H / 2 - y);
const poly = (e: number) => `polygon(-80px -80px, ${edgeX(e, -80)}px -80px, ${edgeX(e, H + 80)}px ${H + 80}px, -80px ${H + 80}px)`;
const band = (e0: number, e1: number) => `polygon(${edgeX(e0, -80)}px -80px, ${edgeX(e1, -80)}px -80px, ${edgeX(e1, H + 80)}px ${H + 80}px, ${edgeX(e0, H + 80)}px ${H + 80}px)`;
const wipeE = (f: number, at: number) => mix(-SL * (H / 2 + 80) - 320, W + SL * (H / 2 + 80) + 40, tw(f, at - 6, at + 6, 0, 1, EASE.inOut));

const Worlds: React.FC<{ f: number }> = ({ f }) => {
  const j = WIPES.findIndex((w) => f >= w - 6 && f < w + 6);
  if (j < 0) return <World f={f} k={stepOf(f)} />;
  const e = wipeE(f, WIPES[j]);
  const nb = PAIRS[j + 1].bg;
  return (
    <AbsoluteFill>
      <World f={f} k={j} />
      <AbsoluteFill style={{ background: nb, clipPath: band(e + 70, e + 170) }} />
      <AbsoluteFill style={{ background: nb, clipPath: band(e + 240, e + 272) }} />
      <AbsoluteFill style={{ clipPath: poly(e) }}>
        <World f={f} k={j + 1} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ phone pose */

const POSES: Pose[] = [
  { cx: 540, cy: 1090, s: 1.24, rx: 7, ry: -16, rz: -2.5, z: 0 },
  { cx: 540, cy: 1185, s: 1.3, rx: 9, ry: 15, rz: 2.5, z: 0 },
  { cx: 540, cy: 985, s: 1.18, rx: 7, ry: -13, rz: -2, z: 0 },
  { cx: 540, cy: 1020, s: 1.2, rx: 8, ry: 11, rz: 1.5, z: -30 },
];
const ENTER: Pose = { cx: 540, cy: 2750, s: 0.92, rx: 58, ry: 38, rz: -26, z: -450 };

export const actPose = (f: number): Pose => {
  const swing = { damping: 15, stiffness: 115 };
  const val = (key: keyof Pose) => {
    let v = mix(ENTER[key], POSES[0][key], sp(f, 176, { damping: 16, stiffness: 95 }));
    for (let j = 0; j < 3; j++) v = mix(v, POSES[j + 1][key], sp(f, PUSHES[j] - 2, swing));
    return v;
  };
  const t = mt(f);
  let z = val("z");
  let rx = val("rx") + 1.6 * Math.sin(t / 51);
  let cy = val("cy") + 7 * Math.sin(t / 45);
  for (const at of TAP) {
    z -= 55 * kick(f, at, 5);
    rx += 2.4 * kick(f, at, 5);
  }
  z -= 90 * kick(f, PIN_AT, 4);
  cy += 16 * kick(f, PIN_AT, 4);
  return { cx: val("cx"), cy, s: val("s"), rx, ry: val("ry") + 2.6 * Math.sin(t / 38), rz: val("rz") + 0.8 * Math.sin(t / 66), z };
};

/* ------------------------------------------------------------------ lift timings */

const tileLift = (f: number) => clamp(sp(f, TAP[0] + 1, { damping: 13, stiffness: 150 }) * (1 - tw(f, 250, 259, 0, 1, EASE.inOut)), 0, 1.1);
const cardLift = (f: number) => clamp(sp(f, PIN_AT + 3, { damping: 16, stiffness: 140 }) * (1 - tw(f, 341, 350, 0, 1, EASE.inOut)), 0, 1.1);
const rowLift = (f: number) => clamp(sp(f, TAP[1] + 1, { damping: 12, stiffness: 190 }) * (1 - tw(f, TAP[2], TAP[2] + 6, 0, 1, EASE.in)), 0, 1.1);
const drumOut = (f: number, i: number) => clamp(sp(f, 449 + i * 1.2, { damping: 17, stiffness: 150 }) * (1 - tw(f, 499 + i * 1.5, 507 + i * 1.5, 0, 1, EASE.inOut)), 0, 1.08);
const drumC = (f: number) => {
  const cfg = { damping: 24, stiffness: 430 };
  let c = 0;
  for (let k = 1; k < FLICK.length; k++) c = mix(c, k, sp(f, FLICK[k], cfg));
  return mix(c, 0, sp(f, 485, { damping: 22, stiffness: 260 }));
};

/* ------------------------------------------------------------------ the screens inside */

const LAUNCH: [number, number] = [187, 199];
const Wallpaper: React.FC = () => <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 28% 22%, #155c3a 0%, #0a2519 40%, #050807 100%)" }} />;

const S1: React.FC<{ f: number }> = ({ f }) => {
  const p = tw(f, LAUNCH[0], LAUNCH[1], 0, 1, EASE.inOut);
  const hi = f < TAP[0] ? Math.max(bump(f, 195, 5), tw(f, 202, 209)) : 0;
  const home = <HomeScreen pod={{ hi, press: press(f, TAP[0]), ghost: tileLift(f) > 0.02 }} />;
  if (p >= 1) return home;
  const r = mix(24, 1000, p);
  return (
    <>
      <Wallpaper />
      <div style={{ position: "absolute", inset: 0, clipPath: `circle(${r}px at 196.5px 426px)` }}>{home}</div>
      <div style={{ position: "absolute", left: 196.5 - 38, top: 426 - 38, transform: `scale(${mix(1, 6, EASE.in(p))})`, opacity: 1 - tw(f, LAUNCH[0] + 3, LAUNCH[1] - 2) }}>
        <AppIcon size={76} glint={tw(f, 180, 187, 0, 1, EASE.inOut)} />
      </div>
    </>
  );
};

const S2: React.FC<{ f: number }> = ({ f }) => {
  const landed = f >= PIN_AT + 6;
  return (
    <SetDestinationScreen
      pinK={landed ? 1 : 0}
      showPin={landed}
      route={f < PIN_AT + 4 ? -1 : tw(f, PIN_AT + 4, PIN_AT + 30, 0, 1, EASE.inOut)}
      ping={((((f - 270) / 30) % 1) + 1) % 1}
      hideCard={cardLift(f) > 0.02}
    />
  );
};

const S3: React.FC<{ f: number }> = ({ f }) => {
  const cont: BtnState = f >= TAP[2] + 4 ? "loading" : f >= TAP[2] ? "pressed" : "default";
  return <RideOptionsScreen rowsIn={tw(f, 361, 375)} sel={tw(f, TAP[1], TAP[1] + 6, 0, 1, EASE.out)} cont={cont} spin={f} ghostPod={rowLift(f) > 0.02} dimOthers={tw(f, TAP[1], TAP[1] + 6) * (1 - tw(f, TAP[2] + 2, TAP[2] + 12))} />;
};

const S4: React.FC<{ f: number }> = ({ f }) => (
  <PaymentScreen
    hi={-2}
    sel={tw(f, 501, 507)}
    cardPress={1}
    secs={V2_APP.pay.countdownFrom - Math.max(0, Math.floor((f - 450) / 30))}
    cont={tw(f, 503, 509, 0, 1, EASE.inOut)}
    ghost={[0, 1, 2, 3, 4].map((i) => (drumOut(f, i) > 0.02 ? 1 : 0))}
  />
);

const Screen: React.FC<{ f: number }> = ({ f }) => {
  const scr = [S1, S2, S3, S4];
  for (let j = 0; j < 3; j++) {
    if (f < PUSHES[j]) {
      const A = scr[j];
      return <A f={f} />;
    }
    if (f < PUSHES[j] + 10) {
      const A = scr[j];
      const B = scr[j + 1];
      return <Push f={f} at={PUSHES[j]} dur={10} from={<A f={f} />} to={<B f={f} />} />;
    }
  }
  return <S4 f={f} />;
};

const TAPS: [number, number, number][] = [
  [TAP[0], 196, 479],
  [TAP[1], 196, 562],
  [TAP[2], 196, 777],
];

/* ------------------------------------------------------------------ things on / above the glass */

/** Rings on the glass that keep going past the phone's edges. */
const GlassRing: React.FC<{ f: number; at: number; x: number; y: number; z?: number; color: string; r1?: number; n?: number; dur?: number; width?: number }> = ({ f, at, x, y, z = 1, color, r1 = 330, n = 2, dur = 16, width = 7 }) => {
  if (f < at || f > at + dur + n * 4) return null;
  return (
    <div style={{ position: "absolute", left: bx(x), top: by(y), width: 0, height: 0, transform: `translateZ(${z}px)` }}>
      {Array.from({ length: n }, (_, i) => {
        const p = tw(f, at + i * 4, at + i * 4 + dur, 0, 1, EASE.out);
        if (p <= 0 || p >= 1) return null;
        const r = r1 * (0.08 + 0.92 * p);
        return <div key={i} style={{ position: "absolute", left: -r, top: -r, width: 2 * r, height: 2 * r, borderRadius: 9999, border: `${(width * (1 - p) + 1.2).toFixed(2)}px solid ${color}`, opacity: (1 - p) * (1 - 0.3 * i) }} />;
      })}
    </div>
  );
};

/** Wrapper that puts 2D frame-style effects (Burst, Sparks) at a glass point. */
const OnGlass: React.FC<{ x: number; y: number; z?: number; children: React.ReactNode }> = ({ x, y, z = 2, children }) => (
  <div style={{ position: "absolute", left: bx(x), top: by(y), width: 0, height: 0, transform: `translateZ(${z}px)` }}>{children}</div>
);

const GlowRing: React.FC<{ a: number; r?: number; pad?: number; color?: string }> = ({ a, r = 20, pad = 7, color = GREEN }) =>
  a <= 0.01 ? null : <div style={{ position: "absolute", inset: -pad, borderRadius: r + pad, border: `3px solid ${color}`, boxShadow: `0 0 26px ${color}, inset 0 0 14px ${color}88`, opacity: a }} />;

const DRUM = { cx: 196.5, cy: 150 + 182 + 2 * 66 + 28.5, zA: 150, R: 150, step: 30, scale: 1.42 };

const Drum: React.FC<{ f: number }> = ({ f }) => {
  const c = drumC(f);
  const cv = Math.abs(drumC(f + 0.5) - drumC(f - 0.5));
  const methods = V2_APP.pay.methods;
  const icons = PAY_ICONS();
  const selCard = tw(f, TAP[3], TAP[3] + 5);
  const order = [0, 1, 2, 3, 4].sort((a, b) => Math.abs(b - c) - Math.abs(a - c));
  const band = drumOut(f, 2);
  const bw = 353 * PS * DRUM.scale + 26;
  const bh = 57 * PS * DRUM.scale + 22;
  return (
    <>
      {band > 0.3 ? (
        <div style={{ position: "absolute", left: bx(DRUM.cx) - bw / 2, top: by(DRUM.cy) - bh / 2, width: bw, height: bh, borderRadius: 24, border: `4px solid ${GREEN}`, boxShadow: `0 0 28px ${GREEN}, inset 0 0 16px ${GREEN}88`, transform: `translateZ(${DRUM.zA + DRUM.R + 2}px)`, opacity: tw(band, 0.3, 0.9) * (0.85 + 0.15 * Math.sin(f / 2.5)) }} />
      ) : null}
      {order.map((i) => {
        const L = drumOut(f, i);
        if (L <= 0.01) return null;
        const th = -(i - c) * DRUM.step;
        const rad = (th * Math.PI) / 180;
        const slotY = by(150 + 182 + i * 66);
        const slotCy = slotY + (57 * PS) / 2;
        const drumCy = by(DRUM.cy) - DRUM.R * Math.sin(rad);
        const z = (DRUM.zA + DRUM.R * Math.cos(rad)) * L;
        const vis = clamp((Math.cos(rad) - 0.05) / 0.5);
        const shade = (1 - Math.cos(rad)) * 0.55 * L;
        const blurY = Math.min(4, cv * 14) * L;
        const tapRing = i === 0 ? Math.max(0, 1 - tw(f, TAP[3] + 4, TAP[3] + 16)) * tw(f, TAP[3], TAP[3] + 3) : 0;
        return (
          <div key={i} style={{ position: "absolute", left: bx(20), top: slotY, width: 353 * PS, height: 57 * PS, transform: `translate3d(0, ${(drumCy - slotCy) * L}px, ${z}px) rotateX(${th * L}deg) scale(${mix(1, DRUM.scale, L)})`, opacity: mix(1, vis, L) }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 15 * PS, boxShadow: `0 ${18 * L}px ${40 * L}px rgba(0,0,0,${0.28 * L})` }} />
            <div style={{ position: "absolute", left: 0, top: 0, width: 353, height: 57, transform: `scale(${PS})`, transformOrigin: "0 0", filter: blurY > 0.4 ? `blur(${blurY.toFixed(1)}px)` : undefined }}>
              <PayMethodRow icon={icons[i]} label={methods[i]} sel={i === 0 ? selCard : 0} press={i === 0 ? press(f, TAP[3]) : 1} />
              <GlowRing a={tapRing} r={14} />
              {shade > 0.01 ? <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: `rgba(0,0,0,${shade.toFixed(3)})` }} /> : null}
            </div>
          </div>
        );
      })}
    </>
  );
};

const Lifted: React.FC<{ f: number; fg: string; pose: Pose }> = ({ f, fg, pose }) => {
  const tanY = Math.tan((pose.ry * Math.PI) / 180);
  const t = mt(f);
  const D = DEST_PIN();
  const P = PICKUP_PT();
  // 1 · Pod tile
  const L1 = tileLift(f);
  // 2 · pin from the sky, route card
  const fall = tw(f, PIN_AT - 10, PIN_AT, 0, 1, (x) => x * x);
  const sq = f >= PIN_AT ? Math.exp(-(f - PIN_AT) / 3) * Math.cos((f - PIN_AT) * 1.3) : 0;
  const L2 = cardLift(f);
  const typed = tw(f, PIN_AT + 7, PIN_AT + 25, 0, V2_APP.plan.dropoff.length, (x) => x);
  // 3 · Pod Solo row
  const L3 = rowLift(f);
  const ROW = { x: 17, y: 427 + 24 + 77, w: 358, h: 68 };
  return (
    <>
      {/* step 1 */}
      <GlassRing f={f} at={TAP[0]} x={196} y={479} color={fg} r1={360} n={3} />
      {L1 > 0.01 ? (
        <>
          <LiftShadow x={140} y={410} w={112} h={138} lift={L1} />
          <At x={140} y={410} w={112} h={138} z={250 * L1} t={`translateY(${-34 * L1}px) rotateX(${-10 * L1}deg) rotateY(${18 * L1}deg) rotateZ(${(-5 + 1.6 * Math.sin(t / 9)) * L1}deg) scale(${1 + 0.55 * L1})`}>
            <GlowRing a={tw(f, TAP[0] + 3, TAP[0] + 9) * (0.75 + 0.25 * Math.sin((f - 210) / 3))} r={16} />
            <ServiceCard kind="pod" {...content.home.services.pod} state={{ lifted: true }} badgeScale={1 + 0.8 * kick(f, 225, 4)} badgeRot={10 * Math.sin((f - 225) * 1.4) * kick(f, 225, 5)} />
          </At>
        </>
      ) : null}
      {/* step 2 */}
      {[276, 300, 330].map((at) => (
        <GlassRing key={at} f={f} at={at} x={P.x} y={P.y} color={fg} r1={300} n={2} dur={20} width={5} />
      ))}
      {f >= PIN_AT - 10 && f < PIN_AT + 7 ? (
        <>
          <LiftShadow x={D.x - 20} y={D.y - 7} w={40} h={14} lift={Math.max(0.15, 1 - fall)} radius={9} dark={0.55 * fall + 0.15} />
          {[2, 1, 0].map((g) => {
            const fl = tw(f - g * 0.9, PIN_AT - 10, PIN_AT, 0, 1, (x) => x * x);
            if (g > 0 && (f >= PIN_AT || fl <= 0)) return null;
            return (
              <At key={g} x={D.x - 17} y={D.y - 45} w={34} h={45} z={mix(900, 2, fl)} origin="50% 100%" t={`translateX(${(-mix(900, 2, fl) * tanY).toFixed(1)}px) translateY(${mix(-360, 0, fl)}px) scale(${((f < PIN_AT ? 0.84 : 1 + 0.38 * sq) * (1 + 1.3 * (1 - fl))).toFixed(3)}, ${((f < PIN_AT ? 1.34 : 1 - 0.32 * sq) * (1 + 1.3 * (1 - fl))).toFixed(3)})`} style={{ opacity: g === 0 ? 1 : 0.3 / g }}>
                <Pin size={34} fg={C.indigo} bg={C.white} />
              </At>
            );
          })}
        </>
      ) : null}
      <GlassRing f={f} at={PIN_AT} x={D.x} y={D.y} color={fg} r1={460} n={3} dur={20} width={10} />
      <OnGlass x={D.x} y={D.y}>
        <Burst f={f} at={PIN_AT} x={0} y={0} color={fg} n={14} r0={30} r1={200} len={70} width={7} dur={10} seed="pin" />
      </OnGlass>
      {L2 > 0.01 ? (
        <>
          <LiftShadow x={17} y={120} w={358} h={132} lift={L2} />
          <At x={17} y={120} w={358} h={132} z={150 * L2} t={`translateY(${-26 * L2}px) rotateX(${-6 * L2}deg) rotateY(${-12 * L2}deg) scale(${1 + 0.18 * L2})`}>
            <div style={{ position: "absolute", left: -17, top: -120, width: 393, height: 300 }}>
              <RouteCard dropIn={1} typed={typed} caret={f < PIN_AT + 30 && Math.floor(f / 4) % 2 === 0} />
            </div>
          </At>
        </>
      ) : null}
      {/* step 3 */}
      <GlassRing f={f} at={TAP[1]} x={196} y={562} color={fg} r1={340} n={2} />
      <GlassRing f={f} at={TAP[2]} x={196} y={777} color={fg} r1={520} n={3} dur={20} width={10} />
      <OnGlass x={196} y={777}>
        <Sparks f={f} at={TAP[2]} x={0} y={0} color={GREEN} n={22} speed={30} life={26} size={9} seed="cont" />
      </OnGlass>
      {L3 > 0.01 ? (
        <>
          <LiftShadow x={ROW.x} y={ROW.y} w={ROW.w} h={ROW.h} lift={L3} />
          <At x={ROW.x} y={ROW.y} w={ROW.w} h={ROW.h} z={230 * L3} t={`translateY(${-22 * L3}px) rotateX(${-8 * L3}deg) rotateY(${14 * L3}deg) scale(${1 + 0.34 * L3})`}>
            <GlowRing a={tw(f, TAP[1] + 2, TAP[1] + 8)} r={16} />
            <RideOptionRow kind="pod" title={V2_APP.options.podSolo.title} sub={V2_APP.options.podSolo.sub} price={<Roll text={V2_APP.options.podSolo.price} at={TAP[1] + 2} f={f} size={16} />} unit={V2_APP.options.podSolo.unit} sel={1} lifted />
          </At>
        </>
      ) : null}
      {/* step 4 */}
      <Drum f={f} />
      <div style={{ position: "absolute", left: bx(196), top: by(DRUM.cy), width: 0, height: 0, transform: `translateZ(${DRUM.zA + DRUM.R + 4}px)` }}>
        <Finger x={0} y={6} at={TAP[3]} f={f} size={56} from={[80, 120]} />
        <GlassRingFlat f={f} at={TAP[3]} color={fg} />
      </div>
    </>
  );
};

const GlassRingFlat: React.FC<{ f: number; at: number; color: string }> = ({ f, at, color }) => {
  if (f < at || f > at + 26) return null;
  return (
    <>
      {[0, 1, 2].map((i) => {
        const p = tw(f, at + i * 4, at + i * 4 + 18, 0, 1, EASE.out);
        if (p <= 0 || p >= 1) return null;
        const r = 420 * (0.1 + 0.9 * p);
        return <div key={i} style={{ position: "absolute", left: -r, top: -r * 0.5, width: r * 2, height: r, borderRadius: "50%", border: `${(8 * (1 - p) + 1.2).toFixed(2)}px solid ${color}`, opacity: (1 - p) * (1 - 0.3 * i) }} />;
      })}
    </>
  );
};

/* ------------------------------------------------------------------ header: split-flap step + instruction */

const TILE = { x: 90, y: 226, w: 196, h: 214, font: 172 };
const FLIPS = [
  { at: 0, text: "", bg: GREEN, fg: BLACK },
  { at: 183, text: "1.", bg: GREEN, fg: BLACK },
  { at: 267, text: "2.", bg: BLACK, fg: GREEN },
  { at: 357, text: "3.", bg: GREEN, fg: BLACK },
  { at: 447, text: "4.", bg: BLACK, fg: GREEN },
];

const Header: React.FC<{ f: number }> = ({ f }) => {
  const pop = sp(f, 179, { damping: 12, stiffness: 170 });
  const b = 1 + 0.035 * beat(f);
  return (
    <>
      <div style={{ position: "absolute", left: TILE.x, top: TILE.y, transform: `scale(${pop * b}) rotate(${(1 - pop) * -25}deg)`, transformOrigin: "50% 60%" }}>
        <FlipTile f={f} w={TILE.w} h={TILE.h} font={TILE.font} seq={FLIPS} dur={8} />
      </div>
      {LINES.map((lines, k) => {
        const from = ACT_STEPS[k];
        const next = k < 3 ? WIPES[k] : 530;
        if (f < from || f > next + 2) return null;
        const two = lines.length > 1;
        return <Words key={k} f={f} lines={lines} at={k === 0 ? 187 : from + 2} stagger={2} size={86} color={PAIRS[k].fg} outAt={k < 3 ? next - 8 : null} lh={1.06} style={{ position: "absolute", left: 326, top: TILE.y + TILE.h / 2 - (two ? 93 : 47) }} />;
      })}
    </>
  );
};

/* ------------------------------------------------------------------ the act */

export const PhoneAct: React.FC<{ f: number }> = ({ f }) => {
  const pose = actPose(f);
  const k = stepOf(f);
  const { bg, fg } = PAIRS[k];
  const camS = 1 + 0.012 * beat(f) + 0.03 * kick(f, TAP[0], 5) + 0.025 * kick(f, TAP[1], 5) + 0.045 * kick(f, TAP[2], 5) + 0.03 * kick(f, TAP[3], 5) + 0.025 * kick(f, PIN_AT, 4);
  const sx = shake(f, PIN_AT, 9, 3, 2.6) + shake(f, TAP[2], 6, 3, 2.4);
  const sy = shake(f, PIN_AT, 14, 3, 2.1);
  const dark = bg === BLACK;
  const floorY = pose.cy + (BH * pose.s) / 2 + 30;
  return (
    <AbsoluteFill>
      <Worlds f={f} />
      <AbsoluteFill style={{ transform: `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) scale(${camS.toFixed(4)})`, transformOrigin: "540px 1050px" }}>
        <div style={{ position: "absolute", left: pose.cx - 300, top: floorY - 50, width: 600, height: 100, borderRadius: "50%", background: dark ? "rgba(32,230,130,.28)" : "rgba(0,0,0,.32)", filter: "blur(38px)" }} />
        <Phone3D pose={pose} screen={<Screen f={f} />} overlay={<FingerTrack f={f} taps={TAPS} />} time={V2_APP.phoneTime} darkStatus={f < LAUNCH[0] + 6} rim={fg}>
          <Lifted f={f} fg={fg} pose={pose} />
        </Phone3D>
      </AbsoluteFill>
      <Header f={f} />
    </AbsoluteFill>
  );
};

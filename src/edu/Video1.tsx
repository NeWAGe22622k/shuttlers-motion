import React from "react";
import { AbsoluteFill, random } from "remotion";
import { getLength, getPointAtLength } from "@remotion/paths";
import { EASE } from "../config/brand";
import { T } from "../config/time";
import { FleetCar } from "../components/core";
import { mix, sp, speedBlur, tw } from "../components/motion";
import { EDU, END_LINE, V1_ART } from "./content";
import { BRANCH_ENDS, Calendar, Clock, FareTagSlice, Frost, Gate, MapRace, MirrorPilot, Pin, Rain, ROUTE_MAIN, SEATS, SeatMap, Streaks, Traffic, Vent } from "./art";
import { PodIcon } from "./PodIcon";
import { Arrow, HBlur, SMark, Statement, dropStyle, landShake } from "./kit";
import { Ctx as FilmCtx, Film, FilmSpec, Shock, Trailing } from "./film";
import { Fmt, POPPINS } from "./theme";

export type Ctx = FilmCtx;
const V = EDU.v1;
const SFX = T.edu.v1.sfx;

/** Headline: first line big, follow-up lines at 55%; words fly out at the card's exit frame. */
export const Headline: React.FC<Ctx & { outAt?: number | null; top?: number; center?: boolean }> = ({ f, card, fg, F, out, outAt, top, center = false }) => {
  const big = card.lines.slice(0, 1);
  const rest = card.lines.slice(1);
  const ex = outAt === undefined ? out ?? null : outAt;
  return (
    <div style={{ position: "absolute", left: F.pad, right: F.pad, top: top ?? F.textTop, display: "flex", flexDirection: "column", alignItems: center ? "center" : "flex-start", gap: F.textSize * 0.12 }}>
      <Statement f={f} lines={big} at={card.at + 1} size={F.textSize} color={fg} outAt={ex} align={center ? "center" : "left"} seed={`h${card.at}`} />
      {rest.length ? <Statement f={f} lines={rest} at={card.at + 5} size={F.textSize * 0.55} color={fg} outAt={ex} align={center ? "center" : "left"} seed={`r${card.at}`} /> : null}
    </div>
  );
};

/** Places art centred at the format's art anchor, scaled by its art scale. */
export const Art: React.FC<{ F: Ctx["F"]; dx?: number; dy?: number; scale?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ F, dx = 0, dy = 0, scale = 1, children, style }) => (
  <div style={{ position: "absolute", left: F.art.cx + dx * F.art.s, top: F.art.cy + dy * F.art.s, transform: `translate(-50%, -50%) scale(${F.art.s * scale})`, ...style }}>{children}</div>
);

/* ------------------------------------------------------------------ 3D map (cards 2 + 3 share one continuous shot) */

const ROUTE_LEN = getLength(ROUTE_MAIN);
const MapShot: React.FC<{ f: number; fg: string; bg: string; F: Ctx["F"] }> = ({ f, fg, bg, F }) => {
  const main = tw(f, SFX.race[0] - 4, 160, 0, 1, EASE.inOut);
  const branches = [0, 1, 2].map((i) => tw(f, 166 + i * 5, 186 + i * 5, 0, 1, EASE.inOut));
  const head = getPointAtLength(ROUTE_MAIN, main * ROUTE_LEN) ?? { x: 150, y: 760 };
  const pull = tw(f, 165, 200, 0, 1, EASE.inOut); // card 3: rise up to see every branch
  const tilt = mix(56, 34, pull);
  const rz = mix(-16, -8, pull);
  const focus = { x: mix(head.x, 520, pull), y: mix(head.y, 420, pull) };
  const zoom = mix(1.35, 0.95, pull);
  const pinK = sp(f, SFX.pin[0] - 4, { damping: 11, stiffness: 220 });
  const billboard = `rotateZ(${-rz}deg) rotateX(${-tilt}deg)`;
  return (
    <div style={{ position: "absolute", left: 0, top: F.art.cy - 600 * F.art.s, width: F.W, height: 1300 * F.art.s, perspective: 1500, overflow: "visible" }}>
      <div
        style={{
          position: "absolute",
          left: F.W / 2 - 450,
          top: 650 * F.art.s - 450,
          width: 900,
          height: 900,
          transformStyle: "preserve-3d",
          transform: `scale(${zoom * F.art.s}) rotateX(${tilt}deg) rotateZ(${rz}deg) translate(${450 - focus.x}px, ${450 - focus.y}px)`,
        }}
      >
        <MapRace size={900} fg={fg} bg={bg} grid={tw(f, 120, 132)} main={main} branches={branches} />
        <div style={{ position: "absolute", left: 150, top: 760 }}>
          <Shock f={f} at={SFX.pin[0]} color={fg} size={260} />
        </div>
        {f >= SFX.pin[0] - 4 ? (
          <div style={{ position: "absolute", left: 150 - 45, top: 760 - 119, width: 90, height: 119, transformStyle: "preserve-3d", transformOrigin: "50% 100%", transform: `${billboard} translateY(${-(1 - pinK) * 300}px)` }}>
            <Pin size={90} fg={fg} bg={bg} />
          </div>
        ) : null}
        {BRANCH_ENDS.map((p, i) => {
          const at = 186 + i * 5;
          if (f < at) return null;
          const k = sp(f, at, { damping: 11, stiffness: 220 });
          return (
            <React.Fragment key={i}>
              <div style={{ position: "absolute", left: p.x, top: p.y }}>
                <Shock f={f} at={at} color={fg} size={160} />
              </div>
              <div style={{ position: "absolute", left: p.x - 30, top: p.y - 79, width: 60, height: 79, transformOrigin: "50% 100%", transform: `${billboard} scale(${k})` }}>
                <Pin size={60} fg={fg} bg={bg} />
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ the 14 cards */

const scenes: ((c: Ctx) => React.ReactNode)[] = [
  // 0:00 The wait is over. — black, a low hum building
  ({ f, card, fg, F }) => {
    const grow = tw(f, 4, 56, 0, 1, EASE.inOut);
    const squash = tw(f, 50, 60, 0, 1, EASE.in);
    return (
      <>
        <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.H * 0.42, transform: `scale(${mix(0.94, 1.02, grow)}) scaleY(${1 - squash * 0.55})`, transformOrigin: "0% 50%", opacity: 1 - squash * 0.3 }}>
          <Statement f={f} lines={card.lines} at={8} size={F.textSize * 0.8} color={fg} seed="c0" />
        </div>
        <div style={{ position: "absolute", left: F.pad, top: F.H * 0.42 + F.textSize * 1.04, height: 6, width: (F.W - F.pad * 2) * grow, background: fg, borderRadius: 3, boxShadow: `0 0 ${10 + 30 * grow}px ${fg}`, opacity: 0.4 + 0.6 * grow, transform: `scaleY(${1 + 2 * squash})` }} />
      </>
    );
  },
  // 0:02 Your Pod is here. — the beat drops; the Pod glides in, headlights on, the door swings open
  (c) => {
    const { f, F } = c;
    const x = (fr: number) => mix(-1100, 0, tw(fr, 61, 73, 0, 1, EASE.out));
    const k = f - 73;
    const bounce = k > 0 ? Math.exp(-k / 4) * Math.sin(k / 1.6) * 7 : 0;
    const lights = f < 70 ? 0 : f < 72 ? 1 : f < 73 ? 0.2 : tw(f, 73, 76);
    const door = tw(f, SFX.door[0], SFX.door[0] + 12, 0, 1, EASE.out);
    const push = tw(f, 82, 118, 0, 1, EASE.inOut);
    const flare = f >= 70 && f < 84 ? Math.sin(Math.PI * tw(f, 70, 84)) : 0;
    return (
      <>
        <Headline {...c} />
        <AbsoluteFill style={{ transform: `scale(${1 + 0.16 * push})`, transformOrigin: `48% ${(F.art.cy / F.H) * 100 + 3}%` }}>
          <Streaks color={c.fg} p={1 - tw(f, 66, 76)} width={F.W * 0.6} height={260} />
          <HBlur id="v1c1" amount={speedBlur(x, f, 0.4, 44)}>
            <Trailing f={f} n={3} lag={1.4} render={(fr) => (
              <Art F={F} dx={x(fr)} dy={40 + (fr === f ? bounce : 0)}>
                <PodIcon id={`c1-${Math.round(fr * 10)}`} width={920} lights={lights} door={fr === f ? door : 0} seatGlow={door} />
              </Art>
            )} />
          </HBlur>
          {flare > 0 ? <div style={{ position: "absolute", left: F.art.cx + 410 * F.art.s - 160, top: F.art.cy + 40 * F.art.s - 160, width: 320, height: 320, borderRadius: 999, background: "radial-gradient(circle, rgba(255,255,255,.95) 0%, rgba(255,255,255,.35) 25%, rgba(255,255,255,0) 65%)", opacity: flare, transform: `scale(${0.6 + flare})` }} /> : null}
        </AbsoluteFill>
      </>
    );
  },
  // 0:04 Doorstep to destination. — a pin drops on a doorstep; a green line races across Lagos (3D map)
  (c) => (
    <>
      <MapShot f={c.f} fg={c.fg} bg={c.bg} F={c.F} />
      <Headline {...c} />
    </>
  ),
  // 0:05.5 Wherever you go. — the line branches to a few destinations (same shot continues)
  (c) => {
    const { f, card, fg, F } = c;
    return (
      <>
        <MapShot f={f} fg={fg} bg={c.bg} F={F} />
        <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.textTop }}>
          <Statement f={f} lines={card.lines} at={card.at + 1} size={F.textSize * 0.82} color={fg} outAt={c.out} seed="c3" />
          <div style={{ marginTop: 28, transform: `translateX(${Math.sin((f - 165) / 5) * 10}px)`, ...dropStyle(f, card.at + 7) }}>
            <Arrow size={F.textSize * 0.55} color={fg} p={tw(f, card.at + 7, card.at + 18, 0, 1, EASE.out)} />
          </div>
        </div>
      </>
    );
  },
  // 0:07 Pod Now. It's go time. — a clock snaps to now; the Pod launches off the line
  (c) => {
    const { f, fg, bg, F } = c;
    const snapAt = 222;
    const spin = f < snapAt ? (f - 210) * 47 : 0;
    const settle = f < snapAt ? 0 : landShake(f, snapAt, 9);
    const launch = (fr: number) => mix(0, 1700, tw(fr, 236, 250, 0, 1, EASE.in));
    const lx = launch(f);
    return (
      <>
        <Headline {...c} />
        <Art F={F} dy={-150}>
          <div style={{ position: "relative", transform: `rotate(${settle}deg) scale(${f >= snapAt ? 1 + 0.1 * Math.exp(-(f - snapAt) / 3) : 0.96})`, filter: f < snapAt ? "blur(1.5px)" : undefined }}>
            <Clock size={360} fg={fg} bg={bg} hour={(spin / 12) % 360} minute={spin % 360} />
            <div style={{ position: "absolute", left: 180, top: 180 }}>
              <Shock f={f} at={snapAt} color={fg} size={620} />
            </div>
          </div>
        </Art>
        <Art F={F} dy={200} dx={-lx * 0.12}>
          <div style={{ position: "relative", width: 980 }}>
            <div style={{ position: "absolute", left: -200, top: 205, width: 1400, height: 8, background: `repeating-linear-gradient(90deg, ${fg} 0 40px, transparent 40px 70px)`, opacity: 0.6, transform: `translateX(${-(lx * 0.5) % 70}px)` }} />
            <Streaks color={fg} p={tw(f, 236, 242)} width={600} height={170} />
            <HBlur id="v1c4" amount={speedBlur(launch, f, 0.3, 55)}>
              <Trailing f={f} n={3} lag={1.2} render={(fr) => (
                <div style={{ transform: `translateX(${launch(fr)}px) translateY(${f > 234 && f < 238 ? -6 : 0}px) rotate(${f > 234 && f < 240 ? -1.5 : 0}deg)` }}>
                  <PodIcon id={`c4-${Math.round(fr * 10)}`} width={720} lights={1} style={{ marginLeft: 120, marginTop: -40 }} />
                </div>
              )} />
            </HBlur>
          </div>
        </Art>
      </>
    );
  },
  // 0:09 Pod Later. It's a date. — a calendar flips to tomorrow morning; a Pod is already parked at the gate
  (c) => {
    const { f, fg, bg, F, card } = c;
    const flip = tw(f, 276, 290, 0, 1, EASE.inOut);
    const drive = (fr: number) => mix(800, 0, tw(fr, 290, 304, 0, 1, EASE.out));
    const k = f - 304;
    const bounce = k > 0 ? Math.exp(-k / 4) * Math.sin(k / 1.6) * 5 : 0;
    return (
      <>
        <Headline {...c} />
        <Art F={F} dy={-120}>
          <div style={{ perspective: 1200 }}>
            <div style={{ transform: `rotateY(${14 * Math.sin((f - 270) / 14)}deg) rotateX(${6 + 4 * Math.sin((f - 270) / 19)}deg)`, ...dropStyle(f, card.at + 2, 160, "cal") }}>
              <Calendar width={430} fg={fg} bg={bg} flip={flip} top={V1_ART.calendarTop} body={V1_ART.calendarBody} />
            </div>
          </div>
        </Art>
        <Art F={F} dx={-130} dy={310}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 24 }}>
            <div style={dropStyle(f, card.at + 6, 80, "gate")}>
              <Gate width={200} fg={fg} bg={bg} />
            </div>
            <HBlur id="v1c5" amount={speedBlur(drive, f, 0.35, 40)} style={{ position: "relative", inset: undefined }}>
              <div style={{ transform: `translateX(${drive(f)}px) translateY(${bounce}px)`, opacity: f < 290 ? 0 : 1 }}>
                <PodIcon id="c5" width={470} lights={tw(f, 300, 304)} />
              </div>
            </HBlur>
          </div>
        </Art>
      </>
    );
  },
  // 0:11 Pod Solo. It's a party for one. — one seat lights up; the camera pulls back as the car stretches out around it
  (c) => {
    const { f, fg, bg, F } = c;
    const stretch = tw(f, 338, 360, 0, 1, EASE.out);
    const pull = tw(f, 331, 352, 0, 1, EASE.inOut);
    const k = (f - 330) % 15;
    const glow = 0.5 + 0.5 * Math.exp(-k / 4);
    return (
      <>
        <Headline {...c} card={{ ...c.card, at: 349 }} />
        <Art F={F} dy={120}>
          <div style={{ transform: `scale(${mix(3.0, 1, pull)}) rotate(${mix(-8, 0, pull)}deg)`, transformOrigin: "65% 66%" }}>
            <SeatMap width={500} fg={fg} bg={bg} stretch={stretch} solo={2} outline={stretch} glow={glow} />
          </div>
        </Art>
      </>
    );
  },
  // 0:13 Pod Shared. It's a party for everyone. — every seat fills; the fare tag splits, one piece lands on each seat
  (c) => {
    const { f, fg, bg, F } = c;
    const W = 470;
    const scale = W / 300;
    const lit = SEATS.map((_, i) => tw(f, SFX.seatsFill[i], SFX.seatsFill[i] + 3));
    const pops = SEATS.map((_, i) => (f >= SFX.seatsFill[i] ? 1 + 0.25 * Math.exp(-(f - SFX.seatsFill[i]) / 3) * Math.cos((f - SFX.seatsFill[i]) / 1.5) : 1));
    const tagIn = sp(f, 392, { damping: 16, stiffness: 200 });
    const split = tw(f, SFX.fareSnap[0], SFX.fareSnap[0] + 4, 0, 1, EASE.out);
    const fall = tw(f, SFX.fareSnap[0] + 4, SFX.fareSnap[0] + 15, 0, 1, EASE.in);
    const tagW = 300;
    const landAt = SFX.fareSnap[0] + 15;
    return (
      <>
        <Headline {...c} />
        <Art F={F} dy={160}>
          <div style={{ position: "relative", width: W, height: (W * 520) / 300 }}>
            <SeatMap width={W} fg={fg} bg={bg} stretch={1} lit={lit} outline={1} glow={tw(f, 420, 426)} />
            {SEATS.map((p, i) => (
              <div key={i} style={{ position: "absolute", left: (p.x + 24) * scale, top: (p.y + 34) * scale, transform: `scale(${pops[i]})` }}>
                <Shock f={f} at={SFX.seatsFill[i]} color={fg} size={120} />
                <Shock f={f} at={landAt + i} color={fg} size={150} />
              </div>
            ))}
            {[0, 1, 2].map((i) => {
              const target = SEATS[i];
              const sx = (tagW / 3) * (i - 1) * 0.15 * split;
              const tx = mix(W / 2 - tagW / 2 + sx, target.x * scale - (tagW / 3) * i + 24 * scale - tagW / 6, fall);
              const ty = mix(-170 - (1 - tagIn) * 260, target.y * scale + 34 * scale - (tagW * 0.56) / 2, fall);
              return f >= 392 && f < landAt + 4 ? (
                <FareTagSlice key={i} width={tagW} i={i} n={3} fg={fg} bg={bg} style={{ left: tx + (i - 1) * 22 * split, top: ty, opacity: f > landAt ? 1 - tw(f, landAt, landAt + 4) : 1, transform: `rotate(${(i - 1) * 14 * split * (1 - fall) + fall * (i - 1) * 180}deg) scale(${1 - 0.6 * fall})` }} />
              ) : null;
            })}
          </div>
        </Art>
      </>
    );
  },
  // 0:15 Cool fare. — a fare card holds steady while rain, traffic and a clock spin around it
  (c) => {
    const { f, fg, bg, F } = c;
    const R = 380;
    const icon = (i: number, fr: number) => {
      const a = (fr - 450) * 0.085 + (i * Math.PI * 2) / 3;
      return { x: 450 + Math.cos(a) * R - 95, y: 450 + Math.sin(a) * R * 0.78 - 95, r: Math.sin(a) * 10, z: 0.85 + 0.25 * Math.sin(a) };
    };
    const icons = [
      (fr: number) => <Rain size={190} fg={fg} bg={bg} t={fr} />,
      () => <Traffic size={190} fg={fg} bg={bg} />,
      (fr: number) => <Clock size={190} fg={fg} bg={bg} hour={(fr - 450) * 12} minute={(fr - 450) * 40} />,
    ];
    return (
      <>
        <Headline {...c} />
        <Art F={F} dy={120}>
          <div style={{ position: "relative", width: 900, height: 900 }}>
            {icons.map((ic, i) => {
              const pop = sp(f, 452 + i * 3, { damping: 14, stiffness: 200 });
              return [3, 2, 1, 0].map((g) => {
                const p = icon(i, f - g * 1.5);
                return (
                  <div key={`${i}-${g}`} style={{ position: "absolute", left: p.x, top: p.y, opacity: g === 0 ? 1 : 0.18 * (1 - g / 4), transform: `scale(${pop * p.z}) rotate(${p.r}deg)` }}>
                    {ic(f - g * 1.5)}
                  </div>
                );
              });
            })}
            <div style={{ position: "absolute", left: 450 - 240, top: 450 - 134 + Math.sin((f - 450) / 9) * 6, transform: `scale(${sp(f, 451, { damping: 18, stiffness: 240 })})` }}>
              <div style={{ position: "relative", width: 480, height: 270, filter: `drop-shadow(0 30px 40px rgba(0,0,0,.25))` }}>
                <FareTagSlice width={480} i={0} n={1} fg={fg} bg={bg} style={{ left: 0, top: 0 }} />
              </div>
            </div>
          </div>
        </Art>
      </>
    );
  },
  // 0:17 Cool car. — cold air ripples off the AC vent; frost creeps across the edge of the frame
  (c) => {
    const { f, fg, bg, F, card } = c;
    const shiver = f > 520 ? (random(`sh${f}`) - 0.5) * 3 : 0;
    return (
      <>
        <Frost W={F.W} H={F.H} color={fg} p={tw(f, 512, 566, 0, 1, EASE.out)} />
        <Headline {...c} />
        <Art F={F} dy={60} dx={shiver}>
          <div style={{ ...dropStyle(f, card.at + 3, 140, "vent") }}>
            <Vent width={660} fg={fg} bg={bg} t={f - 510} />
          </div>
        </Art>
      </>
    );
  },
  // 0:19 Oh, and cool Pilot. — record scratch; music dead; the mirror swings in; the Pilot nods
  (c) => {
    const { f, fg, bg, F, card } = c;
    const nodAt = SFX.nod[0] - 4;
    const nod = Math.sin(Math.PI * tw(f, nodAt, nodAt + 14, 0, 1, EASE.inOut));
    const swing = f < 576 ? -40 : -40 * Math.exp(-(f - 576) / 10) * Math.cos((f - 576) / 3.2);
    return (
      <>
        <Art F={F} dy={-360}>
          <div style={{ transform: `rotate(${swing}deg)`, transformOrigin: "50% -14%", opacity: tw(f, 574, 578) }}>
            <MirrorPilot width={760} fg={fg} bg={bg} nod={nod} />
          </div>
        </Art>
        <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.art.cy + 60 * F.art.s }}>
          <Statement f={f} lines={card.lines} at={588} size={F.textSize * 0.62} color={fg} outAt={c.out} seed="c10" />
        </div>
      </>
    );
  },
  // 0:22 It's safe. It's set. It's smooth. — the beat slams back; one word per beat, each landing hard
  (c) => {
    const { f, card, fg, F } = c;
    const punch = card.punch!;
    const shake = punch.reduce((acc, t) => acc + landShake(f, t + 3, 9), 0);
    const zoom = punch.reduce((acc, t) => acc + (f >= t + 2 ? 0.035 * Math.exp(-(f - t - 2) / 3) : 0), 0);
    const flash = punch.reduce((acc, t) => Math.max(acc, f >= t + 2 ? Math.exp(-(f - t - 2) / 2) : 0), 0);
    const big = F.textSize * 1.32;
    const small = F.textSize * 0.5;
    return (
      <>
        <AbsoluteFill style={{ background: fg, opacity: 0.16 * flash }} />
        <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.H * 0.22, display: "flex", flexDirection: "column", gap: F.textSize * 0.1, transform: `translate(${shake}px, ${shake * 0.6}px) scale(${1 + zoom})`, transformOrigin: "0% 50%" }}>
          {card.lines.map((line, li) => (
            <div key={li} style={{ fontFamily: POPPINS, color: fg, lineHeight: 0.98 }}>
              <div style={{ fontSize: small, fontWeight: 500, letterSpacing: -1, ...dropStyle(f, punch[li * 2], 110, `w${li}a`) }}>{line[0].t}</div>
              <div style={{ fontSize: big, fontWeight: 800, letterSpacing: -big * 0.04, textShadow: f >= punch[li * 2 + 1] ? `0 0 ${40 * (1 - tw(f, punch[li * 2 + 1], punch[li * 2 + 1] + 18))}px ${fg}` : undefined, ...dropStyle(f, punch[li * 2 + 1], 160, `w${li}b`) }}>{line[1].t}</div>
            </div>
          ))}
        </div>
      </>
    );
  },
  // 0:26 It's Pod. — everything clears except the Pod, centre frame (real fleet car, light sweep)
  (c) => {
    const { f, card, fg, F } = c;
    const sweep = tw(f, 788, 816, 0, 1, EASE.inOut);
    const k = sp(f, 781, { damping: 20, stiffness: 140 });
    return (
      <>
        <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.H * 0.3 }}>
          <Statement f={f} lines={card.lines} at={card.at + 1} size={F.textSize * 1.2} color={fg} align="center" outAt={c.out} seed="c12" />
        </div>
        <AbsoluteFill style={{ transform: `scale(${mix(0.86, 1, k)}) translateX(${(1 - k) * 160}px)`, transformOrigin: "50% 62%" }}>
          <FleetCar id="v1hero" src="vehicles/fleet-c-34.png" w={F.W * 0.86} aspect={576 / 1033} x={F.W / 2} ground={F.art.cy + 260 * F.art.s + Math.sin((f - 780) / 10) * 3} />
          {sweep > 0 && sweep < 1 ? (
            <div style={{ position: "absolute", left: 0, top: F.art.cy - 260 * F.art.s, width: F.W, height: 540 * F.art.s, background: `linear-gradient(105deg, transparent ${sweep * 130 - 30}%, rgba(255,255,255,.55) ${sweep * 130 - 18}%, transparent ${sweep * 130 - 6}%)`, mixBlendMode: "soft-light" }} />
          ) : null}
        </AbsoluteFill>
      </>
    );
  },
  // 0:28 Shuttlers Pod. / Open Shuttlers → tap Pod — end frame; the S mark lands; the track ends on a button
  (c) => {
    const { f, card, fg, F } = c;
    const button = T.edu.v1.sections.button;
    const hit = f >= button ? 1 + 0.045 * Math.exp(-(f - button) / 3) : 1;
    const mk = sp(f, card.at + 8, { damping: 10, stiffness: 180 });
    const glint = tw(f, card.at + 16, card.at + 28, 0, 1, EASE.inOut);
    return (
      <AbsoluteFill style={{ transform: `scale(${hit})` }}>
        <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.H * 0.3 }}>
          <Statement f={f} lines={card.lines} at={card.at + 1} size={F.textSize * 1.05} color={fg} seed="end" />
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 34, fontFamily: POPPINS, fontSize: F.textSize * 0.44, fontWeight: 500, color: fg, ...dropStyle(f, card.at + 7, 80, "endsub") }}>
            <span>{card.sub![0][0].t}</span>
            <Arrow size={F.textSize * 0.3} color={fg} p={tw(f, card.at + 9, card.at + 18)} stroke={16} />
            <span style={{ fontWeight: 700 }}>{card.sub![0][2].t}</span>
          </div>
        </div>
        <div style={{ position: "absolute", left: F.pad, bottom: F.mark.bottom + 10, fontFamily: POPPINS, fontSize: F.textSize * 0.42, fontWeight: 800, color: fg, letterSpacing: -1, ...dropStyle(f, card.at + 12, 80, "endline") }}>{END_LINE}</div>
        <div style={{ position: "absolute", right: F.mark.right, bottom: F.mark.bottom, transform: `scale(${mix(0.2, 1, mk)}) rotate(${(1 - mk) * -50}deg)`, transformOrigin: "100% 100%", filter: `drop-shadow(0 0 ${30 * (1 - tw(f, card.at + 8, card.at + 30))}px ${fg})` }}>
          <div style={{ position: "relative", overflow: "hidden" }}>
            <SMark size={F.mark.size * 1.9} color={fg} />
            {glint > 0 && glint < 1 ? <div style={{ position: "absolute", top: -40, bottom: -40, left: `${glint * 160 - 40}%`, width: "30%", background: "rgba(255,255,255,.7)", transform: "skewX(-20deg)", mixBlendMode: "overlay" }} /> : null}
          </div>
        </div>
      </AbsoluteFill>
    );
  },
];

/* ------------------------------------------------------------------ the film */

const SCRATCH = SFX.scratch[0];
export const V1_SPEC: FilmSpec = {
  cards: V.cards,
  scenes,
  // transition INTO each card
  trans: ["cut", "flash", "whip", "none", "whip", "circle", "zoom", "whip", "whipV", "zoom", "cut", "flash", "circle", "zoom"],
  origins: [undefined, undefined, undefined, undefined, undefined, { x: 540, y: 980 }, undefined, undefined, undefined, undefined, undefined, undefined, { x: 540, y: 1140 }, undefined],
  silences: [[T.edu.v1.sections.silence[0], T.edu.v1.sections.silence[1]]],
  beatsFrom: T.edu.v1.sections.drop,
  duration: T.edu.duration,
  audio: "audio/edu/score-edu1.wav",
  // record scratch: the previous card stutters backwards for 6 frames, then the silence card
  special: (f, layer) => {
    if (f < SCRATCH || f >= SCRATCH + 6) return null;
    const rew = SCRATCH - 2 - (f - SCRATCH) * 4;
    const jitter = (f % 2 ? 1 : -1) * 30;
    return <AbsoluteFill style={{ transform: `translateX(${jitter}px) skewX(${(f % 2 ? 1 : -1) * 3}deg)`, filter: "blur(3px)" }}>{layer(9, rew)}</AbsoluteFill>;
  },
};

export const EduVideo1: React.FC<{ fmt?: Fmt }> = ({ fmt = "9x16" }) => <Film spec={V1_SPEC} fmt={fmt} />;

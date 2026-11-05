import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { EASE } from "../config/brand";
import { T } from "../config/time";
import { assetExists, Grain } from "../components/core";
import { mix, sp, speedBlur, tw } from "../components/motion";
import { EDU, END_LINE, EduCard, V1_ART } from "./content";
import { BRANCH_ENDS, Calendar, Clock, FareTagSlice, Frost, Gate, MapRace, MirrorPilot, PodSide, Rain, SEATS, SeatMap, Streaks, Traffic, Vent, Pin } from "./art";
import { Arrow, CardBG, HBlur, SMark, Statement, dropStyle, landShake, liftStyle } from "./kit";
import { BLACK, FORMATS, Fmt, POPPINS, pairColours } from "./theme";

const V = EDU.v1;
const CARDS = V.cards;
const SFX = T.edu.v1.sfx;

type Ctx = { f: number; card: EduCard; fg: string; bg: string; F: (typeof FORMATS)[Fmt]; fmt: Fmt };

/** Headline: first line big, follow-up lines at 55% (bold/regular mix like the reference). */
const Headline: React.FC<Ctx & { outAt?: number | null; top?: number; center?: boolean }> = ({ f, card, fg, F, outAt = null, top, center = false }) => {
  const big = card.lines.slice(0, 1);
  const rest = card.lines.slice(1);
  return (
    <div style={{ position: "absolute", left: F.pad, right: F.pad, top: top ?? F.textTop, display: "flex", flexDirection: "column", alignItems: center ? "center" : "flex-start", gap: F.textSize * 0.12 }}>
      <Statement f={f} lines={big} at={card.at + 1} size={F.textSize} color={fg} outAt={outAt} align={center ? "center" : "left"} />
      {rest.length ? <Statement f={f} lines={rest} at={card.at + 5} size={F.textSize * 0.55} color={fg} outAt={outAt} align={center ? "center" : "left"} /> : null}
    </div>
  );
};

/** Places art centred at the format's art anchor, scaled by its art scale. */
const Art: React.FC<{ F: Ctx["F"]; dx?: number; dy?: number; scale?: number; children: React.ReactNode }> = ({ F, dx = 0, dy = 0, scale = 1, children }) => (
  <div style={{ position: "absolute", left: F.art.cx + dx * F.art.s, top: F.art.cy + dy * F.art.s, transform: `translate(-50%, -50%) scale(${F.art.s * scale})` }}>{children}</div>
);

/* ------------------------------------------------------------------ the 14 cards */

const scenes: ((c: Ctx) => React.ReactNode)[] = [
  // 0:00 The wait is over. — black, a low hum building
  ({ f, card, fg, F }) => {
    const grow = tw(f, 4, 56, 0, 1, EASE.inOut);
    const squash = tw(f, 52, 60, 0, 1, EASE.in);
    return (
      <>
        <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.H * 0.42, transform: `scaleY(${1 - squash * 0.5})`, opacity: 1 - squash * 0.4 }}>
          <Statement f={f} lines={card.lines} at={8} size={F.textSize * 0.78} color={fg} />
        </div>
        <div style={{ position: "absolute", left: F.pad, top: F.H * 0.42 + F.textSize * 1.02, height: 6, width: (F.W - F.pad * 2) * grow, background: fg, borderRadius: 3, boxShadow: `0 0 ${10 + 20 * grow}px ${fg}`, opacity: 0.4 + 0.6 * grow }} />
      </>
    );
  },
  // 0:02 Your Pod is here. — the beat drops; the Pod glides in, headlights on, door swings open
  ({ f, card, fg, bg, F }) => {
    const x = (fr: number) => mix(-900, 0, tw(fr, 61, 73, 0, 1, EASE.out));
    const blur = speedBlur(x, f, 0.35, 40);
    const k = f - 73;
    const bounce = k > 0 ? Math.exp(-k / 4) * Math.sin(k / 1.6) * 6 : 0;
    const lights = f < 70 ? 0 : f < 72 ? 1 : f < 73 ? 0.2 : tw(f, 73, 76);
    const door = tw(f, SFX.door[0], SFX.door[0] + 12, 0, 1, EASE.out);
    const punch = 1 + 0.035 * (1 - tw(f, 60, 68, 0, 1, EASE.out));
    return (
      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        <Headline f={f} card={card} fg={fg} bg={bg} F={F} fmt="9x16" />
        <HBlur id="v1c1" amount={blur}>
          <Art F={F} dx={x(f)} dy={40 + bounce}>
            <PodSide id="c1" width={900} fg={fg} bg={bg} lights={lights} door={door} wheel={x(f) * 0.9} seatGlow={door} />
          </Art>
        </HBlur>
      </AbsoluteFill>
    );
  },
  // 0:04 Doorstep to destination. — a pin drops on a doorstep; a green line races across Lagos
  ({ f, card, fg, bg, F }) => {
    const pinK = sp(f, SFX.pin[0] - 4, { damping: 11, stiffness: 220 });
    const main = tw(f, SFX.race[0] - 4, 160, 0, 1, EASE.inOut);
    const map = 900;
    const at = (p: { x: number; y: number }) => ({ x: (p.x / 900) * map - map / 2, y: (p.y / 900) * map - map / 2 });
    const pin = at({ x: 150, y: 760 });
    return (
      <>
        <Headline f={f} card={card} fg={fg} bg={bg} F={F} fmt="9x16" outAt={163} />
        <Art F={F} dy={60}>
          <div style={{ position: "relative", width: map, height: map }}>
            <MapRace size={map} fg={fg} bg={bg} grid={tw(f, 120, 132)} main={main} branches={[0, 0, 0]} />
            {f >= SFX.pin[0] - 4 ? (
              <div style={{ position: "absolute", left: map / 2 + pin.x - 45, top: map / 2 + pin.y - 120 - (1 - pinK) * 260, opacity: Math.min(1, pinK * 2) }}>
                <Pin size={90} fg={fg} bg={bg} />
              </div>
            ) : null}
          </div>
        </Art>
      </>
    );
  },
  // 0:05.5 Wherever you go. — the line branches to a few destinations
  ({ f, card, fg, bg, F }) => {
    const map = 900;
    const branches = [0, 1, 2].map((i) => tw(f, 166 + i * 5, 186 + i * 5, 0, 1, EASE.inOut));
    return (
      <>
        <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.textTop }}>
          <Statement f={f} lines={card.lines} at={card.at + 1} size={F.textSize * 0.82} color={fg} />
          <div style={{ marginTop: 28, ...dropStyle(f, card.at + 7) }}>
            <Arrow size={F.textSize * 0.55} color={fg} p={tw(f, card.at + 7, card.at + 18, 0, 1, EASE.out)} />
          </div>
        </div>
        <Art F={F} dy={60}>
          <div style={{ position: "relative", width: map, height: map }}>
            <MapRace size={map} fg={fg} bg={bg} grid={1} main={1} branches={branches} />
            <div style={{ position: "absolute", left: 150 - 45, top: 760 - 120 }}>
              <Pin size={90} fg={fg} bg={bg} />
            </div>
            {BRANCH_ENDS.map((p, i) => {
              const k = sp(f, 186 + i * 5, { damping: 11, stiffness: 220 });
              return f >= 186 + i * 5 ? (
                <div key={i} style={{ position: "absolute", left: p.x - 30, top: p.y - 80, transform: `scale(${k})`, transformOrigin: "50% 100%" }}>
                  <Pin size={60} fg={fg} bg={bg} />
                </div>
              ) : null;
            })}
          </div>
        </Art>
      </>
    );
  },
  // 0:07 Pod Now. It's go time. — a clock snaps to now; the Pod launches off the line
  ({ f, card, fg, bg, F }) => {
    const snapAt = 222;
    const spin = f < snapAt ? (f - 210) * 47 : 0;
    const settle = f < snapAt ? 0 : landShake(f, snapAt, 8);
    const launch = (fr: number) => mix(0, 1500, tw(fr, 236, 250, 0, 1, EASE.in));
    const lx = launch(f);
    const blur = speedBlur(launch, f, 0.3, 50);
    return (
      <>
        <Headline f={f} card={card} fg={fg} bg={bg} F={F} fmt="9x16" />
        <Art F={F} dy={-150}>
          <div style={{ transform: `rotate(${settle}deg) scale(${f >= snapAt ? 1 + 0.08 * Math.exp(-(f - snapAt) / 3) : 1})` }}>
            <Clock size={360} fg={fg} bg={bg} hour={(spin / 12) % 360} minute={spin % 360} />
          </div>
        </Art>
        <Art F={F} dy={200}>
          <div style={{ position: "relative", width: 980 }}>
            <div style={{ position: "absolute", left: -40, top: 205, width: 1060, height: 8, background: `repeating-linear-gradient(90deg, ${fg} 0 40px, transparent 40px 70px)`, opacity: 0.6 }} />
            <Streaks color={fg} p={tw(f, 236, 242)} width={500} height={170} />
            <HBlur id="v1c4" amount={blur}>
              <div style={{ transform: `translateX(${lx}px)` }}>
                <PodSide id="c4" width={720} fg={fg} bg={bg} lights={1} wheel={lx * 1.2} style={{ marginLeft: 120, marginTop: -60 }} />
              </div>
            </HBlur>
          </div>
        </Art>
      </>
    );
  },
  // 0:09 Pod Later. It's a date. — a calendar flips to tomorrow morning; a Pod is already parked at the gate
  ({ f, card, fg, bg, F }) => {
    const flip = tw(f, 276, 290, 0, 1, EASE.inOut);
    const park = sp(f, 292, { damping: 22, stiffness: 160 });
    return (
      <>
        <Headline f={f} card={card} fg={fg} bg={bg} F={F} fmt="9x16" />
        <Art F={F} dy={-120}>
          <div style={dropStyle(f, card.at + 2)}>
            <Calendar width={430} fg={fg} bg={bg} flip={flip} top={V1_ART.calendarTop} body={V1_ART.calendarBody} />
          </div>
        </Art>
        <Art F={F} dx={-130} dy={310}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 24, opacity: park, transform: `translateX(${(1 - park) * 120}px)` }}>
            <Gate width={200} fg={fg} bg={bg} />
            <PodSide id="c5" width={440} fg={fg} bg={bg} />
          </div>
        </Art>
      </>
    );
  },
  // 0:11 Pod Solo. It's a party for one. — one seat lights up; the rest of the car stretches out around it
  ({ f, card, fg, bg, F }) => {
    const stretch = tw(f, 338, 360, 0, 1, EASE.out);
    const glow = 0.6 + 0.4 * Math.sin((f - 330) / 4);
    return (
      <>
        <Headline f={f} card={card} fg={fg} bg={bg} F={F} fmt="9x16" />
        <Art F={F} dy={120}>
          <div style={{ transform: `scale(${mix(1.25, 1, stretch)})` }}>
            <SeatMap width={500} fg={fg} bg={bg} stretch={stretch} solo={2} outline={stretch} glow={glow} />
          </div>
        </Art>
      </>
    );
  },
  // 0:13 Pod Shared. It's a party for everyone. — every seat fills; the fare tag splits, one piece per seat
  ({ f, card, fg, bg, F }) => {
    const W = 470;
    const scale = W / 300;
    const lit = SEATS.map((_, i) => tw(f, SFX.seatsFill[i], SFX.seatsFill[i] + 3));
    const tagIn = sp(f, 392, { damping: 16, stiffness: 200 });
    const split = tw(f, SFX.fareSnap[0], SFX.fareSnap[0] + 4, 0, 1, EASE.out);
    const fall = tw(f, SFX.fareSnap[0] + 4, SFX.fareSnap[0] + 16, 0, 1, EASE.in);
    const tagW = 300;
    return (
      <>
        <Headline f={f} card={card} fg={fg} bg={bg} F={F} fmt="9x16" />
        <Art F={F} dy={160}>
          <div style={{ position: "relative", width: W, height: (W * 520) / 300 }}>
            <SeatMap width={W} fg={fg} bg={bg} stretch={1} lit={lit} outline={1} glow={tw(f, 420, 426)} />
            {[0, 1, 2].map((i) => {
              const target = SEATS[i];
              const sx = (tagW / 3) * (i - 1) * 0.15 * split;
              const tx = mix(W / 2 - tagW / 2 + sx, target.x * scale - (tagW / 3) * i + 24 * scale - tagW / 6, fall);
              const ty = mix(-170 - (1 - tagIn) * 260, target.y * scale + 34 * scale - (tagW * 0.56) / 2, fall);
              return f >= 392 && f < 424 ? (
                <FareTagSlice key={i} width={tagW} i={i} n={3} fg={fg} bg={bg} style={{ left: tx + (i - 1) * 18 * split, top: ty, opacity: f > 418 ? 1 - tw(f, 418, 424) : 1, transform: `rotate(${(i - 1) * 8 * split * (1 - fall)}deg)` }} />
              ) : null;
            })}
          </div>
        </Art>
      </>
    );
  },
  // 0:15 Cool fare. — a fare card holds steady while rain, traffic and a clock spin around it
  ({ f, card, fg, bg, F }) => {
    const a = (f - 450) * 0.07;
    const R = 380;
    const icons = [
      <Rain key="r" size={190} fg={fg} bg={bg} t={f} />,
      <Traffic key="t" size={190} fg={fg} bg={bg} />,
      <Clock key="c" size={190} fg={fg} bg={bg} hour={(f - 450) * 12} minute={(f - 450) * 40} />,
    ];
    const vel = 0.07 * R;
    return (
      <>
        <Headline f={f} card={card} fg={fg} bg={bg} F={F} fmt="9x16" />
        <Art F={F} dy={120}>
          <div style={{ position: "relative", width: 900, height: 900 }}>
            {icons.map((ic, i) => {
              const t = a + (i * Math.PI * 2) / 3;
              const pop = sp(f, 452 + i * 3, { damping: 14, stiffness: 200 });
              return (
                <div key={i} style={{ position: "absolute", left: 450 + Math.cos(t) * R - 95, top: 450 + Math.sin(t) * R * 0.78 - 95, transform: `scale(${pop}) rotate(${Math.sin(t) * 8}deg)`, filter: `blur(${vel * 0.08}px)` }}>
                  {ic}
                </div>
              );
            })}
            <div style={{ position: "absolute", left: 450 - 240, top: 450 - 134, transform: `scale(${sp(f, 451, { damping: 18, stiffness: 240 })})` }}>
              <div style={{ position: "relative", width: 480, height: 270 }}>
                <FareTagSlice width={480} i={0} n={1} fg={fg} bg={bg} style={{ left: 0, top: 0 }} />
              </div>
            </div>
          </div>
        </Art>
      </>
    );
  },
  // 0:17 Cool car. — cold air ripples off the AC vent; frost creeps across the edge of the frame
  ({ f, card, fg, bg, F }) => (
    <>
      <Frost W={F.W} H={F.H} color={fg} p={tw(f, 512, 566, 0, 1, EASE.out)} />
      <Headline f={f} card={card} fg={fg} bg={bg} F={F} fmt="9x16" />
      <Art F={F} dy={60}>
        <div style={dropStyle(f, card.at + 3)}>
          <Vent width={640} fg={fg} bg={bg} t={f - 510} />
        </div>
      </Art>
    </>
  ),
  // 0:19 Oh, and cool Pilot. — record scratch; music dead; a Pilot nods in the rear-view mirror
  ({ f, card, fg, bg, F }) => {
    const nodAt = SFX.nod[0] - 4;
    const nod = Math.sin(Math.PI * tw(f, nodAt, nodAt + 14, 0, 1, EASE.inOut));
    return (
      <>
        <Art F={F} dy={-360}>
          <div style={dropStyle(f, 578, 160)}>
            <MirrorPilot width={760} fg={fg} bg={bg} nod={nod} />
          </div>
        </Art>
        <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.art.cy + 60 * F.art.s }}>
          <Statement f={f} lines={card.lines} at={588} size={F.textSize * 0.62} color={fg} />
        </div>
      </>
    );
  },
  // 0:22 It's safe. It's set. It's smooth. — beat slams back; one word per beat (small "It's" over a huge word)
  ({ f, card, fg, F }) => {
    const punch = card.punch!;
    const shake = punch.reduce((acc, t) => acc + landShake(f, t + 3, 7), 0);
    const big = F.textSize * 1.32;
    const small = F.textSize * 0.5;
    return (
      <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.H * 0.22, display: "flex", flexDirection: "column", gap: F.textSize * 0.1, transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
        {card.lines.map((line, li) => (
          <div key={li} style={{ fontFamily: POPPINS, color: fg, lineHeight: 0.98 }}>
            <div style={{ fontSize: small, fontWeight: 500, letterSpacing: -1, ...dropStyle(f, punch[li * 2]) }}>{line[0].t}</div>
            <div style={{ fontSize: big, fontWeight: 800, letterSpacing: -big * 0.04, ...dropStyle(f, punch[li * 2 + 1], 140) }}>{line[1].t}</div>
          </div>
        ))}
      </div>
    );
  },
  // 0:26 It's Pod. — everything clears except the Pod, centre frame
  ({ f, card, fg, bg, F }) => (
    <>
      <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.H * 0.3 }}>
        <Statement f={f} lines={card.lines} at={card.at + 1} size={F.textSize * 1.2} color={fg} align="center" />
      </div>
      <Art F={F} dy={0}>
        <div style={{ transform: `scale(${mix(0.9, 1, sp(f, 781, { damping: 20, stiffness: 140 }))}) translateY(${Math.sin((f - 780) / 10) * 4}px)` }}>
          <PodSide id="c12" width={880} fg={fg} bg={bg} lights={1} />
        </div>
      </Art>
    </>
  ),
  // 0:28 Shuttlers Pod. / Open Shuttlers → tap Pod — end frame with the S mark; the track ends on a button
  ({ f, card, fg, F }) => {
    const button = T.edu.v1.sections.button;
    const hit = f >= button ? 1 + 0.04 * Math.exp(-(f - button) / 3) : 1;
    return (
      <AbsoluteFill style={{ transform: `scale(${hit})` }}>
        <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.H * 0.3 }}>
          <Statement f={f} lines={card.lines} at={card.at + 1} size={F.textSize * 1.05} color={fg} />
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 34, fontFamily: POPPINS, fontSize: F.textSize * 0.44, fontWeight: 500, color: fg, ...dropStyle(f, card.at + 7) }}>
            <span>{card.sub![0][0].t}</span>
            <Arrow size={F.textSize * 0.3} color={fg} p={tw(f, card.at + 9, card.at + 18)} stroke={16} />
            <span style={{ fontWeight: 700 }}>{card.sub![0][2].t}</span>
          </div>
        </div>
        <div style={{ position: "absolute", left: F.pad, bottom: F.mark.bottom + 10, fontFamily: POPPINS, fontSize: F.textSize * 0.42, fontWeight: 800, color: fg, letterSpacing: -1, ...dropStyle(f, card.at + 12) }}>{END_LINE}</div>
        <div style={{ position: "absolute", right: F.mark.right, bottom: F.mark.bottom, transform: `scale(${mix(0.4, 1, sp(f, card.at + 8))})`, transformOrigin: "100% 100%" }}>
          <SMark size={F.mark.size * 1.9} color={fg} />
        </div>
      </AbsoluteFill>
    );
  },
];

/* ------------------------------------------------------------------ composition */

export const EduVideo1: React.FC<{ fmt?: Fmt }> = ({ fmt = "9x16" }) => {
  const f = useCurrentFrame();
  const F = FORMATS[fmt];
  let idx = 0;
  for (let i = 0; i < CARDS.length; i++) if (f >= CARDS[i].at) idx = i;
  const card = CARDS[idx];
  const prev = idx > 0 ? CARDS[idx - 1] : null;
  const { fg, bg } = pairColours(card.pair);
  const scratch = T.edu.v1.sfx.scratch[0];
  const ctx = (c: EduCard, i: number, fr: number): Ctx => ({ f: fr, card: c, ...pairColours(c.pair), F, fmt });

  // Record scratch: the previous card stutters backwards for 6 frames before the silence card
  if (f >= scratch && f < scratch + 6) {
    const c = CARDS[idx - 1];
    const rew = scratch - 2 - (f - scratch) * 4;
    const jitter = (f % 2 ? 1 : -1) * 26;
    return (
      <AbsoluteFill style={{ background: pairColours(c.pair).bg, width: F.W, height: F.H, overflow: "hidden" }}>
        <AbsoluteFill style={{ transform: `translateX(${jitter}px)`, filter: "blur(3px)" }}>{scenes[idx - 1](ctx(c, idx - 1, rew))}</AbsoluteFill>
        <Audio1 />
      </AbsoluteFill>
    );
  }

  const sameBg = prev && pairColours(prev.pair).bg === bg;
  const showPrev = prev && !sameBg && f < card.at + 7 && card.at !== T.edu.v1.sections.drop;
  return (
    <AbsoluteFill style={{ background: BLACK, width: F.W, height: F.H, overflow: "hidden" }}>
      {showPrev ? (
        <AbsoluteFill style={{ background: pairColours(prev!.pair).bg }}>
          {scenes[idx - 1](ctx(prev!, idx - 1, f))}
        </AbsoluteFill>
      ) : null}
      <CardBG f={f} at={card.at} bg={bg} dir={idx % 2 ? 1 : -1} instant={!showPrev}>
        {scenes[idx](ctx(card, idx, f))}
        {idx > 0 && idx < CARDS.length - 1 ? (
          <div style={{ position: "absolute", right: F.mark.right, bottom: F.mark.bottom, opacity: 0.95 }}>
            <SMark size={F.mark.size} color={fg} />
          </div>
        ) : null}
      </CardBG>
      <Grain opacity={0.025} />
      <Audio1 />
    </AbsoluteFill>
  );
};

const Audio1: React.FC = () => (assetExists("audio/edu/score-edu1.wav") ? <Audio src={staticFile("audio/edu/score-edu1.wav")} /> : null);

export { liftStyle };

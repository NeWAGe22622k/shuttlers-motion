import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { EASE } from "../config/brand";
import { T } from "../config/time";
import { assetExists, FingerTrack, Grain } from "../components/core";
import { bump, mix, press, sp, speedBlur, tw } from "../components/motion";
import { Push } from "../components/LiftOut";
import { PhoneBody } from "../components/Phone";
import { BtnState } from "../components/ui";
import { HomeScreen } from "../screens/Home";
import { EDU, END_LINE, EduCard, V2_APP } from "./content";
import { BreathIcon, CallIcon, Eye, FlipClock, Pin, SeatMap, SleepIcon, StreetTexture } from "./art";
import { PodIcon } from "./PodIcon";
import { PaymentScreen, RideOptionsScreen, SetDestinationScreen } from "./appV2";
import { Arrow, CardBG, HBlur, SMark, Statement, dropStyle, landShake } from "./kit";
import { BLACK, FORMATS, Fmt, POPPINS, pairColours } from "./theme";
import { Art, Ctx, Headline } from "./Video1";

const V = EDU.v2;
const CARDS = V.cards;
const S = T.edu.v2;
const SFX = S.sfx;

/* ------------------------------------------------------------------ the phone (steps 1–4) */

// Taps inside the phone, app points: Pod tile · Pod Solo row · Continue with Pod Solo · Card
const TAPS: [number, number, number][] = [
  [SFX.tap[0], 196, 479],
  [SFX.tap[1], 196, 562],
  [SFX.tap[2], 196, 777],
  [SFX.tap[3], 196, 360],
];

const btn = (f: number, at: number): BtnState => (f >= at && f < at + 4 ? "pressed" : "default");

const Home: React.FC<{ f: number }> = ({ f }) => {
  const pulse = f < SFX.tap[0] ? 0.5 + 0.5 * Math.sin((f - 180) / 3.5) : bump(f, SFX.tap[0], 4);
  return <HomeScreen pod={{ hi: pulse, press: press(f, SFX.tap[0]) }} />;
};
const SetDest: React.FC<{ f: number }> = ({ f }) => (
  <SetDestinationScreen pinK={sp(f, SFX.pin[0] - 5, { damping: 11, stiffness: 220 })} route={tw(f, SFX.pin[0] + 4, SFX.pin[0] + 30, 0, 1, EASE.inOut)} ping={(((f - 270) / 30) % 1 + 1) % 1} />
);
const Options: React.FC<{ f: number }> = ({ f }) => <RideOptionsScreen rowsIn={tw(f, 358, 372)} sel={tw(f, SFX.tap[1], SFX.tap[1] + 6, 0, 1, EASE.out)} cont={btn(f, SFX.tap[2])} />;
const Pay: React.FC<{ f: number }> = ({ f }) => {
  const flick = SFX.flick;
  const hi = f < flick[0] ? -2 : f < flick[flick.length - 1] + 8 ? (f - flick[0]) / 8 : mix(4, 0, tw(f, flick[flick.length - 1] + 8, SFX.tap[3] - 1, 0, 1, EASE.inOut));
  return (
    <PaymentScreen
      hi={f >= SFX.tap[3] ? -2 : hi}
      sel={tw(f, SFX.tap[3], SFX.tap[3] + 6, 0, 1, EASE.out)}
      cardPress={press(f, SFX.tap[3])}
      secs={V2_APP.pay.countdownFrom - Math.max(0, Math.floor((f - 450) / 30))}
      cont={tw(f, SFX.tap[3] + 2, SFX.tap[3] + 10, 0, 1, EASE.inOut)}
    />
  );
};

const PhoneScreens: React.FC<{ f: number }> = ({ f }) => {
  if (f < 266) return <Home f={f} />;
  if (f < 276) return <Push f={f} at={266} dur={10} from={<Home f={f} />} to={<SetDest f={f} />} />;
  if (f < 356) return <SetDest f={f} />;
  if (f < 366) return <Push f={f} at={356} dur={10} from={<SetDest f={f} />} to={<Options f={f} />} />;
  if (f < 446) return <Options f={f} />;
  if (f < 456) return <Push f={f} at={446} dur={10} from={<Options f={f} />} to={<Pay f={f} />} />;
  return <Pay f={f} />;
};

/** App-point y the camera centres on during each step (the Pod tile, the pin, the options, the payment list). */
const FOCUS: [number, number][] = [
  [180, 470],
  [270, 330],
  [360, 600],
  [450, 430],
];
const focusAt = (f: number) => {
  let y = FOCUS[0][1];
  for (let i = 1; i < FOCUS.length; i++) y = mix(y, FOCUS[i][1], sp(f, FOCUS[i][0] - 6, { damping: 26, stiffness: 120 }));
  return y;
};

/** The phone, flat and large, with a rim in the frame's accent so it reads on black; a soft camera follows the action. */
const Phone: React.FC<{ f: number; F: Ctx["F"]; fg: string; enter?: number }> = ({ f, F, fg, enter = 1 }) => {
  const scale = F.art.s * 1.42;
  const unit = 1.094 * scale; // app point → frame px
  const fy = focusAt(f);
  const targetY = F.art.cy + 110 * F.art.s; // where the focus point sits on screen
  const top = targetY - (10 + fy * 1.094) * scale;
  return (
    <div style={{ position: "absolute", left: F.art.cx - 40 * F.art.s - (450 * scale) / 2, top: top + (1 - enter) * 1200, width: 450, height: 952, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
      <div style={{ borderRadius: 64, boxShadow: `0 0 0 ${3 / scale * 1.4}px ${fg}, 0 40px 90px rgba(0,0,0,.45)` }}>
        <PhoneBody time={V2_APP.phoneTime} overlay={<FingerTrack f={f} taps={TAPS} />}>
          <PhoneScreens f={f} />
        </PhoneBody>
      </div>
      <div style={{ display: "none" }}>{unit}</div>
    </div>
  );
};

/** Step cards: big step number, the instruction, the phone below. */
const StepCard = (c: Ctx, first = false) => {
  const band = c.F.textTop - 70 + c.F.textSize * 1.12 + (c.card.lines.length - 1) * c.F.textSize * 0.6 + 70;
  return (
    <>
      <Phone f={c.f} F={c.F} fg={c.fg} enter={first ? sp(c.f, 181, { damping: 22, stiffness: 140 }) : 1} />
      {/* header band in the card colour: the phone slides up underneath it */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: band, background: `linear-gradient(180deg, ${c.bg} 0%, ${c.bg} 86%, ${c.bg}00 100%)` }} />
      <Headline {...c} top={c.F.textTop - 70} />
    </>
  );
};

/* ------------------------------------------------------------------ the 16 cards */

const scenes: ((c: Ctx) => React.ReactNode)[] = [
  // 0:00 Let's get you moving. — a phone clock flips to 8:50; the track starts building
  ({ f, card, fg, bg, F }) => (
    <>
      <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.textTop }}>
        <Statement f={f} lines={card.lines} at={4} size={F.textSize * 0.6} color={fg} />
      </div>
      <Art F={F} dy={-40}>
        <div style={{ transform: `scale(${1 + 0.03 * Math.exp(-Math.max(0, f - 46) / 4) * (f >= 46 ? 1 : 0)})` }}>
          <FlipClock from={V2_APP.clock[0]} to={V2_APP.clock[1]} p={tw(f, 36, 46, 0, 1, EASE.inOut)} size={260} fg={fg} bg={bg} />
        </div>
      </Art>
    </>
  ),
  // 0:02 Like, right now. — words punch in one by one as the beat drops
  ({ f, card, fg, F }) => {
    const shake = card.punch!.reduce((a, t) => a + landShake(f, t + 3, 8), 0);
    return (
      <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.H * 0.3, transform: `translate(${shake}px, ${shake * 0.5}px)` }}>
        <Statement f={f} lines={[[card.lines[0][0]], [card.lines[0][1]], [card.lines[0][2]]]} at={card.at} size={F.textSize * 1.55} color={fg} punch={card.punch} punchBy="line" lineGap={0} />
      </div>
    );
  },
  // 0:04 Pod Solo. — the Pod swings into frame, one seat glowing green
  ({ f, card, fg, bg, F }) => {
    const k = sp(f, 120, { damping: 16, stiffness: 170 });
    const door = tw(f, 134, 144, 0, 1, EASE.out);
    return (
      <>
        <Headline f={f} card={card} fg={fg} bg={bg} F={F} fmt="9x16" />
        <Art F={F} dx={(1 - k) * 900} dy={60 - (1 - k) * 260}>
          <div style={{ transform: `rotate(${(1 - k) * -18}deg)` }}>
            <PodIcon id="v2c2" width={900} lights={1} door={door} seatGlow={door} />
          </div>
        </Art>
      </>
    );
  },
  // 0:05 Here's how. — the card wipes across on the beat
  ({ f, card, fg, F }) => (
    <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.H * 0.38 }}>
      <Statement f={f} lines={card.lines} at={card.at + 1} size={F.textSize * 1.15} color={fg} />
      <div style={{ marginTop: 30, ...dropStyle(f, card.at + 6) }}>
        <Arrow size={F.textSize * 0.6} color={fg} p={tw(f, card.at + 6, card.at + 16, 0, 1, EASE.out)} />
      </div>
    </div>
  ),
  // 0:06 1. Open Shuttlers. Tap Pod. — phone frame; the Pod tile pulses; a tap ripple lands on the beat
  (c) => StepCard(c, true),
  // 0:09 2. Set your destination. — a pin drops on the map with a soft thud; pickup is already where you are
  (c) => StepCard(c),
  // 0:12 3. Choose Pod Solo. — two taps, two beats
  (c) => StepCard(c),
  // 0:15 4. Pay your way. — payment options flick past; one is tapped on the beat
  (c) => StepCard(c),
  // 0:17 Blink. — an eye blinks; the frame cuts to black for a beat
  ({ f, card, fg, bg, F }) => {
    const lid = Math.sin(Math.PI * tw(f, SFX.blink[0] - 4, SFX.blink[0] + 6, 0, 1, EASE.inOut));
    return (
      <>
        <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.textTop }}>
          <Statement f={f} lines={card.lines} at={card.at + 1} size={F.textSize * 1.2} color={fg} />
        </div>
        <Art F={F} dy={40}>
          <div style={dropStyle(f, card.at + 3)}>
            <Eye size={640} lid={lid} fg={fg} bg={bg} />
          </div>
        </Art>
      </>
    );
  },
  // (black for a beat)
  () => null,
  // Blink. (back from black)
  ({ fg, bg, F }) => (
    <>
      <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.textTop, fontFamily: POPPINS, fontWeight: 800, fontSize: F.textSize * 1.2, letterSpacing: -F.textSize * 0.05, color: fg }}>Blink.</div>
      <Art F={F} dy={40}>
        <Eye size={640} lid={0} fg={fg} bg={bg} />
      </Art>
    </>
  ),
  // 0:19 And your Pod is here. — the music halts; the Pod is at the pin; the only sound is a door click
  ({ f, card, fg, bg, F }) => {
    const door = tw(f, SFX.door[0], SFX.door[0] + 12, 0, 1, EASE.out);
    return (
      <>
        <Headline f={f} card={card} fg={fg} bg={bg} F={F} fmt="9x16" />
        <Art F={F} dx={-270} dy={-80}>
          <div style={dropStyle(f, card.at + 2, 60)}>
            <Pin size={170} fg={fg} bg={bg} />
          </div>
        </Art>
        <Art F={F} dx={10} dy={150}>
          <div style={dropStyle(f, card.at + 4, 40)}>
            <PodIcon id="v2c11" width={680} lights={1} door={door} seatGlow={door} />
          </div>
        </Art>
      </>
    );
  },
  // 0:21 All yours. — the beat kicks back; one seat glows, then the whole car glows green around it
  ({ f, card, fg, bg, F }) => (
    <>
      <Headline f={f} card={card} fg={fg} bg={bg} F={F} fmt="9x16" />
      <Art F={F} dy={120}>
        <SeatMap width={500} fg={fg} bg={bg} stretch={1} solo={2} outline={0.6} glow={0.6 + 0.4 * Math.sin((f - 630) / 4)} carGlow={tw(f, 645, 662, 0, 1, EASE.out)} />
      </Art>
    </>
  ),
  // 0:23 Catch a call. Catch a nap. Catch your breath. — three icon beats as the map slides past
  ({ f, card, fg, bg, F }) => {
    const icons = [CallIcon, SleepIcon, BreathIcon];
    return (
      <>
        <Art F={F} dy={-100} scale={2.2}>
          <StreetTexture color={fg} size={900} dx={-(f - 690) * 3} />
        </Art>
        <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.H * 0.24, display: "flex", flexDirection: "column", gap: 70 }}>
          {card.lines.map((line, i) => {
            const at = card.punch![i];
            const Ico = icons[i];
            const k = sp(f, at, { damping: 13, stiffness: 220 });
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 40 }}>
                <div style={{ transform: `scale(${f >= at ? k : 0}) rotate(${(1 - k) * -40}deg)` }}>
                  <Ico size={170} fg={fg} bg={bg} t={f - at} />
                </div>
                <div style={{ fontFamily: POPPINS, fontSize: F.textSize * 0.54, fontWeight: 700, letterSpacing: -3, color: fg, whiteSpace: "nowrap", ...dropStyle(f, at) }}>{line[0].t}</div>
              </div>
            );
          })}
        </div>
      </>
    );
  },
  // 0:26 Pod Solo. — the Pod pulls away, centre frame
  ({ f, card, fg, bg, F }) => {
    const go = (fr: number) => mix(0, 1700, tw(fr, 792, 818, 0, 1, EASE.in));
    const x = go(f);
    return (
      <>
        <Headline f={f} card={card} fg={fg} bg={bg} F={F} fmt="9x16" />
        <HBlur id="v2c14" amount={speedBlur(go, f, 0.3, 50)}>
          <Art F={F} dx={x - 40} dy={40}>
            <PodIcon id="v2c14p" width={860} lights={1} />
          </Art>
        </HBlur>
      </>
    );
  },
  // 0:28 Pod Now. — end frame: Safe. Set. Smooth. + S mark
  ({ f, card, fg, F }) => {
    const hit = f >= S.sections.button ? 1 + 0.04 * Math.exp(-(f - S.sections.button) / 3) : 1;
    return (
      <AbsoluteFill style={{ transform: `scale(${hit})` }}>
        <div style={{ position: "absolute", left: F.pad, right: F.pad, top: F.H * 0.32 }}>
          <Statement f={f} lines={card.lines} at={card.at + 1} size={F.textSize * 1.3} color={fg} />
        </div>
        <div style={{ position: "absolute", left: F.pad, bottom: F.mark.bottom + 10, fontFamily: POPPINS, fontSize: F.textSize * 0.42, fontWeight: 800, color: fg, letterSpacing: -1, ...dropStyle(f, card.at + 8) }}>{END_LINE}</div>
        <div style={{ position: "absolute", right: F.mark.right, bottom: F.mark.bottom, transform: `scale(${mix(0.4, 1, sp(f, card.at + 6))})`, transformOrigin: "100% 100%" }}>
          <SMark size={F.mark.size * 1.9} color={fg} />
        </div>
      </AbsoluteFill>
    );
  },
];

/* ------------------------------------------------------------------ composition */

const Audio2: React.FC = () => (assetExists("audio/edu/score-edu2.wav") ? <Audio src={staticFile("audio/edu/score-edu2.wav")} /> : null);

export const EduVideo2: React.FC<{ fmt?: Fmt }> = ({ fmt = "9x16" }) => {
  const f = useCurrentFrame();
  const F = FORMATS[fmt];
  let idx = 0;
  for (let i = 0; i < CARDS.length; i++) if (f >= CARDS[i].at) idx = i;
  const card = CARDS[idx];
  const prev = idx > 0 ? CARDS[idx - 1] : null;
  const { fg, bg } = pairColours(card.pair);
  const ctx = (c: EduCard, fr: number): Ctx => ({ f: fr, card: c, ...pairColours(c.pair), F, fmt });
  const hardCut = card.pair === "X" || prev?.pair === "X" || card.at === S.sections.drop || card.at === S.sections.halt[0] || card.at === S.sections.kickBack;
  const sameBg = prev && pairColours(prev.pair).bg === bg;
  const showPrev = prev && !sameBg && !hardCut && f < card.at + 7;
  return (
    <AbsoluteFill style={{ background: BLACK, width: F.W, height: F.H, overflow: "hidden" }}>
      {showPrev ? <AbsoluteFill style={{ background: pairColours(prev!.pair).bg }}>{scenes[idx - 1](ctx(prev!, f))}</AbsoluteFill> : null}
      <CardBG f={f} at={card.at} bg={bg} dir={idx % 2 ? 1 : -1} instant={!showPrev}>
        {scenes[idx](ctx(card, f))}
        {card.pair !== "X" && idx > 0 && idx < CARDS.length - 1 ? (
          <div style={{ position: "absolute", right: F.mark.right, bottom: F.mark.bottom }}>
            <SMark size={F.mark.size} color={fg} />
          </div>
        ) : null}
      </CardBG>
      <Grain opacity={0.025} />
      <Audio2 />
    </AbsoluteFill>
  );
};

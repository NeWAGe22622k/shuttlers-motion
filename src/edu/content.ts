// Copy from "Shuttlers Pod: Education Videos (Motion Graphics Scripts)", verbatim.
// Segments marked b:true are the bold parts of the brief. "punch" cards land one word
// (or one line) per beat. pair: "G" = green on black, "K" = black on green (one accent per frame).

export type Seg = { t: string; b?: boolean };
export type EduCard = {
  at: number; // frame (also in timing.json → edu.vN.cards)
  lines: Seg[][];
  pair: "G" | "K" | "X"; // X = full black (blackout)
  punch?: number[]; // frames at which each word/line lands (one per beat)
  punchBy?: "word" | "line";
  sub?: Seg[][];
  end?: boolean; // end frame: Safe. Set. Smooth. + S mark
  arrow?: boolean;
  motion: string; // the brief's motion note (shown in the animatic guide strip)
};

export const END_LINE = "Safe. Set. Smooth.";

export const EDU: Record<"v1" | "v2", { title: string; caption: string; cards: EduCard[] }> = {
  v1: {
    title: "How Pod works",
    caption: "The wait is over. Your Pod is here 💚",
    cards: [
      { at: 0, pair: "G", lines: [[{ t: "The wait is over." }]], motion: "Black screen, a low hum building." },
      { at: 60, pair: "K", lines: [[{ t: "Your Pod is here.", b: true }]], motion: "The beat drops. The Pod glides in, headlights on, and the door swings open." },
      { at: 120, pair: "G", lines: [[{ t: "Doorstep to destination." }]], motion: "A pin drops on a doorstep, and a green line races across Lagos," },
      { at: 165, pair: "G", lines: [[{ t: "Wherever you go." }]], arrow: true, motion: "…branching to a few destinations." },
      { at: 210, pair: "K", lines: [[{ t: "Pod Now.", b: true }], [{ t: "It's go time." }]], motion: "A clock snaps to now, and the Pod launches off the line." },
      { at: 270, pair: "G", lines: [[{ t: "Pod Later.", b: true }], [{ t: "It's a date." }]], motion: "A calendar flips to tomorrow morning. A Pod is already parked at the gate." },
      { at: 330, pair: "K", lines: [[{ t: "Pod Solo.", b: true }], [{ t: "It's a party for one." }]], motion: "One seat lights up, and the rest of the car stretches out around it." },
      { at: 390, pair: "G", lines: [[{ t: "Pod Shared.", b: true }], [{ t: "It's a party for everyone." }]], motion: "Every seat fills up. The fare tag splits into equal pieces, one drops onto each seat." },
      { at: 450, pair: "K", lines: [[{ t: "Cool fare." }]], motion: "A fare card holds steady while rain, traffic and a clock spin around it." },
      { at: 510, pair: "G", lines: [[{ t: "Cool car." }]], motion: "Cold air ripples off the AC vent. Frost creeps across the edge of the frame." },
      { at: 570, pair: "G", lines: [[{ t: "Oh, and cool Pilot." }]], motion: "Record scratch. The music cuts dead. A Pilot gives a small nod in the rear-view mirror." },
      {
        at: 660,
        pair: "G",
        lines: [[{ t: "It's", b: true }, { t: "safe.", b: true }], [{ t: "It's", b: true }, { t: "set.", b: true }], [{ t: "It's", b: true }, { t: "smooth.", b: true }]],
        punch: [660, 675, 690, 705, 720, 735],
        punchBy: "word",
        motion: "The beat slams back in. One word lands per beat, each in green on black.",
      },
      { at: 780, pair: "K", lines: [[{ t: "It's Pod.", b: true }]], motion: "Everything clears except the Pod, centre frame." },
      { at: 840, pair: "G", lines: [[{ t: "Shuttlers Pod.", b: true }]], sub: [[{ t: "Open Shuttlers" }, { t: "→" }, { t: "tap Pod" }]], end: true, motion: "End frame with the S mark. The track ends on a button." },
    ],
  },
  v2: {
    title: "How to book Pod Solo (Pod Now)",
    caption: "Hey, it’s go time. Pod Solo, Pod Now.",
    cards: [
      { at: 0, pair: "G", lines: [[{ t: "Let's get you moving." }]], motion: "A phone clock flips to 8:50. The track starts building." },
      { at: 60, pair: "K", lines: [[{ t: "Like,", b: true }, { t: "right", b: true }, { t: "now.", b: true }]], punch: [60, 75, 90], punchBy: "word", motion: "The card wipes to the next, and the words punch in one by one as the beat drops." },
      { at: 120, pair: "G", lines: [[{ t: "Pod Solo.", b: true }]], motion: "The Pod swings into frame, one seat glowing green." },
      { at: 150, pair: "G", lines: [[{ t: "Here's how." }]], motion: "The card wipes across on the beat." },
      { at: 180, pair: "K", lines: [[{ t: "1.", b: true }], [{ t: "Open Shuttlers. Tap Pod." }]], motion: "Phone frame. The Pod tile pulses, and a tap ripple lands on the beat." },
      { at: 270, pair: "G", lines: [[{ t: "2.", b: true }], [{ t: "Set your destination." }]], motion: "A pin drops on the map with a soft thud. Pickup is already set to where you are." },
      { at: 360, pair: "K", lines: [[{ t: "3.", b: true }], [{ t: "Choose Pod Solo." }]], motion: "Two taps, two beats." },
      { at: 450, pair: "G", lines: [[{ t: "4.", b: true }], [{ t: "Pay your way." }]], motion: "Payment options flick past (card, transfer, USSD, wallet), and one is tapped on the beat." },
      { at: 510, pair: "K", lines: [[{ t: "Blink.", b: true }]], motion: "Alone on the screen. An eye icon blinks, and the frame cuts to black for a beat." },
      { at: 540, pair: "X", lines: [], motion: "(cut to black for a beat)" },
      { at: 555, pair: "K", lines: [[{ t: "Blink.", b: true }]], motion: "" },
      { at: 570, pair: "G", lines: [[{ t: "And your Pod is here.", b: true }]], motion: "The music halts dead. The Pod icon is at the pin, and the only sound is a door click." },
      { at: 630, pair: "K", lines: [[{ t: "All yours." }]], motion: "The beat kicks back in. One seat glows, then the whole car glows green around it." },
      {
        at: 690,
        pair: "G",
        lines: [[{ t: "Catch a call." }], [{ t: "Catch a nap." }], [{ t: "Catch your breath." }]],
        punch: [690, 720, 750],
        punchBy: "line",
        motion: "Three quick icon beats: a phone, a sleeping face, a calm exhale as the map slides past.",
      },
      { at: 780, pair: "K", lines: [[{ t: "Pod Solo.", b: true }]], motion: "The Pod pulls away, centre frame." },
      { at: 840, pair: "G", lines: [[{ t: "Pod Now.", b: true }]], end: true, motion: "End frame: Safe. Set. Smooth. + S mark." },
    ],
  },
};

// Illustrative labels inside the art (not claims): the calendar that "flips to tomorrow morning".
export const V1_ART = {
  calendarTop: ["TODAY", "TOMORROW"],
  calendarBody: ["NOW", "7:00 AM"],
};

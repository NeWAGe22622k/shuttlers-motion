// PodVideo2-16x9 · every visible string. The story copy (home … s14, trip) is the content
// manager's shot list, word for word. `app` holds the in-app UI strings, copied from the
// reference screenshots (public/screens/01–09) with personal data removed.

export const home = { time: "8:50", greeting: "Hi, Tolu" };
export const s1 = { clockFrom: "8:49", clockTo: "8:50", line: "Let's get you moving." };
export const s2 = { line: "Like, right now." };
export const s3 = { line: "Pod Solo." };
export const s4 = { line: "Here's how." };
export const s5 = { step: "1", line: "Open Shuttlers. Tap Pod." };
export const s6 = { step: "2", line: "Set your destination.", query: "filmhouse" };
export const s7 = { step: "3", line: "Choose Pod Solo." };
export const s8 = { step: "4", line: "Pay your way." };
export const s9 = { line: "Blink." };
export const s10 = { line: "And your Pod is here." };
export const s11 = { line: "All yours." };
export const s12 = { lines: ["Catch a call.", "Catch a nap.", "Catch your breath."] };
export const s13 = { line: "Pod Solo." };
export const s14 = { line: "Pod Now.", tags: ["Safe.", "Set.", "Smooth."] };
export const trip = {
  pickup: "Jasper Ike Street, Eti-Osa, Lagos",
  dropoff: "Filmhouse Cinemas IMAX Lekki Lagos",
  distance: "3.7 km · 8 mins",
  dailyPrice: "₦2,760",
  podPrice: "₦2,639.24",
  maxPay: "₦2,903.17",
};
export const postCaption = "Hey, it's go time. Pod Solo, Pod Now."; // for the social post, not on screen

/** In-app UI strings (from the screenshots). No prices or claims beyond `trip`. */
export const app = {
  home: {
    location: "Lagos, Nigeria",
    whereTo: "Where to?",
    now: "Now",
    recents: [
      { title: "Lekki Phase 1 Bus stop", sub: "Agungi Bus Stop", code: "SGT224", time: "07:30 AM" },
      { title: "Lekki Phase1 Bus Stop", sub: "Agungi Bus Stop", code: "SGT641", time: "07:00 AM" },
    ],
    servicesTitle: "Services",
    services: {
      daily: { title: "Daily", sub: "Bustop to bustop" },
      pod: { title: "Pod", sub: "Door to door", badge: "New" },
      rent: { title: "Rent", sub: "Hire any vehicle" },
    },
    bannerTitle: "Shuttlers Pod:",
    bannerSub: "Now in Beta",
    tabs: ["Home", "Services", "Bookings", "My Account"],
  },
  plan: {
    title: "Plan your ride",
    leaveNow: "Leave now",
    current: "· Current",
    destPlaceholder: "Address, route code or bus stop",
    recents: [
      { title: "Jasper Ike Street", sub: "Lagos, Nigeria", tag: "Address" },
      { title: "Lekki Phase 1", sub: "Lekki, Nigeria", tag: "Bus stop" },
      { title: "Filmhouse Cinemas IMAX Lekki Lagos", sub: "The Rock Drive, Lagos, Nigeria", tag: "Address" },
      { title: "Agungi bus stop", sub: "Lekki - Epe Expressway, Lekki, Nigeria", tag: "Address" },
      { title: "Lekki Phase 1", sub: "Lekki, Nigeria", tag: "Address" },
    ],
  },
  search: {
    chips: ["Top results", "Locations", "Bus stops", "Routes"],
    locationsTitle: "Locations",
    busStopsTitle: "Bus stops",
    viewAll: "View all",
    info: "Pick a place to see every way there. Pick a route to book it.",
    showAll: "Show all 12 results",
    final: {
      locations: [
        { title: "Filmhouse Cinemas IMAX Lekki Lagos", sub: "The Rock Drive, Lagos, Nigeria" },
        { title: "Filmhouse Group - Support Office", sub: "Ahman Cl, Lagos, Nigeria" },
      ],
      busStops: [
        { title: "Filmhouse Cinemas IMAX Lekki Lagos", sub: "The Rock Drive, Lagos, Nigeria" },
        { title: "Filmhouse Cinemas IMAX Lekki Lagos", sub: "The Rock Drive, Lekki, Nigeria" },
      ],
    },
    // what the list shows while the query is still "f", "fi", "fil" (the final rows land from "film")
    interim: [
      {
        locations: [
          { title: "Falomo Shopping Centre", sub: "Awolowo Rd, Ikoyi, Lagos, Nigeria" },
          { title: "Festac Town", sub: "Amuwo Odofin, Lagos, Nigeria" },
        ],
        busStops: [
          { title: "Falomo Bus Stop", sub: "Ikoyi, Lagos, Nigeria" },
          { title: "Fadeyi Bus Stop", sub: "Ikorodu Rd, Lagos, Nigeria" },
        ],
      },
    ],
    // [top, locations, bus stops] after each typed letter
    counts: [
      [48, 41, 7],
      [31, 27, 4],
      [19, 17, 2],
      [12, 12, 2],
    ],
  },
  map: {
    leaving: "Leaving now",
    change: "Change",
    labels: ["LEKKI PHASE 1", "VICTORIA ISLAND", "LEKKI", "IKOYI", "ELEGANZA"],
    road: "Lekki - Epe Expy",
  },
  options: {
    daily: { title: "Daily", sub: "Pickup from nearest bustop", unit: "per seat" },
    podSolo: { title: "Pod Solo", sub: "Get a car in minutes", unit: "per trip" },
    rent: { title: "Rent", sub: "Any vehicle, your schedule" },
    cta: "Continue",
  },
  fare: {
    title: "Pod Solo",
    pickup: "Pickup",
    dropoff: "Dropoff",
    rideFare: "Ride fare",
    mostYouPay: "Most you will pay",
    pay: "Pay",
    cancel: "Cancel",
  },
  pay: {
    title: "Select Payment Method",
    finishIn: "Finish paying in Shuttlers Pay",
    countdownFrom: 290, // seconds (4:50 in the screenshot)
    methods: ["Card", "Bank Transfer", "USSD", "Company wallet · Shuttlers"],
    cta: "Continue to payment",
  },
  success: { title: "Payment successful", sub: "Your payment went through.", cta: "Done" },
};

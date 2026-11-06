// PodVideo2-9x16 · every visible string. The story copy (home … s14, trip) is the content
// manager's shot list, word for word, with every full stop removed (revision 3: no full stops anywhere;
// in-app sentences that ran into each other are set as separate lines instead). `app` holds the in-app UI strings.

export const home = { time: "8:50", greeting: "Hi, Abraham" };
export const s1 = { clockFrom: "8:49", clockTo: "8:50", line: "Let's get you moving" };
export const s2 = { lines: ["Like", "right now"] };
export const s3 = { line: "Pod Solo" };
export const s4 = { line: "Here's how" };
export const s5 = { step: "1", lines: ["Open Shuttlers", "Tap Pod"] };
export const s6 = { step: "2", lines: ["Set your", "destination"], query: "sanusi" };
export const s7 = { step: "3", lines: ["Choose", "Pod Solo"] };
export const s8 = { step: "4", lines: ["Pay your way"] };
export const s9 = { line: "Blink" };
export const s10 = { lines: ["And your Pod", "is here"] };
export const s11 = { line: "All yours" };
export const s12 = { lines: ["Catch a call", "Catch a nap", "Catch your breath"] };
export const s13 = { line: "Pod Solo" };
export const s14 = { line: "Pod Now", tags: ["Safe", "Set", "Smooth"], logo: "Shuttlers" };
export const trip = {
  pickup: "4 Jasper Ike Street, Lagos, Nigeria",
  dropoff: "Sanusi Fafunwa Street, Lagos, Nigeria",
  distance: "7.1 km · 13 mins",
  podPrice: "₦5,682.66",
  held: "₦568.27",
  maxPay: "₦6,250.93",
  fareMeta: "7.1 km · 13 min",
};
export const postCaption = "Hey, it's go time. Pod Solo, Pod Now."; // for the social post, not on screen

/**
 * In-app UI strings, copied from the revision-6 screenshots (public/screens). Kept as shown, except:
 * no full stops (sentences that ran together are separate lines), no "Evening peak" on the fare
 * summary, and no Personal wallet row on the payment sheet.
 */
export const app = {
  home: {
    location: "Lagos, Nigeria",
    whereTo: "Where to?",
    now: "Now",
    recents: [
      { title: "Lekki Phase I, Lagos, Nigeria", sub: "Magboro, Nigeria", code: "MGB556", time: "06:00 AM" },
      { title: "Lekki Phase 1 Bus stop", sub: "Magboro Bus Stop", code: "MOW689", time: "06:30 AM" },
    ],
    profile: { title: "Complete your profile", sub: "of 7 steps completed", done: "1" },
    servicesTitle: "Services",
    services: {
      daily: { title: "Daily", sub: "Bus stop to bus stop" },
      pod: { title: "Pod", sub: "Door to door", badge: "New" },
      rent: { title: "Rent", sub: "Hire any vehicle" },
    },
    bannerTitle: "Shuttlers Pod:",
    bannerSub: "Now in Beta",
    tabs: ["Home", "Services", "Activity", "My Account"],
    frequent: "My frequent routes (10)",
    viewAll: "View all",
  },
  plan: {
    title: "Plan your ride",
    leaving: "Leaving now",
    change: "Change",
    destPlaceholder: "Route code or drop-off bus stop",
    search: "Search",
    recents: [
      { title: "Lekki Phase 1", sub: "Lekki, Nigeria", tag: "Address" },
      { title: "Agungi bus stop", sub: "Lekki - Epe Expressway, Lekki, Nigeria", tag: "Address" },
      { title: "Filmhouse Cinemas IMAX Lekki Lagos", sub: "The Rock Drive, Lagos, Nigeria", tag: "Address" },
      { title: "Jasper Ike Street", sub: "Lagos, Nigeria", tag: "Address" },
      { title: "MGB556", sub: "", tag: "Route" },
      { title: "ABL215", sub: "", tag: "Route" },
      { title: "Lekki Phase 1", sub: "Lekki, Nigeria", tag: "Bus stop" },
      { title: "IGD711", sub: "", tag: "Route" },
    ],
  },
  search: {
    chips: [
      { label: "Top results", count: "23" },
      { label: "Locations", count: "1.15K" },
      { label: "Bus stops", count: "3" },
      { label: "Routes", count: "" },
    ],
    locations: { title: "Locations", count: "1,147" },
    busStops: { title: "Bus stops", count: "3" },
    routes: { title: "Routes", count: "293" },
    viewAll: "View all",
    rows: {
      locations: [
        { title: "Sanusi Fafunwa Street", sub: "Lagos, Nigeria" },
        { title: "Sanusi Fafunwa Street", sub: "Lagos, Nigeria" },
      ],
      busStops: [
        { title: "Eko Atlantic City", sub: "Sanusi Fafunwa Street, Eti-Osa, Lagos, Nigeria" },
        { title: "Eko Atlantic", sub: "Sanusi Fafunwa Street, Lagos, Nigeria" },
      ],
      route: { code: "JAK98", sub: ["Lekki Phase 1", "Jakande Gate Bus Stop"], time: "05:15 PM" },
    },
  },
  map: {
    leaving: "Leaving now",
    change: "Change",
    labels: ["LEKKI PHASE 1", "VICTORIA ISLAND", "LEKKI", "IKOYI", "ELEGANZA"],
    road: "Lekki - Epe Expy",
  },
  options: {
    daily: { title: "Daily", sub: "No bus route on this pair yet", action: "Change Date/Time" },
    podSolo: { title: "Pod Solo", sub: "Get a car in minutes", unit: "per trip" },
    podShared: { title: "Pod Shared", sub: "No pod runs this pair yet" },
    rent: { title: "Rent", sub: "Any vehicle, your schedule" },
    cta: "Continue with Pod Solo",
  },
  fare: {
    title: "Pod Solo",
    pickup: "Pickup",
    dropoff: "Dropoff",
    rideFare: "Ride fare",
    held: "Held for a longer ride",
    mostYouPay: "Most you will pay",
    notes: ["What the ride does not use goes back to Shuttlers Pay", "Includes ₦30 Govt", "Price holds for 1:53"],
    collect: ["We collect ₦6,250.93 in Shuttlers Pay", "The search starts when it lands"],
    consent: ["Let Shuttlers take any balance a ride leaves unpaid from my", "Shuttlers wallet — up to ₦15,000 a time and ₦30,000 a", "month, until Sat, Nov 6 2027", "You can stop this any time"],
    pay: "Pay",
    cancel: "Cancel",
  },
  pay: {
    title: "Select Payment Method",
    finishIn: "Finish paying in Shuttlers Pay",
    countdownFrom: 294, // seconds (4:54 in the screenshot)
    methods: ["Card", "Bank Transfer", "USSD", "Company wallet · Shuttlers"],
    cta: "Continue to payment",
  },
  completing: {
    title: "Pay to book your ride",
    sub: "We start looking for a Pilot once Shuttlers Pay confirms your payment",
    toPay: "To pay",
    spinTitle: "Completing your payment",
    spinSub: ["Hold on while we confirm this", "Don't close the app"],
  },
  success: { title: "Payment successful", sub: "Your payment went through", cta: "Done" },
  booked: {
    title: "Your Pod is booked",
    body: ["We're finding your Pilot now", "You'll see who is coming, and their car, the moment one accepts"],
    cta: "Okay, got it",
  },
  finding: { title: "Finding your Pod", quoted: "Quoted", govt: "Includes ₦30 Govt", cancel: "Cancel" },
};

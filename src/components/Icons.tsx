import React from "react";

// Generic line icons drawn for this film (24×24 grid, round caps). No third-party marks.
type P = { size?: number; color?: string; stroke?: number; style?: React.CSSProperties; fill?: string };

const Svg: React.FC<P & { children: React.ReactNode }> = ({ size = 24, color = "currentColor", stroke = 2, style, children, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0, ...style }}>
    {children}
  </svg>
);

export const I = {
  pin: (p: P) => (
    <Svg {...p}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </Svg>
  ),
  chevronDown: (p: P) => (
    <Svg {...p}>
      <path d="M6 9l6 6 6-6" />
    </Svg>
  ),
  chevronRight: (p: P) => (
    <Svg {...p}>
      <path d="M9 6l6 6-6 6" />
    </Svg>
  ),
  chevronLeft: (p: P) => (
    <Svg {...p}>
      <path d="M15 6l-6 6 6 6" />
    </Svg>
  ),
  arrowLeft: (p: P) => (
    <Svg {...p}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Svg>
  ),
  arrowRight: (p: P) => (
    <Svg {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  ),
  bell: (p: P) => (
    <Svg {...p}>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </Svg>
  ),
  qr: (p: P) => (
    <Svg {...p}>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" />
    </Svg>
  ),
  search: (p: P) => (
    <Svg {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </Svg>
  ),
  clock: (p: P) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  ),
  history: (p: P) => (
    <Svg {...p}>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4 4.5v3.2h3.2" />
      <path d="M12 8v4l2.6 1.6" />
    </Svg>
  ),
  locate: (p: P) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
    </Svg>
  ),
  swap: (p: P) => (
    <Svg {...p}>
      <path d="M8 4v15M5 16l3 3 3-3" />
      <path d="M16 20V5M13 8l3-3 3 3" />
    </Svg>
  ),
  xCircle: (p: P) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" fill={p.color ?? "currentColor"} stroke="none" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="#fff" />
    </Svg>
  ),
  close: (p: P) => (
    <Svg {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  ),
  mapPin: (p: P) => (
    <Svg {...p}>
      <path d="M12 21s-6-5.3-6-10.2a6 6 0 0 1 12 0C18 15.7 12 21 12 21z" />
      <circle cx="12" cy="10.6" r="2.1" />
    </Svg>
  ),
  bus: (p: P) => (
    <Svg {...p}>
      <rect x="5" y="3.5" width="14" height="15" rx="3" />
      <path d="M5 11h14M8.5 18.5V21M15.5 18.5V21" />
      <circle cx="8.5" cy="15" r="0.9" fill="currentColor" />
      <circle cx="15.5" cy="15" r="0.9" fill="currentColor" />
    </Svg>
  ),
  info: (p: P) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.8" r="0.6" fill="currentColor" />
    </Svg>
  ),
  card: (p: P) => (
    <Svg {...p}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
    </Svg>
  ),
  bank: (p: P) => (
    <Svg {...p}>
      <path d="M3.5 9.5L12 4.5l8.5 5" />
      <path d="M5.5 10v7M9.8 10v7M14.2 10v7M18.5 10v7M3.5 19.5h17" />
    </Svg>
  ),
  ussd: (p: P) => (
    <Svg {...p} stroke={0}>
      {[0, 1, 2, 3].flatMap((r) =>
        [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={7 + c * 5} cy={4.5 + r * 5} r={1.4} fill={p.color ?? "currentColor"} />),
      )}
    </Svg>
  ),
  building: (p: P) => (
    <Svg {...p}>
      <rect x="4.5" y="3.5" width="11" height="17" rx="1" />
      <path d="M15.5 9.5h4v11h-4M8 7.5h1M11 7.5h1M8 11h1M11 11h1M8 14.5h1M11 14.5h1M9 20.5v-2.5h2v2.5" />
    </Svg>
  ),
  shield: (p: P) => (
    <Svg {...p}>
      <path d="M12 3l7.5 3v5.6c0 4.6-3.1 8-7.5 9.4-4.4-1.4-7.5-4.8-7.5-9.4V6z" />
      <path d="M8.8 12.2l2.2 2.2 4.4-4.6" />
    </Svg>
  ),
  bolt: (p: P) => (
    <Svg {...p}>
      <path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z" />
    </Svg>
  ),
  door: (p: P) => (
    <Svg {...p}>
      <path d="M6 20.5V4.5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16M3.5 20.5h17" />
      <circle cx="14.5" cy="12.5" r="1" fill="currentColor" />
    </Svg>
  ),
  moon: (p: P) => (
    <Svg {...p}>
      <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />
    </Svg>
  ),
  cloud: (p: P) => (
    <Svg {...p}>
      <path d="M7 18.5h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.2A3.5 3.5 0 0 0 7 18.5z" />
    </Svg>
  ),
  lock: (p: P) => (
    <Svg {...p}>
      <rect x="5" y="10.5" width="14" height="10" rx="2.2" />
      <path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7" />
    </Svg>
  ),
  check: (p: P) => (
    <Svg {...p}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  ),
  flat: (p: P) => (
    <Svg {...p}>
      <path d="M3 12h18" />
      <path d="M3 18l4-6 3 2 4-7 3 4 4-3" strokeOpacity={0.35} />
    </Svg>
  ),
  home: (p: P) => (
    <Svg {...p}>
      <path d="M4 10.5L12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" />
      <path d="M9.5 20.5v-5h5v5" />
    </Svg>
  ),
  services: (p: P) => (
    <Svg {...p}>
      <rect x="4" y="7" width="16" height="13" rx="2" />
      <path d="M4 12h16M9 7V4.5h6V7" />
    </Svg>
  ),
  bookings: (p: P) => (
    <Svg {...p}>
      <path d="M4.5 8.5l12-4 1.3 3.6" />
      <rect x="3.5" y="8.5" width="17" height="11" rx="2" />
      <path d="M13 12.5h4M13 15.5h3" />
    </Svg>
  ),
  account: (p: P) => (
    <Svg {...p}>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </Svg>
  ),
  shift: (p: P) => (
    <Svg {...p}>
      <path d="M12 4l7.5 8H15v7.5H9V12H4.5z" />
    </Svg>
  ),
  backspace: (p: P) => (
    <Svg {...p}>
      <path d="M8.5 5.5H20a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8.5L3 12z" />
      <path d="M11.5 9.5l5 5M16.5 9.5l-5 5" />
    </Svg>
  ),
  gauge: (p: P) => (
    <Svg {...p}>
      <path d="M4 16a8 8 0 1 1 16 0" />
      <path d="M12 16l4-5" />
    </Svg>
  ),
};

/** Simple vector top-down car glyph for the map capsule (white body, dark windscreen). */
export const TopDownCar: React.FC<{ w?: number }> = ({ w = 34 }) => (
  <svg width={w} height={w * 0.5} viewBox="0 0 40 20" style={{ display: "block" }}>
    <rect x="1" y="2" width="38" height="16" rx="7" fill="#fff" />
    <rect x="22" y="4.2" width="7.5" height="11.6" rx="2.6" fill="#101111" />
    <rect x="7" y="5" width="5" height="10" rx="2" fill="#101111" opacity={0.75} />
  </svg>
);

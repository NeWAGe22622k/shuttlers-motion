import React from "react";
import { C, fontFamily } from "../config/brand";
import { I } from "./Icons";

// Simplified, generic keyboard (designed: no platform marks). App points, 393 wide, 300 tall.
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
export const KB_H = 300;

const keyPos = (ch: string) => {
  for (let r = 0; r < 3; r++) {
    const i = ROWS[r].indexOf(ch);
    if (i >= 0) {
      const n = ROWS[r].length;
      const kw = 33;
      const gap = 6;
      const total = n * kw + (n - 1) * gap;
      const x0 = (393 - total) / 2;
      return { x: x0 + i * (kw + gap), y: 12 + r * 56, w: kw, h: 44 };
    }
  }
  return null;
};

export const Keyboard: React.FC<{ pressed?: { ch: string; p: number } | null }> = ({ pressed }) => {
  const pk = pressed && pressed.p > 0 && pressed.p < 1 ? keyPos(pressed.ch) : null;
  const keyStyle: React.CSSProperties = {
    position: "absolute",
    width: 33,
    height: 44,
    borderRadius: 7,
    background: "#FCFCFD",
    boxShadow: "0 1px 0 rgba(16,17,17,.22)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily,
    fontSize: 21,
    fontWeight: 400,
    color: C.ink,
  };
  const grey: React.CSSProperties = { ...keyStyle, background: "#B9BCC3" };
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 393, height: KB_H, background: "#D9DBDF", borderTopLeftRadius: 26, borderTopRightRadius: 26 }}>
      {ROWS.map((row) =>
        row.split("").map((ch) => {
          const p = keyPos(ch)!;
          const isP = pk && pressed!.ch === ch;
          return (
            <div key={ch} style={{ ...keyStyle, left: p.x, top: p.y, background: isP ? "#E9EAEC" : keyStyle.background }}>
              {ch}
            </div>
          );
        }),
      )}
      <div style={{ ...grey, left: 8, top: 124, width: 44 }}>
        <I.shift size={20} color={C.ink} stroke={1.6} />
      </div>
      <div style={{ ...grey, left: 341, top: 124, width: 44 }}>
        <I.backspace size={20} color={C.ink} stroke={1.6} />
      </div>
      <div style={{ ...grey, left: 8, top: 180, width: 88, fontSize: 16 }}>123</div>
      <div style={{ ...keyStyle, left: 102, top: 180, width: 188 }} />
      <div style={{ ...keyStyle, left: 296, top: 180, width: 89, background: C.ink }}>
        <I.search size={20} color="#fff" stroke={2} />
      </div>
      {pk ? (
        // pop-up preview of the pressed key
        <div
          style={{
            position: "absolute",
            left: pk.x - 9,
            top: pk.y - 58,
            width: pk.w + 18,
            height: 58 + pk.h,
            borderRadius: 10,
            background: "#FCFCFD",
            boxShadow: "0 2px 8px rgba(16,17,17,.25)",
            fontFamily,
            fontSize: 34,
            color: C.ink,
            display: "flex",
            justifyContent: "center",
            paddingTop: 6,
            boxSizing: "border-box",
            opacity: Math.sin(pressed!.p * Math.PI) > 0.2 ? 1 : Math.sin(pressed!.p * Math.PI) * 5,
            transform: `scale(${0.9 + 0.1 * Math.sin(pressed!.p * Math.PI)})`,
            transformOrigin: "50% 100%",
          }}
        >
          {pressed!.ch}
        </div>
      ) : null}
    </div>
  );
};

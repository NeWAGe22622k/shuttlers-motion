import React from "react";
import { evolvePath } from "@remotion/paths";
import { C, fontFamily } from "../config/brand";
import { content } from "../config/content";
import { I } from "../components/Icons";
import { Confetti, PartyPopper } from "../components/Party";
import { Button, Sheet } from "../components/ui";

const S7 = content.s7;

/** 09 Payment successful. The check circle is the Pod capsule turned successTeal. */
export const SuccessScreen: React.FC<{ sheetTop?: number; circle: number; check: number; titleStyle?: React.CSSProperties; subStyle?: React.CSSProperties }> = ({ sheetTop = 495, circle, check, titleStyle, subStyle }) => {
  const CHECK = "M12 21 L18 27 L29 15";
  const ev = evolvePath(Math.max(0.0001, check), CHECK);
  return (
    <div style={{ position: "absolute", inset: 0, background: C.white, fontFamily }}>
      <PartyPopper p={0} pieces={0} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(16,17,17,.38)" }} />
      <div style={{ position: "absolute", right: 20, top: 82 }}>
        <I.close size={22} color={C.ink} stroke={2} />
      </div>
      <Sheet top={sheetTop} shadow>
        <div style={{ position: "absolute", right: 22, top: 24 }}>
          <I.close size={22} color={C.ink} stroke={2} />
        </div>
        <svg width={42} height={42} viewBox="0 0 42 42" style={{ position: "absolute", left: 175.5, top: 103 }}>
          <circle cx="21" cy="21" r={19 * circle} fill={C.successTeal} />
          {check > 0 ? <path d={CHECK} fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} /> : null}
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, top: 165, textAlign: "center", fontSize: 17, fontWeight: 700, color: C.ink, ...titleStyle }}>{S7.successTitle}</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 194, textAlign: "center", fontSize: 13, fontWeight: 600, color: C.muted, ...subStyle }}>{S7.successSub}</div>
        <div style={{ position: "absolute", left: 32, top: 247 }}>
          <Button label={S7.done} w={329} h={55} />
        </div>
      </Sheet>
    </div>
  );
};

/** 10 Your Pod is booked. */
export const BookedScreen: React.FC<{ ribbons: number; pieces: number; confettiT: number; life: number; shake?: number; titleStyle?: React.CSSProperties; subStyle?: React.CSSProperties }> = ({ ribbons, pieces, confettiT, life, shake = 0, titleStyle, subStyle }) => (
  <div style={{ position: "absolute", inset: 0, background: C.white, fontFamily, overflow: "hidden" }}>
    <PartyPopper p={ribbons} pieces={pieces} shake={shake} />
    <Confetti t={confettiT} life={life} origin={[92, 300]} />
    <div style={{ position: "absolute", right: 20, top: 80 }}>
      <I.close size={22} color={C.ink} stroke={2} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 552, textAlign: "center", fontSize: 23, fontWeight: 700, color: C.ink, letterSpacing: -0.3, ...titleStyle }}>{S7.bookedTitle}</div>
    <div style={{ position: "absolute", left: 40, right: 40, top: 594, textAlign: "center", fontSize: 13.5, fontWeight: 600, color: C.muted, lineHeight: 1.5, ...subStyle }}>{S7.bookedSub}</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 737, height: 1, background: "#EFF0EF" }} />
    <div style={{ position: "absolute", left: 16, top: 748 }}>
      <Button label={S7.okay} w={361} h={50} />
    </div>
  </div>
);

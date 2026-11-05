import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { PodIcon } from "./PodIcon";
import { BLACK, GREEN } from "./theme";

/** Build aid: the app's Pod PNG vs the vectorised PodIcon, on both brand backgrounds. */
export const PodPreview: React.FC = () => (
  <AbsoluteFill style={{ background: "#222", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" }}>
    <div style={{ background: BLACK, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Img src={staticFile("vehicles/app-pod-car-large.png")} style={{ width: 860 }} />
    </div>
    <div style={{ background: BLACK, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <PodIcon id="a" width={860} />
    </div>
    <div style={{ background: GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <PodIcon id="b" width={760} lights={1} />
    </div>
    <div style={{ background: BLACK, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}><PodIcon id="c" width={640} lights={1} door={0.35} seatGlow={0.5} /><PodIcon id="d" width={640} lights={1} door={1} seatGlow={1} /></div>
    </div>
  </AbsoluteFill>
);

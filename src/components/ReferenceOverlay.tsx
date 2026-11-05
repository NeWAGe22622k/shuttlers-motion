import React from "react";
import { Img, staticFile } from "remotion";

/** Build-time aid: lay the 3× reference screenshot over a 393×852 screen. Switch off for the film. */
export const ReferenceOverlay: React.FC<{ src: string; opacity?: number; on?: boolean }> = ({ src, opacity = 0.5, on = true }) =>
  on ? <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 0, width: 393, height: 852, opacity, pointerEvents: "none", zIndex: 999 }} /> : null;

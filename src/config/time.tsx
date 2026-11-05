import React, { createContext, useContext } from "react";
import { useCurrentFrame } from "remotion";
import timingJson from "./timing.json";

export const T = timingJson;
export type Flags = {
  cutdown?: boolean;
  pushOutAt?: number; // S2 in cutdown: push the scene out from this hero frame
  phoneEntry?: "pullback" | "push";
  frozen?: boolean;
};

type Ctx = { map: (f: number) => number; flags: Flags };
const TimeCtx = createContext<Ctx>({ map: (f) => f, flags: {} });

/**
 * Every scene reads the *hero-absolute* frame through useT(). The hero composition
 * maps Sequence-local frames back to absolute; the cutdown remaps them linearly
 * (see timing.json cutdown.segments) so the same scene code serves both films.
 */
export const TimeProvider: React.FC<{
  map: (f: number) => number;
  flags?: Flags;
  children: React.ReactNode;
}> = ({ map, flags, children }) => {
  const parent = useContext(TimeCtx);
  return (
    <TimeCtx.Provider value={{ map, flags: { ...parent.flags, ...(flags ?? {}) } }}>
      {children}
    </TimeCtx.Provider>
  );
};

export const useT = () => {
  const f = useCurrentFrame();
  return useContext(TimeCtx).map(f);
};

export const useFlags = () => useContext(TimeCtx).flags;

/** Linear remap helper for cutdown segments. */
export const linearMap = (c0: number, c1: number, h0: number, h1: number) => (local: number) =>
  h0 + (local * (h1 - h0)) / (c1 - c0);

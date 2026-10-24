import { hapticTrigger } from "ios-haptics";
import { useEffect } from "react";
import { useCow, type CowConfig } from "./store";

// iOS Safari has no Vibration API. Since iOS 26.5 the switch-toggle trick only fires on a
// real tap, so ios-haptics overlays a hidden switch on the element. Pass it as a ref.
// No-op off iOS.
export const tapHaptic = hapticTrigger;

// Android and other browsers with the Vibration API. No-op on iOS and desktop.
export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
}

export const TICK = 8;
export const NUDGE = [14, 40, 8];
export const SUCCESS = [10, 60, 10];
const MOO = [20, 40, 90];

const DISCRETE = ["breed", "horns", "extra"] as const satisfies (keyof CowConfig)[];
// Slider detents: one tick each time a value crosses a step.
const STEPS = { chubby: 3, legs: 3, spots: 5 } as const satisfies Partial<Record<keyof CowConfig, number>>;
const step = (v: number, n: number) => Math.min(n - 1, Math.floor(v * n));

// Store-driven so sliders, shuffle and the 3D cow (none of which can host the iOS overlay)
// still buzz where the Vibration API exists.
export function useStoreHaptics() {
  useEffect(
    () =>
      useCow.subscribe((s, prev) => {
        if (s.moos !== prev.moos) vibrate(MOO);
        else if (s.preset && s.preset !== prev.preset) vibrate(TICK);
        else if (s.seed !== prev.seed) vibrate(NUDGE);
        else if (s.mode !== prev.mode || DISCRETE.some((k) => s[k] !== prev[k])) vibrate(TICK);
        else if (
          (Object.keys(STEPS) as (keyof typeof STEPS)[]).some(
            (k) => step(s[k], STEPS[k]) !== step(prev[k], STEPS[k]),
          )
        )
          vibrate(TICK);
      }),
    [],
  );
}

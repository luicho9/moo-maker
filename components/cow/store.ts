import { create } from "zustand";
import {
  breedPatch,
  COW_GROUPS,
  DEFAULTS,
  PARAM_KEYS,
  param,
  randomSeed,
  shuffle,
  SLOTS,
  STAGE_GROUPS,
  wear,
  type CowConfig,
  type Group,
  type Slot,
} from "./params";
import { PRESETS, type PresetId } from "./presets";

export type Mode = "famous" | "build" | "saved";

type CowStore = CowConfig & {
  mode: Mode;
  preset: PresetId | null;
  moos: number;
  // Sections the main shuffle button leaves alone.
  locked: Group[];
  past: CowConfig[];
  future: CowConfig[];
  set: (patch: Partial<CowConfig>) => void;
  load: (cow: CowConfig, opts?: { history?: boolean }) => void;
  applyPreset: (id: PresetId) => void;
  setMode: (mode: Mode) => void;
  reroll: () => void;
  randomize: (group?: Group) => void;
  toggleLock: (group: Group) => void;
  undo: () => void;
  redo: () => void;
  moo: () => void;
};

export const configOf = (s: CowConfig) =>
  Object.fromEntries(PARAM_KEYS.map((k) => [k, s[k]])) as CowConfig;

const stageOf = (s: CowConfig) =>
  Object.fromEntries(
    PARAM_KEYS.filter((k) => STAGE_GROUPS.includes(param(k).group)).map((k) => [k, s[k]]),
  ) as Partial<CowConfig>;

const HISTORY = 100;
// Slider and color drags fire every frame; edits this close together are one undo step.
const COALESCE_MS = 600;
let lastEdit = 0;

function record(s: CowStore, coalesce = false) {
  const now = Date.now();
  const fresh = !coalesce || now - lastEdit > COALESCE_MS;
  lastEdit = coalesce ? now : 0;
  return fresh ? { past: [...s.past.slice(1 - HISTORY), configOf(s)], future: [] } : { future: [] };
}

// Changing breed or an accessory brings its colors along, unless the patch sets them.
function expand(s: CowConfig, patch: Partial<CowConfig>): Partial<CowConfig> {
  let out = patch;
  if (patch.breed && patch.breed !== s.breed) out = { ...breedPatch(patch.breed), ...out };
  for (const slot of Object.keys(SLOTS) as Slot[]) {
    const id = patch[slot];
    if (id && id !== s[slot] && !(SLOTS[slot] in patch)) out = { ...wear(slot, id), ...out };
  }
  return out;
}

export const useCow = create<CowStore>((set) => ({
  ...DEFAULTS,
  mode: "build",
  preset: null,
  moos: 0,
  locked: [],
  past: [],
  future: [],
  set: (raw) =>
    set((s) => {
      const patch = expand(s, raw);
      const keys = Object.keys(patch) as (keyof CowConfig)[];
      if (!keys.some((k) => s[k] !== patch[k])) return {};
      const coalesce = keys.every((k) => param(k).kind === "number" || param(k).kind === "color");
      return { ...record(s, coalesce), ...patch, preset: null };
    }),
  load: (cow, { history = true } = {}) =>
    set((s) => ({ ...(history ? record(s) : {}), ...cow, preset: null })),
  applyPreset: (id) =>
    set((s) => {
      const { cow } = PRESETS[id];
      return {
        ...record(s),
        ...DEFAULTS,
        ...breedPatch(cow.breed),
        ...cow,
        ...stageOf(s),
        preset: id,
        mode: "famous",
      };
    }),
  setMode: (mode) => set({ mode }),
  reroll: () => set((s) => ({ ...record(s), seed: randomSeed(), preset: null })),
  randomize: (group) =>
    set((s) => ({
      ...record(s),
      ...shuffle(group ? [group] : COW_GROUPS.filter((g) => !s.locked.includes(g))),
      preset: null,
      ...(group ? {} : { mode: "build" as const }),
    })),
  toggleLock: (group) =>
    set((s) => ({
      locked: s.locked.includes(group) ? s.locked.filter((g) => g !== group) : [...s.locked, group],
    })),
  undo: () =>
    set((s) => {
      const prev = s.past.at(-1);
      if (!prev) return {};
      lastEdit = 0;
      return { ...prev, past: s.past.slice(0, -1), future: [configOf(s), ...s.future], preset: null };
    }),
  redo: () =>
    set((s) => {
      const [next, ...future] = s.future;
      if (!next) return {};
      lastEdit = 0;
      return { ...next, past: [...s.past, configOf(s)], future, preset: null };
    }),
  moo: () => set((s) => ({ moos: s.moos + 1 })),
}));

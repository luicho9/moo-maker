import { create } from "zustand";

export const CREAM = "#FAF6EE";

export type BreedId = "holstein" | "jersey" | "highland" | "pastel";
export type Horns = "none" | "nubs" | "long";
export type Extra = "none" | "bell" | "crown" | "hat";

export type Breed = {
  name: string;
  base: string;
  spot: string;
  snout: string;
  hoof: string;
  spots: boolean;
  tuft: boolean;
};

export const BREEDS: Record<BreedId, Breed> = {
  holstein: {
    name: "Holstein",
    base: "#F6F1E7",
    spot: "#2E2723",
    snout: "#F2B3AB",
    hoof: "#3A302A",
    spots: true,
    tuft: false,
  },
  jersey: {
    name: "Jersey",
    base: "#C98C58",
    spot: "#8E5733",
    snout: "#3E302A",
    hoof: "#2E2420",
    spots: true,
    tuft: false,
  },
  highland: {
    name: "Highland",
    base: "#C6713A",
    spot: "#C6713A",
    snout: "#D59E86",
    hoof: "#3A2A22",
    spots: false,
    tuft: true,
  },
  pastel: {
    name: "Pastel",
    base: "#FFE4EC",
    spot: "#B9A6EA",
    snout: "#FFB0C4",
    hoof: "#8E7BC9",
    spots: true,
    tuft: false,
  },
};

export type CowConfig = {
  breed: BreedId;
  spots: number;
  seed: number;
  chubby: number;
  legs: number;
  horns: Horns;
  extra: Extra;
};

type CowStore = CowConfig & {
  /** Increments on every moo so the scene can react. */
  moos: number;
  set: (patch: Partial<CowConfig>) => void;
  reroll: () => void;
  randomize: () => void;
  moo: () => void;
};

const randomSeed = () => Math.floor(Math.random() * 1000);

const pick = <T,>(items: readonly T[]) =>
  items[Math.floor(Math.random() * items.length)];

export const useCow = create<CowStore>((set) => ({
  breed: "holstein",
  spots: 0.5,
  seed: 7,
  chubby: 0.45,
  legs: 0.35,
  horns: "nubs",
  extra: "bell",
  moos: 0,
  set: (patch) => set(patch),
  reroll: () => set({ seed: randomSeed() }),
  randomize: () =>
    set({
      breed: pick(Object.keys(BREEDS) as BreedId[]),
      spots: 0.25 + Math.random() * 0.6,
      seed: randomSeed(),
      chubby: Math.random(),
      legs: Math.random(),
      horns: pick(["none", "nubs", "long"] as const),
      extra: pick(["none", "bell", "crown", "hat"] as const),
    }),
  moo: () => set((s) => ({ moos: s.moos + 1 })),
}));

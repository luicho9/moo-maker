import { BREEDS, type BreedId, type CowConfig, type Extra, type Horns } from "./store";

const HORNS: Horns[] = ["none", "nubs", "long"];
const EXTRAS: Extra[] = ["none", "bell", "crown", "hat"];

const pct = (n: number) => Math.round(n * 100);

export function encodeCow(c: CowConfig) {
  return [c.breed, pct(c.spots), c.seed, pct(c.chubby), pct(c.legs), c.horns, c.extra].join(".");
}

export function decodeCow(hash: string): CowConfig | null {
  const [breed, spots, seed, chubby, legs, horns, extra] = hash.replace(/^#/, "").split(".");
  const nums = [spots, seed, chubby, legs].map(Number);
  if (
    !(breed in BREEDS) ||
    !HORNS.includes(horns as Horns) ||
    !EXTRAS.includes(extra as Extra) ||
    nums.some((n) => !Number.isFinite(n))
  ) {
    return null;
  }
  const unit = (n: number) => Math.min(1, Math.max(0, n / 100));
  return {
    breed: breed as BreedId,
    spots: unit(nums[0]),
    seed: nums[1],
    chubby: unit(nums[2]),
    legs: unit(nums[3]),
    horns: horns as Horns,
    extra: extra as Extra,
  };
}

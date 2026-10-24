// Every customizable value lives in PARAMS. The store defaults, shuffle, share
// links, haptics and the bounce trigger are all derived from it, so a new option
// is one entry here plus whatever draws it.

export const CREAM = "#FAF6EE";

export type Group = "coat" | "body" | "horns" | "face" | "accessories" | "scene" | "sound";
export const COW_GROUPS: Group[] = ["coat", "body", "horns", "face", "accessories"];
// Scene and sound describe the stage, not the cow: famous cows and the main
// shuffle button leave them alone.
export const STAGE_GROUPS: Group[] = ["scene", "sound"];

type Base = { code: string; label: string; group: Group };
// Numbers are always 0–1; whatever draws them maps that onto a real range.
export type NumberParam = Base & { kind: "number"; default: number; detents?: number; random?: () => number };
export type SeedParam = Base & { kind: "seed"; default: number };
export type ColorParam = Base & { kind: "color"; default: string; palette?: readonly string[] };
export type Option = { id: string; label: string; color?: string };
export type ChoiceParam = Base & { kind: "choice"; default: string; options: readonly Option[] };
export type Param = NumberParam | SeedParam | ColorParam | ChoiceParam;

const between = (lo: number, hi: number) => () => lo + Math.random() * (hi - lo);
const sometimes = (chance: number, lo: number, hi: number) => () =>
  Math.random() < chance ? lo + Math.random() * (hi - lo) : 0;

const num = (
  code: string,
  label: string,
  group: Group,
  value: number,
  more: { detents?: number; random?: () => number } = {},
) => ({ kind: "number" as const, code, label, group, default: value, ...more });

const color = (code: string, label: string, group: Group, value: string, palette?: readonly string[]) => ({
  kind: "color" as const,
  code,
  label,
  group,
  default: value,
  palette,
});

function choice<const O extends readonly Option[]>(
  code: string,
  label: string,
  group: Group,
  options: O,
  value: O[number]["id"],
) {
  return { kind: "choice" as const, code, label, group, options, default: value };
}

export type Pattern = "none" | "patches" | "dots" | "belt" | "face";

export type Breed = {
  name: string;
  pattern: Pattern;
  tuft: number;
  colors: { base: string; spot: string; snout: string; hoof: string; tuftColor: string };
};

export const BREEDS = {
  holstein: {
    name: "Holstein",
    pattern: "patches",
    tuft: 0,
    colors: { base: "#F6F1E7", spot: "#2E2723", snout: "#F2B3AB", hoof: "#3A302A", tuftColor: "#2E2723" },
  },
  jersey: {
    name: "Jersey",
    pattern: "patches",
    tuft: 0,
    colors: { base: "#C98C58", spot: "#8E5733", snout: "#3E302A", hoof: "#2E2420", tuftColor: "#8E5733" },
  },
  guernsey: {
    name: "Guernsey",
    pattern: "patches",
    tuft: 0,
    colors: { base: "#D99B5E", spot: "#F6F1E7", snout: "#F2C9A6", hoof: "#6B4A33", tuftColor: "#B97A42" },
  },
  fleckvieh: {
    name: "Fleckvieh",
    pattern: "patches",
    tuft: 0,
    colors: { base: "#F6F1E7", spot: "#B5582E", snout: "#F2B9A8", hoof: "#4A3A30", tuftColor: "#B5582E" },
  },
  gloucester: {
    name: "Gloucester",
    pattern: "none",
    tuft: 0,
    colors: { base: "#4E2B1F", spot: "#4E2B1F", snout: "#2E2420", hoof: "#241B17", tuftColor: "#3A2018" },
  },
  highland: {
    name: "Highland",
    pattern: "none",
    tuft: 0.65,
    colors: { base: "#C6713A", spot: "#C6713A", snout: "#D59E86", hoof: "#3A2A22", tuftColor: "#B5622F" },
  },
  belted: {
    name: "Belted Galloway",
    pattern: "belt",
    tuft: 0.3,
    colors: { base: "#26211F", spot: "#F6F1E7", snout: "#3A302C", hoof: "#1E1917", tuftColor: "#26211F" },
  },
  hereford: {
    name: "Hereford",
    pattern: "face",
    tuft: 0,
    colors: { base: "#8E3B22", spot: "#F6F1E7", snout: "#F2C3B5", hoof: "#3A2A22", tuftColor: "#F6F1E7" },
  },
  pastel: {
    name: "Pastel",
    pattern: "patches",
    tuft: 0,
    colors: { base: "#FFE4EC", spot: "#B9A6EA", snout: "#FFB0C4", hoof: "#8E7BC9", tuftColor: "#B9A6EA" },
  },
} satisfies Record<string, Breed>;

export type BreedId = keyof typeof BREEDS;
const BREED_IDS = Object.keys(BREEDS) as BreedId[];

const HORN_PALETTE = ["#F3E6CC", "#E8DCC0", "#FFFFFF", "#5A4A3E", "#2A211D"] as const;
export const BACKGROUNDS = ["#FAF6EE", "#E4EEF6", "#E6F2DD", "#FBE3E8", "#EDE6F7", "#F7E7C6", "#2B2A33"] as const;

export const PARAMS = {
  // Coat
  breed: choice(
    "b",
    "Breed",
    "coat",
    BREED_IDS.map((id) => ({ id, label: BREEDS[id].name })),
    "holstein",
  ),
  pattern: choice(
    "p",
    "Pattern",
    "coat",
    [
      { id: "none", label: "Solid" },
      { id: "patches", label: "Patches" },
      { id: "dots", label: "Dots" },
      { id: "belt", label: "Belt" },
      { id: "face", label: "Face" },
    ] as { id: Pattern; label: string }[],
    "patches",
  ),
  spots: num("s", "Amount", "coat", 0.5, { detents: 5, random: between(0.25, 0.85) }),
  spotScale: num("ss", "Size", "coat", 0.3, { random: between(0.1, 0.6) }),
  spotEdge: num("se", "Sharpness", "coat", 0.85, { random: between(0.6, 1) }),
  seed: { kind: "seed" as const, code: "r", label: "Pattern seed", group: "coat" as const, default: 7 },
  base: color("cb", "Base", "coat", BREEDS.holstein.colors.base),
  spot: color("cs", "Spots", "coat", BREEDS.holstein.colors.spot),
  snout: color("cn", "Snout", "coat", BREEDS.holstein.colors.snout),
  hoof: color("ch", "Hooves", "coat", BREEDS.holstein.colors.hoof),
  tuftColor: color("ct", "Tuft", "coat", BREEDS.holstein.colors.tuftColor),

  // Body
  chubby: num("c", "Chubby", "body", 0.45, { detents: 3 }),
  legs: num("l", "Legs", "body", 0.35, { detents: 3 }),
  size: num("z", "Size", "body", 0.5, { detents: 3, random: between(0.2, 0.8) }),
  headSize: num("hs", "Head", "body", 0.5, { random: between(0.25, 0.75) }),
  earSize: num("es", "Ears", "body", 0.5, { random: between(0.2, 0.8) }),
  earAngle: num("ea", "Ear tilt", "body", 0.5, { random: between(0.2, 0.8) }),
  snoutSize: num("ns", "Snout", "body", 0.5, { random: between(0.25, 0.75) }),
  tail: num("t", "Tail", "body", 0.5, { random: between(0.2, 0.8) }),
  udder: num("u", "Udder", "body", 0.5, { random: between(0.2, 0.8) }),
  tuft: num("tf", "Tuft", "body", 0, { random: sometimes(0.25, 0.3, 0.9) }),

  // Horns
  horns: choice(
    "h",
    "Horns",
    "horns",
    [
      { id: "none", label: "None" },
      { id: "nubs", label: "Nubs" },
      { id: "long", label: "Long" },
    ],
    "nubs",
  ),
  hornLength: num("hl", "Length", "horns", 0.5, { random: between(0.2, 0.9) }),
  hornCurl: num("hc", "Curl", "horns", 0.5),
  hornColor: color("cr", "Color", "horns", HORN_PALETTE[0], HORN_PALETTE),

  // Face
  eyes: choice(
    "e",
    "Eyes",
    "face",
    [
      { id: "round", label: "Round" },
      { id: "sleepy", label: "Sleepy" },
      { id: "lashes", label: "Lashes" },
      { id: "wink", label: "Wink" },
    ],
    "round",
  ),
  blush: num("bl", "Blush", "face", 0, { random: sometimes(0.35, 0.4, 1) }),

  // Accessories: one slot each, so a cow can wear a hat, a bell and glasses at once.
  headwear: choice(
    "ah",
    "Head",
    "accessories",
    [
      { id: "none", label: "None" },
      { id: "crown", label: "Flowers", color: "#FF8FB1" },
      { id: "hat", label: "Straw hat", color: "#C8955B" },
      { id: "party", label: "Party hat", color: "#7FB7E8" },
    ],
    "none",
  ),
  headColor: color("ac", "Color", "accessories", "#C8955B"),
  neckwear: choice(
    "an",
    "Neck",
    "accessories",
    [
      { id: "none", label: "None" },
      { id: "bell", label: "Bell", color: "#D9534F" },
      { id: "bandana", label: "Bandana", color: "#3E7CC9" },
      { id: "bowtie", label: "Bow tie", color: "#D9534F" },
    ],
    "bell",
  ),
  neckColor: color("ab", "Color", "accessories", "#D9534F"),
  facewear: choice(
    "af",
    "Face",
    "accessories",
    [
      { id: "none", label: "None" },
      { id: "glasses", label: "Glasses", color: "#2A211D" },
      { id: "nosering", label: "Nose ring", color: "#E8B547" },
    ],
    "none",
  ),
  faceColor: color("ad", "Color", "accessories", "#2A211D"),

  // Scene
  background: color("bg", "Background", "scene", CREAM, BACKGROUNDS),
  ground: choice(
    "g",
    "Ground",
    "scene",
    [
      { id: "shadow", label: "Shadow" },
      { id: "pasture", label: "Pasture" },
      { id: "none", label: "None" },
    ],
    "shadow",
  ),
  lighting: choice(
    "li",
    "Lighting",
    "scene",
    [
      { id: "sunny", label: "Sunny" },
      { id: "golden", label: "Golden hour" },
      { id: "night", label: "Night" },
    ],
    "sunny",
  ),
  idle: choice(
    "i",
    "Mood",
    "scene",
    [
      { id: "calm", label: "Calm" },
      { id: "chew", label: "Chewing" },
      { id: "dance", label: "Dancing" },
    ],
    "calm",
  ),

  // Sound
  mooPitch: num("mp", "Pitch", "sound", 0.4, { detents: 3 }),
  mooLength: num("ml", "Length", "sound", 0.4, { detents: 3 }),
} satisfies Record<string, Param>;

type ValueOf<P> = P extends { kind: "choice"; options: readonly (infer O)[] }
  ? O extends { id: infer I }
    ? I
    : never
  : P extends { kind: "color" }
    ? string
    : number;

type Params = typeof PARAMS;
export type CowConfig = { -readonly [K in keyof Params]: ValueOf<Params[K]> };
export type ParamKey = keyof CowConfig;
type KeysOf<Kind> = { [K in ParamKey]: Params[K]["kind"] extends Kind ? K : never }[ParamKey];
export type NumberKey = KeysOf<"number">;
export type ColorKey = KeysOf<"color">;
export type ChoiceKey = KeysOf<"choice">;

export const PARAM_KEYS = Object.keys(PARAMS) as ParamKey[];
export const param = (k: ParamKey): Param => PARAMS[k];

export const DEFAULTS = Object.fromEntries(PARAM_KEYS.map((k) => [k, PARAMS[k].default])) as CowConfig;

export const lerp = (lo: number, hi: number, t: number) => lo + (hi - lo) * t;

// Picking a breed or an accessory also picks the colors that go with it.
export const breedPatch = (id: BreedId): Partial<CowConfig> => {
  const b: Breed = BREEDS[id];
  return { ...b.colors, pattern: b.pattern, tuft: b.tuft };
};

export const SLOTS = {
  headwear: "headColor",
  neckwear: "neckColor",
  facewear: "faceColor",
} as const satisfies Partial<Record<ChoiceKey, ColorKey>>;
export type Slot = keyof typeof SLOTS;

export function wear<S extends Slot>(slot: S, id: CowConfig[S]): Partial<CowConfig> {
  const option = (PARAMS[slot].options as readonly Option[]).find((o) => o.id === id);
  return option?.color ? { [slot]: id, [SLOTS[slot]]: option.color } : { [slot]: id };
}

// The colors a config would have if nobody had touched them: the breed's and each
// accessory's own. Share links only store what differs from this.
export const defaultsFor = (c: CowConfig): CowConfig => {
  const out = { ...DEFAULTS, ...breedPatch(c.breed) };
  for (const slot of Object.keys(SLOTS) as Slot[]) {
    const color = wear(slot, c[slot])[SLOTS[slot]];
    if (color) out[SLOTS[slot]] = color;
  }
  return out;
};

export const isCustomCoat = (c: CowConfig) => {
  const b: Breed = BREEDS[c.breed];
  return (
    b.pattern !== c.pattern ||
    (Object.keys(b.colors) as (keyof Breed["colors"])[]).some(
      (k) => b.colors[k].toLowerCase() !== c[k].toLowerCase(),
    )
  );
};

export const randomSeed = () => Math.floor(Math.random() * 1000);
const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

function hsl(h: number, s: number, l: number) {
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function randomCoat(): Partial<CowConfig> {
  const hue = Math.random() * 360;
  const light = Math.random() < 0.5;
  return {
    pattern: pick(["patches", "dots", "belt", "face"] as const),
    base: hsl(hue, 0.35 + Math.random() * 0.4, light ? 0.85 : 0.35),
    spot: hsl((hue + 120 + Math.random() * 120) % 360, 0.4 + Math.random() * 0.4, light ? 0.4 : 0.85),
    snout: hsl(hue, 0.6, 0.78),
    hoof: hsl(hue, 0.3, 0.22),
  };
}

export function shuffle(groups: Group[]): Partial<CowConfig> {
  const out: Record<string, unknown> = {};
  for (const k of PARAM_KEYS) {
    const p = param(k);
    if (!groups.includes(p.group)) continue;
    if (p.kind === "number") out[k] = p.random ? p.random() : Math.random();
    else if (p.kind === "seed") out[k] = randomSeed();
    else if (p.kind === "choice") out[k] = pick(p.options).id;
    else if (p.palette) out[k] = pick(p.palette);
  }
  const patch = out as Partial<CowConfig>;
  if (patch.breed) {
    Object.assign(patch, breedPatch(patch.breed));
    if (Math.random() < 0.3) Object.assign(patch, randomCoat());
  }
  for (const slot of Object.keys(SLOTS) as Slot[]) {
    const id = patch[slot];
    if (id) Object.assign(patch, wear(slot, id as CowConfig[Slot]));
  }
  return patch;
}

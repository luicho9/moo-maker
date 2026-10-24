import {
  BREEDS,
  DEFAULTS,
  defaultsFor,
  PARAM_KEYS,
  param,
  wear,
  type BreedId,
  type CowConfig,
  type Param,
  type ParamKey,
} from "./params";

// Links look like #2~b.jersey~c.80~cb.ffaa00: a version, then code.value pairs for
// whatever differs from the breed's and accessories' own defaults. Unknown codes and
// bad values are skipped, so old links keep working as options are added.
const VERSION = "2";

const BY_CODE = new Map(PARAM_KEYS.map((k) => [param(k).code, k]));

function encodeValue(p: Param, v: string | number) {
  if (p.kind === "number") return String(Math.round((v as number) * 100));
  if (p.kind === "color") return (v as string).slice(1).toLowerCase();
  return String(v);
}

function decodeValue(p: Param, raw: string): string | number | undefined {
  if (p.kind === "number") {
    const n = Number(raw);
    return raw !== "" && Number.isFinite(n) ? Math.min(1, Math.max(0, n / 100)) : undefined;
  }
  if (p.kind === "seed") {
    const n = Number(raw);
    return raw !== "" && Number.isInteger(n) ? n : undefined;
  }
  if (p.kind === "color") return /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : undefined;
  return p.options.some((o) => o.id === raw) ? raw : undefined;
}

export function encodeCow(c: CowConfig) {
  const base = defaultsFor(c);
  const parts = PARAM_KEYS.filter(
    (k) => k === "breed" || encodeValue(param(k), c[k]) !== encodeValue(param(k), base[k]),
  ).map((k) => `${param(k).code}.${encodeValue(param(k), c[k])}`);
  return [VERSION, ...parts].join("~");
}

export function decodeCow(hash: string): CowConfig | null {
  const raw = hash.replace(/^#/, "");
  if (!raw.startsWith(`${VERSION}~`)) return decodeLegacy(raw);

  const parsed: Partial<Record<ParamKey, string | number>> = {};
  for (const entry of raw.split("~").slice(1)) {
    const dot = entry.indexOf(".");
    const key = BY_CODE.get(entry.slice(0, dot));
    if (dot < 0 || !key) continue;
    const value = decodeValue(param(key), entry.slice(dot + 1));
    if (value !== undefined) parsed[key] = value;
  }
  const cow = parsed as Partial<CowConfig>;
  return { ...defaultsFor({ ...DEFAULTS, ...cow }), ...cow };
}

// The first share format: breed.spots.seed.chubby.legs.horns.extra
function decodeLegacy(raw: string): CowConfig | null {
  const [breed, spots, seed, chubby, legs, horns, extra] = raw.split(".");
  const nums = [spots, seed, chubby, legs].map(Number);
  if (
    !(breed in BREEDS) ||
    !["none", "nubs", "long"].includes(horns) ||
    !["none", "bell", "crown", "hat"].includes(extra) ||
    nums.some((n) => !Number.isFinite(n))
  ) {
    return null;
  }
  const unit = (n: number) => Math.min(1, Math.max(0, n / 100));
  const cow: Partial<CowConfig> = {
    breed: breed as BreedId,
    spots: unit(nums[0]),
    seed: nums[1],
    chubby: unit(nums[2]),
    legs: unit(nums[3]),
    horns: horns as CowConfig["horns"],
    ...wear("neckwear", extra === "bell" ? "bell" : "none"),
    ...wear("headwear", extra === "crown" || extra === "hat" ? extra : "none"),
  };
  return { ...defaultsFor({ ...DEFAULTS, ...cow }), ...cow };
}

import type { CowConfig } from "./store";

export type Preset = {
  name: string;
  meta: string;
  story: string;
  cow: CowConfig;
};

export const PRESETS = {
  blossom: {
    name: "Blossom",
    meta: "Gloucester · Berkeley, England · 1796",
    story:
      "Edward Jenner took cowpox from a milkmaid who caught it from Blossom, and used it to make the first smallpox vaccine. “Vaccine” comes from vacca, Latin for cow. Her hide still hangs at St George’s, University of London.",
    cow: { breed: "gloucester", spots: 0, seed: 1, chubby: 0.55, legs: 0.45, horns: "long", extra: "none" },
  },
  ollie: {
    name: "Elm Farm Ollie",
    meta: "Guernsey · St. Louis · 1930",
    story:
      "The first cow to fly in an airplane. She was milked mid-flight, and her milk was sealed in paper cartons and parachuted to the crowd below.",
    cow: { breed: "guernsey", spots: 0.45, seed: 214, chubby: 0.5, legs: 0.4, horns: "nubs", extra: "crown" },
  },
  pauline: {
    name: "Pauline Wayne",
    meta: "Holstein · White House · 1910–1913",
    story:
      "President Taft’s cow grazed on the White House lawn and supplied milk for the First Family. She’s often called the last cow to live at the White House.",
    cow: { breed: "holstein", spots: 0.45, seed: 88, chubby: 0.7, legs: 0.35, horns: "none", extra: "bell" },
  },
  oleary: {
    name: "Mrs. O’Leary’s Cow",
    meta: "Chicago · 1871",
    story:
      "Legend blamed her for kicking over a lantern and starting the Great Chicago Fire. The reporter later admitted he made it up, and in 1997 the city council cleared the O’Learys. Her looks are a guess.",
    cow: { breed: "jersey", spots: 0.3, seed: 1871, chubby: 0.5, legs: 0.4, horns: "nubs", extra: "none" },
  },
  yvonne: {
    name: "Yvonne",
    meta: "Fleckvieh · Bavaria · 2011",
    story:
      "Days before slaughter, Yvonne broke out and hid in the Bavarian forest for about three months, becoming a German media sensation. She lived out her life at the Gut Aiderbichl sanctuary.",
    cow: { breed: "fleckvieh", spots: 0.55, seed: 2011, chubby: 0.6, legs: 0.45, horns: "nubs", extra: "none" },
  },
  knickers: {
    name: "Knickers",
    meta: "Holstein-Friesian · Western Australia · 2018",
    story:
      "About 194 cm (6′4″) tall and 1.4 tonnes, Knickers went viral as one of Australia’s biggest steers. He was too big for the abattoir, so he got to stay with his herd.",
    cow: { breed: "holstein", spots: 0.55, seed: 311, chubby: 1, legs: 1, horns: "none", extra: "none" },
  },
} satisfies Record<string, Preset>;

export type PresetId = keyof typeof PRESETS;

export const isPresetId = (id: string): id is PresetId => id in PRESETS;

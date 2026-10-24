"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
  Ban,
  ChevronDown,
  CircleDot,
  Leaf,
  Moon,
  Music,
  RefreshCw,
  Sprout,
  Sun,
  Sunset,
  Volume2,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  ColorGrid,
  FineTune,
  IconButton,
  ParamColor,
  ParamSlider,
  SectionTitle,
  SectionTools,
  SettingRow,
  useLook,
  VisualPicker,
} from "./fields";
import { tapHaptic } from "./haptics";
import { BodyIcon, HeadIcon, Swatch } from "./icons";
import { moo } from "./moo";
import {
  BREEDS,
  isCustomCoat,
  PARAMS,
  SLOTS,
  type Breed,
  type BreedId,
  type ChoiceKey,
  type CowConfig,
  type Option,
  type Slot,
} from "./params";
import { PRESETS } from "./presets";
import { configOf, useCow } from "./store";

const BREED_IDS = Object.keys(BREEDS) as BreedId[];

const optionsOf = <K extends ChoiceKey>(k: K) =>
  PARAMS[k].options as unknown as readonly (Option & { id: CowConfig[K] })[];
const labelOf = <K extends ChoiceKey>(k: K, id: CowConfig[K]) =>
  optionsOf(k).find((o) => o.id === id)?.label ?? id;

const LEVELS = [0.1, 0.5, 0.95];
const nearest = (v: number) =>
  LEVELS.indexOf(LEVELS.reduce((best, l) => (Math.abs(l - v) < Math.abs(best - v) ? l : best)));

const CHUBBY_NAMES = ["Slim", "Round", "Chonky"];
const LEG_NAMES = ["short legs", "medium legs", "long legs"];
const PITCH_NAMES = ["Low", "Normal", "High"];
const EYE_NAMES: Record<CowConfig["eyes"], string> = {
  round: "Round eyes",
  sleepy: "Sleepy eyes",
  lashes: "Long lashes",
  wink: "Winking",
};

const Big = ({ children }: { children: React.ReactNode }) => <span className="block size-14">{children}</span>;
const Small = ({ children }: { children: React.ReactNode }) => <span className="block size-7">{children}</span>;

function CoatPanel() {
  const { breed, pattern, base, spot } = useCow(
    useShallow((s) => ({ breed: s.breed, pattern: s.pattern, base: s.base, spot: s.spot })),
  );
  const set = useCow((s) => s.set);
  const reroll = useCow((s) => s.reroll);
  return (
    <>
      <VisualPicker
        value={breed}
        onChange={(id) => set({ breed: id })}
        columns={3}
        options={BREED_IDS.map((id) => {
          const b: Breed = BREEDS[id];
          return {
            id,
            label: b.name,
            visual: <Swatch base={b.colors.base} spot={b.colors.spot} pattern={b.pattern} />,
          };
        })}
      />
      {pattern !== "none" && (
        <div className="flex items-center gap-2">
          <ParamSlider k="spots" label="Spots" />
          <IconButton label="New spot pattern" icon={RefreshCw} onClick={reroll} variant="ghost" />
        </div>
      )}
      <FineTune label="Colors and pattern">
        <ColorGrid keys={["base", "spot", "snout", "hoof", "tuftColor"]} />
        <VisualPicker
          value={pattern}
          onChange={(id) => set({ pattern: id })}
          columns={5}
          options={optionsOf("pattern").map((o) => ({
            ...o,
            visual: <Swatch base={base} spot={spot} pattern={o.id} className="size-8" />,
          }))}
        />
        {pattern !== "none" && (
          <>
            <ParamSlider k="spotScale" label="Spot size" />
            <ParamSlider k="spotEdge" label="Sharpness" />
          </>
        )}
        <SectionTools group="coat" />
      </FineTune>
    </>
  );
}

function BodyPanel() {
  return (
    <>
      <ParamSlider k="chubby" />
      <ParamSlider k="legs" />
      <FineTune>
        <ParamSlider k="size" />
        <ParamSlider k="headSize" />
        <ParamSlider k="earSize" />
        <ParamSlider k="earAngle" />
        <ParamSlider k="snoutSize" />
        <ParamSlider k="tail" />
        <ParamSlider k="udder" />
        <ParamSlider k="tuft" />
        <SectionTools group="body" />
      </FineTune>
    </>
  );
}

function HornsPanel() {
  const look = useLook();
  const horns = useCow((s) => s.horns);
  const set = useCow((s) => s.set);
  return (
    <>
      <VisualPicker
        value={horns}
        onChange={(v) => set({ horns: v })}
        columns={3}
        options={optionsOf("horns").map((h) => ({
          ...h,
          visual: (
            <Big>
              <HeadIcon look={look} horns={h.id} className="size-full" />
            </Big>
          ),
        }))}
      />
      {horns !== "none" && (
        <FineTune>
          <ParamSlider k="hornLength" />
          {horns === "long" && <ParamSlider k="hornCurl" />}
          <ParamColor k="hornColor" />
          <SectionTools group="horns" />
        </FineTune>
      )}
    </>
  );
}

function FacePanel() {
  const look = useLook();
  const eyes = useCow((s) => s.eyes);
  const set = useCow((s) => s.set);
  return (
    <>
      <VisualPicker
        value={eyes}
        onChange={(v) => set({ eyes: v })}
        columns={4}
        options={optionsOf("eyes").map((e) => ({
          ...e,
          visual: (
            <Big>
              <HeadIcon look={look} eyes={e.id} className="size-full" />
            </Big>
          ),
        }))}
      />
      <ParamSlider k="blush" />
    </>
  );
}

const SLOT_KEYS = Object.keys(SLOTS) as Slot[];
const EXTRAS = SLOT_KEYS.flatMap((slot) =>
  (PARAMS[slot].options as readonly Option[])
    .filter((o) => o.id !== "none")
    .map((o) => ({ slot, id: o.id, label: o.label })),
);

// Every extra in one grid, as before. Tapping one swaps out whatever shares its slot,
// so a cow can still wear a hat, a bell and glasses together.
function ExtrasPanel() {
  const look = useLook();
  const worn = useCow(useShallow((s) => SLOT_KEYS.map((k) => s[k] as string)));
  const set = useCow((s) => s.set);
  const wornIds = worn.filter((id) => id !== "none");
  return (
    <>
      <ToggleGroup
        multiple
        value={wornIds}
        onValueChange={(next: string[]) => {
          const added = next.find((id) => !wornIds.includes(id));
          const patch: Record<string, string> = {};
          for (const e of EXTRAS) {
            if (e.id === added) patch[e.slot] = e.id;
            else if (wornIds.includes(e.id) && !next.includes(e.id)) patch[e.slot] = "none";
          }
          set(patch as Partial<CowConfig>);
        }}
        className="grid grid-cols-4 gap-1"
      >
        {EXTRAS.map((e) => (
          <ToggleGroupItem
            key={e.id}
            ref={tapHaptic}
            value={e.id}
            aria-label={e.label}
            className="h-auto flex-col gap-1 p-1.5 aria-pressed:ring-2 aria-pressed:ring-primary"
          >
            <Big>
              <HeadIcon look={look} {...{ [e.slot]: e.id }} className="size-full" />
            </Big>
            <span className="text-[11px] leading-tight font-normal text-muted-foreground">{e.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {wornIds.length > 0 && (
        <FineTune label="Colors">
          {SLOT_KEYS.map((slot, i) =>
            worn[i] === "none" ? null : (
              <ParamColor
                key={slot}
                k={SLOTS[slot]}
                label={EXTRAS.find((e) => e.id === worn[i])?.label}
              />
            ),
          )}
          <SectionTools group="accessories" />
        </FineTune>
      )}
    </>
  );
}

function ChoiceIcons<K extends "ground" | "lighting" | "idle">({
  k,
  icons,
}: {
  k: K;
  icons: Record<CowConfig[K], LucideIcon>;
}) {
  const value = useCow((s) => s[k]);
  const set = useCow((s) => s.set);
  return (
    <div className="flex flex-col gap-2">
      <SectionTitle>{PARAMS[k].label}</SectionTitle>
      <VisualPicker
        value={value}
        onChange={(v) => set({ [k]: v })}
        columns={3}
        options={optionsOf(k).map((o) => {
          const Icon: LucideIcon = icons[o.id];
          return { id: o.id, label: o.label, visual: <Icon className="size-5" /> };
        })}
      />
    </div>
  );
}

function ScenePanel() {
  return (
    <>
      <ParamColor k="background" label="Color" />
      <ChoiceIcons k="lighting" icons={{ sunny: Sun, golden: Sunset, night: Moon }} />
      <ChoiceIcons k="ground" icons={{ shadow: CircleDot, pasture: Sprout, none: Ban }} />
      <ChoiceIcons k="idle" icons={{ calm: Leaf, chew: Wheat, dance: Music }} />
    </>
  );
}

function SoundPanel() {
  return (
    <>
      <ParamSlider k="mooPitch" />
      <ParamSlider k="mooLength" />
      <Button ref={tapHaptic} variant="outline" onClick={() => moo()} className="self-start rounded-xl">
        <Volume2 data-icon="inline-start" />
        Test moo
      </Button>
    </>
  );
}

function MoreOptions() {
  const look = useLook();
  const s = useCow(
    useShallow((s) => ({
      eyes: s.eyes,
      blush: s.blush,
      lighting: s.lighting,
      ground: s.ground,
      mooPitch: s.mooPitch,
    })),
  );
  return (
    <>
      <SettingRow
        label="Face"
        group="face"
        value={`${EYE_NAMES[s.eyes]}${s.blush > 0.05 ? ", blushing" : ""}`}
        indicator={
          <Small>
            <HeadIcon look={look} eyes={s.eyes} blush={s.blush} className="size-full" />
          </Small>
        }
      >
        <FacePanel />
      </SettingRow>
      <SettingRow
        label="Scene"
        value={`${labelOf("lighting", s.lighting)}, ${labelOf("ground", s.ground).toLowerCase()}`}
      >
        <ScenePanel />
      </SettingRow>
      <SettingRow label="Sound" value={`${PITCH_NAMES[nearest(s.mooPitch)]} moo`}>
        <SoundPanel />
      </SettingRow>
    </>
  );
}

export function BuildSettings() {
  const [more, setMore] = useState(false);
  const look = useLook();
  const s = useCow(
    useShallow((s) => ({
      preset: s.preset,
      breed: s.breed,
      chubby: s.chubby,
      legs: s.legs,
      horns: s.horns,
      headwear: s.headwear,
      neckwear: s.neckwear,
      facewear: s.facewear,
      custom: isCustomCoat(configOf(s)),
    })),
  );
  const worn = SLOT_KEYS.filter((k) => s[k] !== "none").map((k) => labelOf(k, s[k]));

  return (
    <div className="flex flex-col gap-2">
      {s.preset && (
        <Badge variant="secondary" className="self-start">
          Starting from {PRESETS[s.preset].name}
        </Badge>
      )}
      <SettingRow
        label="Breed"
        group="coat"
        value={`${BREEDS[s.breed].name}${s.custom ? " · custom" : ""}`}
        indicator={<Swatch base={look.base} spot={look.spot} pattern={look.pattern} className="size-6" />}
      >
        <CoatPanel />
      </SettingRow>
      <SettingRow
        label="Body"
        group="body"
        value={`${CHUBBY_NAMES[nearest(s.chubby)]}, ${LEG_NAMES[nearest(s.legs)]}`}
        indicator={
          <span className="block h-6 w-8">
            <BodyIcon look={look} chubby={s.chubby} legs={s.legs} className="size-full" />
          </span>
        }
      >
        <BodyPanel />
      </SettingRow>
      <SettingRow
        label="Horns"
        group="horns"
        value={labelOf("horns", s.horns)}
        indicator={
          <Small>
            <HeadIcon look={look} horns={s.horns} className="size-full" />
          </Small>
        }
      >
        <HornsPanel />
      </SettingRow>
      <SettingRow
        label="Extras"
        group="accessories"
        value={worn.length ? worn.join(", ") : "None"}
        indicator={
          <Small>
            <HeadIcon
              look={look}
              horns={s.horns}
              headwear={s.headwear}
              neckwear={s.neckwear}
              facewear={s.facewear}
              className="size-full"
            />
          </Small>
        }
      >
        <ExtrasPanel />
      </SettingRow>

      <Button
        ref={tapHaptic}
        variant="ghost"
        size="sm"
        aria-expanded={more}
        onClick={() => setMore(!more)}
        className="justify-between text-muted-foreground"
      >
        More options
        <ChevronDown className={cn("transition-transform", more && "rotate-180")} />
      </Button>
      {more && <MoreOptions />}
    </div>
  );
}

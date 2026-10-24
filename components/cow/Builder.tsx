"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Dices, Download, Link2, RefreshCw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { toast } from "sonner";
import { isPresetId, PRESETS, type PresetId } from "./presets";
import { BodyIcon, HeadIcon } from "./icons";
import { decodeCow, encodeCow } from "./share";
import { requestSnapshot } from "./snapshot";
import {
  BREEDS,
  CREAM,
  useCow,
  type BreedId,
  type Extra,
  type Horns,
  type Mode,
} from "./store";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

const PRESET_IDS = Object.keys(PRESETS) as PresetId[];
const BREED_IDS = Object.keys(BREEDS) as BreedId[];

const HORNS: { id: Horns; label: string }[] = [
  { id: "none", label: "None" },
  { id: "nubs", label: "Nubs" },
  { id: "long", label: "Long" },
];

const EXTRAS: { id: Extra; label: string }[] = [
  { id: "none", label: "None" },
  { id: "bell", label: "Bell" },
  { id: "crown", label: "Flower crown" },
  { id: "hat", label: "Hat" },
];

function download() {
  requestSnapshot((src) => {
    const out = document.createElement("canvas");
    out.width = src.width;
    out.height = src.height;
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(src, 0, 0);
    out.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.download = "vaquita.png";
      a.href = URL.createObjectURL(blob);
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href));
    }, "image/png");
  });
}

const cowHash = () => {
  const s = useCow.getState();
  return `#${s.preset ?? encodeCow(s)}`;
};

async function copyLink() {
  const { origin, pathname, search } = window.location;
  await navigator.clipboard.writeText(`${origin}${pathname}${search}${cowHash()}`);
  toast("Link copied");
}

function useCowInUrl() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const fromUrl = decodeCow(hash);
    if (isPresetId(hash)) useCow.getState().applyPreset(hash);
    else if (fromUrl) useCow.getState().set(fromUrl);

    const write = () => history.replaceState(null, "", cowHash());
    write();
    // Slider drags fire every frame; browsers throttle replaceState past ~100 calls per 10s.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useCow.subscribe((s, prev) => {
      if (s.moos === prev.moos) {
        clearTimeout(timer);
        timer = setTimeout(write, 200);
      }
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);
}

function IconButton({
  label,
  icon: Icon,
  onClick,
  size = "icon-lg",
  variant = "outline",
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  size?: "icon-lg" | "icon-sm";
  variant?: "outline" | "ghost";
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant={variant}
            size={size}
            aria-label={label}
            onClick={onClick}
            className="rounded-full"
          />
        }
      >
        <Icon />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function Swatch({ breed, className }: { breed: BreedId; className?: string }) {
  const b = BREEDS[breed];
  return (
    <span
      className={cn("size-10 shrink-0 rounded-full shadow-inner", className)}
      style={{
        background: b.spots
          ? `radial-gradient(circle at 65% 35%, ${b.spot} 0 28%, transparent 29%), radial-gradient(circle at 30% 72%, ${b.spot} 0 18%, transparent 19%), ${b.base}`
          : b.base,
      }}
    />
  );
}

function FamousPicker() {
  const preset = useCow((s) => s.preset);
  const applyPreset = useCow((s) => s.applyPreset);
  return (
    <ToggleGroup
      value={preset ? [preset] : []}
      onValueChange={([id]) => id && applyPreset(id as PresetId)}
      orientation="vertical"
      spacing={1}
      className="w-full"
    >
      {PRESET_IDS.map((id) => {
        const p = PRESETS[id];
        return (
          <ToggleGroupItem
            key={id}
            value={id}
            className="h-auto justify-start gap-3 rounded-xl px-2 py-2"
          >
            <Swatch breed={p.cow.breed} className="size-8" />
            <span className="flex min-w-0 flex-col items-start">
              <span className="truncate font-medium">{p.name}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {p.meta.split(" · ").at(-1)}
              </span>
            </span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}

function StoryCard({ className }: { className?: string }) {
  const preset = useCow((s) => s.preset);
  if (!preset) return null;
  const p = PRESETS[preset];
  return (
    <Card key={preset} size="sm" className={className}>
      <CardHeader>
        <CardTitle>{p.name}</CardTitle>
        <CardDescription>{p.meta}</CardDescription>
      </CardHeader>
      <CardContent className="leading-relaxed text-muted-foreground">{p.story}</CardContent>
    </Card>
  );
}

const LEVELS = [0.1, 0.5, 0.95];
const nearest = (levels: number[], v: number) =>
  levels.reduce((best, l) => (Math.abs(l - v) < Math.abs(best - v) ? l : best));

const CHUBBY_NAMES = ["Slim", "Round", "Chonky"];
const LEG_NAMES = ["short legs", "medium legs", "long legs"];
const bodyLabel = (chubby: number, legs: number) =>
  `${CHUBBY_NAMES[LEVELS.indexOf(nearest(LEVELS, chubby))]}, ${
    LEG_NAMES[LEVELS.indexOf(nearest(LEVELS, legs))]
  }`;

function VisualPicker<T extends string>({
  value,
  onChange,
  columns,
  options,
}: {
  value: T | null;
  onChange: (v: T) => void;
  columns: number;
  options: { id: T; label: string; visual: ReactNode }[];
}) {
  return (
    <ToggleGroup
      value={value ? [value] : []}
      onValueChange={([v]) => v && onChange(v as T)}
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.id}
          value={o.id}
          aria-label={o.label}
          className="h-auto flex-col gap-1 p-1.5 aria-pressed:ring-2 aria-pressed:ring-primary"
        >
          {o.visual}
          <span className="text-[11px] font-normal text-muted-foreground">{o.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function SliderField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Label className="w-14 shrink-0">{label}</Label>
      <div className="w-44">
        <Slider
          aria-label={label}
          min={0}
          max={1}
          step={0.01}
          value={[value]}
          onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
        />
      </div>
    </div>
  );
}

function BreedPanel() {
  const breed = useCow((s) => s.breed);
  const spots = useCow((s) => s.spots);
  const set = useCow((s) => s.set);
  const reroll = useCow((s) => s.reroll);
  return (
    <div className="flex flex-col gap-3">
      <VisualPicker
        value={breed}
        onChange={(id) => set({ breed: id })}
        columns={4}
        options={BREED_IDS.map((id) => ({
          id,
          label: BREEDS[id].name,
          visual: <Swatch breed={id} />,
        }))}
      />
      {BREEDS[breed].spots && (
        <div className="flex items-center gap-2">
          <SliderField label="Spots" value={spots} onChange={(v) => set({ spots: v })} />
          <IconButton
            label="New spot pattern"
            icon={RefreshCw}
            onClick={reroll}
            size="icon-sm"
            variant="ghost"
          />
        </div>
      )}
    </div>
  );
}

function BodyPanel() {
  const chubby = useCow((s) => s.chubby);
  const legs = useCow((s) => s.legs);
  const set = useCow((s) => s.set);
  return (
    <div className="flex flex-col gap-3">
      <SliderField label="Chubby" value={chubby} onChange={(v) => set({ chubby: v })} />
      <SliderField label="Legs" value={legs} onChange={(v) => set({ legs: v })} />
    </div>
  );
}

function SettingRow({
  label,
  value,
  indicator,
  children,
}: {
  label: string;
  value: string;
  indicator?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="h-auto w-full justify-between rounded-xl px-3 py-2 text-left"
          />
        }
      >
        <span className="flex flex-col items-start">
          <span className="text-xs font-normal text-muted-foreground">{label}</span>
          <span className="font-medium">{value}</span>
        </span>
        {indicator}
      </PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={16} className="w-auto p-4">
        <PopoverHeader>
          <PopoverTitle>{label}</PopoverTitle>
        </PopoverHeader>
        {children}
      </PopoverContent>
    </Popover>
  );
}

function BuildSettings() {
  const preset = useCow((s) => s.preset);
  const breed = useCow((s) => s.breed);
  const chubby = useCow((s) => s.chubby);
  const legs = useCow((s) => s.legs);
  const horns = useCow((s) => s.horns);
  const extra = useCow((s) => s.extra);
  const set = useCow((s) => s.set);
  return (
    <div className="flex flex-col gap-2">
      {preset && (
        <Badge variant="secondary" className="self-start">
          Starting from {PRESETS[preset].name}
        </Badge>
      )}
      <SettingRow
        label="Breed"
        value={BREEDS[breed].name}
        indicator={<Swatch breed={breed} className="size-6" />}
      >
        <BreedPanel />
      </SettingRow>
      <SettingRow
        label="Body"
        value={bodyLabel(chubby, legs)}
        indicator={<span className="block h-6 w-8"><BodyIcon breed={breed} chubby={chubby} legs={legs} className="size-full" /></span>}
      >
        <BodyPanel />
      </SettingRow>
      <SettingRow
        label="Horns"
        value={HORNS.find((h) => h.id === horns)!.label}
        indicator={<span className="block size-7"><HeadIcon breed={breed} horns={horns} extra="none" className="size-full" /></span>}
      >
        <VisualPicker
          value={horns}
          onChange={(v) => set({ horns: v })}
          columns={3}
          options={HORNS.map((h) => ({
            ...h,
            visual: <span className="block size-14"><HeadIcon breed={breed} horns={h.id} extra="none" className="size-full" /></span>,
          }))}
        />
      </SettingRow>
      <SettingRow
        label="Extras"
        value={EXTRAS.find((e) => e.id === extra)!.label}
        indicator={<span className="block size-7"><HeadIcon breed={breed} horns={horns} extra={extra} className="size-full" /></span>}
      >
        <VisualPicker
          value={extra}
          onChange={(v) => set({ extra: v })}
          columns={4}
          options={EXTRAS.map((e) => ({
            ...e,
            visual: <span className="block size-14"><HeadIcon breed={breed} horns={horns} extra={e.id} className="size-full" /></span>,
          }))}
        />
      </SettingRow>
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <Button variant="outline" onClick={onClick} className="rounded-xl">
      <Icon data-icon="inline-start" />
      {label}
    </Button>
  );
}

export function Builder() {
  const mode = useCow((s) => s.mode);
  const setMode = useCow((s) => s.setMode);
  const randomize = useCow((s) => s.randomize);
  useCowInUrl();

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-background">
      <div className="absolute inset-x-0 top-0 bottom-[45dvh] md:bottom-0 md:left-72">
        <Scene />
      </div>

      {mode === "famous" && (
        <StoryCard className="cow-pop absolute top-4 right-4 hidden max-w-xs md:flex" />
      )}

      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as Mode)}
        render={<aside />}
        className="absolute inset-x-3 bottom-3 max-h-[45dvh] gap-3 rounded-3xl bg-card p-3 shadow-sm ring-1 ring-foreground/10 md:inset-x-auto md:top-4 md:bottom-4 md:left-4 md:max-h-none md:w-64"
      >
        <h1 className="px-1 text-lg font-semibold tracking-tight">vaquita</h1>
        <TabsList className="w-full">
          <TabsTrigger value="famous">Famous cows</TabsTrigger>
          <TabsTrigger value="build">Build</TabsTrigger>
        </TabsList>

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          <TabsContent value="famous" className="flex flex-col gap-2">
            <StoryCard className="md:hidden" />
            <FamousPicker />
          </TabsContent>
          <TabsContent value="build">
            <BuildSettings />
          </TabsContent>
        </div>

        <Separator />
        <div className="grid grid-cols-3 gap-2 md:grid-cols-1">
          <ActionButton label="Shuffle" icon={Dices} onClick={randomize} />
          <ActionButton label="Copy link" icon={Link2} onClick={copyLink} />
          <ActionButton label="Download PNG" icon={Download} onClick={download} />
        </div>
      </Tabs>
    </main>
  );
}

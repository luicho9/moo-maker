"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ChevronDown, Dices, Lock, LockOpen, type LucideIcon } from "lucide-react";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { tapHaptic } from "./haptics";
import type { Look } from "./icons";
import { PARAMS, type ColorKey, type ColorParam, type Group, type NumberKey } from "./params";
import { useCow } from "./store";

// Matches the `side` variant in app/globals.css.
const SIDE_PANEL = "(min-width: 48rem) or ((orientation: landscape) and (max-height: 32rem))";
export function useSidePanel() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(SIDE_PANEL);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(SIDE_PANEL).matches,
    () => true,
  );
}

export function useLook(): Look {
  return useCow(
    useShallow((s) => ({
      base: s.base,
      spot: s.spot,
      snout: s.snout,
      hoof: s.hoof,
      pattern: s.pattern,
      tuft: s.tuft,
      tuftColor: s.tuftColor,
      hornColor: s.hornColor,
    })),
  );
}

export function IconButton({
  label,
  icon: Icon,
  onClick,
  variant = "outline",
  size = "icon-lg",
  pressed,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "outline" | "ghost";
  size?: "icon-lg" | "icon" | "icon-sm";
  pressed?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        ref={tapHaptic}
        render={
          <Button
            variant={variant}
            size={size}
            aria-label={label}
            aria-pressed={pressed}
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

export function VisualPicker<T extends string>({
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
          ref={tapHaptic}
          value={o.id}
          aria-label={o.label}
          className="h-auto flex-col gap-1 p-1.5 aria-pressed:ring-2 aria-pressed:ring-primary"
        >
          {o.visual}
          <span className="text-[11px] leading-tight font-normal text-muted-foreground">{o.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function SliderField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <Label className="w-16 shrink-0">{label}</Label>
      <div className="min-w-0 flex-1">
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

export function ParamSlider({ k, label }: { k: NumberKey; label?: string }) {
  const value = useCow((s) => s[k]);
  const set = useCow((s) => s.set);
  return <SliderField label={label ?? PARAMS[k].label} value={value} onChange={(v) => set({ [k]: v })} />;
}

const swatchInput =
  "size-8 shrink-0 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 shadow-inner ring-1 ring-foreground/15 [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0";

// A free color picker, plus the param's suggested palette when it has one.
export function ParamColor({ k, label }: { k: ColorKey; label?: string }) {
  const value = useCow((s) => s[k]);
  const set = useCow((s) => s.set);
  const p: ColorParam = PARAMS[k];
  const text = label ?? p.label;
  return (
    <div className="flex items-center gap-3">
      <Label className="w-16 shrink-0">{text}</Label>
      <input
        type="color"
        aria-label={text}
        value={value.toLowerCase()}
        onChange={(e) => set({ [k]: e.target.value })}
        className={swatchInput}
      />
      {p.palette && (
        <div className="flex flex-wrap gap-1">
          {p.palette.map((c) => (
            <button
              key={c}
              ref={tapHaptic}
              type="button"
              aria-label={c}
              aria-pressed={c.toLowerCase() === value.toLowerCase()}
              onClick={() => set({ [k]: c })}
              className="size-6 rounded-full ring-1 ring-foreground/15 aria-pressed:ring-2 aria-pressed:ring-primary"
              style={{ background: c }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// A grid of small labelled color wells, for sections with several colors.
export function ColorGrid({ keys }: { keys: ColorKey[] }) {
  const values = useCow(useShallow((s) => keys.map((k) => s[k])));
  const set = useCow((s) => s.set);
  return (
    <div className="grid grid-cols-5 gap-2">
      {keys.map((k, i) => (
        <label key={k} className="flex flex-col items-center gap-1">
          <input
            type="color"
            aria-label={PARAMS[k].label}
            value={values[i].toLowerCase()}
            onChange={(e) => set({ [k]: e.target.value })}
            className={swatchInput}
          />
          <span className="text-[11px] text-muted-foreground">{PARAMS[k].label}</span>
        </label>
      ))}
    </div>
  );
}

export function FineTune({ label = "Fine-tune", children }: { label?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <Button
        ref={tapHaptic}
        variant="ghost"
        size="sm"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="-mx-2 justify-between text-muted-foreground"
      >
        {label}
        <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
      </Button>
      {open && children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium text-muted-foreground">{children}</p>;
}

// Lives at the bottom of a section's Fine-tune, out of the way until someone looks for it.
export function SectionTools({ group }: { group: Group }) {
  const randomize = useCow((s) => s.randomize);
  const locked = useCow((s) => !!group && s.locked.includes(group));
  const toggleLock = useCow((s) => s.toggleLock);
  return (
    <div className="-mx-2 flex gap-1">
      <Button
        ref={tapHaptic}
        variant="ghost"
        size="sm"
        onClick={() => randomize(group)}
        className="text-muted-foreground"
      >
        <Dices data-icon="inline-start" />
        Shuffle
      </Button>
      <Button
        ref={tapHaptic}
        variant="ghost"
        size="sm"
        aria-pressed={locked}
        onClick={() => toggleLock(group)}
        className="text-muted-foreground aria-pressed:text-foreground"
      >
        {locked ? <Lock data-icon="inline-start" /> : <LockOpen data-icon="inline-start" />}
        {locked ? "Locked" : "Lock"}
      </Button>
    </div>
  );
}

export function SettingRow({
  label,
  value,
  indicator,
  group,
  children,
}: {
  label: string;
  value: string;
  indicator?: ReactNode;
  group?: Group;
  children: ReactNode;
}) {
  // The mobile sheet spans the full width, so open upward over the scene instead.
  const desktop = useSidePanel();
  const locked = useCow((s) => !!group && s.locked.includes(group));
  return (
    <Popover>
      <PopoverTrigger
        ref={tapHaptic}
        render={
          <Button
            variant="outline"
            className="h-auto w-full justify-between rounded-xl px-3 py-2 text-left"
          />
        }
      >
        <span className="flex min-w-0 flex-col items-start">
          <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
            {label}
            {locked && <Lock className="size-3" aria-label="Locked" />}
          </span>
          <span className="max-w-40 truncate font-medium">{value}</span>
        </span>
        {indicator}
      </PopoverTrigger>
      <PopoverContent
        side={desktop ? "right" : "top"}
        align={desktop ? "start" : "center"}
        sideOffset={desktop ? 16 : 8}
        className="max-h-[min(var(--available-height),42rem)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto p-4"
      >
        <PopoverHeader>
          <PopoverTitle>{label}</PopoverTitle>
        </PopoverHeader>
        <div className="flex flex-col gap-3">{children}</div>
      </PopoverContent>
    </Popover>
  );
}

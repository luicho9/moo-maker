"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dices, Download, Heart, Link2, Redo2, Undo2, X, type LucideIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { toast } from "sonner";
import { IconButton } from "./fields";
import { thumbnail, useGallery } from "./gallery";
import { SUCCESS, tapHaptic, useStoreHaptics, vibrate } from "./haptics";
import { Swatch } from "./icons";
import { BREEDS, type Breed } from "./params";
import { isPresetId, PRESETS, type PresetId } from "./presets";
import { BuildSettings } from "./sections";
import { decodeCow, encodeCow } from "./share";
import { requestSnapshot } from "./snapshot";
import { useCow, type Mode } from "./store";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

const PRESET_IDS = Object.keys(PRESETS) as PresetId[];

function download() {
  requestSnapshot((src) => {
    const out = document.createElement("canvas");
    out.width = src.width;
    out.height = src.height;
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = useCow.getState().background;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(src, 0, 0);
    out.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.download = "moo-maker.png";
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
  vibrate(SUCCESS);
}

function saveCow() {
  const hash = encodeCow(useCow.getState());
  requestSnapshot((canvas) => {
    const stored = useGallery.getState().add(hash, thumbnail(canvas));
    toast(stored ? "Saved to your cows" : "Saved for now. This browser won’t keep it after you leave.");
    vibrate(SUCCESS);
  });
}

function useCowInUrl() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const fromUrl = decodeCow(hash);
    if (isPresetId(hash)) useCow.getState().applyPreset(hash);
    else if (fromUrl) useCow.getState().load(fromUrl, { history: false });

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

function useUndoShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      const { undo, redo } = useCow.getState();
      if (key === "z" && !e.shiftKey) undo();
      else if ((key === "z" && e.shiftKey) || key === "y") redo();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

function HistoryButtons() {
  const canUndo = useCow((s) => s.past.length > 0);
  const canRedo = useCow((s) => s.future.length > 0);
  const undo = useCow((s) => s.undo);
  const redo = useCow((s) => s.redo);
  if (!canUndo && !canRedo) return null;
  return (
    <div className="cow-pop flex gap-0.5">
      <span className={canUndo ? undefined : "pointer-events-none opacity-40"}>
        <IconButton label="Undo" icon={Undo2} variant="ghost" size="icon-sm" onClick={undo} />
      </span>
      <span className={canRedo ? undefined : "pointer-events-none opacity-40"}>
        <IconButton label="Redo" icon={Redo2} variant="ghost" size="icon-sm" onClick={redo} />
      </span>
    </div>
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
        const b: Breed = BREEDS[p.cow.breed];
        return (
          <ToggleGroupItem
            key={id}
            ref={tapHaptic}
            value={id}
            className="h-auto justify-start gap-3 rounded-xl px-2 py-2"
          >
            <Swatch base={b.colors.base} spot={b.colors.spot} pattern={b.pattern} className="size-8" />
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

function SavedCows() {
  const items = useGallery((s) => s.items);
  const remove = useGallery((s) => s.remove);
  const hydrate = useGallery((s) => s.hydrate);
  const load = useCow((s) => s.load);
  useEffect(hydrate, [hydrate]);

  return (
    <div className="flex flex-col gap-3">
      <Button ref={tapHaptic} variant="outline" onClick={saveCow} className="rounded-xl">
        <Heart data-icon="inline-start" />
        Save this cow
      </Button>
      {items.length === 0 ? (
        <p className="px-1 text-sm leading-relaxed text-muted-foreground">
          Cows you save show up here, on this device.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 md:grid-cols-2">
          {items.map((c) => (
            <li key={c.id} className="group relative">
              <button
                ref={tapHaptic}
                type="button"
                aria-label="Load this cow"
                onClick={() => {
                  const cow = decodeCow(c.hash);
                  if (cow) load(cow);
                }}
                className="block w-full overflow-hidden rounded-xl ring-1 ring-foreground/10 transition-shadow hover:ring-2 hover:ring-primary"
              >
                {/* Data URLs from the canvas; next/image would add nothing here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.thumb} alt="" className="aspect-4/3 w-full object-cover" />
              </button>
              <button
                type="button"
                aria-label="Delete this cow"
                onClick={() => remove(c.id)}
                className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-background/90 text-muted-foreground shadow-sm ring-1 ring-foreground/10 hover:text-foreground md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActionButton({
  label,
  shortLabel,
  icon: Icon,
  onClick,
}: {
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <Button
      ref={tapHaptic}
      variant="outline"
      size="lg"
      onClick={onClick}
      aria-label={label}
      className="rounded-xl"
    >
      <Icon data-icon="inline-start" />
      <span className="side:hidden short:inline">{shortLabel}</span>
      <span className="hidden side:inline short:hidden">{label}</span>
    </Button>
  );
}

export function Builder() {
  const mode = useCow((s) => s.mode);
  const setMode = useCow((s) => s.setMode);
  const randomize = useCow((s) => s.randomize);
  useCowInUrl();
  useStoreHaptics();
  useUndoShortcuts();

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-background">
      <div className="absolute inset-x-0 top-0 bottom-[45dvh] side:bottom-0 side:left-72">
        <Scene />
      </div>

      {mode === "famous" && (
        <StoryCard className="cow-pop absolute top-4 right-4 hidden max-w-xs side:flex short:hidden" />
      )}

      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as Mode)}
        render={<aside />}
        className="absolute inset-x-3 bottom-[max(--spacing(3),env(safe-area-inset-bottom))] max-h-[45dvh] gap-3 rounded-3xl bg-card p-3 shadow-sm ring-1 ring-foreground/10 side:inset-x-auto side:top-4 side:bottom-4 side:left-4 side:max-h-none side:w-64"
      >
        <div className="flex items-center justify-between">
          <h1 className="px-1 text-lg font-semibold tracking-tight">moo maker</h1>
          <HistoryButtons />
        </div>
        <TabsList className="w-full">
          <TabsTrigger ref={tapHaptic} value="famous">Famous cows</TabsTrigger>
          <TabsTrigger ref={tapHaptic} value="build">Build</TabsTrigger>
          <TabsTrigger ref={tapHaptic} value="saved">Saved</TabsTrigger>
        </TabsList>

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          <TabsContent value="famous" className="flex flex-col gap-2">
            <StoryCard className="side:hidden short:flex" />
            <FamousPicker />
          </TabsContent>
          <TabsContent value="build">
            <BuildSettings />
          </TabsContent>
          <TabsContent value="saved">
            <SavedCows />
          </TabsContent>
        </div>

        <Separator />
        <div className="grid grid-cols-3 gap-2 side:grid-cols-1 short:grid-cols-3">
          <ActionButton label="Shuffle" shortLabel="Shuffle" icon={Dices} onClick={() => randomize()} />
          <ActionButton label="Copy link" shortLabel="Share" icon={Link2} onClick={copyLink} />
          <ActionButton label="Download PNG" shortLabel="Save" icon={Download} onClick={download} />
        </div>
      </Tabs>
    </main>
  );
}

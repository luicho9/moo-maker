"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import { decodeCow, encodeCow } from "./share";
import { BREEDS, CREAM, useCow, type BreedId, type Extra, type Horns } from "./store";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

const TABS = [
  { id: "breed", label: "Breed", tint: "#FF9F5A" },
  { id: "body", label: "Body", tint: "#F5C63C" },
  { id: "horns", label: "Horns", tint: "#7FCB72" },
  { id: "extras", label: "Extras", tint: "#7CC4F2" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function download() {
  const src = document.querySelector<HTMLCanvasElement>("#cow-canvas canvas");
  if (!src) return;
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(src, 0, 0);
  const a = document.createElement("a");
  a.download = "vaquita.png";
  a.href = out.toDataURL("image/png");
  a.click();
}

function RoundButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full bg-white/80 text-stone-700 shadow-[0_2px_10px_rgba(80,60,40,0.12)] backdrop-blur transition-transform hover:scale-105 active:scale-95"
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
        active
          ? "bg-stone-800 text-white"
          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
      }`}
    >
      {children}
    </button>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm text-stone-600">
      <span className="w-14 shrink-0">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="cow-range w-44"
      />
    </label>
  );
}

function BreedPanel() {
  const { breed, spots, set, reroll } = useCow();
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-3">
        {(Object.keys(BREEDS) as BreedId[]).map((id) => {
          const b = BREEDS[id];
          return (
            <button
              key={id}
              onClick={() => set({ breed: id })}
              className="flex flex-col items-center gap-1"
            >
              <span
                className={`size-11 rounded-full shadow-inner transition-transform active:scale-90 ${
                  breed === id ? "ring-2 ring-stone-800 ring-offset-2" : ""
                }`}
                style={{
                  background: b.spots
                    ? `radial-gradient(circle at 65% 35%, ${b.spot} 0 28%, transparent 29%), radial-gradient(circle at 30% 72%, ${b.spot} 0 18%, transparent 19%), ${b.base}`
                    : b.base,
                }}
              />
              <span className="text-xs text-stone-500">{b.name}</span>
            </button>
          );
        })}
      </div>
      {BREEDS[breed].spots && (
        <div className="flex items-center gap-2">
          <Slider label="Spots" value={spots} onChange={(v) => set({ spots: v })} />
          <button
            aria-label="New spot pattern"
            title="New spot pattern"
            onClick={reroll}
            className="grid size-8 place-items-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 active:scale-90"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function BodyPanel() {
  const { chubby, legs, set } = useCow();
  return (
    <div className="flex flex-col gap-2">
      <Slider label="Chubby" value={chubby} onChange={(v) => set({ chubby: v })} />
      <Slider label="Legs" value={legs} onChange={(v) => set({ legs: v })} />
    </div>
  );
}

function OptionsPanel<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {options.map((o) => (
        <Chip key={o.id} active={value === o.id} onClick={() => onChange(o.id)}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

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

/** Keeps the URL hash in sync with the cow so any cow can be shared as a link. */
function useCowInUrl() {
  useEffect(() => {
    const fromUrl = decodeCow(window.location.hash);
    if (fromUrl) useCow.getState().set(fromUrl);

    const write = () => {
      history.replaceState(null, "", `#${encodeCow(useCow.getState())}`);
    };
    write();
    return useCow.subscribe((s, prev) => {
      if (s.moos === prev.moos) write();
    });
  }, []);
}

export function Builder() {
  const [tab, setTab] = useState<TabId>("breed");
  const [copied, setCopied] = useState(false);
  useCowInUrl();

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  const horns = useCow((s) => s.horns);
  const extra = useCow((s) => s.extra);
  const set = useCow((s) => s.set);
  const randomize = useCow((s) => s.randomize);

  return (
    <main className="relative h-dvh w-full overflow-hidden" style={{ background: CREAM }}>
      <div id="cow-canvas" className="absolute inset-0">
        <Scene />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-5">
        <h1 className="text-lg font-semibold tracking-tight text-stone-800">vaquita</h1>
        <div className="pointer-events-auto flex gap-2">
          <RoundButton label="Random cow" onClick={randomize}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
              <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
              <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
              <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
              <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
            </svg>
          </RoundButton>
          <RoundButton label="Copy link" onClick={copyLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 14a4.5 4.5 0 0 0 6.36 0l3-3a4.5 4.5 0 0 0-6.36-6.36l-1 1" />
              <path d="M14 10a4.5 4.5 0 0 0-6.36 0l-3 3a4.5 4.5 0 0 0 6.36 6.36l1-1" />
            </svg>
          </RoundButton>
          <RoundButton label="Download PNG" onClick={download}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v11" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 20h14" />
            </svg>
          </RoundButton>
        </div>
      </header>

      {copied && (
        <div className="cow-pop pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-stone-800 px-4 py-2 text-sm font-medium text-white shadow-lg">
          Link copied
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-4 pb-6">
        <div
          key={tab}
          className="cow-pop pointer-events-auto rounded-3xl bg-white/80 px-5 py-4 shadow-[0_4px_24px_rgba(80,60,40,0.10)] backdrop-blur"
        >
          {tab === "breed" && <BreedPanel />}
          {tab === "body" && <BodyPanel />}
          {tab === "horns" && (
            <OptionsPanel options={HORNS} value={horns} onChange={(v) => set({ horns: v })} />
          )}
          {tab === "extras" && (
            <OptionsPanel options={EXTRAS} value={extra} onChange={(v) => set({ extra: v })} />
          )}
        </div>

        <nav className="pointer-events-auto flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95"
              style={
                tab === t.id
                  ? { background: t.tint, color: "white" }
                  : { background: `${t.tint}33`, color: "#57534e" }
              }
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}

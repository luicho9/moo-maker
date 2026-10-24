import { create } from "zustand";

// Cows saved on this device. Storage can be missing or full (private windows,
// blocked site data), so every access is guarded and the gallery still works for
// the session without it.

export type SavedCow = { id: string; hash: string; thumb: string; at: number };

const KEY = "moo-maker:gallery";
const LIMIT = 24;

function read(): SavedCow[] {
  try {
    const items = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function write(items: SavedCow[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

type GalleryStore = {
  items: SavedCow[];
  ready: boolean;
  hydrate: () => void;
  add: (hash: string, thumb: string) => boolean;
  remove: (id: string) => void;
};

export const useGallery = create<GalleryStore>((set, get) => ({
  items: [],
  ready: false,
  hydrate: () => {
    if (!get().ready) set({ items: read(), ready: true });
  },
  add: (hash, thumb) => {
    const items = [{ id: crypto.randomUUID(), hash, thumb, at: Date.now() }, ...get().items].slice(0, LIMIT);
    set({ items });
    return write(items);
  },
  remove: (id) => {
    const items = get().items.filter((c) => c.id !== id);
    set({ items });
    write(items);
  },
}));

// A small copy of the middle of the canvas, where the cow stands, for the gallery grid.
export function thumbnail(src: HTMLCanvasElement, width = 192, height = 144) {
  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const h = Math.min(src.height, (src.width * height) / width) * 0.7;
  const w = (h * width) / height;
  out
    .getContext("2d")!
    .drawImage(src, (src.width - w) / 2, (src.height - h) / 2, w, h, 0, 0, width, height);
  return out.toDataURL("image/webp", 0.8);
}

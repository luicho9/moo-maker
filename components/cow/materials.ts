import { useEffect, useState } from "react";
import * as THREE from "three";
import type { CowConfig } from "./params";
import { useCow } from "./store";

// One material per look, shared by every mesh that uses it. They live for the
// app's lifetime, so they're never disposed.
const cache = new Map<string, THREE.Material>();

function cached<T extends THREE.Material>(key: string, create: () => T) {
  let material = cache.get(key) as T | undefined;
  if (!material) {
    material = create();
    cache.set(key, material);
  }
  return material;
}

export const clay = (color: string, roughness = 0.5) =>
  cached(
    `clay:${color}:${roughness}`,
    () =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness,
        clearcoat: 0.3,
        clearcoatRoughness: 0.35,
      }),
  );

export const gloss = (color: string) =>
  cached(
    `gloss:${color}`,
    () =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.15,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
      }),
  );

export const gold = () =>
  cached(
    "gold",
    () => new THREE.MeshStandardMaterial({ color: "#E8B547", metalness: 0.85, roughness: 0.28 }),
  );

export const unlit = (color: string) =>
  cached(`unlit:${color}`, () => new THREE.MeshBasicMaterial({ color }));

type Look = "clay" | "gloss" | "metal";

function make(look: Look, roughness: number) {
  if (look === "metal") return new THREE.MeshStandardMaterial({ metalness: 0.85, roughness: 0.28 });
  if (look === "gloss")
    return new THREE.MeshPhysicalMaterial({ roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 });
  return new THREE.MeshPhysicalMaterial({ roughness, clearcoat: 0.3, clearcoatRoughness: 0.35 });
}

// For colors the user picks freely. The cache above would keep one material per
// color ever shown, so a color-picker drag would pile up hundreds. This owns one
// material and repaints it from the store without re-rendering anything.
// `select` must be stable (defined at module level).
export function useLiveMaterial(select: (s: CowConfig) => string, look: Look = "clay", roughness = 0.5) {
  const [material] = useState(() => {
    const m = make(look, roughness);
    m.color.set(select(useCow.getState()));
    return m;
  });
  useEffect(
    () =>
      useCow.subscribe((s, prev) => {
        const next = select(s);
        if (next !== select(prev)) material.color.set(next);
      }),
    [material, select],
  );
  useEffect(() => () => material.dispose(), [material]);
  return material;
}

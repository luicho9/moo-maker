import * as THREE from "three";

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

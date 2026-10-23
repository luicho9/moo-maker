"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { PopIn } from "./anim";

const HORN = "#F3E6CC";
const TUBULAR = 32;
const RADIAL = 16;

/** A tube along a smooth curve that tapers from `radius` down to `radius * tip`. */
function taperedTube(points: [number, number, number][], radius: number, tip: number) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const geometry = new THREE.TubeGeometry(curve, TUBULAR, radius, RADIAL, false);
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i <= TUBULAR; i++) {
    const t = i / TUBULAR;
    curve.getPointAt(t, c);
    const k = THREE.MathUtils.lerp(1, tip, t ** 1.3);
    for (let j = 0; j <= RADIAL; j++) {
      const idx = i * (RADIAL + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c);
      pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  return { geometry, end: curve.getPointAt(1), tipRadius: radius * tip };
}

const SHAPES = {
  nubs: {
    base: [-0.04, 0.33, 0.2],
    radius: 0.06,
    tip: 0.6,
    points: [
      [0, 0, 0],
      [0, 0.07, 0.03],
      [0.01, 0.12, 0.06],
    ],
  },
  long: {
    base: [-0.04, 0.3, 0.22],
    radius: 0.07,
    tip: 0.25,
    points: [
      [0, 0, 0],
      [0, 0.04, 0.14],
      [0.02, 0.12, 0.28],
      [0.06, 0.29, 0.34],
    ],
  },
} as const;

function Horn({ kind, side }: { kind: keyof typeof SHAPES; side: 1 | -1 }) {
  const shape = SHAPES[kind];
  const { geometry, end, tipRadius } = useMemo(
    () =>
      taperedTube(
        shape.points.map(([x, y, z]) => [x, y, z * side] as [number, number, number]),
        shape.radius,
        shape.tip,
      ),
    [shape, side],
  );
  const [bx, by, bz] = shape.base;

  return (
    <PopIn position={[bx, by, bz * side]}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color={HORN}
          roughness={0.4}
          clearcoat={0.3}
          clearcoatRoughness={0.35}
        />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[tipRadius, 16, 12]} />
        <meshPhysicalMaterial
          color={HORN}
          roughness={0.4}
          clearcoat={0.3}
          clearcoatRoughness={0.35}
        />
      </mesh>
    </PopIn>
  );
}

export function Horns({ kind }: { kind: "none" | keyof typeof SHAPES }) {
  if (kind === "none") return null;
  return (
    <>
      <Horn key={`${kind}+`} kind={kind} side={1} />
      <Horn key={`${kind}-`} kind={kind} side={-1} />
    </>
  );
}

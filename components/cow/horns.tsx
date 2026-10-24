"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { PopIn, type SpringState } from "./anim";
import { useLiveMaterial } from "./materials";
import { lerp, type CowConfig } from "./params";
import { useCow } from "./store";

const TUBULAR = 32;
const RADIAL = 16;

type Point = [number, number, number];

function taperedTube(points: Point[], radius: number, tip: number) {
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

// Long horns blend between sticking straight out (curl 0) and sweeping up into a lyre (curl 1).
const STRAIGHT: Point[] = [
  [0, 0, 0],
  [0, 0.02, 0.15],
  [0.02, 0.05, 0.3],
  [0.04, 0.08, 0.45],
];
const LYRE: Point[] = [
  [0, 0, 0],
  [0, 0.07, 0.13],
  [0.03, 0.22, 0.22],
  [0.09, 0.4, 0.18],
];

const SHAPES = {
  nubs: {
    base: [-0.04, 0.33, 0.2],
    radius: 0.06,
    tip: 0.6,
    points: () =>
      [
        [0, 0, 0],
        [0, 0.07, 0.03],
        [0.01, 0.12, 0.06],
      ] as Point[],
  },
  long: {
    base: [-0.04, 0.3, 0.22],
    radius: 0.07,
    tip: 0.25,
    points: (curl: number) =>
      STRAIGHT.map((p, i) => p.map((v, j) => lerp(v, LYRE[i][j], curl)) as Point),
  },
} as const;

type Kind = keyof typeof SHAPES;

const selectColor = (s: CowConfig) => s.hornColor;

function Horn({
  kind,
  side,
  curl,
  length,
  material,
}: {
  kind: Kind;
  side: 1 | -1;
  curl: number;
  length: SpringState;
  material: THREE.Material;
}) {
  const shape = SHAPES[kind];
  const grow = useRef<THREE.Group>(null);
  const { geometry, end, tipRadius } = useMemo(
    () =>
      taperedTube(
        shape.points(curl).map(([x, y, z]) => [x, y, z * side] as Point),
        shape.radius,
        shape.tip,
      ),
    [shape, side, curl],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => grow.current?.scale.setScalar(lerp(0.5, 1.5, length.x)));
  const [bx, by, bz] = shape.base;

  return (
    <PopIn position={[bx, by, bz * side]}>
      <group ref={grow}>
        <mesh geometry={geometry} material={material} />
        <mesh position={end} material={material}>
          <sphereGeometry args={[tipRadius, 16, 12]} />
        </mesh>
      </group>
    </PopIn>
  );
}

export function Horns({ length }: { length: SpringState }) {
  const kind = useCow((s) => s.horns);
  // Curl rebuilds the tube, so round it to keep slider drags from regenerating every pixel.
  const curl = useCow((s) => Math.round(s.hornCurl * 50) / 50);
  const material = useLiveMaterial(selectColor, "clay", 0.4);
  if (kind === "none") return null;
  return (
    <>
      <Horn key={`${kind}+`} kind={kind} side={1} curl={curl} length={length} material={material} />
      <Horn key={`${kind}-`} kind={kind} side={-1} curl={curl} length={length} material={material} />
    </>
  );
}

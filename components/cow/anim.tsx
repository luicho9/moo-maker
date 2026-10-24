"use client";

import { useFrame, type ThreeElements } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

export type SpringState = { x: number; v: number };

export function step(s: SpringState, target: number, dt: number, stiffness: number, damping: number) {
  const h = Math.min(dt, 1 / 30);
  s.v += (stiffness * (target - s.x) - damping * s.v) * h;
  s.x += s.v * h;
  if (Math.abs(target - s.x) < 1e-4 && Math.abs(s.v) < 1e-3) {
    s.x = target;
    s.v = 0;
    return true;
  }
  return false;
}

export function PopIn({ children, ...props }: Omit<ThreeElements["group"], "scale">) {
  const ref = useRef<THREE.Group>(null);
  const s = useRef<SpringState>({ x: 0, v: 0 });
  const done = useRef(false);
  useFrame((_, dt) => {
    if (done.current || !ref.current) return;
    done.current = step(s.current, 1, dt, 260, 14);
    ref.current.scale.setScalar(Math.max(s.current.x, 1e-4));
  });
  return (
    <group ref={ref} scale={1e-4} {...props}>
      {children}
    </group>
  );
}

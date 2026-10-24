"use client";

import { useFrame, type ThreeElements } from "@react-three/fiber";
import { useRef, useState } from "react";
import type * as THREE from "three";

type SpringState = { x: number; v: number };

function step(s: SpringState, target: number, dt: number, stiffness: number, damping: number) {
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

export function useSpringValue(target: number) {
  const [value, setValue] = useState(target);
  const s = useRef<SpringState>({ x: target, v: 0 });
  useFrame((_, dt) => {
    if (s.current.x === target && s.current.v === 0) return;
    step(s.current, target, dt, 170, 16);
    setValue(s.current.x);
  });
  return value;
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

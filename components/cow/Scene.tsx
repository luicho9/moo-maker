"use client";

import {
  Environment,
  Lightformer,
  OrbitControls,
} from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { EffectComposer, N8AO, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { BlobShadow } from "./BlobShadow";
import { Cow } from "./Cow";
import { CREAM } from "./store";

function neutral([r, g, b]: number[]) {
  const x = Math.min(r, g, b);
  const offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  let c = [r - offset, g - offset, b - offset];
  const peak = Math.max(...c);
  if (peak < 0.76) return c;
  const d = 0.24;
  const newPeak = 1 - (d * d) / (peak + d - 0.76);
  c = c.map((v) => (v * newPeak) / peak);
  const k = 1 - 1 / (0.15 * (peak - newPeak) + 1);
  return c.map((v) => v + (newPeak - v) * k);
}

const background = (() => {
  const target = new THREE.Color(CREAM).toArray();
  const x = [...target];
  for (let i = 0; i < 200; i++) {
    const y = neutral(x);
    for (let j = 0; j < 3; j++) x[j] += (target[j] - y[j]) * 2;
  }
  return new THREE.Color(x[0], x[1], x[2]);
})();

function FitCamera() {
  const get = useThree((s) => s.get);
  const aspect = useThree((s) => s.size.width / s.size.height);
  useEffect(() => {
    const { camera } = get();
    camera.zoom = Math.min(1, aspect / 1.25);
    camera.updateProjectionMatrix();
  }, [get, aspect]);
  return null;
}

export default function Scene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [5.1, 3.2, 6.9], fov: 32 }}
      gl={{ antialias: false, preserveDrawingBuffer: true }}
    >
      <color attach="background" args={[background.r, background.g, background.b]} />
      <hemisphereLight args={["#FFF6E8", "#D9C7AE", 0.6]} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} color="#FFF3E0" />

      <Environment resolution={256}>
        <Lightformer intensity={2} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer intensity={1.4} position={[-5, 2, 2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer intensity={0.8} position={[5, 2, 3]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer intensity={0.5} color="#FFE2C4" position={[0, 1, -5]} scale={[10, 4, 1]} />
      </Environment>

      <FitCamera />
      <Cow />

      <BlobShadow position={[0, 0, 0]} scale={[3.3, 1.8]} />

      <EffectComposer multisampling={8}>
        <N8AO aoRadius={0.5} distanceFalloff={0.6} intensity={3} color="#3B2A1E" quality="high" />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      </EffectComposer>

      <OrbitControls
        makeDefault
        target={[0.1, 0.75, 0]}
        enablePan={false}
        enableDamping
        minDistance={5}
        maxDistance={11}
        minPolarAngle={0.35}
        maxPolarAngle={1.45}
      />
    </Canvas>
  );
}

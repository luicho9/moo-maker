"use client";

import {
  Environment,
  Lightformer,
  OrbitControls,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { EffectComposer, N8AO, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { BlobShadow } from "./BlobShadow";
import { Cow } from "./Cow";
import { clay } from "./materials";
import type { CowConfig } from "./params";
import { flushSnapshots } from "./snapshot";
import { useCow } from "./store";

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

// Neutral tone mapping shifts every color, so solve for the input that comes out
// as the chosen background.
const solved = new Map<string, THREE.Color>();
function stageColor(hex: string) {
  let color = solved.get(hex);
  if (!color) {
    const target = new THREE.Color(hex).toArray();
    const x = [...target];
    for (let i = 0; i < 200; i++) {
      const y = neutral(x);
      for (let j = 0; j < 3; j++) x[j] += (target[j] - y[j]) * 2;
    }
    color = new THREE.Color(x[0], x[1], x[2]);
    solved.set(hex, color);
  }
  return color;
}

type Lighting = CowConfig["lighting"];
const LIGHTING: Record<
  Lighting,
  {
    sky: string;
    ground: string;
    hemi: number;
    sun: string;
    sunIntensity: number;
    sunPosition: [number, number, number];
    env: number;
    rim: string;
  }
> = {
  sunny: {
    sky: "#FFF6E8",
    ground: "#D9C7AE",
    hemi: 0.6,
    sun: "#FFF3E0",
    sunIntensity: 1.4,
    sunPosition: [3, 5, 4],
    env: 1,
    rim: "#FFE2C4",
  },
  golden: {
    sky: "#FFD9A8",
    ground: "#B08A6A",
    hemi: 0.5,
    sun: "#FFB46B",
    sunIntensity: 1.9,
    sunPosition: [-4, 2.2, 3],
    env: 0.7,
    rim: "#FF9E5E",
  },
  night: {
    sky: "#8EA2D9",
    ground: "#2A2F45",
    hemi: 0.4,
    sun: "#C3D0FF",
    sunIntensity: 0.8,
    sunPosition: [2, 6, -3],
    env: 0.35,
    rim: "#6C7FD1",
  },
};

// Fixed spots around the pasture so it looks the same every time.
const TUFTS = Array.from({ length: 22 }, (_, i) => {
  const a = i * 2.39996;
  const r = 1.3 + ((i * 37) % 10) / 10;
  return { x: Math.cos(a) * r, z: Math.sin(a) * r, h: 0.08 + ((i * 13) % 5) * 0.02, flower: i % 4 === 0 };
});

function Pasture() {
  return (
    <group raycast={() => null}>
      <mesh position={[0, -0.03, 0]} material={clay("#A8CF86", 0.9)}>
        <cylinderGeometry args={[2.5, 2.6, 0.06, 64]} />
      </mesh>
      {TUFTS.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh position={[0, t.h / 2, 0]} material={clay("#7FB55E", 0.8)}>
            <coneGeometry args={[0.04, t.h, 6]} />
          </mesh>
          {t.flower && (
            <mesh position={[0.05, 0.05, 0.02]} material={clay(i % 8 ? "#FFFFFF" : "#FFC94D")}>
              <sphereGeometry args={[0.035, 12, 8]} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

function Background() {
  const hex = useCow((s) => s.background);
  const c = stageColor(hex);
  return <color attach="background" args={[c.r, c.g, c.b]} />;
}

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

// Runs after EffectComposer's render (priority 1), while the frame is still readable.
function Snapshots() {
  const canvas = useThree((s) => s.gl.domElement);
  useFrame(() => flushSnapshots(canvas), 2);
  return null;
}

export default function Scene() {
  // Phones and tablets get lighter post-processing.
  const [coarse] = useState(() => window.matchMedia("(pointer: coarse)").matches);
  const lighting = useCow((s) => s.lighting);
  const ground = useCow((s) => s.ground);
  const light = LIGHTING[lighting];
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [5.1, 3.2, 6.9], fov: 32 }}
      gl={{ antialias: false }}
    >
      <Background />
      <hemisphereLight args={[light.sky, light.ground, light.hemi]} />
      <directionalLight position={light.sunPosition} intensity={light.sunIntensity} color={light.sun} />

      {/* The environment map renders once, so a new lighting remounts it. */}
      <Environment key={lighting} resolution={256} environmentIntensity={light.env}>
        <Lightformer intensity={2} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer intensity={1.4} position={[-5, 2, 2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer intensity={0.8} position={[5, 2, 3]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer intensity={0.5} color={light.rim} position={[0, 1, -5]} scale={[10, 4, 1]} />
      </Environment>

      <FitCamera />
      <Cow />

      {ground === "pasture" && <Pasture />}
      {ground !== "none" && <BlobShadow position={[0, 0, 0]} scale={[3.3, 1.8]} />}

      <EffectComposer multisampling={coarse ? 4 : 8}>
        <N8AO
          aoRadius={0.5}
          distanceFalloff={0.6}
          intensity={3}
          color="#3B2A1E"
          quality={coarse ? "medium" : "high"}
        />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      </EffectComposer>

      <Snapshots />

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

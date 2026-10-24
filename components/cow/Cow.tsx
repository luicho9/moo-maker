"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useShallow } from "zustand/react/shallow";
import { PopIn, useSpringValue } from "./anim";
import { BlobShadow } from "./BlobShadow";
import { Horns } from "./horns";
import { moo } from "./moo";
import { useSpotMaterial } from "./spotMaterial";
import { BREEDS, useCow, type CowConfig } from "./store";

const BODY_RADIUS = 0.6;
const BODY_LENGTH = 0.9;
const LEG_RADIUS = 0.17;
const CONFIG_KEYS: (keyof CowConfig)[] = ["breed", "spots", "seed", "chubby", "legs", "horns", "extra"];

function Clay({
  color,
  roughness = 0.5,
}: {
  color: string;
  roughness?: number;
}) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={roughness}
      clearcoat={0.3}
      clearcoatRoughness={0.35}
    />
  );
}

function Gloss({ color }: { color: string }) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={0.15}
      clearcoat={1}
      clearcoatRoughness={0.05}
    />
  );
}

function Gold() {
  return <meshStandardMaterial color="#E8B547" metalness={0.85} roughness={0.28} />;
}

export function Cow() {
  const cfg = useCow(
    useShallow((s) => ({
      breed: s.breed,
      spots: s.spots,
      seed: s.seed,
      chubby: s.chubby,
      legs: s.legs,
      horns: s.horns,
      extra: s.extra,
    })),
  );
  const breed = BREEDS[cfg.breed];

  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const bounce = useRef({ t: 10, amp: 0 });
  const mooT = useRef(10);

  const cowInverse = useMemo(() => ({ value: new THREE.Matrix4() }), []);
  const chubby = useSpringValue(cfg.chubby);
  const legs = useSpringValue(cfg.legs);
  const spots = useSpringValue(cfg.spots);

  const hide = useSpotMaterial({
    base: breed.base,
    spot: breed.spot,
    amount: spots,
    seed: cfg.seed,
    enabled: breed.spots,
    cowInverse,
  });

  useEffect(
    () =>
      useCow.subscribe((s, prev) => {
        if (s.moos !== prev.moos) {
          bounce.current = { t: 0, amp: 0.12 };
          mooT.current = 0;
        } else if (CONFIG_KEYS.some((k) => s[k] !== prev[k])) {
          bounce.current = { t: 0, amp: 0.07 };
        }
      }),
    [],
  );

  useFrame((state, dt) => {
    const time = state.clock.elapsedTime;
    const b = bounce.current;
    b.t += dt;
    mooT.current += dt;

    const squash = b.amp * Math.exp(-5 * b.t) * Math.sin(16 * b.t);
    const breathe = Math.sin(time * 2) * 0.008;
    if (root.current) {
      root.current.scale.set(1 + squash * 0.5, 1 - squash + breathe, 1 + squash * 0.5);
      root.current.updateMatrixWorld();
      cowInverse.value.copy(root.current.matrixWorld).invert();
    }
    if (head.current) {
      const lift = mooT.current < 1.2 ? Math.sin((mooT.current / 1.2) * Math.PI) * 0.35 : 0;
      head.current.rotation.z = Math.sin(time * 1.3) * 0.04 + lift;
      head.current.rotation.y = Math.sin(time * 0.7) * 0.08;
    }
    if (tail.current) {
      tail.current.rotation.x = Math.sin(time * 2.4) * 0.25;
    }
  });

  const s = 0.8 + 0.45 * chubby;
  const legLen = Math.max(0.1, 0.15 + 0.45 * legs);
  const bodyY = legLen + 0.19 + BODY_RADIUS * s;
  const front = BODY_LENGTH / 2 + BODY_RADIUS;
  const legX = BODY_LENGTH / 2 + 0.05;
  const legZ = 0.3 * s;

  return (
    <group
      ref={root}
      position={[-0.25, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        moo();
        useCow.getState().moo();
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <mesh
        position={[0, bodyY, 0]}
        rotation={[0, 0, Math.PI / 2]}
        scale={[s, 1, s]}
        material={hide}
      >
        <capsuleGeometry args={[BODY_RADIUS, BODY_LENGTH, 16, 48]} />
      </mesh>

      <mesh position={[-0.3, bodyY - BODY_RADIUS * s + 0.04, 0]} scale={[1, 0.7, 1]}>
        <sphereGeometry args={[0.17, 32, 24]} />
        <Clay color={breed.snout} />
      </mesh>

      {[
        [legX, legZ],
        [legX, -legZ],
        [-legX, legZ],
        [-legX, -legZ],
      ].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <BlobShadow scale={[0.75, 0.75]} />
          <mesh position={[0, legLen / 2 + LEG_RADIUS, 0]} material={hide}>
            <capsuleGeometry args={[LEG_RADIUS, legLen, 12, 32]} />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[LEG_RADIUS + 0.01, LEG_RADIUS + 0.02, 0.14, 32]} />
            <Clay color={breed.hoof} roughness={0.35} />
          </mesh>
        </group>
      ))}

      <group ref={tail} position={[-front + 0.08, bodyY + 0.25 * s, 0]} rotation={[0, 0, -0.35]}>
        <mesh position={[0, -0.3, 0]} material={hide}>
          <capsuleGeometry args={[0.035, 0.5, 8, 16]} />
        </mesh>
        <mesh position={[0, -0.6, 0]} scale={[1, 1.4, 1]}>
          <sphereGeometry args={[0.08, 24, 16]} />
          <Clay color={breed.spots ? breed.spot : breed.hoof} />
        </mesh>
      </group>

      <group ref={head} position={[front + 0.12, bodyY + 0.32 * s, 0]}>
        <mesh scale={[1.05, 0.95, 0.95]} material={hide}>
          <sphereGeometry args={[0.42, 48, 32]} />
        </mesh>

        {cfg.extra === "bell" && (
          <PopIn position={[-0.12, -0.2, 0]} rotation={[0, 0, 0.45]}>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.38, 0.045, 16, 48]} />
              <Clay color="#D9534F" />
            </mesh>
            <group position={[0, -0.5, 0]}>
              <mesh>
                <cylinderGeometry args={[0.07, 0.14, 0.2, 32]} />
                <Gold />
              </mesh>
              <mesh position={[0, 0.12, 0]}>
                <sphereGeometry args={[0.075, 24, 16]} />
                <Gold />
              </mesh>
              <mesh position={[0, -0.11, 0]}>
                <sphereGeometry args={[0.045, 16, 12]} />
                <Gold />
              </mesh>
            </group>
          </PopIn>
        )}

        <mesh position={[0.3, -0.13, 0]} scale={[0.75, 0.72, 1.12]}>
          <sphereGeometry args={[0.3, 48, 32]} />
          <Clay color={breed.snout} />
        </mesh>
        {[0.1, -0.1].map((z) => (
          <mesh key={z} position={[0.52, -0.08, z]} scale={[0.6, 1, 1]}>
            <sphereGeometry args={[0.04, 16, 12]} />
            <Clay color="#3A2A26" />
          </mesh>
        ))}

        {[0.21, -0.21].map((z) => (
          <group key={z} position={[0.3, 0.1, z]}>
            <mesh>
              <sphereGeometry args={[0.065, 24, 16]} />
              <Gloss color="#1E1A18" />
            </mesh>
            <mesh position={[0.045, 0.03, z > 0 ? -0.01 : 0.01]}>
              <sphereGeometry args={[0.018, 12, 8]} />
              <meshBasicMaterial color="white" />
            </mesh>
          </group>
        ))}

        {[1, -1].map((side) => (
          <mesh
            key={side}
            position={[-0.05, 0.14, side * 0.42]}
            rotation={[side * 1.8, 0, 0]}
            scale={[0.5, 1.3, 0.35]}
            material={hide}
          >
            <sphereGeometry args={[0.16, 32, 24]} />
          </mesh>
        ))}

        <Horns kind={cfg.horns} />

        {breed.tuft && (
          <PopIn position={[0.24, 0.26, 0]}>
            {[-0.18, -0.06, 0.06, 0.18].map((z, i) => (
              <mesh key={z} position={[0, -(i % 2) * 0.03, z]} scale={[0.8, 1.2, 0.9]}>
                <sphereGeometry args={[0.11, 24, 16]} />
                <Clay color="#B5622F" roughness={0.7} />
              </mesh>
            ))}
          </PopIn>
        )}

        {cfg.extra === "crown" && (
          <PopIn position={[-0.02, 0.31, 0]} rotation={[0, 0, -0.15]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.27, 0.025, 12, 48]} />
              <Clay color="#7BB662" />
            </mesh>
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return (
                <group key={i} position={[Math.cos(a) * 0.27, 0.02, Math.sin(a) * 0.27]}>
                  <mesh scale={[1, 0.6, 1]}>
                    <sphereGeometry args={[0.065, 20, 12]} />
                    <Clay color={["#FF8FB1", "#FFFFFF", "#FFC94D", "#B9A6EA"][i % 4]} />
                  </mesh>
                  <mesh position={[0, 0.035, 0]}>
                    <sphereGeometry args={[0.025, 12, 8]} />
                    <Clay color="#F2A93B" />
                  </mesh>
                </group>
              );
            })}
          </PopIn>
        )}
        {cfg.extra === "hat" && (
          <PopIn position={[-0.03, 0.38, 0]} rotation={[0, 0, -0.12]}>
            <mesh>
              <cylinderGeometry args={[0.46, 0.46, 0.035, 48]} />
              <Clay color="#C8955B" />
            </mesh>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.22, 0.25, 0.22, 48]} />
              <Clay color="#C8955B" />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.255, 0.255, 0.06, 48]} />
              <Clay color="#7A4B2A" />
            </mesh>
          </PopIn>
        )}
      </group>
    </group>
  );
}

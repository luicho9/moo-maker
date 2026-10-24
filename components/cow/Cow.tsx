"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useShallow } from "zustand/react/shallow";
import { PopIn, step, type SpringState } from "./anim";
import { BlobShadow } from "./BlobShadow";
import { Horns } from "./horns";
import { clay, gloss, gold, unlit } from "./materials";
import { moo } from "./moo";
import { useSpotMaterial } from "./spotMaterial";
import { BREEDS, useCow, type CowConfig } from "./store";

const BODY_RADIUS = 0.6;
const BODY_LENGTH = 0.9;
const LEG_RADIUS = 0.17;
const LEG_BOTTOM = 0.07; // inside the hoof
const FRONT = BODY_LENGTH / 2 + BODY_RADIUS;
const LEG_X = BODY_LENGTH / 2 + 0.05;
const LEGS = [
  [LEG_X, 1],
  [LEG_X, -1],
  [-LEG_X, 1],
  [-LEG_X, -1],
] as const;
const CONFIG_KEYS: (keyof CowConfig)[] = ["breed", "spots", "seed", "chubby", "legs", "horns", "extra"];
const FLOWERS = ["#FF8FB1", "#FFFFFF", "#FFC94D", "#B9A6EA"];

export function Cow() {
  // Chubby, legs and spots animate through springs read in useFrame, so only
  // the discrete choices re-render the cow.
  const cfg = useCow(
    useShallow((s) => ({
      breed: s.breed,
      seed: s.seed,
      horns: s.horns,
      extra: s.extra,
    })),
  );
  const breed = BREEDS[cfg.breed];

  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  const udder = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const legs = useRef<(THREE.Group | null)[]>([]);
  const shafts = useRef<(THREE.Mesh | null)[]>([]);
  const knees = useRef<(THREE.Mesh | null)[]>([]);
  const bounce = useRef({ t: 10, amp: 0 });
  const mooT = useRef(10);
  // Mutated in place every frame; state only gives it a one-time initializer.
  const [springs] = useState<Record<"chubby" | "legs" | "spots", SpringState>>(() => {
    const s = useCow.getState();
    return {
      chubby: { x: s.chubby, v: 0 },
      legs: { x: s.legs, v: 0 },
      spots: { x: s.spots, v: 0 },
    };
  });

  const cowInverse = useMemo(() => ({ value: new THREE.Matrix4() }), []);

  const { material: hide, setAmount } = useSpotMaterial({
    base: breed.base,
    spot: breed.spot,
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
    const target = useCow.getState();
    step(springs.chubby, target.chubby, dt, 170, 16);
    step(springs.legs, target.legs, dt, 170, 16);
    step(springs.spots, target.spots, dt, 170, 16);
    setAmount(springs.spots.x);

    const s = 0.8 + 0.45 * springs.chubby.x;
    const legLen = Math.max(0.1, 0.15 + 0.45 * springs.legs.x);
    const bodyY = legLen + 0.19 + BODY_RADIUS * s;
    const knee = legLen + LEG_RADIUS;

    body.current?.position.setY(bodyY);
    body.current?.scale.set(s, 1, s);
    udder.current?.position.setY(bodyY - BODY_RADIUS * s + 0.04);
    tail.current?.position.setY(bodyY + 0.25 * s);
    head.current?.position.setY(bodyY + 0.32 * s);
    LEGS.forEach(([, side], i) => {
      legs.current[i]?.position.setZ(side * 0.3 * s);
      shafts.current[i]?.position.setY((LEG_BOTTOM + knee) / 2);
      shafts.current[i]?.scale.setY(knee - LEG_BOTTOM);
      knees.current[i]?.position.setY(knee);
    });

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
      <mesh ref={body} rotation={[0, 0, Math.PI / 2]} material={hide}>
        <capsuleGeometry args={[BODY_RADIUS, BODY_LENGTH, 16, 48]} />
      </mesh>

      <mesh ref={udder} position-x={-0.3} scale={[1, 0.7, 1]} material={clay(breed.snout)}>
        <sphereGeometry args={[0.17, 32, 24]} />
      </mesh>

      {LEGS.map(([x], i) => (
        <group
          key={i}
          ref={(el) => {
            legs.current[i] = el;
          }}
          position-x={x}
        >
          <BlobShadow scale={[0.75, 0.75]} />
          <mesh
            ref={(el) => {
              shafts.current[i] = el;
            }}
            material={hide}
          >
            <cylinderGeometry args={[LEG_RADIUS, LEG_RADIUS, 1, 32, 1, true]} />
          </mesh>
          <mesh
            ref={(el) => {
              knees.current[i] = el;
            }}
            material={hide}
          >
            <sphereGeometry args={[LEG_RADIUS, 32, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh position={[0, 0.07, 0]} material={clay(breed.hoof, 0.35)}>
            <cylinderGeometry args={[LEG_RADIUS + 0.01, LEG_RADIUS + 0.02, 0.14, 32]} />
          </mesh>
        </group>
      ))}

      <group ref={tail} position-x={-FRONT + 0.08} rotation={[0, 0, -0.35]}>
        <mesh position={[0, -0.3, 0]} material={hide}>
          <capsuleGeometry args={[0.035, 0.5, 8, 16]} />
        </mesh>
        <mesh
          position={[0, -0.6, 0]}
          scale={[1, 1.4, 1]}
          material={clay(breed.spots ? breed.spot : breed.hoof)}
        >
          <sphereGeometry args={[0.08, 24, 16]} />
        </mesh>
      </group>

      <group ref={head} position-x={FRONT + 0.12}>
        <mesh scale={[1.05, 0.95, 0.95]} material={hide}>
          <sphereGeometry args={[0.42, 48, 32]} />
        </mesh>

        {cfg.extra === "bell" && (
          <PopIn position={[-0.12, -0.2, 0]} rotation={[0, 0, 0.45]}>
            <mesh rotation={[0, Math.PI / 2, 0]} material={clay("#D9534F")}>
              <torusGeometry args={[0.38, 0.045, 16, 48]} />
            </mesh>
            <group position={[0, -0.5, 0]}>
              <mesh material={gold()}>
                <cylinderGeometry args={[0.07, 0.14, 0.2, 32]} />
              </mesh>
              <mesh position={[0, 0.12, 0]} material={gold()}>
                <sphereGeometry args={[0.075, 24, 16]} />
              </mesh>
              <mesh position={[0, -0.11, 0]} material={gold()}>
                <sphereGeometry args={[0.045, 16, 12]} />
              </mesh>
            </group>
          </PopIn>
        )}

        <mesh position={[0.3, -0.13, 0]} scale={[0.75, 0.72, 1.12]} material={clay(breed.snout)}>
          <sphereGeometry args={[0.3, 48, 32]} />
        </mesh>
        {[0.1, -0.1].map((z) => (
          <mesh
            key={z}
            position={[0.52, -0.08, z]}
            scale={[0.6, 1, 1]}
            material={clay("#3A2A26")}
          >
            <sphereGeometry args={[0.04, 16, 12]} />
          </mesh>
        ))}

        {[0.21, -0.21].map((z) => (
          <group key={z} position={[0.3, 0.1, z]}>
            <mesh material={gloss("#1E1A18")}>
              <sphereGeometry args={[0.065, 24, 16]} />
            </mesh>
            <mesh position={[0.045, 0.03, z > 0 ? -0.01 : 0.01]} material={unlit("white")}>
              <sphereGeometry args={[0.018, 12, 8]} />
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
              <mesh
                key={z}
                position={[0, -(i % 2) * 0.03, z]}
                scale={[0.8, 1.2, 0.9]}
                material={clay("#B5622F", 0.7)}
              >
                <sphereGeometry args={[0.11, 24, 16]} />
              </mesh>
            ))}
          </PopIn>
        )}

        {cfg.extra === "crown" && (
          <PopIn position={[-0.02, 0.31, 0]} rotation={[0, 0, -0.15]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={clay("#7BB662")}>
              <torusGeometry args={[0.27, 0.025, 12, 48]} />
            </mesh>
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return (
                <group key={i} position={[Math.cos(a) * 0.27, 0.02, Math.sin(a) * 0.27]}>
                  <mesh scale={[1, 0.6, 1]} material={clay(FLOWERS[i % 4])}>
                    <sphereGeometry args={[0.065, 20, 12]} />
                  </mesh>
                  <mesh position={[0, 0.035, 0]} material={clay("#F2A93B")}>
                    <sphereGeometry args={[0.025, 12, 8]} />
                  </mesh>
                </group>
              );
            })}
          </PopIn>
        )}
        {cfg.extra === "hat" && (
          <PopIn position={[-0.03, 0.38, 0]} rotation={[0, 0, -0.12]}>
            <mesh material={clay("#C8955B")}>
              <cylinderGeometry args={[0.46, 0.46, 0.035, 48]} />
            </mesh>
            <mesh position={[0, 0.12, 0]} material={clay("#C8955B")}>
              <cylinderGeometry args={[0.22, 0.25, 0.22, 48]} />
            </mesh>
            <mesh position={[0, 0.06, 0]} material={clay("#7A4B2A")}>
              <cylinderGeometry args={[0.255, 0.255, 0.06, 48]} />
            </mesh>
          </PopIn>
        )}
      </group>
    </group>
  );
}

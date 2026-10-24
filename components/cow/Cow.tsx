"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Glasses, Headwear, Neckwear, NoseRing } from "./accessories";
import { step, type SpringState } from "./anim";
import { BlobShadow } from "./BlobShadow";
import { Horns } from "./horns";
import { clay, gloss, unlit, useLiveMaterial } from "./materials";
import { moo } from "./moo";
import { lerp, PARAM_KEYS, param, STAGE_GROUPS, type CowConfig, type NumberKey } from "./params";
import { useSpotMaterial } from "./spotMaterial";
import { useCow } from "./store";

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
const EAR_SCALE = [0.5, 1.3, 0.35] as const;

// Every slider eases toward its value through one of these springs, read in useFrame,
// so dragging never re-renders the cow.
const SPRING_KEYS = [
  "chubby",
  "legs",
  "spots",
  "spotScale",
  "spotEdge",
  "size",
  "headSize",
  "earSize",
  "earAngle",
  "snoutSize",
  "tail",
  "udder",
  "tuft",
  "hornLength",
  "blush",
] as const satisfies NumberKey[];
type SpringKey = (typeof SPRING_KEYS)[number];

// Changes that make the cow do a little hop. Colors are left out: a picker drag would
// keep restarting it.
const BOUNCE_KEYS = PARAM_KEYS.filter(
  (k) => param(k).kind !== "color" && !STAGE_GROUPS.includes(param(k).group),
);

const selectSnout = (s: CowConfig) => s.snout;
const selectHoof = (s: CowConfig) => s.hoof;
const selectTuft = (s: CowConfig) => s.tuftColor;
const selectTailTip = (s: CowConfig) =>
  s.pattern === "patches" || s.pattern === "dots" ? s.spot : s.hoof;

// Lids use the hide so they match whatever the coat pattern puts around the eyes.
function Eyes({ lid }: { lid: THREE.Material }) {
  const kind = useCow((s) => s.eyes);
  return (
    <>
      {[0.21, -0.21].map((z) => (
        <group key={z} position={[0.3, 0.1, z]}>
          {kind === "wink" && z > 0 ? (
            <mesh position={[0.04, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={gloss("#1E1A18")}>
              <torusGeometry args={[0.05, 0.013, 8, 20, Math.PI]} />
            </mesh>
          ) : (
            <>
              <mesh material={gloss("#1E1A18")}>
                <sphereGeometry args={[0.065, 24, 16]} />
              </mesh>
              <mesh position={[0.045, 0.03, z > 0 ? -0.01 : 0.01]} material={unlit("white")}>
                <sphereGeometry args={[0.018, 12, 8]} />
              </mesh>
            </>
          )}
          {kind === "sleepy" && (
            <mesh rotation={[0, 0, -0.45]} material={lid}>
              <sphereGeometry args={[0.072, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          )}
          {kind === "lashes" &&
            [-1, 0, 1].map((i) => (
              <mesh
                key={i}
                position={[0.015, 0.07, i * 0.028]}
                rotation={[i * 0.5 * Math.sign(z), 0, -0.3]}
                material={gloss("#1E1A18")}
              >
                <capsuleGeometry args={[0.007, 0.035, 4, 8]} />
              </mesh>
            ))}
        </group>
      ))}
    </>
  );
}

export function Cow() {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  const udder = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Group>(null);
  const headInner = useRef<THREE.Group>(null);
  const snout = useRef<THREE.Group>(null);
  const tuft = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const tailShaft = useRef<THREE.Mesh>(null);
  const tailTip = useRef<THREE.Mesh>(null);
  const ears = useRef<(THREE.Mesh | null)[]>([]);
  const cheeks = useRef<(THREE.Mesh | null)[]>([]);
  const legs = useRef<(THREE.Group | null)[]>([]);
  const shafts = useRef<(THREE.Mesh | null)[]>([]);
  const knees = useRef<(THREE.Mesh | null)[]>([]);
  const bounce = useRef({ t: 10, amp: 0 });
  const mooT = useRef(10);
  // Mutated in place every frame; state only gives it a one-time initializer.
  const [springs] = useState(() => {
    const s = useCow.getState();
    return Object.fromEntries(SPRING_KEYS.map((k) => [k, { x: s[k], v: 0 }])) as Record<
      SpringKey,
      SpringState
    >;
  });

  const cowInverse = useMemo(() => ({ value: new THREE.Matrix4() }), []);
  const { material: hide, setShape } = useSpotMaterial(cowInverse);
  const snoutMat = useLiveMaterial(selectSnout);
  const hoofMat = useLiveMaterial(selectHoof, "clay", 0.35);
  const tuftMat = useLiveMaterial(selectTuft, "clay", 0.7);
  const tailTipMat = useLiveMaterial(selectTailTip);

  useEffect(
    () =>
      useCow.subscribe((s, prev) => {
        if (s.moos !== prev.moos) {
          bounce.current = { t: 0, amp: 0.12 };
          mooT.current = 0;
        } else if (BOUNCE_KEYS.some((k) => s[k] !== prev[k])) {
          bounce.current = { t: 0, amp: 0.07 };
        }
      }),
    [],
  );

  useFrame((state, dt) => {
    const time = state.clock.elapsedTime;
    const target = useCow.getState();
    for (const k of SPRING_KEYS) step(springs[k], target[k], dt, 170, 16);
    const sp = (k: SpringKey) => springs[k].x;
    setShape(sp("spots"), sp("spotScale"), sp("spotEdge"));

    const s = 0.8 + 0.45 * sp("chubby");
    const legLen = Math.max(0.1, 0.15 + 0.45 * sp("legs"));
    const bodyY = legLen + 0.19 + BODY_RADIUS * s;
    const knee = legLen + LEG_RADIUS;
    const headScale = lerp(0.8, 1.2, sp("headSize"));

    body.current?.position.setY(bodyY);
    body.current?.scale.set(s, 1, s);
    if (udder.current) {
      const u = lerp(0.2, 1.8, sp("udder"));
      udder.current.position.setY(bodyY - BODY_RADIUS * s + 0.04);
      udder.current.scale.set(u, 0.7 * u, u);
    }
    tail.current?.position.setY(bodyY + 0.25 * s);
    const tailLen = lerp(0.6, 1.4, sp("tail"));
    tailShaft.current?.position.setY(-0.3 * tailLen);
    tailShaft.current?.scale.setY(tailLen);
    tailTip.current?.position.setY(-0.6 * tailLen);
    head.current?.position.set(FRONT + 0.12 + (headScale - 1) * 0.3, bodyY + 0.32 * s, 0);
    headInner.current?.scale.setScalar(headScale);
    snout.current?.scale.setScalar(lerp(0.8, 1.25, sp("snoutSize")));
    const earScale = lerp(0.6, 1.4, sp("earSize"));
    const earTilt = lerp(-0.5, 0.5, sp("earAngle"));
    ears.current.forEach((ear, i) => {
      const side = i ? -1 : 1;
      ear?.scale.set(EAR_SCALE[0] * earScale, EAR_SCALE[1] * earScale, EAR_SCALE[2] * earScale);
      ear?.rotation.set(side * (1.8 + earTilt), 0, 0);
    });
    if (tuft.current) {
      const t = sp("tuft") * 1.5;
      tuft.current.visible = t > 0.01;
      tuft.current.scale.setScalar(Math.max(t, 1e-4));
    }
    cheeks.current.forEach((cheek) => {
      if (!cheek) return;
      const b = sp("blush");
      cheek.visible = b > 0.01;
      cheek.scale.set(b, 0.65 * b, 0.3 * b);
    });
    LEGS.forEach(([, side], i) => {
      legs.current[i]?.position.setZ(side * 0.3 * s);
      shafts.current[i]?.position.setY((LEG_BOTTOM + knee) / 2);
      shafts.current[i]?.scale.setY(knee - LEG_BOTTOM);
      knees.current[i]?.position.setY(knee);
    });

    const b = bounce.current;
    b.t += dt;
    mooT.current += dt;

    const size = lerp(0.75, 1.25, sp("size"));
    const squash = b.amp * Math.exp(-5 * b.t) * Math.sin(16 * b.t);
    const breathe = Math.sin(time * 2) * 0.008;
    const dancing = target.idle === "dance";
    const chewing = target.idle === "chew";
    if (root.current) {
      root.current.scale.set(
        size * (1 + squash * 0.5),
        size * (1 - squash + breathe),
        size * (1 + squash * 0.5),
      );
      root.current.position.y = dancing ? Math.abs(Math.sin(time * 4)) * 0.12 : 0;
      root.current.rotation.y = dancing ? Math.sin(time * 2) * 0.3 : 0;
      root.current.updateMatrixWorld();
      cowInverse.value.copy(root.current.matrixWorld).invert();
    }
    if (head.current) {
      const lift = mooT.current < 1.2 ? Math.sin((mooT.current / 1.2) * Math.PI) * 0.35 : 0;
      const sway = dancing ? Math.sin(time * 4) * 0.15 : Math.sin(time * 1.3) * 0.04;
      head.current.rotation.z = sway + lift;
      head.current.rotation.y = Math.sin(time * 0.7) * 0.08;
    }
    if (snout.current) {
      snout.current.position.z = chewing ? Math.sin(time * 7) * 0.025 : 0;
      snout.current.rotation.x = chewing ? Math.sin(time * 7) * 0.08 : 0;
    }
    if (tail.current) {
      tail.current.rotation.x = Math.sin(time * (dancing ? 6 : 2.4)) * 0.25;
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

      <mesh ref={udder} position-x={-0.3} material={snoutMat}>
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
          <mesh position={[0, 0.07, 0]} material={hoofMat}>
            <cylinderGeometry args={[LEG_RADIUS + 0.01, LEG_RADIUS + 0.02, 0.14, 32]} />
          </mesh>
        </group>
      ))}

      <group ref={tail} position-x={-FRONT + 0.08} rotation={[0, 0, -0.35]}>
        <mesh ref={tailShaft} material={hide}>
          <capsuleGeometry args={[0.035, 0.5, 8, 16]} />
        </mesh>
        <mesh ref={tailTip} scale={[1, 1.4, 1]} material={tailTipMat}>
          <sphereGeometry args={[0.08, 24, 16]} />
        </mesh>
      </group>

      <group ref={head} position-x={FRONT + 0.12}>
        <group ref={headInner}>
          <mesh scale={[1.05, 0.95, 0.95]} material={hide}>
            <sphereGeometry args={[0.42, 48, 32]} />
          </mesh>

          <Neckwear />

          <group ref={snout} position={[0.3, -0.13, 0]}>
            <mesh scale={[0.75, 0.72, 1.12]} material={snoutMat}>
              <sphereGeometry args={[0.3, 48, 32]} />
            </mesh>
            {[0.1, -0.1].map((z) => (
              <mesh key={z} position={[0.22, 0.05, z]} scale={[0.6, 1, 1]} material={clay("#3A2A26")}>
                <sphereGeometry args={[0.04, 16, 12]} />
              </mesh>
            ))}
            <NoseRing />
          </group>

          <Eyes lid={hide} />
          <Glasses />

          {[0.31, -0.31].map((z, i) => (
            <mesh
              key={z}
              ref={(el) => {
                cheeks.current[i] = el;
              }}
              position={[0.24, -0.04, z]}
              material={clay("#FF8FA3", 0.7)}
            >
              <sphereGeometry args={[0.075, 20, 12]} />
            </mesh>
          ))}

          {[1, -1].map((side, i) => (
            <mesh
              key={side}
              ref={(el) => {
                ears.current[i] = el;
              }}
              position={[-0.05, 0.14, side * 0.42]}
              material={hide}
            >
              <sphereGeometry args={[0.16, 32, 24]} />
            </mesh>
          ))}

          <Horns length={springs.hornLength} />

          <group ref={tuft} position={[0.24, 0.26, 0]}>
            {[-0.18, -0.06, 0.06, 0.18].map((z, i) => (
              <mesh key={z} position={[0, -(i % 2) * 0.03, z]} scale={[0.8, 1.2, 0.9]} material={tuftMat}>
                <sphereGeometry args={[0.11, 24, 16]} />
              </mesh>
            ))}
          </group>

          <Headwear />
        </group>
      </group>
    </group>
  );
}

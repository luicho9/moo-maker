"use client";

import { PopIn } from "./anim";
import { clay, gold, useLiveMaterial } from "./materials";
import type { CowConfig } from "./params";
import { useCow } from "./store";

// Everything here is placed in head space: +x is forward, +y up.

const FLOWERS = ["#FFFFFF", "#FFC94D", "#B9A6EA"];

const headColor = (s: CowConfig) => s.headColor;
const neckColor = (s: CowConfig) => s.neckColor;
const faceColor = (s: CowConfig) => s.faceColor;

export function Headwear() {
  const kind = useCow((s) => s.headwear);
  const color = useLiveMaterial(headColor);

  if (kind === "crown")
    return (
      <PopIn position={[-0.02, 0.31, 0]} rotation={[0, 0, -0.15]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={clay("#7BB662")}>
          <torusGeometry args={[0.27, 0.025, 12, 48]} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <group key={i} position={[Math.cos(a) * 0.27, 0.02, Math.sin(a) * 0.27]}>
              <mesh scale={[1, 0.6, 1]} material={i % 2 ? clay(FLOWERS[(i >> 1) % 3]) : color}>
                <sphereGeometry args={[0.065, 20, 12]} />
              </mesh>
              <mesh position={[0, 0.035, 0]} material={clay("#F2A93B")}>
                <sphereGeometry args={[0.025, 12, 8]} />
              </mesh>
            </group>
          );
        })}
      </PopIn>
    );

  if (kind === "hat")
    return (
      <PopIn position={[-0.03, 0.38, 0]} rotation={[0, 0, -0.12]}>
        <mesh material={color}>
          <cylinderGeometry args={[0.46, 0.46, 0.035, 48]} />
        </mesh>
        <mesh position={[0, 0.12, 0]} material={color}>
          <cylinderGeometry args={[0.22, 0.25, 0.22, 48]} />
        </mesh>
        <mesh position={[0, 0.06, 0]} material={clay("#7A4B2A")}>
          <cylinderGeometry args={[0.255, 0.255, 0.06, 48]} />
        </mesh>
      </PopIn>
    );

  if (kind === "party")
    return (
      <PopIn position={[-0.05, 0.36, 0]} rotation={[0, 0, -0.22]}>
        <mesh position={[0, 0.24, 0]} material={color}>
          <coneGeometry args={[0.2, 0.48, 40]} />
        </mesh>
        {[0.08, 0.24].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={clay("#FFFFFF")}>
            <torusGeometry args={[0.2 * (1 - y / 0.48) + 0.004, 0.018, 8, 40]} />
          </mesh>
        ))}
        <mesh position={[0, 0.5, 0]} material={clay("#FFFFFF", 0.8)}>
          <sphereGeometry args={[0.06, 20, 14]} />
        </mesh>
      </PopIn>
    );

  return null;
}

export function Neckwear() {
  const kind = useCow((s) => s.neckwear);
  const color = useLiveMaterial(neckColor);
  if (kind === "none") return null;

  return (
    <PopIn key={kind} position={[-0.12, -0.2, 0]} rotation={[0, 0, 0.45]}>
      <mesh rotation={[0, Math.PI / 2, 0]} material={color}>
        <torusGeometry args={[0.38, kind === "bandana" ? 0.06 : kind === "bowtie" ? 0.02 : 0.045, 16, 48]} />
      </mesh>

      {kind === "bell" && (
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
      )}

      {kind === "bandana" && (
        <mesh position={[0.04, -0.5, 0]} rotation={[0, 0, Math.PI]} scale={[0.3, 1, 1]} material={color}>
          <coneGeometry args={[0.24, 0.32, 3]} />
        </mesh>
      )}

      {kind === "bowtie" && (
        <group position={[0.03, -0.42, 0]} scale={[0.55, 1, 1]}>
          {[1, -1].map((side) => (
            <mesh
              key={side}
              position={[0, 0, -side * 0.08]}
              rotation={[(side * Math.PI) / 2, 0, 0]}
              material={color}
            >
              <coneGeometry args={[0.09, 0.16, 24]} />
            </mesh>
          ))}
          <mesh material={color}>
            <sphereGeometry args={[0.04, 16, 12]} />
          </mesh>
        </group>
      )}
    </PopIn>
  );
}

export function Glasses() {
  const kind = useCow((s) => s.facewear);
  const frame = useLiveMaterial(faceColor, "gloss");
  if (kind !== "glasses") return null;
  return (
    <PopIn position={[0.42, 0.11, 0]}>
      {[0.2, -0.2].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <mesh rotation={[0, Math.PI / 2, 0]} material={frame}>
            <torusGeometry args={[0.09, 0.014, 12, 40]} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[0.085, 32]} />
            <meshBasicMaterial color="#DDEFF7" transparent opacity={0.25} depthWrite={false} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.03, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={frame}>
        <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
      </mesh>
    </PopIn>
  );
}

// Lives in snout space so it follows the snout's size.
export function NoseRing() {
  const kind = useCow((s) => s.facewear);
  const metal = useLiveMaterial(faceColor, "metal");
  if (kind !== "nosering") return null;
  return (
    <PopIn position={[0.215, -0.04, 0]}>
      <mesh material={metal}>
        <torusGeometry args={[0.06, 0.012, 12, 32]} />
      </mesh>
    </PopIn>
  );
}

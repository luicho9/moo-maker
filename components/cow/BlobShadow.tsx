"use client";

import * as THREE from "three";

let texture: THREE.CanvasTexture | null = null;

function getTexture() {
  if (texture) return texture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(70,48,30,1)");
  g.addColorStop(0.5, "rgba(70,48,30,0.5)");
  g.addColorStop(1, "rgba(70,48,30,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function BlobShadow({
  position = [0, 0, 0],
  scale = [1, 1],
  opacity = 1,
}: {
  position?: [number, number, number];
  scale?: [number, number];
  opacity?: number;
}) {
  return (
    <mesh
      position={[position[0], position[1] + 0.002, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[scale[0], scale[1], 1]}
      raycast={() => null}
    >
      <planeGeometry />
      <meshBasicMaterial map={getTexture()} transparent depthWrite={false} opacity={opacity} />
    </mesh>
  );
}

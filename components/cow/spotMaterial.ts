import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { CowConfig, Pattern } from "./params";
import { useCow } from "./store";

const NOISE = `
vec3 cs_mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 cs_mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 cs_permute(vec4 x){return cs_mod289(((x*34.0)+1.0)*x);}
vec4 cs_taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float cs_snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=cs_mod289(i);
  vec4 p=cs_permute(cs_permute(cs_permute(
    i.z+vec4(0.0,i1.z,i2.z,1.0))
    +i.y+vec4(0.0,i1.y,i2.y,1.0))
    +i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=cs_taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

// Cellular noise for the dots pattern: distance to the nearest jittered point.
const WORLEY = `
float cs_worley(vec3 p){
  vec3 i=floor(p);
  vec3 f=fract(p);
  float d=1.0;
  for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)for(int z=-1;z<=1;z++){
    vec3 g=vec3(float(x),float(y),float(z));
    vec3 c=i+g;
    vec3 h=fract(sin(vec3(dot(c,vec3(127.1,311.7,74.7)),dot(c,vec3(269.5,183.3,246.1)),dot(c,vec3(113.5,271.9,124.6))))*43758.5453);
    d=min(d,length(g+0.15+0.7*h-f));
  }
  return d;
}
`;

const PATTERN_IDS: Record<Pattern, number> = { none: 0, patches: 1, dots: 2, belt: 3, face: 4 };

const selectPaint = (s: CowConfig) => [s.base, s.spot, s.seed, s.pattern] as const;

// The hide's colors and pattern come straight from the store; amount, size and
// sharpness are springs the cow feeds in every frame through setShape.
export function useSpotMaterial(cowInverse: { value: THREE.Matrix4 }) {
  const { material, paint, setShape } = useMemo(() => {
    const uniforms = {
      uSpotColor: { value: new THREE.Color() },
      uAmount: { value: 0 },
      uScale: { value: 1 },
      uEdge: { value: 0.03 },
      uPattern: { value: 1 },
      uSeed: { value: new THREE.Vector3() },
      uCowInverse: cowInverse,
    };
    const material = new THREE.MeshPhysicalMaterial({
      roughness: 0.5,
      clearcoat: 0.3,
      clearcoatRoughness: 0.35,
    });
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform mat4 uCowInverse;\nvarying vec3 vSpotPos;",
        )
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvSpotPos = (uCowInverse * modelMatrix * vec4(position, 1.0)).xyz;",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
uniform vec3 uSpotColor;
uniform float uAmount;
uniform float uScale;
uniform float uEdge;
uniform float uPattern;
uniform vec3 uSeed;
varying vec3 vSpotPos;
${NOISE}
${WORLEY}`,
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
vec3 sp = vSpotPos * uScale + uSeed;
float m = 0.0;
if (uPattern < 0.5) {
  m = 0.0;
} else if (uPattern < 1.5) {
  float n = cs_snoise(sp) + 0.35 * cs_snoise(sp * 2.7 + 11.0);
  float t = mix(0.85, -0.25, uAmount);
  m = smoothstep(t - uEdge, t + uEdge, n);
} else if (uPattern < 2.5) {
  float r = mix(0.08, 0.55, uAmount);
  float d = cs_worley(sp * 1.6);
  m = 1.0 - smoothstep(r - uEdge, r + uEdge, d);
} else if (uPattern < 3.5) {
  float w = mix(0.08, 0.55, uAmount);
  float x = abs(vSpotPos.x + 0.07 * cs_snoise(vSpotPos * 2.0 + uSeed));
  m = 1.0 - smoothstep(w - uEdge, w + uEdge, x);
} else {
  float front = mix(1.1, 0.5, uAmount);
  float x = vSpotPos.x + 0.06 * cs_snoise(vSpotPos * 3.0 + uSeed);
  m = smoothstep(front - uEdge, front + uEdge, x);
}
diffuseColor.rgb = mix(diffuseColor.rgb, uSpotColor, m);`,
        );
    };
    material.customProgramCacheKey = () => "cow-spots";

    const paint = (s: CowConfig) => {
      material.color.set(s.base);
      uniforms.uSpotColor.value.set(s.spot);
      uniforms.uSeed.value.set(s.seed * 1.37, s.seed * 0.71, s.seed * 2.13);
      uniforms.uPattern.value = PATTERN_IDS[s.pattern];
    };
    // Called every frame by the springs, so it skips React entirely.
    const setShape = (amount: number, scale: number, sharpness: number) => {
      uniforms.uAmount.value = amount;
      uniforms.uScale.value = THREE.MathUtils.lerp(0.8, 3.6, scale);
      uniforms.uEdge.value = THREE.MathUtils.lerp(0.15, 0.006, sharpness);
    };
    return { material, paint, setShape };
  }, [cowInverse]);

  useEffect(() => {
    paint(useCow.getState());
    return useCow.subscribe((s, prev) => {
      const a = selectPaint(s);
      const b = selectPaint(prev);
      if (a.some((v, i) => v !== b[i])) paint(s);
    });
  }, [paint]);

  useEffect(() => () => material.dispose(), [material]);

  return { material, setShape };
}

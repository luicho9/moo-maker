import { useEffect, useMemo } from "react";
import * as THREE from "three";

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

type SpotOptions = {
  base: string;
  spot: string;
  amount: number;
  seed: number;
  enabled: boolean;
  cowInverse: { value: THREE.Matrix4 };
};

export function useSpotMaterial({
  base,
  spot,
  amount,
  seed,
  enabled,
  cowInverse,
}: SpotOptions) {
  const { material, update } = useMemo(() => {
    const uniforms = {
      uSpotColor: { value: new THREE.Color() },
      uThreshold: { value: 0 },
      uSeed: { value: new THREE.Vector3() },
      uSpotOn: { value: 1 },
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
uniform float uThreshold;
uniform vec3 uSeed;
uniform float uSpotOn;
varying vec3 vSpotPos;
${NOISE}`,
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
vec3 sp = vSpotPos * 1.6 + uSeed;
float n = cs_snoise(sp) + 0.35 * cs_snoise(sp * 2.7 + 11.0);
float m = smoothstep(uThreshold - 0.03, uThreshold + 0.03, n);
diffuseColor.rgb = mix(diffuseColor.rgb, uSpotColor, m * uSpotOn);`,
        );
    };
    material.customProgramCacheKey = () => "cow-spots";

    const update = (o: Omit<SpotOptions, "cowInverse">) => {
      material.color.set(o.base);
      uniforms.uSpotColor.value.set(o.spot);
      uniforms.uThreshold.value = THREE.MathUtils.lerp(0.85, -0.25, o.amount);
      uniforms.uSeed.value.set(o.seed * 1.37, o.seed * 0.71, o.seed * 2.13);
      uniforms.uSpotOn.value = o.enabled ? 1 : 0;
    };
    return { material, update };
  }, [cowInverse]);

  useEffect(() => {
    update({ base, spot, amount, seed, enabled });
  }, [update, base, spot, amount, seed, enabled]);

  useEffect(() => () => material.dispose(), [material]);

  return material;
}

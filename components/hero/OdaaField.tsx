"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createOdaaField } from "./heroFieldGeometry";

/* ==========================================================================
   Odaa Field — one draw call, ~15k depth-layered particles.
   The tree is "home"; a moving light displaces the sand, a click splashes it
   outward, and a damped spring gathers it back. Trust health drives colour,
   density and turbulence.
   ========================================================================== */

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPointerStrength;
  uniform float uShock;
  uniform float uHealth;
  uniform float uReveal;
  uniform float uDensity;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform vec3  uPointer;

  attribute vec3  aRandom;
  attribute float aSize;
  attribute float aSeed;
  attribute float aTone;

  varying float vAlpha;
  varying float vTone;
  varying float vSeed;

  void main() {
    vec3 home = position;

    // canopy sways more than bark
    float sway = 0.012;
    if (aTone > 0.5) sway += 0.05;
    if (aTone > 2.5) sway += 0.03;

    vec3 drift = vec3(
      sin(uTime * 0.31 + aSeed * 12.0),
      cos(uTime * 0.27 + aSeed * 9.0) * 0.55,
      sin(uTime * 0.23 + aSeed * 7.0) * 0.65
    ) * sway;

    // a fractured network jitters
    float fracture = 1.0 - clamp(uHealth, 0.0, 1.0);
    vec3 jitter = vec3(
      sin(uTime * 7.7 + aSeed * 41.0),
      sin(uTime * 9.1 + aSeed * 57.0),
      sin(uTime * 6.3 + aSeed * 23.0)
    ) * fracture * (0.015 + 0.06 * aSeed);

    vec3 p = home + drift + jitter;

    // the pointer is a light that pushes the sand aside
    vec3 toPointer = p - uPointer;
    float d = length(toPointer.xy) + 0.0001;
    float influence = exp(-pow(d / 1.25, 2.0)) * uPointerStrength;
    p.xy += normalize(toPointer.xy + 0.0001) * influence * 0.45;
    p.x += (-toPointer.y / d) * influence * 0.18;
    p.y += ( toPointer.x / d) * influence * 0.18;
    p.z += influence * 0.22 * aRandom.z;

    // splash, then the spring gathers it back
    float blast = uShock * (0.3 + aSeed * 0.75) * exp(-d * 0.5);
    p += aRandom * blast;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float dist = max(0.6, -mv.z);
    gl_PointSize = (uSize * aSize * uPixelRatio) / dist;
    gl_PointSize *= 1.0 + blast * 1.4;
    if (aSeed > uDensity) gl_PointSize = 0.0;

    float depthFade = 1.0 - smoothstep(uFogNear, uFogFar, dist);
    float fromAxis = 1.0 - smoothstep(3.4, 6.5, length(p.xy));
    vAlpha = uReveal * (0.35 + 0.65 * aSeed) * mix(0.18, 1.0, depthFade) * mix(0.15, 1.0, fromAxis);
    vTone = aTone;
    vSeed = aSeed;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3  uColorBark;
  uniform vec3  uColorLeafLow;
  uniform vec3  uColorLeafMid;
  uniform vec3  uColorLeafHigh;
  uniform vec3  uColorGround;
  uniform vec3  uColorSpark;
  uniform vec3  uColorSparkAlt;
  uniform float uHealth;
  uniform float uOpacity;

  varying float vAlpha;
  varying float vTone;
  varying float vSeed;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dd = dot(uv, uv);
    if (dd > 0.25) discard;
    float a = 1.0 - smoothstep(0.0, 0.25, dd);
    a *= a;

    vec3 col = uColorBark;

    if (vTone > 0.5 && vTone < 1.5) {
      col = mix(uColorLeafLow, uColorLeafMid, smoothstep(0.0, 0.6, uHealth));
      col = mix(col, uColorLeafHigh, smoothstep(0.55, 1.0, uHealth));
    } else if (vTone > 1.5 && vTone < 2.5) {
      col = uColorGround;
    } else if (vTone > 2.5) {
      col = mix(uColorSpark, uColorSparkAlt, step(0.55, vSeed));
    }

    gl_FragColor = vec4(col, vAlpha * a * uOpacity);
    #include <colorspace_fragment>
  }
`;

type Palette = {
  bark: string;
  leafLow: string;
  leafMid: string;
  leafHigh: string;
  ground: string;
  spark: string;
  sparkAlt: string;
  opacity: number;
};

/** dark ground: glowing sand. paper ground: ink stipple. */
const PALETTES: Record<"dark" | "light", Palette> = {
  dark: {
    bark: "#8A5530",
    leafLow: "#8C3B1F",
    leafMid: "#D98E32",
    leafHigh: "#FFF8E7",
    ground: "#B08F6A",
    spark: "#FFAB3D",
    sparkAlt: "#4FE3C1",
    opacity: 1,
  },
  light: {
    bark: "#6B4A32",
    leafLow: "#9A8368",
    leafMid: "#7A5C3E",
    leafHigh: "#1A1512",
    ground: "#8A7458",
    spark: "#B26B1C",
    sparkAlt: "#2F6F63",
    opacity: 0.92,
  },
};

/* ---- camera framing (world units) ---------------------------------------- */
/** world-space width of the field — drives the fit on narrow viewports */
const FRAME_WIDTH = 5.6;
/** reference distance; sprite size and fog are expressed relative to it */
const REF_DIST = 8;
/** the camera sits above the tree base and looks slightly down */
const CAM_Y = 1.6;
const LOOK_Y = 0.55;

interface FieldProps {
  health: number;
  paper: boolean;
  pulse: number;
  density: number;
  reduced: boolean;
}

function Field({ health, paper, pulse, density, reduced }: FieldProps) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);

  const geometry = useMemo(() => {
    const field = createOdaaField({ density });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(field.position, 3));
    g.setAttribute("aRandom", new THREE.BufferAttribute(field.aRandom, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(field.aSize, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(field.aSeed, 1));
    g.setAttribute("aTone", new THREE.BufferAttribute(field.aTone, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.4, 0), 8);
    return g;
  }, [density]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector3(0, 0.6, 0) },
      uPointerStrength: { value: 0 },
      uShock: { value: 0 },
      uHealth: { value: health / 100 },
      uReveal: { value: 0 },
      uDensity: { value: 1 },
      uPixelRatio: { value: 1 },
      uSize: { value: 13 },
      uFogNear: { value: 4.5 },
      uFogFar: { value: 13 },
      uOpacity: { value: 1 },
      uColorBark: { value: new THREE.Color(PALETTES.dark.bark) },
      uColorLeafLow: { value: new THREE.Color(PALETTES.dark.leafLow) },
      uColorLeafMid: { value: new THREE.Color(PALETTES.dark.leafMid) },
      uColorLeafHigh: { value: new THREE.Color(PALETTES.dark.leafHigh) },
      uColorGround: { value: new THREE.Color(PALETTES.dark.ground) },
      uColorSpark: { value: new THREE.Color(PALETTES.dark.spark) },
      uColorSparkAlt: { value: new THREE.Color(PALETTES.dark.sparkAlt) },
    }),
    []
  );

  /* spring / pointer state lives in refs — no per-frame allocation */
  const pointerWorld = useRef(new THREE.Vector3(0, 0.6, 0));
  const pointerTarget = useRef(new THREE.Vector3(0, 0.6, 0));
  const pointerStrength = useRef(0);
  const pointerStrengthTarget = useRef(0);
  const shock = useRef(0);
  const shockVel = useRef(0);
  const reveal = useRef(0);
  const healthLerp = useRef(health / 100);
  const hit = useRef(new THREE.Vector3());

  /* palette swap — additive glow on dark ground, ink stipple on paper */
  useEffect(() => {
    const p = paper ? PALETTES.light : PALETTES.dark;
    uniforms.uColorBark.value.set(p.bark);
    uniforms.uColorLeafLow.value.set(p.leafLow);
    uniforms.uColorLeafMid.value.set(p.leafMid);
    uniforms.uColorLeafHigh.value.set(p.leafHigh);
    uniforms.uColorGround.value.set(p.ground);
    uniforms.uColorSpark.value.set(p.spark);
    uniforms.uColorSparkAlt.value.set(p.sparkAlt);
    uniforms.uOpacity.value = p.opacity;
    invalidate();
  }, [paper, uniforms, invalidate]);

  /* the cursor is the light: fade it in on enter, out on leave */
  useEffect(() => {
    const el = gl.domElement;
    const enter = () => {
      pointerStrengthTarget.current = 1;
    };
    const leave = () => {
      pointerStrengthTarget.current = 0;
    };
    const splash = () => {
      shockVel.current += 3.2;
    };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointerdown", splash);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerdown", splash);
    };
  }, [gl]);

  /* [space] / programmatic pulse */
  const lastPulse = useRef(pulse);
  useEffect(() => {
    if (pulse === lastPulse.current) return;
    lastPulse.current = pulse;
    shockVel.current += 3.2;
    invalidate();
  }, [pulse, invalidate]);

  /* reduced motion: one still, legible frame */
  useEffect(() => {
    if (!reduced) return;
    uniforms.uReveal.value = 1;
    uniforms.uHealth.value = health / 100;
    uniforms.uDensity.value = 1;
    uniforms.uTime.value = 0.6;

    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    const z = THREE.MathUtils.clamp(
      FRAME_WIDTH / (2 * Math.tan((cam.fov * Math.PI) / 360) * aspect),
      REF_DIST,
      15
    );
    cam.position.set(0, CAM_Y, z);
    cam.lookAt(aspect > 1.15 ? -0.7 : 0, LOOK_Y, 0);
    uniforms.uSize.value = 13 * (z / REF_DIST);
    uniforms.uFogNear.value = z * 0.62;
    uniforms.uFogFar.value = z * 1.8;
    invalidate();
  }, [reduced, health, camera, size.width, size.height, uniforms, invalidate]);

  useFrame((state, delta) => {
    if (reduced) return;
    const dt = Math.min(delta, 0.05);

    healthLerp.current += (health / 100 - healthLerp.current) * Math.min(1, dt * 2.4);
    uniforms.uHealth.value = healthLerp.current;
    uniforms.uDensity.value = 0.52 + 0.48 * healthLerp.current;

    if (reveal.current < 1) reveal.current = Math.min(1, reveal.current + dt * 0.5);
    uniforms.uReveal.value = reveal.current * reveal.current * (3 - 2 * reveal.current);

    /* pointer → world position on the z = 0 plane */
    const ndc = state.pointer;
    hit.current.set(ndc.x, ndc.y, 0.5).unproject(state.camera);
    hit.current.sub(state.camera.position).normalize();
    const denom = Math.abs(hit.current.z) < 1e-4 ? 1e-4 : hit.current.z;
    const travel = (0 - state.camera.position.z) / denom;
    pointerTarget.current.set(
      state.camera.position.x + hit.current.x * travel,
      state.camera.position.y + hit.current.y * travel,
      0
    );
    pointerWorld.current.lerp(pointerTarget.current, Math.min(1, dt * 9));
    uniforms.uPointer.value.copy(pointerWorld.current);

    pointerStrength.current +=
      (pointerStrengthTarget.current - pointerStrength.current) * Math.min(1, dt * 5);
    uniforms.uPointerStrength.value = pointerStrength.current;

    /* splash → damped oscillation → gather */
    shockVel.current += -shock.current * 26 * dt;
    shockVel.current *= Math.exp(-3.4 * dt);
    shock.current += shockVel.current * dt;
    uniforms.uShock.value = shock.current;

    uniforms.uTime.value += dt;
    uniforms.uPixelRatio.value = state.gl.getPixelRatio();

    /* framing: fit the field at any aspect, bias right on desktop, parallax */
    const aspect = state.size.width / Math.max(1, state.size.height);
    const cam = camera as THREE.PerspectiveCamera;
    const targetZ = THREE.MathUtils.clamp(
      FRAME_WIDTH / (2 * Math.tan((cam.fov * Math.PI) / 360) * aspect),
      REF_DIST,
      15
    );
    const ease = Math.min(1, dt * 3);
    camera.position.z += (targetZ - camera.position.z) * ease;
    camera.position.x += (ndc.x * 0.28 - camera.position.x) * ease;
    camera.position.y += (CAM_Y + ndc.y * 0.16 - camera.position.y) * ease;
    // desktop: aim left of centre so the field sits in the open right side
    camera.lookAt(aspect > 1.15 ? -0.7 : 0, LOOK_Y, 0);

    // keep sprite size and depth falloff relative to the distance, not absolute,
    // so the field reads the same on a phone as on an ultrawide
    uniforms.uSize.value = 13 * (camera.position.z / REF_DIST);
    uniforms.uFogNear.value = camera.position.z * 0.62;
    uniforms.uFogFar.value = camera.position.z * 1.8;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={paper ? THREE.NormalBlending : THREE.AdditiveBlending}
      />
    </points>
  );
}

export interface OdaaFieldProps {
  /** trust health, 0–100 */
  health: number;
  /** light "paper" ground */
  paper: boolean;
  /** increment to trigger a splash */
  pulse: number;
  className?: string;
}

export default function OdaaField({ health, paper, pulse, className }: OdaaFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);
  const [density, setDensity] = useState(1);
  const [visible, setVisible] = useState(true);
  const [supported, setSupported] = useState(true);

  /* motion preference + device budget */
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");

    const sync = () => {
      setReduced(motion.matches);
      setDensity(coarse.matches ? 0.45 : window.innerWidth < 768 ? 0.7 : 1);
    };
    sync();

    motion.addEventListener("change", sync);
    coarse.addEventListener("change", sync);
    return () => {
      motion.removeEventListener("change", sync);
      coarse.removeEventListener("change", sync);
    };
  }, []);

  /* graceful degradation when WebGL is unavailable */
  useEffect(() => {
    try {
      const probe = document.createElement("canvas");
      const ctx = probe.getContext("webgl2") || probe.getContext("webgl");
      setSupported(!!ctx);
    } catch {
      setSupported(false);
    }
  }, []);

  /* pause the render loop when the hero scrolls away */
  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => setVisible(entries[entries.length - 1]?.isIntersecting ?? true),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!supported) {
    return (
      <div
        ref={hostRef}
        aria-hidden
        className={`hero-field-fallback absolute inset-0 ${className ?? ""}`}
      />
    );
  }

  return (
    <div ref={hostRef} aria-hidden className={`hero-field absolute inset-0 ${className ?? ""}`}>
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: false,
          alpha: true,
          depth: false,
          stencil: false,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, CAM_Y, REF_DIST], fov: 42, near: 0.1, far: 60 }}
        frameloop={reduced ? "demand" : visible ? "always" : "never"}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        style={{ display: "block" }}
      >
        <Field health={health} paper={paper} pulse={pulse} density={density} reduced={reduced} />
      </Canvas>
    </div>
  );
}

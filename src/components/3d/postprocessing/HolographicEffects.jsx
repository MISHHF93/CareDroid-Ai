import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  DepthOfField,
  SSAO,
  Vignette,
  GodRays,
} from '@react-three/postprocessing';
import { BlendFunction, Effect } from 'postprocessing';
import { Uniform, Vector2 } from 'three';

const scanlineShader = /* glsl */ `
uniform float time;
uniform float intensity;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float lines = sin((uv.y * 1450.0) - (time * 18.0));
  float mask = smoothstep(0.2, 1.0, lines * 0.5 + 0.5);
  vec3 scan = vec3(0.1, 0.8, 1.0) * mask * intensity;
  outputColor = vec4(inputColor.rgb + scan * 0.2, inputColor.a);
}
`;

const filmGrainShader = /* glsl */ `
uniform float time;
uniform float strength;

float rand(vec2 n) {
  return fract(sin(dot(n, vec2(12.9898, 78.233))) * 43758.5453123);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float noise = rand(uv * vec2(1920.0, 1080.0) + time * 12.0) - 0.5;
  outputColor = vec4(inputColor.rgb + noise * strength, inputColor.a);
}
`;

const temporalUpscaleShader = /* glsl */ `
uniform float time;
uniform float strength;
uniform vec2 texelSize;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 jitter = vec2(
    sin(time * 17.0 + uv.y * 13.0),
    cos(time * 19.0 + uv.x * 11.0)
  ) * texelSize * 0.75;

  vec3 c0 = texture2D(inputBuffer, uv + jitter).rgb;
  vec3 c1 = texture2D(inputBuffer, uv - jitter).rgb;
  vec3 c2 = texture2D(inputBuffer, uv + vec2(texelSize.x, 0.0)).rgb;
  vec3 c3 = texture2D(inputBuffer, uv + vec2(0.0, texelSize.y)).rgb;
  vec3 smoothed = (c0 + c1 + c2 + c3) * 0.25;
  vec3 outColor = mix(inputColor.rgb, smoothed, strength);

  outputColor = vec4(outColor, inputColor.a);
}
`;

const sobelOutlineShader = /* glsl */ `
uniform vec2 texelSize;
uniform float thickness;
uniform float glowIntensity;
uniform float enabled;

float luminance(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (enabled < 0.5) {
    outputColor = inputColor;
    return;
  }

  vec2 t = texelSize * thickness;

  float tl = luminance(texture2D(inputBuffer, uv + vec2(-t.x, t.y)).rgb);
  float tc = luminance(texture2D(inputBuffer, uv + vec2(0.0, t.y)).rgb);
  float tr = luminance(texture2D(inputBuffer, uv + vec2(t.x, t.y)).rgb);
  float ml = luminance(texture2D(inputBuffer, uv + vec2(-t.x, 0.0)).rgb);
  float mr = luminance(texture2D(inputBuffer, uv + vec2(t.x, 0.0)).rgb);
  float bl = luminance(texture2D(inputBuffer, uv + vec2(-t.x, -t.y)).rgb);
  float bc = luminance(texture2D(inputBuffer, uv + vec2(0.0, -t.y)).rgb);
  float br = luminance(texture2D(inputBuffer, uv + vec2(t.x, -t.y)).rgb);

  float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
  float gy = -bl - 2.0 * bc - br + tl + 2.0 * tc + tr;
  float edge = clamp(length(vec2(gx, gy)) * 1.6, 0.0, 1.0);

  vec3 outlineColor = vec3(0.22, 0.95, 1.0);
  vec3 glow = outlineColor * edge * glowIntensity;
  outputColor = vec4(inputColor.rgb + glow, inputColor.a);
}
`;

class HologramScanlinesEffect extends Effect {
  constructor({ intensity = 0.75 } = {}) {
    super('HologramScanlinesEffect', scanlineShader, {
      blendFunction: BlendFunction.SCREEN,
      uniforms: new Map([
        ['time', new Uniform(0)],
        ['intensity', new Uniform(intensity)],
      ]),
    });
  }
}

class FilmGrainEffect extends Effect {
  constructor({ strength = 0.03 } = {}) {
    super('FilmGrainEffect', filmGrainShader, {
      blendFunction: BlendFunction.OVERLAY,
      uniforms: new Map([
        ['time', new Uniform(0)],
        ['strength', new Uniform(strength)],
      ]),
    });
  }
}

class SobelOutlineEffect extends Effect {
  constructor({ texelSize, thickness = 1.4, glowIntensity = 1.15, enabled = true } = {}) {
    super('SobelOutlineEffect', sobelOutlineShader, {
      blendFunction: BlendFunction.SCREEN,
      uniforms: new Map([
        ['texelSize', new Uniform(texelSize || new Vector2(1 / 1920, 1 / 1080))],
        ['thickness', new Uniform(thickness)],
        ['glowIntensity', new Uniform(glowIntensity)],
        ['enabled', new Uniform(enabled ? 1 : 0)],
      ]),
    });
  }
}

class TemporalUpscaleEffect extends Effect {
  constructor({ strength = 0.3, texelSize } = {}) {
    super('TemporalUpscaleEffect', temporalUpscaleShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map([
        ['time', new Uniform(0)],
        ['strength', new Uniform(strength)],
        ['texelSize', new Uniform(texelSize || new Vector2(1 / 1920, 1 / 1080))],
      ]),
    });
  }
}

function HologramScanlines({ intensity = 0.75 }) {
  const effect = useMemo(() => new HologramScanlinesEffect({ intensity }), [intensity]);

  useFrame(({ clock }) => {
    effect.uniforms.get('time').value = clock.getElapsedTime();
  });

  return <primitive object={effect} dispose={null} />;
}

function FilmGrain({ strength = 0.03 }) {
  const effect = useMemo(() => new FilmGrainEffect({ strength }), [strength]);

  useFrame(({ clock }) => {
    effect.uniforms.get('time').value = clock.getElapsedTime();
  });

  return <primitive object={effect} dispose={null} />;
}

function SobelOutline({ thickness = 1.4, glowIntensity = 1.15, enabled = true }) {
  const { size } = useThree();
  const texel = useMemo(() => new Vector2(1 / Math.max(size.width, 1), 1 / Math.max(size.height, 1)), [size.width, size.height]);

  const effect = useMemo(
    () => new SobelOutlineEffect({ texelSize: texel, thickness, glowIntensity, enabled }),
    [texel, thickness, glowIntensity, enabled]
  );

  useEffect(() => {
    effect.uniforms.get('texelSize').value = texel;
    effect.uniforms.get('enabled').value = enabled ? 1 : 0;
  }, [effect, texel, enabled]);

  return <primitive object={effect} dispose={null} />;
}

function TemporalUpscale({ strength = 0.28 }) {
  const { size } = useThree();
  const texel = useMemo(() => new Vector2(1 / Math.max(size.width, 1), 1 / Math.max(size.height, 1)), [size.width, size.height]);
  const effect = useMemo(() => new TemporalUpscaleEffect({ strength, texelSize: texel }), [strength, texel]);

  useFrame(({ clock }) => {
    effect.uniforms.get('time').value = clock.getElapsedTime();
    effect.uniforms.get('texelSize').value = texel;
  });

  return <primitive object={effect} dispose={null} />;
}

function GodRaySource({ sourceRef, position = [0, 2.6, 1.5], severity = 0 }) {
  const scale = 0.26 + Math.min(0.32, severity * 0.07);

  return (
    <mesh ref={sourceRef} position={position}>
      <sphereGeometry args={[scale, 32, 32]} />
      <meshBasicMaterial color={severity >= 3 ? '#ff5a5a' : '#8cf6ff'} transparent opacity={0.9} />
    </mesh>
  );
}

export default function HolographicEffects({
  severityScore = 0,
  focusDistance = 0.02,
  outlineThickness = 1.4,
  outlineGlow = 1.15,
  outlineEnabled = true,
  temporalUpscaleStrength = 0.3,
  lowQuality = false,
}) {
  const [godRaySource, setGodRaySource] = useState(null);
  const godRaySourceRef = useRef(null);

  const handleGodRayRef = (node) => {
    godRaySourceRef.current = node;
    setGodRaySource(node);
  };

  return (
    <>
      <GodRaySource sourceRef={handleGodRayRef} severity={severityScore} />

      <EffectComposer multisampling={lowQuality ? 0 : 4} autoClear={false}>
        <Bloom
          luminanceThreshold={0.8}
          luminanceSmoothing={0.2}
          intensity={2.5}
          radius={1.2}
          mipmapBlur
        />

        <Bloom
          luminanceThreshold={0.72}
          luminanceSmoothing={0.18}
          intensity={lowQuality ? 0.55 : 0.9}
          radius={0.9}
          mipmapBlur
        />

        {!lowQuality && (
          <DepthOfField
            focusDistance={focusDistance}
            focalLength={0.02}
            bokehScale={3.25}
            height={720}
          />
        )}

        {!lowQuality && (
          <SSAO
            blendFunction={BlendFunction.MULTIPLY}
            samples={24}
            rings={4}
            radius={0.28}
            intensity={16}
            luminanceInfluence={0.55}
            color="black"
          />
        )}

        {godRaySource ? (
          <GodRays
            sun={godRaySource}
            blendFunction={BlendFunction.SCREEN}
            samples={48}
            density={0.95}
            decay={0.92}
            weight={0.45}
            exposure={0.55}
            clampMax={1}
            blur
          />
        ) : null}

        <ChromaticAberration offset={new Vector2(0.002, 0.002)} radialModulation modulationOffset={0.15} />
        <Vignette eskil={false} offset={0.26} darkness={0.5} />
        <FilmGrain strength={lowQuality ? 0.015 : 0.028} />
        <HologramScanlines intensity={lowQuality ? 0.55 : 0.78} />
        <TemporalUpscale strength={temporalUpscaleStrength} />
        <SobelOutline
          thickness={outlineThickness}
          glowIntensity={outlineGlow}
          enabled={outlineEnabled}
        />
      </EffectComposer>
    </>
  );
}

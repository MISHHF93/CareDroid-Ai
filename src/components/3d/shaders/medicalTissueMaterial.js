import * as THREE from 'three';

const vertexShader = /* glsl */ `
  varying vec3 vNormalWorld;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vNormalWorld;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uSeverity;
  uniform float uHeartbeat;
  uniform float uScattering;
  uniform float uAnisotropy;
  uniform float uMode;
  uniform vec3 uBaseColor;
  uniform vec3 uSubdermalColor;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float voronoi(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    float res = 8.0;

    for (int k = -1; k <= 1; k++) {
      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec3 b = vec3(float(i), float(j), float(k));
          vec3 r = b - f + vec3(hash(p + b));
          float d = dot(r, r);
          res = min(res, d);
        }
      }
    }

    return sqrt(res);
  }

  void main() {
    vec3 N = normalize(vNormalWorld);
    vec3 V = normalize(vViewDir);
    float NoV = clamp(dot(N, V), 0.0, 1.0);

    // Dual-lobe BRDF for tissue scattering (forward + backward)
    float forwardLobe = pow(max(0.0, dot(-V, N)), 1.45) * uScattering;
    float backwardLobe = pow(1.0 - NoV, 2.9) * (uScattering * 1.4);
    float subsurface = clamp(forwardLobe + backwardLobe, 0.0, 1.0);

    // Anisotropic highlight approximating muscle fiber direction
    vec3 T = normalize(cross(vec3(0.0, 1.0, 0.3), N));
    vec3 H = normalize(V + normalize(vec3(0.3, 0.8, 0.2)));
    float anisotropic = pow(abs(dot(T, H)), mix(18.0, 120.0, uAnisotropy));

    // Procedural micro detail for bone fracture patterns
    float fracture = smoothstep(0.08, 0.22, voronoi(vWorldPos * 2.2 + uTime * 0.08));

    float pulse = 0.92 + sin(uTime * (uHeartbeat / 60.0) * 6.28318530718) * 0.08;
    float severityTint = clamp(uSeverity / 4.0, 0.0, 1.0);

    vec3 tissue = mix(uBaseColor, uSubdermalColor, subsurface);
    tissue += vec3(1.0, 0.78, 0.74) * anisotropic * 0.22;

    // Mode mapping: 0 tissue, 1 bone, 2 neural
    if (uMode > 0.5 && uMode < 1.5) {
      vec3 boneColor = mix(vec3(0.95, 0.93, 0.9), vec3(0.83, 0.8, 0.76), fracture);
      tissue = mix(boneColor, vec3(0.66, 0.62, 0.58), fracture * 0.45);
      tissue += vec3(0.95) * anisotropic * 0.14;
    } else if (uMode >= 1.5) {
      float impulse = smoothstep(0.65, 1.0, sin(vWorldPos.y * 10.0 - uTime * 8.0) * 0.5 + 0.5);
      tissue = mix(vec3(0.16, 0.22, 0.34), vec3(0.23, 0.95, 1.0), impulse * 0.8 + backwardLobe * 0.3);
      tissue += vec3(0.2, 0.85, 1.0) * anisotropic * 0.26;
    }

    tissue = mix(tissue, vec3(0.95, 0.16, 0.13), severityTint * 0.32);
    tissue *= pulse;

    float fresnel = pow(1.0 - NoV, 3.5);
    tissue += vec3(0.45, 0.75, 1.0) * fresnel * 0.35;

    gl_FragColor = vec4(tissue, 0.96);
  }
`;

export function createMedicalTissueMaterial({
  baseColor = '#d86c6b',
  subdermalColor = '#ff9f8f',
  severity = 0,
  heartbeat = 72,
  scattering = 0.8,
  anisotropy = 0.6,
  mode = 0,
} = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSeverity: { value: Math.max(0, Math.min(4, severity)) },
      uHeartbeat: { value: Math.max(35, Math.min(220, heartbeat)) },
      uScattering: { value: scattering },
      uAnisotropy: { value: anisotropy },
      uMode: { value: mode },
      uBaseColor: { value: new THREE.Color(baseColor) },
      uSubdermalColor: { value: new THREE.Color(subdermalColor) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    vertexShader,
    fragmentShader,
  });
}

export function updateMedicalTissueUniforms(material, { time, severity, heartbeat } = {}) {
  if (!material?.uniforms) return;
  if (typeof time === 'number') material.uniforms.uTime.value = time;
  if (typeof severity === 'number') material.uniforms.uSeverity.value = Math.max(0, Math.min(4, severity));
  if (typeof heartbeat === 'number') material.uniforms.uHeartbeat.value = Math.max(35, Math.min(220, heartbeat));
}

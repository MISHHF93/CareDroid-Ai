// Holographic vertex shader
// Adds vertex displacement for a scanning-line / holographic shimmer effect

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

uniform float uTime;
uniform float uIntensity;

void main() {
  vUv = uv;
  vPosition = position;
  vNormal = normalize(normalMatrix * normal);

  // Subtle vertex displacement along Y based on a sine wave over time
  vec3 displaced = position;
  displaced.y += sin(position.x * 4.0 + uTime * 2.0) * uIntensity * 0.02;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}

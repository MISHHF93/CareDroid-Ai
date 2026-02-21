// Glassmorphism fragment shader
// Frosted-glass panel with subtle tint and blur approximation

varying vec2 vUv;

uniform vec3 uTint;       // Panel tint colour (e.g. deep blue)
uniform float uOpacity;   // Panel opacity (0.0 – 1.0)
uniform float uBlur;      // Blur intensity (visual only, driven by noise)
uniform float uTime;

// Pseudo-random noise for frosted-glass texture
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  // Frosted texture
  float n = noise(vUv * 80.0 + uTime * 0.05) * uBlur * 0.04;

  // Border highlight
  float border = smoothstep(0.0, 0.02, vUv.x) *
                 smoothstep(0.0, 0.02, vUv.y) *
                 smoothstep(0.0, 0.02, 1.0 - vUv.x) *
                 smoothstep(0.0, 0.02, 1.0 - vUv.y);

  vec3 colour = uTint + n;
  float alpha = uOpacity * border;

  gl_FragColor = vec4(colour, alpha);
}

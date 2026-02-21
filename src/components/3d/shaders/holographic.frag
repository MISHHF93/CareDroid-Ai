// Holographic fragment shader
// Renders cyan/purple scanline holographic effect with edge glow

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

uniform float uTime;
uniform vec3 uColor;      // Primary holographic colour (e.g. cyan)
uniform vec3 uColorAlt;   // Secondary colour (e.g. purple)
uniform float uOpacity;
uniform float uIntensity;

void main() {
  // Fresnel-style rim glow
  float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
  rim = pow(rim, 2.0) * uIntensity;

  // Horizontal scanlines
  float scanline = sin(vUv.y * 120.0 + uTime * 3.0) * 0.04 + 0.96;

  // Colour gradient between primary and alt colour
  float gradient = vUv.y + sin(uTime * 0.5) * 0.2;
  vec3 colour = mix(uColor, uColorAlt, clamp(gradient, 0.0, 1.0));

  // Edge glow
  colour += rim * uColor * 0.6;

  float alpha = uOpacity * (0.6 + rim * 0.4) * scanline;

  gl_FragColor = vec4(colour, alpha);
}

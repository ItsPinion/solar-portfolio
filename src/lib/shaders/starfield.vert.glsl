// ── Starfield points vertex shader ───────────────────────────────────────────
// Each star carries its own size, tint, phase and twinkle speed as attributes,
// so a single draw call renders the whole sky.
attribute float aSize;
attribute vec3 aColor;
attribute float aPhase;
attribute float aTwinkleSpeed;

uniform float uTime;
uniform float uPixelRatio;
uniform float uSizeScale;
uniform float uMinPixelSize;
uniform float uMaxPixelSize;
uniform float uTwinkleAmount;
uniform vec3 uFogColor;
uniform float uFogDensity;

varying vec3 vColor;
varying float vBrightness;

void main() {
  vColor = aColor;

  // Twinkle: every star breathes at its own rate/phase. amplitude is kept low
  // so the sky shimmers instead of strobing.
  float wave = sin(uTime * aTwinkleSpeed + aPhase);
  float pulse = 1.0 - uTwinkleAmount * 0.5 * (1.0 - wave);
  vBrightness = pulse;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  gl_Position = projectionMatrix * mvPosition;

  // Perspective size attenuation, clamped so distant stars stay visible and
  // near stars never become blobs.
  float attenuation = uSizeScale * (300.0 / -mvPosition.z);
  gl_PointSize = clamp(aSize * attenuation * uPixelRatio, uMinPixelSize, uMaxPixelSize);

  // Depth cue: fade the far shell of stars into the background colour.
  float depth = -mvPosition.z;
  float fogFactor = 1.0 - exp(-pow(uFogDensity * depth, 2.0));
  vColor = mix(vColor, uFogColor, fogFactor * 0.85);
}

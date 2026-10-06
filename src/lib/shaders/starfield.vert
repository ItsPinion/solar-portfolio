// Starfield point sprite — vertex stage.
// Attributes are uploaded from src/lib/starfield.ts (see Starfield.tsx).
//
// gl_PointSize is computed by hand instead of relying on PointsMaterial's
// sizeAttenuation so the same `aSize` value renders identically at every DPR.

attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;

uniform float uTime;
uniform float uScale; // half the drawing-buffer height, in device pixels
uniform float uTwinkle; // 0 = frozen (reduced motion), 1 = full shimmer
uniform float uSizeBoost; // quality-tier size multiplier

varying vec3 vColor;
varying float vBrightness;

void main() {
  vColor = aColor;

  // Two out-of-phase sines read as organic shimmer rather than a blunt blink.
  float t = uTime * 1.6 + aPhase * 6.28318530718;
  float shimmer = 0.5 + 0.3 * sin(t) + 0.2 * sin(t * 1.7 + 1.3);
  // Fade only the bright stars: mix() toward full brightness for the rest.
  vBrightness = mix(1.0, 0.55 + 0.45 * shimmer, uTwinkle * (0.35 + aPhase * 0.65));

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float size = aSize * uSizeBoost;
  gl_PointSize = max(1.0, size * (uScale / max(-mvPosition.z, 0.001)));
}

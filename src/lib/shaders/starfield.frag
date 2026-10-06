// Starfield point sprite — fragment stage.
// A tight core plus a soft halo gives stars a photographic falloff without
// any texture fetch, which matters on software rasterisers.

uniform float uOpacity;

varying vec3 vColor;
varying float vBrightness;

void main() {
  // gl_PointCoord is 0–1 across the sprite; 0.5 is its radius.
  vec2 offset = gl_PointCoord - vec2(0.5);
  float dist = length(offset);
  if (dist > 0.5) discard; // square points -> round stars

  float falloff = smoothstep(0.5, 0.0, dist);
  float core = pow(falloff, 3.0);
  float halo = pow(falloff, 1.4) * 0.35;

  gl_FragColor = vec4(vColor, (core + halo) * vBrightness * uOpacity);

  #include <colorspace_fragment>
}

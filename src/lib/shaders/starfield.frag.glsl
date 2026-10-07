// ── Starfield points fragment shader ─────────────────────────────────────────
varying vec3 vColor;
varying float vBrightness;

uniform float uFade;

void main() {
  // Round, soft-edged star: a tight bright core plus a wide halo, built from
  // the point's own texture coordinates (gl_PointCoord is centred by -0.5).
  vec2 uv = gl_PointCoord - vec2(0.5);
  float d = length(uv);

  if (d > 0.5) discard;

  float falloff = smoothstep(0.5, 0.0, d);
  float core = pow(falloff, 4.0);
  float halo = pow(falloff, 1.35) * 0.34;
  float mask = (core + halo) * vBrightness * uFade;

  // Radiance is pre-multiplied into RGB and the geometry is drawn with additive
  // blending, so overlapping stars and nebula haze accumulate like real light.
  // Values live in HDR (0 → ~3) and are tone mapped below.
  gl_FragColor = vec4(vColor * mask, 1.0);

  // Tone mapping / colour space conversion are injected by three's shader
  // preprocessor: `tonemapping_fragment` is a no-op whenever the renderer has
  // tone mapping switched off (i.e. when the post-processing composer takes
  // over and applies ACES itself at the end of the stack). Including it here is
  // what keeps the low tier (direct render) and the medium/high tier (composer)
  // looking the same.
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}

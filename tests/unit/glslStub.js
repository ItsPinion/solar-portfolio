/**
 * Webpack (next.config.mjs) imports GLSL files as raw source strings.
 * Jest has no such loader, so shader imports resolve to this stub.
 *
 * Shader *content* is asserted directly from disk in tests/unit/scene.test.ts,
 * which is stricter than a mock would be.
 */
module.exports = "/* glsl source (stubbed in jest — see tests/unit/scene.test.ts) */";

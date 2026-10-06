/** GLSL shader files are imported as raw source strings (see next.config.mjs). */
declare module "*.glsl" {
  const source: string;
  export default source;
}
declare module "*.vert" {
  const source: string;
  export default source;
}
declare module "*.frag" {
  const source: string;
  export default source;
}

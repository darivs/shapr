const STUBS = { "gpui-kit": "gpui-kit.js", "gpui-base": "gpui-base.js", herdr: "herdr.js" };
export async function resolve(spec, ctx, next) {
  if (STUBS[spec]) return { url: new URL(`./stubs/${STUBS[spec]}`, import.meta.url).href, shortCircuit: true };
  return next(spec, ctx);
}

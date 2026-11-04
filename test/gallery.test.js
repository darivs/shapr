// The gallery shows every kit component: it renders with Herdr's element methods and theme roles
// only, calls every function the kit's component modules export, and no sample is wider than
// the width under which the page scrolls instead of clipping.
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { readdirSync } from "node:fs";
import { reset } from "herdr";
import { unknownCalls, argsOf } from "./stubs/element.js";

const kitDir = new URL("../shapr/mods/shapr-gallery/kit/", import.meta.url);
const kitUrl = new URL("index.js", kitDir).href;
// Measures a component uses for itself; they draw nothing.
const MEASURES = new Set(["buttonMetrics"]);
// tokens, roles and state are the kit's plumbing, not components.
const PLUMBING = new Set(["index.js", "self.js", "tokens.js", "roles.js", "state.js"]);

// The gallery's "./kit/index.js" resolves to a copy of the kit whose functions count their calls.
const real = await import(kitUrl);
const fns = Object.keys(real).filter((k) => typeof real[k] === "function");
const counting = [`import * as R from ${JSON.stringify(kitUrl)};`, `export * from ${JSON.stringify(kitUrl)};`,
  "const calls = (globalThis.__kitCalls = new Map());",
  "const w = (n) => (...a) => { calls.set(n, (calls.get(n) ?? 0) + 1); return R[n](...a); };",
  ...fns.map((n) => `export const ${n} = w(${JSON.stringify(n)});`)].join("\n");
registerHooks({
  resolve(spec, ctx, next) {
    if (spec === "./kit/index.js" && ctx.parentURL?.endsWith("/shapr-gallery/main.js"))
      return { url: `data:text/javascript,${encodeURIComponent(counting)}`, shortCircuit: true };
    return next(spec, ctx);
  },
});
const { default: Gallery, MAX_ITEM, MIN_W, WIDE } = await import("../shapr/mods/shapr-gallery/main.js");

const open = () => { const v = new Gallery(); v.init({}, {}); return v; };
const components = async () => {
  const out = [];
  for (const f of readdirSync(kitDir).filter((f) => f.endsWith(".js") && !PLUMBING.has(f))) {
    const m = await import(new URL(f, kitDir).href);
    for (const [k, v] of Object.entries(m)) if (typeof v === "function" && !MEASURES.has(k)) out.push(k);
  }
  return out;
};

test("the gallery renders with Herdr's element methods and colors only from theme roles", () => {
  const h = reset({ props: { overlay: "o1" } });
  const tree = open().render();
  assert.deepEqual([...unknownCalls], []);
  const allowed = new Set(Object.values(h.theme));
  for (const m of ["bg", "text_color", "border_color"])
    for (const [c] of argsOf(tree, m)) assert.ok(allowed.has(c), `${m}(${c}) is not a theme role`);
});

test("the gallery calls every component function the kit exports", async () => {
  reset();
  globalThis.__kitCalls.clear();
  open().render();
  const want = await components();
  assert.ok(want.length > 30, "the kit's components were not found");
  const missing = want.filter((n) => !globalThis.__kitCalls.get(n));
  assert.deepEqual(missing, [], `not in the gallery: ${missing.join(", ")}`);
});

test("rows wrap: no sample is wider than MAX_ITEM, narrow windows stack the row names", () => {
  reset();
  const v = open();
  for (const width of [null, WIDE, WIDE - 1, MIN_W - 40]) {
    v.width = width;
    const tree = v.render();
    for (const m of ["w", "min_w", "max_w"])
      for (const [n] of argsOf(tree, m))
        if (typeof n === "number") assert.ok(n <= MAX_ITEM || (m === "min_w" && n === MIN_W), `${m}(${n}) at width ${width}`);
    assert.equal(argsOf(tree, "flex_wrap").length > 20, true);
  }
  // At 1.5 zoom a 1040 px window keeps names beside their samples; a narrow one stacks them.
  assert.ok(WIDE <= 1040 / 1.5, `WIDE ${WIDE}`);
  v.width = WIDE - 1;
  const narrow = v.render();
  v.width = WIDE;
  const wide = v.render();
  assert.ok(argsOf(wide, "w").some(([n]) => n === 96) && !argsOf(narrow, "w").some(([n]) => n === 96));
});

test("the gallery follows its measured width through layoutPx", () => {
  reset({ settings: { zoom: 1.5, dark: false } });
  const v = open();
  const tree = v.render();
  const onSize = argsOf(tree, "on_size_change")[0][0];
  let notified = 0;
  onSize({ width: 900, height: 600 }, { notify() { notified++; } });
  assert.equal(v.width, 600);
  onSize({ width: 900, height: 700 }, { notify() { notified++; } });
  assert.equal(notified, 1);
});

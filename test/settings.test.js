// The settings window: a change reaches shared "shapr.settings", defaults apply, an invalid hex is
// refused, reduced motion stops the kit animating, and settingsSize() (mod.json at standard
// density) is exactly what the window draws at every density.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { reset, shared } from "herdr";
import { unknownCalls, argsOf, texts, walk } from "./stubs/element.js";
import Settings, { PRESETS, CHOICES, WIDTH, parseSeed, settingsHeight, settingsSize } from "../shapr/mods/shapr-settings/main.js";
import * as K from "../shapr/mods/shapr-settings/kit/index.js";

const dir = new URL("../shapr/mods/shapr-settings/", import.meta.url);
const open = () => { const v = new Settings(); v.init({}, {}); return v; };
const MOTION = ["spring", "transition", "loop", "spin"];
// The element with this id, and a click on it (the kit's press handler).
const byId = (tree, id) => [...walk(tree)].find((n) => n?.calls?.some(([m, a]) => m === "id" && a[0] === id));
const click = (tree, id) => {
  const n = byId(tree, id);
  assert.ok(n, `no ${id}`);
  const h = n.calls.find(([m]) => m === "on_click");
  assert.ok(h, `${id} has no click`);
  h[1][0]({}, { stop_propagation() {}, notify() {} });
};

test("the window renders with Herdr's element methods, colors from theme roles or the preset seeds", () => {
  const h = reset();
  const tree = open().render();
  assert.deepEqual([...unknownCalls], []);
  const allowed = new Set([...Object.values(h.theme), ...PRESETS.map(([, s]) => s)]);
  for (const m of ["bg", "text_color", "border_color"])
    for (const [c] of argsOf(tree, m)) assert.ok(allowed.has(c), `${m}(${c})`);
  const src = readFileSync(new URL("main.js", dir), "utf8").replace(/^\s*\/\/.*$/gm, "");
  const hexes = src.match(/#[0-9a-fA-F]{6}\b/g) ?? [];
  assert.deepEqual(hexes, PRESETS.map(([, s]) => s), "hex outside the preset seed list");
  assert.match(readFileSync(new URL("main.js", dir), "utf8"), /^\/\/ style: md3\n/);
});

test("defaults apply when nothing is set, and Reset restores them", () => {
  reset();
  assert.deepEqual(K.prefs(), K.DEFAULTS);
  let tree = open().render();
  // The baseline swatch and every default segment are chosen (no click on what is chosen).
  assert.equal(byId(tree, "settings-seed-0").calls.some(([m]) => m === "on_click"), false);
  for (const key of ["contrast", "density", "corners"])
    assert.equal(byId(tree, `settings-${key}-${K.DEFAULTS[key]}`).calls.some(([m]) => m === "bg"), true, key);
  const v = open();
  v.set({ seed: "#006A6A", contrast: "high", density: "compact", corners: "round", motion: "calm" });
  tree = v.render();
  click(tree, "dialog-cancel");
  assert.deepEqual(shared(K.SETTINGS), K.DEFAULTS);
  assert.deepEqual(K.prefs(), K.DEFAULTS);
});

test("a change reaches shared state and restyles the kit", () => {
  reset();
  const v = open();
  const before = { h: K.H.sm, card: K.RADIUS.card };
  click(v.render(), "settings-seed-2");
  assert.equal(shared(K.SETTINGS).seed, PRESETS[2][1]);
  click(v.render(), "settings-contrast-high");
  click(v.render(), "settings-density-compact");
  click(v.render(), "settings-corners-round");
  click(v.render(), "settings-motion-calm");
  assert.deepEqual(shared(K.SETTINGS), { ...K.DEFAULTS, seed: PRESETS[2][1], contrast: "high", density: "compact", corners: "round", motion: "calm" });
  assert.equal(K.H.sm, before.h - 4);
  assert.ok(K.RADIUS.card > before.card);
  assert.equal(K.SPRING.spatial.damping, 1);
  // A valid hex applies as it is typed, with or without the #.
  v.type("b3261e");
  assert.equal(shared(K.SETTINGS).seed, "#B3261E");
});

test("an invalid hex is refused: the seed stays and the field says why", () => {
  reset();
  const v = open();
  v.type("#006A6A");
  for (const bad of ["#12345G", "teal", "#1234", "#1234567", "rgb(0,0,0)"]) {
    assert.equal(parseSeed(bad), null, bad);
    v.type(bad);
    assert.equal(shared(K.SETTINGS).seed, "#006A6A", bad);
    v.commit();
    assert.equal(v.error, true, bad);
    assert.equal(shared(K.SETTINGS).seed, "#006A6A", bad);
    const tree = v.render();
    assert.ok(texts(tree).some((t) => /six hex digits/.test(t)), "no error text");
    assert.ok(argsOf(tree, "border_color").some(([c]) => c === K.roles().error), "field not in error");
  }
  v.type("");
  v.commit();
  assert.equal(v.error, false, "an empty field is no error");
  assert.equal(shared(K.SETTINGS).seed, "#006A6A");
});

test("reduced motion makes the kit stop animating", () => {
  reset();
  const v = open();
  const moving = () => MOTION.flatMap((m) => argsOf(v.render(), m));
  assert.ok(moving().length > 0, "the preview should animate under expressive motion");
  click(v.render(), "settings-motion-reduced");
  assert.equal(shared(K.SETTINGS).motion, "reduced");
  assert.deepEqual(moving(), [], "reduced motion still animates");
  const kit = [K.toggleSwitch("s", true, null), K.statusMark("blocked"), K.linearProgress(100, 0.5), K.linearProgress(100, null)];
  assert.deepEqual(kit.flatMap((t) => MOTION.flatMap((m) => argsOf(t, m))), []);
});

test("the working spinner stops under reduced motion", () => {
  reset({ shared: { [K.SETTINGS]: { motion: "reduced" } } });
  assert.deepEqual(argsOf(K.statusMark("working"), "spin"), []);
});

// The height a stub tree lays out to on its own (no parent stretching it): fixed h/size, else its
// children stacked (column, block) or side by side (row) with gaps, padding and vertical margins,
// min_h on top; text is one line of the inherited line height; absolute children take no room.
function drawnHeight(x, line = null) {
  if (typeof x === "string" || typeof x === "number") { assert.ok(line, `text "${x}" without a line height`); return line; }
  const n = x?.__node;
  if (!n) return 0;
  let fixed = null, minH = 0, gap = 0, pt = 0, pb = 0, row = n.kind === "h_flex", flex = n.kind !== "div";
  for (const [m, [v]] of n.calls) {
    if (m === "line_height") line = parseFloat(v);
    else if ((m === "h" || m === "size") && typeof v === "number") fixed = v;
    else if (m === "min_h" && typeof v === "number") minH = v;
    else if (m === "gap") gap = v;
    else if (m === "p" || m === "py") pt = pb = v;
    else if (m === "pt") pt = v;
    else if (m === "pb") pb = v;
    else if (m === "flex") flex = true;
    else if (m === "flex_col") row = false;
    else if (m === "flex_row") row = true;
  }
  if (n.kind === "div" && !n.calls.some(([m]) => m === "flex")) row = false;
  if (fixed !== null) return fixed;
  if (n.kind === "Input") return line;
  const kids = n.children.filter((c) => !c?.__node?.calls.some(([m]) => m === "absolute")).map((c) => {
    let mt = 0, mb = 0;
    for (const [m, [v]] of c?.__node?.calls ?? []) { if (m === "my" || m === "m") mt = mb = v; else if (m === "mt") mt = v; else if (m === "mb") mb = v; }
    return drawnHeight(c, line) + mt + mb;
  });
  const g = flex ? gap : 0;
  const content = row ? Math.max(0, ...kids) : kids.reduce((a, b) => a + b, 0) + Math.max(0, kids.length - 1) * g;
  return Math.max(minH, content + pt + pb);
}

test("settingsSize() is what the window draws, at every density; mod.json holds the standard one", () => {
  reset();
  const j = JSON.parse(readFileSync(new URL("mod.json", dir), "utf8"));
  assert.deepEqual(j.overlay, { kind: "dialog", ...settingsSize(), frame: "none" });
  assert.equal(settingsSize().width, WIDTH);
  assert.equal(settingsSize().height, settingsHeight());
  const heights = {};
  for (const density of ["compact", "standard", "comfortable"]) {
    reset({ shared: { [K.SETTINGS]: { density } } });
    const v = open();
    heights[density] = settingsSize().height;
    assert.equal(drawnHeight(v.render()), heights[density], density);
    v.error = true; // the error text takes the supporting text's place: the same height
    assert.equal(drawnHeight(v.render()), heights[density], `${density}, hex in error`);
  }
  assert.equal(CHOICES.motion.length, 3);
  // Nine rows follow density: swatches, the field box, contrast, density, corners, three motion rows, the actions.
  assert.equal(heights.comfortable - heights.standard, 9 * 4);
  assert.equal(heights.standard - heights.compact, 9 * 4);
});

test("the footer's opener sizes the settings window as it draws, at every density", async () => {
  const { reset } = await import("herdr");
  const K = await import("../kit/index.js");
  const { settingsSize } = await import("../shapr/mods/shapr-settings/main.js");
  for (const density of ["compact", "standard", "comfortable"]) {
    reset().shared[K.SETTINGS] = { density };
    assert.equal(K.settingsSpec().height, settingsSize().height, density);
    assert.equal(K.settingsSpec().width, settingsSize().width, density);
  }
});

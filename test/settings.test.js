// The settings window: a change reaches shared "shapr.settings", defaults apply, an invalid hex is
// refused, reduced motion stops the kit animating, and mod.json sizes the dialog to what it draws.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { reset, shared } from "herdr";
import { unknownCalls, argsOf, texts, walk } from "./stubs/element.js";
import Settings, { PRESETS, CHOICES, WIDTH, parseSeed, settingsHeight } from "../shapr/mods/shapr-settings/main.js";
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

test("mod.json opens a frameless dialog sized to what the window draws", () => {
  reset();
  const j = JSON.parse(readFileSync(new URL("mod.json", dir), "utf8"));
  assert.deepEqual(j.overlay, { kind: "dialog", width: WIDTH, height: settingsHeight(), frame: "none" });
  assert.equal(CHOICES.motion.length, 3);
  // Every control the window draws follows density, so its height moves with it.
  const standard = settingsHeight();
  reset({ shared: { [K.SETTINGS]: { density: "comfortable" } } });
  assert.equal(settingsHeight(), standard + 9 * 4);
});

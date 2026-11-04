// Every kit component renders in every state with only element methods Herdr has, sets no color
// outside theme roles, and follows the person's density, corner and motion settings.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { reset } from "herdr";
import { unknownCalls, argsOf, walk } from "./stubs/element.js";
import * as K from "../kit/index.js";

const kitDir = new URL("../kit/", import.meta.url);
const noop = () => {};

export function everyState() {
  const out = [];
  for (const kind of ["filled", "tonal", "outlined", "elevated", "text"])
    for (const size of ["xs", "sm", "md", "lg", "xl"])
      out.push(K.button(`b-${kind}-${size}`, "Label", { kind, size, onClick: noop }), K.button(`bd-${kind}`, "Off", { kind, disabled: true }),
        K.button(`bs-${kind}`, "On", { kind, selected: true, icon: K.icon("check"), onClick: noop }), K.button(`be-${kind}`, "Delete", { kind, danger: true, shape: "square", onClick: noop }));
  for (const kind of ["standard", "filled", "tonal", "outlined"])
    for (const selected of [null, true, false]) out.push(K.iconButton(`i-${kind}-${selected}`, K.icon("plus"), { kind, selected, onClick: noop, tip: "Add" }), K.iconButton(`id-${kind}`, K.icon("x"), { kind, disabled: true }));
  out.push(K.label("Text", { style: "titleLarge", truncate: true }), K.heading("Section", { trailing: K.badge({ count: 3 }) }));
  for (const kind of ["assist", "filter", "input", "suggestion"])
    out.push(K.chip(`c-${kind}`, "Chip", { kind, onClick: noop }), K.chip(`cs-${kind}`, "Chip", { kind, selected: true, onClick: noop }),
      K.chip(`cx-${kind}`, "Chip", { kind, size: "xs", onRemove: noop, count: 2, iconColor: "blocked", icon: K.icon("plus") }), K.chip(`cd-${kind}`, "Chip", { kind, disabled: true, elevated: true }));
  for (const on of [true, false]) out.push(K.toggleSwitch(`s-${on}`, on, noop, { checkIcon: true }), K.toggleSwitch(`sd-${on}`, on, noop, { disabled: true }), K.radio(`r-${on}`, on, noop), K.radio(`re-${on}`, on, noop, { error: true }));
  for (const v of [true, false, "mixed"]) out.push(K.checkbox(`k-${v}`, v, noop), K.checkbox(`ke-${v}`, v, noop, { error: true }), K.checkbox(`kd-${v}`, v, noop, { disabled: true }));
  out.push(K.segmented("seg", [["a", "One"], ["b", "Two", { disabled: true }], ["c", "Three", { tip: "x" }]], "a", noop), K.segmented("segf", [["a", "One"], ["b", "Two"]], "b", noop, { fill: true, size: "lg" }));
  for (const kind of ["outlined", "filled"])
    for (const st of [{}, { focused: true }, { error: true }, { disabled: true }, { multiline: true }])
      out.push(K.textField(K.label("value"), { kind, label: "Name", supporting: "Help", leading: K.label("a"), trailing: K.label("b"), ...st }));
  out.push(K.menuSurface().child(K.menuHeader("Group")).child(K.menuItem("m1", "Item", { icon: K.icon("plus"), hint: "⌘K", onClick: noop, selected: false }))
    .child(K.menuItem("m2", "Chosen", { selected: true, onClick: noop })).child(K.menuDivider()).child(K.menuItem("m3", "Delete", { danger: true, onClick: noop })).child(K.menuItem("m4", "Off", { disabled: true, onClick: noop })));
  for (const st of [{}, { selected: true }, { disabled: true }, { supporting: "Second" }, { supporting: "a", lines: 3, overline: "o" }, { interactive: true, trailingText: "1m" }])
    out.push(K.listItem(`l-${JSON.stringify(st)}`, "Headline", { leading: K.statusMark("idle"), trailing: K.badge(), onClick: st.interactive ? null : noop, ...st }));
  for (const rail of [false, true]) for (const active of [false, true]) out.push(K.navItem(`n-${rail}-${active}`, "Spaces", { icon: K.icon("search"), active, rail, badge: K.badge({ count: 1200 }), onClick: noop }));
  for (const kind of ["elevated", "filled", "outlined"]) out.push(K.card(undefined, { kind, id: `card-${kind}`, onClick: noop }), K.card(undefined, { kind, disabled: true }));
  out.push(K.dialogSurface().child(K.dialogHeadline("Title", { icon: K.icon("plus") })).child(K.dialogBody("Body")).child(K.dialogActions({ onCancel: noop, primary: { label: "Save", onClick: noop }, note: "n", error: true })));
  for (const s of ["working", "blocked", "done", "idle"]) out.push(K.statusMark(s), K.statusBadge(s, 3));
  out.push(K.linearProgress(120, null), K.linearProgress(120, 0.4), K.linearProgress(120, 1), K.circularProgress(), K.divider(), K.divider({ vertical: true, inset: 16 }));
  out.push(K.snackbar("t", { title: "Saved", body: "Long body", action: { label: "Undo", onClick: noop }, onClose: noop, tone: "blocked", onClick: noop }));
  return out;
}

test("every component renders every state with Herdr's element methods", () => {
  reset();
  everyState();
  assert.deepEqual([...unknownCalls], []);
});

test("components set colors only from theme roles", () => {
  const h = reset();
  const allowed = new Set(Object.values(h.theme));
  for (const tree of everyState())
    for (const m of ["bg", "text_color", "border_color"])
      for (const [c] of argsOf(tree, m)) assert.ok(allowed.has(c), `${m}(${c}) is not a theme role`);
  for (const f of readdirSync(kitDir).filter((f) => f.endsWith(".js")))
    assert.doesNotMatch(readFileSync(new URL(f, kitDir), "utf8").replace(/^\s*\/\/.*$/gm, ""), /#[0-9a-fA-F]{3,8}\b/, `${f} has a hex color`);
});

test("density, corners and motion follow the person's settings", () => {
  const h = reset();
  const base = { h: K.H.sm, row: K.ROW.one, card: K.RADIUS.card };
  h.shared[K.SETTINGS] = { density: "compact", corners: "round", motion: "reduced" };
  assert.equal(K.H.sm, base.h - 4);
  assert.equal(K.ROW.one, base.row - 4);
  assert.ok(K.RADIUS.card > base.card);
  const springs = everyState().flatMap((t) => [...argsOf(t, "spring"), ...argsOf(t, "transition"), ...argsOf(t, "loop")]);
  assert.deepEqual(springs, [], "reduced motion still animates");
  h.shared[K.SETTINGS] = { density: "comfortable", motion: "calm" };
  assert.equal(K.H.sm, base.h + 4);
  assert.equal(K.SPRING.spatial.damping, 1);
});

test("menuHeight and dialogHeight count what the components draw", () => {
  reset();
  assert.equal(K.menuHeight({ items: 3 }), 4 + 40 * 3 + 2 * 2 + 4);
  assert.equal(K.menuHeight({ items: 2, dividers: 1, headers: 1 }), 8 + 80 + 9 + 32 + 3 * 2);
  assert.equal(K.dialogHeight({ headlineLines: 1, bodyLines: 2 }), 48 + 32 + 40 + 40 + 2 * 16);
});

test("type sets size, a static weight and the line height", () => {
  reset();
  const t = K.type(K.label("x").__node ? K.label("x") : null, "labelLarge", true);
  const calls = [...walk(t)][0].calls;
  assert.ok(calls.some(([m, a]) => m === "font_weight" && a[0] === 700));
  assert.ok(calls.some(([m, a]) => m === "line_height" && a[0] === "20px"));
  assert.equal(K.layoutPx(150), 150);
});

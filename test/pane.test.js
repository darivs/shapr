// The pane header is shapr's: a clone of Herdr's `pane` that sits on the card without a fill,
// line or heavy weight, and the chrome around the cards draws no line either.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { walk } from "./stubs/element.js";

const L = JSON.parse(readFileSync(new URL("../shapr/layouts/shapr-material.json", import.meta.url), "utf8"));
const nodes = (n) => [n, ...(n?.children ?? []).flatMap(nodes), ...(n?.floating ?? []).flatMap(nodes)];
const calls = (tree) => [...walk(tree)].flatMap((n) => n?.calls ?? []);
const cx = { notify() {}, spawn() {}, focus_handle: () => ({ focus() {} }), timer: { every() {}, after() {} } };

test("each pane's header is shapr-pane, a recorded clone of Herdr's pane", async () => {
  const pane = nodes(L).find((n) => n.id === "main").content.pane;
  assert.equal(pane.header.content.mod, "shapr-pane");
  const mod = JSON.parse(readFileSync(new URL("../shapr/mods/shapr-pane/mod.json", import.meta.url), "utf8"));
  assert.equal(mod.cloned_from?.name, "pane");
  const { CLONED } = await import("../bin/clone-mods");
  assert.ok(CLONED.includes("pane"));
});

test("a pane header paints no fill or line and no weight above 500, in every status", async () => {
  const { reset } = await import("herdr");
  const { default: Pane } = await import("../shapr/mods/shapr-pane/main.js");
  for (const status of ["working", "blocked", "done", "idle"]) {
    reset({ props: { pane: "p1" }, panes: [{ pane: "p1", title: "Docs", cwd: "/user-home/demo", status, focused: false, program: { name: "sh", shell: true } }] });
    const v = new Pane();
    v.init?.({}, cx);
    const tree = v.render(cx);
    const cs = calls(tree);
    const named = (m) => cs.filter(([n]) => n === m);
    assert.deepEqual(tree.__node.calls.filter(([m]) => m === "bg"), [], `${status}: the header paints a fill`);
    assert.deepEqual(cs.filter(([m]) => /^border/.test(m)), [], `${status}: a line`);
    assert.deepEqual([...named("font_semibold"), ...named("font_bold")], [], `${status}: a heavy weight`);
    assert.ok(named("font_weight").every(([, [w]]) => w <= 500), `${status}: weight ${named("font_weight").map(([, a]) => a[0])}`);
  }
});

test("the tab bar draws no line between its tabs and the panel toggles", () => {
  const src = readFileSync(new URL("../shapr/mods/shapr-tabs/main.js", import.meta.url), "utf8");
  assert.doesNotMatch(src, /divider\(/);
});

test("the terminal menu's Split down has its own icon", async () => {
  const { reset } = await import("herdr");
  const { default: Menu } = await import("../shapr/mods/shapr-menu/main.js");
  reset({ props: { tab: "pane", target: { pane: "p1", terminal: "t1" } } });
  const v = new Menu();
  v.init?.({}, cx);
  const svgs = [...walk(v.render(cx))].filter((n) => n?.kind === "svg").map((n) => n.arg);
  assert.ok(svgs.some((s) => /horizontal_split/.test(s)), `split down: ${svgs}`);
  assert.ok(svgs.some((s) => /vertical_split/.test(s)), `split right: ${svgs}`);
});

test("in a narrow pane the header's name truncates and nothing runs past the card", async () => {
  const { reset } = await import("herdr");
  const { default: Pane } = await import("../shapr/mods/shapr-pane/main.js");
  reset({ props: { pane: "p1" }, panes: [{ pane: "p1", title: "Layout file", cwd: "/user-home/demo", status: "blocked" }] });
  const v = new Pane();
  const root = v.render(cx).__node;
  assert.ok(root.calls.some(([m]) => m === "overflow_hidden"), "the header clips");
  const name = root.children.map((c) => c.__node).find((n) => n?.children?.includes("Layout file"));
  assert.ok(name, "the name element");
  assert.ok(!name.calls.some(([m]) => m === "flex_none"), "the name never shrinks");
  assert.ok(name.calls.some(([m, a]) => m === "min_w" && a[0] === 0), "the name has no minimum width");
});

test("a blocked pane's header keeps its name over status text: the mark alone says it", async () => {
  const { reset } = await import("herdr");
  const { texts } = await import("./stubs/element.js");
  const { default: Pane } = await import("../shapr/mods/shapr-pane/main.js");
  reset({ props: { pane: "p1" }, panes: [{ pane: "p1", title: "Layout file", cwd: "/user-home/demo", status: "blocked" }] });
  const shown = texts(new Pane().render(cx));
  assert.ok(shown.includes("Layout file"));
  assert.ok(!shown.includes("Needs you"), `the header shows ${shown}`);
});

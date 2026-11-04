// One surface, content on cards: no line or chrome strip separates the sidebar, bars and work
// area; panes, Files and Changes are cards one tonal step off canvas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const L = JSON.parse(readFileSync(new URL("../shapr/layouts/shapr-material.json", import.meta.url), "utf8"));
const nodes = (n) => [n, ...(n?.children ?? []).flatMap(nodes), ...(n?.floating ?? []).flatMap(nodes)];
const find = (id) => nodes(L).find((n) => n.id === id);
const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test("the layout draws no line between areas and paints no area chrome", () => {
  for (const n of nodes(L)) {
    assert.equal(n.divider, undefined, `${n.id} has a divider`);
    assert.equal(n.border, undefined, `${n.id} has a border`);
    assert.ok(n.background === undefined || n.background === "canvas", `${n.id} paints ${n.background}`);
  }
  assert.equal(L.background, "canvas");
});

test("each pane is a card: radius 16, no border at rest, a 2 px primary focus ring, lone panes too", () => {
  const pane = find("main").content.pane;
  assert.equal(pane.radius, 16);
  assert.equal(pane.border, undefined);
  assert.deepEqual(pane.focus, { width: 2, color: "solid" });
  // Herdr's frame has one focus look for every pane and no split-only focus: a lone pane is a
  // card too, so it carries the ring.
  assert.equal(pane.lone, true);
  assert.equal(pane.background, "background");
  assert.equal(pane.header.content.mod, "pane");
});

test("no status bar runs under the panes: the work area's cards reach the window's bottom margin", async () => {
  const { existsSync } = await import("node:fs");
  const { CLONED } = await import("../bin/clone-mods");
  assert.equal(find("status"), undefined, "a status block");
  assert.deepEqual(nodes(L).filter((n) => n.content?.mod === "shapr-workspace-status").map((n) => n.id), []);
  // The work column holds the tab bar and the cards' row, and the row's padding is the margin.
  assert.deepEqual(find("work").children.map((n) => n.id), ["tabs", "work-body"]);
  assert.equal(existsSync(new URL("../shapr/mods/shapr-workspace-status", import.meta.url)), false, "the mod is in the repo");
  assert.equal(CLONED.includes("workspace-status"), false, "clone-mods still clones it");
});

test("cards sit 12 px apart and 12 px inside the work area", () => {
  assert.equal(find("work-body").padding, 12);
  assert.equal(find("work-body").gap, 12);
  assert.equal(find("main").content.pane.gap, 12);
});

test("the sidebar, brand, tabs and sidebar footer paint canvas, not chrome", async () => {
  const { reset } = await import("herdr");
  const mods = ["shapr-workspace-chrome", "shapr-tabs", "shapr-spaces", "shapr-agents"];
  const cx = { notify() {}, spawn() {}, focus_handle: () => ({ focus() {} }), timer: { every() {}, after() {} } };
  globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
  for (const [mod, props] of [...mods.map((m) => [m, {}]), ["shapr-workspace-chrome", { footer: true }]]) {
    const h = reset({ props, spaces: [{ id: "s1", active: true, machine: null, name: "demo", tabs: [{ id: "t1", active: true, name: "main" }] }] });
    const { default: View } = await import(`../shapr/mods/${mod}/main.js`);
    const v = new View();
    v.init?.(props, cx);
    const root = v.render(cx).__node;
    const fills = root.calls.filter(([m]) => m === "bg").map(([, [c]]) => c);
    assert.ok(fills.every((c) => c === h.theme.canvas), `${mod} ${JSON.stringify(props)} paints ${fills}`);
  }
});

test("Files and Changes are cards of the panes' shape and fill, without a border", async () => {
  // Both draw their panel through the kit's panelCard (gpui-base's Editor keeps them out of the stubs).
  const { reset } = await import("herdr");
  const { panelCard } = await import("../kit/index.js");
  for (const mod of ["shapr-files", "shapr-changes"])
    assert.match(readFileSync(new URL(`../shapr/mods/${mod}/main.js`, import.meta.url), "utf8"), /return type\(panelCard\(/, mod);
  for (const [corners, radius] of [["standard", 16], ["round", 20]]) {
    const h = reset({ shared: { "shapr.settings": { corners } } });
    const calls = panelCard().__node.calls;
    const of = (m) => calls.filter(([n]) => n === m).map(([, a]) => a[0]);
    assert.deepEqual(of("bg"), [h.theme.background], "fill");
    assert.deepEqual(of("rounded"), [radius], `${corners} radius`);
    assert.deepEqual([...of("border_1"), ...of("border_color")], [], "border");
  }
});

test("the pane cards' radius follows the corner setting, as the kit's SHAPE.lg", async () => {
  const { reset } = await import("herdr");
  const { default: Chrome } = await import("../shapr/mods/shapr-workspace-chrome/main.js");
  const cx = { notify() {}, spawn() {} };
  const sets = (corners) => {
    const h = reset({ layout: structuredClone(L), shared: { "shapr.settings": { corners } } });
    new Chrome().render(cx);
    return h.ran.filter(([c]) => c === "layout.set").map(([, a]) => a.layout);
  };
  assert.deepEqual(sets("standard"), [], "16 is already standard");
  const [round, ...more] = sets("round");
  assert.ok(round, "round corners set no layout");
  assert.equal(more.length, 0);
  const at = (n, id) => n?.id === id ? n : (n?.children ?? []).map((c) => at(c, id)).find(Boolean);
  assert.equal(at(round, "main").content.pane.radius, 20);
  // Only the radius changes.
  at(round, "main").content.pane.radius = 16;
  assert.deepEqual(round, L);
});

test("text on a status fill keeps its contrast now that the terminal's ground is a card", async () => {
  const { reset } = await import("herdr");
  const { onStatus } = await import("../kit/index.js");
  const { themeFile } = await import("../shapr/mods/shapr-workspace-chrome/theme/scheme.js");
  const t = themeFile({}, false).colors;
  reset({ theme: t });
  for (const s of ["working", "blocked", "done"]) assert.ok(ratio(onStatus(), t[s]) >= 4.5, `${s}: ${ratio(onStatus(), t[s]).toFixed(2)}`);
});

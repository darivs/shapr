// One surface, content on cards: no line or chrome strip separates the sidebar, bars and work
// area; panes, Files and Changes are cards one tonal step off canvas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const L = JSON.parse(readFileSync(new URL("../shapr/layouts/shapr-material.json", import.meta.url), "utf8"));
const nodes = (n) => [n, ...(n?.children ?? []).flatMap(nodes), ...(n?.floating ?? []).flatMap(nodes)];
const find = (id) => nodes(L).find((n) => n.id === id);

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

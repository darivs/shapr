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

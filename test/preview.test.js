// bin/preview fills docs/preview/template.html from docs/preview/manifest.json: every {{key}} gets
// the manifest's copy, shots and colors, HTML-escaped; a key the manifest lacks fails the render
// instead of leaving "{{…}}" in the picture. The headline's accent is the seed's dark primary, as
// Shapr's own scheme makes it. The committed template and manifest fit each other.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const { fill, vars, browserArgs } = await import("../bin/preview");

test("fill puts each value in its {{key}}, HTML-escaped", () => {
  assert.equal(fill("<h1>{{a}} {{b.c}}</h1>", { a: "Tom & Jerry", "b.c": "<i>" }), "<h1>Tom &amp; Jerry &lt;i&gt;</h1>");
});

test("fill fails on a key it has no value for", () => {
  assert.throws(() => fill("{{missing}}", {}), /missing/);
});

test("vars flattens the copy and the shots, and takes the accent from the seed", () => {
  const v = vars({ seed: "#6750A4", copy: { eyebrow: "E", captions: { light: "L" } }, shots: [{ role: "main", file: "shots/a.png", alt: "A" }] });
  assert.equal(v["copy.eyebrow"], "E");
  assert.equal(v["copy.captions.light"], "L");
  assert.equal(v["shot.main"], "shots/a.png");
  assert.equal(v["shot.main.alt"], "A");
  assert.equal(v.seed, "#6750A4");
  assert.equal(v.accent, "#cfbdfe"); // shapr-dark's primary (solid) at the baseline seed
});

test("the committed template uses only keys the manifest has, and every shot exists", () => {
  const dir = join(root, "docs", "preview");
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  const html = fill(readFileSync(join(dir, "template.html"), "utf8"), vars(manifest));
  assert.doesNotMatch(html, /\{\{/);
  for (const s of manifest.shots) assert.ok(existsSync(join(dir, s.file)), s.file);
});

test("the browser renders headless at the scale and size asked, into a profile of its own", () => {
  const a = browserArgs({ url: "file:///x.html", out: "/o.png", width: 1600, height: 1000, scale: 2, profile: "/p" });
  for (const f of ["--headless", "--hide-scrollbars", "--force-device-scale-factor=2", "--window-size=1600,1000", "--virtual-time-budget=2000", "--screenshot=/o.png", "--user-data-dir=/p"])
    assert.ok(a.includes(f), f);
  assert.equal(a.at(-1), "file:///x.html");
});

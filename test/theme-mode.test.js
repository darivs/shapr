// Terminals stay dark in light mode, the Theme window sets light or dark, the footer says Shapr Theme.
import { test } from "node:test";
import assert from "node:assert/strict";
import { reset } from "herdr";
import { walk, texts } from "./stubs/element.js";
import { themeFile } from "../shapr/mods/shapr-workspace-chrome/theme/scheme.js";
import { withMode, modeOf } from "../shapr/mods/shapr-settings/main.js";

const cx = { notify() {}, spawn() {}, focus_handle: () => ({ focus() {} }), timer: { every() {}, after() {} } };

test("a terminal looks the same in light and dark mode: the dark scheme's ground, text and colors", () => {
  for (const seed of ["#6750A4", "#006A6A"]) {
    const light = themeFile({ seed }, false), dark = themeFile({ seed }, true);
    for (const k of ["background", "foreground", "selection", "cursor"]) assert.equal(light[k], dark[k], `${seed} ${k}`);
    assert.deepEqual(light.ansi, dark.ansi);
    assert.equal(light.colors.background, dark.colors.background, "the pane card");
    assert.notEqual(light.colors.canvas, dark.colors.canvas, "the rest still follows the mode");
  }
});

test("the Theme window's mode writes settings.json's appearance, and System removes it", () => {
  assert.deepEqual(JSON.parse(withMode('{"zoom": 1.5}', "dark")), { zoom: 1.5, appearance: "dark" });
  assert.deepEqual(JSON.parse(withMode('{"zoom": 1, "appearance": "dark"}', "system")), { zoom: 1 });
  assert.deepEqual(JSON.parse(withMode(null, "light")), { appearance: "light" });
  assert.equal(modeOf('{"zoom": 1}'), "system");
  assert.equal(modeOf('{"appearance": "light"}'), "light");
  assert.equal(modeOf(null), "system");
});

test("the sidebar footer opens Shapr Theme with the Shapr logo", async () => {
  const { default: Chrome } = await import("../shapr/mods/shapr-workspace-chrome/main.js");
  globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
  reset({ props: { footer: true }, spaces: [{ id: "s1", active: true, tabs: [] }] });
  const v = new Chrome();
  v.init?.({ footer: true }, cx);
  const tree = v.render(cx);
  assert.ok(texts(tree).includes("Shapr Theme"));
  assert.ok([...walk(tree)].some((n) => n?.kind === "image" && /shapr-logo\.png$/.test(n.arg)));
});

test("a pane header's text uses the terminal's ink, readable on its dark card", async () => {
  const { default: Pane } = await import("../shapr/mods/shapr-pane/main.js");
  const h = reset({ props: { pane: "p1" }, panes: [{ pane: "p1", title: "Docs", cwd: "/user-home/demo", status: "idle" }] });
  h.theme.terminal_foreground = "#e6e0e9"; h.theme.terminal_muted = "#cac4d0";
  const inks = [...walk(new Pane().render(cx))].flatMap((n) => (n?.calls ?? []).filter(([m]) => m === "text_color").map(([, [c]]) => c));
  assert.ok(inks.includes("#e6e0e9") && inks.includes("#cac4d0"), `${inks}`);
});

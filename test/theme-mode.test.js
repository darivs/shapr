// Terminals stay dark in light mode, the Theme window sets light or dark, the footer says Shapr Theme.
import { test } from "node:test";
import assert from "node:assert/strict";
import { reset } from "herdr";
import { walk, texts } from "./stubs/element.js";
import { themeFile } from "../shapr/mods/shapr-workspace-chrome/theme/scheme.js";
import { withMode, modeOf } from "../shapr/mods/shapr-settings/main.js";

const cx = { notify() {}, spawn() {}, focus_handle: () => ({ focus() {} }), timer: { every() {}, after() {} } };

const lstar = (h) => {
  const y = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const Y = 0.2126 * y[0] + 0.7152 * y[1] + 0.0722 * y[2];
  return Y > 216 / 24389 ? 116 * Math.cbrt(Y) - 16 : (24389 / 27) * Y;
};

test("light mode is a tinted frame with white cards: the seed colors the frame, terminals read on white", () => {
  for (const seed of ["#6750A4", "#006A6A", "#B3261E"]) {
    const t = themeFile({ seed }, false);
    assert.ok(lstar(t.background) > 98, `${seed}: the terminal card is white, ${t.background}`);
    assert.equal(t.colors.background, t.background, "the card is the terminal's ground");
    assert.ok(lstar(t.colors.canvas) < lstar(t.background) - 4, `${seed}: the frame ${t.colors.canvas} is tinted off the cards`);
    assert.ok(lstar(t.foreground) < 30, "dark text on the white terminal");
    assert.ok(Math.abs(lstar(t.colors.selected) - lstar(t.colors.canvas)) >= 6, `${seed}: the active pill ${t.colors.selected} stands off the frame ${t.colors.canvas}`);
  }
});

test("dark mode keeps its dark cards on the dark canvas", () => {
  const t = themeFile({ seed: "#6750A4" }, true);
  assert.ok(lstar(t.background) < 20 && lstar(t.colors.canvas) < 20);
  assert.ok(lstar(t.foreground) > 80);
});

test("the Theme window's mode writes settings.json's appearance, and System removes it", () => {
  assert.deepEqual(JSON.parse(withMode('{"zoom": 1.5}', "dark")), { zoom: 1.5, appearance: "dark" });
  assert.deepEqual(JSON.parse(withMode('{"zoom": 1, "appearance": "dark"}', "system")), { zoom: 1 });
  assert.deepEqual(JSON.parse(withMode(null, "light")), { appearance: "light" });
  assert.equal(withMode('{"zoom": 1,', "dark"), null, "a broken settings.json is never overwritten");
  assert.equal(withMode("[]", "dark"), null);
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

test("choosing a mode keeps every other setting, and a failed read writes nothing", async () => {
  const { default: Settings } = await import("../shapr/mods/shapr-settings/main.js");
  const h = reset({ files: { "/app-home/settings.json": '{"zoom": 1.5}' } });
  let notified = 0;
  const v = new Settings();
  v.init({}, { ...cx, notify: () => notified++ });
  await v.setMode("dark");
  assert.deepEqual(JSON.parse(h.files["/app-home/settings.json"]), { zoom: 1.5, appearance: "dark" });
  assert.equal(v.mode, "dark");
  assert.ok(notified > 0, "the control redraws");
  h.files["/app-home/settings.json"] = '{"zoom": 1.5,';
  await v.setMode("light");
  assert.equal(h.files["/app-home/settings.json"], '{"zoom": 1.5,');
  assert.equal(v.mode, "dark");
});

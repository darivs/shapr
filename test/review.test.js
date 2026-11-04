// Fixes from PR #30's review rounds: each test names the finding it settles.
import { test } from "node:test";
import assert from "node:assert/strict";
import { reset } from "herdr";
import { walk, texts } from "./stubs/element.js";

const cx = { notify() {}, spawn() {}, focus_handle: () => ({ focus() {} }), timer: { every() {}, after() {} } };

test("the terminal menu's opener counts Send back only when its parent still exists (kit/openers.js:35)", async () => {
  const { terminalMenuSpec, menuHeight } = await import("../kit/index.js");
  reset({ terminals: [{ address: "t1", parent: "gone" }] });
  assert.equal(terminalMenuSpec("p1", "t1").height, menuHeight({ items: 5, dividers: 1 }));
  reset({ terminals: [{ address: "t1", parent: "t0" }, { address: "t0" }] });
  assert.equal(terminalMenuSpec("p1", "t1").height, menuHeight({ items: 6, dividers: 1 }));
});

test("hovering a pane header changes no layout: its buttons hold their space at rest (shapr-pane/main.js:60)", async () => {
  const { default: Pane } = await import("../shapr/mods/shapr-pane/main.js");
  reset({ props: { pane: "p1" }, panes: [{ pane: "p1", title: "Docs", cwd: "/user-home/demo", status: "idle" }] });
  const v = new Pane();
  v.init();
  const ids = (tree) => [...walk(tree)].flatMap((n) => (n?.calls ?? []).filter(([m]) => m === "id").map(([, [i]]) => i));
  const rest = ids(v.render(cx));
  v.hovered = true;
  assert.deepEqual(ids(v.render(cx)), rest);
  assert.ok(rest.includes("ph-x-p1"), "the close button is laid out at rest");
});

test("Maximize off Windows draws a Material Symbol, not Herdr's caption icon (shapr-tabs/main.js:98)", async () => {
  const { default: Tabs } = await import("../shapr/mods/shapr-tabs/main.js");
  globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
  reset({ window: { platform: "linux", buttons: true, maximized: false }, spaces: [{ id: "s1", active: true, tabs: [{ id: "t1", active: true, name: "1" }] }] });
  const v = new Tabs();
  v.init?.({}, cx);
  const svgs = [...walk(v.render(cx))].filter((n) => n?.kind === "svg").map((n) => n.arg);
  assert.deepEqual(svgs.filter((s) => /win-/.test(s)), []);
});

test("the machine row says agent for one agent (shapr-workspace-chrome/main.js:92)", async () => {
  const { default: Chrome } = await import("../shapr/mods/shapr-workspace-chrome/main.js");
  globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
  reset({ props: { footer: true }, agents: [{ terminal: "t1", status: "idle" }], spaces: [{ id: "s1", active: true, tabs: [] }] });
  const v = new Chrome();
  v.init?.({ footer: true }, cx);
  const shown = texts(v.render(cx)).join(" ");
  assert.match(shown, /This computer · 1 agent\b/);
  assert.doesNotMatch(shown, /1 agents/);
});

// Add a machine lists the hosts from ~/.ssh/config, like Herdr's machine-add (D3). The dialog is
// as tall as its content, so a shrinkable list there measures 0 high and shows no host at all.
import { test } from "node:test";
import assert from "node:assert/strict";
import { reset } from "herdr";
import { walk, texts } from "./stubs/element.js";

globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
const { default: MachineAdd } = await import("../shapr/mods/shapr-machine-add/main.js");

const CONFIG = "Host alpha\n  HostName alpha.example\n  User me\nHost beta\n";

async function open() {
  reset({ files: { "/user-home/.ssh/config": CONFIG } });
  const spawned = [];
  const cx = { focus_handle: () => ({}), notify() {}, spawn: (f) => spawned.push(f(cx)), timer: { after() {}, every() {} } };
  const v = new MachineAdd();
  v.init({}, cx);
  await Promise.all(spawned);
  return v.render(cx);
}

// The host list and every element between it and the dialog's root.
function pathTo(root, id) {
  const find = (proxy, trail) => {
    const n = proxy?.__node;
    if (!n) return null;
    const here = [...trail, n];
    if ((n.calls ?? []).some(([m, a]) => m === "id" && a[0] === id)) return here;
    for (const c of n.children ?? []) { const p = find(c, here); if (p) return p; }
    return null;
  };
  return find(root, []);
}

test("add a machine shows each host from the ssh config", async () => {
  const root = await open();
  assert.ok(texts(root).includes("alpha") && texts(root).includes("beta"), "the hosts are rendered");
  const path = pathTo(root, "ma-hosts");
  assert.ok(path, "the host list exists");
  for (const n of path.slice(1)) {
    const shrinks = (n.calls ?? []).some(([m, a]) => (m === "flex_shrink" && a[0] > 0) || m === "flex_1");
    assert.ok(!shrinks, "nothing between the fitted dialog and the host list may shrink, or the list measures 0 high");
  }
  assert.ok([...walk(root)].some((n) => (n?.calls ?? []).some(([m, a]) => m === "max_h" && a[0] === 280)), "the list stays capped at 280 and scrolls");
});

// The shot loop (bin/shots machine-add) puts a demo ssh config into the app home while it shoots:
// then the dialog lists only its hosts and never the person's (#36).
test("add a machine lists the app home's demo ssh config instead of the person's when there is one", async () => {
  reset({ files: { "/user-home/.ssh/config": CONFIG, "/app-home/shapr-demo-ssh-config": "Host demo-vps\n  HostName vps.example.net\n  User demo\n" } });
  const spawned = [];
  const cx = { focus_handle: () => ({}), notify() {}, spawn: (f) => spawned.push(f(cx)), timer: { after() {}, every() {} } };
  const v = new MachineAdd();
  v.init({}, cx);
  await Promise.all(spawned);
  const shown = texts(v.render(cx));
  assert.ok(shown.includes("demo-vps"), "the demo host is listed");
  assert.ok(!shown.includes("alpha") && !shown.includes("beta"), "no host from the person's ssh config");
});

// The sidebar as an MD3 navigation drawer: space rows of one line (icon, name, a quiet count),
// the active space on secondary-container with its branch; repo and branch in each row's tooltip;
// color only on the active item and on status marks.
import { test } from "node:test";
import assert from "node:assert/strict";
import { reset } from "herdr";
import { walk, texts, argsOf } from "./stubs/element.js";

globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };

// A fake git: each folder's branch, ahead and behind, and the repo's .git folder (a worktree's
// differs from its own top).
const REPOS = {
  "/repos/shapr": { branch: "main", ahead: 16, behind: 6, common: "/repos/shapr/.git" },
  "/wt/feature-x": { branch: "feature-x", ahead: 2, behind: 0, common: "/repos/shapr/.git" },
};
function git(_cmd, args, { cwd }) {
  const r = REPOS[cwd];
  if (!r) return { code: 128, stdout: "", stderr: "fatal: not a git repository" };
  if (args.includes("status")) return { code: 0, stdout: `# branch.head ${r.branch}\n# branch.ab +${r.ahead} -${r.behind}\n`, stderr: "" };
  if (args.includes("--show-toplevel")) return { code: 0, stdout: `${cwd}\n`, stderr: "" };
  return { code: 0, stdout: `${r.common}\n`, stderr: "" };
}
const SPACES = [
  { id: "s1", name: "shapr", folder: "/repos/shapr", active: true, status: "idle", machine: null, tabs: [] },
  { id: "s3", name: "notes", folder: "/notes", active: false, status: "done", machine: null, tabs: [] },
  { id: "s2", name: "feature-x", folder: "/wt/feature-x", active: false, status: "blocked", machine: null, tabs: [] },
];
const settle = () => new Promise((r) => setTimeout(r, 20));
function context() {
  const timers = [];
  return { timers, notify() {}, spawn(f) { f(this); }, stop_propagation() {}, timer: { every(ms, f) { timers.push([ms, f]); }, after() {} } };
}

/** The spaces list once its git is known, rendered; `over` changes the fixture. */
async function spacesList(over = {}) {
  const h = reset({ spaces: structuredClone(SPACES), exec: git, shared: { "space.colors": { s1: "ansi1", s2: "ansi3", s3: "ansi5" } }, ...over });
  const { default: Spaces } = await import("../shapr/mods/shapr-spaces/main.js");
  const cx = context(), v = new Spaces();
  v.init({}, cx);
  for (const [, f] of cx.timers.filter(([ms]) => ms === 250)) f(cx);
  await settle();
  return { h, tree: v.render(cx) };
}
const byId = (tree, id) => [...walk(tree)].find((n) => n?.calls?.some(([m, a]) => m === "id" && a[0] === id));
const node = (n) => ({ __node: n });
const svgs = (n) => [...walk(node(n))].filter((x) => x?.kind === "svg").map((x) => x.arg);
const inset = (n) => Math.max(0, ...n.calls.filter(([m]) => m === "pl").map(([, a]) => a[0]));

test("a space row shows its icon, its name and one quiet count; the active row adds its branch", async () => {
  const { h, tree } = await spacesList();
  const shapr = byId(tree, "space-s1"), notes = byId(tree, "space-s3"), wt = byId(tree, "space-s2");
  assert.deepEqual(texts(node(shapr)), ["shapr", "main", "↑16 ↓6"]);
  assert.deepEqual(texts(node(notes)), ["notes"]);
  // A worktree's branch is its name: no second line, its count only.
  assert.deepEqual(texts(node(wt)), ["feature-x", "↑2"]);
  // Outlined at rest, filled when active; a worktree is call_split.
  assert.deepEqual(svgs(shapr), ["mods/shapr-workspace-chrome/folder-fill.svg"]);
  assert.deepEqual(svgs(notes), ["mods/shapr-workspace-chrome/folder.svg"]);
  assert.ok(svgs(wt).includes("mods/shapr-workspace-chrome/call_split.svg"), svgs(wt).join());
  // The count and the branch are on-surface-variant.
  const ink = (n, text) => [...walk(node(n))].find((x) => x?.children?.includes(text))?.calls.filter(([m]) => m === "text_color").map(([, a]) => a[0]);
  assert.deepEqual(ink(shapr, "↑16 ↓6"), [h.theme.muted]);
  assert.deepEqual(ink(shapr, "main"), [h.theme.muted]);
  // Worktrees sit one step in under their space.
  const order = argsOf(tree, "id").map(([id]) => id).filter((id) => /^space-/.test(id));
  assert.deepEqual(order, ["space-s1", "space-s2", "space-s3"]);
  assert.ok(inset(wt) > inset(shapr), `worktree ${inset(wt)}, space ${inset(shapr)}`);
});

test("every space row's tooltip names its repo and branch", async () => {
  const { tree } = await spacesList();
  const tip = (id) => argsOf(byId(tree, id) && node(byId(tree, id)), "tooltip").map(([t]) => t);
  assert.equal(tip("space-s1").length, 1);
  assert.match(tip("space-s1")[0], /shapr.*main/);
  assert.match(tip("space-s2")[0], /shapr.*feature-x/);
});

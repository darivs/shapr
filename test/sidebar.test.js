// The sidebar as an MD3 navigation drawer: space rows of one line (icon, name, a quiet count),
// the active space on secondary-container with its branch; repo and branch in each row's tooltip;
// color only on the active item and on status marks.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  const order = argsOf(tree, "id").map(([id]) => id).filter((id) => /^space-s\d$/.test(id));
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

// Fake agents in every status, one focused; a glyph program (tinted) and a picture program.
const GLYPH = { name: "claude", key: "claude", icon: "icons/claude.svg", tint: true, agent: true };
const PICTURE = { name: "codex", key: "codex", icon: "icons/codex.png", tint: false, agent: true };
const AGENTS = ["blocked", "done", "working", "idle"].map((status, n) => ({
  address: `t${n}`, pane: `p${n}`, tab: `tab${n}`, status, title: `task ${n}`, name: `agent ${n}`, program: n % 2 ? PICTURE : GLYPH,
  space: "s1", space_name: "shapr", seq: n, pinned: false, focused: n === 3,
}));
async function agentsList(sort = "priority", over = {}) {
  const h = reset({ agents: structuredClone(AGENTS), spaces: structuredClone(SPACES), shared: { "agents.sort": sort }, ...over });
  const { default: Agents } = await import("../shapr/mods/shapr-agents/main.js");
  const cx = context(), v = new Agents();
  v.init({}, cx);
  return { h, tree: v.render(cx) };
}
const own = (n, m) => n.calls.filter(([x]) => x === m).map(([, a]) => a[0]);
const deep = (n, m) => [...walk(node(n))].flatMap((x) => (x?.calls ? own(x, m) : []));

test("agent group headers are title small in on-surface-variant, their count plain text", async () => {
  const { h, tree } = await agentsList();
  for (const [id, title] of [["sec-4", "Needs you"], ["sec-3", "Done"], ["sec-2", "Working"], ["sec-1", "Idle"]]) {
    const head = byId(tree, id);
    assert.deepEqual(texts(node(head)), [title, "1"], id);
    assert.deepEqual([...new Set(deep(head, "text_color"))], [h.theme.muted], `${id} ink`);
    assert.deepEqual(deep(head, "bg"), [], `${id} fill`);
    assert.deepEqual(own(head, "text_size"), [14], `${id} size`);
    assert.deepEqual(own(head, "font_weight"), [500], `${id} weight`);
  }
});

test("an agent row: name on-surface, title and time on-surface-variant, glyph icons tinted, pictures at 16", async () => {
  const { h, tree } = await agentsList();
  const done = byId(tree, "ag-t1"), working = byId(tree, "ag-t2");
  const inkOf = (n, text) => [...walk(node(n))].find((x) => x?.children?.includes(text))?.calls.filter(([m]) => m === "text_color").map(([, a]) => a[0]);
  const sizeOf = (n, text) => [...walk(node(n))].find((x) => x?.children?.includes(text))?.calls.filter(([m]) => m === "text_size").map(([, a]) => a[0]);
  // Not focused: the name on-surface; the title and the time on-surface-variant.
  for (const row of [done, working]) assert.deepEqual(inkOf(row, "shapr"), [h.theme.foreground]);
  assert.deepEqual(inkOf(working, "· task 2"), [h.theme.muted]);
  assert.deepEqual(inkOf(working, "<1m"), [h.theme.muted]);
  // The time is a label, medium.
  assert.deepEqual(sizeOf(working, "<1m"), [12]);
  const glyph = [...walk(node(working))].find((x) => x?.kind === "svg" && x.arg === GLYPH.icon);
  assert.deepEqual(own(glyph, "text_color"), [h.theme.muted]);
  const picture = [...walk(node(done))].find((x) => x?.kind === "image" && x.arg === PICTURE.icon);
  assert.deepEqual([own(picture, "w"), own(picture, "h")], [[16], [16]]);
});

test("color in a sidebar row is only secondary-container, primary or a status color", async () => {
  const base = reset().theme;
  const theme = { ...base, ansi1: "#aa0000", ansi2: "#00aa00", ansi3: "#aaaa00", ansi4: "#0000aa", ansi5: "#aa00aa", ansi6: "#00aaaa", tertiary: "#7d5260", error: "#b3261e" };
  const neutral = [base.canvas, base.hover, base.foreground, base.muted, base.dim, base.background];
  const color = [base.selected, base.solid, base.working, base.blocked, base.done, base.idle];
  const allowed = new Set([...neutral, ...color]);
  const rows = (tree) => [...walk(tree)].filter((n) => n?.calls?.some(([m, a]) => m === "id" && /^(space-s|ag-t|sec-|sp-|pinned|machine-)/.test(a[0])));
  // A second machine, so its header shows too.
  const machines = [{ name: null, layout: "ready" }, { name: "box", layout: "ready" }];
  const away = { id: "s9", name: "far", folder: "/far", active: false, status: "idle", machine: "box", tabs: [] };
  const trees = [(await spacesList({ theme, machines, spaces: [...structuredClone(SPACES), away] })).tree];
  for (const sort of ["priority", "grouped"]) trees.push((await agentsList(sort, { theme })).tree);
  for (const tree of trees)
    for (const row of rows(tree))
      for (const m of ["bg", "text_color"])
        for (const c of deep(row, m)) assert.ok(allowed.has(c), `${own(row, "id")[0]} ${m}(${c})`);
});

test("no line separates the sidebar's sections, and the footer's block is the height it draws", async () => {
  const { readFileSync } = await import("node:fs");
  const { tree: agentsTree, h } = await agentsList();
  const { tree: spacesTree } = await spacesList();
  const { default: Chrome, blockHeights } = await import("../shapr/mods/shapr-workspace-chrome/main.js");
  reset({ props: { footer: true } });
  const footer = new Chrome().render(context());
  for (const [name, tree] of [["agents", agentsTree], ["spaces", spacesTree], ["footer", footer]]) {
    const lines = [...walk(tree)].flatMap((n) => (n?.calls ?? []).filter(([m, a]) => /^border_[tblr]$/.test(m) || (m === "bg" && a[0] === h.theme.border)));
    assert.deepEqual(lines, [], `${name} draws a line`);
  }
  // Three 40 rows and 8 above and below, no divider.
  assert.equal(blockHeights()["sidebar-footer"], 136);
  const L = JSON.parse(readFileSync(new URL("../shapr/layouts/shapr-material.json", import.meta.url), "utf8"));
  const find = (n, id) => (n?.id === id ? n : (n?.children ?? []).map((c) => find(c, id)).find(Boolean));
  assert.equal(find(L, "sidebar-footer").size.px, 136);
});

test("folded to the rail, each space shows its icon, the active one filled, and status stays visible", async () => {
  const layout = { id: "root", children: [{ id: "sidebar", size: { px: 76 }, children: [] }] };
  const { h, tree } = await spacesList({ layout });
  const shapr = byId(tree, "space-s1"), notes = byId(tree, "space-s3"), wt = byId(tree, "space-s2");
  assert.deepEqual(svgs(shapr), ["mods/shapr-workspace-chrome/folder-fill.svg"]);
  assert.deepEqual(svgs(notes), ["mods/shapr-workspace-chrome/folder.svg"]);
  assert.deepEqual(svgs(wt), ["mods/shapr-workspace-chrome/call_split.svg"]);
  // No number, no name: the icon says it, the tooltip names it.
  assert.deepEqual(texts(node(shapr)), []);
  assert.match(argsOf(node(shapr), "tooltip")[0][0], /shapr/);
  assert.ok(deep(notes, "bg").includes(h.theme.done), "done mark");
  assert.ok(deep(wt, "bg").includes(h.theme.blocked), "blocked mark");
  const { tree: agents } = await agentsList("priority", { layout });
  assert.ok(deep(byId(agents, "ag-t0"), "bg").includes(h.theme.blocked), "agent blocked mark");
  assert.ok(deep(byId(agents, "ag-t1"), "bg").includes(h.theme.done), "agent done mark");
});

test("the sidebar's lists show their scrollbars only while scrolling, empty, with one item or overflowing", async () => {
  const many = Array.from({ length: 40 }, (_, n) => ({ ...AGENTS[n % 4], address: `x${n}`, pane: `px${n}`, seq: n }));
  const lists = [
    (await spacesList({ spaces: [] })).tree, (await spacesList({ spaces: [SPACES[0]] })).tree, (await spacesList()).tree,
    (await agentsList("priority", { agents: [] })).tree, (await agentsList("priority", { agents: [AGENTS[0]] })).tree, (await agentsList("grouped", { agents: many })).tree,
  ];
  for (const tree of lists) {
    assert.equal(argsOf(tree, "overflow_y_scrollbar").length, 1);
    assert.deepEqual(argsOf(tree, "mode"), [["scrolling"]]);
  }
});

// The footer's machine row: Herdr's machines() (this computer included) and agents() on all of them.
const agentsOn = (n) => Array.from({ length: n }, (_, i) => ({ ...AGENTS[i % 4], address: `m${i}` }));
async function footer(over = {}) {
  const { default: Chrome } = await import("../shapr/mods/shapr-workspace-chrome/main.js");
  const h = reset({ props: { footer: true }, ...over });
  const v = new Chrome(), cx = context();
  v.init({ footer: true }, cx);
  return { h, v, cx, tree: v.render(cx) };
}
// What a node shows: the text and icons along paths where no node is faded out.
function shown(n, out = { texts: [], svgs: [] }) {
  const x = n?.__node;
  if (!x) { if (typeof n === "string") out.texts.push(n); return out; }
  if (own(x, "opacity").at(-1) === 0) return out;
  if (x.kind === "svg") out.svgs.push(x.arg);
  for (const c of x.children) shown(c, out);
  return out;
}

test("the footer's machine row reads this computer and its agents, or the machines and all their agents", async () => {
  const one = await footer({ agents: agentsOn(11) });
  const row = byId(one.tree, "machine");
  assert.deepEqual(shown(node(row)).texts, ["This computer · 11 agents"]);
  assert.deepEqual(shown(node(row)).svgs, ["mods/shapr-workspace-chrome/computer.svg"]);
  // The dot and the count are on-surface-variant.
  const ink = [...walk(node(row))].find((x) => x?.children?.includes("This computer · 11 agents"));
  assert.deepEqual([...new Set([...own(row, "text_color"), ...(ink ? own(ink, "text_color") : [])])], [one.h.theme.muted]);
  const two = await footer({ agents: agentsOn(18), machines: [{ name: null, layout: "ready" }, { name: "box", layout: "ready" }] });
  assert.deepEqual(shown(node(byId(two.tree, "machine"))).texts, ["2 machines · 18 agents"]);
});

test("hovering the machine row swaps to add machine without resizing it, animated unless motion is reduced", async () => {
  const handler = (row, m) => row.calls.find(([x]) => x === m)?.[1][0];
  // Where everything in the row sits and how big it is: no color, no opacity.
  const SIZE = new Set(["h", "w", "w_full", "size", "min_w", "max_w", "flex_1", "flex_none", "px", "pl", "pr", "gap", "absolute", "relative", "top", "left", "right", "bottom", "inset_0", "truncate"]);
  const frame = (row) => [...walk(node(row))].filter((x) => x?.calls).map((x) => x.calls.filter(([m]) => SIZE.has(m)));
  for (const motion of ["expressive", "calm", "reduced"]) {
    const { h, v, cx, tree } = await footer({ agents: agentsOn(11), shared: { "shapr.settings": { motion } } });
    const rest = byId(tree, "machine");
    assert.deepEqual(argsOf(node(rest), "tooltip"), [["Add machine"]], motion);
    handler(rest, "on_hover")(true, cx);
    const over = byId(v.render(cx), "machine");
    assert.deepEqual(shown(node(over)), { texts: ["Add machine"], svgs: ["mods/shapr-workspace-chrome/kit/icons/add.svg"] }, motion);
    assert.deepEqual(frame(over), frame(rest), `${motion}: the row resized`);
    const fades = argsOf(node(over), "transition").filter(([p]) => p === "opacity");
    if (motion === "reduced") assert.deepEqual(fades, [], "reduced motion animates");
    else assert.ok(fades.length >= 2, `${motion}: the icon and the text don't fade`);
    // A click opens add machine, as before.
    handler(over, "on_click")({}, cx);
    assert.deepEqual(h.ran.filter(([c]) => c === "mod.open"), [["mod.open", { name: "shapr-machine-add" }]]);
    handler(over, "on_hover")(false, cx);
    const left = byId(v.render(cx), "machine");
    assert.deepEqual(shown(node(left)).texts, ["This computer · 11 agents"], `${motion}: leaving`);
    assert.deepEqual(frame(left), frame(rest));
  }
});

test("an active worktree's icon is filled, in the drawer and the rail", () => {
  const src = readFileSync(new URL("../shapr/mods/shapr-spaces/main.js", import.meta.url), "utf8");
  assert.match(src, /activeIcon: chromeIcon\(tree \? "call_split-fill" : "folder-fill"\)/);
  assert.match(src, /chromeIcon\(tree \? \(w\.active \? "call_split-fill" : "call_split"\)/);
});

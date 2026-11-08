// shapr's toast float: a notification shows once (however often the float redraws, and when it
// is posted twice), newest at the bottom; Herdr's agent notifications are mirrored once and go
// when answered; a blocked agent is marked the loudest; a click runs the action and closes it;
// a notification's icon shows.
import { test } from "node:test";
import assert from "node:assert/strict";
import { reset } from "herdr";
import { unknownCalls, argsOf, texts, walk } from "./stubs/element.js";
import Toasts, { QUEUE } from "../shapr/mods/shapr-toasts/main.js";

const cx = () => ({ timers: [], timer: { every(ms, f) { this.owner.timers.push(f); }, after() {} }, notify() {}, spawn() {}, focus_handle: () => ({ focus() {} }) });
function mount() {
  const c = cx();
  c.timer.owner = c;
  const v = new Toasts();
  v.init({}, c);
  return { v, c };
}
const count = (tree, text) => texts(tree).filter((t) => t === text).length;
const clickOf = (tree, id) => [...walk(tree)].find((n) => n?.calls?.some(([m, a]) => m === "id" && a[0] === id))?.calls.find(([m]) => m === "on_click")?.[1][0];

test("a posted notification shows once, however often the float redraws", () => {
  const h = reset();
  h.shared[QUEUE] = [{ id: "n1", at: Date.now(), title: "Build finished", body: "All green", level: "success" }];
  const { v } = mount();
  v.render();
  v.render();
  const tree = v.render();
  assert.equal(count(tree, "Build finished"), 1);
  assert.deepEqual([...unknownCalls], []);
});

test("the same notification posted twice still shows once; the newest is at the bottom", () => {
  const h = reset();
  const n = { id: "n1", at: 1, title: "Copied", level: "info" };
  h.shared[QUEUE] = [n, { ...n }, { id: "n2", at: 2, title: "Pushed", level: "info" }];
  const tree = mount().v.render();
  assert.equal(count(tree, "Copied"), 1);
  const order = texts(tree).filter((t) => t === "Copied" || t === "Pushed");
  assert.deepEqual(order, ["Copied", "Pushed"]);
});

test("an agent that turns blocked shows once, the loudest, and goes when answered", () => {
  const agent = { address: "t1", status: "working", seq: 1, focused: false, program: { name: "Claude Code" }, tab_name: "fix", space_name: "web" };
  const h = reset({ agents: [agent] });
  const { v } = mount();
  assert.equal(count(v.render(), "Claude Code needs you"), 0, "what was already so isn't news");
  h.agents = [{ ...agent, status: "blocked", seq: 2 }];
  v.render();
  const tree = v.render();
  assert.equal(count(tree, "Claude Code needs you"), 1);
  assert.ok(argsOf(tree, "border_color").some(([c]) => c === h.theme.blocked), "blocked is marked loudest");
  h.agents = [{ ...agent, status: "working", seq: 3 }];
  assert.equal(count(v.render(), "Claude Code needs you"), 0);
});

// bin/demo relies on this: it shows Shapr only once its fake agents are blocked or done, so no
// shot has a snackbar while the sidebar still says "Needs you".
test("an agent already blocked or done when the float first looks posts nothing", () => {
  const agent = { address: "t1", status: "blocked", seq: 1, focused: false, program: { name: "agent" }, tab_name: "fix", space_name: "web" };
  reset({ agents: [agent, { ...agent, address: "t2", status: "done" }] });
  const { v } = mount();
  v.render();
  const tree = v.render();
  assert.equal(count(tree, "agent needs you"), 0);
  assert.equal(count(tree, "agent finished"), 0);
});

test("a click runs the action and closes it; the X closes it for good", () => {
  const h = reset();
  h.shared[QUEUE] = [{ id: "n1", at: 1, title: "Agent done", level: "success", action: { name: "agent.focus", args: { terminal: "t1" } } },
    { id: "n2", at: 2, title: "Note", level: "info" }];
  const { v } = mount();
  clickOf(v.render(), "toast-n1-action")({}, { stop_propagation() {}, notify() {} });
  assert.deepEqual(h.ran, [["agent.focus", { terminal: "t1" }]]);
  assert.equal(count(v.render(), "Agent done"), 0);
  clickOf(v.render(), "toast-n2-close")({}, { stop_propagation() {}, notify() {} });
  h.shared[QUEUE] = [{ id: "n2", at: 2, title: "Note", level: "info" }];
  assert.equal(count(v.render(), "Note"), 0, "a closed one doesn't come back");
});

test("a notification goes after its timeout", () => {
  const h = reset();
  h.shared[QUEUE] = [{ id: "n1", at: Date.now() - 60000, title: "Old", level: "info" }];
  const { v, c } = mount();
  c.timers.forEach((f) => f({ notify() {} }));
  assert.equal(count(v.render(), "Old"), 0);
  assert.deepEqual(h.shared[QUEUE], []);
});

test("a notification's icon shows in its snackbar", () => {
  const h = reset();
  h.shared[QUEUE] = [{ id: "n1", at: Date.now(), title: "Pushed", level: "info", icon: "icons/git.svg" }, { id: "n2", at: Date.now(), title: "Plain", level: "info" }];
  const tree = mount().v.render();
  const svgs = [...walk(tree)].filter((n) => n?.kind === "svg").map((n) => n.arg);
  assert.equal(svgs.filter((a) => a === "icons/git.svg").length, 1);
  assert.deepEqual([...unknownCalls], []);
});

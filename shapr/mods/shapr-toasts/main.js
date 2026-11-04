// style: md3
// shapr's toasts: a float over the work area, bottom right, that draws notifications as MD3
// snackbars, since Herdr's notify() reaches only Herdr's own `toast` mod (an overlay per
// notification, its props { title, body, level, icon, action, timeout }) and that can't be
// restyled. In the layout: "floating": [{ "id": "toasts", "content": { "mod": "shapr-toasts" },
// "edge": "bottom", "align": "end" }].
//
// Two sources, each notification shown once (by id), newest at the bottom, the last SHOWN:
// - Herdr's own: an agent that needs the person (turned blocked while they aren't looking at
//   it) or finished (done: only while they weren't looking), read from agents() the way Herdr
//   decides to post. It goes when the agent is answered or looked at, or with its X.
// - Any mod's: notify()'s shape in shared QUEUE, newest last:
//   setShared("shapr.toasts", [...(shared("shapr.toasts") ?? []), { id, at: Date.now(), title,
//   body, level, action: { name, args, label }, timeout }]).
// A click (or its action) runs the action and closes it; X closes it; each goes after its
// timeout, never while the pointer is on the float. A blocked agent is the loudest: a blocked
// strip and outline, and it stays until answered.

import { View, div } from "gpui-kit";
import { v_flex } from "gpui-base";
import { agents, window, placement, run, shared, setShared } from "herdr";
import { snackbar, roles } from "./kit/index.js";

export const QUEUE = "shapr.toasts";
export const SHOWN = 3;
export const WIDTH = 360;
// ms on screen by level; an alert (an agent that needs the person) stays until answered.
const TIMEOUT = { info: 6000, success: 6000, warning: 10000, error: 12000, alert: Infinity };
// The status strip by level: Herdr's status colors, blocked the loudest.
const TONE = { alert: "blocked", error: "error", warning: "working", success: "done" };

/** The notification Herdr posts for an agent's change, or null when it posts none. */
export function agentNotice(a, looking) {
  const name = a.program?.name || a.app || "Agent";
  const where = [a.tab_name, a.space_name].filter(Boolean).join(" in ");
  const base = { address: a.address, status: a.status, body: where || null, at: Date.now(), action: { name: "agent.focus", args: { terminal: a.address }, label: "Show" } };
  if (a.status === "blocked" && !looking) return { ...base, id: `agent:${a.address}:blocked:${a.seq}`, title: `${name} needs you`, level: "alert" };
  if (a.status === "done") return { ...base, id: `agent:${a.address}:done:${a.seq}`, title: `${name} finished`, level: "success" };
  return null;
}

export default class Toasts extends View {
  init(_props, cx) {
    this.mirrored = []; // Herdr's agent notifications, mirrored here
    this.seen = new Set(); // every id ever shown, so none comes back
    this.last = null; // address -> status, at the last look
    this.gone = new Set(); // ids closed or timed out: a queued one doesn't come back
    this.stamps = new Map(); // id -> when first shown, for a queued one without `at`
    // Expiry: once a second, and only redraws when one goes.
    cx.timer.every(1000, (cx) => {
      if (placement()?.hovered) return;
      const now = Date.now();
      const alive = (n) => now - this.when(n) < (n.timeout ?? TIMEOUT[n.level] ?? TIMEOUT.info);
      const old = [...this.queue(), ...this.mirrored].filter((n) => !alive(n));
      if (old.length) { old.forEach((n) => this.dismiss(n)); cx.notify(); }
    });
  }

  // The queued notifications, each with an id.
  queue() {
    const q = shared(QUEUE);
    return Array.isArray(q) ? q.filter((n) => n && n.title).map((n) => (n.id ? n : { ...n, id: `${n.at}:${n.title}` })) : [];
  }

  when(n) {
    if (n.at) return n.at;
    if (!this.stamps.has(n.id)) this.stamps.set(n.id, Date.now());
    return this.stamps.get(n.id);
  }

  // Herdr's own notifications, from agents' changes since the last look.
  watch() {
    const now = new Map(agents().map((a) => [a.address, a]));
    const first = this.last === null;
    const before = this.last ?? new Map();
    this.last = new Map([...now].map(([k, a]) => [k, a.status]));
    // Answered or looked at: its notification goes.
    this.mirrored = this.mirrored.filter((n) => now.get(n.address)?.status === n.status);
    if (first) return; // what was already so when shapr showed isn't news
    const active = window()?.active !== false;
    for (const a of now.values()) {
      if (before.get(a.address) === a.status) continue;
      const n = agentNotice(a, active && a.focused);
      if (n && !this.seen.has(n.id)) { this.seen.add(n.id); this.mirrored.push(n); }
    }
  }

  dismiss(n) {
    this.gone.add(n.id);
    this.mirrored = this.mirrored.filter((x) => x.id !== n.id);
    const queue = this.queue();
    if (queue.some((x) => x.id === n.id)) setShared(QUEUE, queue.filter((x) => x.id !== n.id));
  }

  // Each id once, oldest first, so the newest is at the bottom.
  shown() {
    const byId = new Map();
    for (const n of [...this.queue(), ...this.mirrored]) if (!this.gone.has(n.id) && !byId.has(n.id)) byId.set(n.id, n);
    return [...byId.values()].sort((a, b) => this.when(a) - this.when(b)).slice(-SHOWN);
  }

  item(n) {
    const r = roles();
    const go = n.action?.name ? () => { run(n.action.name, n.action.args ?? {}); this.dismiss(n); } : null;
    const el = snackbar(`toast-${n.id}`, {
      title: String(n.title),
      body: n.body ? String(n.body) : null,
      tone: TONE[n.level] ?? null,
      width: WIDTH,
      action: go ? { label: n.action.label ?? "Show", onClick: go } : null,
      onClose: () => this.dismiss(n),
      onClick: go,
    });
    return n.level === "alert" ? el.border_2().border_color(r.blocked) : el;
  }

  render() {
    this.watch();
    const list = this.shown();
    if (!list.length) return div();
    // Over Herdr's float frame's 5 above and below, so the snackbars are the frame's whole face.
    return v_flex().id("toasts").w(WIDTH).my(-5).gap(8).children(list.map((n) => this.item(n)));
  }
}

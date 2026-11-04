// style: md3
// Agents in grouped or priority views; parents take their most urgent sub-agent's place.
// A viewed done agent stays in Done until left.
// Drawn as MD3 navigation drawer content: quiet list subheaders (title small, a plain count),
// 40 drawer items, the kit's status marks (blocked: a filled "Needs you" pill, the loudest),
// 32 rail pills. Color in the list is only the status mark and the active item.

import { View, div, image, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { agents, terminals, panes, focused, spaces, run, shared, setShared, setAgentOrder, openOverlay, closeOverlay, props, window, layout } from "herdr";
import { roles, onStatus, type, label, heading, navItem, iconButton, statusMark, menuSurface, menuHeader, menuItem, menuHeight, icon as kitIcon, press, H, SPACE, SHAPE } from "./kit/index.js";

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

// The sidebar's rail goes by its width, not a flag: dragging its edge narrows it too.
const narrow = () => (find(layout(), "sidebar")?.size?.px ?? Infinity) < 160;

// To the rail (on macOS wide enough for the traffic lights), or back to the width it had.
function toggleSidebar() {
  const width = find(layout(), "sidebar")?.size?.px;
  if (!narrow()) setShared("sidebar.width", width);
  // Mods edited before the rail went by width still read the flag.
  setShared("sidebar.collapsed", !narrow());
  run("layout.resize", { id: "sidebar", px: narrow() ? (shared("sidebar.width") ?? 268) : window()?.platform === "macos" ? 76 : 44 });
}

const clean = (s) => (s ?? "").replace(/^[^\p{L}\p{N}]+/u, "").trim();

function lead(tab, all = panes()) {
  const mine = all.filter(p => p.tab === tab.id && p.terminal);
  return mine.find(p => p.program?.agent) ?? mine.find(p => p.focused) ?? mine[0];
}

function title(tab, l) {
  const prog = l?.program?.name;
  const live = clean(l?.title);
  const telling = live && live !== prog && !/^[~/]|^[A-Za-z]:\\/.test(live) && !live.includes("@") && live.toLowerCase() !== l?.program?.key;
  return (tab.name === prog || !tab.named) && telling ? live : tab.name;
}
const RANK = { blocked: 4, done: 3, working: 2, idle: 1 };
// A sub-agent without a pane isn't in agents(): its raw word, error counting as
// blocked. It's never done: it reports to its parent, and the parent's done is the news.
const kidStatus = (k, listed) => {
  const s = listed.get(k.address) ?? k.status;
  return s === "error" ? "blocked" : s === "done" ? "idle" : s;
};
// An icon shapr-workspace-chrome holds for the chrome's mods.
const chrome = (name) => `mods/shapr-workspace-chrome/${name}.svg`;
const SORTS = [
  { id: "priority", label: "Priority", icon: chrome("schedule") },
  { id: "grouped", label: "Grouped by space", icon: chrome("layers") },
];
// The sort popup's size: exactly its menu, a header and one item per sort (kit menuHeight).
const SORT_W = 224;
const sortHeight = () => menuHeight({ items: SORTS.length, headers: 1 });
const sortOf = () => SORTS.find((s) => s.id === shared("agents.sort")) ?? SORTS[0];
const SECTION = { 4: "Needs you", 3: "Done", 2: "Working", 1: "Idle" };
const SECTION_STATUS = { 4: "blocked", 3: "done", 2: "working" };

function duration(ms) {
  const m = Math.floor(ms / 60000);
  if (m < 1) return "<1m";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

// The agent's icon from the app's program table: a one-color glyph or a picture.
function icon(p, size, color) {
  if (!p?.icon) return null;
  return p.tint ? svg(p.icon).size(size).flex_none().text_color(color) : image(p.icon).w(size).h(size).flex_none();
}

export default class Agents extends View {
  init(_props, cx) {
    if (props()?.sortMenu) return;
    this.folded = new Set();
    // Each agent's last state and when it changed (ms), kept across restarts.
    this.changed = JSON.parse(localStorage.getItem("changed") ?? "{}");
    this.pendingPins = JSON.parse(localStorage.getItem("pins") ?? "[]");
    if (!this.pendingPins.length) localStorage.removeItem("pins");
    this.migratingPins = new Set();
    cx.timer.every(30000, (cx) => cx.notify());
  }

  // Stamps agents whose state changed. Done and idle count as one: looking at a
  // finished agent turns done into idle, and looking isn't the agent doing anything.
  track(list, now) {
    let dirty = false;
    for (const a of list) {
      const s = a.status === "done" ? "idle" : a.status;
      if (this.changed[a.address]?.s === s) continue;
      this.changed[a.address] = { s, at: now };
      dirty = true;
    }
    if (!dirty) return;
    // Gone and old: the list alone is empty right after a start.
    const listed = new Set(list.map((a) => a.address));
    for (const [k, c] of Object.entries(this.changed)) if (!listed.has(k) && now - c.at > 30 * 86400000) delete this.changed[k];
    localStorage.setItem("changed", JSON.stringify(this.changed));
  }

  // Keep offline pins until their terminal returns, and keep each pending until
  // core echoes the label so a failed write doesn't erase the old pin.
  migratePins(all) {
    const listed = new Map(all.filter((t) => t.state === "live").map((t) => [t.address, t]));
    const pending = this.pendingPins.filter((address) => {
      const terminal = listed.get(address);
      if (!terminal) return true;
      if (terminal.labels?.["herdr.pinned"]) return false;
      if (!this.migratingPins.has(address)) {
        this.migratingPins.add(address);
        run("terminal.pin", { terminal: address, pinned: true });
      }
      return true;
    });
    if (pending.length === this.pendingPins.length) return;
    this.pendingPins = pending;
    if (pending.length) localStorage.setItem("pins", JSON.stringify(pending));
    else localStorage.removeItem("pins");
  }

  since(a) {
    return this.changed[a.address]?.at ?? 0;
  }

  // Looking at a done agent makes it idle; it stays with Done until you leave
  // it rather than drop away under you. Any other change moves it at once.
  hold(list) {
    const cur = list.find((a) => a.focused);
    const same = cur && cur.address === this.held?.address;
    // Arriving, or any change but done turning idle, sets what it was.
    if (!same || cur.status !== "idle") this.held = cur ? { address: cur.address, rank: RANK[cur.status] ?? 0 } : null;
  }

  rank(a) {
    const sawDone = a.address === this.held?.address && this.held.rank === RANK.done && a.status === "idle";
    return sawDone ? RANK.done : RANK[a.status] ?? 0;
  }

  // The sort popup this mod opens on itself: an MD3 menu, its surface drawn here (frame: "none").
  sortMenu(r) {
    const on = sortOf().id;
    return menuSurface(v_flex().size_full())
      .child(menuHeader("Sort agents"))
      .children(SORTS.map((s) => menuItem(`sort-${s.id}`, s.label, {
        icon: s.icon,
        selected: s.id === on,
        onClick: () => {
          setShared("agents.sort", s.id);
          closeOverlay(props().overlay);
        },
      })));
  }

  peek(addr) {
    run("terminal.peek", { terminal: addr });
  }

  // Live sub-agents of `addr`, depth first, each with the tree lines in front of it.
  tree(all, addr, lead = []) {
    const kids = all.filter((k) => k.parent === addr && k.state === "live");
    return kids.flatMap((k, i) => {
      const last = i === kids.length - 1;
      return [
        { t: k, lines: [...lead, last ? "└" : "├"] },
        ...this.tree(all, k.address, [...lead, last ? "" : "│"]),
      ];
    });
  }

  // A sub-agent: a 32 row under its parent, tree lines from the parent's icon; the one shown
  // (peeked) on secondary-container.
  subRow(r, s, shown, compact) {
    const k = s.t;
    const st = kidStatus(k, this.listed);
    const on = k.address === shown;
    const pic = icon(k.program, 16, on ? r.onSecondaryContainer : r.onSurfaceVariant);
    let el = h_flex()
      .id(`sub-${k.address}`)
      .pl(SPACE.xl)
      .pr(SPACE.lg)
      .rounded_full()
      .h(H.sm)
      .w_full()
      .flex_none()
      .items_center()
      .when(on, (el) => el.bg(r.secondaryContainer));
    el = press(type(el, "bodyMedium"), () => this.peek(k.address), { layer: on ? "lift" : r.hover, propagate: true });
    return el
      .children(s.lines.map(l => div().self_start().mt(-SPACE.sm).w(SPACE.md).h(SPACE.xl).mr(SPACE.xs).flex_none()
        .when(Boolean(l), el => el.border_l(1.5).border_color(r.outlineVariant))
        .when(l === "└" || l === "├", el => el.border_b(1.5).rounded_bl(SHAPE.sm))))
      .when(Boolean(pic), el => el.child(div().flex_none().mr(SPACE.sm).child(pic)))
      .child(div().flex_1().min_w(0).truncate().text_color(on ? r.onSecondaryContainer : r.onSurfaceVariant).child(k.name || k.template || k.program?.name || k.address))
      .child(div().flex_none().ml(SPACE.sm).child(this.status(r, { status: st }, compact)));
  }

  // The kit's status mark in a 14 slot; blocked, where no header already says "Needs you",
  // is a filled "Needs you" pill in the blocked color: the loudest thing in the sidebar.
  status(r, a, compact = false) {
    if (a.status === "blocked" && !compact)
      return type(h_flex(), "labelSmall", true).flex_none().h(20).px(SPACE.sm).items_center().rounded_full().bg(r.blocked).text_color(onStatus()).child("Needs you");
    const known = ["working", "blocked", "done", "idle"].includes(a.status);
    return h_flex().w(14).h(14).flex_none().items_center().justify_center().child(known ? statusMark(a.status) : div().size(8));
  }

  render(cx) {
    const r = roles();
    if (props()?.sortMenu) return this.sortMenu(r);
    const collapsed = narrow();
    const sort = sortOf();
    let list = agents();
    this.listed = new Map(list.map((a) => [a.address, a.status]));
    const all = terminals();
    this.migratePins(all);
    const shown = focused()?.agent;
    const now = Date.now();
    this.track(list, now);
    this.hold(list);
    const byPriority = sort.id === "priority";
    const urgency = new Map(list.map((a) => [a.address, Math.max(this.rank(a), ...this.tree(all, a.address).map((s) => RANK[kidStatus(s.t, this.listed)] ?? 0))]));
    const rankOf = (a) => urgency.get(a.address);
    if (byPriority) list = [...list].sort((x, y) => rankOf(y) - rankOf(x) || this.since(y) - this.since(x) || y.seq - x.seq);
    const pinned = list.filter((a) => a.pinned);
    const rest = list.filter((a) => !a.pinned);
    list = [...pinned, ...rest];
    setAgentOrder(list.map((a) => a.address));

    const withKids = (a, i) => {
      const subs = collapsed ? [] : this.tree(all, a.address);
      const row_ = row(a, i, subs);
      if (this.folded.has(a.address)) return [row_];
      return [row_, ...subs.map((s) => this.subRow(r, s, shown, byPriority))];
    };

    // The fold chevron; folded, the count too.
    const fold = (a, subs) => {
      const open = !this.folded.has(a.address);
      let el = h_flex()
        .id(`fold-${a.address}`)
        .h(H.xs)
        .px(SPACE.xs)
        .gap(SPACE.xxs)
        .flex_none()
        .items_center()
        .rounded_full()
        .text_color(r.onSurfaceVariant);
      el = press(type(el, "labelSmall"), (_e, cx) => {
        open ? this.folded.add(a.address) : this.folded.delete(a.address);
        cx.notify();
      }, { layer: r.hover });
      return el
        .child(svg(kitIcon(open ? "keyboard_arrow_down" : "chevron_right")).size(16).flex_none())
        .when(!open, (el) => el.child(String(subs.length)));
    };

    // A row reads "space · detail": the detail is a tab someone named or the
    // agent's own title, never an automatic tab number unless two rows would
    // otherwise read the same.
    const tabs = spaces().flatMap(s => s.tabs);
    const label_ = (a) => {
      const tab = tabs.find(tab => tab.id === a.tab);
      return tab ? title(tab, lead(tab)) : a.title || a.program?.name || "";
    };
    const detail = new Map(list.map(a => [a.address, /^\d+$/.test(label_(a)) ? null : label_(a)]));
    const seen = {};
    for (const a of list) { const k = `${a.space_name}\u0000${detail.get(a.address) ?? ""}`; seen[k] = (seen[k] ?? 0) + 1; }
    for (const a of list) {
      if (detail.get(a.address) == null && seen[`${a.space_name}\u0000`] > 1) detail.set(a.address, label_(a));
    }

    const row = (a, i, subs = []) => {
      const more = detail.get(a.address);
      // An agent on another machine (`vps/t7`) says which.
      const machine = a.address.includes("/") ? a.address.split("/")[0] : null;
      if (collapsed) {
        // The rail: a 32 pill, the agent's number and its status.
        let el = h_flex()
          .id(`ag-${a.address}`)
          .h(H.sm)
          .w_full()
          .px(SPACE.sm)
          .flex_none()
          .items_center()
          .gap(SPACE.xs)
          .rounded_full()
          .when(a.focused, (el) => el.bg(r.secondaryContainer));
        el = type(el, "labelLarge", a.focused).text_color(a.focused ? r.onSecondaryContainer : r.onSurfaceVariant);
        el = press(el, () => run("pane.focus", { pane: a.pane }), { layer: a.focused ? "lift" : r.hover, propagate: true });
        return el
          .child(div().flex_1().min_w(0).whitespace_nowrap().text_right().child(String(i + 1)))
          .child(this.status(r, a, true));
      }
      // Glyphs tinted on-surface-variant; pictures keep their own colors.
      const pic = icon(a.program, 16, a.focused ? r.onSecondaryContainer : r.onSurfaceVariant);
      const when = this.since(a);
      const isPinned = a.pinned;
      const hovered = this.hovered === a.address;
      const pin = iconButton(`pin-${a.address}`, chrome(isPinned ? "keep_off" : "keep"), {
        size: "xs",
        tip: isPinned ? "Unpin" : "Pin to the top",
        onClick: () => {
          run("terminal.pin", { terminal: a.address, pinned: !isPinned });
          // The row moves away from under the pointer, and no hover-out comes.
          this.hovered = null;
        },
      });
      // Under a space header the space goes without saying; an automatic tab number says nothing.
      // Without a space header above (priority, pinned) the row names its space.
      const full = byPriority || isPinned;
      const name = full ? a.space_name || label_(a) : more ?? (/^\d+$/.test(label_(a)) ? a.program?.name || label_(a) : label_(a));
      const text = h_flex().w_full().min_w(0).gap(SPACE.xs).items_center()
        .child(div().min_w(0).max_w(full && more ? 120 : 200).truncate().text_color(a.focused ? r.onSecondaryContainer : r.onSurface).child(name))
        .when(full && Boolean(more), el => el.child(type(div(), "bodySmall").flex_1().min_w(0).truncate().text_color(r.onSurfaceVariant).child(`· ${more}`)));
      const leading = pic ? div().id(`agent-fold-${a.address}`).flex().items_center()
        .when(subs.length > 0, el => el.on_click((_e, cx) => {
          cx.stop_propagation();
          this.folded.has(a.address) ? this.folded.delete(a.address) : this.folded.add(a.address);
          cx.notify();
        })).child(pic) : null;
      // The time slot holds the pin while pointed at, so nothing moves.
      const trailing = h_flex().gap(SPACE.xs).items_center()
        .when(Boolean(machine), el => el.child(label(machine, { style: "labelSmall", role: "onSurfaceVariant" }).flex_none()))
        .when(subs.length > 0, el => el.child(fold(a, subs)))
        .when(hovered || Boolean(when), el => el.child(h_flex().w(28).flex_none().justify_end().items_center()
          .child(hovered ? pin : label(duration(now - when), { style: "labelMedium", role: "onSurfaceVariant" }))))
        .child(this.status(r, a, byPriority && !isPinned));
      return navItem(`ag-${a.address}`, text, { leading, active: a.focused, trailing, propagate: true, onClick: () => run("pane.focus", { pane: a.pane }) })
        .pr(SPACE.md)
        .on_hover((on, cx) => {
          if (on) this.hovered = a.address;
          else if (this.hovered === a.address) this.hovered = null;
          cx.notify();
        });
    };

    // Groups in list order: spaces (grouped) or priority sections. Agents of a
    // space are next to each other in agents(), so neighbours make a group.
    const groups = pinned.length ? [{ id: "pinned", label: "Pinned", status: null, members: pinned }] : [];
    for (const a of rest) {
      const rk = rankOf(a) || RANK.idle;
      const id = byPriority ? `sec-${rk}` : `sp-${a.space}`;
      if (groups.at(-1)?.id === id) groups.at(-1).members.push(a);
      else groups.push({ id, label: byPriority ? SECTION[rk] : a.space_name || "", status: byPriority ? SECTION_STATUS[rk] : null, members: [a] });
    }

    // A group's list subheader, title small in on-surface-variant; it folds the group. Its count
    // is plain text. Folded, it says how many and shows the most urgent state's mark.
    const header = (g) => {
      const open = !this.folded.has(g.id);
      const top = g.members.reduce((m, a) => ((RANK[a.status] ?? 0) > (RANK[m] ?? 0) ? a.status : m), null);
      const n = g.members.length;
      const count = label(String(n), { style: "labelMedium", role: "onSurfaceVariant" }).flex_none();
      let el = h_flex()
        .id(g.id)
        .mt(SPACE.xs)
        .px(SPACE.lg)
        .h(36)
        .flex_none()
        .gap(SPACE.sm)
        .items_center()
        .rounded_full()
        .text_color(r.onSurfaceVariant);
      el = press(type(el, "titleSmall"), (_e, cx) => {
        open ? this.folded.add(g.id) : this.folded.delete(g.id);
        cx.notify();
      }, { layer: r.hover });
      return el
        .child(div().min_w(0).truncate().child(g.label))
        .when(byPriority || !open, (el) => el.child(count))
        .child(div().flex_1())
        .when(!open, (el) => el
          .when(!byPriority && top && top !== "idle", (el) => el.child(this.status(r, { status: top }, true)))
          .child(svg(kitIcon("chevron_right")).size(18).flex_none().text_color(r.onSurfaceVariant)));
    };
    const rows = collapsed
      ? list.flatMap(withKids)
      : groups.flatMap((g) => [header(g), ...(this.folded.has(g.id) ? [] : g.members.flatMap(withKids))]);

    return type(v_flex(), "bodyMedium")
      .size_full()
      .min_h(0)
      .bg(r.surface)
      .text_color(r.onSurface)
      .when(!collapsed, (el) =>
        el.child(
          heading("Agents", {
            trailing: iconButton("ag-sort", sort.icon, {
              size: "sm",
              tip: `Sort agents: ${sort.label}`,
              onClick: () => openOverlay({ mod: "shapr-agents", kind: "popup", frame: "none", width: SORT_W, height: sortHeight(), props: { sortMenu: true } }),
            }),
          }).mt(SPACE.sm).pr(SPACE.sm),
        ),
      )
      .when(list.length === 0 && !collapsed, (el) =>
        el.child(label("No agent status yet. Agents show up here when they report their status. Older versions and agents inside tmux may not.", { style: "bodySmall", role: "onSurfaceVariant" }).px(SPACE.lg).py(SPACE.sm)),
      )
      .child(v_flex().id("ag-list").flex_1().min_h(0).px(collapsed ? SPACE.xs : SPACE.md).pb(SPACE.sm).gap(collapsed ? SPACE.xxs : 0).overflow_y_scrollbar().mode("scrolling").children(rows))
      .when(collapsed, (el) =>
        el.child(
          h_flex()
            .h(H.lg)
            .flex_none()
            .items_center()
            .justify_center()
            .child(iconButton("collapse", kitIcon("chevron_right"), { size: "sm", tip: "Expand the sidebar", onClick: toggleSidebar })),
        ),
      );
  }
}

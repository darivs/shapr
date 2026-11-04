// style: md3
// Go to a tab. Drops from the sidebar's search (popup, at: "top", mod.json's overlay), as an MD3
// search view: a search bar over the results, on surface-container-high, rounded 28. Spaces with
// something that needs you come first, quiet spaces (no agent running)
// fold into "earlier". Type to filter, ↑/↓ and Enter to go, ctrl+d to close
// a tab, Esc to leave. Last rows: new work (a tab here, a space on this
// computer or on each connected machine). The surface fits its rows (at most LIST tall, then
// they scroll) and never outgrows the overlay (height 0.8 of the window).

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { agents, spaces, terminals, run, hc, theme, props, closeOverlay, shared, setShared } from "herdr";
import { roles, press, icon, type, label, statusMark, divider, onStatus, layoutPx, searchBar, dialogSurface, ROW, RADIUS, SHAPE } from "./kit/index.js";

// Space colors, kept by space id in shared "space.colors": a theme
// color name ("ansi6") or a picked #rrggbb. A space seen without one gets
// the theme color fewest spaces use, once; every mod does the same in the
// same order, so they agree, and adding or renaming spaces moves nothing.
const PROJECT_COLORS = ["ansi6", "ansi3", "ansi4", "ansi5", "ansi2", "ansi1"];
function spaceColors() {
  const ids = new Set(spaces().map((p) => p.id));
  const kept = Object.fromEntries(Object.entries(shared("space.colors") ?? {}).filter(([id]) => ids.has(id)));
  let changed = Object.keys(kept).length !== Object.keys(shared("space.colors") ?? {}).length;
  for (const p of spaces()) {
    if (kept[p.id] || p.name === "~") continue;
    const uses = (c) => Object.values(kept).filter((v) => v === c).length;
    kept[p.id] = PROJECT_COLORS.reduce((best, c) => (uses(c) < uses(best) ? c : best));
    changed = true;
  }
  if (changed) setShared("space.colors", kept);
  return kept;
}
// A space's avatar, as the spaces sidebar draws it (shapr-spaces row()): 24, rounded sm, its
// first letter in label medium emphasized on its stored color (a theme ansi name or a #rrggbb;
// none yet: ansi6).
function avatar(w) {
  const t = theme();
  const r = roles();
  const color = (shared("space.colors") ?? {})[w.id] ?? "ansi6";
  const fill = color.startsWith("#") ? color : (t[color] ?? r.primary);
  return type(div(), "labelMedium", true).size(24).flex_none().flex().items_center().justify_center().rounded(SHAPE.sm).bg(fill).text_color(onStatus())
    .child([...w.name][0]?.toUpperCase() ?? "?");
}

// Row heights in the strip; the list is at most LIST tall.
const ROWS = () => ({ head: 36, earlier: ROW.one + 9, new: ROW.one, ctx: ROW.one, space: ROW.one });
const LIST = 400;
const PAD = 12;


export default class Picker extends View {
  init(_props, cx) {
    this.filter = "";
    this.input = InputState.new({ placeholder: "Go to a tab, space or agent…" });
    this.input.on("change", (_e, cx) => { this.filter = this.input.value(); this.at = 0; cx.notify(); });
    this.input.on("submit", () => this.go(this.rows().filter(r => r.kind === "ctx" || r.kind === "new" || r.kind === "space")[this.at]));
    this.input.focus();
    cx.timer.after(600, () => this.input.focus());
    this.at = null;
    this.scroll = 0;
    this.showEarlier = false;
    this.machines = [];
    this.handle = cx.focus_handle();
    cx.spawn(async (cx) => {
      try {
        const r = await hc(["machine", "ls", "--json"]);
        if (r.code === 0) this.machines = (JSON.parse(r.stdout).machines ?? []).filter((m) => m.state === "connected" && !m.temporary).map((m) => m.name);
      } catch {}
      cx.notify();
    });
  }

  close() {
    closeOverlay(props().overlay);
  }

  rows() {
    const f = this.filter.toLowerCase();
    const all = agents();
    const live = terminals().filter((x) => x.state === "live");
    const teamOf = (addrs) => {
      let n = 0;
      const walk = (a) => live.filter((x) => x.parent === a).forEach((k) => (n++, walk(k.address)));
      addrs.forEach(walk);
      return n;
    };
    const groups = spaces().map((w) => {
      const ctxs = w.tabs
        .map((ctx) => {
          const mine = all.filter((a) => a.tab === ctx.id);
          return { w, ctx, mine, team: teamOf(mine.map((a) => a.address)) };
        })
        .filter((c) => !f || [w.name, c.ctx.name, ...c.mine.map((a) => a.program?.name ?? "")].join(" ").toLowerCase().includes(f));
      return { w, ctxs };
    });
    const busy = groups.filter((p) => p.w.status && p.ctxs.length);
    const quiet = groups.filter((p) => !p.w.status && p.ctxs.length);
    busy.sort((a, b) => (b.w.status === "blocked") - (a.w.status === "blocked"));
    const out = [];
    const add = (p) => {
      out.push({ kind: "head", w: p.w });
      for (const c of p.ctxs) out.push({ kind: "ctx", ...c });
    };
    busy.forEach(add);
    if (quiet.length) {
      out.push({ kind: "earlier", count: quiet.length });
      if (this.showEarlier || f) quiet.forEach(add);
    }
    out.push({ kind: "new" });
    out.push({ kind: "space", machine: null });
    for (const m of this.machines) out.push({ kind: "space", machine: m });
    return out;
  }

  go(r) {
    if (!r) return;
    this.close();
    if (r.kind === "ctx") run("tab.select", { id: r.ctx.id });
    else if (r.kind === "new") run("tab.new");
    else if (r.kind === "space") run("space.new", { machine: r.machine ?? "" });
  }

  render() {
    const r = roles();
    spaceColors();
    const rows = this.rows();
    const pickable = rows.filter((x) => x.kind === "ctx" || x.kind === "new" || x.kind === "space");
    // Opens on where you are.
    if (this.at === null) this.at = Math.max(0, pickable.findIndex((x) => x.kind === "ctx" && x.w.active && x.ctx.active));
    this.at = Math.min(this.at, pickable.length - 1);
    const sel = pickable[this.at];
    // One continuous strip: each row (and the group title before it) at a fixed
    // y. Scrolling moves the strip only as far as it takes to keep the selected
    // row in view, so the arrows can't run the selection off the list.
    const HT = ROWS();
    const tops = [];
    let y = 0;
    rows.forEach((x) => { tops.push(y); y += HT[x.kind] ?? ROW.one; });
    const total = y;
    const height = Math.min(LIST, this.listHeight ?? LIST);
    const fixed = total > height;
    const maxScroll = Math.max(0, total - height);
    this.scroll = Math.max(0, Math.min(this.scroll, maxScroll));
    const si = rows.indexOf(sel);
    if (si >= 0) {
      if (tops[si] < this.scroll) this.scroll = tops[si];
      if (tops[si] + (HT[sel.kind] ?? ROW.one) > this.scroll + height) this.scroll = tops[si] + (HT[sel.kind] ?? ROW.one) - height;
    }
    const place = (el, i) =>
      fixed
        ? el.absolute().left(0).right(0).top(tops[i] - this.scroll).h(HT[rows[i].kind] ?? ROW.one)
        : el;
    const visible = (i) => !fixed || (tops[i] + (HT[rows[i].kind] ?? ROW.one) > this.scroll && tops[i] < this.scroll + height);

    // A pickable row: 40 tall, rounded md, hover layer; the keyboard's row on secondary-container.
    const pick = (id, on, onClick) => press(h_flex().id(id).h(ROW.one).flex_none().px(16).gap(12).items_center().rounded(RADIUS.row)
      .text_color(on ? r.onSecondaryContainer : r.onSurface).when(on, (el) => el.bg(r.secondaryContainer)), onClick, { layer: on ? "lift" : r.hover });

    const row = (x) => {
      if (x.kind === "head") {
        return type(h_flex(), "titleSmall").h(36).flex_none().px(16).gap(12).items_center().text_color(r.onSurfaceVariant)
          .child(avatar(x.w))
          .child(div().flex_1().min_w(0).truncate().child(x.w.name));
      }
      if (x.kind === "earlier") {
        return v_flex().flex_none()
          .child(divider({ space: 4 }))
          .child(press(h_flex().id("pk-earlier").h(ROW.one).flex_none().px(16).gap(12).items_center().rounded(RADIUS.row).text_color(r.onSurfaceVariant),
            () => { this.showEarlier = !this.showEarlier; }, { layer: r.hover })
            .child(svg(icon(this.showEarlier ? "keyboard_arrow_down" : "chevron_right")).size(20).flex_none())
            .child(type(div(), "labelLarge").flex_1().min_w(0).truncate().child(`Earlier: ${x.count} quiet space${x.count > 1 ? "s" : ""}`)));
      }
      const on = x === sel;
      if (x.kind === "new" || x.kind === "space") {
        const text = x.kind === "new" ? "New tab" : x.machine ? `New space on ${x.machine}` : "New space";
        return pick(x.kind === "new" ? "pk-new" : `pk-space-${x.machine ?? "here"}`, on, () => this.go(x))
          .child(svg(icon("add")).size(20).flex_none().text_color(on ? r.onSecondaryContainer : r.onSurfaceVariant))
          .child(type(div(), "labelLarge").flex_1().min_w(0).truncate().child(text));
      }
      const who = x.mine.map((a) => a.program?.name ?? "agent").join(" · ");
      const here = x.w.active && x.ctx.active;
      const st = x.ctx.status;
      return pick(`pk-${x.ctx.id}`, on, () => this.go(x))
        .child(div().w(20).flex_none().flex().items_center().justify_center().when(Boolean(st), (el) => el.child(statusMark(st))))
        .child(type(div(), "bodyMedium", here).flex_1().min_w(0).truncate().child(x.ctx.name))
        .when(st === "blocked", (el) => el.child(type(div(), "labelMedium", true).flex_none().text_color(r.blocked).child("Needs you")))
        .when(st === "done", (el) => el.child(type(div(), "labelMedium").flex_none().text_color(r.done).child("Finished")))
        .when(Boolean(who || x.team), (el) => el.child(type(div(), "labelSmall").flex_none().max_w(200).truncate().text_color(on ? r.onSecondaryContainer : r.onSurfaceVariant).child(who + (x.team ? `  +${x.team}` : ""))));
    };

    // A popup over an undimmed window: a hairline edge carries the lift, as menus do.
    return dialogSurface(v_flex(), { fit: true }).border_1().border_color(roles().outlineVariant)
      .id("picker")
      .track_focus(this.handle)
      .p(PAD)
      .gap(8)
      .on_key_down((e, cx) => {
        const k = e.key;
        if (k === "escape") return this.close();
        if (k === "down") this.at = (this.at + 1) % pickable.length;
        else if (k === "up") this.at = (this.at + pickable.length - 1) % pickable.length;
        else if (k === "d" && e.modifiers.control) {
          if (sel?.kind === "ctx") {
            this.close();
            run("tab.close", { id: sel.ctx.id });
          }
        } else return;
        cx.stop_propagation();
        cx.notify();
      })
      // The search bar: a 48 pill on surface-container-highest, search icon leading.
      .child(searchBar(Input.new(this.input).w_full().text_color(r.onSurface),
        { trailing: label("Esc", { style: "labelMedium", role: "onSurfaceVariant" }).pr(8) }))
      .child(
        v_flex()
          .id("pk-list")
          .on_size_change((size, cx) => {
            this.listHeight = layoutPx(size.height);
            cx.notify();
          })
          .h(Math.min(LIST, total))
          .min_h(0)
          .flex_shrink(1)
          .relative()
          .when(fixed, (el) =>
            el.overflow_hidden().on_scroll_wheel((e, cx) => {
              this.scroll = Math.max(0, Math.min(this.scroll - e.delta.y, maxScroll));
              // The selection follows the wheel, so the next frame doesn't scroll back to it.
              while (this.at < pickable.length - 1 && tops[rows.indexOf(pickable[this.at])] < this.scroll) this.at++;
              while (this.at > 0 && tops[rows.indexOf(pickable[this.at])] + (HT[pickable[this.at].kind] ?? ROW.one) > this.scroll + height) this.at--;
              cx.notify();
            }))
          .children(rows.map((x, i) => (visible(i) ? place(row(x), i) : null)).filter(Boolean)),
      );
  }
}

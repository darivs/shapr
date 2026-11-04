// style: md3
import { View, div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { spaces, panes, run, openOverlay, window, shared, layout, settings } from "herdr";
import { button, iconButton, statusMark, roles, icon, H, SPACE, newMenuSpec, tabMenuSpec, renameSpec, chromeIcon } from "./kit/index.js";

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

export default class Tabs extends View {
  init() {
    this.pressed = null;
    this.panels = JSON.parse(localStorage.getItem("panels") ?? "{}");
  }

  // The side panel is remembered per space: switching shows that space's choice
  // (closed if it never had one), and opening or closing it records it.
  syncPanel(space, panel, body, enabled) {
    if (!space || !panel) return;
    const now = panel.hidden ? null : body?.active ?? null;
    if (space.id !== this.space) {
      const first = this.space === undefined;
      this.space = space.id; this.pending = null;
      if (!(first && !(space.id in this.panels))) {
        const stored = this.panels[space.id] ?? null, want = enabled.includes(stored) ? stored : null;
        if (want !== now) {
          this.pending = { want, until: Date.now() + 1000 };
          if (want) { run("layout.select", { stack: "panel-body", child: want }); run("layout.show", { id: "panel" }); }
          else run("layout.hide", { id: "panel" });
          return;
        }
      }
    }
    // Until the restore lands (or something else won), the old state isn't a choice.
    if (this.pending) {
      if (this.pending.want !== now && Date.now() < this.pending.until) return;
      this.pending = null;
    }
    if (this.panels[space.id] === now) return;
    this.panels[space.id] = now;
    localStorage.setItem("panels", JSON.stringify(this.panels));
  }

  render() {
    const r = roles();
    const space = spaces().find(p => p.active);
    const shown = space?.tabs ?? [];
    const item = (c, i) => {
      const program = panes().find(p => p.tab === c.id && p.program?.agent)?.program ?? panes().find(p => p.tab === c.id)?.program;
      const name = /^tb\d+$/.test(c.name) ? program?.name ?? "Terminal" : c.name;
      const glyph = program?.icon ? (program.tint ? svg(program.icon).size(16).text_color(c.active ? r.onSecondaryContainer : r.onSurfaceVariant) : image(program.icon).size(16)) : null;
      const status = c.status && c.status !== "idle" ? statusMark(c.status) : null;
      const close = c.active ? iconButton(`close-${c.id}`, icon("close"), { size: "xs", tip: "Close tab", onClick: () => run("tab.close", { id: c.id }) }) : null;
      const end = status || close ? h_flex().gap(SPACE.xs).items_center().when(Boolean(status), el => el.child(status)).when(Boolean(close), el => el.child(close)) : null;
      return button(`tab-${c.id}`, c.zoomed ? `${name} Z` : name, { kind: "text", size: "sm", selected: c.active, leading: glyph, end, maxLabel: 170, interactive: true })
        .when(!c.active, el => el.text_color(r.onSurfaceVariant))
        .on_mouse_down("left", (e, cx) => { cx.stop_propagation(); this.pressed = i; if (e.click_count === 2) openOverlay(renameSpec("tab", c.id)); })
        .on_mouse_up("left", () => {
          const from = this.pressed; this.pressed = null;
          if (from !== null && from !== i) run("tab.move", { id: shown[from].id, index: space.tabs.findIndex(x => x.id === c.id) + 1 });
          else run("tab.select", { id: c.id });
        })
        .on_mouse_down("right", (_e, cx) => { cx.stop_propagation(); openOverlay(tabMenuSpec(c.id, space.id)); });
    };
    const root = layout(), sidebar = find(root, "sidebar"), w = window();
    // Old saved rails and a dragged-narrow sidebar can be smaller than the window buttons.
    // The bar's edge padding is the same 8 as above and below its 32 controls.
    const lightsPadding = w?.platform === "macos" && w.titlebar === "none" && !w.fullscreen && root?.traffic_lights
      ? Math.max(SPACE.sm, (root.traffic_lights[0] + 64) / settings().zoom - (sidebar?.hidden ? 0 : sidebar?.size?.px ?? 0))
      : SPACE.sm;
    const panel = find(root, "panel"), body = find(root, "panel-body");
    const enabled = shared("workspace.panels") ?? ["files", "changes"];
    this.syncPanel(space, panel, body, enabled);
    const panelButton = (id, label, path) => {
      const on = Boolean(panel && !panel.hidden && body?.active === id);
      return button(`panel-${id}`, label, { kind: "text", size: "sm", icon: path, selected: on, onClick: () => {
        if (on) run("layout.hide", { id: "panel" });
        else { run("layout.select", { stack: "panel-body", child: id }); run("layout.show", { id: "panel" }); }
      } }).when(!on, el => el.text_color(r.onSurfaceVariant));
    };
    const windows = w?.platform === "windows";
    return h_flex().size_full().min_w(0).pr(SPACE.sm).pl(lightsPadding).gap(SPACE.xs).items_center().bg(r.surface)
      .on_mouse_up("left", () => { this.pressed = null; })
      .on_scroll_wheel(e => { if (Math.abs(e.delta.y) >= 1) run(e.delta.y > 0 ? "tab.prev" : "tab.next"); })
      .child(h_flex().id("tab-scroll").flex_1().min_w(0).h_full().items_center().gap(SPACE.xs).overflow_x_scrollbar().children(shown.map(item)))
      .child(iconButton("tab-new", icon("add"), { size: "sm", tip: "New tab", onClick: () => openOverlay(newMenuSpec()) }))
      .when(enabled.length > 0, el => el.child(div().w(SPACE.sm).flex_none()))
      .when(enabled.includes("files"), el => el.child(panelButton("files", "Files", "mods/shapr-files/draft.svg")))
      .when(enabled.includes("changes"), el => el.child(panelButton("changes", "Changes", "mods/shapr-changes/difference.svg")))
      .when(w?.buttons, el => el
        .child(iconButton("minimize", windows ? "mods/shapr-tabs/win-min.svg" : icon("remove"), { size: "sm", tip: "Minimize", onClick: () => run("window.minimize") }))
        .child(iconButton("maximize", windows ? `mods/shapr-tabs/${w.maximized ? "win-restore" : "win-max"}.svg` : chromeIcon("crop_square"), { size: "sm", tip: w.maximized ? "Restore" : "Maximize", onClick: () => run("window.maximize") }))
        .child(iconButton("close-window", windows ? "mods/shapr-tabs/win-close.svg" : icon("close"), { size: "sm", tip: "Close", onClick: () => run("window.close") })));
  }
}

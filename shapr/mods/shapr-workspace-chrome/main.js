// style: md3
import { View, div, image } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, props, window, shared, setShared, updates, layout } from "herdr";
import { prefs, SPACE, SHAPE, type, roles, icon, iconButton, navItem, badge, divider } from "./kit/index.js";
import { keepThemes } from "./theme/writer.js";

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

const glyph = (name) => `mods/shapr-workspace-chrome/${name}.svg`;

export default class WorkspaceChrome extends View {
  // The sidebar footer: Settings (with a dot when an update is ready) and Add machine, as
  // navigation drawer items; on the rail, icon buttons with their names as tooltips.
  footer(collapsed) {
    const r = roles();
    const ready = Boolean(updates().app.ready);
    const dot = () => badge({ role: "primary" });
    const settings = () => run("app.settings");
    const machine = () => run("mod.open", { name: "shapr-machine-add" });
    const rows = collapsed
      ? v_flex().flex_1().min_h(0).gap(SPACE.xs).items_center().justify_center()
        .child(div().relative().flex_none()
          .child(iconButton("settings", glyph("settings"), { size: "sm", tip: "Settings", onClick: settings }))
          .when(ready, el => el.child(div().absolute().top(SPACE.xs).right(SPACE.xs).child(dot()))))
        .child(iconButton("machine", glyph("plus"), { size: "sm", tip: "Add machine", onClick: machine }))
      : v_flex().flex_1().min_h(0).px(SPACE.md).justify_center()
        .child(navItem("settings", "Settings", { icon: glyph("settings"), badge: ready ? dot() : null, onClick: settings }))
        .child(navItem("machine", "Add machine", { icon: glyph("plus"), onClick: machine }));
    return v_flex().size_full().bg(r.surfaceContainer).child(divider()).child(rows);
  }

  // The brand bar: the Herdr mark and name (after the macOS traffic lights), search and the
  // sidebar toggle as standard icon buttons. On the rail only the toggle stays, centred; on the
  // macOS rail the traffic lights fill the row and the agents list's » unfolds it.
  brand(collapsed) {
    const r = roles();
    const w = window();
    const mac = w?.platform === "macos";
    const toggle = iconButton("sidebar-toggle", glyph("sidebar"), { size: "sm", tip: collapsed ? "Show sidebar" : "Hide sidebar", onClick: toggleSidebar });
    if (collapsed) {
      return h_flex().size_full().bg(r.surfaceContainer).items_center().justify_center()
        .when(!mac, el => el.child(toggle));
    }
    const name = type(div(), "titleMedium", true).flex_1().min_w(0).truncate().text_color(r.onSurface).child("Herdr");
    return h_flex().size_full().min_w(0).bg(r.surfaceContainer).pl(mac && !w?.fullscreen ? 76 : SPACE.lg).pr(SPACE.sm).gap(SPACE.xs).items_center()
      .child(h_flex().flex_1().min_w(0).gap(SPACE.md).items_center()
        .child(image("frame/welcome/herdr.png").size(24).flex_none().rounded(SHAPE.sm))
        .child(name))
      .child(iconButton("search", icon("search"), { size: "sm", tip: "Search", onClick: () => run("mod.open", { name: "shapr-picker" }) }))
      .child(toggle);
  }

  render(cx) {
    // The brand bar is always in the layout: it keeps shapr's themes in step with the settings.
    keepThemes(cx, prefs());
    const collapsed = narrow();
    return props()?.footer ? this.footer(collapsed) : this.brand(collapsed);
  }
}

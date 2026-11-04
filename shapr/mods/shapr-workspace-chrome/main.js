// style: md3
import { View, div, image } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, props, window, shared, setShared, updates, layout, openOverlay, nextCommand, spaces, focused, machines, agents } from "herdr";
import { prefs, SETTINGS, DEFAULTS, SPACE, SHAPE, H, ROW, type, roles, icon, iconButton, navItem, badge, settingsSpec, newMenuSpec, tabMenuSpec, spaceMenuSpec, terminalMenuSpec, renameSpec } from "./kit/index.js";
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

// The layout's fixed blocks hold one row of kit controls, so their heights follow the person's
// density: the brand and tab bars a control (H.sm) with 8 above and below, the footer its three
// rows with 8 above and below (space, not a line, sets it off).
export function blockHeights() {
  return { brand: H.sm + 16, tabs: H.sm + 16, "sidebar-footer": 16 + 3 * ROW.one };
}
function keepHeights() {
  for (const [id, px] of Object.entries(blockHeights()))
    if (find(layout(), id)?.size?.px !== undefined && find(layout(), id).size.px !== px) run("layout.resize", { id, px });
}

// Panes are cards rounded like the kit's large shapes (SHAPE.lg), so their frame follows the
// person's corner setting. Herdr has no command for one frame field: the layout is set whole.
function keepCorners() {
  const pane = find(layout(), "main")?.content?.pane;
  if (!pane || pane.radius === SHAPE.lg) return;
  const next = structuredClone(layout());
  find(next, "main").content.pane.radius = SHAPE.lg;
  run("layout.set", { layout: next });
}

// Commands for keys.json (`shapr-workspace-chrome.<name>`): shapr's overlays for the shown space
// and tab, opened as their own buttons open them.
const COMMANDS = {
  "new-menu": () => openOverlay(newMenuSpec()),
  "tab-menu": (s) => s && openOverlay(tabMenuSpec(s.tabs.find((t) => t.active)?.id, s.id)),
  "space-menu": (s) => s && openOverlay(spaceMenuSpec(s.id, undefined)),
  "terminal-menu": () => { const f = focused(); if (f?.pane) openOverlay(terminalMenuSpec(f.pane, f.terminal)); },
  "rename-tab": (s) => s && openOverlay(renameSpec("tab", s.tabs.find((t) => t.active)?.id)),
  "rename-space": (s) => s && openOverlay(renameSpec("space", s.id)),
  theme: () => openOverlay(settingsSpec()),
};

// Theme settings by key (keys.json): set-density-compact, set-corners-round, set-motion-reduced,
// set-contrast-high, seed-006a6a, reset-theme. The same values the settings window stores.
const PREF_VALUES = { density: ["compact", "standard", "comfortable"], corners: ["standard", "round"], motion: ["expressive", "calm", "reduced"], contrast: ["standard", "medium", "high"] };
function setPref(c) {
  const cur = shared(SETTINGS) ?? {};
  if (c === "reset-theme") return setShared(SETTINGS, { ...DEFAULTS });
  const seed = /^seed-([0-9a-fA-F]{6})$/.exec(c);
  if (seed) return setShared(SETTINGS, { ...cur, seed: `#${seed[1].toUpperCase()}` });
  const m = /^set-(density|corners|motion|contrast)-([a-z]+)$/.exec(c);
  if (m && PREF_VALUES[m[1]].includes(m[2])) setShared(SETTINGS, { ...cur, [m[1]]: m[2] });
}

export default class WorkspaceChrome extends View {
  init(_props, cx) {
    if (props()?.footer) return;
    cx.spawn(async () => {
      for (;;) {
        const c = await nextCommand();
        if (COMMANDS[c]) COMMANDS[c](spaces().find((s) => s.active));
        else setPref(c);
      }
    });
  }

  // Where agents run: this computer, or how many machines (this computer among them), and the
  // agents on all of them.
  machines() {
    const n = machines().length, count = agents().length;
    return `${n > 1 ? `${n} machines` : "This computer"} · ${count} agents`;
  }

  // The sidebar footer: Theme (shapr's settings), Settings (Herdr's, with a dot when an update is
  // ready) and Add machine, as
  // navigation drawer items; on the rail, icon buttons with their names as tooltips.
  footer(collapsed) {
    const r = roles();
    const ready = Boolean(updates().app.ready);
    const dot = () => badge({ role: "primary" });
    const settings = () => run("app.settings");
    const theme = () => openOverlay(settingsSpec());
    const machine = () => run("mod.open", { name: "shapr-machine-add" });
    const rows = collapsed
      ? v_flex().flex_1().min_h(0).gap(SPACE.xs).items_center().justify_center()
        .child(iconButton("theme", glyph("palette"), { size: "sm", tip: "Theme", onClick: theme }))
        .child(div().relative().flex_none()
          .child(iconButton("settings", glyph("settings"), { size: "sm", tip: "Settings", onClick: settings }))
          .when(ready, el => el.child(div().absolute().top(SPACE.xs).right(SPACE.xs).child(dot()))))
        .child(iconButton("machine", icon("add"), { size: "sm", tip: "Add machine", onClick: machine }))
      : v_flex().flex_1().min_h(0).px(SPACE.md).justify_center()
        .child(navItem("theme", "Theme", { icon: glyph("palette"), onClick: theme }))
        .child(navItem("settings", "Settings", { icon: glyph("settings"), badge: ready ? dot() : null, onClick: settings }))
        .child(navItem("machine", this.machines(), { icon: glyph("computer"), onClick: machine }));
    return v_flex().size_full().bg(r.surface).child(rows);
  }

  // The brand bar: the Herdr mark and name (after the macOS traffic lights), search and the
  // sidebar toggle as standard icon buttons. On the rail only the toggle stays, centred; on the
  // macOS rail the traffic lights fill the row and the agents list's » unfolds it.
  brand(collapsed) {
    const r = roles();
    const w = window();
    const mac = w?.platform === "macos";
    const toggle = iconButton("sidebar-toggle", glyph("dock_to_left"), { size: "sm", tip: collapsed ? "Show sidebar" : "Hide sidebar", onClick: toggleSidebar });
    if (collapsed) {
      return h_flex().size_full().bg(r.surface).items_center().justify_center()
        .when(!mac, el => el.child(toggle));
    }
    const name = type(div(), "titleMedium", true).flex_1().min_w(0).truncate().text_color(r.onSurface).child("Herdr");
    return h_flex().size_full().min_w(0).bg(r.surface).pl(mac && !w?.fullscreen ? 76 : SPACE.lg).pr(SPACE.sm).gap(SPACE.xs).items_center()
      .child(h_flex().flex_1().min_w(0).gap(SPACE.md).items_center()
        .child(image("frame/welcome/herdr.png").size(24).flex_none().rounded(SHAPE.sm))
        .child(name))
      .child(iconButton("search", icon("search"), { size: "sm", tip: "Search", onClick: () => run("mod.open", { name: "shapr-picker" }) }))
      .child(toggle);
  }

  render(cx) {
    // The brand bar is always in the layout: it keeps shapr's themes in step with the settings.
    keepThemes(cx, prefs());
    if (!props()?.footer) { keepHeights(); keepCorners(); }
    const collapsed = narrow();
    return props()?.footer ? this.footer(collapsed) : this.brand(collapsed);
  }
}

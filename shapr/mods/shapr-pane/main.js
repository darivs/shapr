// style: md3
// A pane's header, for layouts that frame their panes:
//   { "tab": "active", "pane": { "header": { "content": { "mod": "shapr-pane" } } } }
// Shows the program's icon (the app's program table), the agent's name or
// the terminal's title, the folder, and the agent's status; buttons split, zoom and close
// this pane. Props from the app: { pane, terminal }. Click: focus the pane.
// MD3: the header sits on the pane's card with no fill or line of its own; only status speaks in color.

import { View, div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { panes, props, run, home } from "herdr";
import { iconButton, statusMark, label, roles, icon, SPACE } from "./kit/index.js";

// An icon shapr-workspace-chrome holds for the chrome's mods.
const chrome = (name) => `mods/shapr-workspace-chrome/${name}.svg`;

function programIcon(p, size, color) {
  if (!p?.icon) return null;
  return p.tint ? svg(p.icon).size(size).flex_none().text_color(color) : image(p.icon).w(size).h(size).flex_none();
}

function folder(cwd) {
  if (!cwd) return "";
  const h = home();
  return cwd === h ? "~" : cwd.startsWith(h + "/") ? "~" + cwd.slice(h.length) : cwd;
}

export default class Pane extends View {
  init() { this.hovered = false; }

  me() {
    return panes().find((p) => p.pane === props()?.pane);
  }

  button(id, path, tip, command, args) {
    return iconButton(id, path, { size: "xs", tip, onClick: (_e, cx) => { cx?.stop_propagation?.(); run(command, args); } });
  }

  render() {
    const r = roles();
    const p = this.me();
    if (!p) return div();
    const name = ((p.program?.agent || p.program?.shell) && p.program.name) || p.title || p.program?.name || "shell";
    const pic = programIcon(p.program, 14, r.onSurfaceVariant);
    const st = p.status;
    const pane = p.pane;
    return h_flex()
      .id(`pane-head-${pane}`)
      .size_full()
      .px(SPACE.md)
      .gap(SPACE.sm)
      .items_center()
      .overflow_hidden()
      .on_hover((hovered, cx) => { this.hovered = hovered; cx.notify(); })
      .on_click(() => run("pane.focus", { pane }))
      .when(Boolean(pic), (el) => el.child(pic))
      .child(label(name, { style: "labelLarge", truncate: true }).flex_shrink(1).max_w(260))
      .child(label(folder(p.cwd), { style: "bodySmall", role: "onSurfaceVariant", truncate: true, grow: true }))
      .when(st === "blocked", (el) => el.child(label("Needs you", { style: "labelMedium", role: "blocked" }).flex_none()))
      .when(["working", "blocked", "done"].includes(st), (el) => el.child(statusMark(st)))
      .when(this.hovered, (el) => el
        .child(this.button(`ph-r-${pane}`, chrome("vertical_split"), "Split right", "pane.split", { direction: "right", pane }))
        .child(this.button(`ph-d-${pane}`, chrome("horizontal_split"), "Split down", "pane.split", { direction: "down", pane }))
        .child(this.button(`ph-z-${pane}`, chrome(p.zoomed ? "close_fullscreen" : "open_in_full"), p.zoomed ? "Unzoom" : "Zoom", "pane.zoom", { pane }))
        .child(this.button(`ph-x-${pane}`, icon("close"), "Close pane", "pane.close", { pane })));
  }
}

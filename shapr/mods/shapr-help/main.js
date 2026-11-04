// style: md3
// The keybind list (Herdr's prefix+?), grouped, filterable by typing, as an MD3 dialog.
// Reads keys.json through keys(); edit keys.json to change any of them.
// Open it with frame: "none", width 560, height 0.8 (mod.json's overlay); the list scrolls.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { keys, props, closeOverlay } from "herdr";
import { dialogSurface, dialogHeadline, fieldBox, heading, iconButton, label, roles, icon, type, ROW, RADIUS, SHAPE } from "./kit/index.js";

const GROUPS = [
  ["Spaces", /^space\./],
  ["Tabs", /^tab\./],
  ["Panes", /^pane\./],
  ["Agents", /^agent\./],
  ["Terminal", /^terminal\.|^send:/],
  ["Window", /./],
];

function describe(action) {
  if (action.startsWith("send:")) return "type " + JSON.stringify(action.slice(5));
  const [name, arg] = action.split(":");
  const words = name.replace(/[._]/g, " ");
  return arg ? `${words} ${arg}` : words;
}

// One key stroke as a keycap: label medium on surface-container-highest, rounded sm.
const keycap = (text) => type(div(), "labelMedium").h(24).px(8).flex_none().flex().items_center().rounded(SHAPE.sm)
  .bg(roles().surfaceHighest).text_color(roles().onSurface).child(text);

export default class Help extends View {
  init(_props, cx) {
    this.filter = "";
    this.input = InputState.new({ placeholder: "Type to filter…" });
    this.input.on("change", (_e, cx) => { this.filter = this.input.value(); cx.notify(); });
    this.input.focus();
    cx.timer.after(600, () => this.input.focus());
    this.handle = cx.focus_handle();
  }

  render() {
    const r = roles();
    const f = this.filter.toLowerCase();
    const all = keys().filter((k) => !f || k.keys.includes(f) || describe(k.action).includes(f));
    const seen = new Set();
    const groups = GROUPS.map(([name, re]) => {
      const rows = all.filter((k) => !seen.has(k) && re.test(k.action) && (seen.add(k) || true));
      return [name, rows];
    }).filter(([, rows]) => rows.length > 0);
    const row = (k, i) => h_flex().id(`help-${i}`).h(ROW.one).flex_none().px(16).gap(12).items_center().rounded(RADIUS.row)
      .child(label(describe(k.action), { style: "bodyMedium", truncate: true, grow: true }))
      .when(k.section !== "global", (el) => el.child(label(k.section, { style: "labelSmall", role: "onSurfaceVariant" }).flex_none()))
      .child(h_flex().flex_none().gap(4).children(k.keys.trim().split(/\s+/).map(keycap)));
    let n = 0;
    return dialogSurface()
      .id("help")
      .track_focus(this.handle)
      .on_key_down((e) => {
        if (e.key === "escape") return closeOverlay(props().overlay);
      })
      .child(h_flex().w_full().gap(12).items_center()
        .child(dialogHeadline("Keybinds").flex_1().min_w(0).truncate())
        .child(iconButton("help-close", icon("x"), { size: "md", tip: "Close", onClick: () => closeOverlay(props().overlay) })))
      .child(fieldBox(h_flex().w_full().flex_none().gap(12), { focused: true })
        .child(svg(icon("search")).size(20).flex_none().text_color(r.onSurfaceVariant))
        .child(Input.new(this.input).flex_1().min_w(0).text_color(r.onSurface)))
      .child(
        v_flex()
          .id("help-list")
          .flex_1()
          .min_h(0)
          .mx(-8)
          .overflow_y_scrollbar()
          .children(groups.map(([name, rows]) => v_flex().flex_none().child(heading(name)).children(rows.map((k) => row(k, n++)))))
          .when(groups.length === 0, (el) => el.child(label("No keybind matches.", { role: "onSurfaceVariant" }).px(16).py(10))),
      );
  }
}

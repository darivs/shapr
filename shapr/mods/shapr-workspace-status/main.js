// style: md3
import { View, div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { spaces, agents, run, window, keys } from "herdr";
import { roles, type, label, badge, statusMark, button, SPACE } from "./kit/index.js";

// An icon shapr-workspace-chrome holds for the chrome's mods.
const chrome = (name) => `mods/shapr-workspace-chrome/${name}.svg`;

export default class WorkspaceStatus extends View {
  // The palette key as actually bound, not a hardcoded one; without a
  // binding the hint stays useful ("commands") instead of lying.
  hint() {
    const mac = window()?.platform === "macos";
    const mod = { cmd: mac ? "⌘" : "Ctrl+", ctrl: mac ? "⌃" : "Ctrl+", shift: mac ? "⇧" : "Shift+", alt: mac ? "⌥" : "Alt+", option: mac ? "⌥" : "Alt+" };
    const b = keys().find((k) => k.section === "global" && k.action === "app.palette");
    const parts = b && b.keys.endsWith("--") ? [...b.keys.slice(0, -2).split("-"), "-"] : b?.keys.split("-");
    const key = parts && parts.map((p) => mod[p.toLowerCase()] ?? p.toUpperCase()).join("");
    return key ? `${key}  commands` : "commands";
  }

  // A bottom bar on surface-container: where the space runs, its branch and the agent count in
  // body small, on-surface-variant; blocked agents in their own color with the pulsing mark;
  // the palette hint a text button at the end. Long names shrink, the hint never does.
  render() {
    const r = roles();
    const space = spaces().find(s => s.active);
    const list = agents();
    const needs = list.filter(a => a.status === "blocked").length;
    const fact = (path, text) => h_flex().min_w(0).gap(SPACE.sm).items_center()
      .child(svg(path).size(14).flex_none())
      .child(label(text, { style: "bodySmall", role: "onSurfaceVariant", truncate: true }));
    const count = h_flex().flex_none().gap(SPACE.sm).items_center()
      .child(badge({ role: "outline" }))
      .child(label(`${list.length} agents`, { style: "bodySmall", role: "onSurfaceVariant" }))
      .when(needs > 0, el => el.child(h_flex().gap(SPACE.xs).items_center()
        .child(statusMark("blocked"))
        .child(type(div(), "labelMedium", true).text_color(r.blocked).child(`${needs} needs you`))));
    const palette = button("palette", this.hint(), { kind: "text", size: "xs", onClick: () => run("app.palette") })
      .text_color(r.onSurfaceVariant);
    return h_flex().size_full().min_w(0).pl(SPACE.lg).pr(SPACE.sm).gap(SPACE.lg).items_center().bg(r.surface).text_color(r.onSurfaceVariant)
      .child(h_flex().flex_1().min_w(0).gap(SPACE.lg).items_center()
        .child(fact(chrome(space?.machine ? "dns" : "monitor"), space?.machine ?? "This computer"))
        .when(Boolean(space?.branch), el => el.child(fact(chrome("call_split"), space.branch)))
        .child(count))
      .child(palette);
  }
}

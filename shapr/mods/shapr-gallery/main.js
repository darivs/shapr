// style: md3
// Every kit component in each of its states (rest, hover by pointing, selected, disabled, error),
// for the screenshot loop: mod.open {name: "shapr-gallery"}, or a tab: tab.new {mod: "shapr-gallery"}.
import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { props, closeOverlay } from "herdr";
import * as K from "./kit/index.js";

const noop = () => {};

export default class Gallery extends View {
  init() {
    this.on = { sw: true, cb: true, radio: "a", seg: "day", chip: true, nav: "spaces" };
  }

  section(title, ...rows) {
    const r = K.roles();
    return v_flex().w_full().flex_none().gap(12).p(16).rounded(K.RADIUS.card).bg(r.surfaceLow)
      .child(K.label(title, { style: "titleMedium" }))
      .children(rows.map(([name, items]) => h_flex().w_full().flex_wrap().gap(12).items_center()
        .child(div().w(96).flex_none().child(K.label(name, { style: "labelMedium", role: "onSurfaceVariant" })))
        .children(items)));
  }

  render() {
    const r = K.roles();
    const s = this.on;
    const set = (k, v) => () => { s[k] = v; };
    const toggle = (k) => () => { s[k] = !s[k]; };
    const kinds = ["filled", "tonal", "outlined", "elevated", "text"];
    const overlay = props()?.overlay;
    const body = v_flex().w_full().gap(16).p(24)
      .child(h_flex().w_full().items_center().gap(12)
        .child(K.label("shapr components", { style: "headlineSmall", grow: true }))
        .when(Boolean(overlay), (el) => el.child(K.iconButton("close", K.icon("x"), { tip: "Close", onClick: () => closeOverlay(overlay) }))))
      .child(this.section("Buttons",
        ...kinds.map((k) => [k, [K.button(`b-${k}`, "Label", { kind: k, onClick: noop }), K.button(`bi-${k}`, "Add", { kind: k, icon: K.icon("plus"), onClick: noop }),
          K.button(`bq-${k}`, "Square", { kind: k, shape: "square", onClick: noop }), K.button(`bd-${k}`, "Disabled", { kind: k, disabled: true }), K.button(`be-${k}`, "Delete", { kind: k, danger: true, onClick: noop })]]),
        ["toggle", [K.button("bt-on", "Selected", { kind: "outlined", selected: true, onClick: noop }), K.button("bt-off", "Not selected", { kind: "outlined", selected: false, onClick: noop })]],
        ["sizes", ["xs", "sm", "md", "lg", "xl"].map((z) => K.button(`bz-${z}`, z.toUpperCase(), { size: z, onClick: noop }))]))
      .child(this.section("Icon buttons",
        ...["standard", "filled", "tonal", "outlined"].map((k) => [k, [K.iconButton(`i-${k}`, K.icon("plus"), { kind: k, onClick: noop, tip: "Add" }),
          K.iconButton(`ion-${k}`, K.icon("check"), { kind: k, selected: true, onClick: noop }), K.iconButton(`ioff-${k}`, K.icon("check"), { kind: k, selected: false, onClick: noop }),
          K.iconButton(`id-${k}`, K.icon("x"), { kind: k, disabled: true }), K.iconButton(`iw-${k}`, K.icon("search"), { kind: k, width: "wide", onClick: noop })]]),
        ["sizes", ["xs", "sm", "md", "lg", "xl"].map((z) => K.iconButton(`iz-${z}`, K.icon("plus"), { kind: "tonal", size: z, onClick: noop }))]))
      .child(this.section("Labels",
        ["type", ["displaySmall", "headlineSmall", "titleLarge", "titleMedium", "bodyLarge", "bodyMedium", "labelLarge", "labelSmall"].map((st) => K.label(st, { style: st }))],
        ["emphasized", ["titleMedium", "bodyMedium", "labelLarge"].map((st) => K.label(st, { style: st, emphasized: true }))],
        ["roles", ["onSurface", "onSurfaceVariant", "disabled", "primary", "error"].map((role) => K.label(role, { role }))],
        ["heading", [div().w(280).child(K.heading("Section heading", { trailing: K.badge({ count: 4 }) }))]]))
      .child(this.section("Chips",
        ...["assist", "filter", "input", "suggestion"].map((k) => [k, [K.chip(`c-${k}`, "Chip", { kind: k, icon: k === "assist" ? K.icon("plus") : null, onClick: noop }),
          K.chip(`cs-${k}`, "Selected", { kind: k, selected: s.chip, onClick: toggle("chip") }), K.chip(`ce-${k}`, "Elevated", { kind: k, elevated: true, onClick: noop }),
          K.chip(`cr-${k}`, "Removable", { kind: k, onRemove: noop }), K.chip(`cd-${k}`, "Disabled", { kind: k, disabled: true }), K.chip(`cx-${k}`, "Dense", { kind: k, size: "xs", count: 3, onClick: noop })]]),
        ["status", ["working", "blocked", "done", "idle"].map((st) => K.chip(`cst-${st}`, st, { icon: K.icon("search"), iconColor: st, onClick: noop }))]))
      .child(this.section("Selection",
        ["switch", [K.toggleSwitch("sw", s.sw, (v) => { s.sw = v; }), K.toggleSwitch("sw-c", !s.sw, (v) => { s.sw = !v; }, { checkIcon: true }), K.toggleSwitch("sw-d1", true, noop, { disabled: true }), K.toggleSwitch("sw-d0", false, noop, { disabled: true })]],
        ["checkbox", [K.checkbox("cb", s.cb, (v) => { s.cb = v; }), K.checkbox("cb-0", false, noop), K.checkbox("cb-m", "mixed", noop), K.checkbox("cb-e", true, noop, { error: true }), K.checkbox("cb-e0", false, noop, { error: true }), K.checkbox("cb-d", true, noop, { disabled: true })]],
        ["radio", [K.radio("ra", s.radio === "a", set("radio", "a")), K.radio("rb", s.radio === "b", set("radio", "b")), K.radio("re", true, noop, { error: true }), K.radio("rd", true, noop, { disabled: true }), K.radio("rd0", false, noop, { disabled: true })]],
        ["segmented", [K.segmented("seg", [["day", "Day"], ["week", "Week"], ["month", "Month"], ["year", "Year", { disabled: true }]], s.seg, (v) => { s.seg = v; }),
          K.segmented("seg-lg", [["a", "Large"], ["b", "Segments"]], "a", noop, { size: "lg" }), K.segmented("seg-d", [["a", "Disabled"], ["b", "Group"]], "a", noop, { disabled: true })]]))
      .child(this.section("Text fields",
        ...["outlined", "filled"].map((k) => [k, [
          div().w(220).child(K.textField(K.label("Value"), { kind: k, label: "Label", supporting: "Supporting text" })),
          div().w(220).child(K.textField(K.label("Focused"), { kind: k, label: "Label", focused: true, trailing: K.label("⌘K", { style: "labelMedium", role: "onSurfaceVariant" }) })),
          div().w(220).child(K.textField(K.label("Wrong"), { kind: k, label: "Label", error: true, supporting: "Error text" })),
          div().w(220).child(K.textField(K.label("Disabled"), { kind: k, label: "Label", disabled: true }))]])))
      .child(this.section("Menu, list, navigation",
        ["menu", [K.menuSurface(v_flex().w(240)).child(K.menuHeader("Group")).child(K.menuItem("m1", "New tab", { icon: K.icon("plus"), hint: "⌘T", onClick: noop, selected: false }))
          .child(K.menuItem("m2", "Chosen item", { icon: K.icon("search"), selected: true, onClick: noop })).child(K.menuItem("m3", "Disabled", { disabled: true, onClick: noop, selected: false }))
          .child(K.menuDivider()).child(K.menuItem("m4", "Close space", { icon: K.icon("x"), danger: true, onClick: noop }))]],
        ["list", [v_flex().w(300).gap(2)
          .child(K.listItem("l1", "One line", { leading: K.statusMark("working"), onClick: noop, trailingText: "2m" }))
          .child(K.listItem("l2", "Selected", { leading: K.statusMark("blocked"), selected: true, onClick: noop, trailing: K.statusBadge("blocked", 2) }))
          .child(K.listItem("l3", "Two lines", { supporting: "Supporting text that runs long and is cut", leading: K.statusMark("done"), onClick: noop }))
          .child(K.listItem("l4", "Three lines", { overline: "Overline", supporting: "Supporting", lines: 3, leading: K.statusMark("idle"), onClick: noop }))
          .child(K.listItem("l5", "Disabled", { disabled: true, onClick: noop }))]],
        ["navigation", [v_flex().w(240).gap(2).children(["spaces", "agents", "files"].map((n) => K.navItem(`n-${n}`, n[0].toUpperCase() + n.slice(1), { icon: K.icon("search"), active: s.nav === n, badge: n === "agents" ? K.badge({ count: 12 }) : null, onClick: set("nav", n) }))),
          h_flex().gap(0).children(["spaces", "agents", "files"].map((n) => K.navItem(`nr-${n}`, n, { icon: K.icon("search"), rail: true, active: s.nav === n, badge: n === "agents" ? K.badge() : null, onClick: set("nav", n) })))]]))
      .child(this.section("Cards, dialog",
        ["cards", ["elevated", "filled", "outlined"].map((k) => K.card(v_flex().w(180).gap(4), { kind: k, id: `card-${k}`, onClick: noop }).child(K.label(k, { style: "titleMedium" })).child(K.label("Supporting text", { role: "onSurfaceVariant" })))
          .concat([K.card(v_flex().w(180), { kind: "outlined", disabled: true }).child(K.label("Disabled", { style: "titleMedium" }))])],
        ["dialog", [div().w(360).h(K.dialogHeight({ bodyLines: 2 })).child(K.dialogSurface().child(K.dialogHeadline("Close space?")).child(K.dialogBody("Its 3 tabs and their terminals end. Agents in them stop."))
          .child(K.dialogActions({ onCancel: noop, primary: { label: "Close space", danger: true, onClick: noop } }))),
          div().w(320).h(K.dialogHeight({ icon: true, bodyLines: 1 })).child(K.dialogSurface().child(K.dialogHeadline("With an icon", { icon: K.icon("search") })).child(K.dialogBody("Centred under its icon."))
            .child(K.dialogActions({ onCancel: noop, primary: { label: "OK", onClick: noop }, note: "A note", error: true })))]]))
      .child(this.section("Badges, progress, divider, snackbar",
        ["badges", [K.badge(), K.badge({ count: 3 }), K.badge({ count: 42 }), K.badge({ count: 1500 }), ...["working", "blocked", "done", "idle"].map((st) => h_flex().gap(6).items_center().child(K.statusMark(st)).child(K.statusBadge(st, 2)).child(K.label(st, { style: "labelMedium" })))]],
        ["progress", [K.linearProgress(160, null), K.linearProgress(160, 0.35), K.linearProgress(160, 1), K.circularProgress(24)]],
        ["divider", [v_flex().w(200).gap(8).child(K.divider()).child(K.divider({ inset: 16 })), h_flex().h(32).child(K.divider({ vertical: true, space: 8 }))]],
        ["snackbar", [K.snackbar("sn1", { title: "Copied to the clipboard", onClose: noop }), K.snackbar("sn2", { title: "Agent needs you", body: "Waiting for a yes on the migration plan, with a long body that wraps over lines", tone: "blocked", action: { label: "Show", onClick: noop }, onClose: noop })]]));
    return v_flex().id("gallery").size_full().bg(r.surface).rounded(K.RADIUS.dialog).overflow_hidden().text_color(r.onSurface)
      .child(div().id("gallery-scroll").size_full().overflow_y_scrollbar().child(body));
  }
}

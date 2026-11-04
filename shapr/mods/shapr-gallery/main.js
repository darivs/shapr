// style: md3
// Every kit component with every option, in each of its states (rest, hover by pointing,
// selected, disabled, error), for the screenshot loop in light and dark (the app's theme):
// mod.open {name: "shapr-gallery"}, or a tab: tab.new {mod: "shapr-gallery"}.
// Rows wrap, so nothing clips in a narrow window or at zoom 1.5: no sample is wider than
// MAX_ITEM, and below WIDE the row names sit above their samples; below MIN_W it scrolls sideways.
import { View, div, svg } from "gpui-kit";
import { h_flex, v_flex, InputState, Input } from "gpui-base";
import { props, closeOverlay } from "herdr";
import * as K from "./kit/index.js";

const noop = () => {};
const PAD = K.SPACE.xl; // around the page
const CARD_PAD = K.SPACE.lg; // inside a section
const NAME_W = 96; // the row names' column
/** The widest sample the gallery draws (dialogs, snackbars). */
export const MAX_ITEM = 360;
/** Under this the page scrolls sideways instead of clipping a sample. */
export const MIN_W = MAX_ITEM + 2 * PAD + 2 * CARD_PAD;
/** From this width up a row's name sits beside its samples, which keep MAX_ITEM. */
export const WIDE = MIN_W + NAME_W + K.SPACE.md;

// "displayLarge" → "Display L": short enough that display large stays under MAX_ITEM.
const styleName = (st) => st[0].toUpperCase() + st.slice(1).replace(/(Large|Medium|Small)$/, (m) => ` ${m[0]}`);
const CODE = ["export function hello() {", "  return \"shapr\";", "}"];
// A kit icon at the two sizes shapr draws it, on-surface and on-surface-variant, over its name.
const iconSample = (path) => {
  const r = K.roles();
  return v_flex().w(120).items_center().gap(K.SPACE.xs)
    .child(h_flex().gap(K.SPACE.sm).items_center()
      .child(svg(path).size(24).flex_none().text_color(r.onSurface))
      .child(svg(path).size(20).flex_none().text_color(r.onSurfaceVariant)))
    .child(K.label(path.split("/").pop().slice(0, -4), { style: "labelSmall", role: "onSurfaceVariant", truncate: true }));
};

export default class Gallery extends View {
  init() {
    this.on = { sw: true, cb: true, radio: "a", seg: "day", chip: true, nav: "spaces", tree: "main" };
    this.width = null; // measured, px at zoom 1
    this.search = InputState.new({ placeholder: "Search spaces" });
    this.searchLg = InputState.new({ placeholder: "Search files" });
  }

  section(title, ...rows) {
    const r = K.roles();
    const wide = this.width === null || this.width >= WIDE;
    return v_flex().w_full().flex_none().gap(K.SPACE.md).p(CARD_PAD).rounded(K.RADIUS.card).bg(r.surfaceLow)
      .child(K.label(title, { style: "titleMedium" }))
      .children(rows.map(([name, items]) => {
        const samples = h_flex().flex_1().min_w(0).flex_wrap().gap(K.SPACE.md).items_center().children(items);
        const tag = K.label(name, { style: "labelMedium", role: "onSurfaceVariant" });
        return wide
          ? h_flex().w_full().gap(K.SPACE.md).items_start()
            .child(div().w(NAME_W).min_h(K.H.sm).flex_none().flex().items_center().child(tag)).child(samples)
          : v_flex().w_full().gap(K.SPACE.sm).child(tag).child(samples);
      }));
  }

  render() {
    const r = K.roles();
    const s = this.on;
    const set = (k, v) => () => { s[k] = v; };
    const toggle = (k) => () => { s[k] = !s[k]; };
    const kinds = ["filled", "tonal", "outlined", "elevated", "text"];
    const overlay = props()?.overlay;
    const field = (supporting) => (el) => div().w(220).h(K.fieldHeight({ supporting })).child(el);
    const menuItems = 4, menuDividers = 1, menuHeaders = 1;
    const body = v_flex().w_full().min_w(MIN_W).gap(K.SPACE.lg).p(PAD)
      .child(h_flex().w_full().items_center().gap(K.SPACE.md)
        .child(K.label("shapr components", { style: "headlineSmall", truncate: true, grow: true }))
        .when(Boolean(overlay), (el) => el.child(K.iconButton("close", K.icon("close"), { tip: "Close", onClick: () => closeOverlay(overlay) }))))
      .child(this.section("Buttons",
        ...kinds.map((k) => [k, [K.button(`b-${k}`, "Label", { kind: k, onClick: noop }), K.button(`bi-${k}`, "Add", { kind: k, icon: K.icon("add"), onClick: noop }),
          K.button(`bq-${k}`, "Square", { kind: k, shape: "square", onClick: noop }), K.button(`bd-${k}`, "Disabled", { kind: k, disabled: true }), K.button(`be-${k}`, "Delete", { kind: k, danger: true, onClick: noop })]]),
        ["toggle", [K.button("bt-on", "Selected", { kind: "outlined", selected: true, onClick: noop }), K.button("bt-off", "Not selected", { kind: "outlined", selected: false, onClick: noop })]],
        ["sizes", ["xs", "sm", "md", "lg", "xl"].map((z) => K.button(`bz-${z}`, z.toUpperCase(), { size: z, onClick: noop }))],
        ["square sizes", ["xs", "sm", "md", "lg", "xl"].map((z) => K.button(`bqz-${z}`, z.toUpperCase(), { size: z, shape: "square", kind: "tonal", onClick: noop }))],
        ["parts", [K.button("bp-trail", "Open with", { kind: "outlined", trailing: K.icon("keyboard_arrow_down"), onClick: noop }),
          K.button("bp-lead", "Agent", { kind: "tonal", leading: K.statusMark("blocked"), onClick: noop }),
          K.button("bp-end", "Inbox", { kind: "text", end: K.badge({ count: 3 }), onClick: noop }),
          K.button("bp-max", "A label far too long for its button", { kind: "outlined", maxLabel: 120, tip: "A label far too long for its button", onClick: noop }),
          K.button("bp-int", "Hover only", { kind: "elevated", interactive: true })]]))
      .child(this.section("Icon buttons",
        ...["standard", "filled", "tonal", "outlined"].map((k) => [k, [K.iconButton(`i-${k}`, K.icon("add"), { kind: k, onClick: noop, tip: "Add" }),
          K.iconButton(`ion-${k}`, K.icon("check"), { kind: k, selected: true, onClick: noop }), K.iconButton(`ioff-${k}`, K.icon("check"), { kind: k, selected: false, onClick: noop }),
          K.iconButton(`id-${k}`, K.icon("close"), { kind: k, disabled: true }), K.iconButton(`ie-${k}`, K.icon("close"), { kind: k, danger: true, tip: "Close", onClick: noop }),
          K.iconButton(`in-${k}`, K.icon("chevron_left"), { kind: k, width: "narrow", onClick: noop }), K.iconButton(`iw-${k}`, K.icon("search"), { kind: k, width: "wide", onClick: noop })]]),
        ["sizes", ["xs", "sm", "md", "lg", "xl"].map((z) => K.iconButton(`iz-${z}`, K.icon("add"), { kind: "tonal", size: z, onClick: noop }))],
        ["toggle sizes", ["xs", "sm", "md", "lg", "xl"].map((z) => K.iconButton(`izs-${z}`, K.icon("check"), { kind: "filled", size: z, selected: true, onClick: noop }))]))
      .child(this.section("Icons",
        ["24 · 20", [K.icon("add"), K.icon("arrow_back"), K.icon("check"), K.icon("chevron_left"), K.icon("chevron_right"), K.icon("close"),
          K.icon("keyboard_arrow_down"), K.icon("progress_activity"), K.icon("remove"), K.icon("search")].map(iconSample)]))
      .child(this.section("Labels",
        ["type", Object.keys(K.TYPE).map((st) => K.label(styleName(st), { style: st }))],
        ["emphasized", ["headlineSmall", "bodyMedium", "labelLarge"].map((st) => K.label(st, { style: st, emphasized: true }))],
        ["roles", ["onSurface", "onSurfaceVariant", "disabled", "primary", "secondary", "tertiary", "error"].map((role) => K.label(role, { role }))],
        ["truncate, grow", [h_flex().w(240).gap(K.SPACE.sm).items_center()
          .child(K.label("A long name that is cut at the end", { truncate: true, grow: true })).child(K.label("2m", { style: "labelSmall", role: "onSurfaceVariant" }))]],
        ["heading", [div().w(280).child(K.heading("Section heading", { trailing: K.badge({ count: 4 }) })), div().w(200).child(K.heading("A heading too long for its column"))]]))
      .child(this.section("Keys, search",
        ["keycap", [K.keycap("Esc"), K.keycap("⌘"), K.keycap("Tab")]],
        ["shortcut", [K.shortcut(["⌘", "K"]), K.shortcut(["⌘", "⇧", "P"]), K.shortcut(["Ctrl", "Alt", "Del"]), K.label(K.keyLabel("cmd-shift-t"), { style: "labelMedium", role: "onSurfaceVariant" })]],
        ["search bar", [div().w(MAX_ITEM).child(K.searchBar(Input.new(this.search), { trailing: K.shortcut(["⌘", "K"]) })),
          div().w(280).child(K.searchBar(Input.new(this.searchLg), { size: "lg", trailing: K.iconButton("search-clear", K.icon("close"), { tip: "Clear", onClick: noop }) })),
          div().w(220).child(K.searchBar(K.label("No trailing", { role: "onSurfaceVariant", style: "bodyLarge" }), { size: "lg" }))]]))
      .child(this.section("Chips",
        ...["assist", "filter", "input", "suggestion"].map((k) => [k, [K.chip(`c-${k}`, "Chip", { kind: k, icon: k === "assist" ? K.icon("add") : null, onClick: noop }),
          K.chip(`cs-${k}`, "Selected", { kind: k, selected: s.chip, onClick: toggle("chip") }), K.chip(`ce-${k}`, "Elevated", { kind: k, elevated: true, onClick: noop }),
          K.chip(`cr-${k}`, "Removable", { kind: k, onRemove: noop }), K.chip(`cd-${k}`, "Disabled", { kind: k, disabled: true }), K.chip(`cx-${k}`, "Dense", { kind: k, size: "xs", count: 3, onClick: noop }),
          K.chip(`ct-${k}`, "Menu", { kind: k, trailing: svg(K.icon("keyboard_arrow_down")).size(18).flex_none(), onClick: noop })]]),
        ["status", ["working", "blocked", "done", "idle"].map((st) => K.chip(`cst-${st}`, st, { icon: K.icon("search"), iconColor: st, count: 2, onClick: noop }))],
        ["dense", ["working", "blocked"].map((st) => K.chip(`cxs-${st}`, st, { size: "xs", icon: K.icon("search"), iconColor: st, onRemove: noop }))]))
      .child(this.section("Selection",
        ["switch", [K.toggleSwitch("sw", s.sw, (v) => { s.sw = v; }), K.toggleSwitch("sw-c", !s.sw, (v) => { s.sw = !v; }, { checkIcon: true }), K.toggleSwitch("sw-d1", true, noop, { disabled: true }), K.toggleSwitch("sw-d0", false, noop, { disabled: true })]],
        ["checkbox", [K.checkbox("cb", s.cb, (v) => { s.cb = v; }), K.checkbox("cb-0", false, noop), K.checkbox("cb-m", "mixed", noop), K.checkbox("cb-e", true, noop, { error: true }), K.checkbox("cb-e0", false, noop, { error: true }), K.checkbox("cb-d", true, noop, { disabled: true }), K.checkbox("cb-d0", false, noop, { disabled: true })]],
        ["radio", [K.radio("ra", s.radio === "a", set("radio", "a")), K.radio("rb", s.radio === "b", set("radio", "b")), K.radio("re", true, noop, { error: true }), K.radio("re0", false, noop, { error: true }), K.radio("rd", true, noop, { disabled: true }), K.radio("rd0", false, noop, { disabled: true })]],
        ["segmented", [K.segmented("seg", [["day", "Day"], ["week", "Week", { tip: "Seven days" }], ["month", "Month"], ["year", "Year", { disabled: true }]], s.seg, (v) => { s.seg = v; }),
          K.segmented("seg-lg", [["a", "Large"], ["b", "Segments"]], "a", noop, { size: "lg" }), K.segmented("seg-i", [["a", "Grid"], ["b", "Add", { icon: K.icon("add") }]], "a", noop),
          K.segmented("seg-d", [["a", "Disabled"], ["b", "Group"]], "a", noop, { disabled: true })]],
        ["fill", [div().w(320).child(K.segmented("seg-f", [["a", "Compact"], ["b", "Standard"], ["c", "Comfortable"]], "b", noop, { fill: true }))]]))
      .child(this.section("Text fields",
        ...["outlined", "filled"].map((k) => [k, [
          field(true)(K.textField(K.label("Value"), { kind: k, label: "Label", supporting: "Supporting text" })),
          field(false)(K.textField(K.label("Focused"), { kind: k, label: "Label", focused: true, trailing: K.shortcut(["⌘", "K"]) })),
          field(true)(K.textField(K.label("Wrong"), { kind: k, label: "Label", error: true, supporting: "Error text" })),
          field(false)(K.textField(K.label("Disabled"), { kind: k, label: "Label", disabled: true })),
          field(false)(K.textField(K.label("Leading icon"), { kind: k, label: "Search", leading: svg(K.icon("search")).size(20) })),
          div().w(220).child(K.textField(K.label("Lines that wrap over three rows of a multiline field"), { kind: k, label: "Notes", multiline: true })),
          div().w(220).child(K.textField(K.label("No label"), { kind: k }))]]),
        ["box only", [K.fieldBox(div().w(160), {}).child(K.label("Outlined")), K.fieldBox(div().w(160), { kind: "filled", focused: true }).child(K.label("Filled")),
          K.fieldBox(div().w(160), { error: true, radius: K.SHAPE.lg }).child(K.label("Round, error")), K.fieldBox(div().w(160), { disabled: true }).child(K.label("Disabled"))]]))
      .child(this.section("Menu, list, navigation",
        ["menu", [K.menuSurface(v_flex().w(240).h(K.menuHeight({ items: menuItems, dividers: menuDividers, headers: menuHeaders }))).child(K.menuHeader("Group")).child(K.menuItem("m1", "New tab", { icon: K.icon("add"), hint: "⌘T", onClick: noop, selected: false }))
          .child(K.menuItem("m2", "Chosen item", { icon: K.icon("search"), selected: true, onClick: noop })).child(K.menuItem("m3", "Disabled", { disabled: true, onClick: noop, selected: false }))
          .child(K.menuDivider()).child(K.menuItem("m4", "Close space", { icon: K.icon("close"), danger: true, onClick: noop })),
          K.menuSurface(v_flex().w(240).h(K.menuHeight({ items: 3 }))).child(K.menuItem("m5", "Agent", { leading: K.statusMark("blocked"), trailing: svg(K.icon("chevron_right")).size(18), onClick: noop }))
            .child(K.menuItem("m6", "No check slot", { hint: "⌘N", onClick: noop })).child(K.menuItem("m7", "A label much too long for the menu", { trailing: K.shortcut(["⌘", "W"]), onClick: noop }))]],
        ["list", [v_flex().w(300).gap(2)
          .child(K.listItem("l1", "One line", { leading: K.statusMark("working"), onClick: noop, trailingText: "2m" }))
          .child(K.listItem("l2", "Selected", { leading: K.statusMark("blocked"), selected: true, onClick: noop, trailing: K.statusBadge("blocked", 2) }))
          .child(K.listItem("l3", "Two lines", { supporting: "Supporting text that runs long and is cut", leading: K.statusMark("done"), onClick: noop }))
          .child(K.listItem("l4", "Three lines", { overline: "Overline", supporting: "Supporting text over two lines when it runs long", lines: 3, leading: K.statusMark("idle"), onClick: noop }))
          .child(K.listItem("l5", "Hover only", { interactive: true, trailing: K.badge() }))
          .child(K.listItem("l6", "Disabled", { disabled: true, onClick: noop })),
          v_flex().w(260).gap(2).children([["main", "src", 0], ["kit", "kit", 16], ["tree", "list-item.js", 32], ["off", "Disabled", 32]].map(([k, name, indent]) =>
            K.listItem(`lt-${k}`, name, { dense: true, indent, leading: svg(K.icon(indent < 32 ? "keyboard_arrow_down" : "remove")).size(16), selected: s.tree === k, disabled: k === "off", trailingText: indent ? null : "3", onClick: set("tree", k) })))]],
        ["navigation", [v_flex().w(240).gap(2).children(["spaces", "agents", "files"].map((n) => K.navItem(`n-${n}`, n[0].toUpperCase() + n.slice(1), { icon: K.icon("search"), active: s.nav === n, badge: n === "agents" ? K.badge({ count: 12 }) : null, onClick: set("nav", n) })))
            .child(K.navItem("n-lead", "Leading", { leading: K.statusMark("blocked"), trailing: K.keycap("3"), onClick: noop })),
          h_flex().gap(0).children(["spaces", "agents", "files"].map((n) => K.navItem(`nr-${n}`, n, { icon: K.icon("search"), rail: true, active: s.nav === n, badge: n === "agents" ? K.badge() : null, onClick: set("nav", n) })))]]))
      .child(this.section("Panels",
        ["panel", [div().w(MAX_ITEM).h(220).child(K.panelCard()
          .child(K.panelHeader("Files", { leading: K.iconButton("panel-back", K.icon("arrow_back"), { tip: "Back", onClick: noop }), detail: "~/dev/shapr/shapr/mods/shapr-gallery",
            actions: [K.iconButton("panel-add", K.icon("add"), { tip: "New file", onClick: noop }), K.iconButton("panel-close", K.icon("close"), { tip: "Close", onClick: noop })] }))
          .child(K.panelWell(v_flex().px(K.SPACE.md)).children(CODE.map((line) => K.label(line, { style: "bodySmall", truncate: true }))))),
          div().w(220).h(160).child(K.panelCard().child(K.panelHeader("Changes")).child(K.panelWell()))]]))
      .child(this.section("Cards, dialog",
        ["cards", ["elevated", "filled", "outlined"].map((k) => K.card(v_flex().w(180).gap(4), { kind: k, id: `card-${k}`, onClick: noop }).child(K.label(k, { style: "titleMedium" })).child(K.label("Supporting text", { role: "onSurfaceVariant" })))
          .concat([K.card(v_flex().w(180), { kind: "outlined", disabled: true }).child(K.label("Disabled", { style: "titleMedium" })),
            K.card(v_flex().w(180), { kind: "filled", pad: K.SPACE.sm }).child(K.label("Pad 8, no click", { style: "titleSmall" }))])],
        ["dialog", [div().w(MAX_ITEM).h(K.dialogHeight({ bodyLines: 2 })).child(K.dialogSurface().child(K.dialogHeadline("Close space?")).child(K.dialogBody("Its 3 tabs and their terminals end. Agents in them stop."))
          .child(K.dialogActions({ onCancel: noop, primary: { label: "Close space", danger: true, onClick: noop } }))),
          div().w(320).h(K.dialogHeight({ icon: true, bodyLines: 1 })).child(K.dialogSurface().child(K.dialogHeadline("With an icon", { icon: K.icon("search") })).child(K.dialogBody("Centred under its icon."))
            .child(K.dialogActions({ onCancel: noop, primary: { label: "OK", onClick: noop }, note: "A note", error: true })))]],
        ["fit", [div().w(320).child(K.dialogSurface(v_flex(), { fit: true }).child(K.dialogHeadline("As tall as it is")).child(K.dialogBody("A fitting dialog: no height of its own."))
          .child(K.dialogActions({ onCancel: noop, cancelLabel: "Not now", primary: { label: "Save", disabled: true, onClick: noop }, note: "Nothing changed" })))]]))
      .child(this.section("Badges, progress, divider",
        ["badges", [K.badge(), K.badge({ count: 3 }), K.badge({ count: 42 }), K.badge({ count: 1500 }), K.badge({ count: 150, max: 99 }), K.badge({ count: 5, role: "primary", on: "onPrimary" }), K.badge({ role: "tertiary" })]],
        ["status", [...["working", "blocked", "done", "idle"].map((st) => h_flex().gap(6).items_center().child(K.statusMark(st)).child(K.statusBadge(st, 2)).child(K.label(st, { style: "labelMedium" }))),
          h_flex().gap(6).items_center().child(K.statusMark("blocked", { size: 12 })).child(K.label("size 12", { style: "labelMedium" }))]],
        ["progress", [K.linearProgress(160, null), K.linearProgress(160, 0), K.linearProgress(160, 0.35), K.linearProgress(160, 1), K.circularProgress(16), K.circularProgress(), K.circularProgress(32)]],
        ["divider", [v_flex().w(200).gap(8).child(K.divider()).child(K.divider({ inset: 16 })).child(K.divider({ inset: 16, insetEnd: 16 })).child(K.divider({ space: 4 })), h_flex().h(32).child(K.divider({ vertical: true, space: 8 }))]]))
      .child(this.section("Snackbars",
        ["plain", [K.snackbar("sn1", { title: "Copied to the clipboard", onClose: noop }), K.snackbar("sn5", { title: "Saved, click to open", onClick: noop, width: 280 })]],
        ["tone", [K.snackbar("sn2", { title: "Agent needs you", body: "Waiting for a yes on the migration plan, with a long body that wraps over lines", tone: "blocked", action: { label: "Show", onClick: noop }, onClose: noop }),
          K.snackbar("sn6", { title: "Build finished", tone: "done", action: { label: "Open", onClick: noop } })]],
        ["loud, icon", [K.snackbar("sn3", { title: "Agent blocked", body: "It asks to run the migration", tone: "blocked", loud: true, icon: K.icon("search"), action: { label: "Answer", onClick: noop }, onClose: noop }),
          K.snackbar("sn4", { title: "With an icon", icon: K.icon("check"), onClose: noop })]]));
    return v_flex().id("gallery").size_full().bg(r.surface).rounded(K.RADIUS.dialog).overflow_hidden().text_color(r.onSurface)
      .on_size_change((size, cx) => {
        const w = K.layoutPx(size.width);
        if (w !== this.width) { this.width = w; cx.notify(); }
      })
      .child(div().id("gallery-scroll").size_full().overflow_scrollbar().child(body));
  }
}

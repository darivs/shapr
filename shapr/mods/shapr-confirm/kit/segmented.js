// MD3 segmented button: an outlined pill split by the outline; the chosen segment sits on
// secondary-container with a check. Every segment is as wide as its words unless `fill`.
import { div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { H, type } from "./tokens.js";
import { roles } from "./roles.js";
import { press, disable, icon } from "./state.js";

/**
 * options: [[value, label, { disabled, tip, icon }?], ...]. onPick(value, e, cx).
 * opts: { size: "sm" | "lg", fill (stretch over the row), disabled }
 */
export function segmented(id, options, value, onPick, { size = "sm", fill = false, disabled = false } = {}) {
  const r = roles();
  const h = size === "lg" ? H.lg : H.sm;
  const last = options.length - 1;
  const row = h_flex().h(h).flex_none().rounded_full().border_1().border_color(r.outline).overflow_hidden()
    .when(fill, (el) => el.w_full())
    .children(options.map(([v, text, o = {}], i) => {
      const on = v === value, off = disabled || Boolean(o.disabled);
      let seg = h_flex().id(`${id}-${v}`).h_full().gap(6).px(12).items_center().justify_center().whitespace_nowrap()
        .text_color(off && !on ? r.disabled : on ? r.onSecondaryContainer : r.onSurface);
      seg = type(seg, size === "lg" ? "labelLarge" : "labelMedium");
      if (i === 0) seg = seg.rounded_l(h / 2).pl(16);
      if (i === last) seg = seg.rounded_r(h / 2).pr(16);
      if (i < last) seg = seg.border_r_1().border_color(r.outline);
      seg = fill ? seg.flex_1().min_w(0) : seg.flex_none();
      if (on) seg = seg.bg(r.secondaryContainer);
      if (o.tip) seg = seg.tooltip(o.tip);
      seg = press(seg, on || off ? null : (e, cx) => onPick(v, e, cx), { layer: r.hover });
      if (on) seg = seg.child(svg(icon("check")).size(16).flex_none());
      else if (o.icon) seg = seg.child(svg(o.icon).size(16).flex_none());
      return seg.child(fill ? div().min_w(0).truncate().child(text) : text);
    }));
  return disable(row, disabled);
}

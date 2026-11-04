// MD3 snackbar: inverse-surface, rounded xs, 48 tall for one line (68 for two), an optional
// inverse-primary action and a close icon. `tone` marks an alert with a status color strip.
import { div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { SHAPE, type } from "./tokens.js";
import { roles } from "./roles.js";
import { press, icon } from "./state.js";

/** opts: { title, body, action: { label, onClick }, onClose, tone (a status role), width, onClick } */
export function snackbar(id, { title, body = null, action = null, onClose = null, tone = null, width = 360, onClick = null } = {}) {
  const r = roles();
  let el = h_flex().id(id).w(width).min_h(48).flex_none().items_center().gap(4).pl(tone ? 12 : 16).pr(onClose || action ? 8 : 16).py(8)
    .rounded(SHAPE.xs).bg(r.inverseSurface).text_color(r.inverseOnSurface).shadow_md();
  el = press(el, onClick, { layer: "lift" });
  if (tone) el = el.child(div().w(4).h(32).mr(8).flex_none().rounded_full().bg(r[tone] ?? r.primary));
  el = el.child(v_flex().flex_1().min_w(0).gap(2)
    .child(type(div(), "bodyMedium", Boolean(body)).truncate().child(title))
    .when(Boolean(body), (el) => el.child(type(div(), "bodySmall").max_h(48).overflow_hidden().opacity(0.86).child(body))));
  if (action)
    el = el.child(press(type(div(), "labelLarge").id(`${id}-action`).h(36).px(12).flex_none().flex().items_center().rounded_full()
      .text_color(r.inversePrimary), action.onClick, { layer: "lift" }).child(action.label));
  if (onClose)
    el = el.child(press(div().id(`${id}-close`).size(32).flex_none().flex().items_center().justify_center().rounded_full(),
      onClose, { layer: "lift" }).child(svg(icon("x")).size(18)));
  return el;
}

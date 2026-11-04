// MD3 chips: assist, filter, input and suggestion. 32 tall (24 at size xs), rounded sm.
import { div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { H, RADIUS, type } from "./tokens.js";
import { roles } from "./roles.js";
import { press, disable, icon as kitIcon, stopPress } from "./state.js";

/**
 * opts: { kind: "assist" | "filter" | "input" | "suggestion", selected, icon (svg path), iconColor (a
 *   role name, e.g. a status), count (a muted number), onRemove (input chips: a trailing x),
 *   trailing (an element), size: "sm" | "xs", elevated, disabled, onClick }
 */
export function chip(id, text, { kind = "assist", selected = false, icon = null, iconColor = null, count = null, onRemove = null, trailing = null, size = "sm", elevated = false, disabled = false, onClick = null } = {}) {
  const r = roles();
  const xs = size === "xs";
  const lead = kind === "filter" && selected ? kitIcon("check") : icon;
  const iconPx = xs ? 14 : 18;
  let el = h_flex().id(id).h(xs ? H.xs : H.sm).flex_none().items_center().gap(xs ? 4 : 8).whitespace_nowrap()
    .rounded(RADIUS.chip).pl(lead ? (xs ? 6 : 8) : (xs ? 8 : 16)).pr(onRemove || trailing ? (xs ? 4 : 8) : (xs ? 8 : 16));
  el = type(el, xs ? "labelMedium" : "labelLarge");
  if (selected) el = el.bg(r.secondaryContainer).text_color(r.onSecondaryContainer);
  else if (elevated) el = el.bg(r.surfaceLow).shadow_sm().text_color(r.onSurfaceVariant);
  else el = el.border_1().border_color(r.outlineVariant).text_color(r.onSurfaceVariant);
  el = press(el, onClick, { disabled, layer: selected || elevated ? "lift" : r.hover });
  if (lead) el = el.child(svg(lead).size(iconPx).flex_none().text_color(iconColor && !selected ? r[iconColor] ?? r.primary : selected ? r.onSecondaryContainer : r.primary));
  el = el.child(text);
  if (count !== null && count !== undefined) el = el.child(div().text_color(r.onSurfaceVariant).child(String(count)));
  if (trailing) el = el.child(trailing);
  if (onRemove)
    el = el.child(stopPress(div().id(`${id}-remove`).size(iconPx + 2).flex_none().flex().items_center().justify_center().rounded_full()
      .cursor_pointer().hover((s) => s.bg(r.hover))
      .on_click((e, cx) => { cx.stop_propagation(); onRemove(e, cx); cx.notify(); })
      .child(svg(kitIcon("close")).size(iconPx - 4))));
  return disable(el, disabled);
}

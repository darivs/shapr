// MD3 checkbox: an 18 box in a 32 round target; checked and indeterminate fill primary, error red.
import { div, svg } from "gpui-kit";
import { roles } from "./roles.js";
import { press, disable, icon } from "./state.js";

/** value: true, false or "mixed". onToggle(next, e, cx). opts: { disabled, error } */
export function checkbox(id, value, onToggle = null, { disabled = false, error = false } = {}) {
  const r = roles();
  const on = value === true || value === "mixed";
  const tone = error ? r.error : r.primary;
  let box = div().size(18).flex_none().flex().items_center().justify_center().rounded(2);
  box = on ? box.bg(tone).text_color(error ? r.onError : r.onPrimary).child(svg(icon(value === "mixed" ? "minus" : "check")).size(14))
    : box.border_2().border_color(error ? r.error : r.onSurfaceVariant);
  const target = press(div().id(id).size(32).flex_none().flex().items_center().justify_center().rounded_full(),
    onToggle && ((e, cx) => onToggle(value !== true, e, cx)), { disabled, layer: r.hover });
  return disable(target.child(box), disabled);
}

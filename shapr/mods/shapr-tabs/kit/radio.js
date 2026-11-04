// MD3 radio button: a 20 ring in a 32 round target; on fills a 10 dot in primary.
import { div } from "gpui-kit";
import { roles } from "./roles.js";
import { press, disable } from "./state.js";

/** onPick(e, cx) when it is chosen. opts: { disabled, error } */
export function radio(id, on, onPick = null, { disabled = false, error = false } = {}) {
  const r = roles();
  const tone = error ? r.error : on ? r.primary : r.onSurfaceVariant;
  const ring = div().size(20).flex_none().flex().items_center().justify_center().rounded_full().border_2().border_color(tone)
    .when(on, (el) => el.child(div().size(10).rounded_full().bg(tone)));
  const target = press(div().id(id).size(32).flex_none().flex().items_center().justify_center().rounded_full(),
    on ? null : onPick, { disabled, layer: r.hover });
  return disable(target.child(ring), disabled);
}

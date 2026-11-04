// MD3 switch at desktop density: a 44 × 26 track; the handle grows when on and springs across.
import { div, svg } from "gpui-kit";
import { spring } from "./tokens.js";
import { roles } from "./roles.js";
import { press, disable, icon } from "./state.js";

export const SWITCH = { w: 44, h: 26 };

/** onToggle(next, event, cx). opts: { disabled, checkIcon (the handle shows a check when on) } */
export function toggleSwitch(id, on, onToggle, { disabled = false, checkIcon = false } = {}) {
  const r = roles();
  const { w, h } = SWITCH;
  const knob = on ? 18 : 14;
  const inset = on ? (h - knob) / 2 : (h - knob) / 2;
  let track = div().id(id).w(w).h(h).flex_none().relative().rounded_full();
  track = on ? track.bg(r.primary) : track.bg(r.surfaceHighest).border_2().border_color(r.outline);
  track = press(track, onToggle && ((e, cx) => onToggle(!on, e, cx)), { disabled, layer: "lift" });
  // The border sits inside the track, so an off handle is measured from inside it.
  const top = on ? inset : inset - 2, left = on ? w - knob - inset : inset - 2;
  const handle = spring(div().absolute().size(knob).top(top).left(left).rounded_full().flex().items_center().justify_center()
    .bg(on ? r.onPrimary : r.outline), "left", "fast");
  return disable(track.child(on && checkIcon ? handle.text_color(r.primary).child(svg(icon("check")).size(12)) : handle), disabled);
}

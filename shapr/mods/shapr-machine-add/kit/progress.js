// MD3 progress indicators: linear (a 4 track with a gap before the remaining part) and circular.
// A null value is indeterminate, moved natively (no timer); reduced motion holds it still.
import { div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { loop, spring, reducedMotion } from "./tokens.js";
import { roles } from "./roles.js";
import { icon } from "./state.js";

/** width px; value 0..1 or null. */
export function linearProgress(width, value = null) {
  const r = roles();
  if (value === null) {
    const bar = width * 0.4;
    const track = div().w(width).h(4).flex_none().relative().rounded_full().bg(r.secondaryContainer).overflow_hidden();
    return track.child(loop(div().absolute().top(0).left(reducedMotion() ? width * 0.3 : 0).h(4).w(bar).rounded_full().bg(r.primary),
      "left", { from: -bar, to: width, period: 1600, easing: "ease-in-out" }));
  }
  const done = Math.max(0, Math.min(1, value));
  const active = Math.round(done * width), gap = done > 0 && done < 1 ? 4 : 0;
  return h_flex().w(width).h(4).flex_none().items_center()
    .child(spring(div().w(active).h(4).flex_none().rounded_full().bg(r.primary), "width", "spatial"))
    .child(div().w(gap).flex_none())
    .child(div().flex_1().h(4).rounded_full().bg(r.secondaryContainer));
}

/** A circular indicator, size px (default 24): spins while indeterminate. */
export function circularProgress(size = 24) {
  const el = svg(icon("progress_activity")).size(size).flex_none().text_color(roles().primary);
  return reducedMotion() ? el : el.spin(1000);
}

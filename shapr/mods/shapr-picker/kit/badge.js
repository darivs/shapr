// MD3 badges: small (a 6 dot) and large (16 tall, a number up to 999+), error by default; and
// the agent status mark, which keeps Herdr's status colors (blocked is the loudest).
import { div, svg } from "gpui-kit";
import { type, loop, reducedMotion } from "./tokens.js";
import { roles } from "./roles.js";
import { icon } from "./state.js";

/** opts: { count (null: the small dot), max, role (a roles() name for the fill), on (its text role) } */
export function badge({ count = null, max = 999, role = "error", on = "onError" } = {}) {
  const r = roles();
  if (count === null || count === undefined) return div().size(6).flex_none().rounded_full().bg(r[role]);
  const text = count > max ? `${max}+` : String(count);
  return type(div(), "labelSmall").h(16).min_w(16).px(text.length > 1 ? 4 : 0).flex_none().flex().items_center().justify_center()
    .rounded_full().bg(r[role]).text_color(r[on] ?? r.onError).child(text);
}

/**
 * An agent's status: working spins, blocked is a filled dot that pulses (the loudest mark on
 * screen), done a filled dot, idle a hollow ring. size 8 by default; the spinner is 2 wider.
 */
export function statusMark(status, { size = 8 } = {}) {
  const r = roles();
  if (status === "working") {
    const s = svg(icon("spinner")).size(size + 4).flex_none().text_color(r.working);
    return reducedMotion() ? s : s.spin(900);
  }
  if (status === "blocked") return loop(div().size(size + 2).flex_none().rounded_full().bg(r.blocked), "opacity", { from: 0.55, to: 1, period: 1200 });
  if (status === "done") return div().size(size).flex_none().rounded_full().bg(r.done);
  return div().size(size).flex_none().rounded_full().border_1().border_color(r.idle);
}

/** A status count badge (blocked or done agents): large badge in that status color. */
export function statusBadge(status, count) {
  return badge({ count, max: 99, role: status, on: "terminal" });
}

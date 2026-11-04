// MD3 search bar: a 48 pill on surface-container-highest with a leading search icon, the Input
// the mod owns (body large), and an optional trailing element (a hint, a clear button).
import { div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { H, type } from "./tokens.js";
import { roles } from "./roles.js";
import { icon } from "./state.js";

/** input: the Input element. opts: { trailing, size: "xl" (48) | "lg" (40) } */
export function searchBar(input, { trailing = null, size = "xl" } = {}) {
  const r = roles();
  const el = h_flex().w_full().h(H[size] ?? H.xl).flex_none().pl(16).pr(8).gap(12).items_center().rounded_full()
    .bg(r.surfaceHighest).text_color(r.onSurface)
    .child(svg(icon("search")).size(20).flex_none().text_color(r.onSurfaceVariant))
    .child(type(div(), "bodyLarge").flex_1().min_w(0).child(input));
  return trailing ? el.child(div().flex_none().flex().items_center().text_color(r.onSurfaceVariant).child(trailing)) : el;
}

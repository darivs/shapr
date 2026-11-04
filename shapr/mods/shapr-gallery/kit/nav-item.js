// MD3 navigation item: a drawer item (a 40 pill row) or a rail item (a 56 × 32 indicator over a
// label). The active indicator is secondary-container.
import { div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { ROW, type } from "./tokens.js";
import { roles } from "./roles.js";
import { press } from "./state.js";

/**
 * opts: { icon (svg path), leading (an element in the icon's place), active, badge (an element),
 *   trailing (an element), rail, propagate, onClick }
 */
export function navItem(id, text, { icon = null, leading = null, active = false, badge = null, trailing = null, rail = false, propagate = false, onClick = null } = {}) {
  const r = roles();
  const ink = active ? r.onSecondaryContainer : r.onSurfaceVariant;
  const glyph = leading ?? (icon ? svg(icon).size(rail ? 24 : 20).flex_none().text_color(ink) : null);
  if (rail) {
    let pill = div().w(56).h(32).flex().items_center().justify_center().relative().rounded_full();
    if (active) pill = pill.bg(r.secondaryContainer);
    pill = pill.when(Boolean(glyph), (el) => el.child(glyph)).when(Boolean(badge), (el) => el.child(div().absolute().top(2).left(34).child(badge)));
    const item = v_flex().id(id).w(80).flex_none().gap(4).items_center().child(pill)
      .child(type(div(), "labelMedium", active).text_color(ink).child(text));
    return press(item, onClick, { layer: null, propagate });
  }
  let el = h_flex().id(id).h(ROW.one).w_full().flex_none().pl(16).pr(16).gap(12).items_center().rounded_full().text_color(ink);
  el = type(el, "labelLarge", active);
  if (active) el = el.bg(r.secondaryContainer);
  el = press(el, onClick, { layer: active ? "lift" : r.hover, propagate });
  if (glyph) el = el.child(div().flex_none().flex().items_center().child(glyph));
  el = el.child(div().flex_1().min_w(0).truncate().child(text));
  if (badge) el = el.child(div().flex_none().child(badge));
  if (trailing) el = el.child(div().flex_none().child(trailing));
  return el;
}

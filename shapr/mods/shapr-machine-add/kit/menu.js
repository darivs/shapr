// MD3 Expressive menu: a surface-container menu rounded lg, 4 inside, items 40 tall rounded md,
// 2 apart; a chosen item sits on secondary-container. menuHeight() counts exactly what this
// draws, so an opener can size the overlay to it.
import { div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { ROW, RADIUS, type } from "./tokens.js";
import { roles } from "./roles.js";
import { press, icon as kitIcon } from "./state.js";

export const MENU = { pad: 4, gap: 2, dividerH: 9, headerH: 32 };

/** The menu's own surface, for a mod that draws its frame (frame: "none"). */
export function menuSurface(el = v_flex()) {
  const r = roles();
  return el.bg(r.surfaceContainer).rounded(RADIUS.menu).p(MENU.pad).gap(MENU.gap).shadow_md().text_color(r.onSurface);
}

/**
 * One item: an optional 20 icon slot (or `leading` element), the label, a muted hint (a key) and
 * a trailing check when `selected` is true (false keeps the slot, so labels line up).
 * opts: { icon, leading, hint, trailing, selected, danger, disabled, onClick, propagate }
 */
export function menuItem(id, text, { icon = null, leading = null, hint = null, trailing = null, selected = null, danger = false, disabled = false, onClick = null, propagate = false } = {}) {
  const r = roles();
  const ink = disabled ? r.disabled : danger ? r.error : selected ? r.onSecondaryContainer : r.onSurface;
  let el = h_flex().id(id).h(ROW.menu).w_full().flex_none().px(12).gap(12).items_center().rounded(RADIUS.row).text_color(ink);
  el = type(el, "labelLarge");
  if (selected === true) el = el.bg(r.secondaryContainer);
  el = press(el, onClick, { disabled, layer: selected ? "lift" : r.hover, propagate });
  if (leading) el = el.child(div().size(20).flex_none().flex().items_center().justify_center().child(leading));
  else if (icon) el = el.child(svg(icon).size(20).flex_none().text_color(danger ? r.error : selected ? r.onSecondaryContainer : r.onSurfaceVariant));
  el = el.child(div().flex_1().min_w(0).truncate().child(text));
  if (hint) el = el.child(type(div(), "labelMedium").flex_none().pl(8).text_color(r.onSurfaceVariant).child(hint));
  if (trailing) el = el.child(div().flex_none().text_color(r.onSurfaceVariant).child(trailing));
  if (selected !== null) el = el.child(div().size(20).flex_none().when(selected === true, (el) => el.child(svg(kitIcon("check")).size(20))));
  return el;
}

/** A line between groups: 1 tall with 4 above and below (9 in all). */
export function menuDivider() {
  return div().h(1).my(4).mx(-MENU.pad).flex_none().bg(roles().outlineVariant);
}

/** A group's label inside a menu: label medium, on-surface-variant, 32 tall. */
export function menuHeader(text) {
  const r = roles();
  return type(div(), "labelMedium").h(MENU.headerH).flex_none().flex().items_center().px(12).text_color(r.onSurfaceVariant).child(text);
}

/** The exact height of a menu of `items` items, `dividers` dividers and `headers` headers. */
export function menuHeight({ items = 0, dividers = 0, headers = 0 } = {}) {
  const n = items + dividers + headers;
  return 2 * MENU.pad + items * ROW.menu + dividers * MENU.dividerH + headers * MENU.headerH + Math.max(0, n - 1) * MENU.gap;
}

// MD3 list item: one line 40, two lines 56, three lines 72 (desktop density); rounded md; a
// selected item sits on secondary-container, as Expressive lists do.
import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { ROW, RADIUS, type } from "./tokens.js";
import { roles } from "./roles.js";
import { press, disable } from "./state.js";

/**
 * opts: { overline, supporting, lines (2 or 3 when supporting wraps), leading, trailing (elements),
 *   trailingText, selected, disabled, interactive (hover without its own click), propagate, onClick }
 */
export function listItem(id, headline, { overline = null, supporting = null, lines = null, leading = null, trailing = null, trailingText = null, selected = false, disabled = false, interactive = false, propagate = false, onClick = null } = {}) {
  const r = roles();
  const n = lines ?? (supporting || overline ? 2 : 1);
  const h = n >= 3 ? ROW.three : n === 2 ? ROW.two : ROW.one;
  let el = h_flex().id(id).h(h).w_full().flex_none().pl(16).pr(trailing || trailingText ? 12 : 16).gap(12).items_center().rounded(RADIUS.row);
  if (selected) el = el.bg(r.secondaryContainer);
  if (onClick) el = press(el, onClick, { disabled, layer: selected ? "lift" : r.hover, propagate });
  else if (interactive && !disabled) el = el.cursor_pointer().hover((s) => (selected ? s.opacity(0.92) : s.bg(r.hover)));
  if (leading) el = el.child(div().flex_none().flex().items_center().text_color(selected ? r.onSecondaryContainer : r.onSurfaceVariant).child(leading));
  el = el.child(v_flex().flex_1().min_w(0)
    .when(Boolean(overline), (el) => el.child(type(div(), "labelSmall").truncate().text_color(r.onSurfaceVariant).child(overline)))
    .child(type(div(), n === 1 ? "bodyMedium" : "bodyLarge", selected).truncate().text_color(selected ? r.onSecondaryContainer : r.onSurface).child(headline))
    .when(Boolean(supporting), (el) => el.child(type(div(), "bodySmall").when(n < 3, (el) => el.truncate()).text_color(r.onSurfaceVariant).child(supporting))));
  if (trailingText) el = el.child(type(div(), "labelSmall").flex_none().text_color(r.onSurfaceVariant).child(trailingText));
  if (trailing) el = el.child(div().flex_none().flex().items_center().text_color(r.onSurfaceVariant).child(trailing));
  return disable(el, disabled);
}

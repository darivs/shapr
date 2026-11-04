// A run of text in one MD3 type style and one color role.
import { div } from "gpui-kit";
import { type } from "./tokens.js";
import { roles } from "./roles.js";

/**
 * opts: { style (a TYPE name), role (a roles() name, default onSurface), emphasized,
 *   truncate (one line, cut with an ellipsis; the label shrinks: give its parent min_w(0)), grow }
 */
export function label(text, { style = "bodyMedium", role = "onSurface", emphasized = false, truncate = false, grow = false } = {}) {
  let el = type(div(), style, emphasized).text_color(roles()[role] ?? roles().onSurface);
  if (truncate) el = el.min_w(0).truncate();
  if (grow) el = el.flex_1();
  return el.child(String(text ?? ""));
}

/** A list subheader or section heading: title small, on-surface-variant, sentence case. */
export function heading(text, { trailing = null } = {}) {
  const r = roles();
  const el = div().h(36).flex().flex_none().items_center().gap(8).px(16).text_color(r.onSurfaceVariant);
  return type(el, "titleSmall").child(div().flex_1().min_w(0).truncate().child(text))
    .when(Boolean(trailing), (el) => el.child(div().flex_none().child(trailing)));
}

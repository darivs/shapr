// MD3 text field, outlined or filled, around a gpui-base Input the mod owns. 40 tall at desktop
// density (single line); the label sits above the box, the supporting text below it.
import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { H, RADIUS, type } from "./tokens.js";
import { roles } from "./roles.js";
import { disable } from "./state.js";

/** The box alone. opts: { kind: "outlined" | "filled", focused, error, multiline, radius, disabled } */
export function fieldBox(el, { kind = "outlined", focused = false, error = false, multiline = false, radius = null, disabled = false } = {}) {
  const r = roles();
  const thick = focused || error;
  const tone = error ? r.error : focused ? r.primary : r.outline;
  let box = el.px(thick && kind === "outlined" ? 15 : 16).text_color(r.onSurface);
  box = type(box, "bodyLarge");
  box = multiline ? box.py(thick && kind === "outlined" ? 9 : 10) : box.h(H.lg).flex().items_center();
  if (kind === "filled")
    box = box.bg(r.surfaceHighest).rounded_t(radius ?? RADIUS.field).border_b(thick ? 2 : 1).border_color(tone);
  else
    box = box.bg(r.surfaceLowest).rounded(radius ?? RADIUS.field).border(thick ? 2 : 1).border_color(tone);
  return disable(box, disabled);
}

/** The height a text field takes, for openers: label 16 + 4, box, supporting 4 + 16. */
export function fieldHeight({ label = true, supporting = false, lines = 1 } = {}) {
  const box = lines > 1 ? 20 + lines * 24 : H.lg;
  return (label ? 20 : 0) + box + (supporting ? 20 : 0);
}

/**
 * A full field: label, box with leading/trailing elements, supporting or error text.
 * input: the Input element (Input.new(state)), styled by the box. opts: fieldBox's plus
 * { label, supporting, leading, trailing }.
 */
export function textField(input, { label = null, supporting = null, leading = null, trailing = null, ...box } = {}) {
  const r = roles();
  const inner = h_flex().w_full().gap(12).items_center()
    .when(Boolean(leading), (el) => el.child(div().flex_none().text_color(r.onSurfaceVariant).child(leading)))
    .child(div().flex_1().min_w(0).child(input))
    .when(Boolean(trailing), (el) => el.child(div().flex_none().text_color(r.onSurfaceVariant).child(trailing)));
  return v_flex().w_full().gap(4)
    .when(Boolean(label), (el) => el.child(type(div(), "labelMedium").text_color(box.error ? r.error : box.focused ? r.primary : r.onSurfaceVariant).child(label)))
    .child(fieldBox(div().w_full(), box).child(inner))
    .when(Boolean(supporting), (el) => el.child(type(div(), "bodySmall").px(16).text_color(box.error ? r.error : r.onSurfaceVariant).child(supporting)));
}

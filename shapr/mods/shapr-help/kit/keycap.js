// A key cap: one key stroke of a shortcut, 24 tall, rounded sm, on surface-container-highest.
import { div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { H, SHAPE, type } from "./tokens.js";
import { roles } from "./roles.js";

export function keycap(text) {
  const r = roles();
  return type(div(), "labelMedium").h(H.xs).min_w(H.xs).px(8).flex_none().flex().items_center().justify_center()
    .rounded(SHAPE.sm).bg(r.surfaceHighest).text_color(r.onSurface).whitespace_nowrap().child(text);
}

/** A shortcut as key caps, 4 apart: keys ["⌘", "K"]. */
export function shortcut(keys) {
  return h_flex().flex_none().gap(4).items_center().children(keys.map(keycap));
}

// A side panel (Files, Changes): a card like a terminal pane beside it (the terminal's ground,
// rounded lg, no line), and its header: 48 tall, a title that never shrinks, a detail that
// shrinks and truncates, and controls that stay their size.
import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { H, SHAPE, type } from "./tokens.js";
import { roles } from "./roles.js";

/** The panel's card. It fills its block. */
export function panelCard(el = v_flex()) {
  const r = roles();
  return el.size_full().min_h(0).bg(r.terminal).rounded(SHAPE.lg).overflow_hidden().text_color(r.onSurface);
}

/** opts: { leading (an element before the title, e.g. a back button), detail (text), actions: [elements] } */
export function panelHeader(title, { leading = null, detail = null, actions = [] } = {}) {
  const r = roles();
  return h_flex().h(H.xl).w_full().flex_none().px(16).gap(8).items_center()
    .when(Boolean(leading), (el) => el.ml(-8).child(div().flex_none().child(leading)))
    .child(type(div(), "titleMedium").flex_none().whitespace_nowrap().child(title))
    .child(type(div(), "bodySmall").flex_1().min_w(0).truncate().text_color(r.onSurfaceVariant).when(Boolean(detail), (el) => el.child(detail)))
    .when(actions.length > 0, (el) => el.child(h_flex().flex_none().gap(4).items_center().children(actions)));
}

/** An inner well for code or a diff: the terminal ground, inset 8, rounded sm. */
export function panelWell(el = v_flex()) {
  return el.flex_1().min_h(0).mx(8).mb(8).py(SHAPE.sm).rounded(SHAPE.sm).bg(roles().surfaceLowest).overflow_hidden();
}

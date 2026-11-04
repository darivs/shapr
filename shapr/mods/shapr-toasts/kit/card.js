// MD3 card: elevated (surface-container-low with a small shadow), filled (surface-container-highest)
// or outlined (surface with an outline-variant line). Rounded md, 16 inside.
import { v_flex } from "gpui-base";
import { RADIUS } from "./tokens.js";
import { roles } from "./roles.js";
import { press, disable } from "./state.js";

/** opts: { kind: "elevated" | "filled" | "outlined", pad, id (needed with onClick), disabled, onClick } */
export function card(el = v_flex(), { kind = "filled", pad = 16, id = null, disabled = false, onClick = null } = {}) {
  const r = roles();
  let c = el.rounded(RADIUS.card).p(pad).text_color(r.onSurface);
  if (kind === "elevated") c = c.bg(r.surfaceLow).shadow_sm();
  else if (kind === "outlined") c = c.bg(r.surface).border_1().border_color(r.outlineVariant);
  else c = c.bg(r.surfaceHighest);
  if (id) c = c.id(id);
  if (id && onClick) c = press(c, onClick, { disabled, layer: "lift" });
  return disable(c, disabled);
}

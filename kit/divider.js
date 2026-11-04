// MD3 divider: a 1 px outline-variant line, full width or inset, horizontal or vertical.
import { div } from "gpui-kit";
import { roles } from "./roles.js";

/** opts: { vertical, inset (px at the start), insetEnd, space (px above and below) } */
export function divider({ vertical = false, inset = 0, insetEnd = 0, space = 0 } = {}) {
  const line = div().flex_none().bg(roles().outlineVariant);
  if (vertical) return line.w(1).h_full().mx(space);
  return line.h(1).my(space).ml(inset).mr(insetEnd);
}

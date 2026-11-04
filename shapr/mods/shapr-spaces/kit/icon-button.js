// MD3 Expressive icon button: standard, filled, tonal or outlined; a toggle when `selected` is
// not null. size xs 24 · sm 32 · md 36 · lg 40 · xl 48; width narrow, default or wide.
import { div, svg } from "gpui-kit";
import { H } from "./tokens.js";
import { roles } from "./roles.js";
import { press, disable } from "./state.js";

const ICON = { xs: 14, sm: 18, md: 20, lg: 20, xl: 24 };

/**
 * opts: { kind: "standard" | "filled" | "tonal" | "outlined", size, width: "narrow" | "default" | "wide",
 *   selected (true/false for a toggle, null otherwise), danger, disabled, tip, onClick }
 */
export function iconButton(id, path, { kind = "standard", size = "sm", width = "default", selected = null, danger = false, disabled = false, tip = null, onClick = null } = {}) {
  const r = roles();
  const h = H[size] ?? H.sm;
  const w = width === "narrow" ? h - 8 : width === "wide" ? h + 12 : h;
  const on = selected === true;
  let fill = null, ink = r.onSurfaceVariant;
  if (kind === "filled") { fill = on || selected === null ? (danger ? r.error : r.primary) : r.surfaceHighest; ink = on || selected === null ? (danger ? r.onError : r.onPrimary) : r.primary; }
  else if (kind === "tonal") { fill = on ? r.secondary : r.secondaryContainer; ink = on ? r.onPrimary : r.onSecondaryContainer; }
  else if (kind === "outlined") { fill = on ? r.inverseSurface : null; ink = on ? r.inverseOnSurface : r.onSurfaceVariant; }
  else { ink = on ? r.primary : danger ? r.error : r.onSurfaceVariant; }
  let el = div().id(id).w(w).h(h).flex_none().flex().items_center().justify_center().text_color(ink);
  el = on && kind !== "standard" ? el.rounded(h >= 40 ? 16 : 12) : el.rounded_full();
  if (fill) el = el.bg(fill);
  if (kind === "outlined" && !on) el = el.border_1().border_color(r.outlineVariant);
  el = press(el, onClick, { disabled, layer: fill ? "lift" : r.hover });
  if (tip) el = el.tooltip(tip);
  return disable(el.child(svg(path).size(ICON[size] ?? 18)), disabled);
}

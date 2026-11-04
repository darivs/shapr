// MD3 Expressive common button: filled, tonal, outlined, elevated or text; round or square.
// size xs 24 · sm 32 · md 36 · lg 40 · xl 48 (desktop density). Always as wide as its words.
import { h_flex } from "gpui-base";
import { div, svg } from "gpui-kit";
import { H, type } from "./tokens.js";
import { roles } from "./roles.js";
import { press, disable } from "./state.js";

// Square corners per size (MD3 Expressive: the square shape, by button size).
const SQUARE = { xs: 12, sm: 12, md: 12, lg: 16, xl: 16 };

/** The button's padding and icon size for a size name. */
export function buttonMetrics(size = "sm") {
  const h = H[size] ?? H.sm;
  return { h, pad: size === "xl" ? 24 : size === "lg" ? 20 : size === "xs" ? 10 : 16, icon: size === "xl" || size === "lg" ? 20 : size === "xs" ? 14 : 18, gap: size === "xs" ? 4 : 8 };
}

/**
 * opts: { kind: "filled" | "tonal" | "outlined" | "elevated" | "text", size, shape: "round" | "square",
 *   icon (svg path), trailing (svg path), leading / end (elements before and after the label),
 *   maxLabel (px: the label truncates past it), selected (a toggle that is on), danger, disabled, tip,
 *   onClick, interactive (pointer and hover without a click of its own: the mod adds its handlers) }
 */
export function button(id, label, { kind = "filled", size = "sm", shape = "round", icon = null, trailing = null, leading = null, end = null, maxLabel = null, selected = false, danger = false, disabled = false, tip = null, onClick = null, interactive = false } = {}) {
  const r = roles();
  const m = buttonMetrics(size);
  const k = selected ? "tonal" : kind;
  const fill = { filled: danger ? r.error : r.primary, tonal: danger ? r.errorContainer : r.secondaryContainer, elevated: r.surfaceLow }[k] ?? null;
  const ink = { filled: danger ? r.onError : r.onPrimary, tonal: danger ? r.onErrorContainer : r.onSecondaryContainer, elevated: danger ? r.error : r.primary }[k]
    ?? (danger ? r.error : k === "text" ? r.primary : r.onSurfaceVariant);
  let el = h_flex().id(id).h(m.h).flex_none().gap(m.gap).items_center().justify_center().whitespace_nowrap()
    .pl(icon || leading ? m.pad - 4 : k === "text" ? m.pad - 4 : m.pad).pr(trailing || end ? m.pad - 6 : k === "text" ? m.pad - 4 : m.pad)
    .text_color(ink);
  el = type(el, size === "xs" || size === "sm" ? "labelMedium" : "labelLarge", false);
  el = shape === "square" || selected ? el.rounded(SQUARE[size] ?? 12) : el.rounded_full();
  if (fill) el = el.bg(fill);
  if (k === "outlined") el = el.border_1().border_color(r.outlineVariant);
  if (k === "elevated") el = el.shadow_sm();
  el = press(el, onClick, { disabled, layer: fill ? "lift" : r.hover });
  if (interactive && !onClick && !disabled) el = el.cursor_pointer().hover((s) => (fill ? s.opacity(0.92) : s.bg(r.hover)));
  if (tip) el = el.tooltip(tip);
  if (leading) el = el.child(div().flex_none().flex().items_center().child(leading));
  else if (icon) el = el.child(svg(icon).size(m.icon).flex_none());
  el = el.child(maxLabel ? div().max_w(maxLabel).min_w(0).truncate().child(label) : label);
  if (end) el = el.child(div().flex_none().flex().items_center().child(end));
  if (trailing) el = el.child(svg(trailing).size(m.icon).flex_none());
  return disable(el, disabled);
}

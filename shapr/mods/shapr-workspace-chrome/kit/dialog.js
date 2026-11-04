// MD3 basic dialog, drawn by the mod (open it with frame: "none"): surface-container-high,
// rounded xl (28), 24 inside, 16 between headline, body and actions, a large shadow.
// dialogHeight() counts what this draws, so an opener sizes the overlay exactly.
import { div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { H, RADIUS, lineOf, type } from "./tokens.js";
import { roles } from "./roles.js";
import { button } from "./button.js";

export const DIALOG = { pad: 24, gap: 16, iconSize: 24, minW: 280, maxW: 560 };

/** The dialog's surface. It fills its overlay; rows inside run edge to edge with negative margins. */
export function dialogSurface(el = v_flex()) {
  const r = roles();
  return el.size_full().bg(r.surfaceHigh).rounded(RADIUS.dialog).p(DIALOG.pad).gap(DIALOG.gap).shadow_lg().overflow_hidden().text_color(r.onSurface);
}

/** The headline, headline small; with an icon it centres under it, as MD3 does. */
export function dialogHeadline(text, { icon = null } = {}) {
  const r = roles();
  const h = type(div(), "headlineSmall").text_color(r.onSurface).child(text);
  if (!icon) return h;
  return v_flex().w_full().gap(16).items_center().child(svg(icon).size(DIALOG.iconSize).text_color(r.secondary)).child(h.text_center());
}

/** Supporting text: body medium, on-surface-variant. */
export function dialogBody(text) {
  return type(div(), "bodyMedium").text_color(roles().onSurfaceVariant).child(text);
}

/**
 * The actions row, right aligned: a text Cancel and one filled primary.
 * opts: { onCancel, cancelLabel, primary: { id, label, onClick, disabled, danger }, note, error }
 */
export function dialogActions({ onCancel = null, cancelLabel = "Cancel", primary = null, note = "", error = false } = {}) {
  const r = roles();
  return h_flex().h(H.lg).w_full().flex_none().gap(8).items_center()
    .child(type(div(), "bodySmall").flex_1().min_w(0).truncate().text_color(error ? r.error : r.onSurfaceVariant).child(note || ""))
    .when(Boolean(onCancel), (el) => el.child(button("dialog-cancel", cancelLabel, { kind: "text", size: "lg", onClick: onCancel })))
    .when(Boolean(primary), (el) => el.child(button(primary.id ?? "dialog-primary", primary.label,
      { kind: "filled", size: "lg", disabled: primary.disabled, danger: primary.danger, onClick: primary.onClick })));
}

/**
 * The exact overlay height for a dialog: padding, headline lines, body lines, extra px the mod
 * draws (fields, lists), the actions row and the gaps between the parts that are there.
 */
export function dialogHeight({ headlineLines = 1, icon = false, bodyLines = 0, extra = [], actions = true } = {}) {
  const parts = [];
  if (headlineLines) parts.push(headlineLines * lineOf("headlineSmall") + (icon ? DIALOG.iconSize + 16 : 0));
  if (bodyLines) parts.push(bodyLines * lineOf("bodyMedium"));
  for (const x of extra) parts.push(x);
  if (actions) parts.push(H.lg);
  return 2 * DIALOG.pad + parts.reduce((a, b) => a + b, 0) + Math.max(0, parts.length - 1) * DIALOG.gap;
}

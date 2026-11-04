// shapr kit state layers and presses, shared by every interactive component.
// Only what a click does something on gets the pointer and a hover; nothing moves on hover.
import { SELF } from "./self.js";

/** A kit icon's path, inside the mod that holds this copy of the kit. */
export const icon = (name) => `mods/${SELF}/kit/icons/${name}.svg`;

/** Stops a press so a control inside a window_drag block clicks instead of dragging. */
export const stopPress = (el) => el.on_mouse_down("left", (_e, cx) => cx.stop_propagation());

/**
 * Makes `el` (which has an id) clickable: the pointer, the hover state layer in the element's own
 * shape, a press that doesn't drag the window, and a click that stops at this element unless
 * `propagate`. layer: a color for the hover layer, or "lift" (a filled container: lighter, not a
 * color). Returns el unchanged when there is nothing to click.
 */
export function press(el, onClick, { layer, propagate = false, disabled = false } = {}) {
  if (disabled || !onClick) return el;
  return stopPress(el.cursor_pointer())
    .hover((s) => (layer === "lift" ? s.opacity(0.92) : layer ? s.bg(layer) : s))
    .active((s) => (layer === "lift" ? s.opacity(0.86) : s.opacity(0.9)))
    .on_click((e, cx) => { if (!propagate) cx.stop_propagation(); onClick(e, cx); cx.notify(); });
}

/** Disabled content and containers: 38% of their color, as MD3 does. */
export const disable = (el, disabled) => (disabled ? el.opacity(0.38) : el);

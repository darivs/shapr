// shapr kit color roles: MD3 roles by their theme() names. shapr's themes add the MD3 roles
// Herdr has no name for (error, tertiary, inverse surface, ...); under another theme they fall
// back to the nearest Herdr role, so a mod never needs hex.
import { theme } from "herdr";

/** Every color a component uses, by MD3 role. */
export function roles() {
  const t = theme();
  const or = (k, f) => t[k] ?? t[f];
  return {
    surface: t.canvas, surfaceLowest: or("surface_lowest", "background"), surfaceLow: t.surface,
    surfaceContainer: t.chrome, surfaceHigh: t.raised, surfaceHighest: or("surface_highest", "popover"),
    popover: t.popover, terminal: t.background,
    onSurface: t.foreground, onSurfaceVariant: t.muted, disabled: t.dim,
    outline: t.input, outlineVariant: t.border,
    primary: t.solid, onPrimary: t.solid_foreground,
    primaryContainer: t.accent, onPrimaryContainer: t.accent_foreground,
    secondary: or("secondary", "muted"),
    secondaryContainer: t.selected, onSecondaryContainer: or("on_selected", "foreground"),
    tertiary: or("tertiary", "solid"), tertiaryContainer: or("tertiary_container", "accent"),
    onTertiaryContainer: or("on_tertiary_container", "accent_foreground"),
    error: or("error", "blocked"), onError: or("on_error", "background"),
    errorContainer: or("error_container", "raised"), onErrorContainer: or("on_error_container", "blocked"),
    inverseSurface: or("inverse_surface", "foreground"), inverseOnSurface: or("inverse_on_surface", "background"),
    inversePrimary: or("inverse_primary", "accent"),
    hover: t.hover, pressed: or("pressed", "selected"),
    // Agent status keeps Herdr's own colors; blocked is the loudest thing on screen.
    working: t.working, blocked: t.blocked, done: t.done, idle: t.idle, unknown: t.unknown,
  };
}

/** Text on a status fill: the surface's own ground, which contrasts in light and dark. */
export const onStatus = () => theme().background;

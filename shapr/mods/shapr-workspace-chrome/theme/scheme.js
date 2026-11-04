// shapr's light and dark themes from the person's seed color and contrast level, through
// material-color-utilities (SchemeTonalSpot). Every value is #rrggbb: Herdr's theme files take no
// alpha, so the hover layer and disabled text are blended onto their surfaces here.
import { Hct, SchemeTonalSpot, MaterialDynamicColors as M, TonalPalette, argbFromHex, hexFromArgb } from "./mcu.js";

export const SEED = "#6750A4";
export const CONTRAST = { standard: 0, medium: 0.5, high: 1 };
export const NAMES = { light: "shapr-light", dark: "shapr-dark" };

// Agent status keeps Herdr's own colors (its paper and graphite themes): they mean the same
// thing in every layout, and blocked stays the loudest.
const STATUS = {
  light: { working: "#9a6700", blocked: "#c93c2c", done: "#2f6fe4", idle: "#a8a8aa", unknown: "#a8a8aa" },
  dark: { working: "#e5c07b", blocked: "#f0705f", done: "#76a8ff", idle: "#696a6d", unknown: "#696a6d" },
};

// Terminal colors: fixed hues, toned for the appearance, so programs read the same under any seed.
const HUES = { red: [25, 70], green: [140, 50], yellow: [85, 60], blue: [260, 55], magenta: [310, 50], cyan: [195, 45] };

const hex = (argb) => hexFromArgb(argb).toLowerCase();
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** `top` at `alpha` over `under`, as one opaque color. */
export function blend(top, under, alpha) {
  const a = rgb(top), b = rgb(under);
  return `#${a.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, "0")).join("")}`;
}

function valid(seed) {
  return typeof seed === "string" && /^#[0-9a-fA-F]{6}$/.test(seed) ? seed : SEED;
}

/** One appearance's theme file (the JSON Herdr reads from themes/). */
export function themeFile({ seed = SEED, contrast = "standard" } = {}, dark = false) {
  const scheme = (d) => new SchemeTonalSpot(Hct.fromInt(argbFromHex(valid(seed))), d, CONTRAST[contrast] ?? 0);
  const s = scheme(dark);
  const c = (role) => hex(M[role].getArgb(s));
  // Terminals stay dark in light mode too: their ground, text, selection, cursor and ANSI colors
  // always come from the dark scheme.
  const ds = dark ? s : scheme(true);
  const dc = (role) => hex(M[role].getArgb(ds));
  const n = s.neutralPalette;
  const ansiTone = (name, bright) => {
    const [hue, chroma] = HUES[name];
    return hex(TonalPalette.fromHueAndChroma(hue, chroma).tone(bright ? 90 : 80));
  };
  const ansi = [
    hex(n.tone(20)), ansiTone("red"), ansiTone("green"), ansiTone("yellow"), ansiTone("blue"), ansiTone("magenta"), ansiTone("cyan"), hex(n.tone(90)),
    hex(n.tone(60)), ansiTone("red", true), ansiTone("green", true), ansiTone("yellow", true), ansiTone("blue", true), ansiTone("magenta", true), ansiTone("cyan", true), hex(n.tone(99)),
  ];
  const surface = c("surface"), onSurface = c("onSurface"), container = c("surfaceContainer");
  // Panes are cards on one surface: the terminal's ground is a card, the dark scheme's
  // surface-container in both appearances (in dark mode two MD3 steps off canvas).
  const terminal = dc("surfaceContainer"), onTerminal = dc("onSurface");
  const colors = {
    canvas: surface, chrome: container, background: terminal,
    surface: c("surfaceContainerLow"), raised: c("surfaceContainerHigh"), popover: c("surfaceContainerHigh"),
    surface_lowest: c("surfaceContainerLowest"), surface_highest: c("surfaceContainerHighest"),
    hover: blend(onSurface, container, 0.08), pressed: blend(onSurface, container, 0.1),
    selected: c("secondaryContainer"), on_selected: c("onSecondaryContainer"),
    foreground: onSurface, muted: c("onSurfaceVariant"), dim: blend(onSurface, surface, 0.38),
    border: c("outlineVariant"), input: c("outline"),
    accent: c("primaryContainer"), accent_foreground: c("onPrimaryContainer"),
    solid: c("primary"), solid_foreground: c("onPrimary"),
    secondary: c("secondary"), tertiary: c("tertiary"),
    tertiary_container: c("tertiaryContainer"), on_tertiary_container: c("onTertiaryContainer"),
    error: c("error"), on_error: c("onError"), error_container: c("errorContainer"), on_error_container: c("onErrorContainer"),
    inverse_surface: c("inverseSurface"), inverse_on_surface: c("inverseOnSurface"), inverse_primary: c("inversePrimary"),
    terminal_foreground: onTerminal, terminal_muted: dc("onSurfaceVariant"),
    ...STATUS[dark ? "dark" : "light"],
  };
  return { background: terminal, foreground: onTerminal, selection: dc("secondaryContainer"), cursor: dc("primary"), ansi, colors };
}

/** Both theme files as text, keyed by theme name. */
export function themeTexts(prefs = {}) {
  return {
    [NAMES.light]: JSON.stringify(themeFile(prefs, false), null, 2) + "\n",
    [NAMES.dark]: JSON.stringify(themeFile(prefs, true), null, 2) + "\n",
  };
}

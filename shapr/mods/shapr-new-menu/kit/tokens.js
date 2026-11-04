// shapr kit tokens: the Material 3 Expressive type scale, shape scale, motion and heights at
// desktop density, in px at zoom 1. Colors come only from theme() roles (see roles.js).
// The person's choices (density, corner scale, motion) live in shared "shapr.settings"; every
// token below reads them at render time, so a change restyles every mod at once.
import { settings, shared } from "herdr";

export const SETTINGS = "shapr.settings";
// seed: null is the theme generator's default (MD3 baseline).
export const DEFAULTS = { seed: null, contrast: "standard", density: "standard", corners: "standard", motion: "expressive" };

/** The person's theme settings, with defaults for anything unset. */
export function prefs() {
  const s = shared(SETTINGS);
  return { ...DEFAULTS, ...(s && typeof s === "object" ? s : {}) };
}

// Type ---------------------------------------------------------------------
// [size, weight, line height] per MD3 style, in thin weights (D11): display and headline at 300,
// title large, body and labels at 400, title medium and small at 500. Hierarchy comes from size
// and role, not weight. Emphasized takes one step up to the next static cut of Roboto Flex, at
// most 500 (300 → 400, 400 → 500, 500 stays).
export const TYPE = {
  displayLarge: [57, 300, 64], displayMedium: [45, 300, 52], displaySmall: [36, 300, 44],
  headlineLarge: [32, 300, 40], headlineMedium: [28, 300, 36], headlineSmall: [24, 300, 32],
  titleLarge: [22, 400, 28], titleMedium: [16, 500, 24], titleSmall: [14, 500, 20],
  bodyLarge: [16, 400, 24], bodyMedium: [14, 400, 20], bodySmall: [12, 400, 16],
  labelLarge: [14, 400, 20], labelMedium: [12, 400, 16], labelSmall: [11, 400, 16],
};
/** The heaviest weight any text takes. */
export const MAX_WEIGHT = 500;

/** Sets an element's MD3 type style: size, weight and line height. */
export function type(el, style, emphasized = false) {
  const [size, weight, line] = TYPE[style] ?? TYPE.bodyMedium;
  return el.text_size(size).font_weight(emphasized ? Math.min(MAX_WEIGHT, weight + 100) : weight).line_height(`${line}px`);
}

/** The line height of a type style, for openers that count an overlay's height. */
export const lineOf = (style) => (TYPE[style] ?? TYPE.bodyMedium)[2];

/** How many lines `text` wraps to in `style` at `width` px (Roboto Flex averages 0.55 em a glyph). */
export function textLines(text, style, width) {
  const size = (TYPE[style] ?? TYPE.bodyMedium)[0];
  return Math.max(1, Math.ceil((String(text ?? "").length * size * 0.55) / Math.max(1, width)));
}

// Shape --------------------------------------------------------------------
// The MD3 corner scale; "round" is the person's larger scale. full = .rounded_full().
const SHAPES = {
  standard: { none: 0, xs: 4, sm: 8, md: 12, lg: 16, lgPlus: 20, xl: 28, xlPlus: 32 },
  round: { none: 0, xs: 6, sm: 12, md: 16, lg: 20, lgPlus: 24, xl: 32, xlPlus: 36 },
};
const scale = () => SHAPES[prefs().corners] ?? SHAPES.standard;
export const SHAPE = {};
for (const k of Object.keys(SHAPES.standard)) Object.defineProperty(SHAPE, k, { get: () => scale()[k], enumerable: true });

// Corners by use: fields xs, chips and segment insides sm, cards and rows md, menus lg,
// dialogs and sheets xl.
export const RADIUS = {
  get field() { return SHAPE.xs; }, get chip() { return SHAPE.sm; }, get card() { return SHAPE.md; },
  get row() { return SHAPE.md; }, get menu() { return SHAPE.lg; }, get dialog() { return SHAPE.xl; },
};

// Heights ------------------------------------------------------------------
// Desktop density is MD3's -2 (8 px under the touch sizes). compact takes 4 more off,
// comfortable gives 4 back. xs stays 24 (it sits inside a row's second line).
const DENSITY = { compact: -4, standard: 0, comfortable: 4 };
export const densityOffset = () => DENSITY[prefs().density] ?? 0;
const BASE_H = { xs: 24, sm: 32, md: 36, lg: 40, xl: 48 };
const BASE_ROW = { one: 40, two: 56, three: 72, menu: 40 };
export const H = {};
for (const k of Object.keys(BASE_H)) Object.defineProperty(H, k, { get: () => BASE_H[k] + (k === "xs" ? 0 : densityOffset()), enumerable: true });
export const ROW = {};
for (const k of Object.keys(BASE_ROW)) Object.defineProperty(ROW, k, { get: () => BASE_ROW[k] + densityOffset(), enumerable: true });

// Spacing on MD3's 4 px grid.
export const SPACE = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

// Motion -------------------------------------------------------------------
// Expressive springs overshoot a little; calm settles without overshoot; reduced moves nothing.
const SPRINGS = {
  expressive: { fast: { response: 250, damping: 0.75 }, spatial: { response: 380, damping: 0.8 }, slow: { response: 550, damping: 0.85 }, effects: { response: 200, damping: 1 } },
  calm: { fast: { response: 250, damping: 1 }, spatial: { response: 380, damping: 1 }, slow: { response: 550, damping: 1 }, effects: { response: 200, damping: 1 } },
};
export const reducedMotion = () => prefs().motion === "reduced";
export const SPRING = {};
for (const k of ["fast", "spatial", "slow", "effects"])
  Object.defineProperty(SPRING, k, { get: () => (SPRINGS[prefs().motion] ?? SPRINGS.expressive)[k], enumerable: true });
export const DURATION = { short: 150, medium: 300, long: 450 };

/** Springs `prop` on later changes, unless the person reduced motion. */
export function spring(el, prop, kind = "spatial") {
  return reducedMotion() ? el : el.spring(prop, SPRING[kind] ?? SPRING.spatial);
}
/** An enter or exit transition (emphasized: ease-in-out), unless the person reduced motion. */
export function transition(el, prop, duration = "medium", easing = "ease-in-out") {
  return reducedMotion() ? el : el.transition(prop, { duration: DURATION[duration] ?? duration, easing });
}
/** A pulse or slide forever, unless the person reduced motion. */
export function loop(el, prop, policy) {
  return reducedMotion() ? el : el.loop(prop, policy);
}

// Measured sizes -----------------------------------------------------------
// on_size_change reports zoomed points; every size a mod sets is px at zoom 1.
export function layoutPx(n) {
  return n / (Number(settings()?.zoom) || 1);
}

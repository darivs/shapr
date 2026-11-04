// The theme generator: every role from seed and contrast, only #rrggbb, MD3's contrast minimums,
// a higher level raising contrast, and Herdr's status colors kept.
import { test } from "node:test";
import assert from "node:assert/strict";
import { themeFile, themeTexts, NAMES } from "../shapr/mods/shapr-workspace-chrome/theme/scheme.js";

const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const ROLES = ["canvas", "chrome", "background", "surface", "raised", "popover", "hover", "selected", "foreground", "muted", "dim", "border", "input", "accent", "accent_foreground", "solid", "solid_foreground", "working", "blocked", "done", "idle", "error", "on_error"];
const PAIRS = [["foreground", "canvas"], ["foreground", "chrome"], ["foreground", "raised"], ["muted", "canvas"], ["muted", "chrome"], ["solid_foreground", "solid"], ["accent_foreground", "accent"], ["on_selected", "selected"], ["on_error", "error"], ["foreground", "hover"]];

for (const seed of ["#6750A4", "#006A6A", "#B3261E", "#FFD600"])
  for (const contrast of ["standard", "medium", "high"])
    for (const dark of [false, true])
      test(`${seed} ${contrast} ${dark ? "dark" : "light"}: roles, hex and contrast`, () => {
        const t = themeFile({ seed, contrast }, dark);
        for (const r of ROLES) assert.match(t.colors[r] ?? "", /^#[0-9a-f]{6}$/, r);
        for (const c of [t.background, t.foreground, t.selection, t.cursor, ...t.ansi]) assert.match(c, /^#[0-9a-f]{6}$/);
        assert.equal(t.ansi.length, 16);
        const min = contrast === "high" ? 7 : 4.5;
        for (const [fg, bg] of PAIRS) assert.ok(ratio(t.colors[fg], t.colors[bg]) >= (fg === "muted" && contrast === "standard" ? 4.5 : min - (fg === "foreground" && bg === "hover" ? 1 : 0)) - 0.05, `${fg} on ${bg}: ${ratio(t.colors[fg], t.colors[bg]).toFixed(2)}`);
        assert.ok(ratio(t.colors.input, t.colors.canvas) >= 3 - 0.05, "outline under 3:1");
      });

test("a higher contrast level raises contrast", () => {
  for (const dark of [false, true]) {
    const lo = themeFile({ contrast: "standard" }, dark).colors, hi = themeFile({ contrast: "high" }, dark).colors;
    assert.ok(ratio(hi.muted, hi.canvas) > ratio(lo.muted, lo.canvas));
    assert.ok(ratio(hi.input, hi.canvas) > ratio(lo.input, lo.canvas));
  }
});

test("status colors are Herdr's in both appearances, whatever the seed", () => {
  const a = themeFile({ seed: "#00ff00" }, false).colors, b = themeFile({ seed: "#ff00ff" }, false).colors;
  for (const s of ["working", "blocked", "done", "idle"]) assert.equal(a[s], b[s]);
  for (const dark of [false, true]) {
    const c = themeFile({}, dark).colors;
    assert.ok(ratio(c.blocked, c.canvas) >= ratio(c.working, c.canvas) || ratio(c.blocked, c.canvas) >= 3, "blocked not loud");
  }
});

test("the seed changes the scheme; a bad seed falls back to the baseline", () => {
  assert.notEqual(themeFile({ seed: "#006A6A" }).colors.solid, themeFile({}).colors.solid);
  assert.deepEqual(themeFile({ seed: "nope" }), themeFile({}));
  assert.deepEqual(Object.keys(themeTexts({})).sort(), [NAMES.dark, NAMES.light].sort());
});

// CIE L* (≈ HCT tone): MD3's lowest surface step is 2, too close to tell a card from canvas.
const lstar = (h) => { const y = lum(h); return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (24389 / 27) * y; };

test("the pane card (the terminal's ground) stands off canvas for every seed, contrast and appearance", () => {
  for (const seed of ["#6750A4", "#006A6A", "#B3261E", "#FFD600"])
    for (const contrast of ["standard", "medium", "high"])
      for (const dark of [false, true]) {
        const t = themeFile({ seed, contrast }, dark);
        assert.equal(t.background, t.colors.background, "the terminal and its card differ");
        const step = Math.abs(lstar(t.colors.background) - lstar(t.colors.canvas));
        assert.ok(step >= 3, `${seed} ${contrast} ${dark ? "dark" : "light"}: card ${t.colors.background} on canvas ${t.colors.canvas}, ΔL* ${step.toFixed(1)}`);
        assert.ok(ratio(t.foreground, t.background) >= (contrast === "high" ? 7 : 4.5), "terminal text");
      }
});

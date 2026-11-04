// style: md3
// shapr's theme settings: seed color and contrast, density and corners, motion. Every choice goes
// to shared "shapr.settings" at once, so every shapr mod restyles together and the choice survives
// a restart; shapr-workspace-chrome regenerates the theme files from the seed and contrast.
// Opened as a dialog: mod.open {name: "shapr-settings"} (mod.json holds settingsSize() at standard
// density); an opener that knows the density calls openOverlay with settingsSize().
import { View, div } from "gpui-kit";
import { h_flex, v_flex, InputState, Input } from "gpui-base";
import { props, closeOverlay, setShared } from "herdr";
import * as K from "./kit/index.js";

// MD3 preset seeds. The swatches draw each seed itself, as data; nothing else here is a color.
export const PRESETS = [
  ["Baseline", "#6750A4"], ["Blue", "#0061A4"], ["Teal", "#006A6A"], ["Green", "#386A20"],
  ["Yellow", "#FFD600"], ["Orange", "#8B5000"], ["Red", "#B3261E"], ["Pink", "#984061"],
];
const BASELINE = PRESETS[0][1];

export const CHOICES = {
  contrast: [["standard", "Standard"], ["medium", "Medium"], ["high", "High"]],
  density: [["compact", "Compact"], ["standard", "Standard"], ["comfortable", "Comfortable"]],
  corners: [["standard", "Standard"], ["round", "Round"]],
  motion: [["expressive", "Expressive", "Springs with a little bounce"], ["calm", "Calm", "Settles without bounce"], ["reduced", "Reduced", "Nothing moves"]],
};

export const WIDTH = 520;
const HEX_W = 168; // the hex field: six digits, a # and the supporting text
const GAP = K.SPACE.sm; // inside a section
const SECTION_GAP = K.SPACE.lg; // between sections
const TITLE = K.lineOf("titleSmall");

/** "#rrggbb" (upper case) from what was typed, with or without the #; null when it isn't one. */
export function parseSeed(text) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(text ?? "").trim());
  return m ? `#${m[1].toUpperCase()}` : null;
}

const sameSeed = (a, b) => (a ?? BASELINE).toUpperCase() === (b ?? BASELINE).toUpperCase();

// What the scroll area holds, section by section, as drawn below.
const colorHeight = () => TITLE + GAP + K.H.lg + GAP + K.fieldHeight({ label: true, supporting: true }) + GAP + K.ROW.one;
const shapeHeight = () => TITLE + GAP + K.ROW.one + GAP + K.ROW.one;
const motionHeight = () => TITLE + GAP + CHOICES.motion.length * K.ROW.one;

/** The dialog's exact height at the person's density: what the opener (mod.json) sizes it to. */
export function settingsHeight() {
  return K.dialogHeight({ headlineLines: 1, extra: [colorHeight() + shapeHeight() + motionHeight() + 2 * SECTION_GAP] });
}

/** The overlay size at the person's density, for openOverlay({ mod: "shapr-settings", ...settingsSize() }). */
export function settingsSize() {
  return { width: WIDTH, height: settingsHeight() };
}

export default class Settings extends View {
  init() {
    const seed = K.prefs().seed;
    this.text = seed ?? "";
    this.error = false; // the typed text was checked and isn't a color
    this.focused = false;
    this.input = InputState.new({ placeholder: BASELINE, value: this.text });
    this.input.on("change", (_e, cx) => { this.type(this.input.value()); cx.notify(); });
    this.input.on("submit", (_e, cx) => { this.commit(); cx.notify(); });
    this.input.on("focus", (_e, cx) => { this.focused = true; cx.notify(); });
    this.input.on("blur", (_e, cx) => { this.focused = false; this.commit(); cx.notify(); });
  }

  /** Merges a change into shared "shapr.settings": every mod re-renders with it. */
  set(patch) {
    const now = K.prefs();
    if (Object.entries(patch).every(([k, v]) => now[k] === v)) return;
    setShared(K.SETTINGS, { ...now, ...patch });
  }

  /** Typing: a valid seed applies right away; anything else waits for submit or blur. */
  type(text) {
    this.text = text;
    const seed = parseSeed(text);
    if (seed) { this.error = false; if (!sameSeed(seed, K.prefs().seed)) this.set({ seed }); }
    else if (!text.trim()) this.error = false;
  }

  /** Enter or leaving the field: an invalid hex is refused (the seed stays) and says why. */
  commit() {
    const seed = parseSeed(this.text);
    this.error = Boolean(this.text.trim()) && !seed;
    if (seed && !sameSeed(seed, K.prefs().seed)) this.set({ seed });
  }

  pickSeed(seed) {
    this.text = seed;
    this.error = false;
    this.input.set_value(seed);
    this.set({ seed });
  }

  reset() {
    this.text = "";
    this.error = false;
    this.input.set_value("");
    setShared(K.SETTINGS, { ...K.DEFAULTS });
  }

  close() {
    closeOverlay(props()?.overlay);
  }

  section(title, ...rows) {
    return v_flex().w_full().flex_none().gap(GAP)
      .child(K.label(title, { style: "titleSmall", role: "primary" }))
      .children(rows);
  }

  // A setting on one line: its name, and its segmented choice at the end.
  row(key, name) {
    const p = K.prefs();
    return h_flex().w_full().h(K.ROW.one).flex_none().gap(K.SPACE.lg).items_center()
      .child(K.label(name, { style: "bodyLarge", truncate: true, grow: true }))
      .child(K.segmented(`settings-${key}`, CHOICES[key].map(([v, text]) => [v, text]), p[key], (v) => this.set({ [key]: v })));
  }

  swatches() {
    const r = K.roles();
    const seed = K.prefs().seed;
    const size = K.H.lg;
    return h_flex().h(size).flex_none().gap(K.SPACE.sm).items_center()
      .children(PRESETS.map(([name, hex], i) => {
        const on = sameSeed(hex, seed);
        let target = div().id(`settings-seed-${i}`).size(size).flex_none().flex().items_center().justify_center().rounded_full()
          .tooltip(name);
        if (on) target = target.border_2().border_color(r.onSurface);
        target = K.press(target, on ? null : () => this.pickSeed(hex), { layer: r.hover });
        return target.child(div().size(size - K.SPACE.md).rounded_full().bg(hex));
      }));
  }

  // The theme as it stands, on a filled card: a primary button, a switch, the loud blocked mark.
  preview() {
    return v_flex().flex_1().min_w(0).gap(K.SPACE.xs)
      .child(K.label("Preview", { style: "labelMedium", role: "onSurfaceVariant" }))
      .child(K.card(h_flex().h(K.H.lg).w_full().gap(K.SPACE.md).items_center(), { kind: "filled", pad: 0 }).px(K.SPACE.xs)
        .child(K.button("settings-preview-primary", "Primary", { kind: "filled", size: "sm" }))
        .child(K.button("settings-preview-tonal", "Tonal", { kind: "tonal", size: "sm" }))
        .child(K.toggleSwitch("settings-preview-switch", true, null))
        .child(div().flex_1())
        .child(K.statusMark("done"))
        .child(div().pr(K.SPACE.sm).child(K.statusMark("blocked"))));
  }

  hexField() {
    const supporting = this.error ? `Use six hex digits, like ${BASELINE}` : "Or type a color";
    return div().w(HEX_W).flex_none()
      .child(K.textField(Input.new(this.input), { label: "Hex", supporting, focused: this.focused, error: this.error }));
  }

  // What the window draws, at the height it takes (settingsHeight() counts it).
  surface() {
    const p = K.prefs();
    // Radio rows run 16 past the section's edge, so each radio lines up under the title.
    const motion = this.section("Motion", v_flex().flex_none().mx(-K.SPACE.lg).children(CHOICES.motion.map(([v, name, about]) => K.listItem(`settings-motion-${v}`, name, {
      leading: K.radio(`settings-motion-${v}-radio`, p.motion === v, null), trailingText: about,
      onClick: p.motion === v ? null : () => this.set({ motion: v }),
    }))));
    // The scroll area spans the dialog edge to edge (it clips), its content keeps the dialog's inset.
    const body = v_flex().id("settings-body").flex_1().min_h(0).mx(-K.DIALOG.pad).px(K.DIALOG.pad).overflow_y_scroll().gap(SECTION_GAP)
      .child(this.section("Color", this.swatches(),
        h_flex().w_full().flex_none().gap(K.SPACE.lg).items_start().child(this.hexField()).child(this.preview()),
        this.row("contrast", "Contrast")))
      .child(this.section("Size and shape", this.row("density", "Density"), this.row("corners", "Corners")))
      .child(motion);
    // The overlay is most of the window (a window shorter than the dialog at a large zoom would
    // clip it): the surface sits centred at the height it draws, and the body scrolls when the
    // window is shorter than that.
    return K.dialogSurface(v_flex().id("shapr-settings"), { fit: true })
      .child(K.dialogHeadline("Theme"))
      .child(body)
      .child(K.dialogActions({
        note: "Applies to every shapr window",
        onCancel: () => this.reset(), cancelLabel: "Reset",
        primary: { id: "settings-done", label: "Done", onClick: () => this.close() },
      }));
  }

  render() {
    return v_flex().size_full().justify_center().child(this.surface().h(settingsHeight()));
  }
}

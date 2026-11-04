// style: md3
// A text prompt, as an MD3 dialog: props { title, value, hint, command: { name, args } }, the
// same as Herdr's prompt. Enter saves (runs the command with { ...args, name }), Esc cancels.
// Open it with frame: "none", width 400 and
// dialogHeight({ extra: [fieldHeight({ supporting: Boolean(hint) })] }).
import { View } from "gpui-kit";
import { InputState, Input } from "gpui-base";
import { run, props, closeOverlay } from "herdr";
import { dialogSurface, dialogHeadline, dialogActions, textField, roles } from "./kit/index.js";

export default class Prompt extends View {
  init(_props, cx) {
    this.text = props()?.value ?? "";
    this.input = InputState.new({ value: this.text });
    if (this.text) this.input.set_selected_range({ start: 0, end: this.text.length });
    this.input.on("change", (_e, cx) => { this.text = this.input.value(); cx.notify(); });
    this.input.on("submit", () => this.submit());
    this.inputFocused = true;
    this.input.on("focus", (_e, cx) => { this.inputFocused = true; cx.notify(); });
    this.input.on("blur", (_e, cx) => { this.inputFocused = false; cx.notify(); });
    this.input.focus();
    cx.timer.after(600, () => this.input.focus());
    this.handle = cx.focus_handle();
  }

  submit() {
    const p = props();
    closeOverlay(p.overlay);
    run(p.command.name, { ...(p.command.args ?? {}), name: this.text });
  }

  key(e, cx) {
    if (e.key === "escape") { closeOverlay(props().overlay); cx.stop_propagation(); }
  }

  render() {
    const r = roles();
    const p = props() ?? {};
    const title = (p.title ?? "").replace(/^./, (c) => c.toUpperCase());
    return dialogSurface().id("prompt").track_focus(this.handle).on_key_down((e, cx) => this.key(e, cx))
      .child(dialogHeadline(title).min_w(0).truncate())
      .child(textField(Input.new(this.input).w_full().text_color(r.onSurface), { label: "Name", supporting: p.hint || null, focused: this.inputFocused }))
      .child(dialogActions({ onCancel: () => closeOverlay(p.overlay), primary: { id: "pm-save", label: "Save", onClick: () => this.submit() } }));
  }
}

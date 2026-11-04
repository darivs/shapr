// style: md3
// Asks before something destructive, e.g. "Close space?", as an MD3 dialog. Opened with props
// { title, detail, command: { name, args } }, the same as Herdr's confirm. Enter confirms (runs
// the command), Esc cancels. The primary button names the verb ("Close space"), from the command.
// Open it with frame: "none", width 360 and dialogHeight({ headlineLines, bodyLines }) for the
// title and detail at that width.
import { View, div } from "gpui-kit";
import { run, props, closeOverlay } from "herdr";
import { dialogSurface, dialogHeadline, dialogBody, dialogActions } from "./kit/index.js";

const DESTRUCTIVE = /^(close|kill|remove|delete|reset|quit|end)$/;

// "space.close" says "Close space"; a command without a noun says its verb.
export function verb(command) {
  const [noun, act] = String(command?.name ?? "").split(".");
  const words = (act ? `${act} ${noun}` : noun).replace(/[_-]/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : "Continue";
}
export const destructive = (command) => DESTRUCTIVE.test(String(command?.name ?? "").split(".").pop());

export default class Confirm extends View {
  init(_props, cx) {
    this.handle = cx.focus_handle();
    this.handle.focus();
  }

  yes() {
    const p = props();
    closeOverlay(p.overlay);
    run(p.command.name, p.command.args ?? {});
  }

  render() {
    const p = props() ?? {};
    return dialogSurface()
      .id("confirm")
      .track_focus(this.handle)
      .on_key_down((e, cx) => {
        if (e.key === "enter") this.yes();
        else if (e.key === "escape") closeOverlay(props().overlay);
        else return;
        cx.stop_propagation();
      })
      .child(dialogHeadline(p.title ?? "Are you sure?"))
      .when(Boolean(p.detail), (el) => el.child(div().id("confirm-detail").flex_1().min_h(0).overflow_y_scrollbar().child(dialogBody(p.detail))))
      .child(dialogActions({ onCancel: () => closeOverlay(props().overlay), primary: { id: "yes", label: verb(p.command), danger: destructive(p.command), onClick: () => this.yes() } }));
  }
}

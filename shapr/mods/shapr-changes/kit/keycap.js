// A key cap: one key stroke of a shortcut, 24 tall, rounded sm, on surface-container-highest.
import { div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { H, SHAPE, type } from "./tokens.js";
import { window } from "herdr";
import { roles } from "./roles.js";

export function keycap(text) {
  const r = roles();
  return type(div(), "labelMedium").h(H.xs).min_w(H.xs).px(8).flex_none().flex().items_center().justify_center()
    .rounded(SHAPE.sm).bg(r.surfaceHighest).text_color(r.onSurface).whitespace_nowrap().child(text);
}

/** A shortcut as key caps, 4 apart: keys ["⌘", "K"]. */
export function shortcut(keys) {
  return h_flex().flex_none().gap(4).items_center().children(keys.map(keycap));
}

/** A binding as people read it ("cmd-shift-t" → "⌘⇧T" on macOS, "Ctrl+Shift+T" elsewhere). */
export function keyLabel(binding) {
  if (!binding?.trim()) return "";
  const mac = window()?.platform === "macos";
  const names = mac ? { ctrl: "⌃", alt: "⌥", shift: "⇧", cmd: "⌘", fn: "fn" } : { ctrl: "Ctrl", alt: "Alt", shift: "Shift", cmd: "Super", fn: "Fn" };
  const alias = { secondary: mac ? "cmd" : "ctrl", super: "cmd", win: "cmd", option: "alt", control: "ctrl" };
  return binding.trim().split(/\s+/).map((stroke) => {
    const parts = stroke.split("-");
    let key = parts.pop();
    if (key === "") { key = "-"; parts.pop(); }
    const held = new Set(parts.map((m) => alias[m.toLowerCase()] ?? m.toLowerCase()));
    if (/^[A-Z]$/.test(key)) held.add("shift");
    const label = key.length === 1 ? key.toUpperCase() : key[0].toUpperCase() + key.slice(1).toLowerCase();
    return [...Object.keys(names).filter((m) => held.has(m)).map((m) => names[m]), label].join(mac ? "" : "+");
  }).join(" ");
}

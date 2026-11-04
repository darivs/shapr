import { el } from "./element.js";
export const h_flex = () => el("h_flex");
export const v_flex = () => el("v_flex");
const state = (opts = {}) => {
  let v = opts.value ?? "";
  return { value: () => v, set_value: (x) => { v = x; }, on() {}, focus() {}, blur() {}, set_selected_range() {}, set_placeholder() {} };
};
export const InputState = { new: state };
export const Input = { new: (s) => el("Input", s) };
export const TextView = { markdown: (id, text) => el("TextView", text) };
export const Scrollbar = {};

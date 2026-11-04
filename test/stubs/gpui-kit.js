import { el } from "./element.js";
export const div = () => el("div");
export const svg = (p) => el("svg", p);
export const image = (p) => el("image", p);
export const list = (...a) => el("list", a);
export const uniform_list = (...a) => el("uniform_list", a);
export class View { constructor() {} }

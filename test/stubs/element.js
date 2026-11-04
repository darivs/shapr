// A stand-in for a GPUI element: records every builder call, refuses names Herdr's
// gpui-kit.d.ts doesn't have, runs .when() and style callbacks so their calls are checked too.
import { METHODS } from "./api.js";

export const unknownCalls = new Set();
export function el(kind, arg) {
  const node = { kind, arg, calls: [], children: [] };
  const proxy = new Proxy(node, {
    get(target, name) {
      if (name === "__node") return target;
      if (name === "then" || typeof name === "symbol") return undefined;
      return (...args) => {
        if (METHODS && !METHODS.has(name)) unknownCalls.add(name);
        target.calls.push([name, args]);
        if (name === "child") target.children.push(args[0]);
        if (name === "children") target.children.push(...args[0]);
        if (name === "when") return args[0] ? args[1](proxy) : proxy;
        if (["hover", "active", "focus"].includes(name) && typeof args[0] === "function") args[0](el("style"));
        return proxy;
      };
    },
  });
  return proxy;
}

/** Every node of a tree (stubs and strings). */
export function* walk(n) {
  const node = n?.__node;
  if (!node) { yield n; return; }
  yield node;
  for (const c of node.children) yield* walk(c);
}
/** All the text a tree shows. */
export const texts = (n) => [...walk(n)].filter((x) => typeof x === "string" || typeof x === "number").map(String);
/** Every value passed to a method name anywhere in a tree. */
export const argsOf = (n, name) => [...walk(n)].flatMap((x) => (x?.calls ?? []).filter(([m]) => m === name).map(([, a]) => a));

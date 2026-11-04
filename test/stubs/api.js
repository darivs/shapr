// The element methods and herdr functions this Herdr version has, read from the app home's
// type files when they are there (null otherwise: then every name passes).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const home = process.env.HERDR_APP_HOME ?? join(homedir(), ".config", "herdr-app");
const read = (f) => (existsSync(join(home, f)) ? readFileSync(join(home, f), "utf8") : null);
const kit = read("gpui-kit.d.ts"), herdr = read("herdr.d.ts");
export const METHODS = kit ? new Set([...kit.matchAll(/^ {4}([a-z_0-9]+)<Self/gm)].map((m) => m[1])) : null;
export const HERDR = herdr ? new Set([...herdr.matchAll(/^export function ([a-zA-Z]+)/gm)].map((m) => m[1])) : null;
export function moduleExports(name) {
  if (!kit) return null;
  const at = kit.indexOf(`declare module "${name}" {`);
  if (at < 0) return new Set();
  const end = kit.indexOf("\ndeclare module ", at + 1);
  const body = kit.slice(at, end < 0 ? undefined : end);
  return new Set([...body.matchAll(/^ {2}export (?:abstract )?(?:function|class|const) ([A-Za-z_0-9]+)/gm)].map((m) => m[1]));
}

// shapr's icons: every icon path the code names resolves to a file, every icon file shapr ships
// is a Material Symbols Outlined symbol (weight 300) that some code names, and no Lucide file
// or license remains. Out of scope: Herdr's program icons (icons/…) and the Windows caption
// buttons in shapr-tabs (win-*), which follow the platform.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const MODS = join(root, "shapr", "mods");
const KIT_ICONS = join(root, "kit", "icons");

const walk = (dir, skip = () => false) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  if (skip(p)) return [];
  return statSync(p).isDirectory() ? walk(p, skip) : [p];
});
// A mod's kit/ is a copy of kit/ (bin/sync-kit --check holds them equal): read the source once.
const isCopy = (p) => /\/shapr\/mods\/[^/]+\/kit$/.test(p);
const code = () => [...walk(join(root, "kit")), ...walk(MODS, isCopy)].filter((p) => p.endsWith(".js"));

// The argument text of a call whose "(" is at `open`.
function argument(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "(") depth++;
    else if (src[i] === ")" && --depth === 0) return src.slice(open + 1, i);
  }
  return src.slice(open + 1);
}
// The names an expression can take: string literals that are the expression or a branch of a
// conditional ("a", c ? "a" : "b"), not operands such as the "mixed" in `v === "mixed" ? …`.
const choices = (expr) => [...expr.matchAll(/(^|[(?:]|\?\?)\s*(["'])([^"'`$]*)\2\s*(?=$|[):?])/g)].map((m) => m[3]);

/** Every icon path the code names, as [file, path] pairs, and every name it cannot resolve. */
export function references() {
  const out = [], unresolved = [];
  for (const file of code()) {
    const src = readFileSync(file, "utf8"), at = relative(root, file);
    // Helpers that make an icon path from a name: the kit's icon(name) and a mod's own
    // `const glyph = (name) => \`mods/<mod>/${name}.svg\``.
    const helpers = new Map();
    for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']\.\/(?:kit\/index|state|index)\.js["']/g))
      for (const part of m[1].split(",").map((s) => s.trim())) {
        const [name, alias] = part.split(/\s+as\s+/);
        if (name === "icon") helpers.set(alias ?? name, KIT_ICONS);
      }
    for (const m of src.matchAll(/import\s*\*\s*as\s+(\w+)\s+from\s*["']\.\/(?:kit\/)?index\.js["']/g)) helpers.set(`${m[1]}.icon`, KIT_ICONS);
    const defs = /(?:const|let)\s+([\w$]+)\s*=\s*\(\s*(\w+)\s*\)\s*=>\s*`mods\/([\w-]+|\$\{SELF\}\/kit\/icons)\/\$\{\2\}\.svg`/g;
    for (const m of src.matchAll(defs)) helpers.set(m[1], m[3].startsWith("${SELF}") ? KIT_ICONS : join(MODS, m[3]));
    for (const [name, dir] of helpers) {
      const call = new RegExp(`(?<![\\w$.])(?<!function\\s)${name.replace(/[.$]/g, "\\$&")}\\(`, "g");
      for (const m of src.matchAll(call)) {
        const arg = argument(src, m.index + m[0].length - 1), names = choices(arg);
        if (!names.length) unresolved.push(`${at}: ${name}(${arg})`);
        for (const n of names) out.push([at, join(dir, `${n}.svg`)]);
      }
    }
    // Paths written out: "mods/<mod>/<file>.svg", or a template whose ${…} picks from literals.
    for (const m of src.matchAll(/"(mods\/[^"]*?\.svg)"|'(mods\/[^']*?\.svg)'|`(mods\/[^`]*?\.svg)`/g)) {
      const path = m[1] ?? m[2] ?? m[3];
      if (!path.includes("${")) { out.push([at, join(root, "shapr", path)]); continue; }
      if (src.slice(Math.max(0, m.index - 80), m.index).match(/\(\s*\w+\s*\)\s*=>\s*$/)) continue; // a helper, above
      const [, before, expr, after] = path.match(/^(.*?)\$\{(.*)\}(.*)$/);
      const names = choices(expr);
      if (!names.length || before.includes("${") || after.includes("${")) unresolved.push(`${at}: ${path}`);
      for (const n of names) out.push([at, join(root, "shapr", `${before}${n}${after}`)]);
    }
  }
  return { refs: out, unresolved };
}

test("every icon path the code names resolves to a file", () => {
  const { refs, unresolved } = references();
  assert.ok(refs.length > 50, `only ${refs.length} icon references found`);
  assert.deepEqual(unresolved, [], "icon names the test can't resolve: write them as literals");
  const missing = refs.filter(([, p]) => !existsSync(p.replace(/\/shapr\/mods\/([^/]+)\/kit\/icons\//, "/kit/icons/")))
    .map(([at, p]) => `${at}: ${relative(root, p)}`);
  assert.deepEqual(missing, []);
});

// The repo's checks: the privacy check catches personal data; sync-kit --check catches a stale
// kit copy; every mod's clone record names its Herdr origin.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findings } from "../bin/privacy-check";

const root = new URL("..", import.meta.url).pathname;

test("the privacy check fails on a home path, an email address and a hostname", () => {
  const home = ["/", "Users", "/", "jane"].join("");
  const mail = ["jane", "@", "corp", ".io"].join("");
  const host = ["build-box", ".", "local"].join("");
  for (const text of [`cd ${home}/x`, `contact ${mail}`, `ssh ${host}`, `C:${"\\"}Users${"\\"}jane`]) assert.ok(findings(text).length > 0, text);
  assert.deepEqual(findings("noreply 1+a@users.noreply.github.com, /Users/x, ~/.config/herdr-app"), []);
  const dir = mkdtempSync(join(tmpdir(), "privacy-"));
  try {
    writeFileSync(join(dir, "bad.txt"), `see ${mail}\n`);
    const r = spawnSync(join(root, "bin/privacy-check"), [join(dir, "bad.txt")], { encoding: "utf8" });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /email address/);
  } finally { rmSync(dir, { recursive: true }); }
});

test("the repo passes its own privacy check", () => {
  execFileSync(join(root, "bin/privacy-check"), { cwd: root, stdio: "pipe" });
});

test("sync-kit --check fails on a stale copy and passes after a sync", () => {
  const dir = mkdtempSync(join(tmpdir(), "kit-"));
  try {
    for (const d of ["bin", "kit"]) cpSync(join(root, d), join(dir, d), { recursive: true });
    cpSync(join(root, "shapr/mods/shapr-tabs"), join(dir, "shapr/mods/shapr-tabs"), { recursive: true });
    execFileSync(join(dir, "bin/sync-kit"), ["--check"], { stdio: "pipe" });
    writeFileSync(join(dir, "kit/button.js"), readFileSync(join(dir, "kit/button.js"), "utf8") + "\n// changed\n");
    assert.equal(spawnSync(join(dir, "bin/sync-kit"), ["--check"]).status, 1);
    execFileSync(join(dir, "bin/sync-kit"), { stdio: "pipe" });
    execFileSync(join(dir, "bin/sync-kit"), ["--check"], { stdio: "pipe" });
    assert.match(readFileSync(join(dir, "shapr/mods/shapr-tabs/kit/self.js"), "utf8"), /"shapr-tabs"/);
  } finally { rmSync(dir, { recursive: true }); }
});

test("every clone records its Herdr origin, and the layout uses only shapr mods and Herdr's pane", () => {
  const mods = join(root, "shapr/mods");
  for (const m of readdirSync(mods).filter((m) => existsSync(join(mods, m, "mod.json")))) {
    const j = JSON.parse(readFileSync(join(mods, m, "mod.json"), "utf8"));
    if (m === "shapr-gallery" || !j.cloned_from) continue;
    assert.match(j.cloned_from.version, /^\d+\.\d+\.\d+/, m);
    assert.ok(Object.keys(j.cloned_from.files).includes("main.js"), m);
  }
  const L = JSON.parse(readFileSync(join(root, "shapr/layouts/shapr-material.json"), "utf8"));
  const used = [];
  (function w(n) { if (n?.content?.mod) used.push(n.content.mod); if (n?.pane?.header?.content?.mod) used.push(n.pane.header.content.mod); (n?.children ?? []).forEach(w); (n?.floating ?? []).forEach(w); if (n?.content?.pane) w(n.content); })(L);
  for (const m of used) assert.ok(m.startsWith("shapr-") || m === "pane", m);
  assert.deepEqual(L.theme, { light: "shapr-light", dark: "shapr-dark" });
  assert.equal(L.ui_font, "Roboto Flex");
});

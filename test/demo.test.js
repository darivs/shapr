// The shot loop end to end, in the running Herdr window: bin/demo up, bin/shots r1, bin/demo down.
// Afterwards settings.json is byte for byte as before, the same layout and space are shown, and no
// demo space or fake agent remains. It drives the person's own window, so it runs only with
// SHAPR_LIVE=1 (and a window open); otherwise it is skipped.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const home = process.env.HERDR_APP_HOME ?? join(homedir(), ".config", "herdr-app");
const live = process.env.SHAPR_LIVE === "1";
const json = (cmd, ...args) => JSON.parse(execFileSync(cmd, args, { encoding: "utf8" }));
const STATES = ["base", "new-menu", "tab-menu", "space-menu", "terminal-menu", "rename", "theme", "picker", "help", "machine-add", "gallery", "files", "changes"];

test("bin/demo up, bin/shots r1 and bin/demo down leave the window as it was", { skip: !live && "SHAPR_LIVE=1 runs it" }, () => {
  const settings = readFileSync(join(home, "settings.json"));
  const before = json("herdr-app", "status");
  const dir = mkdtempSync(join(tmpdir(), "shots-live-"));
  const run = (cmd, ...args) => {
    const r = spawnSync(join(root, cmd), args, { encoding: "utf8", env: { ...process.env, SHAPR_DEMO: join(dir, "demo") } });
    assert.equal(r.status, 0, `${cmd} ${args.join(" ")}: ${r.stderr}`);
  };
  run("bin/demo", "up");
  try {
    run("bin/shots", join(dir, "r1"));
  } finally {
    run("bin/demo", "down");
  }
  for (const s of STATES) assert.ok(existsSync(join(dir, `r1-${s}.png`)), `r1-${s}.png`);
  assert.ok(readFileSync(join(home, "settings.json")).equals(settings), "settings.json as before");
  const after = json("herdr-app", "status");
  assert.equal(after.layout, before.layout);
  assert.equal(after.space, before.space);
  assert.ok(!json("herdr-app", "ls").spaces.some((s) => s.name === "demo"), "no demo space");
  assert.ok(!json("hc", "ls", "--json").terminals.some((t) => t.name?.startsWith("demo-")), "no fake agent");
});

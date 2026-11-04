// bin/check-all checks the shot loop's scripts' syntax: bin/shots (node) and bin/demo (sh). In a
// copy of the repo's bin/ with one of them broken, check-all names it and fails.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;

function checkAll(broken) {
  const dir = mkdtempSync(join(tmpdir(), "check-all-"));
  cpSync(join(root, "bin"), join(dir, "bin"), { recursive: true });
  if (broken === "shots") writeFileSync(join(dir, "bin/shots"), "#!/usr/bin/env node\nconst = ;\n");
  if (broken === "demo") writeFileSync(join(dir, "bin/demo"), "#!/bin/sh\nif then fi\n");
  execFileSync("git", ["init", "-q"], { cwd: dir });
  execFileSync("git", ["add", "-A"], { cwd: dir });
  // No herdr-app here: the checks that need Herdr skip.
  const r = spawnSync(join(dir, "bin/check-all"), { cwd: dir, encoding: "utf8", env: { ...process.env, PATH: "/usr/bin:/bin:" + process.execPath.replace(/\/node$/, "") } });
  return r.stdout + r.stderr;
}

test("check-all names a broken bin/shots or bin/demo and fails", () => {
  assert.doesNotMatch(checkAll(null), /syntax: bin\/(shots|demo)/);
  assert.match(checkAll("shots"), /syntax: bin\/shots/);
  assert.match(checkAll("demo"), /syntax: bin\/demo/);
});

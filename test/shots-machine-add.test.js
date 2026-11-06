// bin/shots' machine-add state shows the dialog on a demo ssh config, never the person's (#36): it
// writes the config into the app home before it opens the dialog and removes it after. A fake
// herdr-app first in PATH records each call, so no real window is touched.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "shots-ma-"));
const log = join(dir, "calls.log");
writeFileSync(join(dir, "herdr-app"), `#!/bin/sh
printf '%s demo-config=%s\\n' "$*" "$([ -f "$HERDR_APP_HOME/shapr-demo-ssh-config" ] && echo yes || echo no)" >>"${log}"
`);
chmodSync(join(dir, "herdr-app"), 0o755);
process.env.PATH = `${dir}:${process.env.PATH}`;
process.env.HERDR_APP_HOME = dir;
const { STATES, DEMO_SSH_CONFIG } = await import("../bin/shots");
const file = join(dir, "shapr-demo-ssh-config");

test("the machine-add shot opens the dialog on a demo ssh config and removes it after", () => {
  const [open, after] = STATES["machine-add"];
  open();
  const calls = readFileSync(log, "utf8");
  assert.match(calls, /do mod\.open .*shapr-machine-add.* demo-config=yes/, "the demo config is in place when the dialog opens");
  assert.equal(readFileSync(file, "utf8"), DEMO_SSH_CONFIG);
  assert.ok(typeof after === "function", "the state cleans up after its shot");
  after();
  assert.ok(!existsSync(file), "the demo config is gone after the shot");
});

test("the demo ssh config names only documentation hosts and includes nothing", () => {
  assert.ok(!/^\s*include\b/im.test(DEMO_SSH_CONFIG), "an Include would read the person's files");
  const names = [...DEMO_SSH_CONFIG.matchAll(/^\s*HostName\s+(\S+)/gim)].map((m) => m[1]);
  assert.ok(names.length > 0);
  for (const n of names) assert.match(n, /\.example(\.(com|net|org))?$|^192\.0\.2\.\d+$/, n);
});

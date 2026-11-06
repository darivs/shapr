// bin/shot-window runs the shot loop in a Herdr window of its own (its own app home), so the
// person's window never switches spaces, theme or zoom. macOS caps a socket path at 104 bytes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const bin = join(new URL("..", import.meta.url).pathname, "bin", "shot-window");
const run = (args, env = {}) => spawnSync(bin, args, { encoding: "utf8", env: { ...process.env, ...env } });

test("the shot window's home is its own, and its socket path fits macOS", () => {
  const r = run(["home"], { SHAPR_SHOT_HOME: "" });
  assert.equal(r.status, 0, r.stderr);
  const home = r.stdout.trim();
  assert.notEqual(home, join(process.env.HOME, ".config", "herdr-app"), "never the person's app home");
  assert.ok(Buffer.byteLength(join(home, "herdr-app.sock")) < 104, `${home}: the socket path is too long`);
});

test("run points a command at the shot window, and nothing else", () => {
  const r = run(["run", "sh", "-c", "printf %s \"$HERDR_APP_HOME\""], { SHAPR_SHOT_HOME: "/tmp/x-shots" });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, "/tmp/x-shots");
});

test("a too long home is refused before Herdr starts", () => {
  const r = run(["up"], { SHAPR_SHOT_HOME: "/tmp/" + "x".repeat(120) });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /too long/);
});

test("usage on anything else", () => {
  const r = run([]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /usage: bin\/shot-window/);
});

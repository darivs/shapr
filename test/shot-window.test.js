// bin/shot-window runs the shot loop in a Herdr window of its own (its own app home), so the
// person's window never switches spaces, theme or zoom. macOS caps a socket path at 104 bytes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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

// The shot window runs on a herdr-core session of its own: its spaces, agents and toasts never
// reach the person's window (the core session "default"). Fake hc, herdr-app, Herdr, DeskPad,
// swift, open and osascript, so nothing real starts or stops.
const fakes = () => {
  const dir = mkdtempSync(join(tmpdir(), "shot-window-"));
  const fake = join(dir, "bin");
  const log = join(dir, "log");
  mkdirSync(fake);
  mkdirSync(join(dir, "DeskPad.app"));
  mkdirSync(join(dir, "home"));
  const script = (name, body) => {
    writeFileSync(join(fake, name), `#!/bin/sh\n${body}\n`);
    chmodSync(join(fake, name), 0o755);
  };
  script("hc", `echo "hc HC_SESSION=\${HC_SESSION-} $*" >>"${log}"`);
  script("herdr-app", `echo "herdr-app HC_SESSION=\${HC_SESSION-} $*" >>"${log}"\n[ "$1" != status ] || [ -e "$HERDR_APP_HOME/started" ]`);
  script("Herdr", `echo "Herdr HC_SESSION=\${HC_SESSION-}" >>"${log}"\ntouch "$HERDR_APP_HOME/started"`);
  script("swift", "cat >/dev/null; echo 00000000-0000-0000-0000-000000000000");
  script("open", ":");
  script("osascript", ":");
  const env = {
    PATH: `${fake}:${process.env.PATH}`,
    HOME: join(dir, "home"),
    SHAPR_SHOT_HOME: join(dir, "s"),
    HERDR_BINARY: join(fake, "Herdr"),
    DESKPAD_APP: join(dir, "DeskPad.app"),
    // The person's session in the caller's environment must not leak into the shot window.
    HC_SESSION: "default",
  };
  const lines = () => (existsSync(log) ? readFileSync(log, "utf8").trim().split("\n") : []);
  return { dir, env, lines, done: () => rmSync(dir, { recursive: true, force: true }) };
};
const session = (line) => line.match(/HC_SESSION=(\S*)/)[1];

test("up starts the shot window on a core session of its own, never the person's", () => {
  const f = fakes();
  try {
    const r = run(["up"], f.env);
    assert.equal(r.status, 0, r.stderr);
    const herdr = f.lines().filter((l) => l.startsWith("Herdr "));
    assert.equal(herdr.length, 1, f.lines().join("\n"));
    const s = session(herdr[0]);
    assert.ok(s && s !== "default", `the window's core session: "${s}"`);
  } finally {
    f.done();
  }
});

test("down stops the shot core session, and only that one", () => {
  const f = fakes();
  try {
    assert.equal(run(["up"], f.env).status, 0);
    const s = session(f.lines().find((l) => l.startsWith("Herdr ")));
    const r = run(["down"], f.env);
    assert.equal(r.status, 0, r.stderr);
    const stops = f.lines().filter((l) => /^hc .* server stop$/.test(l));
    assert.deepEqual(stops, [`hc HC_SESSION=${s} server stop`]);
  } finally {
    f.done();
  }
});

test("run points a command at the shot core session too", () => {
  const f = fakes();
  try {
    assert.equal(run(["up"], f.env).status, 0);
    const s = session(f.lines().find((l) => l.startsWith("Herdr ")));
    const r = run(["run", "sh", "-c", "printf %s \"$HC_SESSION\""], f.env);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, s);
    assert.notEqual(r.stdout, "default");
  } finally {
    f.done();
  }
});

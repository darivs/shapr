// bin/drift against a fake Herdr app home: silent while the originals match their records,
// reports a newer original's changed, added and removed files, and is silent again after --accept.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const sha = (s) => createHash("sha256").update(s).digest("hex");
const put = (p, s) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, s); };

// A temp repo (bin/drift and its import) with one cloned mod and the layout, and an app home
// whose originals match the records exactly.
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "drift-"));
  const repo = join(dir, "repo"), home = join(dir, "home");
  for (const f of ["drift", "clone-mods"]) cpSync(join(root, "bin", f), join(repo, "bin", f));
  const orig = { "main.js": "// tabs\n", "mod.json": '{"title":"Tabs"}\n', "close.svg": "<svg/>", "icons/a.svg": "<svg id=a/>" };
  for (const [f, s] of Object.entries(orig)) put(join(home, "mods/tabs", f), s);
  put(join(home, "mods/tabs/gpui-kit.d.ts"), "// written by Herdr\n");
  put(join(home, "mods/tabs/jsconfig.json"), "{}\n");
  put(join(home, "layouts/main.json"), '{"id":"root"}\n');
  const files = Object.fromEntries(Object.entries(orig).map(([f, s]) => [f, sha(s)]));
  put(join(repo, "shapr/mods/shapr-tabs/mod.json"), JSON.stringify({ title: "Tabs", cloned_from: { name: "tabs", version: "0.1.12", files } }, null, 2) + "\n");
  put(join(repo, "shapr/mods/shapr-gallery/mod.json"), '{"title":"Gallery"}\n');
  put(join(repo, "shapr/layouts/shapr.json"), JSON.stringify({ id: "root", cloned_from: { name: "main", version: "0.1.12", sha256: sha('{"id":"root"}\n') } }, null, 2) + "\n");
  const run = (args = [], version = "0.1.12") => spawnSync(join(repo, "bin/drift"), args,
    { encoding: "utf8", env: { ...process.env, HERDR_APP_HOME: home, HERDR_VERSION: version } });
  return { dir, repo, appHome: home, run, done: () => rmSync(dir, { recursive: true }) };
}

test("unchanged originals: drift prints nothing and exits 0", () => {
  const f = fixture();
  try {
    const r = f.run();
    assert.equal(r.stdout + r.stderr, "");
    assert.equal(r.status, 0);
  } finally { f.done(); }
});

test("a newer original is reported with both versions and its files; --accept silences it", () => {
  const f = fixture();
  try {
    writeFileSync(join(f.appHome, "mods/tabs/main.js"), "// tabs, newer\n");
    writeFileSync(join(f.appHome, "mods/tabs/open.svg"), "<svg/>");
    unlinkSync(join(f.appHome, "mods/tabs/close.svg"));
    writeFileSync(join(f.appHome, "mods/tabs/gpui-kit.d.ts"), "// rewritten by Herdr\n");
    let r = f.run([], "0.1.13");
    assert.equal(r.status, 1);
    assert.equal(r.stdout, [
      "shapr-tabs: tabs 0.1.12 -> 0.1.13",
      "  changed  main.js",
      "  added    open.svg",
      "  removed  close.svg",
      "",
    ].join("\n"));

    r = f.run(["--accept", "shapr-tabs"], "0.1.13");
    assert.equal(r.status, 0, r.stderr);
    const rec = JSON.parse(readFileSync(join(f.repo, "shapr/mods/shapr-tabs/mod.json"), "utf8"));
    assert.equal(rec.title, "Tabs");
    assert.equal(rec.cloned_from.version, "0.1.13");
    assert.deepEqual(Object.keys(rec.cloned_from.files), ["icons/a.svg", "main.js", "mod.json", "open.svg"]);
    r = f.run([], "0.1.13");
    assert.equal(r.stdout, "");
    assert.equal(r.status, 0);
  } finally { f.done(); }
});

test("a changed layout and a missing original are reported; --accept records the layout", () => {
  const f = fixture();
  try {
    writeFileSync(join(f.appHome, "layouts/main.json"), '{"id":"root","new":1}\n');
    rmSync(join(f.appHome, "mods/tabs"), { recursive: true });
    let r = f.run(["--herdr-version", "0.2.0"]);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /^shapr-tabs: tabs 0\.1\.12 -> missing\n {2}missing {2}mods\/tabs\n/m);
    assert.match(r.stdout, /^layouts\/shapr: main 0\.1\.12 -> 0\.2\.0\n {2}changed  main\.json\n/m);

    assert.equal(f.run(["--accept", "shapr-tabs"]).status, 2);
    assert.equal(f.run(["--accept", "shapr-nope"]).status, 2);
    r = f.run(["--accept", "layouts/shapr", "--herdr-version", "0.2.0"]);
    assert.equal(r.status, 0, r.stderr);
    const L = JSON.parse(readFileSync(join(f.repo, "shapr/layouts/shapr.json"), "utf8"));
    assert.deepEqual(L.cloned_from, { name: "main", version: "0.2.0", sha256: sha('{"id":"root","new":1}\n') });
    r = f.run();
    assert.doesNotMatch(r.stdout, /layouts\/shapr/);
    assert.match(r.stdout, /shapr-tabs/);
  } finally { f.done(); }
});

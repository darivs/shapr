// bin/check-all checks every skill in skills/: valid frontmatter (name, description), every file
// its markdown links to present, and no private name, host or address. In a copy of the repo's
// bin/ with a demo skill, check-all names a broken skill and fails.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir, userInfo } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;

const GOOD = {
  "SKILL.md": "---\nname: demo\ndescription: Demo rules for a Herdr surface. Use when changing a Herdr mod.\n---\n\nRead [the rules](references/rules.md).\n",
  "references/rules.md": "# Rules\n\nName colors by role.\n",
};

function checkAll(files, links = {}) {
  const dir = mkdtempSync(join(tmpdir(), "skill-check-"));
  cpSync(join(root, "bin"), join(dir, "bin"), { recursive: true });
  for (const [path, text] of Object.entries(files)) {
    if (text == null) continue;
    mkdirSync(join(dir, "skills/demo", path, ".."), { recursive: true });
    writeFileSync(join(dir, "skills/demo", path), text);
  }
  for (const [path, target] of Object.entries(links)) symlinkSync(target, join(dir, "skills/demo", path));
  execFileSync("git", ["init", "-q"], { cwd: dir });
  execFileSync("git", ["add", "-A"], { cwd: dir });
  // No herdr-app here: the checks that need Herdr skip.
  const r = spawnSync(join(dir, "bin/check-all"), { cwd: dir, encoding: "utf8", env: { ...process.env, PATH: "/usr/bin:/bin:" + process.execPath.replace(/\/node$/, "") } });
  return r.stdout + r.stderr;
}

test("check-all passes a skill with valid frontmatter and its linked files", () => {
  const out = checkAll(GOOD);
  assert.match(out, /skill-check: OK/);
  assert.doesNotMatch(out, /skill-check: skills\//);
});

test("check-all names a skill whose frontmatter lacks a name or description, or names another folder", () => {
  const body = "\nRead [the rules](references/rules.md).\n";
  assert.match(checkAll({ ...GOOD, "SKILL.md": "# Demo\n" + body }), /skill-check: skills\/demo\/SKILL\.md: frontmatter/);
  assert.match(checkAll({ ...GOOD, "SKILL.md": "---\nname: demo\n---\n" + body }), /skill-check: skills\/demo\/SKILL\.md: frontmatter: description/);
  assert.match(checkAll({ ...GOOD, "SKILL.md": "---\ndescription: Demo rules.\n---\n" + body }), /skill-check: skills\/demo\/SKILL\.md: frontmatter: name/);
  assert.match(checkAll({ ...GOOD, "SKILL.md": "---\nname: other\ndescription: Demo rules.\n---\n" + body }), /skill-check: skills\/demo\/SKILL\.md: frontmatter: name/);
});

test("check-all names a file a skill links to that is missing", () => {
  const out = checkAll({ ...GOOD, "references/rules.md": null });
  assert.match(out, /skill-check: skills\/demo\/SKILL\.md: missing references\/rules\.md/);
  const deep = checkAll({ ...GOOD, "references/rules.md": "See [motion](motion.md#springs) and [Herdr](https://example.com/herdr).\n" });
  assert.match(deep, /skill-check: skills\/demo\/references\/rules\.md: missing motion\.md/);
  assert.doesNotMatch(deep, /missing https/);
});

test("check-all names a skill that holds an IP address, the account's name or a host", () => {
  const rules = (text) => checkAll({ ...GOOD, "references/rules.md": "# Rules\n\n" + text + "\n" });
  assert.match(rules("Shoot the window on 10.0.4.17."), /skill-check: skills\/demo\/references\/rules\.md: IP address: 10\.0\.4\.17/);
  assert.doesNotMatch(rules("Serve it on 127.0.0.1 or 192.0.2.10."), /IP address/);
  const account = userInfo().username;
  assert.match(rules(`Ask ${account} first.`), new RegExp(`skill-check: skills/demo/references/rules\\.md: account name: ${account}`));
  assert.match(rules("Run it on build-box.local."), /skills\/demo\/references\/rules\.md: hostname: build-box\.local/);
});

test("check-all names a description that YAML cannot read unquoted, and passes it quoted", () => {
  const body = "\nRead [the rules](references/rules.md).\n";
  assert.match(checkAll({ ...GOOD, "SKILL.md": "---\nname: demo\ndescription: Use when: changing a mod.\n---\n" + body }),
    /skill-check: skills\/demo\/SKILL\.md: frontmatter: description is not valid YAML/);
  assert.match(checkAll({ ...GOOD, "SKILL.md": "---\nname: demo\ndescription: \"Use when: changing a mod.\"\n---\n" + body }), /skill-check: OK/);
});

test("check-all reads through a link to a folder in a skill, a link to the skill itself included", () => {
  const out = checkAll(GOOD, { "self": ".", "refs": "references" });
  assert.match(out, /skill-check: OK/);
  assert.doesNotMatch(out, /EISDIR|ELOOP|bin\/skill-check:\d+/);
});

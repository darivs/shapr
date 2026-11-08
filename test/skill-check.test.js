// bin/check-all checks every skill in skills/: valid frontmatter (name, description), every file
// its markdown links to present, and no private name, host or address. In a copy of the repo's
// bin/ with a demo skill, check-all names a broken skill and fails.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;

const GOOD = {
  "SKILL.md": "---\nname: demo\ndescription: Demo rules for a Herdr surface. Use when changing a Herdr mod.\n---\n\nRead [the rules](references/rules.md).\n",
  "references/rules.md": "# Rules\n\nName colors by role.\n",
};

function checkAll(files) {
  const dir = mkdtempSync(join(tmpdir(), "skill-check-"));
  cpSync(join(root, "bin"), join(dir, "bin"), { recursive: true });
  for (const [path, text] of Object.entries(files)) {
    if (text == null) continue;
    mkdirSync(join(dir, "skills/demo", path, ".."), { recursive: true });
    writeFileSync(join(dir, "skills/demo", path), text);
  }
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

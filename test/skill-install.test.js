// The README's install commands for shapr-for-agents, run as written in a scratch home from a
// scratch clone: each one puts the skill where its agent loads it (~/.claude/skills/ for Claude
// Code, ~/.agents/skills/ for Codex and other agents), a link follows the clone, a copy stays as
// it was, and the removal command takes it out again without touching the clone.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const SKILL = "shapr-for-agents";

/** The README's install section: its sh blocks, keyed by the comment on each block's first line. */
function commands() {
  const readme = readFileSync(join(root, "README.md"), "utf8");
  const section = readme.split(/^## /m).find((s) => s.startsWith(`Install ${SKILL}`)) ?? "";
  const blocks = {};
  for (const [, body] of section.matchAll(/```sh\n([\s\S]*?)```/g)) {
    const [first, ...rest] = body.split("\n");
    blocks[first.replace(/^#\s*/, "").trim()] = rest.join("\n");
  }
  return blocks;
}

const INSTALLS = {
  "Claude Code, link": ".claude/skills",
  "Claude Code, copy": ".claude/skills",
  "Codex and other agents, link": ".agents/skills",
  "Codex and other agents, copy": ".agents/skills",
};

/** A scratch clone (the repo's skills/ only) and an empty scratch home. */
function scratch() {
  const dir = mkdtempSync(join(tmpdir(), "skill-install-"));
  const clone = join(dir, "shapr");
  cpSync(join(root, "skills"), join(clone, "skills"), { recursive: true });
  const home = join(dir, "home");
  mkdirSync(home);
  return { clone, home };
}

/** Run a README block with sh, as the person would from their clone. */
function run(block, { clone, home }) {
  const r = spawnSync("sh", ["-e", "-c", block], { cwd: clone, encoding: "utf8", env: { PATH: process.env.PATH, HOME: home } });
  assert.equal(r.status, 0, `exit ${r.status}: ${r.stderr}`);
}

/** What an agent loads from `folder` in `home`: the skill's SKILL.md, or null. */
function loaded(home, folder) {
  const path = join(home, folder, SKILL, "SKILL.md");
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

test("each README install command puts shapr-for-agents where its agent loads it, in a fresh home and beside other skills", () => {
  const blocks = commands();
  for (const [label, folder] of Object.entries(INSTALLS)) {
    assert.ok(blocks[label], `README has no "${label}" command`);
    for (const existing of [false, true]) {
      const s = scratch();
      if (existing) mkdirSync(join(s.home, folder, "other-skill"), { recursive: true });
      run(blocks[label], s);
      const text = loaded(s.home, folder);
      assert.ok(text, `${label}${existing ? " (folder exists)" : ""}: no ~/${folder}/${SKILL}/SKILL.md`);
      assert.match(text, new RegExp(`^---\\nname: ${SKILL}\\n`), label);
      assert.ok(existsSync(join(s.home, folder, SKILL, "references/operate.md")), `${label}: the references are missing`);
      if (existing) assert.ok(existsSync(join(s.home, folder, "other-skill")), `${label}: the other skill is gone`);
    }
  }
});

test("a linked install follows the clone and a copied one stays as it was", () => {
  const blocks = commands();
  for (const [label, folder] of Object.entries(INSTALLS)) {
    const s = scratch();
    run(blocks[label], s);
    const before = loaded(s.home, folder);
    const edited = before + "\nA rule added after the install.\n";
    writeFileSync(join(s.clone, "skills", SKILL, "SKILL.md"), edited);
    assert.equal(loaded(s.home, folder), label.endsWith("link") ? edited : before, label);
  }
});

/** Whether anything, a dangling link included, sits at `path`. */
function present(path) {
  try { lstatSync(path); return true; } catch { return false; }
}

test("the README's remove command takes shapr-for-agents out of both folders and leaves the clone and other skills", () => {
  const blocks = commands();
  assert.ok(blocks.Remove, 'README has no "Remove" command');
  for (const [label, folder] of Object.entries(INSTALLS)) {
    const s = scratch();
    mkdirSync(join(s.home, folder, "other-skill"), { recursive: true });
    run(blocks[label], s);
    run(blocks.Remove, s);
    assert.equal(present(join(s.home, folder, SKILL)), false, `${label}: still installed`);
    assert.ok(existsSync(join(s.clone, "skills", SKILL, "SKILL.md")), `${label}: the clone's skill is gone`);
    assert.ok(existsSync(join(s.home, folder, "other-skill")), `${label}: the other skill is gone`);
  }
});

// The install commands for shapr-for-agents in docs/agent-skill.md, run as written in a scratch
// home from a scratch clone: each one puts the skill where its agent loads it (~/.claude/skills/ for Claude
// Code, ~/.agents/skills/ for Codex and other agents), a link follows the clone, a copy stays as
// it was, and the removal command takes it out again without touching the clone. The README shows
// the link installs and the removal; each of its blocks is the same as the one in the docs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const SKILL = "shapr-for-agents";

/** A text's sh blocks, keyed by the comment on each block's first line. */
function blocksOf(text) {
  const blocks = {};
  for (const [, body] of text.matchAll(/```sh\n([\s\S]*?)```/g)) {
    const [first, ...rest] = body.split("\n");
    blocks[first.replace(/^#\s*/, "").trim()] = rest.join("\n");
  }
  return blocks;
}

/** docs/agent-skill.md's install commands. */
const commands = () => blocksOf(readFileSync(join(root, "docs", "agent-skill.md"), "utf8"));

/** The README's "Shapr for agents" section's sh blocks. */
function readmeCommands() {
  const readme = readFileSync(join(root, "README.md"), "utf8");
  return blocksOf(readme.split(/^## /m).find((s) => s.startsWith("Shapr for agents")) ?? "");
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
  return { clone, homeDir: home };
}

/** Run a README block with sh, as the person would from their clone. */
function run(block, { clone, homeDir: home }) {
  const r = spawnSync("sh", ["-e", "-c", block], { cwd: clone, encoding: "utf8", env: { PATH: process.env.PATH, HOME: home } });
  assert.equal(r.status, 0, `exit ${r.status}: ${r.stderr}`);
}

/** What an agent loads from `folder` in `home`: the skill's SKILL.md, or null. */
function loaded(home, folder) {
  const path = join(home, folder, SKILL, "SKILL.md");
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

test("each install command puts shapr-for-agents where its agent loads it, in a fresh home and beside other skills", () => {
  const blocks = commands();
  for (const [label, folder] of Object.entries(INSTALLS)) {
    assert.ok(blocks[label], `docs/agent-skill.md has no "${label}" command`);
    for (const existing of [false, true]) {
      const s = scratch();
      if (existing) mkdirSync(join(s.homeDir, folder, "other-skill"), { recursive: true });
      run(blocks[label], s);
      const text = loaded(s.homeDir, folder);
      assert.ok(text, `${label}${existing ? " (folder exists)" : ""}: no ~/${folder}/${SKILL}/SKILL.md`);
      assert.match(text, new RegExp(`^---\\nname: ${SKILL}\\n`), label);
      for (const [, ref] of text.matchAll(/\]\((references\/[^)#]+)/g)) {
        assert.ok(existsSync(join(s.homeDir, folder, SKILL, ref)), `${label}: ${ref} is missing`);
      }
      if (existing) assert.ok(existsSync(join(s.homeDir, folder, "other-skill")), `${label}: the other skill is gone`);
    }
  }
});

test("a linked install follows the clone and a copied one stays as it was", () => {
  const blocks = commands();
  for (const [label, folder] of Object.entries(INSTALLS)) {
    const s = scratch();
    run(blocks[label], s);
    const before = loaded(s.homeDir, folder);
    const edited = before + "\nA rule added after the install.\n";
    writeFileSync(join(s.clone, "skills", SKILL, "SKILL.md"), edited);
    assert.equal(loaded(s.homeDir, folder), label.endsWith("link") ? edited : before, label);
  }
});

test("running an install command again leaves the install working and the clone as it was", () => {
  const blocks = commands();
  for (const [label, folder] of Object.entries(INSTALLS)) {
    const s = scratch();
    const before = readdirSync(join(s.clone, "skills", SKILL)).sort();
    run(blocks[label], s);
    run(blocks[label], s);
    assert.deepEqual(readdirSync(join(s.clone, "skills", SKILL)).sort(), before, `${label}: the second run wrote into the clone`);
    assert.ok(loaded(s.homeDir, folder), `${label}: no ~/${folder}/${SKILL}/SKILL.md after the second run`);
  }
});

/** Whether anything, a dangling link included, sits at `path`. */
function present(path) {
  try { lstatSync(path); return true; } catch { return false; }
}

test("the remove command takes shapr-for-agents out of both folders and leaves the clone and other skills", () => {
  const blocks = commands();
  assert.ok(blocks.Remove, 'docs/agent-skill.md has no "Remove" command');
  for (const [label, folder] of Object.entries(INSTALLS)) {
    const s = scratch();
    mkdirSync(join(s.homeDir, folder, "other-skill"), { recursive: true });
    run(blocks[label], s);
    run(blocks.Remove, s);
    assert.equal(present(join(s.homeDir, folder, SKILL)), false, `${label}: still installed`);
    assert.ok(existsSync(join(s.clone, "skills", SKILL, "SKILL.md")), `${label}: the clone's skill is gone`);
    assert.ok(existsSync(join(s.homeDir, folder, "other-skill")), `${label}: the other skill is gone`);
  }
});

test("the README shows the link installs and the removal, each as docs/agent-skill.md has it", () => {
  const docs = commands(), readme = readmeCommands();
  for (const label of ["Claude Code, link", "Codex and other agents, link", "Remove"]) {
    assert.ok(readme[label], `README has no "${label}" command`);
    assert.equal(readme[label], docs[label], label);
  }
});

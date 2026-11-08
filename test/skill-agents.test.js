// shapr-for-agents loads by itself: in a scratch project with the skill linked into
// .claude/skills/ (Claude Code) or .agents/skills/ (Codex), a fresh agent asked to change a Herdr
// mod loads it, and follows the mod's style line: none means Operate, `// style: md3` means MD3.
// Live: runs the real agents (network, an account), so only with SHAPR_LIVE_AGENTS=1.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const skill = join(root, "skills/shapr-for-agents");
const live = process.env.SHAPR_LIVE_AGENTS === "1";
const has = (cmd) => spawnSync("sh", ["-c", `command -v ${cmd}`]).status === 0;

const MOD = `import { div, text, theme } from "gpui-kit";

export function render() {
  const t = theme();
  return div().p(8).bg(t.chrome).child(text("Agents").text_color(t.foreground));
}
`;

/** A scratch project holding mods/status/main.js, with the skill linked into `skillsDir`. */
function scratch(skillsDir, styleLine) {
  const dir = mkdtempSync(join(tmpdir(), "shapr-agents-"));
  mkdirSync(join(dir, "mods/status"), { recursive: true });
  writeFileSync(join(dir, "mods/status/main.js"), (styleLine ? styleLine + "\n" : "") + MOD);
  mkdirSync(join(dir, skillsDir), { recursive: true });
  symlinkSync(skill, join(dir, skillsDir, "shapr-for-agents"));
  execFileSync("git", ["init", "-q"], { cwd: dir });
  return dir;
}

const ASK = "The Herdr mod in mods/status/main.js draws a header. Make its title stand out more. "
  + "Plan the change only, edit nothing. End your answer with one line `style: <name>` naming the design style you apply.";

/** Claude Code in `dir`: its stream-json events and final answer. */
function claude(dir) {
  const r = spawnSync("claude", ["-p", ASK, "--output-format", "stream-json", "--verbose", "--max-turns", "8",
    "--allowedTools", "Skill", "Read", "Glob", "Grep"], { cwd: dir, encoding: "utf8", timeout: 300_000 });
  const events = r.stdout.split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return {}; } });
  const answer = events.filter((e) => e.type === "result").map((e) => e.result ?? "").join("\n");
  return { events, answer, raw: r.stdout + r.stderr };
}

const claudeLoaded = (events) => events.some((e) => e.type === "assistant"
  && (e.message?.content ?? []).some((c) => c.type === "tool_use" && c.name === "Skill" && /shapr-for-agents/.test(JSON.stringify(c.input))));

/** Codex in `dir`: its JSON events, read-only. */
function codex(dir) {
  const r = spawnSync("codex", ["exec", "--json", "--sandbox", "read-only", "--skip-git-repo-check", ASK],
    { cwd: dir, encoding: "utf8", timeout: 300_000, stdio: ["ignore", "pipe", "pipe"] });
  return { raw: r.stdout + r.stderr };
}

const styleOf = (answer) => (answer.match(/style:\s*`?\*{0,2}([A-Za-z0-9]+)/gi) ?? []).map((s) => s.replace(/^style:\s*`?\*{0,2}/i, "").toLowerCase()).pop();

test("Claude Code loads shapr-for-agents from a project's .claude/skills and applies Operate to a mod with no style line", { skip: !live || !has("claude") }, () => {
  const { events, answer, raw } = claude(scratch(".claude/skills"));
  assert.ok(claudeLoaded(events), "Claude Code did not load shapr-for-agents:\n" + raw.slice(-2000));
  assert.equal(styleOf(answer), "operate", answer);
});

test("Claude Code applies MD3 to a mod whose first line is // style: md3", { skip: !live || !has("claude") }, () => {
  const { events, answer, raw } = claude(scratch(".claude/skills", "// style: md3"));
  assert.ok(claudeLoaded(events), "Claude Code did not load shapr-for-agents:\n" + raw.slice(-2000));
  assert.equal(styleOf(answer), "md3", answer);
});

test("Codex loads shapr-for-agents from a project's .agents/skills", { skip: !live || !has("codex") }, () => {
  const { raw } = codex(scratch(".agents/skills"));
  assert.match(raw, /shapr-for-agents\/SKILL\.md/, "Codex did not read shapr-for-agents:\n" + raw.slice(-2000));
});

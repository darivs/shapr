// bin/demo up against a fake herdr-app and hc that record each call, so no real window is touched.
// It shows Shapr only after every fake agent is up and pinned, by way of another layout: shapr-toasts
// takes what is already so at its first look as no news, so no shot shows a snackbar, while the
// sidebar still marks the blocked agent "Needs you".
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;

function fakes(dir) {
  const log = join(dir, "calls.log");
  const bin = join(dir, "bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "herdr-app"), `#!/bin/sh
printf '%s\\n' "$*" >>"${log}"
case "$1 $2" in
  "status "*) echo '{"layout":"main","space":"sp0"}' ;;
  "do space.new") n=$(grep -c 'space.new' "${log}"); echo "{\\"space\\":\\"sp$n\\",\\"tab\\":\\"tb$n\\",\\"terminal\\":\\"sh$n\\"}" ;;
  "do tab.new") echo '{"tab":"tbx","terminal":"shx"}' ;;
  "ls "*) node -e 'const a=require("fs").readFileSync(process.argv[1],"utf8").split("\\n").filter(Boolean);console.log(JSON.stringify({spaces:[{id:"sp1",tabs:[{terminals:a.map(t=>({terminal:t,pane:"p"+t}))}]}]}))' "$SHAPR_DEMO/agents" ;;
  *) echo '{}' ;;
esac
`);
  writeFileSync(join(bin, "hc"), `#!/bin/sh
printf 'hc %s\\n' "$*" >>"${log}"
n=$(grep -c '^hc run' "${log}")
echo "{\\"address\\":\\"ag$n\\"}"
`);
  chmodSync(join(bin, "herdr-app"), 0o755);
  chmodSync(join(bin, "hc"), 0o755);
  return { log, bin };
}

test("bin/demo up shows Shapr only after its agents are up and pinned, by way of another layout", () => {
  const dir = mkdtempSync(join(tmpdir(), "demo-up-"));
  const home = join(dir, "home");
  mkdirSync(home);
  writeFileSync(join(home, "settings.json"), "{}\n");
  const { log, bin } = fakes(dir);
  const r = spawnSync(join(root, "bin/demo"), ["up"], { encoding: "utf8", env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, HERDR_APP_HOME: home, SHAPR_DEMO: join(dir, "demo") } });
  assert.equal(r.status, 0, r.stderr);
  const calls = readFileSync(log, "utf8").trim().split("\n");
  const lastPin = calls.findLastIndex((c) => c.startsWith("do terminal.pin"));
  const toShapr = calls.findLastIndex((c) => c === 'do layout.switch {"name":"shapr"}');
  assert.ok(lastPin > 0, "the agents are pinned");
  assert.ok(toShapr > lastPin, "Shapr is shown after the last pin");
  assert.ok(calls.slice(lastPin, toShapr).some((c) => c.startsWith("do layout.switch") && !c.includes('"shapr"')), "another layout is shown in between, so shapr-toasts looks afresh");
});

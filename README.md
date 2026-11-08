# Shapr

Shapr restyles the Herdr app. Its first layout is **Shapr**: Herdr's default window in
Material 3 Expressive, as a gallery layout. `shapr/` holds `layouts/shapr.json` and its
`mods/shapr-…/`, cloned from Herdr's shipped layout and mods and restyled with one kit of
components. The design rules agents load live in the separate `shapr-for-agents` skill; a later
`shapr-operate` layout can sit beside Shapr on the same kit.

| Path | What |
|---|---|
| `shapr/` | the gallery folder: what people add to their Herdr app |
| `skills/` | `shapr-for-agents`, the design rules agents load (install below) |
| `kit/` | the components' source (`kit/UI.md`); `bin/sync-kit` copies it into each mod |
| `bin/dev-mirror` | mirrors `shapr/` into your Herdr app home |
| `bin/clone-mods` | clones a shipped Herdr mod as `shapr-<name>` and records its origin |
| `bin/drift` | Drift: lists clones whose Herdr original changed since its record (exit 1); `--accept <clone>` after porting |
| `bin/check-all` | every check: `herdr-app check` per mod, kit copies, tests, syntax, skills, privacy |
| `bin/skill-check` | checks each skill's frontmatter, linked files and private data |
| `bin/privacy-check` | fails on home paths, email addresses and local hostnames |
| `test/` | `node --import ./test/loader.js --test test/` |

Licenses: MIT (`LICENSE`); Roboto Flex under the OFL, material-color-utilities and the Material
Symbols icons under Apache-2.0 (`LICENSES/`).

## Install shapr-for-agents

`skills/shapr-for-agents/` holds the design rules an agent follows when it changes any Herdr
surface. Install it as you install any skill: Claude Code loads skills from `~/.claude/skills/`,
Codex and other agents that read the shared folder from `~/.agents/skills/`. Run the commands from
your clone of this repo. A link follows the clone, so `git pull` brings the next agent the new
rules; a copy stays as it is until you copy again.

```sh
# Claude Code, link
mkdir -p ~/.claude/skills
ln -s "$PWD/skills/shapr-for-agents" ~/.claude/skills/shapr-for-agents
```

```sh
# Claude Code, copy
mkdir -p ~/.claude/skills
cp -R skills/shapr-for-agents ~/.claude/skills/
```

```sh
# Codex and other agents, link
mkdir -p ~/.agents/skills
ln -s "$PWD/skills/shapr-for-agents" ~/.agents/skills/shapr-for-agents
```

```sh
# Codex and other agents, copy
mkdir -p ~/.agents/skills
cp -R skills/shapr-for-agents ~/.agents/skills/
```

To remove it, delete the link or the copy; the skill writes nothing anywhere else, and a removed
link leaves your clone as it was:

```sh
# Remove
rm -rf ~/.claude/skills/shapr-for-agents ~/.agents/skills/shapr-for-agents
```

## Keys

`shapr-workspace-chrome` takes commands a `keys.json` can bind (`"alt-t": "shapr-workspace-chrome.theme"`):
`new-menu`, `tab-menu`, `space-menu`, `terminal-menu` (the focused terminal's), `rename-tab`, `rename-space`, `theme`, and the theme settings
`set-density-<compact|standard|comfortable>`, `set-corners-<standard|round>`,
`set-motion-<expressive|calm|reduced>`, `set-contrast-<standard|medium|high>`, `seed-<rrggbb>`, `reset-theme`.

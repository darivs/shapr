<div align="center">

<img src="docs/logo-256.png" width="96" height="96" alt="Shapr logo">

<h1>Shapr</h1>

<p>Herdr's window in Material 3 Expressive.</p>

<p>
  <a href="#install">Install</a> ·
  <a href="#shapr-for-agents">Agent skill</a> ·
  <a href="#keys">Keys</a> ·
  <a href="#development">Development</a>
</p>

<a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>

</div>

![Shapr in three seed colours beside the headline "Your terminal, in your colour.": a large dark purple window with demo spaces, worktrees and six agents in the sidebar, an agent session in the centre and the Files panel on the right; the same window in light teal behind it; and the Shapr Theme dialog in pink](shapr/preview.png)

## Install

Tell your Herdr agent:

> add herdr.dev/layouts/darivs/shapr

This works once the herdr.dev gallery lists Shapr. Until then, or to install by hand, use a clone
of this repo (needs `git` and Node; built for herdr-app 0.1.13):

```sh
git clone https://github.com/darivs/shapr.git
cd shapr
bin/dev-mirror                                  # copies shapr/ into ~/.config/herdr-app
herdr-app do layout.switch '{"name":"shapr"}'
```

`bin/dev-mirror` copies `shapr/layouts/shapr.json` and each `shapr/mods/shapr-*/` folder into
the app home (`HERDR_APP_HOME` picks another one), writes `themes/shapr-*.json` when they are
missing, and leaves everything else there as it was. To
copy by hand instead, put the same layout file in `layouts/` and the mod folders in `mods/`, then
`herdr-app check` each mod. `ctrl-shift-l` switches back to your own layout; deleting those files
removes Shapr. Before you add it: Shapr runs `git`, `hc` and `sh`, reads `~/.ssh/config` and the
focused folder's files, and reaches the network only through `hc machine add` (see
[`shapr/RECIPE.md`](shapr/RECIPE.md)).

## Features

- **One seed colour** restyles every part at once, built into an MD3 scheme by
  material-color-utilities, with three contrast levels.
- **Light or dark**, following Herdr's appearance: a tinted frame around white cards in light, MD3
  surfaces in dark.
- **Spaces over agents** in a navigation-drawer sidebar, each agent with its status (working,
  needs you, done, idle) everywhere it shows.
- **Shapr's own surfaces** for every menu, dialog, picker and snackbar Herdr opens, sized to what
  they draw and with no foreign frame.
- **Density, corners and motion** in the Shapr Theme window: compact to comfortable, standard or
  round, expressive springs to reduced motion.

## Shapr for agents

`skills/shapr-for-agents/` holds the design rules an agent follows when it changes any Herdr
surface: the MD3 rules, each mod's style line and the screenshot loop to run before calling a
change done. Link it from your clone, so `git pull` brings the next agent the new rules:

```sh
# Claude Code, link
mkdir -p ~/.claude/skills
ln -sfn "$PWD/skills/shapr-for-agents" ~/.claude/skills/shapr-for-agents
```

```sh
# Codex and other agents, link
mkdir -p ~/.agents/skills
ln -sfn "$PWD/skills/shapr-for-agents" ~/.agents/skills/shapr-for-agents
```

To remove it, delete the link; the skill writes nothing anywhere else:

```sh
# Remove
rm -rf ~/.claude/skills/shapr-for-agents ~/.agents/skills/shapr-for-agents
```

Copies instead of links: [docs/agent-skill.md](docs/agent-skill.md).

## Keys

`shapr-workspace-chrome` takes commands a `keys.json` can bind (`"alt-t": "shapr-workspace-chrome.theme"`):
`new-menu`, `tab-menu`, `space-menu`, `terminal-menu` (the focused terminal's), `rename-tab`, `rename-space`, `theme`, and the theme settings
`set-density-<compact|standard|comfortable>`, `set-corners-<standard|round>`,
`set-motion-<expressive|calm|reduced>`, `set-contrast-<standard|medium|high>`, `seed-<rrggbb>`, `reset-theme`.
Shapr ships no `keys.json`.

## How it works

- `shapr/` is the gallery folder: `layouts/shapr.json`, its 18 `mods/shapr-…/`, `RECIPE.md` and `preview.png`.
- Most mods are clones of Herdr's shipped mods (`bin/clone-mods`); each `mod.json` records its original in `cloned_from`.
- `bin/drift` lists clones whose Herdr original changed since; port the change, then `--accept` it.
- `kit/` holds the components (`kit/UI.md`); a mod imports only from its own folder, so `bin/sync-kit` copies the kit into each one.
- `shapr-workspace-chrome` builds the light and dark themes from the seed and writes them at run time.
- A later `shapr-operate` layout can sit beside Shapr on the same kit.

## Development

```sh
bin/check-all                                   # every check: herdr-app check, kit copies, tests, syntax, skills, privacy
node --import ./test/loader.js --test test/     # the tests alone
```

The scripts, the shot loop and the preview: [docs/development.md](docs/development.md).

## Credits and licenses

Sources: Shapr's MD3 and the rules in `skills/shapr-for-agents/` adapt ideas, not text, from
[Material Design 3](https://m3.material.io) (Google), the
[material-3 skill](https://github.com/hamen/material-3-skill) (MIT) and
[Impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0).

Licenses: MIT (`LICENSE`); Roboto Flex under the OFL, material-color-utilities and the Material
Symbols icons under Apache-2.0 (`LICENSES/`). Every third-party file and its license:
[LICENSES/README.md](LICENSES/README.md).

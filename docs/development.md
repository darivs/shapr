# Developing Shapr

Run `bin/check-all` before every commit; it runs every check below and exits nonzero on the first
failure. The tests alone: `node --import ./test/loader.js --test test/`.

| Path | What |
|---|---|
| `shapr/` | the gallery folder: what people add to their Herdr app |
| `skills/` | `shapr-for-agents`, the design rules agents load ([install](agent-skill.md)) |
| `kit/` | the components' source (`kit/UI.md`); `bin/sync-kit` copies it into each mod |
| `bin/dev-mirror` | mirrors `shapr/` into your Herdr app home |
| `bin/clone-mods` | clones a shipped Herdr mod as `shapr-<name>` and records its origin |
| `bin/drift` | Drift: lists clones whose Herdr original changed since its record (exit 1); `--accept <clone>` after porting |
| `bin/check-all` | every check: `herdr-app check` per mod, kit copies, tests, syntax, skills, privacy |
| `bin/skill-check` | checks each skill's frontmatter, linked files and private data |
| `bin/privacy-check` | fails on home paths, email addresses and local hostnames; `--history` checks every commit too |
| `bin/shot-window` | a Herdr window of its own, on DeskPad's hidden display and its own herdr-core session, for the shot loop |
| `bin/demo` | the demo space with fake agents that shots are taken in |
| `bin/shots` | the shot loop: one `herdr-app shot` per state; `--crop sidebar\|work` and `--mask` make a shot safe to commit |
| `bin/preview` | renders `docs/preview/template.html` to `shapr/preview.png` in headless Chromium |
| `test/` | `node --import ./test/loader.js --test test/` |

## Shots

Take shots only in the shot window, never in your own:

```sh
bin/shot-window up
SHAPR_DEMO=/tmp/shapr-demo bin/shot-window run bin/demo up
SHAPR_DEMO=/tmp/shapr-demo bin/shot-window run bin/shots /tmp/out/dark base --dark --seed 6750a4
bin/shot-window run bin/shots --mask /tmp/out/dark-base.png
SHAPR_DEMO=/tmp/shapr-demo bin/shot-window run bin/demo down
bin/shot-window down
```

`SHAPR_DEMO=/tmp/shapr-demo` keeps the pane headers on a neutral folder. Look at every shot before
you commit it: only the demo space and its fake agents may show.

## The preview

`shapr/preview.png` is the gallery's picture and the README's hero. `docs/preview/manifest.json`
holds its copy, its seed and the masked shots in `docs/preview/shots/` (each with the state, mode
and seed it was taken in); `template.html` lays them out at 1600 × 1000. `bin/preview` fills the
template and screenshots it at 2x, or at 1x when 2x is over 2 MB. It uses Brave by default; set
`SHAPR_BROWSER` to any Chromium, such as `chrome-headless-shell`.

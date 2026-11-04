# Shapr

Shapr restyles the Herdr app. Its first layout is **Shapr Material**: Herdr's default window in
Material 3 Expressive, as a gallery layout. `shapr/` holds `layouts/shapr-material.json` and its
`mods/shapr-…/`, cloned from Herdr's shipped layout and mods and restyled with one kit of
components. The design rules agents load live in the separate `shapr-design` mod; a later
`shapr-operate` layout can sit beside Shapr Material on the same kit.

| Path | What |
|---|---|
| `shapr/` | the gallery folder: what people add to their Herdr app |
| `kit/` | the components' source (`kit/UI.md`); `bin/sync-kit` copies it into each mod |
| `bin/dev-mirror` | mirrors `shapr/` into your Herdr app home |
| `bin/clone-mods` | clones a shipped Herdr mod as `shapr-<name>` and records its origin |
| `bin/drift` | Drift: lists clones whose Herdr original changed since its record (exit 1); `--accept <clone>` after porting |
| `bin/check-all` | every check: `herdr-app check` per mod, kit copies, tests, syntax, privacy |
| `bin/privacy-check` | fails on home paths, email addresses and local hostnames |
| `test/` | `node --import ./test/loader.js --test test/` |

Licenses: MIT (`LICENSE`); Roboto Flex under the OFL, material-color-utilities under Apache-2.0,
Lucide icons under ISC (`LICENSES/`).

## Keys

`shapr-workspace-chrome` takes commands a `keys.json` can bind (`"alt-t": "shapr-workspace-chrome.theme"`):
`new-menu`, `tab-menu`, `space-menu`, `terminal-menu` (the focused terminal's), `rename-tab`, `rename-space`, `theme`, and the theme settings
`set-density-<compact|standard|comfortable>`, `set-corners-<standard|round>`,
`set-motion-<expressive|calm|reduced>`, `set-contrast-<standard|medium|high>`, `seed-<rrggbb>`, `reset-theme`.

# shapr

Herdr's default window in Material 3 Expressive, as a gallery layout: `shapr/` holds
`layouts/shapr.json` and its `mods/shapr-…/`, cloned from Herdr's shipped layout and mods and
restyled with one kit of components.

| Path | What |
|---|---|
| `shapr/` | the gallery folder: what people add to their Herdr app |
| `kit/` | the components' source (`kit/UI.md`); `bin/sync-kit` copies it into each mod |
| `bin/dev-mirror` | mirrors `shapr/` into your Herdr app home |
| `bin/clone-mods` | clones a shipped Herdr mod as `shapr-<name>` and records its origin |
| `bin/check-all` | every check: `herdr-app check` per mod, kit copies, tests, syntax, privacy |
| `bin/privacy-check` | fails on home paths, email addresses and local hostnames |
| `test/` | `node --import ./test/loader.js --test test/` |

Licenses: MIT (`LICENSE`); Roboto Flex under the OFL, material-color-utilities under Apache-2.0,
Lucide icons under ISC (`LICENSES/`).

# MD3

The default style, for a mod with no style line or whose first line is `// style: md3`: Material 3 Expressive at desktop density. When a `material-3` skill is installed, it supplies the spec (tokens, component anatomy, states); its code (Compose, Flutter, web) has no Herdr counterpart, so build each component from gpui-kit elements. Agent status stays above MD3: the status colors keep their meaning, and `blocked` stays the loudest thing on screen.

## Color

The layout's theme is one palette for every mod in it. An MD3 mod expresses MD3 through the roles it picks:

| MD3 role | `theme()` name |
|---|---|
| surface | `canvas` |
| surface-container-low | `surface` |
| surface-container (navigation areas) | `chrome` |
| surface-container-high, -highest | `raised`, `popover` |
| on-surface, on-surface-variant | `foreground`, `muted` |
| disabled content | `dim` |
| outline, outline-variant | `input`, `border` |
| primary on on-primary | `solid` on `solid_foreground` |
| primary-container on on-primary-container | `accent` on `accent_foreground` |
| secondary-container (selected, active indicator) | `selected` |
| hover state layer | `hover` |
| inverse-surface (snackbar) | `notify({...})`, which draws its own |

`tertiary` and `error` have no Herdr role; an MD3 mod that needs one asks the person. A full scheme from a seed color is a layout decision: generate it with `material-color-utilities`, write light and dark as two `themes/<name>.json`, and set it on a cloned layout's root `theme` only with the person's yes.

## Type

The MD3 scale in px at zoom 1 (size / line height, weight):

| Style | Large | Medium | Small |
|---|---|---|---|
| Display | 57/64, 400 | 45/52, 400 | 36/44, 400 |
| Headline | 32/40, 400 | 28/36, 400 | 24/32, 400 |
| Title | 22/28, 400 | 16/24, 500 | 14/20, 500 |
| Body | 16/24, 400 | 14/20, 400 | 12/16, 400 |
| Label | 14/20, 500 | 12/16, 500 | 11/16, 500 |

Emphasized type takes one weight step up. Roboto Flex is MD3's family; it needs its `.ttf` in `mods/<name>/fonts/` and the layout's `ui_font` naming it.

## Shape

Corner scale in px: none 0, extra-small 4, small 8, medium 12, large 16, large-increased 20, extra-large 28, full = half the height. By use: fields extra-small, chips small, cards and rows medium, menus large, dialogs extra-large; buttons full. Shape morphing has no Herdr counterpart.

## Size and density

Control heights 24, 32, 36, 40, 48; list rows 40 (one line), 56 (two), 72 (three); menu rows 40. A compact density takes 4 px off each (not off 24), a comfortable one adds 4. Spacing on the 4 px grid: 2, 4, 8, 12, 16, 24, 32.

## Elevation

Tonal: lift by moving up the container roles. A layout node `shadow` (`sm`, `md`, `lg`) only for floating blocks.

## Components

Buttons filled, tonal, outlined, elevated or text; one filled per surface. Icon buttons standard, filled, tonal or outlined. Navigation shows the active item with a `selected` indicator pill and a filled icon. Hover is a state layer (`hover`) in the element's shape; selected takes `selected`.

## Motion

- Place and size: `.spring(prop, { response, damping })` with damping below 1 for the Expressive overshoot (a little: 0.8–0.9).
- Effects (opacity): `.spring("opacity", { damping: 1 })`, no overshoot.
- Enter and exit: `.transition(prop, { duration, easing })` at 150 (short), 300 (medium), 450 (long) ms; emphasized and standard map to `ease-in-out`, decelerate to `ease-out`, accelerate to `ease-in`.
- Tune `response` on the shots: Herdr has no MD3 spring tokens.

## Judge a shot

Apply MD3's checks to the shots: roles used as the table says, the type scale and no off-scale size, corners by use, one filled button, state layers present, contrast at least 4.5:1 for text.

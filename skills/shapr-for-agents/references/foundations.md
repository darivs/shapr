# Foundations

The rules every style follows. The style's own file sets the values (type sizes, radii, motion); these rules decide where they go.

## Hierarchy

- One thing leads each surface: the content the person came for (the terminal, the list, the diff). Chrome recedes around it.
- Rank by tone, weight and position before size; size is the last lever, and color is reserved (below).
- One primary action per panel or dialog, drawn as the only filled control. A destructive confirm names its verb ("Close space"), never "Confirm" or "OK".
- Group by space first, a hairline second, a container third. Every container you add costs attention.
- Labels in sentence case. Size controls to their words; a short label is never cut. A long title in a narrow header shrinks (`min_w(0)`, `truncate`); its controls stay `flex_none`.
- Pointer and hover only where a click does something. Hover changes tone in the element's own shape; nothing moves or resizes on hover.
- Every action has a key path (a command `keys.json` can bind, a focus handle), and a hit target of at least 24 px at zoom 1.

## Color roles

Name colors by role, from `theme()`, so light, dark and every palette work. Hex belongs only in a theme file (`themes/<name>.json`), never in a mod.

| Role | `theme()` name |
|---|---|
| Ground behind cards | `canvas` |
| Sidebars, bars, title bar | `chrome` |
| Cards, terminal ground | `background` |
| Panels | `surface` |
| Menus, popups, dialogs | `popover` |
| Lifted, hovered, selected | `raised`, `hover`, `selected` |
| Text tiers: primary, secondary, disabled | `foreground`, `muted`, `dim` |
| Hairlines, input outlines | `border`, `input` |
| Brand accent | `accent` on `accent_foreground` |
| Primary action | `solid` on `solid_foreground` |
| Agent status | `working`, `blocked`, `done`, `idle`, `unknown` |

- Pair every fill with its own text role (`solid` on `solid_foreground`, `accent` on `accent_foreground`); text on a surface takes a text tier.
- Lift by tone: a block that sits above another takes the next role up (`canvas` → `surface` → `raised` → `popover`), not a shadow.
- A role your Herdr version lacks (check `herdr.d.ts`) is a question for the person, since a new color in `colors` changes the whole layout.

## Agent status

Herdr's agents report one of `working`, `blocked`, `done`, `idle` (and `unknown`). Status outranks every style rule:

- The status colors mean status only; never use them for decoration, brand or errors.
- Urgency orders the treatment: blocked > done > working > idle. `blocked` needs the person, so it is the loudest thing on screen: its color, a filled mark, a count where agents are summed.
- Status never rides on color alone: pair it with a shape or a word, so it reads in both modes and for color-blind eyes.
- `working` may move (a spinner, a pulse); nothing else on screen competes with it in motion.

## Type

- One UI family, set by the layout's `ui_font`; a mod ships its own font only as a `.ttf`/`.otf` in `mods/<name>/fonts/`. Monospace for terminal text, paths and code only.
- Sizes in px at zoom 1; `zoom` scales everything, so never compensate for it.
- A surface uses at most three sizes and two weights. Rank by weight and tone first.
- Numbers that change in place (counts, timers) take tabular figures where the font has them.

## Shape

- Corners by `.rounded(n)` in a mod, `radius` on a layout node. A full pill is half the element's height.
- A child inside a rounded parent takes a radius equal to the parent's minus the gap between them. `overflow_hidden` does not round a child that has its own background: round the child (`rounded_l`, `rounded_r`).
- Sizes and gaps on a 4 px grid (2 for hairline offsets).

## Motion

- Motion explains a change of state or place; decoration never moves.
- Animate only `opacity`, `width`, `height`, `left`, `top`: `.spring(prop, { response, damping })` for place and size, `.transition(prop, { duration, easing })` for enter and exit.
- When the person asks for reduced motion, every animation becomes an instant change, and a pulse becomes a static mark.

## Overlays

- An overlay that draws its own surface opens with `frame: "none"`; the opener sizes it to exactly what is drawn.
- Controls inside a `window_drag` block stop the press, so a click never drags the window.

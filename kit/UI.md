# shapr kit

The components every shapr mod draws with, in Material 3 Expressive at desktop density. One
module per component, no app logic, colors only from `theme()` roles.

`kit/` is the source. `bin/sync-kit` copies it into every `shapr/mods/shapr-*/kit/` (a mod
imports only from its own folder) and writes each copy's `self.js`; `bin/sync-kit --check`
fails on a stale copy. Edit `kit/`, never a copy. Import from `./kit/index.js` or one module.

## Tokens (`tokens.js`)

| Token | Value |
|---|---|
| `type(el, style, emphasized?)` | MD3 type scale (`TYPE`): size, weight, line height. Thin weights: display and headline 300, title large, body and labels 400, title medium and small 500. Emphasized takes one step up, at most 500 (300 → 400, 400 → 500). `lineOf(style)` is its line height |
| `SHAPE` | `none 0, xs 4, sm 8, md 12, lg 16, lgPlus 20, xl 28, xlPlus 32`; the "round" corner setting raises each step. Pills: `.rounded_full()` |
| `RADIUS` | by use: `field` xs, `chip` sm, `card` / `row` md, `menu` lg, `dialog` xl |
| `H` | control heights `xs 24, sm 32, md 36, lg 40, xl 48` |
| `ROW` | list rows `one 40, two 56, three 72`, `menu 40` |
| density | compact −4, standard 0, comfortable +4 on `H` (not xs) and `ROW` |
| `SPRING` | `fast`, `spatial`, `slow` (overshoot a little), `effects` (none); "calm" motion: no overshoot |
| `DURATION` | `short 150, medium 300, long 450` ms |
| `spring(el, prop, kind)`, `transition(el, prop, dur)`, `loop(el, prop, policy)` | motion that does nothing under reduced motion. Never call `.spring` / `.transition` / `.loop` directly |
| `SPACE` | the 4 px grid: `xxs 2, xs 4, sm 8, md 12, lg 16, xl 24, xxl 32` |
| `textLines(text, style, width)` | how many lines a text wraps to, for openers that count a dialog |
| `layoutPx(n)` | a size from `on_size_change` (zoomed points) in the px every builder takes |
| `prefs()` | the person's settings (shared `"shapr.settings"`): `seed`, `contrast`, `density`, `corners`, `motion` |

## Colors (`roles.js`)

`roles()` gives every MD3 role by name, from `theme()`:

| MD3 role | `theme()` name |
|---|---|
| surface | `canvas` |
| surface-container-lowest | `surface_lowest` (shapr), else `background` |
| surface-container-low | `surface` |
| surface-container | `chrome` |
| surface-container-high | `raised`, `popover` |
| surface-container-highest | `surface_highest` (shapr), else `popover` |
| on-surface / on-surface-variant / disabled | `foreground` / `muted` / `dim` |
| outline / outline-variant | `input` / `border` |
| primary on on-primary | `solid` on `solid_foreground` |
| primary-container | `accent` on `accent_foreground` |
| secondary-container | `selected` on `on_selected` (shapr) |
| hover state layer | `hover` (opaque) |
| error, tertiary, inverse surface | shapr's own names (`error`, `on_error`, `tertiary`, `inverse_surface`, ...), with Herdr fallbacks |
| agent status | `working`, `blocked`, `done`, `idle`: Herdr's own colors, blocked the loudest |
| terminal ground, card (`terminal`) | `background`: in shapr's themes surface-container, the fill of every pane card and of `panelCard` |

Never write hex in a mod. shapr's themes come from `shapr-workspace-chrome/theme/scheme.js`.

## Components

| Module | Part |
|---|---|
| `button.js` | `button(id, label, { kind: filled · tonal · outlined · elevated · text, size, shape: round · square, icon, trailing, leading, end, maxLabel, selected, danger, disabled, tip, onClick, interactive })` |
| `icon-button.js` | `iconButton(id, path, { kind: standard · filled · tonal · outlined, size, width: narrow · default · wide, selected (null: no toggle), danger, disabled, tip, onClick })` |
| `label.js` | `label(text, { style, role, emphasized, truncate, grow })`, `heading(text, { trailing })` |
| `chip.js` | `chip(id, text, { kind: assist · filter · input · suggestion, selected, icon, iconColor, count, onRemove, trailing, size: sm · xs, elevated, disabled, onClick })` |
| `switch.js` | `toggleSwitch(id, on, onToggle(next), { disabled, checkIcon })`, 44 × 26 |
| `checkbox.js` | `checkbox(id, true · false · "mixed", onToggle(next), { disabled, error })` |
| `radio.js` | `radio(id, on, onPick, { disabled, error })` |
| `segmented.js` | `segmented(id, [[value, label, { disabled, tip, icon }]], value, onPick(value), { size: sm · lg, fill, disabled })` |
| `text-field.js` | `textField(input, { kind: outlined · filled, label, supporting, leading, trailing, focused, error, multiline, disabled })`, `fieldBox(el, opts)`, `fieldHeight(...)` |
| `menu.js` | `menuSurface(el)`, `menuItem(id, text, { icon, leading, hint, trailing, selected, danger, disabled, onClick })`, `menuDivider()`, `menuHeader(text)`, `menuHeight({ items, dividers, headers })` |
| `list-item.js` | `listItem(id, headline, { overline, supporting, lines, leading, trailing, trailingText, selected, disabled, interactive, propagate, onClick, dense (H.sm rows for trees and long lists), indent })` |
| `nav-item.js` | `navItem(id, text, { icon, activeIcon (filled, when active), leading, active, supporting (a second line), badge, trailing, tip, rail, propagate, onClick })` |
| `card.js` | `card(el, { kind: elevated · filled · outlined, pad, id, disabled, onClick })` |
| `dialog.js` | `dialogSurface(el, { fit })` (fit: as tall as its content), `dialogHeadline(text, { icon })`, `dialogBody(text)`, `dialogActions({ onCancel, cancelLabel, primary, note, error })`, `dialogHeight({ headlineLines, icon, bodyLines, extra, actions })` |
| `badge.js` | `badge({ count, max, role, on })`, `statusMark(status)`, `statusBadge(status, count)` |
| `progress.js` | `linearProgress(width, value?)`, `circularProgress(size)` |
| `divider.js` | `divider({ vertical, inset, insetEnd, space })` |
| `snackbar.js` | `snackbar(id, { title, body, action, onClose, tone, loud, icon, width, onClick })` |
| `keycap.js` | `keycap(text)`, `shortcut([keys])` |
| `search-bar.js` | `searchBar(input, { trailing, size })`: the MD3 search bar, a 48 pill |
| `panel.js` | `panelCard(el)`, `panelHeader(title, { leading, detail, actions })`, `panelWell(el)`: side panels (Files, Changes) |
| `state.js` | `icon(name)` (a kit icon's path), `chromeIcon(name)` (a Material Symbol shapr-workspace-chrome holds; the chrome mods ship together in shapr), `press(el, onClick, opts)`, `stopPress(el)`, `disable(el, on)` |

The gallery (`mod.open {"name":"shapr-gallery"}`) shows each in every state.

## Rules

- Pointer and hover only where a click does something. Hover is a state layer in the element's own shape; nothing moves or resizes on hover.
- Controls inside a `window_drag` block stop the press (`press` does it).
- One filled button per panel or dialog. A destructive confirm's primary is the verb ("Close space"), never "Confirm".
- Sentence case labels; size controls to their words, never cut a short label.
- Overlays draw their own surface (`frame: "none"`), and the opener sizes them with `menuHeight` / `dialogHeight`, so the overlay matches exactly what is drawn.
- `overflow_hidden` doesn't round children with their own background: round the child (`rounded_l`, `rounded_r`).
- A title in a narrow header shrinks (`min_w(0)`, `truncate`); its controls stay `flex_none`.

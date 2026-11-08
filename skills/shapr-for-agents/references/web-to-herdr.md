# Web to Herdr

Herdr counterparts for techniques known from the web. Confirm each name in the app home's `.d.ts` before use.

| Web technique | Herdr counterpart |
|---|---|
| Flexbox | `h_flex()`, `v_flex()`, `.gap()`, `.items_center()`, `.justify_between()`, `.flex_1()` |
| Grid | Use it if `gpui-kit.d.ts` has it; else nested flex rows |
| `rem`, `em` | px designed at zoom 1; `zoom` scales everything |
| Media and container queries | `.id("root").on_size_change(...)` on the root, then branch in `render`; floating blocks read `placement().vertical` |
| `:hover` | `.id(...)` plus `.hover((s) => ...)` |
| `:focus`, focus rings | `cx.focus_handle()`, `.track_focus()`; a layout node's `focus` border for panes |
| Transitions | `.transition(prop, { duration, easing })`; easing `linear`, `ease-in`, `ease-out` or `ease-in-out` |
| Spring motion | `.spring(prop, { response, damping })` |
| Keyframes, spinners, pulses | `.frames([...], ms)`, `svg(...).spin(ms)`, `.loop(prop, {...})` |
| `box-shadow` | Layout node `shadow`: `sm`, `md`, `lg` |
| Background, gradient, image | Layout node `background` (color, `gradient`, `image`) |
| `border-radius` | Layout node `radius`; `.rounded(n)` in a mod |
| Web fonts | `.ttf`/`.otf` in `mods/<name>/fonts/`; `font` styles terminals, `ui_font` styles mods |
| Icons | `svg(path)` takes the text color; `image(path)` keeps its colors |
| Modal | `openOverlay({ kind: "dialog" })` |
| Popover, context menu | `openOverlay({ kind: "popup" })`; layout root `terminal_menu` |
| Floating panel, drawer | Layout `floating` block with `edge`, `align`, `peek`; Herdr draws its frame |
| Own frame for an overlay | `frame: "none"` |
| Toast | `notify({...})` |
| Rich text, code | `TextView.markdown(...)`; `EditorState` + `Editor` |
| Terminal look | Only `font`, `font_size`, `terminal_padding`, `terminal_opacity`, theme `ansi` colors; text drawing itself is fixed |
| Responsive | Block `min`/`max`, `hidden`, zoom levels, split panes |
| Accessibility | Judge contrast and target size on the shots; check every action has a key path (`keys.json`, focus handles). DOM and ARIA checks have no counterpart |

# Operate

The default style, for a mod with no style line or `// style: operate`. An Operate surface is a tool the person works through for hours: **precision, restraint, scanability**. It earns attention only when something needs the person.

## Rules

- **Density.** Rows 28–32 px, controls 24–28 px, gaps of 4 and 8. More fits on screen, and the eye scans a straight column.
- **Flat.** Tone separates regions (`chrome` against `background`); hairlines (`border`) only where tone cannot. No shadows on docked blocks; a layout node `shadow: "sm"` only for a floating one.
- **Color.** Neutral roles carry the surface. `accent` marks the one current thing (the selected row, the focused pane); `solid` is the one primary action. The status colors keep their meaning and are the loudest color on screen.
- **Type.** Body 13 px at 400, labels and metadata 12 px in `muted`, titles 13–14 px at 500. Weights 400 and 500 only. Align text to a shared left edge; right-align numbers.
- **Shape.** Small radii: 4 for controls and rows, 6–8 for cards and menus, 10 for dialogs. Pills only for counts and tags.
- **Icons.** One set, outlined, 14–16 px, in the text tier of their label. An icon without a label carries a tooltip.
- **Motion.** Short and calm: `.transition` 100–150 ms `ease-out` for enter, `ease-in` for exit; springs with `damping: 1` (no overshoot). A list redraws in place, with no stagger.
- **Copy.** Terse labels the person can act on: a verb for an action, a noun for a place. Empty states say what fills them and how.

## Judge a shot

- Can the eye find the current item and any blocked agent within a second?
- Does anything besides status, the current item and the primary action draw color?
- Does every block align to the grid and its neighbours' edges?

---
name: shapr-for-agents
description: Design rules for any Herdr surface (herdr-app layouts, mods and themes in gpui-kit JavaScript) - hierarchy, color roles, type, shape, motion, agent status, the screenshot loop, and the MD3 style. Use when creating, changing, restyling or critiquing a Herdr mod, layout or theme.
---

# shapr-for-agents

Design rules for a Herdr surface: a layout, a mod, a theme. They name `theme()` roles and principles, never one theme's values, so they hold on any palette.

## Style

Every mod has one **style**, recorded on the first line of its `main.js`. There is one style for now, **MD3** (Material 3 Expressive), and it is the default; its rules are in [`references/md3.md`](references/md3.md).

| First line | Style |
|---|---|
| none | MD3 (the default) |
| `// style: md3` | MD3 |

Read the line before anything else: no line and `// style: md3` both mean MD3. Give a new mod `// style: md3` as its first line. Another style may come later, with a line and rules of its own. Say which style you apply when you plan or report a change.

## Steps

1. **Context.** Read the style line and the style's rules. Read the app home's `AGENTS.md`, `herdr.d.ts` and `gpui-kit.d.ts` (in `~/.config/herdr-app/`, rewritten on every start): they name every element, builder method, `herdr` function and theme role this Herdr version has, and win over anything here. Done when every element, method and role you plan to use is found in a `.d.ts`.
2. **Layer.** Put each change on its layer: palette, fonts and zoom in `settings.json` or the layout root (`theme`, `colors`, `font`, `ui_font`); structure in `layouts/<name>.json`; drawing and behaviour in `mods/<name>/`. Clone a shipped layout or mod (`layout.clone`, `mod.clone`) before changing it. Done when every edited file is the person's own copy.
3. **Build.** Draw by [`references/foundations.md`](references/foundations.md) (hierarchy, color roles, agent status, type, shape, motion) and the style's rules. For a technique you know from the web, look up its Herdr counterpart in [`references/web-to-herdr.md`](references/web-to-herdr.md).
4. **Shoot.** Run the [screenshot loop](references/shot-loop.md) until one round of shots shows no finding. Done when light and dark, at zoom 1 and 1.5, show every state the change touches.

## A kit (optional)

A component kit, such as the Shapr kit, can carry these rules as code: tokens, roles, components. When the mod already imports one, draw with it and keep to its rules. These rules hold without one.

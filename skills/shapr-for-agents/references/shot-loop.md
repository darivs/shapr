# The screenshot loop

Code that passes its check can still look wrong; only a shot shows it. Judge the shot, never the code.

## Loop

1. `herdr-app check <mod folder>` until it passes.
2. Set up a state from the matrix below.
3. `herdr-app shot <file.png>`, then view the PNG.
4. Judge it by the foundations and the style's "Judge a shot" questions, and note every finding.
5. Fix the whole batch of findings, then shoot again.

Shoot **light first, then dark** (`app.theme`, or `appearance` in `settings.json`), each at **zoom 1 and zoom 1.5** (`zoom` in `settings.json`). Done when one round shows no finding in either mode at either zoom.

## State matrix

Shoot every state the change touches:

- **Agent status**: working, blocked, done, idle. Start small fake agents that report each status (the format is in `hc --skill`).
- **Size**: the changed block at its `min` and `max` (`layout.resize`).
- **Content**: empty, one item, overflowing; long names.
- **Interaction**: rest, hover, pressed, focused, disabled, selected.

## Care

- Shoot in a Herdr window and session of your own when you can, never in the window the person is working in, and restore the person's theme, zoom and layout sizes after the loop.
- Fill the states with made-up data. Delete any shot that shows private data (hosts, account names, addresses, space names) and keep it out of every commit.
- For alternatives, build each variant as its own cloned layout or mod, `layout.switch` to each, shoot each, and present the shots side by side.

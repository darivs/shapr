# shapr

## Shots and live checks

- Run shot loops and live checks only through `bin/shot-window`, in the background: its window sits on DeskPad's hidden display and runs on a herdr-core session of its own (`HC_SESSION=shapr-shots`).
  - The loop: `bin/shot-window up`, `bin/shot-window run bin/demo up`, `bin/shot-window run bin/shots …`, `bin/shot-window run bin/demo down`, `bin/shot-window down`.
- Never drive or switch the person's own Herdr window, and never touch their core (the session `default`).
- Delete a shot that shows private data (hosts, users, IPs, space names); never commit it.

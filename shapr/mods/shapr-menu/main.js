// style: md3
// Context menus (Herdr's items), as an MD3 menu. Opened as a popup with
// props { tab: "pane" | "tab" | "space" | "global", target }.
// ↑/↓ move, Enter runs, Esc closes. An item is [label, command, args];
// a command "worktree" opens the worktree dialog instead, and a rename or a space close
// (which Herdr would ask about in its own dialog) opens shapr-prompt or shapr-confirm with the
// props Herdr's take. Openers size it with menuHeight({ items, dividers }) of what items() gives:
// dividers go before a close, before Keybinds and before the first theme.

import { View } from "gpui-kit";
import { v_flex } from "gpui-base";
import { run, props, closeOverlay, openOverlay, keys, terminals, spaces, panes, exec } from "herdr";
import { menuSurface, menuItem, menuDivider, dialogHeight, fieldHeight, roles, icon, textLines, H, ROW, keyLabel } from "./kit/index.js";

// Where a space is now: its first terminal's live folder, else where it was made.
function place(s) {
  const tabs = new Set((s.tabs ?? []).map((c) => c.id));
  return panes().find((p) => tabs.has(p.tab) && p.cwd)?.cwd || s.folder;
}

// A space's checkout: "main" (a repo's own), "linked" (a worktree), or null.
async function checkout(folder, on) {
  const top = await exec("git", ["rev-parse", "--show-toplevel"], { cwd: folder, on });
  const common = await exec("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: folder, on });
  if (top.code !== 0 || common.code !== 0) return null;
  return common.stdout.trim() === `${top.stdout.trim()}/.git` ? "main" : "linked";
}

function items(p, git) {
  p = p ?? {};
  const tg = p.target ?? {};
  switch (p.tab) {
    case "pane": {
      // A kept sub-agent can go back under its parent, still running.
      const all = terminals();
      const term = all.find((t) => t.address === tg.terminal);
      const parent = term?.parent && all.find((t) => t.address === term.parent);
      // Once they go to the program, Shift+right-click still opens this menu.
      const toProgram = term?.labels?.["herdr.right-click"] === "program";
      return [
        ["Split right", "pane.split", { direction: "right", pane: tg.pane }],
        ["Split down", "pane.split", { direction: "down", pane: tg.pane }],
        ["Zoom", "pane.zoom", { pane: tg.pane }],
        ...(term
          ? [
              toProgram
                ? ["Use Herdr right-click menu", "terminal.right_click", { terminal: term.address, to: "menu" }]
                : ["Send right-clicks to pane", "terminal.right_click", { terminal: term.address, to: "program" }],
            ]
          : []),
        ...(parent ? [[`Send back to ${parent.name || parent.address}`, "terminal.park", { terminal: term.address }]] : []),
        ["Close pane", "pane.close", { pane: tg.pane }],
      ];
    }
    case "tab":
      return [
        ["Rename", "tab.rename", { id: tg.id }],
        ["New tab", "tab.new", { space: tg.space }],
        ["Close", "tab.close", { id: tg.id }],
      ];
    case "space":
      return [
        ["Rename", "space.rename", { id: tg.id }],
        ...(git ? [["New worktree", "worktree", { space: tg.id, action: "new" }], ["Open worktree", "worktree", { space: tg.id, action: "open" }]] : []),
        ...(git === "linked" ? [["Remove worktree", "worktree", { space: tg.id, action: "remove" }]] : []),
        ["Close", "space.close", { id: tg.id }],
      ];
    default:
      return [
        ["New space", "space.new", {}],
        ["Keybinds", "app.help", {}],
        ["Theme: graphite", "app.theme", { name: "graphite" }],
        ["Theme: ink", "app.theme", { name: "ink" }],
        ["Theme: moss", "app.theme", { name: "moss" }],
        ["Theme: atom one dark", "app.theme", { name: "atom-one-dark" }],
      ];
  }
}

// A divider goes before a close, before Keybinds and before the first theme.
const dividerBefore = (list, i) => i > 0 && (list[i][1].endsWith(".close") || list[i][1] === "app.help" || (list[i][1] === "app.theme" && list[i - 1][1] !== "app.theme"));

/** The menu's exact height for these props (and git state, for a space). */
export function menuSize(p, git) {
  const list = items(p, git);
  return { items: list.length, dividers: list.filter((_, i) => dividerBefore(list, i)).length };
}

function menuIcon(command) {
  if (command.endsWith(".close")) return icon("x");
  if (command.endsWith(".new")) return icon("plus");
  const name = command.endsWith(".rename") ? "square-pen" : command === "worktree" ? "git-branch" : command === "app.help" ? "terminal" : command === "app.theme" ? "settings" : command === "pane.split" ? "panel-right" : command === "pane.zoom" ? "square" : "terminal";
  return `mods/shapr-workspace-chrome/${name}.svg`;
}

// The key bound to a command, for the hint on the right.
function shortcut(name, args) {
  // `pane.split:right` binds pane.split with { direction: "right" }.
  const value = args && Object.values(args)[0];
  const k = keys().find((b) => b.section === "global" && (b.action === name || b.action === `${name}:${value}`));
  return k ? keyLabel(k.keys) : "";
}

// The dialogs this menu opens, sized to what they draw (see each mod's header).
const PROMPT_W = 400, CONFIRM_W = 360, WORKTREE_W = 460, WORKTREE_OPEN_W = 560, INNER = 48;
export function promptSpec(p) {
  return { mod: "shapr-prompt", kind: "dialog", frame: "none", width: PROMPT_W, height: dialogHeight({ extra: [fieldHeight({ supporting: Boolean(p.hint) })] }), props: p };
}
export function confirmSpec(p) {
  const w = CONFIRM_W - INNER;
  return { mod: "shapr-confirm", kind: "dialog", frame: "none", width: CONFIRM_W, height: dialogHeight({ headlineLines: textLines(p.title, "headlineSmall", w), bodyLines: p.detail ? textLines(p.detail, "bodyMedium", w) : 0 }), props: p };
}
export function worktreeSpec(p) {
  const w = WORKTREE_W - INNER;
  if (p.action === "open") return { mod: "shapr-worktree", kind: "dialog", frame: "none", width: WORKTREE_OPEN_W, height: dialogHeight({ extra: [H.lg, 5 * ROW.two] }), props: p };
  if (p.action === "remove") {
    const name = spaces().find((s) => s.id === p.space)?.name ?? "";
    return { mod: "shapr-worktree", kind: "dialog", frame: "none", width: WORKTREE_W, height: dialogHeight({ headlineLines: textLines(`Remove worktree ${name}?`, "headlineSmall", w), bodyLines: 3 }), props: p };
  }
  return { mod: "shapr-worktree", kind: "dialog", frame: "none", width: WORKTREE_W, height: dialogHeight({ bodyLines: 3, extra: [fieldHeight()] }), props: p };
}

export default class Menu extends View {
  init(_props, cx) {
    this.at = 0;
    this.git = null;
    this.handle = cx.focus_handle();
    this.handle.focus();
    const p = props();
    const space = p?.tab === "space" && spaces().find((s) => s.id === p.target?.id);
    const folder = space && place(space);
    if (folder)
      cx.spawn(async (cx) => {
        this.git = await checkout(folder, space.machine).catch(() => null);
        cx.notify();
      });
  }

  choose(i) {
    const it = items(props(), this.git)[i];
    if (!it) return;
    closeOverlay(props()?.overlay);
    const [, command, args] = it;
    if (command === "worktree") return openOverlay(worktreeSpec(args));
    // Herdr asks for a rename's name and before closing a space: ask in shapr's own dialogs,
    // with the props Herdr's prompt and confirm take, then run the same command.
    if (command === "tab.rename" || command === "space.rename") {
      const tab = command === "tab.rename";
      const thing = tab ? spaces().flatMap((s) => s.tabs ?? []).find((t) => t.id === args.id) : spaces().find((s) => s.id === args.id);
      return openOverlay(promptSpec({
        title: tab ? "rename tab" : "rename space",
        value: thing?.named ? thing.name : "",
        hint: tab ? "empty: its number" : "empty: named after its folder",
        command: { name: command, args },
      }));
    }
    if (command === "space.close") {
      const s = spaces().find((x) => x.id === args.id);
      const n = s?.tabs?.length ?? 0;
      return openOverlay(confirmSpec({
        title: "Close space?",
        detail: `${s?.name ? `${s.name}: ` : ""}${n === 1 ? "its tab" : `its ${n} tabs`} and their terminals end.`,
        command: { name: "space.close", args: { ...args, confirmed: true } },
      }));
    }
    if (command === "app.help") return openOverlay({ mod: "shapr-help", kind: "dialog", frame: "none", width: 560, height: 0.8 });
    run(command, args);
  }

  render() {
    const r = roles();
    const list = items(props(), this.git);
    return menuSurface(v_flex())
      .id("menu")
      .track_focus(this.handle)
      .w_full()
      .max_h_full()
      .overflow_y_scrollbar()
      .on_key_down((e, cx) => {
        if (e.key === "down") this.at = (this.at + 1) % list.length;
        else if (e.key === "up") this.at = (this.at + list.length - 1) % list.length;
        else if (e.key === "enter") this.choose(this.at);
        else if (e.key === "escape") closeOverlay(props().overlay);
        else return;
        cx.notify();
      })
      .children(list.flatMap((it, i) => [
        dividerBefore(list, i) ? menuDivider() : null,
        menuItem(`mi-${i}`, it[0], { icon: menuIcon(it[1]), hint: shortcut(it[1], it[2]) || null, danger: it[1].endsWith(".close"), onClick: () => this.choose(i) })
          .when(i === this.at, (el) => el.bg(r.hover)),
      ]).filter(Boolean));
  }
}

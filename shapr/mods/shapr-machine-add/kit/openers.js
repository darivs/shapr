// Where shapr's overlays open and how big, in one place: every opener sizes an overlay to exactly
// what that overlay draws (its menu items, dialog lines and fields), at the person's density.
// Each overlay mod's own header says what it draws; these follow it.
import { spaces, shared } from "herdr";
import { menuHeight } from "./menu.js";
import { dialogHeight } from "./dialog.js";
import { fieldHeight } from "./text-field.js";

export const OVERLAY_W = { newMenu: 280, menu: 240, prompt: 400, settings: 520 };
// Agent rows the + menu shows before it scrolls (shapr-new-menu's AGENT_ROWS).
export const NEW_MENU_AGENTS = 8;

// Installed agents, then two that aren't (shapr-new-menu lists them so).
const choicesOf = (agents) => [...agents.filter((a) => a.installed), ...agents.filter((a) => !a.installed).slice(0, 2)];

/** The + menu: Terminal, the agent rows, a divider, New space, New worktree, Open worktree. */
export function newMenuSpec() {
  const where = spaces().find((s) => s.active)?.machine ?? "";
  const n = choicesOf(shared("new-menu.agents")?.[where] ?? []).length;
  const rows = Math.max(1, Math.min(NEW_MENU_AGENTS, n));
  return { mod: "shapr-new-menu", kind: "popup", frame: "none", width: OVERLAY_W.newMenu, height: menuHeight({ items: 4 + rows, dividers: 1, headers: 1 }) };
}

/** A tab's menu: Rename, New tab, a divider, Close. */
export function tabMenuSpec(tab, space) {
  return { mod: "shapr-menu", kind: "popup", frame: "none", width: OVERLAY_W.menu, height: menuHeight({ items: 3, dividers: 1 }), props: { tab: "tab", target: { id: tab, space } } };
}

/**
 * A space's menu: Rename, (New and Open worktree in a repo, Remove in a worktree), a divider, Close.
 * git: null (not a repo), { linked }, or undefined when the opener doesn't know: then the most it
 * can draw (the menu's own surface fits its items; the rest of the overlay stays clear).
 */
export function spaceMenuSpec(space, git) {
  const items = git === undefined ? 5 : 2 + (git ? 2 : 0) + (git?.linked ? 1 : 0);
  return { mod: "shapr-menu", kind: "popup", frame: "none", width: OVERLAY_W.menu, height: menuHeight({ items, dividers: 1 }), props: { tab: "space", target: { id: space } } };
}

/** shapr-prompt asking for a tab's or space's new name, as Herdr's prompt does, then running the rename. */
export function renameSpec(kind, id) {
  const tab = kind === "tab";
  const thing = tab ? spaces().flatMap((s) => s.tabs ?? []).find((t) => t.id === id) : spaces().find((s) => s.id === id);
  const p = {
    title: tab ? "rename tab" : "rename space",
    value: thing?.named ? thing.name : "",
    hint: tab ? "empty: its number" : "empty: named after its folder",
    command: { name: tab ? "tab.rename" : "space.rename", args: { id } },
  };
  return { mod: "shapr-prompt", kind: "dialog", frame: "none", width: OVERLAY_W.prompt, height: dialogHeight({ extra: [fieldHeight({ supporting: true })] }), props: p };
}

/**
 * shapr's settings window: most of the window, since its 652 (at standard density) can be taller
 * than a window at a large zoom; the window draws its surface centred at its own height.
 */
export function settingsSpec() {
  return { mod: "shapr-settings", kind: "dialog", frame: "none", width: OVERLAY_W.settings, height: 0.92 };
}

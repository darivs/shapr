// style: md3
// The + menu, as an MD3 menu: Terminal, "Start an agent" (installed agents, 1-9 start them, and
// two that aren't installed), New space, New worktree, Open worktree.
// Openers size it with newMenuHeight(): menuHeight({ items: 4 + agent rows, dividers: 1,
// headers: 1 }), agent rows = max(1, min(AGENT_ROWS, choices)) from the last agents this machine
// reported (shared "new-menu.agents"); more agents scroll.
import { View, div, svg, image } from "gpui-kit";
import { v_flex } from "gpui-base";
import { spaces, panes, knownAgents, run, openOverlay, closeOverlay, props, window, keys, shared, setShared } from "herdr";
import { menuSurface, menuItem, menuDivider, menuHeader, menuHeight, dialogHeight, fieldHeight, roles, icon, type, H, ROW, MENU, keyLabel } from "./kit/index.js";

// The last agents each machine reported, shown at once while knownAgents() checks again.
const KNOWN = "new-menu.agents";
// Agent rows before the list scrolls.
export const AGENT_ROWS = 8;

function shortcut(name) {
  return keyLabel(keys().find(b => b.section === "global" && b.action === name)?.keys);
}

// Installed agents, then two that aren't.
const choicesOf = (agents) => [...agents.filter(a => a.installed), ...agents.filter(a => !a.installed).slice(0, 2)];

/** The menu's exact height, for openers: what it draws with the agents last reported. */
export function newMenuHeight() {
  const where = spaces().find(s => s.active)?.machine ?? "";
  const n = choicesOf(shared(KNOWN)?.[where] ?? []).length;
  return menuHeight({ items: 4 + Math.max(1, Math.min(AGENT_ROWS, n)), dividers: 1, headers: 1 });
}

// The worktree dialog, sized to what it draws (see shapr-worktree's header).
const worktree = (props) => ({
  mod: "shapr-worktree", kind: "dialog", frame: "none", props,
  ...(props.action === "open" ? { width: 560, height: dialogHeight({ extra: [H.lg, 5 * ROW.two] }) } : { width: 460, height: dialogHeight({ bodyLines: 3, extra: [fieldHeight()] }) }),
});

export default class NewMenu extends View {
  init(_props, cx) {
    const machine = spaces().find(s => s.active)?.machine;
    const where = machine ?? "";
    this.agents = shared(KNOWN)?.[where] ?? [];
    this.handle = cx.focus_handle();
    this.handle.focus();
    cx.spawn(async cx => {
      try {
        this.agents = await knownAgents({ on: machine });
        setShared(KNOWN, { ...shared(KNOWN), [where]: this.agents });
      }
      catch { this.failed = true; }
      cx.notify();
    });
  }
  row(id, glyph, name, action, hint = "", enabled = true) {
    return menuItem(id, name, { leading: glyph, hint: hint || null, disabled: !enabled, onClick: () => { closeOverlay(props().overlay); action(); } });
  }
  render() {
    const r = roles();
    const space = spaces().find(s => s.active);
    const installed = this.agents.filter(a => a.installed);
    const choices = choicesOf(this.agents);
    const folder = () => panes().find(p => p.focused)?.cwd;
    const glyph = (path) => svg(path).size(20).text_color(r.onSurfaceVariant);
    const rows = Math.max(1, Math.min(AGENT_ROWS, choices.length));
    return menuSurface(v_flex()).w_full().max_h_full()
      .id("new-menu").track_focus(this.handle)
      .on_key_down((e) => {
        if (e.modifiers.control || e.modifiers.platform || e.modifiers.alt) return;
        const agent = /^[1-9]$/.test(e.key) ? installed[Number(e.key) - 1] : null;
        if (!agent) return;
        closeOverlay(props().overlay);
        run("tab.new", { name: agent.name, space: space?.id, argv: agent.run });
      })
      .child(this.row("terminal", glyph("icons/shell.svg"), "Terminal", () => run("tab.new", { space: space?.id }), shortcut("tab.new")))
      .child(menuHeader("Start an agent"))
      // A scrolling list has no height of its own: it gets exactly the rows the opener counted.
      .child(v_flex().id("new-menu-agents").flex_none().h(rows * ROW.menu + (rows - 1) * MENU.gap).gap(MENU.gap).overflow_y_scrollbar()
        .children(choices.map((a, i) => this.row(a.key, a.tint ? glyph(a.icon) : image(a.icon).size(20), a.name,
          () => run("tab.new", { name: a.name, space: space?.id, argv: a.run }), a.installed ? (i < 9 ? String(i + 1) : "") : "Not installed", a.installed)))
        .when(this.agents.length === 0, el => el.child(type(div(), "bodyMedium").h(ROW.menu).flex_none().flex().items_center().px(12).text_color(r.onSurfaceVariant)
          .child(this.failed ? "Could not load agents" : "Checking installed agents…"))))
      .child(menuDivider())
      .child(this.row("space", glyph(icon("add")), "New space", () => run("space.new"), shortcut("space.new")))
      .child(this.row("worktree", glyph("mods/shapr-workspace-chrome/call_split.svg"), "New worktree…", () => openOverlay(worktree({ space: space?.id, folder: folder(), action: "new" })), "", Boolean(space)))
      .child(this.row("worktree-open", glyph("mods/shapr-workspace-chrome/call_split.svg"), "Open worktree…", () => openOverlay(worktree({ space: space?.id, folder: folder(), action: "open" })), "", Boolean(space)));
  }
}

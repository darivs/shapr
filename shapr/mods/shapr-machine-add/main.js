// style: md3
// Add a machine: the hosts in ~/.ssh/config to pick from (or type one),
// each added with one click (`hc machine add`). When the machine needs
// something first (herdr-core installed there, a password, a new host
// key), the same command opens in a small terminal window where you answer
// it; the list sees the machine once it's added. Opened as a dialog
// (`mod.open shapr-machine-add`: mod.json's overlay, width 560, frame "none", as tall as what it
// draws); the sidebars' Add machine and the welcome open it. An MD3 dialog: its surface fits
// its content (dialogSurface with fit) and the host list shrinks and scrolls when the window is short.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { hc, exec, home, readTextFile, props, closeOverlay, openOverlay } from "herdr";
import { dialogSurface, dialogHeadline, dialogBody, textField, button, iconButton, listItem, heading, card, label, circularProgress, roles, icon, type, RADIUS, chromeIcon } from "./kit/index.js";

// The terminal window's title bar height.
const BAR = 40;


// Host entries people can pick: named ones, not patterns.
function parseConfig(text) {
  const hosts = [];
  let cur = null;
  for (const raw of (text ?? "").split("\n")) {
    const m = raw.trim().match(/^([^\s#=]+)\s*=?\s*(.*)$/);
    if (!m) continue;
    const [key, value] = [m[1].toLowerCase(), m[2].trim()];
    if (key === "host" || key === "match") {
      const names = key === "host" ? value.split(/\s+/).filter((h) => h && !/[*?!]/.test(h)) : [];
      cur = names.length ? { alias: names[0], aliases: names.slice(1), hostname: null, user: null } : null;
      if (cur) hosts.push(cur);
    } else if (cur && key === "hostname") cur.hostname = value;
    else if (cur && key === "user") cur.user = value;
  }
  return hosts;
}

export default class MachineAdd extends View {
  init(_props, cx) {
    this.hosts = null;
    this.added = [];
    this.state = {}; // target -> "adding" | "terminal" | error text
    this.typed = "";
    this.input = InputState.new({ placeholder: "user@host" });
    this.input.on("change", (_e, cx) => { this.typed = this.input.value(); cx.notify(); });
    this.input.on("submit", (_e, cx) => this.add(this.typed, cx));
    this.inputFocused = true;
    this.input.on("focus", (_e, cx) => { this.inputFocused = true; cx.notify(); });
    this.input.on("blur", (_e, cx) => { this.inputFocused = false; cx.notify(); });
    if (props()?.part !== "bar") {
      this.input.focus();
      cx.timer.after(600, () => this.input.focus());
    }
    this.macs = {}; // target -> { name, core } for an added Mac
    this.opened = {};
    this.handle = cx.focus_handle();
    cx.spawn(async (cx) => {
      this.hosts = parseConfig(await readTextFile(`${home()}/.ssh/config`).catch(() => null));
      await this.refresh();
      cx.notify();
    });
    // While a terminal finishes an add, the list catches up.
    cx.timer.every(3000, (cx) => {
      if (!Object.values(this.state).includes("terminal")) return;
      cx.spawn(async (cx) => {
        await this.refresh();
        cx.notify();
      });
    });
  }

  async refresh() {
    const r = await hc(["machine", "ls", "--json"]).catch(() => null);
    try {
      this.added = r?.code === 0 ? (JSON.parse(r.stdout).machines ?? []).filter((m) => !m.temporary) : [];
    } catch {
      this.added = [];
    }
    for (const m of this.added) {
      if (this.state[m.target] !== "terminal") continue;
      delete this.state[m.target];
      await this.checkMac(m.target);
    }
  }

  isAdded(target) {
    return this.added.some((m) => m.target === target || m.name === target || m.host === target);
  }

  add(target, cx) {
    target = target.trim();
    if (!target || this.state[target] === "adding") return;
    this.state[target] = "adding";
    cx.notify();
    cx.spawn(async (cx) => {
      const r = await hc(["machine", "add", target, "--json"]).catch((e) => ({ code: 1, stderr: String(e), stdout: "" }));
      let why = null;
      try {
        why = r.code === 0 ? null : (JSON.parse(r.stdout || r.stderr).error ?? { message: (r.stderr || r.stdout).trim() });
      } catch {
        why = { message: (r.stderr || r.stdout || "it didn't answer").trim() };
      }
      if (!why) {
        delete this.state[target];
        this.input.set_value("");
        this.typed = "";
        await this.refresh();
        await this.checkMac(target);
      } else if (["hc_missing", "incompatible", "login_needed", "auth_failed", "host_key"].includes(why.kind) || /password|passphrase|host key|permission denied|login/i.test(why.message ?? "")) {
        this.state[target] = "terminal";
        await this.inTerminal(target);
      } else this.state[target] = why.message || "it didn't work";
      await this.refresh();
      cx.notify();
    });
  }

  // macOS asks on its own screen before anything reads Desktop, Documents
  // or Downloads, and the asking program waits: say so once, with the way
  // to allow it for good.
  async checkMac(target) {
    const m = this.added.find((x) => x.target === target || x.name === target);
    if (!m) return;
    const r = await exec("sh", ["-c", 'uname; command -v herdr-core || echo "$HOME/.local/bin/herdr-core"'], { on: m.name }).catch(() => null);
    const [os, core] = (r?.stdout ?? "").trim().split("\n");
    if (os === "Darwin") this.macs[target] = { name: m.name, core: core ?? "~/.local/bin/herdr-core" };
  }

  macCard(target) {
    const r = roles();
    const mac = this.macs[target];
    return card(v_flex().mx(16).mb(8).gap(8), { kind: "outlined" })
      .child(label(`${mac.name} is a Mac: allow its folders once`, { style: "titleSmall" }))
      .child(label("macOS asks on the Mac's own screen before an agent reads Desktop, Documents or Downloads, and waits until someone answers. Give herdr-core Full Disk Access there and it never asks again: in the list, press + and pick this file:", { role: "onSurfaceVariant" }))
      .child(type(div(), "labelLarge").px(12).py(6).rounded(RADIUS.field).bg(r.surfaceHighest).text_color(r.onSurface).child(mac.core))
      .child(
        h_flex()
          .gap(12)
          .items_center()
          .child(button(`ma-mac-${target}`, `Open the setting on ${mac.name}`, { kind: "tonal", size: "sm", onClick: () => {
            exec("open", ["x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles"], { on: mac.name }).catch(() => null);
            this.opened[target] = true;
          } }))
          .when(Boolean(this.opened[target]), (el) => el.child(label("It's open on the Mac's screen.", { style: "bodySmall", role: "onSurfaceVariant" }))),
      );
  }

  async inTerminal(target) {
    const r = await hc(["run", "--bg", "--json", "--no-parent", "--name", `add-${target.replace(/[^a-z0-9_-]/gi, "-").toLowerCase()}`.slice(0, 32), "--", "hc", "machine", "add", target]).catch(() => null);
    let address = null;
    try {
      address = r?.code === 0 ? JSON.parse(r.stdout).address : null;
    } catch {}
    if (!address) {
      this.state[target] = "Couldn't open a terminal for it. Run `hc machine add " + target + "` in one.";
      return;
    }
    openOverlay({
      kind: "dialog",
      key: `machine-add-${target}`,
      width: 640,
      height: 300,
      layout: {
        type: "column",
        children: [
          { type: "block", size: { px: BAR }, content: { mod: "shapr-machine-add", props: { part: "bar", target } } },
          { type: "block", content: { terminal: address } },
        ],
      },
    });
  }

  close() {
    closeOverlay(props().overlay);
  }

  key(e, cx) {
    if (e.key === "escape") { this.close(); cx.stop_propagation(); }
  }

  // The terminal window's title bar.
  // The terminal window's title bar: surface-container, title small, a close icon button.
  bar() {
    const r = roles();
    return h_flex()
      .size_full()
      .pl(16)
      .pr(4)
      .gap(12)
      .items_center()
      .bg(r.surfaceContainer)
      .border_b(1)
      .border_color(r.outlineVariant)
      .text_color(r.onSurfaceVariant)
      .child(svg(chromeIcon("dns")).size(18).flex_none())
      .child(type(div(), "titleSmall").flex_1().min_w(0).truncate().text_color(r.onSurface).child(`Adding ${props().target}: answer it here`))
      .child(iconButton("ma-bar-close", icon("close"), { size: "sm", tip: "Close", onClick: () => closeOverlay(props().overlay) }));
  }

  row(target, name, sub) {
    const r = roles();
    const st = this.state[target];
    const done = this.isAdded(target);
    const right = done
      ? h_flex().gap(6).items_center().text_color(r.primary).child(svg(chromeIcon("check_circle")).size(18)).child(type(div(), "labelLarge").child("Added"))
      : st === "adding"
        ? h_flex().gap(8).items_center().child(circularProgress(18)).child(label("Connecting", { style: "labelLarge", role: "onSurfaceVariant" }))
        : st === "terminal"
          ? label("Waiting in its terminal", { style: "labelLarge", role: "blocked" })
          : button(`ma-add-${target}`, "Add", { kind: "outlined", size: "sm", onClick: (_e, cx) => this.add(target, cx) });
    const idle = !done && !st;
    return v_flex()
      .flex_none()
      .child(listItem(`ma-row-${target}`, name, {
        supporting: sub || null,
        leading: svg(chromeIcon("dns")).size(20),
        trailing: right,
        interactive: !idle,
        onClick: idle ? (_e, cx) => this.add(target, cx) : null,
      }))
      .when(typeof st === "string" && !["adding", "terminal"].includes(st), (el) => el.child(label(st, { style: "bodySmall", role: "error" }).pl(52).pr(16).pb(8)))
      .when(Boolean(this.macs[target]), (el) => el.child(this.macCard(target)));
  }

  render() {
    if (props()?.part === "bar") return this.bar();
    const r = roles();
    const hosts = this.hosts ?? [];
    const typed = this.typed.trim();
    return dialogSurface(v_flex(), { fit: true })
      .id("machine-add")
      .track_focus(this.handle)
      .on_key_down((e, cx) => this.key(e, cx))
      .child(h_flex().w_full().gap(12).items_center()
        .child(dialogHeadline("Add a machine").flex_1().min_w(0).truncate())
        .child(iconButton("ma-close", icon("close"), { size: "md", tip: "Close", onClick: () => this.close() })))
      .child(dialogBody("A VPS, a Mac mini, a box at home: Herdr reaches it over ssh, and agents there keep running while your laptop sleeps."))
      .child(
        v_flex()
          .flex_shrink(1)
          .min_h(0)
          .mx(-16)
          .child(heading(hosts.length ? "From your ssh config" : "Your ssh config lists no hosts"))
          .child(
            v_flex()
              .id("ma-hosts")
              .max_h(280)
              .min_h(0)
              .flex_shrink(1)
              .overflow_y_scrollbar()
              .children(
                this.hosts === null
                  ? [label("Reading ~/.ssh/config…", { role: "onSurfaceVariant" }).px(16).py(10)]
                  : hosts.map((h) => this.row(h.alias, h.alias, [h.user, h.hostname].filter(Boolean).join("@") || (h.aliases.length ? `also ${h.aliases.join(", ")}` : ""))),
              ),
          ),
      )
      .child(
        h_flex()
          .flex_none()
          .gap(8)
          .items_end()
          .child(div().flex_1().min_w(0).child(textField(Input.new(this.input).w_full().text_color(r.onSurface), {
            label: "Or type how ssh reaches it",
            focused: this.inputFocused,
            error: Boolean(typed && typeof this.state[typed] === "string" && !["adding", "terminal"].includes(this.state[typed])),
          })))
          .child(button("ma-add-typed", "Add", { kind: "filled", size: "lg", disabled: !typed, onClick: (_e, cx) => this.add(this.typed, cx) })),
      )
      .when(Boolean(typed && this.state[typed]), (el) => {
        const st = this.state[typed];
        const text = st === "adding" ? "Connecting…" : st === "terminal" ? "Waiting in its terminal" : String(st);
        return el.child(label(text, { style: "bodySmall", role: st === "adding" ? "onSurfaceVariant" : st === "terminal" ? "blocked" : "error" }).mt(-8));
      });
  }
}

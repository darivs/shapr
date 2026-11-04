// herdr for tests: every function from herdr.d.ts, fed from globalThis.__herdr (see fixture()).
const S = () => globalThis.__herdr ?? (globalThis.__herdr = fixture());
export function fixture(over = {}) {
  return {
    theme: { canvas: "#fef7ff", chrome: "#f3edf7", background: "#ffffff", surface: "#f7f2fa", raised: "#ece6f0", popover: "#ece6f0", hover: "#e6e1e9", selected: "#e8def8", foreground: "#1d1b20", muted: "#49454f", dim: "#a8a3aa", border: "#cac4d0", input: "#79747e", accent: "#eaddff", accent_foreground: "#4f378b", solid: "#6750a4", solid_foreground: "#ffffff", selection: "#e8def8", working: "#9a6700", blocked: "#c93c2c", done: "#2f6fe4", idle: "#a8a8aa", unknown: "#a8a8aa" },
    settings: { zoom: 1, dark: false }, shared: {}, props: {}, spaces: [], agents: [], panes: [], terminals: [],
    focused: null, layout: { id: "root", children: [] }, window: { platform: "macos", titlebar: "none", buttons: false, maximized: false, fullscreen: false, active: true },
    keys: [], machines: [{ name: null, layout: "ready" }], updates: { app: { version: "0.0.0", ready: null, updates: true }, notes: [], core: { version: null, managed: null, ready: null, updating: false, error: null }, checked: null, checks: true, checking: false },
    ran: [], overlays: [], files: {}, ...over,
  };
}
export const reset = (over) => { globalThis.__herdr = fixture(over); return globalThis.__herdr; };
export const theme = () => S().theme;
export const themes = () => [];
export const settings = () => S().settings;
export const shared = (k) => S().shared[k];
export const setShared = (k, v) => { S().shared[k] = v; return null; };
export const props = () => S().props;
export const spaces = () => S().spaces;
export const agents = () => S().agents;
export const panes = () => S().panes;
export const terminals = () => S().terminals;
export const focused = () => S().focused;
export const layout = () => S().layout;
export const layouts = () => ["main", "shapr-material"];
export const window = () => S().window;
export const keys = () => S().keys;
export const machines = () => S().machines;
export const updates = () => S().updates;
export const commands = () => [];
export const fonts = () => ["Roboto Flex"];
export const placement = () => S().placement ?? null;
export const telemetry = () => null;
export const run = (name, args) => { S().ran.push([name, args]); return null; };
export const openOverlay = (spec) => { S().overlays.push(spec); return `o${S().overlays.length}`; };
export const closeOverlay = () => null;
export const notify = (n) => { (S().notified ??= []).push(n); return "n1"; };
export const setAgentOrder = () => null;
export const presentUpdateNotes = () => null;
export const playSound = () => null;
export const home = () => "/user-home";
export const appHome = () => "/app-home";
export const exec = async () => ({ code: 0, stdout: "", stderr: "" });
export const hc = async () => ({ code: 0, stdout: "", stderr: "" });
export const readTextFile = async (p) => S().files[p] ?? null;
export const writeTextFile = async (p, t) => { S().files[p] = t; return null; };
export const knownAgents = async () => [];
export const pickFolder = async () => null;
export const watchFolder = () => new Promise(() => {});
export const nextCommand = () => new Promise(() => {});

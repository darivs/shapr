// Keeps shapr's theme files in the app's themes/ folder in step with the person's seed and
// contrast: Herdr's gallery flow copies only layouts/ and mods/, so a mod writes them.
import { appHome, readTextFile, writeTextFile } from "herdr";
import { themeTexts } from "./scheme.js";

let written = null, busy = false;

/** Call from render; writes only when the seed or contrast changed and the files differ. */
export function keepThemes(cx, prefs) {
  const key = JSON.stringify([prefs.seed ?? null, prefs.contrast ?? "standard"]);
  if (key === written || busy) return;
  busy = true;
  cx.spawn(async (cx) => {
    try {
      for (const [name, text] of Object.entries(themeTexts(prefs))) {
        const path = `${appHome()}/themes/${name}.json`;
        const old = await readTextFile(path);
        if (old !== text) await writeTextFile(path, text, old);
      }
      written = key;
    } catch {
      // Another copy wrote first (a stale snapshot): the next render compares again.
    } finally {
      busy = false;
      cx.notify();
    }
  });
}

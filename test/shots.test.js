// bin/shots on image files: --crop cuts a shot to the sidebar or the work area, --mask covers every
// sidebar row outside the demo space with one solid box. Both find the sidebar's edge and its
// lists' dividers in the shot; a fake app home gives the window's size and the zoom.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateSync, inflateSync } from "node:zlib";

const root = new URL("..", import.meta.url).pathname;

// A PNG writer and reader of its own (8-bit RGBA, every filter), so the test doesn't trust bin/shots's.
const CRC = Array.from({ length: 256 }, (_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function encodePng({ width, height, data }) {
  const chunk = (kind, body) => {
    const k = Buffer.from(kind, "latin1"), len = Buffer.alloc(4), sum = Buffer.alloc(4);
    len.writeUInt32BE(body.length); sum.writeUInt32BE(crc(Buffer.concat([k, body])));
    return Buffer.concat([len, k, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr.set([8, 6, 0, 0, 0], 8);
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) data.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
function decodePng(buf) {
  let at = 8, width, height, rgba, idat = [];
  while (at < buf.length) {
    const len = buf.readUInt32BE(at), kind = buf.toString("latin1", at + 4, at + 8), body = buf.subarray(at + 8, at + 8 + len);
    if (kind === "IHDR") { width = body.readUInt32BE(0); height = body.readUInt32BE(4); rgba = body[9] === 6; }
    if (kind === "IDAT") idat.push(body);
    at += 12 + len;
  }
  const bpp = rgba ? 4 : 3, stride = width * bpp, raw = inflateSync(Buffer.concat(idat)), px = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < stride; x++) {
      const f = raw[y * (stride + 1)], a = x >= bpp ? px[y * stride + x - bpp] : 0, b = y ? px[(y - 1) * stride + x] : 0;
      const c = y && x >= bpp ? px[(y - 1) * stride + x - bpp] : 0, p = a + b - c;
      const pred = [0, a, b, (a + b) >> 1, Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c) ? a : Math.abs(p - b) <= Math.abs(p - c) ? b : c][f];
      px[y * stride + x] = raw[y * (stride + 1) + 1 + x] + pred;
    }
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) data.set([px[i * bpp], px[i * bpp + 1], px[i * bpp + 2], rgba ? px[i * bpp + 3] : 255], i * 4);
  return { width, height, data };
}

// A shot as the window draws it, at scale 2 (the window 400 x 700, the image 800 x 1400): the
// sidebar's edge a 2 px line at x 200 (window x 100), the agents list's top border at y 600
// (window 300) and the footer's divider at y 1200 (window 600), in one line color. Everything else
// is a gradient (red x / 4, green y / 8, blue 7), so a cut or a box shows where it fell.
const LINE = [73, 69, 78];
// lines: false draws none of them; layout: the app home's shapr-material.json then.
function fixture({ zoom = 1, lines = true, layout = null } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "shots-"));
  const home = join(dir, "home");
  mkdirSync(join(home, "layouts"), { recursive: true });
  writeFileSync(join(home, "window.json"), JSON.stringify({ state: "windowed", bounds: [0, 0, 400, 700] }));
  writeFileSync(join(home, "settings.json"), JSON.stringify({ zoom }));
  if (layout) writeFileSync(join(home, "layouts", "shapr-material.json"), JSON.stringify(layout));
  const width = 800, height = 1400, data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const line = lines && (x === 200 || x === 201 || (x < 200 && [600, 601, 1200, 1201].includes(y)));
      data.set(line ? [...LINE, 255] : [x >> 2, y >> 3, 7, 255], (y * width + x) * 4);
    }
  const file = join(dir, "shot.png");
  writeFileSync(file, encodePng({ width, height, data }));
  const shots = (...args) => spawnSync(join(root, "bin/shots"), args, { encoding: "utf8", env: { ...process.env, HERDR_APP_HOME: home } });
  return { dir, file, shots };
}
const pixel = (img, x, y) => [...img.data.subarray((y * img.width + x) * 4, (y * img.width + x) * 4 + 3)];

test("--crop sidebar cuts a shot to the sidebar, --crop work to the rest, at the edge the shot shows", () => {
  const { dir, file, shots } = fixture();
  const side = join(dir, "side.png"), work = join(dir, "work.png");
  assert.equal(shots("--crop", "sidebar", file, side).status, 0);
  assert.equal(shots("--crop", "work", file, work).status, 0);
  const s = decodePng(readFileSync(side)), w = decodePng(readFileSync(work));
  assert.deepEqual([s.width, s.height], [200, 1400]);
  assert.deepEqual([w.width, w.height], [600, 1400]);
  assert.deepEqual(pixel(w, 2, 0), [50, 0, 7]);
});

// The demo space keeps the "Spaces" heading and its one row under the brand bar (48 + 36 + 40 =
// window y 124, image 248), and in the agents list its border, the heading, the "Pinned" header
// and four agent rows (300 + 1 + 36 + 40 + 4 * 40 = window y 537, image 1074).
test("--mask covers every sidebar row below the demo space's, in each list, with one solid color", () => {
  const { file, shots } = fixture();
  const before = decodePng(readFileSync(file));
  assert.equal(shots("--mask", file).status, 0);
  const img = decodePng(readFileSync(file));
  const kept = [[30, 10], [30, 247], [30, 602], [30, 1073], [150, 1300], [500, 1100]];
  for (const [x, y] of kept) assert.deepEqual(pixel(img, x, y), pixel(before, x, y), `kept ${x},${y}`);
  const fillColor = pixel(img, 30, 248);
  assert.notDeepEqual(fillColor, pixel(before, 30, 248));
  for (const [x, y] of [[0, 248], [199, 400], [100, 599], [0, 1074], [199, 1199]]) assert.deepEqual(pixel(img, x, y), fillColor, `masked ${x},${y}`);
});

// No line marks the sidebar now: its width and the lists' split come from the app home's layout
// (sidebar 100, spaces and agents weight 1 each), the brand bar and footer from the density
// (48 and 136). The lists run from window y 48 to 564, the agents list from 306. The demo space,
// active, keeps its two-line row (48 + 36 + 56 = 140); the agents list its heading with 8 above, the
// "Pinned" header with 4 above and four rows (306 + 44 + 40 + 160 = 550).
test("--crop and --mask find the sidebar and its lists from the layout when no line marks them", () => {
  const layout = { id: "root", type: "row", children: [
    { id: "sidebar", type: "column", size: { px: 100 }, children: [
      { id: "brand", type: "block", size: { px: 48 } },
      { id: "sidebar-lists", type: "column", children: [{ id: "spaces", type: "block", size: { weight: 1 } }, { id: "agents", type: "block", size: { weight: 1 } }] },
      { id: "sidebar-footer", type: "block", size: { px: 136 } },
    ] },
    { id: "work", type: "column", size: { weight: 1 } },
  ] };
  const { dir, file, shots } = fixture({ lines: false, layout });
  const side = join(dir, "side.png");
  assert.equal(shots("--crop", "sidebar", file, side).status, 0);
  assert.deepEqual([decodePng(readFileSync(side)).width, decodePng(readFileSync(side)).height], [200, 1400]);
  const before = decodePng(readFileSync(file));
  const r = shots("--mask", file);
  assert.equal(r.status, 0, r.stderr);
  const img = decodePng(readFileSync(file));
  for (const [x, y] of [[30, 279], [30, 612], [30, 1099], [30, 1128], [150, 1300], [210, 500], [500, 1100]])
    assert.deepEqual(pixel(img, x, y), pixel(before, x, y), `kept ${x},${y}`);
  const fillColor = pixel(img, 30, 280);
  assert.notDeepEqual(fillColor, pixel(before, 30, 280));
  for (const [x, y] of [[0, 280], [199, 611], [0, 1100], [199, 1127]]) assert.deepEqual(pixel(img, x, y), fillColor, `masked ${x},${y}`);
});

test("a shot is kept only while the window shows the demo space", async () => {
  const { onDemo } = await import("../bin/shots");
  assert.equal(onDemo({ space: "sp1" }, "sp1"), true);
  assert.equal(onDemo({ space: "sp2" }, "sp1"), false, "another space is on screen");
  assert.equal(onDemo({ space: "sp1" }, null), false, "no demo space is up");
});

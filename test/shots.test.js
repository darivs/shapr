// bin/shots on image files: --crop cuts a shot to the sidebar or the work area, --mask covers every
// sidebar row outside the demo space with one solid box. A fake app home gives the window's size,
// the layout and the zoom, as the running window would.
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

// A window 400 x 300 (window px) shot at scale 2: the sidebar 100 wide, brand 20, footer 40, so
// the lists run from y 20 to 260 (spaces 20-140, agents 140-260). Every pixel's red channel is
// its x / 4 and green its y / 4 (image px), blue 7, so a cut or a box shows where it fell.
function fixture({ zoom = 1 } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "shots-"));
  const home = join(dir, "home");
  mkdirSync(join(home, "layouts"), { recursive: true });
  writeFileSync(join(home, "window.json"), JSON.stringify({ state: "windowed", bounds: [0, 0, 400, 300] }));
  writeFileSync(join(home, "settings.json"), JSON.stringify({ zoom }));
  const layout = { id: "root", children: [
    { id: "sidebar", size: { px: 100 }, children: [{ id: "brand", size: { px: 20 } }, { id: "sidebar-lists" }, { id: "sidebar-footer", size: { px: 40 } }] },
    { id: "work" },
  ] };
  writeFileSync(join(home, "layouts", "shapr-material.json"), JSON.stringify({ root: layout }));
  const width = 800, height = 600, data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) data.set([x >> 2, y >> 2, 7, 255], (y * width + x) * 4);
  const file = join(dir, "shot.png");
  writeFileSync(file, encodePng({ width, height, data }));
  const shots = (...args) => spawnSync(join(root, "bin/shots"), args, { encoding: "utf8", env: { ...process.env, HERDR_APP_HOME: home } });
  return { dir, file, shots };
}
const pixel = (img, x, y) => [...img.data.subarray((y * img.width + x) * 4, (y * img.width + x) * 4 + 3)];

test("--crop sidebar cuts a shot to the sidebar, --crop work to the rest", () => {
  const { dir, file, shots } = fixture();
  const side = join(dir, "side.png"), work = join(dir, "work.png");
  assert.equal(shots("--crop", "sidebar", file, side).status, 0);
  assert.equal(shots("--crop", "work", file, work).status, 0);
  const s = decodePng(readFileSync(side)), w = decodePng(readFileSync(work));
  assert.deepEqual([s.width, s.height], [200, 600]);
  assert.deepEqual([w.width, w.height], [600, 600]);
  assert.deepEqual(pixel(w, 0, 0), [50, 0, 7]);
});

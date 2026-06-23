// Generates the PWA PNG app icons (no image deps — raw RGBA encoded to PNG via
// node:zlib). Re-run with `node scripts/gen-icons.mjs` if the design changes.
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const SAFFRON = [212, 84, 10]; // #d4540a
const CREAM = [253, 241, 225]; // #fdf1e1
const GOLD = [224, 180, 85]; // #e0b455
const FLAME = [255, 211, 122]; // #ffd27a

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, px) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // rows: filter byte 0 + RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0;
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      raw[o++] = px[i];
      raw[o++] = px[i + 1];
      raw[o++] = px[i + 2];
      raw[o++] = px[i + 3];
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function render(size) {
  const px = new Uint8Array(size * size * 4);
  const set = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (Math.floor(y) * size + Math.floor(x)) * 4;
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
    px[i + 3] = 255;
  };
  const s = size / 512; // design in a 512 space
  // Full-bleed saffron background (maskable-safe).
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) set(x, y, SAFFRON);

  // Diya bowl: a cream ellipse with a gold rim band, lower-centre.
  const cx = 256 * s;
  const bowlY = 340 * s;
  const rx = 150 * s;
  const ry = 56 * s;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - bowlY) / ry;
      if (dx * dx + dy * dy <= 1) set(x, y, y > bowlY ? GOLD : CREAM);
    }
  }

  // Flame: a teardrop above the bowl (gold outer, bright inner).
  const fcx = 256 * s;
  const fbase = 300 * s;
  for (let y = 140 * s; y < fbase; y++) {
    const t = (y - 140 * s) / (fbase - 140 * s); // 0 tip .. 1 base
    const halfOuter = 70 * s * Math.sin(t * Math.PI * 0.5);
    const halfInner = 38 * s * Math.sin(t * Math.PI * 0.5);
    for (let x = fcx - halfOuter; x <= fcx + halfOuter; x++) {
      set(x, y, Math.abs(x - fcx) <= halfInner ? CREAM : FLAME);
    }
  }
  return px;
}

for (const size of [192, 512]) {
  writeFileSync(
    new URL(`../public/icon-${size}.png`, import.meta.url),
    encodePng(size, render(size)),
  );
  console.log(`wrote public/icon-${size}.png`);
}

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import jpeg from "jpeg-js";

// Brand logo for PDFs. Prefers a real JPEG asset (INVOICE_LOGO_PATH or
// public/brand-logo.jpg); otherwise encodes a generated mark to JPEG so a real
// JPEG is always embedded.

type Jpeg = { data: Buffer; w: number; h: number };
let cache: Jpeg | null = null;

// Reads width/height from a JPEG's SOF marker.
function jpegSize(buf: Buffer): { w: number; h: number } | null {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = buf[i + 1];
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb)
    ) {
      const h = buf.readUInt16BE(i + 5);
      const w = buf.readUInt16BE(i + 7);
      return { w, h };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  return null;
}

// Draws the brand mark (saffron disc + maroon/gold flame) into an RGBA buffer.
function markRgba(): { data: Buffer; w: number; h: number } {
  const w = 96;
  const h = 96;
  const buf = Buffer.alloc(w * h * 4, 255);
  const set = (x: number, y: number, r: number, g: number, b: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4;
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = 255;
  };
  const cx = 48;
  const cy = 48;
  const R = 46;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= R * R) set(x, y, 217, 119, 6);
    }
  }
  const top = 24;
  const bottom = 64;
  for (let y = top; y <= bottom; y++) {
    const t = (y - top) / (bottom - top);
    const half = Math.round(3 + t * 12);
    for (let x = cx - half; x <= cx + half; x++) set(x, y, 122, 31, 31);
  }
  for (let y = top + 10; y <= bottom - 6; y++) {
    const t = (y - (top + 10)) / (bottom - 6 - (top + 10));
    const half = Math.round(1 + t * 5);
    for (let x = cx - half; x <= cx + half; x++) set(x, y, 250, 204, 21);
  }
  return { data: buf, w, h };
}

export function logoJpeg(): Jpeg {
  if (cache) return cache;

  // 1) Real asset if available.
  const candidates = [
    process.env.INVOICE_LOGO_PATH,
    join(process.cwd(), "public", "brand-logo.jpg"),
  ].filter(Boolean) as string[];
  for (const path of candidates) {
    try {
      if (existsSync(path)) {
        const data = readFileSync(path);
        const size = jpegSize(data);
        if (size) {
          cache = { data, w: size.w, h: size.h };
          return cache;
        }
      }
    } catch {
      // fall through to generated
    }
  }

  // 2) Generated mark encoded to JPEG.
  const mark = markRgba();
  const encoded = jpeg.encode({ data: mark.data, width: mark.w, height: mark.h }, 90);
  cache = { data: Buffer.from(encoded.data), w: mark.w, h: mark.h };
  return cache;
}

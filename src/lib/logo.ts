// Generates the brand logo as a raw RGB bitmap for embedding in PDFs — a
// saffron disc with a maroon "diya flame", drawn in code (no image library).

let cache: { data: Buffer; w: number; h: number } | null = null;

export function logoRgb(): { data: Buffer; w: number; h: number } {
  if (cache) return cache;
  const w = 72;
  const h = 72;
  const buf = Buffer.alloc(w * h * 3, 255); // white background

  const set = (x: number, y: number, r: number, g: number, b: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 3;
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
  };

  const cx = 36;
  const cy = 36;
  const R = 34;
  // Saffron disc (#d97706)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= R * R) set(x, y, 217, 119, 6);
    }
  }
  // Maroon flame (triangle) (#7a1f1f)
  const top = 18;
  const bottom = 48;
  for (let y = top; y <= bottom; y++) {
    const t = (y - top) / (bottom - top);
    const halfW = Math.round(2 + t * 9);
    for (let x = cx - halfW; x <= cx + halfW; x++) set(x, y, 122, 31, 31);
  }
  // Gold core (#facc15)
  for (let y = top + 8; y <= bottom - 4; y++) {
    const t = (y - (top + 8)) / (bottom - 4 - (top + 8));
    const halfW = Math.round(1 + t * 4);
    for (let x = cx - halfW; x <= cx + halfW; x++) set(x, y, 250, 204, 21);
  }

  cache = { data: buf, w, h };
  return cache;
}

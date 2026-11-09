// The ASCII engine shared by the hero, the loader and the cloud bands: a
// character grid sized to a canvas, a cloud field from fractal noise, and a
// renderer that draws whole rows of text at once (one fillText per row keeps
// a full-screen grid cheap).

/** Light to dark, the same ramp the Kumo template draws its clouds with. */
export const RAMP = " .:-=+*#%@";
const LAST = RAMP.length - 1;

// Canvas can't read CSS variables, so the ink comes off <html> and is read
// again when the theme flips; canvases listen for PALETTE_EVENT to redraw.
export const PALETTE_EVENT = "ascii-palette";
let cached: { ink: string; soft: string } | null = null;

export function palette() {
  if (!cached) {
    const s = getComputedStyle(document.documentElement);
    cached = {
      ink: s.getPropertyValue("--ascii").trim() || "#2f47a8",
      soft: s.getPropertyValue("--ascii-soft").trim() || "rgba(47, 71, 168, 0.42)",
    };
  }
  return cached;
}

if (typeof window !== "undefined") {
  new MutationObserver(() => {
    cached = null;
    window.dispatchEvent(new Event(PALETTE_EVENT));
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}

export const charAt = (v: number) => RAMP[Math.max(0, Math.min(LAST, Math.round(v * LAST)))];

// ---- Noise ----------------------------------------------------------------

// Classic 2D Perlin noise on a fixed permutation, so every visit draws the
// same sky.
const perm = new Uint8Array(512);
{
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let seed = 1337;
  for (let i = 255; i > 0; i--) {
    seed = (seed * 16807) % 2147483647;
    const j = seed % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function grad(h: number, x: number, y: number) {
  switch (h & 7) {
    case 0: return x + y;
    case 1: return -x + y;
    case 2: return x - y;
    case 3: return -x - y;
    case 4: return x;
    case 5: return -x;
    case 6: return y;
    default: return -y;
  }
}

export function noise2(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const X = xi & 255;
  const Y = yi & 255;
  const xf = x - xi;
  const yf = y - yi;
  const u = fade(xf);
  const v = fade(yf);
  const aa = perm[perm[X] + Y];
  const ab = perm[perm[X] + Y + 1];
  const ba = perm[perm[X + 1] + Y];
  const bb = perm[perm[X + 1] + Y + 1];
  return lerp(
    lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
    lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
    v,
  );
}

export function fbm(x: number, y: number, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise2(x * f, y * f);
    f *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

// ---- Grid -----------------------------------------------------------------

export type Grid = {
  ctx: CanvasRenderingContext2D;
  cols: number;
  rows: number;
  /** One cell's size in CSS px. */
  cw: number;
  ch: number;
  width: number;
  height: number;
  font: string;
};

export const MONO = 'var(--font-plex-mono), ui-monospace, SFMono-Regular, Menlo, monospace';

/** Sizes the canvas to its box at device resolution and measures one cell. */
export function fitGrid(canvas: HTMLCanvasElement, fontSize: number): Grid | null {
  const box = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(box.width));
  const height = Math.max(1, Math.floor(box.height));
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Canvas can't resolve CSS variables, so read the loaded mono family off the page
  const family = getComputedStyle(canvas).getPropertyValue("--font-plex-mono").trim() || "ui-monospace";
  const font = `500 ${fontSize}px ${family}, ui-monospace, monospace`;
  ctx.font = font;
  const cw = ctx.measureText("M").width || fontSize * 0.6;
  const ch = Math.round(fontSize * 1.18);
  return {
    ctx,
    cols: Math.ceil(width / cw),
    rows: Math.ceil(height / ch),
    cw,
    ch,
    width,
    height,
    font,
  };
}

/** Draws a row-major char buffer, one fillText per row. */
export function drawRows(g: Grid, chars: string[], color: string) {
  const { ctx, cols, rows, ch } = g;
  ctx.fillStyle = color;
  ctx.textBaseline = "top";
  ctx.font = g.font;
  for (let r = 0; r < rows; r++) {
    const line = chars.slice(r * cols, (r + 1) * cols).join("");
    if (line.trim()) ctx.fillText(line, 0, r * ch);
  }
}

// ---- Clouds ---------------------------------------------------------------

export type CloudOptions = {
  /** Seconds; the field drifts left with time. */
  t: number;
  /** Horizontal and vertical feature size in cells. */
  scaleX?: number;
  scaleY?: number;
  /** How much of the sky is cloud, 0 to 1. */
  cover?: number;
  /** Extra density by row, 0 at top to 1 at bottom: shape the bank. */
  shape?: (y: number) => number;
  /** A clear patch around a point in px, the cursor parting the clouds. */
  part?: { x: number; y: number; r: number } | null;
  offset?: number;
};

/** Writes cloud density, 0 to 1, for every cell. */
export function cloudField(g: Grid, out: Float32Array, o: CloudOptions) {
  const { cols, rows, cw, ch } = g;
  const sx = o.scaleX ?? 34;
  const sy = o.scaleY ?? 13;
  const cover = o.cover ?? 0.5;
  const t = o.t;
  const off = o.offset ?? 0;
  for (let r = 0; r < rows; r++) {
    const yy = rows > 1 ? r / (rows - 1) : 0;
    const bias = o.shape ? o.shape(yy) : 0;
    for (let c = 0; c < cols; c++) {
      // Two layers drifting at different speeds give the bank some parallax
      const n =
        fbm(c / sx + t * 0.05 + off, r / sy + off * 0.3) * 0.75 +
        fbm(c / (sx * 0.45) + t * 0.11 + 40 + off, r / (sy * 0.45) - t * 0.01) * 0.25;
      let d = (n + 0.5) * 1.15 - (1 - cover) + bias;
      if (o.part) {
        const dx = (c * cw - o.part.x) / o.part.r;
        const dy = (r * ch - o.part.y) / o.part.r;
        d -= Math.exp(-(dx * dx + dy * dy)) * 0.9;
      }
      out[r * cols + c] = d < 0.18 ? 0 : Math.min(1, (d - 0.18) * 1.6);
    }
  }
}

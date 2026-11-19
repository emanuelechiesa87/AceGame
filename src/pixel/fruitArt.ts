import { INK, shade, type Px } from './render';

/**
 * Frutti in pixel art ad alta definizione, generati da forme geometriche in
 * coordinate normalizzate (0..1 della tela). La stessa descrizione produce
 * l'icona 32×32 e l'immagine di rivelazione 64×64: a 64 la luce è sfumata con
 * retinatura (dithering), ci sono riflessi, bordo di luce e più dettagli.
 * Ogni frutto ha una gemma sfaccettata interna (niente spirali).
 */

type Pt = [number, number];
type ColorFn = (x: number, y: number) => string | undefined;
type Shape = 'round' | 'apple' | 'drop' | 'tall' | 'peach';

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const LIGHT = (() => { const l = [-0.5, -0.62, 0.6]; const n = Math.hypot(...l); return l.map((v) => v / n); })();

function hash(x: number, y: number, s = 0): number {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Scala di 5 toni: ombra profonda → luce. */
export function ramp(c: string): string[] {
  return [shade(c, -0.52), shade(c, -0.28), c, shade(c, 0.28), shade(c, 0.62)];
}

export class FruitCanvas {
  readonly cells = new Map<string, string>();
  readonly hi: boolean;
  constructor(readonly N: number) { this.hi = N >= 48; }
  set(x: number, y: number, c: string | undefined): void {
    if (!c || x < 1 || y < 1 || x > this.N - 2 || y > this.N - 2) return;
    this.cells.set(`${x},${y}`, c);
  }
  get(x: number, y: number): string | undefined { return this.cells.get(`${x},${y}`); }
  /** Retinatura: soglia ordinata per il pixel (0..1). */
  dither(x: number, y: number): number { return this.hi ? BAYER4[(y % 4) * 4 + (x % 4)] : [0.25, 0.75, 1, 0.5][(y % 2) * 2 + (x % 2)]; }
  /** Sceglie un tono da una scala con luce continua t (0..1), retinata. */
  tone(r: string[], t: number, x: number, y: number, spread = 0.55): string {
    const f = Math.max(0, Math.min(0.999, t)) * (r.length - 1);
    const i = Math.floor(f + (this.dither(x, y) - 0.5) * spread + 0.5 * (1 - spread));
    return r[Math.max(0, Math.min(r.length - 1, i))];
  }
  /** Riempie i pixel il cui centro è dentro `inside` (coordinate normalizzate). */
  fill(inside: (u: number, v: number) => boolean, color: string | ColorFn): void {
    const N = this.N;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = (x + 0.5) / N, v = (y + 0.5) / N;
      if (inside(u, v)) this.set(x, y, typeof color === 'string' ? color : color(x, y));
    }
  }
  poly(pts: Pt[], color: string | ColorFn): void { this.fill((u, v) => inPoly(pts, u, v), color); }
  /** Poligono con luce da in alto a sinistra. */
  polyLit(pts: Pt[], base: string): void {
    const r = ramp(base);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    this.poly(pts, (x, y) => {
      const u = ((x + 0.5) / this.N - x0) / Math.max(1e-3, x1 - x0), v = ((y + 0.5) / this.N - y0) / Math.max(1e-3, y1 - y0);
      return this.tone(r.slice(1), 1 - (u * 0.45 + v * 0.75) * 0.9, x, y);
    });
  }
  ell(cx: number, cy: number, rx: number, ry: number, color: string | ColorFn, rot = 0): void {
    const c = Math.cos(rot), s = Math.sin(rot);
    this.fill((u, v) => { const dx = u - cx, dy = v - cy; const a = (dx * c + dy * s) / rx, b = (-dx * s + dy * c) / ry; return a * a + b * b <= 1; }, color);
  }
  /** Ellisse "sferica" ombreggiata (foglie, bacche, gocce). */
  ellLit(cx: number, cy: number, rx: number, ry: number, base: string, rot = 0, spec = true): void {
    const r = ramp(base);
    const c = Math.cos(rot), s = Math.sin(rot);
    this.ell(cx, cy, rx, ry, (x, y) => {
      const dx = (x + 0.5) / this.N - cx, dy = (y + 0.5) / this.N - cy;
      const a = (dx * c + dy * s) / rx, b = (-dx * s + dy * c) / ry;
      const nx = (a * c - b * s), ny = (a * s + b * c);
      const nz = Math.sqrt(Math.max(0, 1 - a * a - b * b));
      const I = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
      if (spec && this.hi && I > 0.93) return r[4];
      return this.tone(r.slice(0, 4), (I + 0.25) / 1.15, x, y);
    }, rot);
  }
  line(x0: number, y0: number, x1: number, y1: number, color: string, w = 1 / 32): void {
    const N = this.N, steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * N * 2) + 1;
    const rr = Math.max(0.5, (w * N) / 2);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, cx = (x0 + (x1 - x0) * t) * N, cy = (y0 + (y1 - y0) * t) * N;
      for (let y = Math.floor(cy - rr); y <= Math.ceil(cy + rr); y++) for (let x = Math.floor(cx - rr); x <= Math.ceil(cx + rr); x++) {
        if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= rr * rr + 0.1) this.set(x, y, color);
      }
    }
  }
  /** Pixel singolo in coordinate normalizzate (a 64 diventa 2×2 se `big`). */
  dot(u: number, v: number, c: string, big = false): void {
    const x = Math.floor(u * this.N), y = Math.floor(v * this.N);
    this.set(x, y, c);
    if (big && this.hi) { this.set(x + 1, y, c); this.set(x, y + 1, c); this.set(x + 1, y + 1, c); }
  }
}

function inPoly(pts: Pt[], x: number, y: number): boolean {
  let ins = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}

// --- corpo del frutto ---------------------------------------------------------------
interface Body { cx: number; cy: number; rx: number; ry: number; shape: Shape }

function bodyInside(b: Body, u: number, v: number): { n: number[]; r: number } | null {
  let a = (u - b.cx) / b.rx, c = (v - b.cy) / b.ry;
  if (b.shape === 'drop') a /= 0.52 + 0.48 * Math.min(1, Math.max(0, (c + 1) / 1.35)) ** 0.7;
  let r = Math.hypot(a, c);
  if (b.shape === 'apple' || b.shape === 'round') {
    const dip = (b.shape === 'apple' ? 0.2 : 0.1) * Math.exp(-((a / 0.22) ** 2)) * Math.max(0, -c);
    r += dip;
    if (b.shape === 'apple') r += 0.06 * Math.exp(-((a / 0.25) ** 2)) * Math.max(0, c);
  }
  if (r > 1) return null;
  const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, a * a + c * c)));
  return { n: [a, c, nz], r };
}

export interface FruitDesign {
  body: string;
  gem: string;
  shape: Shape;
  /** Corpo (coordinate normalizzate): default centrato in basso. */
  box?: Partial<Pick<Body, 'cx' | 'cy' | 'rx' | 'ry'>>;
  /** Trama della buccia: restituisce un colore o undefined (tono di luce di default). */
  skin?: (k: SkinCtx) => string | undefined;
  /** Disegnato prima del corpo (dietro): foglie, fumo, aura. */
  back?: (c: FruitCanvas, b: Body) => void;
  /** Disegnato dopo il corpo, prima della gemma: picciolo, corona, decori. */
  top?: (c: FruitCanvas, b: Body) => void;
  /** Disegnato per ultimo (davanti a tutto): gocce, scintille. */
  front?: (c: FruitCanvas, b: Body) => void;
  gemAt?: Pt;
  gemSize?: number;
}

export interface SkinCtx { c: FruitCanvas; x: number; y: number; a: number; b: number; I: number; r: string[]; tone: (t: number) => string; edge: number }

export function drawFruit(px: Px, d: FruitDesign, N: number): void {
  const c = new FruitCanvas(N);
  const b: Body = { cx: 0.5, cy: 0.6, rx: 0.36, ry: 0.34, shape: d.shape, ...d.box };
  d.back?.(c, b);
  const r = ramp(d.body);
  c.fill((u, v) => bodyInside(b, u, v) !== null, (x, y) => {
    const u = (x + 0.5) / N, v = (y + 0.5) / N;
    const hit = bodyInside(b, u, v)!;
    const [a, bb, nz] = hit.n;
    const I = a * LIGHT[0] + bb * LIGHT[1] + nz * LIGHT[2];
    const t = (I + 0.32) / 1.3;
    const tone = (tt: number) => c.tone(r.slice(0, 4), tt, x, y);
    const k: SkinCtx = { c, x, y, a, b: bb, I, r, tone, edge: hit.r };
    const custom = d.skin?.(k);
    if (custom) return custom;
    if (c.hi && I > 0.9) return r[4];
    if (!c.hi && I > 0.96) return r[4];
    // luce riflessa sul bordo in basso a destra: arrotonda il volume
    if (hit.r > 0.86 && a + bb > 0.55) return r[1];
    return tone(t);
  });
  d.top?.(c, b);
  gem(c, d.gemAt ?? [b.cx, b.cy + b.ry * 0.12], d.gemSize ?? 0.105, d.gem);
  d.front?.(c, b);
  // contorno scuro attorno a ogni pixel colorato + bordo interno più scuro in basso
  const pts = [...c.cells.keys()].map((k) => k.split(',').map(Number) as Pt);
  for (const [x, y] of pts) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!c.cells.has(`${x + dx},${y + dy}`)) px(x + dx, y + dy, INK);
  for (const [x, y] of pts) px(x, y, c.cells.get(`${x},${y}`)!);
}

/** Gemma ottagonale sfaccettata con riflesso. */
function gem(c: FruitCanvas, [gx, gy]: Pt, g: number, col: string): void {
  const r = ramp(col);
  const N = c.N;
  const inside = (u: number, v: number) => { const dx = Math.abs(u - gx), dy = Math.abs(v - gy); return dx <= g && dy <= g * 1.05 && dx + dy <= g * 1.45; };
  // castone scuro
  c.fill((u, v) => { const dx = Math.abs(u - gx), dy = Math.abs(v - gy); return dx <= g + 1.1 / N && dy <= g * 1.05 + 1.1 / N && dx + dy <= g * 1.45 + 1.4 / N; }, shade(col, -0.62));
  c.fill(inside, (x, y) => {
    const dx = (x + 0.5) / N - gx, dy = (y + 0.5) / N - gy;
    const tbl = g * 0.42;
    if (Math.abs(dx) < tbl && Math.abs(dy) < tbl) return dx + dy < 0 ? r[3] : r[2];
    if (dy < -tbl) return dx < 0 ? r[4] : r[3];
    if (dy > tbl) return dx < 0 ? r[1] : r[0];
    return dx < 0 ? r[3] : r[1];
  });
  const s = Math.max(1, Math.round(g * N * 0.28));
  const sx = Math.floor((gx - g * 0.45) * N), sy = Math.floor((gy - g * 0.5) * N);
  for (let i = 0; i < s; i++) c.set(sx + i, sy, '#ffffff');
  if (c.hi) { c.set(sx, sy + 1, '#ffffff'); c.set(sx + Math.round(g * N * 1.1), sy + Math.round(g * N * 1.2), shade(col, 0.75)); }
}

// --- aiuti per i decori ---------------------------------------------------------------
const STEM = '#7a4a24';
function stem(c: FruitCanvas, x0: number, y0: number, x1: number, y1: number, col = STEM): void {
  c.line(x0, y0, x1, y1, shade(col, -0.2), 0.075);
  c.line(x0 - 0.01, y0, x1 - 0.01, y1, shade(col, 0.15), 0.03);
}
function leaf(c: FruitCanvas, cx: number, cy: number, len: number, rot: number, col = '#3fb36a'): void {
  c.ellLit(cx, cy, len, len * 0.42, col, rot, false);
  if (c.hi) c.line(cx - Math.cos(rot) * len * 0.8, cy - Math.sin(rot) * len * 0.8, cx + Math.cos(rot) * len * 0.7, cy + Math.sin(rot) * len * 0.7, shade(col, -0.35), 0.022);
}
function sparkle(c: FruitCanvas, u: number, v: number, col = '#ffffff', size = 2): void {
  const x = Math.floor(u * c.N), y = Math.floor(v * c.N);
  c.set(x, y, col);
  for (let i = 1; i <= size; i++) { c.set(x + i, y, col); c.set(x - i, y, col); c.set(x, y + i, col); c.set(x, y - i, col); }
}
/** Bacche a grani (lampone, gelso): pallini ombreggiati su griglia sfalsata. */
function drupelets(k: SkinCtx, step: number): string | undefined {
  const row = Math.floor((k.b + 2) / step);
  const off = row % 2 ? step / 2 : 0;
  const col = Math.floor((k.a + 2 + off) / step);
  const cu = col * step - 2 - off + step / 2, cv = row * step - 2 + step / 2;
  const lu = (k.a - cu) / (step / 2), lv = (k.b - cv) / (step / 2);
  const d = lu * lu + lv * lv;
  const base = (k.I + 0.32) / 1.3;
  if (d > 0.82) return k.tone(base - 0.38);
  if (lu < -0.15 && lv < -0.15 && d < 0.35 && k.c.hi && base > 0.45) return k.r[4];
  return k.tone(base + 0.22 - d * 0.3);
}

// --- i 13 frutti ------------------------------------------------------------------------
export const FRUIT_DESIGNS: Record<string, FruitDesign> = {
  // Bacca Brace: bacca rosso fuoco, lingue di fiamma in cima, braci che brillano sulla buccia
  fruit_ember: {
    body: '#f2552e', gem: '#ffe14a', shape: 'round',
    skin: (k) => (k.I < 0.55 && hash(k.x, k.y, 1) < (k.c.hi ? 0.035 : 0.05) ? (hash(k.x, k.y, 2) < 0.5 ? '#ffe14a' : '#ff9a2a') : undefined),
    back: (c) => {
      c.poly([[0.3, 0.33], [0.26, 0.17], [0.36, 0.24], [0.4, 0.05], [0.48, 0.2], [0.56, 0.02], [0.6, 0.2], [0.7, 0.1], [0.7, 0.33]], '#e4342f');
      c.poly([[0.36, 0.33], [0.36, 0.22], [0.43, 0.26], [0.48, 0.12], [0.53, 0.25], [0.58, 0.14], [0.63, 0.33]], '#ff9a2a');
      c.poly([[0.42, 0.33], [0.46, 0.24], [0.5, 0.28], [0.53, 0.2], [0.57, 0.33]], '#ffe14a');
      if (c.hi) c.poly([[0.47, 0.33], [0.5, 0.27], [0.53, 0.33]], '#fff7d6');
    },
    front: (c) => { if (c.hi) { c.dot(0.2, 0.2, '#ffcf3a', true); c.dot(0.82, 0.28, '#ff9a2a', true); c.dot(0.86, 0.16, '#ffe14a'); } },
  },
  // Mela Brina: mela azzurro ghiaccio con calotta di brina, fiocco di cristallo sul picciolo
  fruit_frost: {
    body: '#4cc3f0', gem: '#7ad7ff', shape: 'apple',
    skin: (k) => {
      const cap = -0.5 + 0.12 * Math.sin(k.a * 9) + 0.06 * Math.sin(k.a * 23);
      if (k.b < cap) return k.I > 0.55 ? '#ffffff' : k.I > 0.2 ? '#dff6ff' : '#a8e4fa';
      if (hash(k.x, k.y, 3) < 0.03 && k.I > 0.1) return '#eafcff';
      return undefined;
    },
    top: (c) => {
      stem(c, 0.5, 0.3, 0.52, 0.16, '#6a8aa0');
      const cx = 0.66, cy = 0.15, L = 0.1;
      for (let i = 0; i < 3; i++) { const a = (i * Math.PI) / 3; c.line(cx - Math.cos(a) * L, cy - Math.sin(a) * L, cx + Math.cos(a) * L, cy + Math.sin(a) * L, '#eafcff', 0.045); }
      c.dot(cx, cy, '#5fd3ff', true);
      if (c.hi) for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; c.dot(cx + Math.cos(a) * L * 0.6 + Math.sin(a) * 0.03, cy + Math.sin(a) * L * 0.6 - Math.cos(a) * 0.03, '#bff0ff'); }
    },
    front: (c) => { sparkle(c, 0.2, 0.42, '#ffffff', c.hi ? 2 : 1); if (c.hi) sparkle(c, 0.8, 0.82, '#dff6ff', 1); },
  },
  // Fico Granito: fico a goccia color sabbia, buccia granitica e venature di roccia
  fruit_stone: {
    body: '#c49a62', gem: '#ff8f5a', shape: 'drop', box: { cy: 0.58, rx: 0.33, ry: 0.36 },
    skin: (k) => {
      const h = hash(k.x, k.y, 4);
      if (h < 0.09) return '#8a7f78';
      if (h < 0.13) return '#e8dccb';
      const crack = Math.abs(k.a * 0.8 + 0.25 - Math.sin(k.b * 5) * 0.12);
      if (crack < (k.c.hi ? 0.035 : 0.06) && k.b > -0.3 && k.b < 0.85) return shade('#c49a62', -0.55);
      return undefined;
    },
    top: (c) => {
      stem(c, 0.5, 0.27, 0.47, 0.12, '#6e6e80');
      c.ellLit(0.36, 0.16, 0.06, 0.05, '#9a9aaa');
      c.ellLit(0.62, 0.18, 0.05, 0.04, '#7e7e90');
      if (c.hi) c.ellLit(0.7, 0.11, 0.03, 0.025, '#9a9aaa');
    },
  },
  // Pesca Tuono: pesca gialla vellutata con solco, fulmine azzurro in cima
  fruit_storm: {
    body: '#f7c933', gem: '#9ff0ff', shape: 'round',
    skin: (k) => {
      const groove = Math.abs(k.a - (0.18 + 0.22 * k.b) + 0.15 * k.b * k.b);
      if (groove < (k.c.hi ? 0.05 : 0.08) && k.b < 0.75) return k.tone((k.I + 0.32) / 1.3 - 0.45);
      if (k.c.hi && hash(k.x, k.y, 5) < 0.05 && k.I > 0.3) return '#fff1a8';
      return undefined;
    },
    top: (c) => {
      c.poly([[0.55, 0.02], [0.4, 0.2], [0.5, 0.2], [0.42, 0.34], [0.64, 0.14], [0.53, 0.14], [0.62, 0.02]], '#5fd3ff');
      c.poly([[0.56, 0.05], [0.46, 0.18], [0.52, 0.18], [0.5, 0.25], [0.58, 0.16], [0.54, 0.16]], '#e6fbff');
    },
    front: (c) => { sparkle(c, 0.2, 0.22, '#bff4ff', c.hi ? 2 : 1); sparkle(c, 0.82, 0.3, '#5fd3ff', 1); },
  },
  // Lampone Linfa: lampone verde-linfa a grani, foglie larghe e una goccia di rugiada
  fruit_life: {
    body: '#57cf78', gem: '#ff7fa6', shape: 'round', box: { ry: 0.33 },
    skin: (k) => drupelets(k, k.c.hi ? 0.36 : 0.5),
    back: (c) => { leaf(c, 0.33, 0.26, 0.15, -0.5, '#2f9e44'); leaf(c, 0.67, 0.26, 0.15, 0.5, '#2f9e44'); },
    top: (c) => { stem(c, 0.5, 0.29, 0.5, 0.13, '#5a8a2a'); leaf(c, 0.5, 0.25, 0.1, Math.PI / 2, '#3fb36a'); },
    front: (c) => { c.ellLit(0.76, 0.42, 0.045, 0.06, '#bff0ff'); },
  },
  // Gelso Molla: gelso rosa allungato a grani, picciolo a molla
  fruit_spring: {
    body: '#f2669c', gem: '#fff1a8', shape: 'drop', box: { cy: 0.62, rx: 0.3, ry: 0.34 },
    skin: (k) => drupelets(k, k.c.hi ? 0.34 : 0.48),
    top: (c) => {
      const pts: Pt[] = [];
      for (let i = 0; i <= 5; i++) pts.push([0.5 + (i % 2 ? 0.09 : -0.09), 0.3 - i * 0.05]);
      for (let i = 0; i < pts.length - 1; i++) c.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], '#5fc26f', 0.06);
      if (c.hi) for (let i = 0; i < pts.length - 1; i++) c.line(pts[i][0] - 0.01, pts[i][1] - 0.01, pts[i + 1][0] - 0.01, pts[i + 1][1] - 0.01, '#a8f0b0', 0.02);
      leaf(c, 0.64, 0.08, 0.08, 0.3, '#3fb36a');
    },
  },
  // Nespola Nebbia: nespola grigio-azzurra, velata, con riccioli di nebbia intorno
  fruit_mist: {
    body: '#b4c4dc', gem: '#c9b8ff', shape: 'round', box: { rx: 0.34, ry: 0.32 },
    skin: (k) => {
      const band = Math.sin(k.b * 9 + k.a * 3);
      if (band > 0.82 && k.I > -0.1) return '#eef3fb';
      return undefined;
    },
    top: (c) => { stem(c, 0.5, 0.31, 0.53, 0.2); leaf(c, 0.38, 0.22, 0.09, -0.3, '#7fa88a'); },
    front: (c) => {
      const wisp = (y: number, x0: number, x1: number, ph: number) => { for (let u = x0; u <= x1; u += 0.5 / c.N) c.dot(u, y + Math.sin(u * 18 + ph) * 0.02, '#f4f8ff'); };
      wisp(0.5, 0.06, 0.32, 0); wisp(0.78, 0.66, 0.95, 1.5);
      if (c.hi) { wisp(0.88, 0.12, 0.36, 3); wisp(0.24, 0.7, 0.9, 2); }
    },
  },
  // Cocco Zanna: noce di cocco pelosa con tre "occhi" e due zanne d'avorio
  fruit_fang: {
    body: '#9a6a3e', gem: '#fff1df', shape: 'round', box: { ry: 0.33 },
    skin: (k) => {
      const h = hash(k.x, Math.floor(k.y / (k.c.hi ? 2 : 1)), 6);
      if (h < 0.18) return k.tone((k.I + 0.32) / 1.3 - 0.3);
      if (h > 0.93 && k.I > 0.2) return '#c89a6a';
      return undefined;
    },
    top: (c) => {
      for (const [u, v] of [[0.42, 0.36], [0.58, 0.36], [0.5, 0.43]] as Pt[]) c.ell(u, v, 0.035, 0.03, '#3a2414');
      c.polyLit([[0.3, 0.3], [0.38, 0.3], [0.35, 0.08]], '#fff7e6');
      c.polyLit([[0.62, 0.3], [0.7, 0.3], [0.65, 0.08]], '#fff7e6');
    },
  },
  // Kiwi Colla: kiwi verde peloso che cola gocce di colla lucide
  fruit_glue: {
    body: '#94c83c', gem: '#fff7c2', shape: 'round', box: { cy: 0.56, ry: 0.32 },
    skin: (k) => (hash(k.x, k.y, 7) < 0.12 ? k.tone((k.I + 0.32) / 1.3 - 0.35) : undefined),
    top: (c) => { stem(c, 0.5, 0.26, 0.52, 0.14, '#6b4a2a'); leaf(c, 0.64, 0.17, 0.1, 0.4); },
    front: (c) => {
      for (const [u, len] of [[0.3, 0.12], [0.47, 0.2], [0.66, 0.09]] as Pt[]) {
        c.fill((x, y) => Math.abs(x - u) < 0.035 && y > 0.78 && y < 0.82 + len, '#c6ec6a');
        c.ellLit(u, 0.82 + len, 0.05, 0.05, '#c6ec6a');
      }
    },
  },
  // Prugna Specchio: prugna cromata a goccia con bande di riflesso e corona d'argento
  fruit_mirror: {
    body: '#6fd8f6', gem: '#ff9ad5', shape: 'drop', box: { rx: 0.34, ry: 0.35 },
    skin: (k) => {
      const s = k.a + k.b;
      if (s > -0.95 && s < -0.62) return '#ffffff';
      if (s > -0.42 && s < -0.3) return '#dff8ff';
      if (s > 0.55 && s < 0.7) return '#bfeffd';
      return undefined;
    },
    top: (c) => {
      c.poly([[0.38, 0.27], [0.36, 0.13], [0.43, 0.2], [0.5, 0.08], [0.57, 0.2], [0.64, 0.13], [0.62, 0.27]], '#c8d2e0');
      c.poly([[0.4, 0.26], [0.39, 0.18], [0.44, 0.22], [0.5, 0.13], [0.51, 0.26]], '#f4f8ff');
      c.dot(0.5, 0.1, '#ffffff', true);
    },
    front: (c) => { sparkle(c, 0.82, 0.24, '#ffffff', c.hi ? 3 : 1); },
  },
  // Ananas Orologio: ananas dorato a scaglie con corona di foglie e quattro tacche d'ora
  fruit_clock: {
    body: '#f2b632', gem: '#5fd3ff', shape: 'round', box: { cy: 0.62, rx: 0.3, ry: 0.32 },
    skin: (k) => {
      const f = k.c.hi ? 4.2 : 3;
      const p = (k.a + k.b) * f, q = (k.a - k.b) * f;
      const dp = Math.abs(p - Math.round(p)), dq = Math.abs(q - Math.round(q));
      if (Math.min(dp, dq) < (k.c.hi ? 0.09 : 0.14)) return k.tone((k.I + 0.32) / 1.3 - 0.42);
      if (k.c.hi && dp > 0.38 && dq > 0.38 && k.I > 0.1) return k.r[3];
      return undefined;
    },
    back: (c) => {
      const L: [number, number, number][] = [[0.5, 0.02, 0], [0.38, 0.08, -0.5], [0.62, 0.08, 0.5], [0.3, 0.17, -0.9], [0.7, 0.17, 0.9]];
      for (const [u, v, a] of L) c.polyLit([[u - 0.05, 0.32], [u + Math.sin(a) * 0.05, v], [u + 0.05, 0.32]], '#3fb36a');
    },
    top: (c, b) => {
      for (const [u, v] of [[b.cx, b.cy - b.ry * 0.78], [b.cx, b.cy + b.ry * 0.78], [b.cx - b.rx * 0.78, b.cy], [b.cx + b.rx * 0.78, b.cy]] as Pt[]) c.ell(u, v, 0.022, 0.022, '#8a5a12');
    },
  },
  // Melagrana Magnete: melagrana rossa con la corona a ferro di cavallo calamitato
  fruit_magnet: {
    body: '#d9302c', gem: '#fff1df', shape: 'round', box: { cy: 0.62, ry: 0.32 },
    skin: (k) => (k.c.hi && hash(k.x, k.y, 8) < 0.04 && k.I > 0 ? '#ff8a7a' : undefined),
    top: (c) => {
      const ring = (u: number, v: number) => { const d = Math.hypot(u - 0.5, (v - 0.2) * 1.1); return d < 0.17 && d > 0.08 && v < 0.24; };
      c.fill(ring, (_x, y) => (y / c.N < 0.14 ? '#7a7a8e' : '#5a5a6e'));
      c.fill((u, v) => ring(u, v) && v < 0.12 && u < 0.5, '#9a9aae');
      c.fill((u, v) => (Math.abs(u - 0.375) < 0.045 || Math.abs(u - 0.625) < 0.045) && v >= 0.2 && v < 0.31, (x) => (x / c.N < 0.5 ? '#e4342f' : '#dfe7f2'));
    },
    front: (c) => { if (c.hi) { c.line(0.22, 0.16, 0.28, 0.1, '#ffcf3a', 0.025); c.line(0.78, 0.16, 0.72, 0.1, '#ffcf3a', 0.025); c.line(0.16, 0.24, 0.24, 0.24, '#ffcf3a', 0.025); c.line(0.84, 0.24, 0.76, 0.24, '#ffcf3a', 0.025); } },
  },
  // Susina d'Ombra: susina viola a goccia, fumo d'ombra che sale e venature scure
  fruit_shadow: {
    body: '#8a5cf0', gem: '#ff5f8a', shape: 'drop', box: { rx: 0.34, ry: 0.35 },
    skin: (k) => {
      const vein = Math.abs(Math.sin(k.a * 6 + k.b * 2.5));
      if (vein < 0.08 && k.b > 0.1) return k.tone((k.I + 0.32) / 1.3 - 0.45);
      return undefined;
    },
    back: (c) => {
      c.poly([[0.42, 0.3], [0.32, 0.18], [0.38, 0.12], [0.34, 0.03], [0.46, 0.12], [0.5, 0.22], [0.58, 0.08], [0.66, 0.05], [0.62, 0.16], [0.6, 0.3]], '#3a2068');
      c.poly([[0.45, 0.3], [0.4, 0.2], [0.44, 0.16], [0.5, 0.25], [0.6, 0.12], [0.57, 0.3]], '#5a3a9a');
    },
    front: (c) => { if (c.hi) { c.dot(0.2, 0.3, '#c9a8ff'); c.dot(0.84, 0.5, '#c9a8ff'); c.dot(0.16, 0.66, '#5a3a9a', true); } },
  },
};

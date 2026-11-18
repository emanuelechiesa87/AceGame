import Phaser from 'phaser';

/** Disegna un rettangolo in "pixel d'arte" (coordinate della griglia, non dello schermo). */
export type Px = (x: number, y: number, c: string, w?: number, h?: number) => void;

/**
 * Crea una texture disegnata a bassa risoluzione. `scale` = pixel di canvas per
 * pixel d'arte: con scale > 1 la texture è già ingrandita (pixel netti anche se
 * la scena la riduce). Filtro "nearest" sempre attivo.
 */
export function pixelTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (px: Px) => void, scale = 1): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, Math.ceil(w * scale), Math.ceil(h * scale))!;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  draw((x, y, c, pw = 1, ph = 1) => {
    if (pw <= 0 || ph <= 0) return;
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x * scale), Math.round(y * scale), Math.round(pw * scale), Math.round(ph * scale));
  });
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

/** Alias storico: texture procedurale a 1 px di canvas per pixel d'arte. */
export function drawTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (px: Px) => void): void {
  pixelTexture(scene, key, w, h, draw, 1);
}

/** Schiarisce (+) o scurisce (−) un colore esadecimale. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

export const INK = '#1f1633';

/**
 * Blocco "voxel": contorno scuro, riempimento, riga di luce in alto e colonna
 * d'ombra a destra/in basso. È il mattone di tutti i personaggi a blocchi.
 */
export function block(px: Px, x: number, y: number, w: number, h: number, fill: string, opts: { outline?: boolean; light?: boolean; dark?: boolean } = {}): void {
  const { outline = true, light = true, dark = true } = opts;
  if (outline) px(x, y, INK, w, h);
  const o = outline ? 1 : 0;
  px(x + o, y + o, fill, w - 2 * o, h - 2 * o);
  if (light && w - 2 * o > 1) px(x + o, y + o, shade(fill, 0.28), w - 2 * o, 1);
  if (dark && w - 2 * o > 2) px(x + w - o - 1, y + o + 1, shade(fill, -0.22), 1, h - 2 * o - 1);
  if (dark && h - 2 * o > 2) px(x + o, y + h - o - 1, shade(fill, -0.22), w - 2 * o, 1);
}

/** Griglia a caratteri → pixel (righe più corte vengono completate con '.'). */
export function grid(px: Px, rows: string[], pal: Record<string, string>, ox = 0, oy = 0): void {
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.' || ch === ' ') return;
    const c = pal[ch];
    if (!c) throw new Error(`colore '${ch}' non in palette`);
    px(ox + x, oy + y, c);
  }));
}

/** Rende simmetrica una griglia scritta a metà. */
export function mirror(half: string[], width: number): string[] {
  const hw = width / 2;
  return half.map((r) => { const h = r.padEnd(hw, '.').slice(0, hw); return h + [...h].reverse().join(''); });
}

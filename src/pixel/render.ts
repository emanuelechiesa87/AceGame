import Phaser from 'phaser';
import type { Grid, Palette } from './sprites';

/** Crea una texture Phaser da una griglia di pixel, con filtro "nearest" (pixel netti). */
export function gridTexture(scene: Phaser.Scene, key: string, grid: Grid, pal: Palette, scale = 1): void {
  if (scene.textures.exists(key)) return;
  const w = grid[0].length, h = grid.length;
  const tex = scene.textures.createCanvas(key, w * scale, h * scale)!;
  const ctx = tex.getContext();
  grid.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '.') return;
    const col = pal[c];
    if (!col) throw new Error(`${key}: colore '${c}' non in palette`);
    ctx.fillStyle = col;
    ctx.fillRect(x * scale, y * scale, scale, scale);
  }));
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

/** Texture disegnata a basso dettaglio con una funzione (sfondi procedurali). */
export function drawTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (px: (x: number, y: number, c: string, pw?: number, ph?: number) => void) => void): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h)!;
  const ctx = tex.getContext();
  draw((x, y, c, pw = 1, ph = 1) => { ctx.fillStyle = c; ctx.fillRect(Math.floor(x), Math.floor(y), pw, ph); });
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

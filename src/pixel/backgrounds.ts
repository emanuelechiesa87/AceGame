import type Phaser from 'phaser';
import { drawTexture } from './render';

/**
 * Sfondi del porto in pixel art, generati a bassa risoluzione (1 px = 4 px
 * logici). Ogni strato orizzontale si ripete senza giunture (larghezza 180).
 */
export const PX = 4;
const W = 180;

function rnd(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function makePortTextures(scene: Phaser.Scene): void {
  // Cielo a bande (stile 16 bit) con sole e uccelli
  drawTexture(scene, 'px-sky', W, 200, (px) => {
    const bands = ['#3b5bdb', '#4c6ef5', '#5c7cfa', '#748ffc', '#91a7ff', '#bac8ff', '#ffd8a8', '#ffc078'];
    bands.forEach((c, i) => px(0, i * 25, c, W, 25));
    // dithering tra le bande
    for (let i = 1; i < bands.length; i++) for (let x = 0; x < W; x += 2) px(x + (i % 2), i * 25 - 1, bands[i]);
    for (let y = -10; y <= 10; y++) for (let x = -10; x <= 10; x++) if (x * x + y * y <= 100) px(162 + x, 150 + y, x * x + y * y > 70 ? '#ffe066' : '#fff3bf');
    [[30, 40], [36, 44], [60, 30]].forEach(([x, y]) => { px(x, y, '#1f1633', 2, 1); px(x + 2, y - 1, '#1f1633', 2, 1); px(x - 2, y - 1, '#1f1633', 2, 1); });
  });
  // Nuvole
  drawTexture(scene, 'px-clouds', W, 60, (px) => {
    const r = rnd(4);
    for (let i = 0; i < 4; i++) {
      const cx = i * 45 + r() * 15, cy = 15 + r() * 30, w = 22 + r() * 14;
      for (const dx of [-W, 0, W]) {
        px(cx + dx, cy, '#ffffff', w, 6); px(cx + 4 + dx, cy - 4, '#ffffff', w - 10, 4); px(cx + 8 + dx, cy - 7, '#ffffff', w - 18, 3);
        px(cx + dx, cy + 6, '#dbe4ff', w, 2);
      }
    }
  });
  // Isola lontana con palme e una nave (vela con stemma originale: una gemma)
  drawTexture(scene, 'px-island', W, 70, (px) => {
    for (let x = 20; x < 90; x++) { const h = Math.round(18 - Math.abs(x - 55) * 0.45); px(x, 60 - h, '#2b8a3e', 1, h); px(x, 60 - h, '#51cf66', 1, 1); }
    px(15, 58, '#e9c46a', 80, 3);
    const palm = (x: number, y: number) => { px(x, y, '#8d5524', 2, 14); [[-6, 0], [-3, -2], [2, -2], [5, 0]].forEach(([dx, dy]) => px(x + dx, y + dy, '#2f9e44', 4, 2)); };
    palm(40, 32); palm(66, 36);
    // nave
    px(100, 52, '#6b3a1e', 40, 6); px(102, 58, '#5f3520', 36, 2); px(98, 50, '#8a5232', 44, 2);
    px(119, 18, '#3a2a1a', 2, 34);
    px(106, 22, '#fff7e6', 26, 16); px(108, 38, '#f1e3c6', 22, 4);
    px(116, 26, '#e4342f', 6, 6); px(117, 27, '#ffcf3a', 4, 4); // gemma rossa: stemma inventato
    px(120, 14, '#e4342f', 8, 4);
  });
  // Mare: due tonalità con creste che scorrono
  drawTexture(scene, 'px-sea', W, 50, (px) => {
    px(0, 0, '#1c7ed6', W, 50); px(0, 20, '#1971c2', W, 30); px(0, 38, '#1864ab', W, 12);
    for (let x = 0; x < W; x += 12) { px(x, 4 + (x % 24 ? 0 : 3), '#a5d8ff', 6, 1); px(x + 5, 16 + (x % 36 ? 0 : 2), '#74c0fc', 5, 1); px(x + 2, 30, '#4dabf7', 4, 1); }
  });
  // Pontile in legno
  drawTexture(scene, 'px-dock', W, 70, (px) => {
    px(0, 0, '#8a5232', W, 70);
    for (let y = 0; y < 70; y += 10) { px(0, y, '#a9693c', W, 2); px(0, y + 9, '#5f3520', W, 1); }
    const r = rnd(8);
    for (let y = 0; y < 70; y += 10) for (let x = (y / 10) % 2 ? 0 : 18; x < W; x += 36) px(x, y + 2, '#5f3520', 1, 7);
    for (let i = 0; i < 25; i++) px(Math.floor(r() * W), Math.floor(r() * 70), '#4a2a14', 1, 1);
    px(0, 0, '#1f1633', W, 1);
  });
  // Pali del pontile nell'acqua (sotto)
  drawTexture(scene, 'px-posts', W, 40, (px) => {
    for (let x = 6; x < W; x += 30) { px(x, 0, '#5f3520', 6, 40); px(x, 0, '#8a5232', 2, 40); }
  });
}

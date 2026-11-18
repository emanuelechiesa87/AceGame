import type Phaser from 'phaser';
import { INK, pixelTexture } from './render';

/**
 * Sfondi piratesci in pixel art (1 pixel d'arte = PX pixel logici). Ogni
 * strato orizzontale è largo W e si ripete senza giunture: tutto ciò che
 * sborda a destra viene ridisegnato anche a sinistra (e viceversa).
 */
export const PX = 4;
export const W = 180;
/** Scala della raggiera "fx-speedlines" (texture 150×150). */
export const FX_SCALE = 6;

function rnd(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

type P = (x: number, y: number, c: string, w?: number, h?: number) => void;
/** Disegna ripetendo a ±W: niente giunture quando lo strato scorre. */
const wrap = (px: P): P => (x, y, c, w = 1, h = 1) => { for (const dx of [-W, 0, W]) px(x + dx, y, c, w, h); };

export const SKY_H = 300;
export const SKY_TOP = '#2c3f9e';

export function makeBackgroundTextures(scene: Phaser.Scene): void {
  // Cielo a bande (stile 16 bit), più caldo verso l'orizzonte
  pixelTexture(scene, 'px-sky', W, SKY_H, (px) => {
    const bands = ['#2c3f9e', '#3449b3', '#3b5bdb', '#4c6ef5', '#5c7cfa', '#748ffc', '#91a7ff', '#bac8ff', '#ffd8a8', '#ffc078'];
    const bh = SKY_H / bands.length;
    bands.forEach((c, i) => px(0, i * bh, c, W, bh + 1));
    for (let i = 1; i < bands.length; i++) for (let x = 0; x < W; x += 2) { px(x + (i % 2), i * bh - 1, bands[i]); px(x + ((i + 1) % 2), i * bh, bands[i - 1]); }
    const r = rnd(3);
    for (let i = 0; i < 30; i++) px(Math.floor(r() * W), Math.floor(r() * 80), '#dbe4ff');
  });
  pixelTexture(scene, 'px-sun', 24, 24, (px) => {
    for (let y = -11; y <= 11; y++) for (let x = -11; x <= 11; x++) { const d = x * x + y * y; if (d <= 121) px(12 + x, 12 + y, d > 85 ? '#ffd43b' : '#fff3bf'); }
  });
  // Nuvole squadrate
  pixelTexture(scene, 'px-clouds', W, 50, (p) => {
    const px = wrap(p), r = rnd(4);
    for (let i = 0; i < 4; i++) {
      const cx = Math.floor(i * 45 + r() * 15), cy = Math.floor(14 + r() * 26), w = Math.floor(22 + r() * 14);
      px(cx, cy, '#ffffff', w, 6); px(cx + 4, cy - 4, '#ffffff', w - 10, 4); px(cx + 8, cy - 7, '#ffffff', w - 18, 3);
      px(cx, cy + 6, '#c5d0f5', w, 2);
    }
  });
  // Orizzonte: isole con palme, un faro e una nave lontana (vela con stemma inventato)
  pixelTexture(scene, 'px-island', W, 50, (p) => {
    const px = wrap(p);
    for (let x = 10; x < 80; x++) { const h = Math.round(16 - Math.abs(x - 45) * 0.42); if (h > 0) { px(x, 48 - h, '#2b8a3e', 1, h); px(x, 48 - h, '#51cf66', 1, 1); } }
    px(6, 46, '#e9c46a', 80, 2);
    const palm = (x: number, y: number) => { px(x, y, '#8d5524', 2, 12); [[-6, 0], [-3, -2], [2, -2], [5, 0]].forEach(([dx, dy]) => px(x + dx, y + dy, '#2f9e44', 4, 2)); };
    palm(30, 26); palm(56, 28);
    // faro a blocchi
    px(150, 22, '#fff7e6', 6, 26); px(150, 28, '#e4342f', 6, 4); px(150, 38, '#e4342f', 6, 4); px(149, 18, '#3a3550', 8, 4); px(151, 19, '#ffe066', 4, 2);
    px(138, 46, '#6e6e80', 30, 2); px(142, 44, '#8a8a9a', 20, 2);
    // nave
    px(96, 40, '#6b3a1e', 34, 5); px(98, 45, '#5f3520', 30, 2); px(94, 38, '#8a5232', 40, 2);
    px(112, 8, '#3a2a1a', 2, 30);
    px(100, 12, '#fff7e6', 24, 15); px(102, 27, '#f1e3c6', 20, 4);
    px(109, 16, '#e4342f', 6, 6); px(110, 17, '#ffcf3a', 4, 4);
    px(113, 4, '#e4342f', 7, 4);
  });
  // Mare: tonalità a bande con creste di schiuma
  pixelTexture(scene, 'px-sea', W, 60, (p) => {
    const px = wrap(p);
    px(0, 0, '#1c7ed6', W, 60); px(0, 18, '#1971c2', W, 22); px(0, 40, '#1864ab', W, 20);
    for (let x = 0; x < W; x += 12) { px(x, 3 + (x % 24 ? 0 : 3), '#a5d8ff', 6, 1); px(x + 5, 14 + (x % 36 ? 0 : 2), '#74c0fc', 5, 1); px(x + 2, 28, '#4dabf7', 4, 1); px(x + 8, 46, '#339af0', 3, 1); }
  });
  // Pontile del porto (esplorazione)
  pixelTexture(scene, 'px-dock', W, 120, (p) => {
    const px = wrap(p), r = rnd(8);
    px(0, 0, '#8a5232', W, 120);
    for (let y = 0; y < 120; y += 10) { px(0, y, '#a9693c', W, 2); px(0, y + 9, '#5f3520', W, 1); }
    for (let y = 0; y < 120; y += 10) for (let x = (y / 10) % 2 ? 0 : 18; x < W; x += 36) { px(x, y + 2, '#5f3520', 1, 7); px(x + 3, y + 4, '#d9e1ef', 1, 1); }
    for (let i = 0; i < 40; i++) px(Math.floor(r() * W), Math.floor(r() * 120), '#4a2a14');
    px(0, 0, INK, W, 1); px(0, 1, '#c98a50', W, 1);
  });
  // Ponte della nave (battaglia): assi più chiare con chiodi e una botola
  pixelTexture(scene, 'px-deck', W, 120, (p) => {
    const px = wrap(p), r = rnd(11);
    px(0, 0, '#a9693c', W, 120);
    for (let y = 0; y < 120; y += 8) { px(0, y + 7, '#6b3a1e', W, 1); px(0, y, '#c98a50', W, 1); }
    for (let y = 0; y < 120; y += 8) for (let x = (y / 8) % 2 ? 7 : 25; x < W; x += 40) { px(x, y + 1, '#6b3a1e', 1, 6); px(x + 2, y + 3, '#3a3550', 1, 1); }
    for (let i = 0; i < 30; i++) px(Math.floor(r() * W), Math.floor(r() * 120), '#8a5232', 2, 1);
    // botola con griglia
    px(120, 30, INK, 24, 16); px(121, 31, '#5f3520', 22, 14);
    for (let x = 124; x < 142; x += 4) px(x, 31, '#3a2414', 1, 14);
    px(0, 0, INK, W, 1);
  });
  // Parapetto della nave dietro ai combattenti (battaglia)
  pixelTexture(scene, 'px-rail', W, 24, (p) => {
    const px = wrap(p);
    px(0, 0, INK, W, 5); px(0, 1, '#a9693c', W, 3); px(0, 1, '#c98a50', W, 1);
    for (let x = 4; x < W; x += 15) { px(x, 5, INK, 5, 19); px(x + 1, 5, '#8a5232', 3, 19); px(x + 1, 5, '#a9693c', 1, 19); }
    px(0, 18, INK, W, 6); px(0, 19, '#6b3a1e', W, 4);
    // cime arrotolate
    px(60, 0, '#d9c9a0', 6, 2); px(140, 0, '#d9c9a0', 6, 2);
  });
  // Primo piano dell'esplorazione: pali con cima, botti e casse
  pixelTexture(scene, 'px-front', W, 36, (p) => {
    const px = wrap(p);
    const post = (x: number) => { px(x, 4, INK, 8, 32); px(x + 1, 5, '#6b3a1e', 6, 31); px(x + 1, 5, '#8a5232', 2, 31); px(x - 1, 2, INK, 10, 4); px(x, 3, '#8a5232', 8, 2); };
    post(10); post(100);
    for (let x = 18; x < 100; x++) px(x, 10 + Math.round(Math.sin((x - 18) / 82 * Math.PI) * 6), '#d9c9a0', 1, 2);
    // botte
    px(48, 14, INK, 18, 22); px(49, 15, '#a9693c', 16, 21); px(49, 19, '#7a8494', 16, 2); px(49, 29, '#7a8494', 16, 2); px(50, 15, '#c98a50', 2, 21);
    // cassa
    px(140, 16, INK, 22, 20); px(141, 17, '#c98a50', 20, 19); px(141, 17, '#8a5232', 20, 2); px(141, 26, '#8a5232', 20, 2); px(150, 17, '#8a5232', 2, 19);
  });
  // Raggiera per titoli e rivelazioni
  pixelTexture(scene, 'fx-speedlines', 150, 150, (px) => {
    for (let y = 0; y < 150; y++) for (let x = 0; x < 150; x++) {
      const dx = x - 75, dy = y - 75, d = Math.hypot(dx, dy);
      if (d > 75 || d < 6) continue;
      const a = Math.atan2(dy, dx);
      if (Math.floor(((a + Math.PI) / (2 * Math.PI)) * 16) % 2 === 0) px(x, y, d > 60 ? 'rgba(255,216,168,0.35)' : 'rgba(255,243,191,0.5)');
    }
  });
}

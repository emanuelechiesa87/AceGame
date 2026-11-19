import type Phaser from 'phaser';
import { INK, pixelTexture } from './render';

/**
 * Sfondi piratesci in pixel art a doppia risoluzione (1 pixel d'arte = PX pixel
 * logici). Ogni strato orizzontale è largo W e si ripete senza giunture: tutto
 * ciò che sborda a destra viene ridisegnato anche a sinistra (e viceversa).
 * Le forme grandi sono descritte a "mezza risoluzione" (helper `big`) e poi
 * rifinite con dettagli a pixel singolo (venature, riflessi, sartiame, schiuma).
 */
export const PX = 2;
export const W = 360;
/** Scala della raggiera "fx-speedlines" (texture 300×300). */
export const FX_SCALE = 3;

/** Altezze degli strati in pixel d'arte. */
export const SKY_H = 600;
export const CLOUDS_H = 100;
export const ISLAND_H = 100;
export const SEA_H = 120;
export const GROUND_H = 240;
export const RAIL_H = 48;
export const FRONT_H = 72;
export const SKY_TOP = '#2c3f9e';

function rnd(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

type P = (x: number, y: number, c: string, w?: number, h?: number) => void;
/** Disegna ripetendo a ±W: niente giunture quando lo strato scorre. */
const wrap = (px: P): P => (x, y, c, w = 1, h = 1) => { for (const dx of [-W, 0, W]) px(x + dx, y, c, w, h); };
/** Coordinate a mezza risoluzione (forme grandi). */
const big = (px: P): P => (x, y, c, w = 1, h = 1) => px(x * 2, y * 2, c, w * 2, h * 2);

export function makeBackgroundTextures(scene: Phaser.Scene): void {
  // Cielo a bande con transizioni retinate fini e stelline in alto
  pixelTexture(scene, 'px-sky', W, SKY_H, (px) => {
    const bands = ['#2c3f9e', '#3449b3', '#3b5bdb', '#4c6ef5', '#5c7cfa', '#748ffc', '#91a7ff', '#bac8ff', '#ffd8a8', '#ffc078'];
    const bh = SKY_H / bands.length;
    bands.forEach((c, i) => px(0, i * bh, c, W, bh + 1));
    for (let i = 1; i < bands.length; i++) {
      const y = i * bh;
      for (let x = 0; x < W; x += 2) { px(x + (i % 2), y - 2, bands[i]); px(x + ((i + 1) % 2), y - 1, bands[i]); px(x + (i % 2), y, bands[i - 1]); }
      for (let x = 0; x < W; x += 4) { px(x, y - 4, bands[i]); px(x + 2, y + 2, bands[i - 1]); }
    }
    const r = rnd(3);
    for (let i = 0; i < 70; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * 170); px(x, y, i % 9 ? '#dbe4ff' : '#ffffff'); if (i % 13 === 0) { px(x - 1, y, '#9fb2ff'); px(x + 1, y, '#9fb2ff'); px(x, y - 1, '#9fb2ff'); px(x, y + 1, '#9fb2ff'); } }
  });
  // Sole con alone a gradini e riflesso
  pixelTexture(scene, 'px-sun', 48, 48, (px) => {
    for (let y = -23; y <= 23; y++) for (let x = -23; x <= 23; x++) {
      const d = x * x + y * y;
      if (d > 529) continue;
      px(24 + x, 24 + y, d > 460 ? '#ffc94a' : d > 380 ? '#ffd43b' : (x + y < -18 && d < 200) ? '#ffffff' : '#fff3bf');
    }
  });
  // Nuvole a cumulo con base ombreggiata e bordo retinato
  pixelTexture(scene, 'px-clouds', W, CLOUDS_H, (p) => {
    const px = wrap(p), r = rnd(4);
    for (let i = 0; i < 4; i++) {
      const cx = Math.floor(i * 90 + r() * 30), cy = Math.floor(30 + r() * 50), w = Math.floor(44 + r() * 28);
      const bumps = [[0, 0, w, 12], [8, -8, w - 20, 8], [16, -14, w - 36, 6], [w - 26, -10, 14, 10]];
      for (const [dx, dy, ww, hh] of bumps) { px(cx + dx + 2, cy + dy, '#ffffff', ww - 4, hh); px(cx + dx, cy + dy + 2, '#ffffff', ww, hh - 2); }
      px(cx + 10, cy - 12, '#ffffff', 6, 2);
      px(cx, cy + 10, '#dbe4ff', w, 2); px(cx + 2, cy + 12, '#c5d0f5', w - 4, 2);
      for (let x = cx + 1; x < cx + w - 1; x += 2) px(x, cy + 9, '#dbe4ff');
    }
  });
  // Orizzonte: isole con palme, un faro e una nave lontana (vela con stemma inventato)
  pixelTexture(scene, 'px-island', W, ISLAND_H, (p) => {
    const px = wrap(p), b = big(px);
    for (let x = 20; x < 160; x++) {
      const h = Math.round(32 - Math.abs(x - 90) * 0.42 + Math.sin(x / 7) * 1.5);
      if (h <= 0) continue;
      px(x, 96 - h, '#2b8a3e', 1, h);
      px(x, 96 - h, x < 90 ? '#51cf66' : '#40c057', 1, 2);
      if (x % 3 === 0 && h > 6) px(x, 96 - h + 4 + (x % 5), '#237032', 1, 2);
    }
    px(12, 92, '#e9c46a', 160, 4); px(12, 92, '#f4dc9a', 160, 1);
    const palm = (x: number, y: number) => {
      for (let i = 0; i < 24; i++) px(x + Math.round(i / 8), y + i, i % 4 ? '#8d5524' : '#6b3a1e', 3, 1);
      const fronds: [number, number][] = [[-12, 2], [-7, -3], [3, -4], [10, 1], [-10, 6], [9, 6]];
      for (const [dx, dy] of fronds) for (let k = 0; k < 6; k++) px(x + 1 + Math.round(dx * k / 6), y + Math.round(dy * k / 6) + Math.round(k * k / 12), k < 3 ? '#37b24d' : '#2f9e44', 2, 2);
      px(x - 1, y + 1, '#6b3a1e', 2, 2); px(x + 2, y + 2, '#6b3a1e', 2, 2);
    };
    palm(60, 52); palm(112, 56);
    // faro a blocchi con finestrelle e luce
    b(150, 22, '#fff7e6', 6, 26); b(150, 28, '#e4342f', 6, 4); b(150, 38, '#e4342f', 6, 4); b(149, 18, '#3a3550', 8, 4); b(151, 19, '#ffe066', 4, 2);
    px(301, 44, '#f1e3c6', 2, 52); px(310, 44, '#d9c9a0', 2, 52);
    px(305, 52, '#3a3550', 2, 3); px(305, 68, '#3a3550', 2, 3);
    px(300, 36, '#fff3bf', 12, 1); px(296, 40, '#fff3bf', 4, 1); px(312, 40, '#fff3bf', 4, 1);
    b(138, 46, '#6e6e80', 30, 2); b(142, 44, '#8a8a9a', 20, 2); px(284, 88, '#a5a5b5', 40, 1);
    // nave con scafo a fasce, oblò, sartiame e bandierina
    b(96, 40, '#6b3a1e', 34, 5); b(98, 45, '#5f3520', 30, 2); b(94, 38, '#8a5232', 40, 2);
    px(192, 82, '#8a5232', 66, 1); px(196, 86, '#4a2a14', 60, 1);
    for (let x = 200; x < 252; x += 8) px(x, 84, '#ffcf3a', 2, 2);
    b(112, 8, '#3a2a1a', 2, 30);
    b(100, 12, '#fff7e6', 24, 15); b(102, 27, '#f1e3c6', 20, 4);
    px(200, 24, '#ffffff', 48, 1); px(200, 50, '#e8d8b4', 48, 4);
    b(109, 16, '#e4342f', 6, 6); b(110, 17, '#ffcf3a', 4, 4); px(222, 36, '#fff3b0', 2, 2);
    b(113, 4, '#e4342f', 7, 4); px(228, 9, '#a8211e', 12, 1);
    for (let i = 0; i < 14; i++) { px(198 - i, 22 + i * 4, '#3a2a1a'); px(254 + i, 22 + i * 4, '#3a2a1a'); }
  });
  // Mare: bande di blu, creste di schiuma e riflessi del sole
  pixelTexture(scene, 'px-sea', W, SEA_H, (p) => {
    const px = wrap(p);
    px(0, 0, '#1c7ed6', W, SEA_H); px(0, 36, '#1971c2', W, 44); px(0, 80, '#1864ab', W, 40);
    for (let x = 0; x < W; x += 2) { px(x, 35, '#1c7ed6'); px(x + 1, 79, '#1971c2'); }
    for (let x = 0; x < W; x += 24) {
      const a = (x / 24) % 3;
      px(x, 6 + a * 2, '#a5d8ff', 12, 1); px(x + 2, 5 + a * 2, '#e7f5ff', 6, 1);
      px(x + 10, 28 + a * 3, '#74c0fc', 10, 1); px(x + 12, 27 + a * 3, '#a5d8ff', 4, 1);
      px(x + 4, 56, '#4dabf7', 8, 1); px(x + 16, 92, '#339af0', 6, 1);
    }
    for (let i = 0; i < 18; i++) px(200 + ((i * 37) % 120), 2 + ((i * 11) % 30), '#fff3bf', 2 + (i % 3), 1);
  });
  // Pontile del porto (esplorazione): assi con venature, nodi e chiodi
  pixelTexture(scene, 'px-dock', W, GROUND_H, (p) => {
    const px = wrap(p), r = rnd(8);
    px(0, 0, '#8a5232', W, GROUND_H);
    for (let y = 0; y < GROUND_H; y += 20) {
      px(0, y, '#a9693c', W, 3); px(0, y + 1, '#c98a50', W, 1); px(0, y + 18, '#5f3520', W, 2); px(0, y + 17, '#6b3a1e', W, 1);
      for (let k = 0; k < 6; k++) { const gx = Math.floor(r() * W), gy = y + 5 + Math.floor(r() * 10); px(gx, gy, '#7a4a28', 10 + Math.floor(r() * 24), 1); }
    }
    for (let y = 0; y < GROUND_H; y += 20) for (let x = (y / 20) % 2 ? 0 : 36; x < W; x += 72) {
      px(x, y + 3, '#4a2a14', 2, 15); px(x + 2, y + 3, '#a9693c', 1, 15);
      px(x + 6, y + 8, '#d9e1ef', 2, 2); px(x + 6, y + 8, '#ffffff', 1, 1); px(x - 8, y + 8, '#d9e1ef', 2, 2);
    }
    for (let i = 0; i < 16; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * GROUND_H); px(x, y, '#5f3520', 4, 3); px(x + 1, y + 1, '#3a2414', 2, 1); }
    px(0, 0, INK, W, 2); px(0, 2, '#d99a60', W, 1);
  });
  // Ponte della nave (battaglia): assi chiare con chiodi, venature e una botola
  pixelTexture(scene, 'px-deck', W, GROUND_H, (p) => {
    const px = wrap(p), r = rnd(11);
    px(0, 0, '#a9693c', W, GROUND_H);
    for (let y = 0; y < GROUND_H; y += 16) {
      px(0, y + 14, '#6b3a1e', W, 2); px(0, y, '#c98a50', W, 1); px(0, y + 1, '#b97a46', W, 1);
      for (let k = 0; k < 5; k++) { const gx = Math.floor(r() * W), gy = y + 4 + Math.floor(r() * 8); px(gx, gy, '#94592f', 12 + Math.floor(r() * 20), 1); }
    }
    for (let y = 0; y < GROUND_H; y += 16) for (let x = (y / 16) % 2 ? 14 : 50; x < W; x += 80) { px(x, y + 2, '#6b3a1e', 2, 12); px(x + 4, y + 6, '#3a3550', 2, 2); px(x + 4, y + 6, '#9aa0b5', 1, 1); }
    // botola con griglia
    px(240, 60, INK, 48, 32); px(242, 62, '#5f3520', 44, 28); px(242, 62, '#7a4a28', 44, 2);
    for (let x = 248; x < 284; x += 8) { px(x, 62, '#3a2414', 2, 28); px(x + 2, 62, '#7a4a28', 1, 28); }
    px(0, 0, INK, W, 2);
  });
  // Parapetto della nave dietro ai combattenti (battaglia)
  pixelTexture(scene, 'px-rail', W, RAIL_H, (p) => {
    const px = wrap(p);
    px(0, 0, INK, W, 10); px(0, 2, '#a9693c', W, 6); px(0, 2, '#d99a60', W, 1); px(0, 7, '#8a5232', W, 1);
    for (let x = 8; x < W; x += 30) { px(x, 10, INK, 10, 38); px(x + 2, 10, '#8a5232', 6, 38); px(x + 2, 10, '#b97a46', 2, 38); px(x + 7, 10, '#6b3a1e', 1, 38); }
    px(0, 36, INK, W, 12); px(0, 38, '#6b3a1e', W, 8); px(0, 38, '#8a5232', W, 1);
    // cime arrotolate
    for (const x of [120, 280]) { px(x, 0, '#b8a880', 12, 4); px(x + 1, 0, '#e8dcb8', 10, 1); px(x + 2, 2, '#9a8a60', 2, 1); px(x + 7, 2, '#9a8a60', 2, 1); }
  });
  // Primo piano dell'esplorazione: pali con cima, botti e casse
  pixelTexture(scene, 'px-front', W, FRONT_H, (p) => {
    const px = wrap(p);
    const post = (x: number) => {
      px(x, 8, INK, 16, 64); px(x + 2, 10, '#6b3a1e', 12, 62); px(x + 2, 10, '#8a5232', 4, 62); px(x + 11, 10, '#4a2a14', 2, 62);
      px(x - 2, 4, INK, 20, 8); px(x, 6, '#8a5232', 16, 4); px(x, 6, '#b97a46', 16, 1);
      for (let y = 24; y < 70; y += 14) px(x + 3, y, '#4a2a14', 8, 1);
    };
    post(20); post(200);
    for (let x = 36; x < 200; x++) { const y = 20 + Math.round(Math.sin((x - 36) / 164 * Math.PI) * 12); px(x, y, '#d9c9a0', 1, 3); if (x % 4 === 0) px(x, y + 1, '#a89870'); }
    // botte cerchiata
    px(96, 28, INK, 36, 44); px(98, 30, '#a9693c', 32, 42); px(98, 30, '#c98a50', 4, 42); px(124, 30, '#8a5232', 4, 42);
    for (const y of [36, 58]) { px(98, y, '#7a8494', 32, 4); px(98, y, '#b9c3d6', 32, 1); }
    for (let x = 106; x < 124; x += 6) px(x, 31, '#8a5232', 1, 40);
    // cassa con assi incrociate
    px(280, 32, INK, 44, 40); px(282, 34, '#c98a50', 40, 38); px(282, 34, '#8a5232', 40, 4); px(282, 52, '#8a5232', 40, 4); px(300, 34, '#8a5232', 4, 38);
    px(282, 34, '#e0a868', 40, 1);
    for (let i = 0; i < 16; i++) px(284 + i, 38 + i, '#a9693c', 2, 1);
  });
  // Raggiera per titoli e rivelazioni (doppia risoluzione: raggi più lisci)
  pixelTexture(scene, 'fx-speedlines', 300, 300, (px) => {
    for (let y = 0; y < 300; y++) for (let x = 0; x < 300; x++) {
      const dx = x - 150, dy = y - 150, d = Math.hypot(dx, dy);
      if (d > 150 || d < 12) continue;
      const a = Math.atan2(dy, dx);
      if (Math.floor(((a + Math.PI) / (2 * Math.PI)) * 16) % 2 === 0) px(x, y, d > 120 ? 'rgba(255,216,168,0.35)' : 'rgba(255,243,191,0.5)');
    }
  });
}

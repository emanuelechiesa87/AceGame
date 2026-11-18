import type Phaser from 'phaser';
import { TEXTURE_SCALE } from '../app/config';
import { creatureKey } from './keys';
import { block, INK, pixelTexture, shade, type Px } from './render';

/**
 * Nemici del mare e compagni, tutti "a blocchi". Ogni creatura ha due
 * texture: normale e colpita (occhi a X). Le texture sono già ingrandite
 * (CR_PX × TEXTURE_SCALE pixel di canvas per pixel d'arte) così le scene
 * continuano a usare la scala `s / TEXTURE_SCALE`.
 */
export const CR_PX = 6;

type Draw = (px: Px, hit: boolean) => void;
interface Def { w: number; h: number; draw: Draw }

/** Occhi a blocchi: normali, arrabbiati o a X (colpito). */
function eyes(px: Px, x: number, y: number, gap: number, hit: boolean, mood: 'ok' | 'angry' = 'ok', size = 2): void {
  for (const ex of [x, x + gap]) {
    if (hit) {
      // X da 3×3 (leggibile anche quando l'occhio normale è 2×2)
      px(ex, y, INK); px(ex + 2, y, INK); px(ex + 1, y + 1, INK); px(ex, y + 2, INK); px(ex + 2, y + 2, INK);
      continue;
    }
    px(ex, y, '#ffffff', size, size);
    px(ex + size - 1, y + (size > 2 ? 1 : 0), INK, 1, size > 2 ? size - 1 : size);
  }
  if (mood === 'angry' && !hit) {
    px(x - 1, y - 2, INK, 2, 1); px(x + 1, y - 1, INK, 1, 1);
    px(x + gap + size - 1, y - 2, INK, 2, 1); px(x + gap + size - 2, y - 1, INK, 1, 1);
  }
}

function bandana(px: Px, x: number, y: number, w: number, col: string): void {
  px(x, y, INK, w, 3);
  px(x + 1, y + 1, col, w - 2, 1);
  px(x - 2, y + 1, INK, 2, 3); px(x - 1, y + 2, col, 1, 1);
}

/** Cappello da capitano squadrato con stemma inventato (gemma). */
function captainHat(px: Px, x: number, y: number, w: number, col = '#2a2140'): void {
  block(px, x, y + 4, w, 3, col);
  block(px, x + 2, y, w - 4, 5, col);
  px(x + 2, y + 4, '#ffcf3a', w - 4, 1);
  const cx = x + Math.floor(w / 2) - 1;
  px(cx, y + 1, '#e4342f', 2, 2); px(cx, y + 1, '#ff9a8a', 1, 1);
}

const DEFS: Record<string, Def> = {
  // --- Medusa Molla: campana cubica traslucida con tentacoli e benda sull'occhio --------------
  en_jelly: {
    w: 22, h: 24,
    draw: (px, hit) => {
      const c = '#c77dff';
      const t = (x: number, len: number, off: number) => { for (let i = 0; i < len; i++) px(x + ((i + off) % 4 < 2 ? 0 : 1), 13 + i, i === len - 1 ? INK : shade(c, -0.15), 2, 1); };
      t(4, 9, 0); t(8, 11, 2); t(12, 10, 1); t(16, 8, 3);
      block(px, 2, 2, 18, 12, c);
      px(4, 3, '#efd6ff', 6, 2); px(4, 5, '#efd6ff', 2, 1); // riflesso
      px(5, 8, '#ff9ad5', 2, 1); px(15, 8, '#ff9ad5', 2, 1);
      eyes(px, 7, 6, 6, hit);
      if (!hit) { px(12, 5, INK, 4, 3); px(6, 4, INK, 10, 1); } // benda
      if (hit) px(9, 10, INK, 3, 2); else { px(9, 10, INK, 4, 1); px(8, 9, INK, 1, 1); px(13, 9, INK, 1, 1); }
    },
  },
  // --- Gabbiano Predone: corpo a cubo, ali alzate, becco a blocchi, bandana rossa ----------------
  en_bat: {
    w: 26, h: 22,
    draw: (px, hit) => {
      const wing = '#9aa7bd';
      block(px, 1, 4, 7, 6, wing); px(2, 2, INK, 4, 3); px(3, 3, wing, 2, 1);
      block(px, 18, 4, 7, 6, wing); px(20, 2, INK, 4, 3); px(21, 3, wing, 2, 1);
      px(2, 9, INK, 6, 1); px(18, 9, INK, 6, 1);
      block(px, 7, 6, 12, 11, '#f6f4ee');
      px(8, 13, '#d9dde6', 10, 3);
      bandana(px, 7, 4, 12, '#e4342f');
      eyes(px, 9, 9, 6, hit, 'angry');
      block(px, 11, 12, 5, 3, '#ffb21a'); px(12, 14, '#e07a00', 3, 1);
      if (hit) px(12, 15, INK, 3, 1);
      px(9, 17, INK, 3, 4); px(10, 18, '#ff8a2a', 1, 2); px(14, 17, INK, 3, 4); px(15, 18, '#ff8a2a', 1, 2);
      px(8, 20, INK, 5, 1); px(13, 20, INK, 5, 1);
    },
  },
  // --- Granchio Ladro: corpo largo, chele enormi, occhi sugli steli ----------------------------
  en_shroom: { w: 28, h: 20, draw: (px, hit) => crab(px, hit, '#ff5a3d', false) },
  // --- Granchio Capitano (élite): più scuro, tricorno e orecchino d'oro --------------------------
  en_shroom_boss: { w: 28, h: 26, draw: (px, hit) => crab(px, hit, '#c2304f', true) },
  // --- Capitan Pancia-Palla (boss): pesce palla cubico con aculei e cappello da capitano -----
  en_pudding_king: {
    w: 36, h: 36,
    draw: (px, hit) => {
      const c = '#ffc23a';
      // aculei a blocchi attorno al corpo
      for (let i = 0; i < 6; i++) { px(6 + i * 4, 9, INK, 2, 3); px(6 + i * 4, 33, INK, 2, 2); }
      for (let i = 0; i < 5; i++) { px(1, 13 + i * 4, INK, 3, 2); px(32, 13 + i * 4, INK, 3, 2); }
      // pinne
      px(0, 20, INK, 4, 6); px(1, 21, '#ff8a2a', 2, 4);
      px(32, 19, INK, 4, 7); px(33, 20, '#ff8a2a', 2, 5);
      block(px, 3, 11, 30, 23, c);
      px(5, 25, '#fff1c2', 26, 7); // pancia chiara
      for (let x = 8; x < 30; x += 5) px(x, 27, '#f2d48a', 2, 1);
      px(5, 13, '#ffe08a', 8, 2);
      // cappello
      captainHat(px, 6, 2, 24);
      eyes(px, 10, 16, 12, hit, 'angry', 3);
      // bocca a cuore sporgente
      if (hit) { px(16, 23, INK, 4, 3); px(17, 24, '#ff6b8a', 2, 1); }
      else { px(15, 23, INK, 6, 2); px(16, 24, '#ff6b8a', 4, 1); px(14, 22, INK, 1, 1); px(21, 22, INK, 1, 1); }
      px(7, 21, '#ff9a6a', 2, 1); px(27, 21, '#ff9a6a', 2, 1);
    },
  },
  // --- Bobo: orso marinaio con berretto e coperchio di botte come scudo --------------------------
  comp_bobo: {
    w: 22, h: 24,
    draw: (px, hit) => {
      const fur = '#9a6236';
      block(px, 4, 14, 12, 9, '#fff3dc'); // maglia
      px(5, 17, '#26386b', 10, 1); px(5, 19, '#26386b', 10, 1);
      px(5, 22, INK, 4, 2); px(11, 22, INK, 4, 2);
      block(px, 3, 3, 14, 12, fur);
      block(px, 2, 1, 4, 4, fur); block(px, 14, 1, 4, 4, fur); // orecchie quadrate
      px(3, 2, '#e8a87c', 2, 2); px(15, 2, '#e8a87c', 2, 2);
      // berretto da marinaio
      px(5, 1, INK, 10, 3); px(6, 1, '#fff3dc', 8, 1); px(6, 2, '#26386b', 8, 1);
      block(px, 7, 9, 6, 5, '#e8c39a'); px(9, 9, INK, 2, 2);
      eyes(px, 5, 6, 8, hit);
      if (hit) px(9, 12, INK, 2, 1); else { px(8, 12, INK, 4, 1); }
      // scudo: coperchio di botte
      block(px, 13, 11, 9, 11, '#b8743c');
      px(14, 14, '#7a8494', 7, 1); px(14, 18, '#7a8494', 7, 1);
      px(17, 12, '#8a5232', 1, 9);
    },
  },
  // --- Lumi: spiritello-lanterna di bordo, vetro luminoso e faccina ------------------------------
  comp_lumi: {
    w: 16, h: 24,
    draw: (px, hit) => {
      px(3, 2, '#ffe9a0', 10, 18); // alone
      px(6, 0, INK, 4, 4); px(7, 1, '#3a3550', 2, 2); px(7, 1, '#ffe9a0', 2, 1); // anello
      block(px, 3, 3, 10, 3, '#4a4560');
      block(px, 2, 6, 12, 12, '#3a3550');
      px(4, 7, '#ffcf3a', 8, 10); px(4, 7, '#fff3b0', 3, 4);
      px(7, 6, '#3a3550', 2, 12); // montante centrale del vetro
      eyes(px, 4, 10, 6, hit, 'ok', 2);
      if (hit) px(7, 14, INK, 2, 2); else { px(6, 14, INK, 4, 1); px(5, 13, INK, 1, 1); px(10, 13, INK, 1, 1); }
      block(px, 4, 18, 8, 3, '#4a4560');
      px(6, 21, '#ffcf3a', 4, 1); px(7, 22, '#ff8a2a', 2, 2); // fiammella
    },
  },
  // --- Zip: volpe-razzo con bandana verde mare e occhialoni ------------------------------------
  comp_zip: {
    w: 26, h: 22,
    draw: (px, hit) => {
      const fur = '#ff8a2a';
      // coda grande a blocchi con punta bianca
      block(px, 0, 8, 8, 6, fur); block(px, 0, 4, 5, 5, '#fff3dc');
      block(px, 6, 13, 12, 7, fur);
      px(8, 17, '#fff3dc', 8, 2);
      px(8, 19, INK, 3, 3); px(14, 19, INK, 3, 3);
      block(px, 9, 3, 13, 11, fur);
      block(px, 9, 0, 4, 4, fur); block(px, 18, 0, 4, 4, fur); px(10, 1, INK, 2, 2); px(19, 1, INK, 2, 2);
      block(px, 17, 9, 8, 5, '#fff3dc'); px(23, 10, INK, 2, 2); // muso
      bandana(px, 10, 3, 12, '#1fb5a0');
      px(11, 1, INK, 9, 2); px(12, 1, '#7ad7ff', 2, 1); px(17, 1, '#7ad7ff', 2, 1); // occhialoni
      eyes(px, 13, 7, 5, hit);
      if (hit) px(19, 12, INK, 2, 1); else px(18, 12, INK, 3, 1);
    },
  },
};

function crab(px: Px, hit: boolean, c: string, captain: boolean): void {
  const oy = captain ? 6 : 0;
  // zampe
  for (const x of [5, 9, 17, 21]) { px(x, 15 + oy, INK, 2, 5); px(x, 16 + oy, shade(c, -0.25), 1, 3); }
  // chele
  block(px, 0, 4 + oy, 7, 6, c); px(2, 3 + oy, INK, 3, 2); px(0, 7 + oy, INK, 3, 1);
  block(px, 21, 4 + oy, 7, 6, c); px(23, 3 + oy, INK, 3, 2); px(25, 7 + oy, INK, 3, 1);
  px(5, 9 + oy, INK, 3, 3); px(20, 9 + oy, INK, 3, 3);
  // corpo
  block(px, 6, 8 + oy, 16, 9, c);
  px(8, 14 + oy, shade(c, 0.3), 12, 1);
  // occhi sugli steli
  px(10, 4 + oy, INK, 2, 5); px(16, 4 + oy, INK, 2, 5);
  if (hit) { px(9, 2 + oy, INK, 4, 3); px(15, 2 + oy, INK, 4, 3); px(10, 3 + oy, '#ffffff', 2, 1); px(16, 3 + oy, '#ffffff', 2, 1); }
  else { px(9, 2 + oy, INK, 4, 3); px(15, 2 + oy, INK, 4, 3); px(10, 3 + oy, '#ffffff', 1, 1); px(16, 3 + oy, '#ffffff', 1, 1); }
  // bocca e sopracciglia
  if (!hit) { px(9, 10 + oy, INK, 3, 1); px(16, 10 + oy, INK, 3, 1); px(11, 13 + oy, INK, 6, 1); px(11, 12 + oy, INK, 1, 1); px(16, 12 + oy, INK, 1, 1); }
  else px(12, 12 + oy, INK, 4, 2);
  if (captain) {
    captainHat(px, 7, 0, 14);
    px(6, 11 + oy, '#ffcf3a', 1, 2); // orecchino
    if (!hit) px(15, 1 + oy, INK, 5, 4); // benda sull'occhio
  } else bandana(px, 8, 7, 12, '#ffcf3a');
}

export interface CreatureArt { w: number; h: number }

/** Dimensioni logiche (a scala 1) di ogni creatura. */
export const CREATURES: Record<string, CreatureArt> = Object.fromEntries(Object.entries(DEFS).map(([id, d]) => [id, { w: d.w * CR_PX, h: d.h * CR_PX }]));

/** Scala di disegno in battaglia. */
export const CREATURE_SCALE: Record<string, number> = {
  en_jelly: 1.2, en_bat: 1.15, en_shroom: 1.15, en_shroom_boss: 1.45, en_pudding_king: 1.55,
  comp_bobo: 1, comp_lumi: 1, comp_zip: 1,
};

export function makeCreatureTextures(scene: Phaser.Scene): void {
  for (const [id, d] of Object.entries(DEFS)) {
    for (const hit of [false, true]) pixelTexture(scene, creatureKey(id, hit), d.w, d.h, (px) => d.draw(px, hit), CR_PX * TEXTURE_SCALE);
  }
}

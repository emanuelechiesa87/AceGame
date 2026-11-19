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
export const CR_PX = 3;

type Draw = (px: Px, hit: boolean) => void;
interface Def { w: number; h: number; draw: Draw }

const GOLD = '#ffcf3a';

/** Blocco con angoli smussati (creature più morbide) e ombreggiatura a bande. */
function rblock(px: Px, x: number, y: number, w: number, h: number, fill: string, r = 2): void {
  for (let i = 0; i <= r; i++) px(x + r - i, y + i, INK, w - 2 * (r - i), h - 2 * i);
  for (let i = 0; i <= r; i++) px(x + 1 + r - i, y + 1 + i, fill, w - 2 - 2 * (r - i), h - 2 - 2 * i);
  px(x + r + 1, y + 1, shade(fill, 0.3), w - 2 * r - 2, 1);
  px(x + 1, y + r + 1, shade(fill, 0.18), 1, h - 2 * r - 2);
  px(x + r + 1, y + h - 2, shade(fill, -0.25), w - 2 * r - 2, 1);
  px(x + w - 2, y + r + 1, shade(fill, -0.2), 1, h - 2 * r - 2);
}

/** Occhi: bianco con pupilla, iride e riflesso; arrabbiati o a X (colpito). */
function eyes(px: Px, x: number, y: number, gap: number, hit: boolean, mood: 'ok' | 'angry' = 'ok', size = 4, iris = '#2a7fd4'): void {
  for (const ex of [x, x + gap]) {
    if (hit) {
      for (let i = 0; i < size + 1; i++) { px(ex + i, y + i, INK, 1, 1); px(ex + size - i, y + i, INK, 1, 1); }
      continue;
    }
    px(ex, y, '#ffffff', size, size);
    px(ex + Math.ceil(size / 2), y, INK, Math.floor(size / 2), size);
    px(ex + Math.ceil(size / 2), y + size - 1, iris, Math.floor(size / 2), 1);
    px(ex + Math.ceil(size / 2), y, '#ffffff', 1, 1);
  }
  if (mood === 'angry' && !hit) {
    px(x - 1, y - 3, INK, 3, 1); px(x + 2, y - 2, INK, 2, 1);
    px(x + gap + size - 2, y - 3, INK, 3, 1); px(x + gap + size - 4, y - 2, INK, 2, 1);
  }
}

function bandana(px: Px, x: number, y: number, w: number, col: string): void {
  px(x, y, INK, w, 6);
  px(x + 1, y + 1, col, w - 2, 4); px(x + 1, y + 1, shade(col, 0.3), w - 2, 1); px(x + 1, y + 4, shade(col, -0.25), w - 2, 1);
  for (let i = x + 3; i < x + w - 3; i += 6) px(i, y + 2, '#fff3dc', 2, 2);
  px(x - 4, y + 2, INK, 5, 7); px(x - 3, y + 3, col, 3, 5);
}

/** Cappello da capitano squadrato con stemma inventato (gemma). */
function captainHat(px: Px, x: number, y: number, w: number, col = '#2a2140'): void {
  block(px, x, y + 8, w, 6, col);
  block(px, x + 4, y, w - 8, 10, col);
  px(x + 5, y + 1, shade(col, 0.35), 3, 7);
  px(x + 4, y + 8, GOLD, w - 8, 2); px(x + 4, y + 9, shade(GOLD, -0.3), w - 8, 1);
  const cx = x + Math.floor(w / 2) - 2;
  px(cx - 1, y + 1, INK, 6, 6); px(cx, y + 2, '#e4342f', 4, 4); px(cx, y + 2, '#ff9a8a', 2, 2); px(cx + 3, y + 5, '#a8211e', 1, 1);
}

const DEFS: Record<string, Def> = {
  // --- Medusa Molla: campana traslucida, smerlo, tentacoli ondulati e benda sull'occhio --------
  en_jelly: {
    w: 44, h: 48,
    draw: (px, hit) => {
      const c = '#c77dff';
      const t = (x: number, len: number, off: number) => {
        for (let i = 0; i < len; i++) {
          const dx = Math.round(Math.sin((i + off) / 2.2) * 2);
          px(x + dx - 1, 26 + i, INK, 5, 1);
          px(x + dx, 26 + i, i > len - 3 ? shade(c, -0.4) : shade(c, -0.1), 3, 1);
          px(x + dx + 1, 26 + i, shade(c, 0.35), 1, 1);
        }
      };
      t(9, 18, 0); t(17, 21, 2); t(25, 19, 4); t(33, 16, 1);
      rblock(px, 4, 4, 36, 24, c, 5);
      for (let x = 6; x < 38; x += 5) { px(x, 26, INK, 4, 2); px(x + 1, 26, shade(c, -0.3), 2, 1); } // smerlo
      px(9, 7, '#efd6ff', 10, 3); px(9, 10, '#efd6ff', 3, 2); px(21, 8, '#efd6ff', 2, 1); // riflessi
      px(29, 19, shade(c, 0.25), 3, 3); px(12, 21, shade(c, 0.25), 2, 2); // bollicine
      px(10, 17, '#ff9ad5', 4, 2); px(30, 17, '#ff9ad5', 4, 2);
      eyes(px, 13, 12, 13, hit, 'ok', 4, '#7a3ab0');
      if (!hit) { px(24, 10, INK, 9, 7); px(25, 11, '#2a2140', 7, 5); px(12, 9, INK, 22, 1); } // benda
      if (hit) { px(19, 19, INK, 6, 4); px(20, 20, '#ff6b8a', 4, 2); }
      else { px(18, 21, INK, 8, 1); px(17, 20, INK, 1, 1); px(26, 20, INK, 1, 1); px(20, 22, '#ff6b8a', 4, 1); }
    },
  },
  // --- Gabbiano Predone: corpo a cubo, ali piumate, becco, zampe e bandana rossa --------------
  en_bat: {
    w: 52, h: 44,
    draw: (px, hit) => {
      const wing = '#9aa7bd';
      // ali alzate a ventaglio: righe sempre più larghe verso il basso, punte scure
      const w = (edge: number, dir: number) => {
        for (let r = 0; r < 16; r++) {
          const len = 3 + Math.round(r * 0.75), y = 4 + r, x0 = dir < 0 ? edge - len : edge;
          px(x0 - 1, y, INK, len + 2, 1);
          px(x0, y, r > 12 ? '#3a3550' : r % 4 === 3 ? shade(wing, -0.22) : wing, len, 1);
          px(dir < 0 ? x0 : x0 + len - 1, y, r > 12 ? '#3a3550' : shade(wing, -0.35), 1, 1);
        }
        px(dir < 0 ? edge - 15 : edge, 20, INK, 16, 1);
        px(dir < 0 ? edge - 3 : edge + 1, 6, shade(wing, 0.35), 2, 8);
      };
      w(15, -1); w(37, 1);
      block(px, 14, 12, 24, 22, '#f6f4ee');
      px(16, 26, '#d9dde6', 20, 6); for (let x = 17; x < 35; x += 4) px(x, 28, '#c5cad6', 2, 1);
      bandana(px, 14, 8, 24, '#e4342f');
      eyes(px, 18, 17, 12, hit, 'angry', 4, '#e09a12');
      block(px, 22, 24, 10, 6, '#ffb21a'); px(23, 25, '#ffe08a', 7, 1); px(24, 28, '#e07a00', 6, 1); px(30, 27, INK, 2, 2);
      if (hit) px(24, 30, INK, 6, 2);
      px(18, 34, INK, 5, 8); px(19, 35, '#ff8a2a', 3, 6); px(28, 34, INK, 5, 8); px(29, 35, '#ff8a2a', 3, 6);
      px(16, 41, INK, 9, 2); px(17, 41, '#e07a00', 7, 1); px(26, 41, INK, 9, 2); px(27, 41, '#e07a00', 7, 1);
    },
  },
  // --- Granchio Ladro: corpo largo, chele enormi, occhi sugli steli ----------------------------
  en_shroom: { w: 56, h: 40, draw: (px, hit) => crab(px, hit, '#ff5a3d', false) },
  // --- Granchio Capitano (élite): più scuro, cappello e orecchino d'oro -------------------------
  en_shroom_boss: { w: 56, h: 52, draw: (px, hit) => crab(px, hit, '#c2304f', true) },
  // --- Capitan Pancia-Palla (boss): pesce palla cubico con aculei e cappello da capitano -----
  en_pudding_king: {
    w: 72, h: 74,
    draw: (px, hit) => {
      const c = '#ffc23a';
      // aculei a punta attorno al corpo
      const spike = (x: number, y: number, dx: number, dy: number) => {
        for (let i = 0; i < 4; i++) {
          const l = 7 - i * 2;
          if (dy) px(x + i, y + dy * i, INK, l, 1); else px(x + dx * i, y + i, INK, 1, l);
          if (i < 3 && l > 2) { if (dy) px(x + i + 1, y + dy * i, '#fff1c2', l - 2, 1); else px(x + dx * i, y + i + 1, '#fff1c2', 1, l - 2); }
        }
      };
      for (let i = 0; i < 6; i++) { spike(11 + i * 8, 21, 0, -1); spike(11 + i * 8, 68, 0, 1); }
      for (let i = 0; i < 5; i++) { spike(5, 26 + i * 8, -1, 0); spike(66, 26 + i * 8, 1, 0); }
      // pinne
      px(0, 40, INK, 8, 12); px(1, 41, '#ff8a2a', 6, 10); px(1, 41, '#ffb36a', 6, 2); px(2, 46, '#e06a1a', 4, 1);
      px(64, 38, INK, 8, 14); px(65, 39, '#ff8a2a', 6, 12); px(65, 39, '#ffb36a', 6, 2); px(66, 45, '#e06a1a', 4, 1);
      rblock(px, 6, 22, 60, 46, c, 4);
      px(10, 50, '#fff1c2', 52, 14); px(10, 50, '#ffe6a0', 52, 1); // pancia chiara
      for (let x = 14; x < 60; x += 8) { px(x, 54, '#f2d48a', 4, 2); px(x + 4, 58, '#f2d48a', 3, 2); }
      px(10, 26, '#ffe08a', 16, 4); px(10, 30, '#ffe08a', 4, 6);
      for (const [x, y] of [[30, 30], [46, 28], [52, 40], [18, 40]]) px(x, y, '#e8a628', 3, 2); // macchie
      captainHat(px, 12, 6, 48);
      eyes(px, 20, 33, 24, hit, 'angry', 6, '#2a7fd4');
      if (hit) { px(31, 46, INK, 9, 6); px(33, 48, '#ff6b8a', 5, 2); }
      else { px(29, 46, INK, 13, 4); px(30, 47, '#a8211e', 11, 2); px(32, 48, '#ff6b8a', 7, 1); px(28, 44, INK, 2, 2); px(41, 44, INK, 2, 2); }
      px(14, 42, '#ff9a6a', 5, 2); px(53, 42, '#ff9a6a', 5, 2);
    },
  },
  // --- Bobo: orso marinaio con berretto e coperchio di botte come scudo --------------------------
  comp_bobo: {
    w: 44, h: 48,
    draw: (px, hit) => {
      const fur = '#9a6236';
      block(px, 8, 28, 24, 18, '#fff3dc'); // maglia a righe
      for (let y = 32; y < 44; y += 4) px(9, y, '#26386b', 22, 2);
      px(10, 44, INK, 8, 4); px(11, 44, shade(fur, -0.2), 6, 3); px(22, 44, INK, 8, 4); px(23, 44, shade(fur, -0.2), 6, 3);
      rblock(px, 6, 6, 28, 24, fur, 3);
      for (let i = 0; i < 10; i++) px(9 + ((i * 7) % 22), 9 + ((i * 5) % 16), shade(fur, -0.15), 2, 1); // pelo
      block(px, 4, 2, 9, 9, fur); block(px, 27, 2, 9, 9, fur);
      px(6, 4, '#e8a87c', 5, 5); px(29, 4, '#e8a87c', 5, 5);
      // berretto da marinaio con pompon
      px(10, 2, INK, 20, 6); px(11, 3, '#fff3dc', 18, 2); px(11, 5, '#26386b', 18, 2); px(18, 0, INK, 4, 3); px(19, 0, '#e4342f', 2, 2);
      rblock(px, 14, 18, 12, 10, '#e8c39a', 2); px(17, 18, INK, 6, 3); px(18, 18, '#5a3a2a', 2, 1);
      eyes(px, 10, 12, 16, hit, 'ok', 4, '#5a3a1e');
      if (hit) px(18, 24, INK, 4, 2); else { px(16, 24, INK, 8, 1); px(15, 23, INK, 1, 1); px(24, 23, INK, 1, 1); }
      px(9, 20, '#e88a7c', 3, 2); px(28, 20, '#e88a7c', 3, 2);
      // scudo: coperchio di botte cerchiato
      rblock(px, 26, 22, 18, 22, '#b8743c', 3);
      px(28, 27, '#7a8494', 14, 2); px(28, 37, '#7a8494', 14, 2); px(28, 27, '#b9c3d6', 14, 1);
      px(34, 24, '#8a5232', 2, 18); px(30, 24, '#d08a50', 1, 18);
    },
  },
  // --- Lumi: spiritello-lanterna di bordo, vetro luminoso e faccina ------------------------------
  comp_lumi: {
    w: 32, h: 48,
    draw: (px, hit) => {
      px(4, 6, '#fff3c2', 24, 34); px(2, 10, '#fff3c2', 28, 26); // alone
      px(12, 0, INK, 8, 8); px(14, 2, '#fff3c2', 4, 4); px(13, 1, '#6a6580', 6, 1); // anello
      block(px, 6, 6, 20, 6, '#4a4560'); px(7, 7, '#6a6580', 18, 1);
      block(px, 4, 12, 24, 24, '#3a3550');
      px(7, 14, '#ffcf3a', 18, 20); px(7, 14, '#fff3b0', 7, 8); px(8, 15, '#ffffff', 3, 3);
      px(19, 26, '#ffb21a', 6, 8);
      px(15, 12, '#3a3550', 2, 24); px(4, 23, '#3a3550', 24, 2); // montanti del vetro
      eyes(px, 8, 18, 12, hit, 'ok', 4, '#e07a00');
      if (hit) px(14, 28, INK, 4, 3); else { px(12, 29, INK, 8, 1); px(11, 28, INK, 1, 1); px(20, 28, INK, 1, 1); px(14, 30, '#ff6b8a', 4, 1); }
      px(8, 27, '#ff9a6a', 3, 1); px(21, 27, '#ff9a6a', 3, 1);
      block(px, 8, 36, 16, 6, '#4a4560'); px(9, 37, '#6a6580', 14, 1);
      px(12, 42, '#ffcf3a', 8, 2); px(13, 44, '#ff8a2a', 6, 2); px(15, 46, '#e4342f', 2, 2); // fiammella
    },
  },
  // --- Zip: volpe-razzo con bandana verde mare e occhialoni ------------------------------------
  comp_zip: {
    w: 52, h: 44,
    draw: (px, hit) => {
      const fur = '#ff8a2a';
      // coda grande a punta bianca
      rblock(px, 0, 14, 16, 14, fur, 3); rblock(px, 0, 6, 11, 11, '#fff3dc', 3);
      px(4, 20, shade(fur, -0.2), 8, 1); px(3, 9, '#ffffff', 3, 2);
      block(px, 12, 26, 24, 14, fur);
      px(16, 34, '#fff3dc', 16, 4);
      px(16, 38, INK, 6, 6); px(17, 39, '#3a2414', 4, 4); px(28, 38, INK, 6, 6); px(29, 39, '#3a2414', 4, 4);
      rblock(px, 18, 6, 26, 22, fur, 3);
      for (const x of [18, 36]) { block(px, x, 0, 8, 8, fur); px(x + 2, 2, INK, 4, 4); px(x + 3, 3, '#ff6b8a', 2, 2); }
      rblock(px, 34, 18, 16, 10, '#fff3dc', 2); px(46, 19, INK, 4, 4); px(47, 19, '#6a6580', 1, 1); // muso e naso
      px(22, 22, '#fff3dc', 6, 4);
      bandana(px, 20, 6, 24, '#1fb5a0');
      px(22, 2, INK, 18, 5); px(24, 3, '#7ad7ff', 5, 3); px(33, 3, '#7ad7ff', 5, 3); px(24, 3, '#ffffff', 2, 1); px(33, 3, '#ffffff', 2, 1); // occhialoni
      eyes(px, 26, 14, 10, hit, 'ok', 4, '#1f8a3a');
      if (hit) px(38, 25, INK, 4, 2); else { px(36, 25, INK, 6, 1); px(41, 24, INK, 1, 1); }
    },
  },
};

function crab(px: Px, hit: boolean, c: string, captain: boolean): void {
  const oy = captain ? 12 : 0;
  // zampe a segmenti
  for (const x of [10, 18, 34, 42]) { px(x, 30 + oy, INK, 4, 10); px(x + 1, 31 + oy, shade(c, -0.25), 2, 8); px(x + 1, 35 + oy, INK, 2, 1); }
  // chele grandi con pinza aperta
  const claw = (x: number, flip: boolean) => {
    rblock(px, x, 8 + oy, 14, 12, c, 2);
    px(x + 2, 9 + oy, shade(c, 0.3), 5, 2);
    px(flip ? x + 6 : x + 2, 4 + oy, INK, 6, 6); px(flip ? x + 7 : x + 3, 5 + oy, c, 4, 4); // pinza alta
    px(flip ? x + 8 : x, 13 + oy, INK, 6, 2); // fessura
    for (let i = 0; i < 3; i++) px(x + 3 + i * 3, 17 + oy, shade(c, -0.3), 1, 1);
  };
  claw(0, false); claw(42, true);
  px(10, 18 + oy, INK, 6, 6); px(11, 19 + oy, shade(c, -0.2), 4, 4); px(40, 18 + oy, INK, 6, 6); px(41, 19 + oy, shade(c, -0.2), 4, 4);
  // corpo a guscio con puntini
  rblock(px, 12, 16 + oy, 32, 18, c, 3);
  px(16, 28 + oy, shade(c, 0.3), 24, 2);
  for (const [x, y] of [[18, 19], [36, 20], [27, 18]]) px(x, y + oy, shade(c, 0.35), 2, 2);
  // occhi sugli steli
  px(20, 8 + oy, INK, 4, 10); px(21, 8 + oy, shade(c, -0.1), 2, 10); px(32, 8 + oy, INK, 4, 10); px(33, 8 + oy, shade(c, -0.1), 2, 10);
  for (const x of [18, 30]) {
    px(x, 3 + oy, INK, 8, 7);
    if (hit) { px(x + 2, 5 + oy, '#ffffff', 4, 1); px(x + 2, 7 + oy, '#ffffff', 4, 1); }
    else { px(x + 1, 4 + oy, '#ffffff', 6, 5); px(x + 4, 5 + oy, INK, 2, 3); }
  }
  // bocca e sopracciglia
  if (!hit) { px(18, 21 + oy, INK, 6, 1); px(32, 21 + oy, INK, 6, 1); px(22, 26 + oy, INK, 12, 2); px(22, 24 + oy, INK, 2, 2); px(32, 24 + oy, INK, 2, 2); px(24, 27 + oy, '#ffffff', 2, 1); px(30, 27 + oy, '#ffffff', 2, 1); }
  else px(24, 24 + oy, INK, 8, 4);
  if (captain) {
    captainHat(px, 14, 0, 28);
    px(12, 22 + oy, GOLD, 2, 4); px(12, 25 + oy, shade(GOLD, -0.3), 2, 1); // orecchino
    if (!hit) { px(29, 2 + oy, INK, 10, 8); px(30, 3 + oy, '#2a2140', 8, 6); px(18, 1 + oy, INK, 22, 1); } // benda sull'occhio
  } else bandana(px, 16, 13, 24, GOLD);
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

import { bandana, type CreatureDef, eyes, GOLD, rblock } from './creatureKit';
import { poly } from './f1Creatures';
import { block, INK, shade } from './render';
import { mouth, stroke, tentacle } from './seaCreatures';

/**
 * Capibanda della F4 (0.9.0): un mini-boss a metà di ogni mare.
 * Stesso stile "a blocchi": contorno scuro, bande di luce/ombra, faccine; `hit` = occhi a X.
 */
export const F4_CREATURES: Record<string, CreatureDef> = {
  // --- Gabelliere Tricheco (Porto): tricheco grassoccio, zanne, monocolo e registro delle tasse ---
  en_walrus: {
    w: 64, h: 60,
    draw: (px, hit) => {
      const c = '#a8744a';
      rblock(px, 6, 16, 52, 40, c, 9); // corpo
      px(16, 40, shade(c, 0.28), 32, 10); // pancia
      rblock(px, 14, 6, 36, 28, shade(c, 0.06), 7); // testa
      block(px, 16, 0, 32, 6, '#2f4f8a'); block(px, 12, 5, 40, 3, '#1f3466'); // berretto del dazio
      px(30, 1, GOLD, 4, 4);
      eyes(px, 21, 13, 16, hit, 'angry', 5, '#2a2140');
      if (!hit) { px(36, 12, GOLD, 9, 1); px(36, 18, GOLD, 9, 1); px(36, 12, GOLD, 1, 7); px(44, 12, GOLD, 1, 7); stroke(px, 44, 19, 47, 30, GOLD, false); } // monocolo
      rblock(px, 20, 20, 24, 10, shade(c, 0.35), 4); // muso
      for (const x of [24, 28, 32, 36]) px(x, 24, '#5a3a24', 1, 1); // baffi
      for (const x of [22, 38]) { px(x, 28, INK, 5, 14); px(x + 1, 28, '#fff8e6', 3, 13); px(x + 1, 40, '#d8cfb4', 3, 1); } // zanne
      mouth(px, 28, 30, 8, hit, 'frown');
      rblock(px, 46, 30, 16, 20, '#7a2a2a', 2); px(48, 32, '#fff3dc', 12, 16); // registro
      for (let y = 35; y < 46; y += 3) px(50, y, '#9a8a70', 8, 1);
      block(px, 0, 36, 10, 14, c); // pinna
      block(px, 12, 54, 16, 6, shade(c, -0.25)); block(px, 36, 54, 16, 6, shade(c, -0.25));
    },
  },
  // --- Barracuda Corsaro (Scogliera): pesce argento lungo, mascella sporgente, sciabola di corallo ---
  en_barracuda: {
    w: 72, h: 50,
    draw: (px, hit) => {
      const c = '#9fb4c8';
      poly(px, [[56, 14], [70, 4], [66, 25], [70, 44], [56, 34]], '#5f7890'); // coda
      poly(px, [[26, 4], [44, 2], [40, 14]], '#5f7890'); // pinna dorsale
      rblock(px, 6, 12, 54, 26, c, 8);
      px(12, 28, shade(c, 0.35), 44, 6); // ventre
      for (let x = 22; x < 54; x += 7) px(x, 16, shade(c, -0.3), 3, 10); // strisce
      rblock(px, 0, 22, 18, 14, shade(c, 0.1), 3); // mascella
      if (!hit) for (let x = 2; x < 16; x += 3) { px(x, 22, '#ffffff', 2, 3); px(x + 1, 33, '#ffffff', 1, 2); }
      else mouth(px, 4, 28, 10, true);
      eyes(px, 16, 16, 9, hit, 'angry', 5, '#e4342f');
      bandana(px, 20, 10, 22, '#c4342f');
      poly(px, [[30, 34], [42, 34], [36, 46]], '#5f7890'); // pinna
      stroke(px, 38, 40, 54, 48, '#ff8a6a'); px(34, 37, GOLD, 6, 4); // sciabola
    },
  },
  // --- Nautilo Corazzato (Abisso): conchiglia a strisce, tentacoli, elmetto da palombaro ---------
  en_nautilus: {
    w: 64, h: 60,
    draw: (px, hit) => {
      const sh = '#f1d7a8', st = '#c8642a';
      rblock(px, 18, 2, 44, 44, sh, 14); // conchiglia
      for (let i = 0; i < 5; i++) px(26 + i * 7, 4, st, 3, 40 - Math.abs(2 - i) * 6);
      rblock(px, 34, 16, 16, 16, shade(sh, -0.15), 5); px(39, 21, st, 6, 6); // occhio della conchiglia
      for (let i = 0; i < 6; i++) tentacle(px, 4 + i * 4, 40, 14 + (i % 3) * 2, '#ff9ab0', i, 2, 3);
      rblock(px, 2, 22, 28, 22, '#8fa0b8', 6); // elmetto
      rblock(px, 7, 26, 18, 14, '#2a4a6a', 5); // oblò
      if (!hit) { px(11, 30, '#ffffff', 4, 4); px(18, 30, '#ffffff', 4, 4); px(13, 31, INK, 2, 3); px(20, 31, INK, 2, 3); px(9, 27, '#bfe6ff', 3, 2); }
      else { for (let i = 0; i < 4; i++) { px(11 + i, 30 + i, INK, 1, 1); px(14 - i, 30 + i, INK, 1, 1); px(18 + i, 30 + i, INK, 1, 1); px(21 - i, 30 + i, INK, 1, 1); } }
      for (const [x, y] of [[4, 24], [26, 24], [4, 40], [26, 40]]) px(x, y, GOLD, 2, 2); // bulloni
    },
  },
  // --- Cuoco Maledetto (Cimitero): fantasma col cappello da cuoco, mannaia e mestolo -------------
  en_ghost_cook: {
    w: 62, h: 64,
    draw: (px, hit) => {
      const g = '#bfe8e0';
      rblock(px, 18, 0, 26, 14, '#ffffff', 6); block(px, 20, 12, 22, 6, '#f1ece0'); // cappello
      rblock(px, 12, 16, 38, 36, g, 10); // corpo
      for (let i = 0; i < 4; i++) { const x = 12 + i * 10; px(x, 50, INK, 10, 2 + (i % 2) * 6); px(x + 1, 50, g, 8, 1 + (i % 2) * 6); } // coda ondulata
      eyes(px, 20, 24, 14, hit, 'angry', 6, '#3adf9a');
      mouth(px, 24, 36, 14, hit, 'grin');
      px(14, 42, '#ffffff', 34, 8); px(14, 42, INK, 34, 1); // grembiule
      px(28, 44, '#c4342f', 6, 4);
      stroke(px, 50, 20, 58, 44, '#8a5232'); block(px, 48, 4, 14, 18, '#d8e0ee'); // mannaia
      stroke(px, 12, 26, 2, 40, '#8a5232'); rblock(px, 0, 40, 8, 6, '#c0c8d8', 2); // mestolo
      if (!hit) { px(40, 8, '#3adf9a', 2, 2); px(8, 14, '#3adf9a', 2, 2); } // fuochi fatui
    },
  },
};

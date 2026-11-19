import { block, INK, shade } from './render';
import { bandana, eyes, GOLD, rblock, type CreatureDef } from './creatureKit';

/**
 * Compagni F4b (0.9.1): Ottavio (polpo cannoniere), Strillo (gabbiano vedetta),
 * Gonfio (pesce palla). Guardano a destra come Bobo, Lumi e Zip.
 */
export const F4B_COMPANIONS: Record<string, CreatureDef> = {
  // --- Ottavio: polpo viola con berretto da artigliere e cannoncino in un tentacolo -----------
  comp_ottavio: {
    w: 50, h: 48,
    draw: (px, hit) => {
      const c = '#9b5fd6';
      // tentacoli ondulati con ventose
      for (let k = 0; k < 5; k++) {
        const x0 = 4 + k * 6;
        for (let i = 0; i < 14; i++) {
          const dx = Math.round(Math.sin((i + k * 2) / 2.4) * 2);
          px(x0 + dx - 1, 32 + i, INK, 5, 1);
          px(x0 + dx, 32 + i, i > 11 ? shade(c, -0.35) : shade(c, -0.1), 3, 1);
          if (i % 4 === 2) px(x0 + dx + 1, 32 + i, '#f2c6ff', 1, 1);
        }
      }
      // testa a cupola
      rblock(px, 4, 8, 34, 28, c, 4);
      px(9, 12, shade(c, 0.35), 6, 3); // riflesso
      for (const [x, y] of [[26, 12], [30, 16], [10, 26]]) px(x, y, shade(c, -0.2), 3, 2); // macchie
      // berretto da artigliere con pennacchio
      px(8, 4, INK, 26, 7); px(9, 5, '#2a2140', 24, 5); px(9, 5, shade('#2a2140', 0.35), 24, 1);
      px(7, 9, INK, 30, 3); px(8, 10, '#e4342f', 28, 1);
      px(20, 0, INK, 4, 5); px(21, 0, GOLD, 2, 4);
      eyes(px, 14, 17, 12, hit, 'ok', 5, '#e07a00');
      if (!hit) { px(13, 16, INK, 7, 1); } // sopracciglio flemmatico (occhio socchiuso)
      if (hit) px(20, 29, INK, 5, 3);
      else { px(18, 29, INK, 9, 1); px(17, 28, INK, 1, 1); }
      px(9, 26, '#ff9a6a', 3, 2); px(30, 26, '#ff9a6a', 3, 2);
      // tentacolo che regge il cannoncino
      px(34, 26, INK, 8, 5); px(35, 27, c, 6, 3);
      block(px, 36, 18, 14, 9, '#4a4560');
      px(37, 19, '#6a6580', 12, 1);
      px(46, 17, INK, 4, 11); px(47, 18, '#2a2140', 2, 9); // bocca del cannone
      px(38, 22, GOLD, 2, 2); px(42, 22, GOLD, 2, 2); // borchie
      px(36, 15, INK, 2, 4); px(36, 14, '#ffb45f', 2, 1); // miccia
    },
  },
  // --- Strillo: gabbiano bianco e grigio con cannocchiale e fazzoletto rosso ---------------------
  comp_strillo: {
    w: 46, h: 46,
    draw: (px, hit) => {
      const w = '#f4f1ea', g = '#9aa3b5';
      // zampe palmate
      px(14, 38, INK, 3, 6); px(15, 38, '#ff9a2a', 1, 5); px(22, 38, INK, 3, 6); px(23, 38, '#ff9a2a', 1, 5);
      px(12, 43, INK, 8, 3); px(13, 44, '#ff9a2a', 6, 1); px(20, 43, INK, 8, 3); px(21, 44, '#ff9a2a', 6, 1);
      // corpo
      rblock(px, 6, 20, 26, 20, w, 4);
      // ala grigia ripiegata con punte nere
      rblock(px, 2, 22, 18, 12, g, 3);
      for (let i = 0; i < 3; i++) px(3 + i * 5, 31, INK, 4, 3);
      px(4, 24, shade(g, 0.35), 12, 1);
      // coda
      px(0, 30, INK, 6, 6); px(1, 31, g, 4, 4);
      // testa
      rblock(px, 16, 4, 22, 20, w, 4);
      // fazzoletto rosso al collo
      bandana(px, 14, 20, 20, '#e4342f');
      // becco giallo con punta rossa
      px(36, 13, INK, 10, 6); px(37, 14, '#ffcf3a', 8, 2); px(37, 16, shade('#ffcf3a', -0.2), 8, 2); px(43, 16, '#e4342f', 2, 2);
      if (!hit) { px(37, 16, INK, 7, 1); } // becco che strilla
      eyes(px, 22, 10, 9, hit, 'angry', 4, '#2a7fd4');
      // cannocchiale sotto l'ala
      block(px, 20, 30, 16, 6, '#b8743c');
      px(21, 31, '#d08a50', 14, 1); px(34, 29, INK, 4, 8); px(35, 30, GOLD, 2, 6);
      // ciuffo
      px(24, 1, INK, 3, 5); px(25, 2, w, 1, 3); px(28, 2, INK, 3, 4); px(29, 3, w, 1, 2);
    },
  },
  // --- Gonfio: pesce palla giallo gonfio con aculei e cerotto -----------------------------------
  comp_gonfio: {
    w: 50, h: 46,
    draw: (px, hit) => {
      const c = '#f2c94c';
      // aculei tutt'intorno
      const spike = (x: number, y: number, dx: number, dy: number) => {
        for (let i = 0; i < 4; i++) px(x + dx * i, y + dy * i, INK, 2, 2);
        px(x + dx, y + dy, '#fff3dc', 1, 1);
      };
      for (const [x, y, dx, dy] of [[12, 4, -1, -1], [24, 2, 0, -1], [34, 4, 1, -1], [4, 16, -1, 0], [4, 30, -1, 0], [12, 40, -1, 1], [24, 42, 0, 1], [34, 40, 1, 1]] as const) spike(x, y, dx, dy);
      // pinna caudale
      px(0, 18, INK, 7, 12); px(1, 19, '#e09a12', 5, 10); px(1, 23, shade('#e09a12', -0.25), 5, 2);
      // corpo tondo
      rblock(px, 5, 4, 38, 38, c, 8);
      px(14, 32, '#fff3dc', 22, 8); px(12, 34, '#fff3dc', 26, 5); // pancia chiara
      for (const [x, y] of [[12, 10], [20, 8], [30, 10], [10, 20]]) px(x, y, shade(c, -0.25), 2, 2); // puntini
      px(13, 8, shade(c, 0.4), 6, 2);
      // pinna laterale
      px(16, 24, INK, 7, 6); px(17, 25, '#e09a12', 5, 4);
      // cerotto
      px(30, 6, INK, 8, 4); px(31, 7, '#ffd8a8', 6, 2); px(33, 7, '#e8a87c', 2, 2);
      eyes(px, 26, 14, 9, hit, 'angry', 5, '#1f8a3a');
      // bocca imbronciata a "o"
      if (hit) px(38, 26, INK, 5, 4);
      else { px(37, 25, INK, 6, 5); px(38, 26, '#a8211e', 4, 3); }
      px(28, 24, '#ff9a6a', 3, 2);
      px(43, 12, INK, 2, 2); // aculeo frontale
    },
  },
};

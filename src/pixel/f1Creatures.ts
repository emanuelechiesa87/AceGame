import { bandana, type CreatureDef, eyes, GOLD, rblock } from './creatureKit';
import { block, INK, shade, type Px } from './render';
import { cheeks, mouth, stroke, suckers, tentacle } from './seaCreatures';

/**
 * Nemici della F1 (0.6.6): 3 normali + 1 élite per mare, più il tentacolo
 * evocato dal Calamaro Colosso. Stesso stile "a blocchi" degli altri:
 * contorno scuro, bande di luce/ombra, faccine; `hit` = occhi a X.
 */

/** Poligono pieno con contorno: riempie in INK, poi l'interno rimpicciolito verso il centro. */
function poly(px: Px, pts: [number, number][], fill: string, inset = 1.5): void {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const inside = (q: [number, number][], x: number, y: number) => {
    let c = false;
    for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
      const [xi, yi] = q[i], [xj, yj] = q[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const shrink = pts.map(([x, y]) => { const d = Math.hypot(x - cx, y - cy) || 1; return [x - ((x - cx) / d) * inset, y - ((y - cy) / d) * inset] as [number, number]; });
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
      if (inside(shrink, x + 0.5, y + 0.5)) px(x, y, y < cy - (cy - Math.min(...ys)) * 0.55 ? shade(fill, 0.22) : y > cy + (Math.max(...ys) - cy) * 0.6 ? shade(fill, -0.22) : fill, 1, 1);
      else if (inside(pts, x + 0.5, y + 0.5)) px(x, y, INK, 1, 1);
    }
  }
}

/** Topo (di stiva o pestilente): orecchie tonde, coda, dentoni. */
function rat(px: Px, hit: boolean, fur: string, extra: (px: Px) => void): void {
  for (let i = 0; i < 14; i++) { const x = 4 + Math.round(Math.sin(i / 3) * 3), y = 34 - i; px(x - 1, y, INK, 4, 1); px(x, y, '#e89ab0', 2, 1); }
  rblock(px, 9, 3, 12, 12, fur, 3); rblock(px, 29, 3, 12, 12, fur, 3);
  px(12, 6, '#e89ab0', 6, 6); px(32, 6, '#e89ab0', 6, 6);
  rblock(px, 8, 10, 34, 26, fur, 5);
  px(14, 25, shade(fur, 0.35), 22, 7); // pancia
  eyes(px, 15, 15, 14, hit, 'angry', 4, '#c4342f');
  px(22, 21, INK, 6, 4); px(23, 21, '#ff8fb0', 4, 2); // naso
  if (!hit) { px(20, 26, INK, 10, 1); px(23, 27, INK, 4, 4); px(24, 27, '#ffffff', 2, 3); }
  else mouth(px, 20, 27, 10, true);
  for (const x of [10, 36]) { stroke(px, x, 22, x + (x < 20 ? -7 : 7), 20, INK, false); } // baffi
  block(px, 12, 35, 8, 4, shade(fur, -0.2)); block(px, 30, 35, 8, 4, shade(fur, -0.2));
  extra(px);
}

export const F1_CREATURES: Record<string, CreatureDef> = {
  // ============================== MARE 1 · PORTO ==============================
  // --- Topo di Stiva: topaccio grigio con la miccia rubata in mano ---------------------
  en_rat: {
    w: 50, h: 40,
    draw: (px, hit) => rat(px, hit, '#8d8a99', (p) => {
      bandana(p, 12, 9, 26, '#2f6fd4');
      stroke(p, 41, 30, 47, 22, '#c8a26b'); // miccia
      p(46, 18, '#ffcf3a', 3, 3); p(47, 17, '#ff5f3a', 2, 2);
    }),
  },
  // --- Granchio Bombarolo: granchio arancio con una bomba (miccia accesa) sul guscio ----
  en_bomb_crab: {
    w: 54, h: 48,
    draw: (px, hit) => {
      const c = '#ff8a3d';
      stroke(px, 30, 6, 36, 1, '#c8a26b'); px(36, 0, '#ffcf3a', 3, 2); px(37, 0, '#ffffff', 1, 1);
      rblock(px, 17, 4, 22, 18, '#2a2140', 6); px(21, 7, '#5a5470', 4, 3); px(26, 2, INK, 6, 4); px(27, 3, '#7a7490', 4, 2);
      for (const [x, flip] of [[1, false], [41, true]] as const) {
        rblock(px, x, 18, 12, 14, c, 3); px(flip ? x + 2 : x + 5, 18, INK, 4, 7); px(flip ? x + 3 : x + 6, 19, shade(c, 0.35), 2, 5);
      }
      rblock(px, 10, 20, 34, 20, c, 4);
      px(14, 34, shade(c, 0.3), 26, 2);
      eyes(px, 18, 25, 12, hit, 'angry', 5, '#2a2140');
      mouth(px, 22, 33, 10, hit, 'grin');
      for (let i = 0; i < 3; i++) { stroke(px, 14 + i * 4, 40, 11 + i * 4, 46, shade(c, -0.25)); stroke(px, 40 - i * 4, 40, 43 - i * 4, 46, shade(c, -0.25)); }
    },
  },
  // --- Mozzo Pesce-Gatto: pesce baffuto col berretto da marinaio e una benda in mano -----
  en_catfish: {
    w: 52, h: 46,
    draw: (px, hit) => {
      const c = '#c9a36b';
      poly(px, [[2, 26], [10, 18], [10, 34]], shade(c, -0.15)); // coda
      rblock(px, 8, 12, 38, 28, c, 7);
      px(14, 32, shade(c, 0.35), 26, 5);
      block(px, 14, 4, 26, 6, '#ffffff'); px(15, 9, '#2f6fd4', 24, 3); px(14, 9, INK, 1, 3); px(39, 9, INK, 1, 3);
      eyes(px, 22, 17, 12, hit, 'ok', 5, '#6b3a1e');
      for (const d of [-1, 1]) { stroke(px, 30 + d * 4, 28, 30 + d * 18, 34 + (d > 0 ? 6 : 6), '#3a2414', true); }
      mouth(px, 27, 27, 8, hit, 'smile');
      cheeks(px, 18, 39, 26);
      block(px, 42, 30, 10, 6, '#fff3dc'); px(46, 30, '#ff5f6d', 2, 6); // benda di bordo
    },
  },
  // --- Nostromo Aragosta (élite): aragosta rossa in piedi, chele enormi, fischietto d'oro --
  en_lobster: {
    w: 64, h: 60,
    draw: (px, hit) => {
      const c = '#e4342f';
      stroke(px, 26, 10, 14, 0, '#a8211e'); stroke(px, 36, 10, 48, 0, '#a8211e'); // antenne
      for (const [x, flip] of [[0, false], [44, true]] as const) {
        rblock(px, x, 12, 20, 24, c, 5);
        px(flip ? x + 3 : x + 10, 12, INK, 7, 12); px(flip ? x + 4 : x + 11, 13, shade(c, 0.3), 5, 10);
        px(x + 4, 28, shade(c, -0.3), 12, 2);
        stroke(px, flip ? x + 2 : x + 17, 34, flip ? x - 4 : x + 23, 42, c);
      }
      rblock(px, 18, 6, 28, 22, c, 6);
      rblock(px, 20, 26, 24, 26, shade(c, -0.08), 4);
      for (let y = 30; y < 50; y += 5) px(22, y, shade(c, -0.35), 20, 1);
      eyes(px, 23, 12, 12, hit, 'angry', 5, '#2a2140');
      mouth(px, 26, 21, 12, hit, 'grin');
      bandana(px, 20, 4, 24, '#2f6fd4');
      if (!hit) { px(38, 22, INK, 8, 4); px(39, 23, GOLD, 6, 2); stroke(px, 39, 24, 34, 30, GOLD, false); } // fischietto
      for (const x of [22, 30, 38]) block(px, x, 52, 6, 7, shade(c, -0.25));
    },
  },
  // ============================== MARE 2 · SCOGLIERA ==============================
  // --- Stella Marina: stella gialla luminosa che cura gli amici --------------------------
  en_starfish: {
    w: 50, h: 50,
    draw: (px, hit) => {
      const c = '#ffb03a', pts: [number, number][] = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 10 : 24; pts.push([25 + Math.cos(a) * r, 27 + Math.sin(a) * r]); }
      poly(px, pts, c, 1.6);
      for (const [x, y] of [[25, 9], [10, 22], [40, 22], [16, 41], [34, 41], [25, 33]]) px(x, y, shade(c, 0.45), 2, 2);
      eyes(px, 19, 22, 9, hit, 'ok', 4, '#c4342f');
      mouth(px, 22, 30, 6, hit, 'smile');
      cheeks(px, 16, 31, 28);
      if (!hit) { px(41, 4, '#fff3b0', 2, 6); px(39, 6, '#fff3b0', 6, 2); } // scintilla
    },
  },
  // --- Cavalluccio Lanciere: cavalluccio con elmetto e lancia di corallo -----------------
  en_seahorse: {
    w: 44, h: 56,
    draw: (px, hit) => {
      const c = '#3fb3a8';
      for (let i = 0; i < 12; i++) { const a = i / 11 * Math.PI * 1.4, x = 18 + Math.round(Math.cos(a) * 6), y = 44 + Math.round(Math.sin(a) * 6); px(x - 1, y - 1, INK, 4, 4); px(x, y, c, 2, 2); } // coda arricciata
      rblock(px, 9, 22, 22, 24, c, 5);
      for (let y = 26; y < 44; y += 4) px(12, y, shade(c, -0.3), 16, 1);
      px(11, 30, shade(c, 0.35), 3, 12);
      rblock(px, 7, 7, 24, 19, c, 5);
      block(px, 28, 14, 9, 7, c); // muso
      poly(px, [[5, 9], [33, 9], [28, 1], [10, 1]], '#c8c8d8'); px(17, 0, '#ff5f6d', 4, 3); // elmetto
      eyes(px, 12, 13, 10, hit, 'angry', 5, '#2a2140');
      mouth(px, 30, 19, 5, hit, 'frown');
      stroke(px, 34, 48, 42, 4, '#ff7a6b'); px(40, 0, INK, 5, 6); px(41, 1, '#ffd0c8', 3, 4); // lancia
    },
  },
  // --- Pesce Pagliaccio Burlone: arancio a strisce bianche, naso rosso finto ------------
  en_clownfish: {
    w: 54, h: 42,
    draw: (px, hit) => {
      const c = '#ff7a1a';
      poly(px, [[2, 10], [12, 21], [2, 32]], c);
      rblock(px, 9, 6, 40, 30, c, 8);
      for (const x of [18, 32]) { px(x - 1, 7, INK, 6, 28); px(x, 8, '#ffffff', 4, 26); }
      px(43, 9, INK, 6, 24); px(44, 10, '#ffffff', 3, 22);
      poly(px, [[20, 6], [30, 0], [36, 6]], shade(c, -0.1)); // pinna
      eyes(px, 23, 13, 9, hit, 'ok', 4, '#2a2140');
      if (!hit) { px(26, 19, INK, 6, 6); px(27, 20, '#ff2a3a', 4, 4); px(27, 20, '#ff9aa0', 2, 1); } // naso finto
      mouth(px, 24, 27, 10, hit, 'grin');
    },
  },
  // --- Squalo Martello (élite): testa a martello, occhi alle estremità, ghigno -----------
  en_hammerhead: {
    w: 66, h: 56,
    draw: (px, hit) => {
      const c = '#7d8ca8';
      poly(px, [[26, 24], [38, 24], [40, 48], [32, 56], [24, 48]], c); // corpo
      poly(px, [[22, 34], [10, 44], [24, 42]], shade(c, -0.15)); poly(px, [[42, 34], [56, 44], [40, 42]], shade(c, -0.15));
      poly(px, [[30, 0], [40, 6], [34, 14]], shade(c, -0.1)); // pinna dorsale
      rblock(px, 2, 10, 62, 16, c, 5); // martello
      px(8, 22, '#dfe6f2', 50, 2);
      for (const x of [3, 54]) { px(x, 13, INK, 9, 9); if (hit) { px(x + 2, 16, '#ffffff', 5, 1); px(x + 2, 18, '#ffffff', 5, 1); } else { px(x + 1, 14, '#ffffff', 7, 7); px(x + (x < 10 ? 4 : 1), 16, INK, 3, 4); } }
      if (!hit) { px(16, 12, INK, 6, 1); px(44, 12, INK, 6, 1); }
      px(22, 26, INK, 22, 8); px(23, 27, '#a8211e', 20, 6);
      if (!hit) for (let x = 23; x < 43; x += 3) { px(x, 27, '#ffffff', 2, 2); px(x + 1, 31, '#ffffff', 2, 2); }
      px(30, 40, '#dfe6f2', 4, 8); // pancia
    },
  },
  // ============================== MARE 3 · ABISSO ==============================
  // --- Rana Pescatrice: palla scura con esca luminosa e boccone di denti ----------------
  en_anglerfish: {
    w: 54, h: 50,
    draw: (px, hit) => {
      const c = '#3d4a6b';
      stroke(px, 22, 14, 28, 2, '#5a6a90'); px(26, 0, INK, 8, 7); px(27, 1, '#fff36b', 6, 5); px(27, 1, '#ffffff', 2, 2); // esca
      poly(px, [[2, 22], [10, 30], [2, 40]], shade(c, -0.1));
      rblock(px, 8, 12, 42, 34, c, 9);
      px(14, 16, shade(c, 0.3), 14, 2);
      eyes(px, 16, 18, 22, hit, 'angry', 5, '#fff36b');
      px(12, 28, INK, 32, 12); px(13, 29, '#5a0f2a', 30, 10);
      if (!hit) for (let x = 13; x < 43; x += 4) { poly(px, [[x, 29], [x + 3, 29], [x + 1.5, 34]], '#ffffff', 0.4); poly(px, [[x + 2, 39], [x + 5, 39], [x + 3.5, 34]], '#ffffff', 0.4); }
      for (const [x, y] of [[44, 18], [10, 40], [46, 36]]) px(x, y, '#7fe8ff', 2, 2);
    },
  },
  // --- Anguilla Elettrica: corpo a zig-zag giallo-verde con fulmini ---------------------
  en_eel: {
    w: 50, h: 54,
    draw: (px, hit) => {
      const c = '#b8d84a';
      const disc = (x: number, y: number, r: number, col: string) => { for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); px(x - w, y + dy, col, w * 2 + 1, 1); } };
      const path: [number, number][] = [];
      for (let i = 0; i <= 30; i++) { const t = i / 30; path.push([25 + Math.sin(t * Math.PI * 2.2) * 14, 18 + t * 32]); }
      for (const [x, y] of path) disc(Math.round(x), Math.round(y), 6, INK);
      path.forEach(([x, y], i) => disc(Math.round(x), Math.round(y), 5, i % 6 < 3 ? c : shade(c, -0.12)));
      path.forEach(([x, y], i) => { if (i % 4 === 0) px(Math.round(x) - 2, Math.round(y) - 4, shade(c, 0.4), 3, 1); });
      rblock(px, 13, 2, 24, 20, c, 6);
      eyes(px, 18, 8, 10, hit, 'angry', 4, '#2a2140');
      mouth(px, 20, 16, 10, hit, 'grin');
      if (!hit) for (const [x, y] of [[42, 4], [4, 30], [44, 40]]) poly(px, [[x, y], [x + 4, y], [x + 1, y + 5], [x + 5, y + 5], [x - 1, y + 12], [x + 1, y + 6], [x - 2, y + 6]], '#fff36b', 0.4);
    },
  },
  // --- Pesce Vipera: pesce viola scuro con zanne lunghissime e lucine -------------------
  en_viperfish: {
    w: 58, h: 42,
    draw: (px, hit) => {
      const c = '#5a3a8a';
      poly(px, [[2, 10], [14, 20], [2, 30]], shade(c, -0.15));
      rblock(px, 10, 6, 44, 26, c, 7);
      for (let x = 14; x < 44; x += 5) px(x, 28, '#7fe8ff', 2, 2);
      eyes(px, 36, 11, 8, hit, 'angry', 5, '#ff5fd0');
      px(34, 21, INK, 18, 4); px(35, 22, '#2a0f3a', 16, 2);
      if (!hit) { stroke(px, 38, 22, 36, 36, '#ffffff'); stroke(px, 48, 22, 50, 38, '#ffffff'); stroke(px, 43, 24, 43, 32, '#ffffff'); }
      else mouth(px, 38, 23, 10, true);
    },
  },
  // --- Calamaro Colosso (élite): mantello rosso enorme, occhioni, tentacoli -------------
  en_colossal_squid: {
    w: 62, h: 64,
    draw: (px, hit) => {
      const c = '#c43a4a';
      for (let i = 0; i < 6; i++) { tentacle(px, 10 + i * 8, 36, 22 + (i % 2) * 4, shade(c, -0.08), i, 2, 4); suckers(px, 12 + i * 8, 40, 4, 5, '#ffc8c8'); }
      poly(px, [[31, 0], [54, 22], [50, 40], [12, 40], [8, 22]], c);
      for (const [x, y] of [[20, 14], [40, 12], [34, 28]]) px(x, y, shade(c, 0.35), 3, 3);
      eyes(px, 16, 24, 22, hit, 'angry', 8, '#ffcf3a');
      mouth(px, 27, 35, 8, hit, 'frown');
    },
  },
  // --- Tentacolo (evocato): tentacolo che spunta dall'acqua, con ventose ---------------
  en_tentacle: {
    w: 30, h: 50,
    draw: (px, hit) => {
      const c = '#c43a4a';
      tentacle(px, 10, 4, 40, c, 1, 4, 9);
      for (let i = 0; i < 6; i++) px(13 + Math.round(Math.sin((i * 6 + 1) / 2.4) * 4), 10 + i * 6, '#ffc8c8', 3, 2);
      if (hit) { px(10, 2, INK, 9, 3); } else { px(9, 0, INK, 11, 6); px(10, 1, '#ffffff', 9, 4); px(14, 1, INK, 3, 4); }
      block(px, 0, 44, 30, 6, '#2f6fd4'); px(2, 44, '#9fd8ff', 26, 1); // acqua
    },
  },
  // ============================== MARE 4 · CIMITERO ==============================
  // --- Scheletro Mozzo: teschio con bandana, costole, osso come mazza -------------------
  en_skeleton: {
    w: 44, h: 56,
    draw: (px, hit) => {
      const b = '#efe8d4';
      rblock(px, 10, 2, 22, 20, b, 5);
      bandana(px, 11, 2, 20, '#7a2a8a');
      if (hit) eyes(px, 14, 10, 9, true); else { px(14, 10, INK, 5, 5); px(23, 10, INK, 5, 5); px(16, 11, '#7fffd0', 1, 1); px(25, 11, '#7fffd0', 1, 1); }
      px(20, 15, INK, 2, 2);
      px(14, 18, INK, 14, 3); for (let x = 15; x < 27; x += 2) px(x, 18, b, 1, 2);
      block(px, 19, 22, 4, 6, b);
      for (let y = 26; y < 38; y += 3) { px(12, y, INK, 18, 2); px(13, y, b, 16, 1); }
      block(px, 19, 26, 4, 14, b);
      block(px, 14, 40, 14, 4, b);
      block(px, 14, 44, 4, 12, b); block(px, 24, 44, 4, 12, b);
      stroke(px, 30, 30, 40, 18, b); px(37, 14, INK, 6, 6); px(38, 15, b, 4, 4); // osso-mazza
      stroke(px, 12, 28, 6, 38, b);
    },
  },
  // --- Cannoniere Fantasma: marinaio spettrale azzurro con cannoncino ------------------
  en_ghost_gunner: {
    w: 52, h: 54,
    draw: (px, hit) => {
      const c = '#9fe8ff';
      poly(px, [[10, 14], [36, 14], [40, 44], [34, 52], [28, 46], [22, 52], [16, 46], [8, 52], [6, 44]], c);
      poly(px, [[6, 14], [40, 14], [34, 4], [23, 0], [12, 4]], '#2a2140'); px(20, 8, GOLD, 6, 2);
      eyes(px, 15, 20, 11, hit, 'angry', 5, '#2f6fd4');
      mouth(px, 18, 30, 10, hit, 'frown');
      for (let y = 34; y < 44; y += 4) px(12, y, shade(c, 0.35), 4, 1);
      block(px, 30, 30, 18, 10, '#3a3550'); px(46, 30, INK, 6, 10); px(47, 32, '#000000', 4, 6); // cannoncino
      block(px, 32, 40, 6, 6, '#6b3a1e');
    },
  },
  // --- Ratto Pestilente: topo verdognolo con gocce di veleno ----------------------------
  en_plague_rat: {
    w: 50, h: 40,
    draw: (px, hit) => rat(px, hit, '#7d9a5a', (p) => {
      for (const [x, y] of [[44, 10], [46, 20], [2, 8]]) { p(x, y, INK, 4, 5); p(x + 1, y + 1, '#9be06a', 2, 3); }
      p(12, 30, '#c9f07a', 3, 2); p(32, 16, '#c9f07a', 2, 2);
    }),
  },
  // --- Capitano Senzatesta (élite): giacca da capitano, fiamma viola al posto della testa --
  en_headless: {
    w: 58, h: 64,
    draw: (px, hit) => {
      const coat = '#24305a';
      poly(px, [[22, 18], [36, 18], [40, 4], [33, 10], [29, 0], [25, 10], [18, 4]], '#b46bff'); // fiamma
      if (!hit) { px(24, 10, '#ffffff', 3, 3); px(31, 10, '#ffffff', 3, 3); } else { px(24, 11, INK, 3, 1); px(31, 11, INK, 3, 1); }
      block(px, 16, 18, 26, 6, '#efe8d4'); // colletto
      rblock(px, 12, 22, 34, 30, coat, 4);
      px(28, 24, INK, 2, 28);
      for (let y = 27; y < 50; y += 6) { px(24, y, GOLD, 2, 2); px(32, y, GOLD, 2, 2); }
      block(px, 8, 22, 10, 8, GOLD); block(px, 40, 22, 10, 8, GOLD); // spalline
      rblock(px, 6, 28, 8, 20, coat, 2); rblock(px, 44, 28, 8, 20, coat, 2);
      block(px, 16, 52, 10, 12, '#3a2414'); block(px, 32, 52, 10, 12, '#3a2414');
      stroke(px, 50, 46, 56, 14, '#d8e0ee'); px(47, 44, GOLD, 7, 3); // sciabola
    },
  },
};

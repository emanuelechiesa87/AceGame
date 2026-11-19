import { bandana, type CreatureDef, eyes, GOLD, rblock } from './creatureKit';
import { block, INK, shade, type Px } from './render';

/**
 * Nemici dei mari 2-4 (Scogliera dei Coralli, Abisso Luminoso, Cimitero delle
 * Navi). Stesso stile "a blocchi" del porto: contorno scuro, bande di luce e
 * ombra, faccine espressive; la variante `hit` ha gli occhi a X.
 */

/** Bocca: sorriso, ghigno con denti o "ahia" (colpito). */
function mouth(px: Px, x: number, y: number, w: number, hit: boolean, kind: 'smile' | 'grin' | 'frown' = 'smile'): void {
  if (hit) { px(x + Math.floor(w / 2) - 2, y - 1, INK, 5, 4); px(x + Math.floor(w / 2) - 1, y, '#ff6b8a', 3, 2); return; }
  if (kind === 'grin') {
    px(x, y, INK, w, 4); px(x + 1, y + 1, '#a8211e', w - 2, 2);
    for (let i = x + 1; i < x + w - 1; i += 2) px(i, y + 1, '#ffffff', 1, 1);
    return;
  }
  if (kind === 'frown') { px(x + 1, y, INK, w - 2, 1); px(x, y + 1, INK, 1, 1); px(x + w - 1, y + 1, INK, 1, 1); return; }
  px(x + 1, y + 1, INK, w - 2, 1); px(x, y, INK, 1, 1); px(x + w - 1, y, INK, 1, 1);
}

const cheeks = (px: Px, x1: number, x2: number, y: number, c = '#ff9ad5') => { px(x1, y, c, 3, 2); px(x2, y, c, 3, 2); };

/** Linea spessa da (x0,y0) a (x1,y1) con contorno: aculei, rami, tentacoli rigidi. */
function stroke(px: Px, x0: number, y0: number, x1: number, y1: number, c: string, outline = true): void {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n);
    if (outline) px(x - 1, y - 1, INK, 3, 3);
  }
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n);
    px(x, y, i > n * 0.7 ? shade(c, 0.35) : c, 1, 1);
  }
}

/** Tentacolo ondulato verso il basso. */
function tentacle(px: Px, x: number, y: number, len: number, c: string, off = 0, amp = 2, w = 3): void {
  for (let i = 0; i < len; i++) {
    const dx = Math.round(Math.sin((i + off) / 2.4) * amp);
    px(x + dx - 1, y + i, INK, w + 2, 1);
    px(x + dx, y + i, i > len - 3 ? shade(c, -0.35) : c, w, 1);
    if (w > 2) px(x + dx + w - 1, y + i, shade(c, -0.2), 1, 1);
  }
  px(x + Math.round(Math.sin((len + off) / 2.4) * amp), y + len, INK, w, 1);
}

/** Ventose (puntini chiari) lungo un tentacolo. */
const suckers = (px: Px, x: number, y: number, n: number, step: number, c: string) => { for (let i = 0; i < n; i++) px(x, y + i * step, c, 2, 1); };

export const SEA_CREATURES: Record<string, CreatureDef> = {
  // ======================= MARE 2 · SCOGLIERA DEI CORALLI =======================
  // --- Riccio Rotolante: palla viola irta di aculei, sguardo da attaccabrighe ----------------
  en_urchin: {
    w: 48, h: 44,
    draw: (px, hit) => {
      const c = '#7048c0';
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2 + 0.1, r0 = 12, r1 = 21 + (i % 2) * 2;
        stroke(px, 24 + Math.round(Math.cos(a) * r0), 22 + Math.round(Math.sin(a) * r0), 24 + Math.round(Math.cos(a) * r1), 22 + Math.round(Math.sin(a) * r1), i % 3 ? '#4a2a8a' : '#9b6bff');
      }
      rblock(px, 9, 8, 30, 28, c, 6);
      for (const [x, y] of [[14, 13], [31, 15], [17, 29], [30, 28], [24, 11]]) { px(x, y, shade(c, 0.35), 2, 2); px(x + 1, y + 2, shade(c, -0.3), 1, 1); }
      eyes(px, 15, 17, 12, hit, 'angry', 5, '#ffcf3a');
      mouth(px, 19, 28, 10, hit, 'grin');
      cheeks(px, 12, 33, 25);
    },
  },
  // --- Pesce Palla Trombettiere: pesce tondo con trombetta d'ottone e berretto da banda --------
  en_puffer_horn: {
    w: 52, h: 44,
    draw: (px, hit) => {
      const c = '#8fd14f';
      // coda
      px(0, 14, INK, 9, 16); px(1, 15, '#ffb21a', 7, 14); px(1, 15, '#ffd06a', 7, 2); px(3, 21, '#e07a00', 4, 2);
      rblock(px, 7, 8, 32, 30, c, 6);
      px(12, 26, '#e9ffd0', 22, 9); for (let x = 14; x < 34; x += 5) px(x, 30, '#cfe9a8', 2, 1); // pancia
      for (const [x, y] of [[14, 13], [26, 12], [33, 19], [12, 20]]) px(x, y, shade(c, -0.25), 2, 2); // puntini
      px(20, 34, INK, 6, 6); px(21, 35, '#ffb21a', 4, 4); // pinnetta
      // berretto da banda con pennacchio
      block(px, 14, 2, 20, 8, '#e4342f'); px(15, 7, GOLD, 18, 2); px(22, 0, INK, 4, 4); px(23, 0, '#ffffff', 2, 3);
      eyes(px, 17, 15, 11, hit, 'ok', 4, '#1f8a3a');
      cheeks(px, 15, 29, 22);
      // trombetta
      if (!hit) {
        px(34, 22, INK, 8, 4); px(35, 23, GOLD, 7, 2);
        px(41, 17, INK, 11, 14); px(42, 18, GOLD, 9, 12); px(42, 18, '#fff3b0', 9, 2); px(46, 21, shade(GOLD, -0.35), 4, 6);
        px(38, 20, INK, 2, 2); px(36, 18, INK, 2, 1);
      } else mouth(px, 30, 24, 6, true);
    },
  },
  // --- Corallo Pungente: tronco di corallo rosa con rami e polipi, piantato su uno scoglio -----
  en_coral: {
    w: 44, h: 54,
    draw: (px, hit) => {
      const c = '#ff6b8a';
      const branch = (x0: number, y0: number, x1: number, y1: number) => { stroke(px, x0, y0, x1, y1, c); px(x1 - 1, y1 - 1, '#ffe3ec', 3, 2); };
      branch(14, 22, 5, 6); branch(30, 22, 39, 4); branch(18, 18, 14, 2); branch(26, 18, 30, 1); branch(10, 13, 2, 14); branch(36, 12, 42, 16);
      rblock(px, 11, 16, 22, 28, c, 4);
      for (const [x, y] of [[14, 20], [28, 22], [15, 36], [27, 38], [21, 19]]) { px(x, y, '#fff0f4', 2, 2); px(x, y + 2, shade(c, -0.3), 2, 1); } // polipi
      // scoglio
      rblock(px, 2, 42, 40, 12, '#7a6a5a', 3); px(6, 44, '#a8967e', 10, 2); px(28, 46, '#5e5044', 8, 2);
      px(4, 41, '#2f9e44', 6, 2); px(33, 41, '#37b24d', 5, 2); // alghe
      eyes(px, 14, 25, 11, hit, 'angry', 4, '#7a1f3a');
      mouth(px, 17, 35, 10, hit, 'frown');
    },
  },
  // --- Paguro Svuota-Tasche: paguro che vive in un vecchio stivale, con il sacchetto del bottino --
  en_hermit: {
    w: 54, h: 46,
    draw: (px, hit) => {
      const boot = '#7a4a28', cr = '#ff7a3d';
      // stivale (la sua casa): gambale, punta tonda, suola e lacci incrociati
      rblock(px, 5, 6, 18, 30, boot, 3);
      rblock(px, 2, 26, 34, 16, boot, 6);
      px(4, 39, '#3a2414', 30, 3); px(6, 41, INK, 26, 1);
      for (let y = 11; y < 30; y += 5) { px(9, y, '#e8dcb8', 2, 1); px(11, y + 1, '#e8dcb8', 2, 1); px(13, y + 2, '#e8dcb8', 2, 1); px(13, y, '#e8dcb8', 2, 1); px(9, y + 2, '#e8dcb8', 2, 1); }
      px(5, 4, INK, 18, 4); px(6, 5, '#5a3418', 16, 2); px(7, 5, '#9a6a3a', 14, 1);
      px(26, 30, shade(boot, 0.25), 6, 2); // lucido sulla punta
      // granchietto che sporge davanti
      rblock(px, 26, 22, 18, 14, cr, 3);
      px(28, 34, INK, 3, 6); px(33, 34, INK, 3, 6); px(38, 34, INK, 3, 6);
      // occhi sugli steli
      px(30, 12, INK, 3, 10); px(36, 12, INK, 3, 10); px(31, 12, shade(cr, -0.1), 1, 10); px(37, 12, shade(cr, -0.1), 1, 10);
      for (const x of [28, 34]) {
        px(x, 7, INK, 7, 7);
        if (hit) { px(x + 1, 9, '#ffffff', 5, 1); px(x + 1, 11, '#ffffff', 5, 1); } else { px(x + 1, 8, '#ffffff', 5, 5); px(x + 3, 9, INK, 2, 3); px(x + 3, 9, '#ffffff', 1, 1); }
      }
      // chela col sacchetto di monete
      rblock(px, 42, 22, 10, 9, cr, 2); px(48, 20, INK, 4, 4);
      rblock(px, 42, 30, 12, 12, '#c8a26b', 3); px(46, 29, INK, 4, 3); px(47, 33, GOLD, 3, 3); px(48, 34, '#fff3b0', 1, 1);
      mouth(px, 30, 29, 8, hit, 'grin');
    },
  },
  // --- Murena a Due Teste (élite): due teste di murena da una tana nella roccia ----------------
  en_moray: {
    w: 64, h: 60,
    draw: (px, hit) => {
      const c = '#c8b030';
      // tana
      rblock(px, 2, 40, 60, 20, '#5e5044', 4); px(8, 43, '#8a7a68', 18, 2); px(14, 46, INK, 36, 10); px(15, 47, '#1a1420', 34, 8);
      const neck = (x: number, lean: number) => {
        for (let i = 0; i < 30; i++) {
          const dx = Math.round(Math.sin(i / 7) * 3 * lean);
          px(x + dx - 1, 50 - i, INK, 12, 1); px(x + dx, 50 - i, c, 10, 1);
          px(x + dx, 50 - i, shade(c, 0.3), 2, 1); px(x + dx + 8, 50 - i, shade(c, -0.25), 2, 1);
          if (i % 4 === 1) px(x + dx + 3 + (i % 3), 50 - i, '#6a5a10', 2, 1); // macchie
        }
      };
      neck(14, 1); neck(40, -1);
      const head = (x: number, flip: boolean) => {
        rblock(px, x, 6, 20, 16, c, 3);
        for (let i = 0; i < 4; i++) px(x + 3 + i * 4, 9, '#6a5a10', 2, 2);
        eyes(px, flip ? x + 12 : x + 4, 10, 0, hit, 'angry', 4, '#e4342f');
        // fauci aperte con denti
        const mx = flip ? x - 2 : x + 6;
        px(mx, 18, INK, 16, 7); px(mx + 1, 19, '#a8211e', 14, 5);
        for (let k = mx + 1; k < mx + 15; k += 3) { px(k, 19, '#ffffff', 2, 2); px(k + 1, 22, '#ffffff', 1, 2); }
      };
      head(6, false); head(38, true);
      // pinna dorsale a cresta
      for (let i = 0; i < 6; i++) { px(9 + i * 3, 4 - (i % 2), '#e07a00', 2, 3); px(41 + i * 3, 4 - (i % 2), '#e07a00', 2, 3); }
    },
  },
  // --- Regina Anemone (boss): anemone gigante con corona di tentacoli e diadema di gemme -------
  en_anemone_queen: {
    w: 84, h: 84,
    draw: (px, hit) => {
      const body = '#c2448a', tent = '#ff8cc6';
      // corona di tentacoli ondeggianti (dietro)
      for (let i = 0; i < 11; i++) {
        const x = 6 + i * 7, len = 18 + (i % 3) * 5;
        for (let k = 0; k < len; k++) {
          const dx = Math.round(Math.sin((k + i * 2) / 3) * 2);
          px(x + dx - 1, 30 - k, INK, 5, 1); px(x + dx, 30 - k, k > len - 4 ? '#ffe3f1' : tent, 3, 1); px(x + dx + 2, 30 - k, shade(tent, -0.25), 1, 1);
        }
      }
      // corpo a colonna con strisce
      rblock(px, 12, 24, 60, 52, body, 6);
      for (let x = 18; x < 66; x += 8) px(x, 30, shade(body, -0.2), 3, 42);
      px(16, 60, shade(body, 0.25), 52, 12); px(16, 60, shade(body, 0.4), 52, 1);
      // base a ventosa
      rblock(px, 6, 72, 72, 12, '#8a2a60', 4); px(10, 74, '#a83a78', 64, 2);
      // diadema con gemme inventate
      px(20, 22, INK, 44, 8); px(21, 23, GOLD, 42, 6); px(21, 23, '#fff3b0', 42, 1);
      for (const [x, col] of [[26, '#5fd3ff'], [40, '#e4342f'], [54, '#6fe08a']] as [number, string][]) { px(x - 1, 16, INK, 7, 8); px(x, 17, col, 5, 6); px(x, 17, '#ffffff', 2, 2); }
      px(39, 10, INK, 7, 8); px(40, 11, GOLD, 5, 6);
      // braccia-tentacolo ai lati
      tentacle(px, 4, 38, 30, tent, 0, 2, 4); tentacle(px, 76, 38, 30, tent, 3, 2, 4);
      suckers(px, 5, 42, 6, 4, '#ffe3f1'); suckers(px, 77, 42, 6, 4, '#ffe3f1');
      eyes(px, 26, 38, 26, hit, 'angry', 7, '#7a1f6a');
      if (!hit) { px(24, 34, INK, 10, 2); px(50, 34, INK, 10, 2); px(27, 48, '#ffffff', 2, 2); } // ciglia regali
      mouth(px, 34, 54, 16, hit, 'grin');
      cheeks(px, 22, 58, 50, '#ffb3d9');
    },
  },

  // ======================= MARE 3 · ABISSO LUMINOSO =======================
  // --- Lanterna Abissale: pesce abissale scuro con esca luminosa e dentoni ---------------------
  en_lanternfish: {
    w: 56, h: 48,
    draw: (px, hit) => {
      const c = '#2b3a6b';
      // antenna con esca
      for (let i = 0; i < 14; i++) px(26 + Math.round(Math.sin(i / 4) * 3) - (i > 9 ? i - 9 : 0), 14 - i, INK, 2, 1);
      px(14, -1 + 2, '#ffe066', 8, 8); px(13, 2, INK, 1, 6); px(22, 2, INK, 1, 6); px(14, 1, INK, 8, 1); px(14, 9, INK, 8, 1);
      px(15, 3, '#fff9db', 4, 3); if (!hit) for (const [x, y] of [[11, 0], [24, 0], [10, 10], [25, 10]]) px(x, y, '#fff3b0', 1, 1);
      // coda e pinne
      px(46, 18, INK, 10, 18); px(47, 19, '#4a5a9b', 8, 16); px(47, 19, '#6a7abf', 8, 2);
      rblock(px, 6, 12, 42, 32, c, 7);
      for (let i = 0; i < 6; i++) px(14 + i * 5, 16 + (i % 2) * 3, '#3bc9db', 2, 1); // fotofori
      px(10, 34, shade(c, 0.25), 32, 6);
      eyes(px, 14, 18, 16, hit, 'angry', 5, '#ffe066');
      // bocca enorme con dentoni
      px(8, 30, INK, 34, 8); px(9, 31, '#5a1030', 32, 6);
      if (!hit) for (let x = 10; x < 40; x += 4) { px(x, 31, '#ffffff', 2, 3); px(x + 2, 35, '#ffffff', 2, 2); }
      else px(18, 32, '#ff6b8a', 12, 3);
    },
  },
  // --- Medusa Neon: campana azzurra elettrica con tentacoli a zig-zag --------------------------
  en_neonjelly: {
    w: 44, h: 52,
    draw: (px, hit) => {
      const c = '#3bc9db', neon = '#f783ff';
      // tentacoli a fulmine
      for (const [x, n] of [[9, 0], [17, 1], [25, 0], [33, 1]] as [number, number][]) {
        let xx = x;
        for (let i = 0; i < 22; i++) {
          if (i % 5 === 0) xx += (i / 5 + n) % 2 ? 2 : -2;
          px(xx - 1, 26 + i, INK, 4, 1); px(xx, 26 + i, i % 6 < 3 ? neon : '#ffffff', 2, 1);
        }
      }
      // alone luminoso
      px(2, 6, '#c5f6fa', 40, 22); px(0, 10, '#c5f6fa', 44, 14);
      rblock(px, 4, 4, 36, 24, c, 6);
      for (let x = 7; x < 37; x += 5) { px(x, 26, INK, 4, 2); px(x + 1, 26, neon, 2, 1); }
      px(8, 7, '#e3fafc', 12, 3); px(8, 10, '#e3fafc', 3, 3);
      // scintille
      if (!hit) for (const [x, y] of [[1, 2], [41, 4], [0, 26], [43, 22]]) { px(x, y, '#ffffff', 1, 1); px(x + 1, y + 1, '#fff3b0', 1, 1); }
      eyes(px, 13, 12, 13, hit, 'ok', 4, '#7a3ab0');
      mouth(px, 18, 21, 8, hit, 'smile');
      cheeks(px, 10, 31, 18, neon);
    },
  },
  // --- Calamaro Mimo: calamaro con il trucco da mimo, maglia a righe e basco -----------------
  en_mimic_squid: {
    w: 46, h: 56,
    draw: (px, hit) => {
      const c = '#e8e0f0';
      // tentacoli
      for (let i = 0; i < 6; i++) tentacle(px, 7 + i * 6, 36, 14 + (i % 2) * 4, '#c9bde0', i, 1, 3);
      // mantello a punta
      for (let i = 0; i < 10; i++) { px(23 - i * 2, 4 + i, INK, i * 4 + 2, 1); px(24 - i * 2, 4 + i, c, i * 4, 1); }
      rblock(px, 5, 12, 36, 28, c, 4);
      for (let y = 30; y < 38; y += 3) px(7, y, '#1f1633', 32, 1); // maglia a righe
      // basco nero col picciolo
      px(10, 8, INK, 26, 6); px(11, 9, '#2a2140', 24, 4); px(12, 9, '#4a4060', 8, 1); px(22, 5, INK, 3, 4);
      // trucco da mimo
      eyes(px, 13, 18, 14, hit, 'ok', 4, '#1f1633');
      if (!hit) { px(14, 23, INK, 1, 3); px(29, 23, INK, 1, 3); px(13, 15, INK, 5, 1); px(27, 15, INK, 5, 1); }
      if (!hit) { px(19, 27, '#e4342f', 8, 2); px(20, 26, '#e4342f', 2, 1); px(24, 26, '#e4342f', 2, 1); } else mouth(px, 18, 27, 8, true);
      // mani guantate che "toccano un muro invisibile"
      if (!hit) { px(0, 20, INK, 6, 7); px(1, 21, '#ffffff', 4, 5); px(40, 20, INK, 6, 7); px(41, 21, '#ffffff', 4, 5); }
    },
  },
  // --- Gamberone Pistolero: gambero rosa con cappello da cowboy e una chela enorme ------------
  en_gunshrimp: {
    w: 58, h: 46,
    draw: (px, hit) => {
      const c = '#ff8a8a';
      // corpo arcuato a segmenti
      for (let i = 0; i < 5; i++) { rblock(px, 2 + i * 6, 22 - Math.round(Math.sin(i / 1.6) * 6), 10, 14, i % 2 ? c : shade(c, 0.12), 2); }
      px(0, 30, INK, 6, 8); px(1, 31, '#ff6b6b', 4, 6); // ventaglio di coda
      rblock(px, 26, 10, 20, 22, c, 4);
      for (let i = 0; i < 4; i++) px(28 + i, 34 + i, INK, 1, 6); // zampette
      // antenne
      for (let i = 0; i < 16; i++) { px(40 + i, 8 - Math.round(i / 3), INK, 1, 1); px(42 + i, 12 - Math.round(i / 4), INK, 1, 1); }
      // cappello da cowboy
      px(24, 8, INK, 26, 3); px(25, 9, '#8a5a2a', 24, 1);
      block(px, 29, 1, 16, 9, '#8a5a2a'); px(30, 6, '#e4342f', 14, 2);
      eyes(px, 31, 14, 8, hit, 'angry', 4, '#1f1633');
      mouth(px, 33, 24, 7, hit, 'smile');
      bandana(px, 28, 28, 16, '#1f6fb2');
      // chela-pistola gigante
      rblock(px, 42, 26, 16, 14, '#ff5a5a', 3); px(44, 27, '#ffb3b3', 8, 2); px(52, 30, INK, 6, 3);
      if (!hit) { px(56, 26, '#fff3b0', 2, 2); px(57, 24, '#ffffff', 1, 1); }
    },
  },
  // --- Polpo Archivista (élite): polpo con occhiali tondi, libri e calamaio -------------------
  en_archivist: {
    w: 68, h: 64,
    draw: (px, hit) => {
      const c = '#9b6bff';
      for (let i = 0; i < 8; i++) tentacle(px, 4 + i * 8, 38, 20 + (i % 3) * 3, c, i * 2, 2, 4);
      for (let i = 0; i < 8; i++) suckers(px, 6 + i * 8, 44, 4, 4, '#e5dbff');
      rblock(px, 10, 4, 48, 40, c, 8);
      px(16, 8, shade(c, 0.35), 14, 4); for (const [x, y] of [[44, 10], [20, 30], [48, 28]]) px(x, y, shade(c, -0.2), 3, 3);
      // occhiali tondi
      for (const x of [18, 36]) { px(x, 16, INK, 14, 12); px(x + 1, 17, '#e7f5ff', 12, 10); }
      px(32, 20, INK, 4, 2);
      if (hit) { eyes(px, 21, 18, 18, true, 'ok', 6); }
      else { px(24, 19, INK, 4, 6); px(42, 19, INK, 4, 6); px(24, 19, '#ffffff', 1, 1); px(42, 19, '#ffffff', 1, 1); px(19, 17, '#ffffff', 3, 1); }
      mouth(px, 28, 33, 12, hit, 'frown');
      // pila di libri e calamaio tenuti dai tentacoli
      const book = (x: number, y: number, col: string) => { px(x, y, INK, 16, 6); px(x + 1, y + 1, col, 14, 4); px(x + 12, y + 1, '#fff3dc', 2, 4); };
      book(0, 34, '#1f6fb2'); book(2, 28, '#e4342f'); book(1, 22, '#2f9e44');
      px(56, 30, INK, 10, 10); px(57, 31, '#2a2140', 8, 8); px(59, 26, INK, 4, 5); px(60, 22, '#ffffff', 2, 5); px(61, 21, '#e8dcb8', 1, 2); // calamaio e piuma
    },
  },
  // --- Faro Abissale (boss): faro vivente a strisce, lanterna-occhio e fauci sulla base -------
  en_abyss_lighthouse: {
    w: 84, h: 88,
    draw: (px, hit) => {
      const red = '#d6336c', white = '#f1e3f8';
      // pinne laterali e coda
      px(4, 46, INK, 14, 22); px(5, 47, '#3bc9db', 12, 20); px(5, 47, '#99e9f2', 12, 2);
      px(66, 46, INK, 14, 22); px(67, 47, '#3bc9db', 12, 20); px(67, 47, '#99e9f2', 12, 2);
      // torre a strisce (corpo)
      for (let y = 30; y < 74; y++) {
        const half = 16 + Math.floor((y - 30) / 6);
        px(42 - half - 1, y, INK, half * 2 + 2, 1);
        px(42 - half, y, Math.floor((y - 30) / 9) % 2 ? white : red, half * 2, 1);
        px(42 - half, y, shade(Math.floor((y - 30) / 9) % 2 ? white : red, 0.3), 2, 1);
        px(42 + half - 3, y, shade(Math.floor((y - 30) / 9) % 2 ? white : red, -0.25), 3, 1);
      }
      // lanterna in cima con l'occhio
      block(px, 22, 26, 40, 6, '#3a3550');
      px(24, 8, INK, 36, 20); px(25, 9, '#ffe066', 34, 18); px(25, 9, '#fff9db', 34, 3);
      for (const x of [33, 42, 51]) px(x, 9, '#3a3550', 1, 18);
      block(px, 26, 2, 32, 7, '#3a3550'); px(40, 0, INK, 4, 3);
      if (hit) { eyes(px, 34, 13, 0, true, 'ok', 8); }
      else { px(34, 12, INK, 16, 12); px(35, 13, '#ffffff', 14, 10); px(39, 14, '#1f6fb2', 7, 8); px(41, 16, INK, 3, 4); px(40, 14, '#ffffff', 2, 2); px(32, 10, INK, 20, 2); }
      // raggi di luce
      if (!hit) for (let i = 0; i < 10; i++) { px(12 - i, 14 - Math.round(i / 2), '#fff3b0', 2, 1); px(70 + i, 14 - Math.round(i / 2), '#fff3b0', 2, 1); }
      // fauci sulla base della torre
      px(16, 62, INK, 52, 14); px(17, 63, '#3a0a20', 50, 12);
      for (let x = 18; x < 66; x += 5) { px(x, 63, '#ffffff', 3, 4); px(x + 2, 71, '#ffffff', 3, 4); }
      if (hit) px(30, 66, '#ff6b8a', 24, 4);
      // scoglio alla base con fotofori
      rblock(px, 6, 76, 72, 12, '#1a1f3a', 3);
      for (let x = 12; x < 74; x += 9) px(x, 80, '#3bc9db', 2, 2);
    },
  },

  // ======================= MARE 4 · CIMITERO DELLE NAVI =======================
  // --- Ancora Animata: ancora di ferro arrugginita con la faccia sul fusto e catena -----------
  en_anchor: {
    w: 48, h: 60,
    draw: (px, hit) => {
      const iron = '#6a7484';
      // catena e anello
      for (let i = 0; i < 3; i++) { px(20, i * 4, INK, 8, 5); px(22, i * 4 + 1, '#9aa0b5', 4, 3); px(23, i * 4 + 2, INK, 2, 1); }
      px(16, 10, INK, 16, 10); px(18, 12, iron, 12, 6); px(21, 14, INK, 6, 3);
      // ceppo orizzontale
      block(px, 8, 20, 32, 6, '#8a5a2a'); px(9, 21, '#b97a46', 30, 1);
      // fusto con la faccia
      rblock(px, 16, 24, 16, 26, iron, 2);
      for (const [x, y] of [[18, 30], [27, 40], [20, 44]]) px(x, y, '#a0522d', 3, 2); // ruggine
      eyes(px, 18, 29, 7, hit, 'angry', 4, '#e4342f');
      mouth(px, 19, 38, 10, hit, 'grin');
      // bracci a uncino: arco che scende fino al fusto e risale ai lati
      const arc = (i: number) => 44 + Math.round(Math.sin((i / 36) * Math.PI) * 12);
      for (let i = 0; i <= 36; i++) px(5 + i, arc(i) - 1, INK, 2, 6);
      for (let i = 0; i <= 36; i++) { px(6 + i, arc(i), iron, 1, 4); px(6 + i, arc(i), '#9aa0b5', 1, 1); }
      px(1, 40, INK, 8, 8); px(2, 41, iron, 6, 6); px(2, 41, '#9aa0b5', 6, 1); // punta sinistra
      px(39, 40, INK, 8, 8); px(40, 41, iron, 6, 6); px(40, 41, '#9aa0b5', 6, 1); // punta destra
      px(14, 50, '#2f9e44', 4, 2); px(30, 52, '#37b24d', 3, 2); // alghe
    },
  },
  // --- Barile Finto-Tesoro: barile con il coperchio-bocca, monete finte e miccia accesa -------
  en_barrel: {
    w: 44, h: 52,
    draw: (px, hit) => {
      const wood = '#a9693c';
      // miccia con scintilla
      for (let i = 0; i < 8; i++) px(30 + Math.round(Math.sin(i / 2) * 2), 8 - i, INK, 2, 1);
      if (!hit) { px(30, -1 + 1, '#ffcf3a', 3, 3); px(29, 0, '#ff6b3d', 1, 1); px(33, 2, '#ffffff', 1, 1); }
      // coperchio sollevato come una bocca, con denti
      px(6, 8, INK, 32, 6); px(7, 9, shade(wood, 0.2), 30, 4);
      rblock(px, 4, 14, 36, 36, wood, 4);
      for (let x = 10; x < 36; x += 7) px(x, 16, shade(wood, -0.2), 1, 32);
      for (const y of [20, 40]) { px(5, y, '#5a6070', 34, 4); px(5, y, '#9aa0b5', 34, 1); }
      // monete che spuntano e denti
      px(8, 13, GOLD, 26, 3); px(10, 12, '#fff3b0', 6, 1); px(24, 12, '#fff3b0', 4, 1);
      if (!hit) for (let x = 8; x < 36; x += 4) px(x, 14, '#ffffff', 2, 2);
      eyes(px, 12, 26, 14, hit, 'angry', 4, '#e09a12');
      mouth(px, 16, 34, 12, hit, 'grin');
    },
  },
  // --- Sirena Stonata: coda di pesce, capelli d'alga e una conchiglia-microfono incrinata ----
  en_siren: {
    w: 50, h: 58,
    draw: (px, hit) => {
      const tail = '#38d9a9', skin = '#ffd8b8', hair = '#2f9e44';
      // coda arricciata con pinna
      for (let i = 0; i < 20; i++) { const x = 14 + Math.round(Math.sin(i / 6) * 4); px(x - 1, 34 + i, INK, 14 - Math.floor(i / 3) + 2, 1); px(x, 34 + i, i % 4 === 0 ? shade(tail, -0.2) : tail, 14 - Math.floor(i / 3), 1); }
      px(22, 52, INK, 16, 6); px(23, 53, tail, 14, 4); px(23, 53, shade(tail, 0.35), 14, 1);
      // busto con maglietta a righe
      block(px, 12, 22, 22, 14, '#fff3dc');
      for (let y = 25; y < 35; y += 3) px(13, y, '#1f6fb2', 20, 1);
      // testa e capelli d'alga lunghi
      px(8, 2, INK, 30, 30); px(9, 3, hair, 28, 28); for (let x = 10; x < 36; x += 4) px(x, 20, shade(hair, -0.25), 2, 10);
      rblock(px, 12, 6, 22, 18, skin, 3);
      px(12, 4, hair, 22, 5); px(14, 3, '#69db7c', 6, 2);
      px(30, 4, '#ff8787', 5, 4); px(31, 5, '#ffc9c9', 2, 2); // stella marina tra i capelli
      eyes(px, 15, 11, 10, hit, 'ok', 4, '#1f8a3a');
      if (hit) mouth(px, 18, 19, 8, true); else { px(20, 18, INK, 5, 4); px(21, 19, '#a8211e', 3, 2); } // bocca aperta che canta
      cheeks(px, 13, 29, 16, '#ff9a8a');
      // conchiglia-microfono incrinata e note stonate
      px(34, 18, INK, 10, 9); px(35, 19, '#ffd8a8', 8, 7); px(36, 20, '#ffb87a', 2, 5); px(39, 20, INK, 1, 3);
      if (!hit) { px(44, 6, INK, 2, 8); px(42, 12, INK, 4, 3); px(47, 0, INK, 2, 7); px(45, 5, INK, 4, 3); px(48, 0, INK, 2, 2); }
    },
  },
  // --- Lanterna Fantasma: vecchia lanterna di bordo con fiamma verde e coda di fumo ------------
  en_ghost_lamp: {
    w: 38, h: 56,
    draw: (px, hit) => {
      const flame = '#69db7c';
      px(3, 8, '#d3f9d8', 32, 32); // alone
      // coda di fumo spettrale
      for (let i = 0; i < 14; i++) { const x = 13 + Math.round(Math.sin(i / 2) * 3); px(x, 42 + i, i % 3 ? '#b2f2bb' : '#d3f9d8', 12 - Math.floor(i * 0.7), 1); }
      // maniglia e tettuccio
      px(13, 0, INK, 12, 6); px(15, 2, '#d3f9d8', 8, 2);
      block(px, 7, 6, 24, 6, '#3a3550'); px(8, 7, '#6a6580', 22, 1);
      block(px, 5, 12, 28, 26, '#3a3550');
      px(8, 14, '#2b8a3e', 22, 22); px(8, 14, flame, 22, 22);
      px(12, 22, '#b2f2bb', 14, 12); px(15, 28, '#ffffff', 8, 6); // fiamma interna
      px(18, 12, '#3a3550', 2, 26); px(5, 24, '#3a3550', 28, 2);
      eyes(px, 10, 17, 13, hit, 'angry', 4, '#1f1633');
      mouth(px, 14, 30, 10, hit, 'grin');
      block(px, 9, 38, 20, 5, '#3a3550');
    },
  },
  // --- Polena Vivente (élite): busto scolpito di vecchio marinaio barbuto su un trave di prua --
  en_figurehead: {
    w: 66, h: 66,
    draw: (px, hit) => {
      const wood = '#c8935a', dark = '#7a4a28';
      // trave di prua spezzata
      for (let i = 0; i < 52; i++) { px(4 + i, 60 - Math.round(i * 0.25), INK, 2, 8); px(5 + i, 61 - Math.round(i * 0.25), i % 7 === 0 ? '#5f3520' : '#8a5232', 1, 6); }
      // busto con giacca scolpita
      rblock(px, 14, 34, 40, 24, '#2f5f9e', 4);
      for (const x of [26, 40]) { px(x, 38, GOLD, 3, 3); px(x, 46, GOLD, 3, 3); }
      px(18, 36, shade('#2f5f9e', 0.3), 32, 2);
      // testa di legno con crepe e barba a riccioli squadrati
      rblock(px, 16, 6, 34, 30, wood, 4);
      for (const [x, y, l] of [[22, 8, 6], [42, 12, 5], [24, 26, 4]]) for (let k = 0; k < l; k++) px(x + (k % 2), y + k, dark, 1, 1); // crepe
      for (let i = 0; i < 6; i++) { px(16 + i * 6, 26, INK, 6, 12); px(17 + i * 6, 27, '#e8dcb8', 4, 10); px(17 + i * 6, 34, '#c9b890', 4, 2); }
      // cappello di corda intrecciata
      px(14, 2, INK, 38, 7); for (let x = 15; x < 51; x += 3) { px(x, 3, '#d9c9a0', 2, 5); px(x + 2, 3, '#a89870', 1, 5); }
      eyes(px, 22, 14, 16, hit, 'angry', 5, '#1f6fb2');
      if (!hit) { px(30, 22, INK, 6, 2); px(30, 24, '#a8211e', 6, 2); } else mouth(px, 28, 22, 10, true);
      px(30, 18, dark, 6, 4); // naso
      // ancorette d'oro sulle spalle
      px(10, 36, INK, 6, 8); px(11, 37, GOLD, 4, 6); px(52, 36, INK, 6, 8); px(53, 37, GOLD, 4, 6);
    },
  },
  // --- Ammiraglio Relitto (boss): nave fantasma con la faccia, bicorno e cannoni ---------------
  en_wreck_admiral: {
    w: 92, h: 88,
    draw: (px, hit) => {
      const hull = '#4a3a4a', plank = '#5f4a5a', glow = '#69db7c';
      // albero e vela strappata dietro
      px(44, 0, INK, 6, 40); px(45, 0, '#5f3520', 4, 40);
      for (let r = 0; r < 22; r++) { const w = 34 - Math.abs(r - 10) * 2; px(47 - Math.floor(w / 2), 6 + r, r % 6 === 5 ? '#6e6470' : '#a99bb0', w - (r % 4 === 0 ? 4 : 0), 1); }
      px(36, 14, '#241d30', 6, 5); px(54, 22, '#241d30', 5, 4); // strappi
      // scafo-corpo
      rblock(px, 6, 30, 80, 50, hull, 6);
      for (let y = 36; y < 76; y += 6) px(8, y, plank, 76, 1);
      for (const [x, y] of [[14, 40], [70, 58], [20, 66]]) px(x, y, '#2a2030', 6, 3); // buchi
      // bicorno da ammiraglio con stemma-gemma inventato
      block(px, 18, 22, 56, 10, '#241d30');
      for (let i = 0; i < 10; i++) { px(18 + i, 22 - i, INK, 2, 1); px(72 - i, 22 - i, INK, 2, 1); }
      px(28, 13, INK, 36, 10); px(29, 14, '#241d30', 34, 8);
      px(19, 29, GOLD, 54, 2);
      px(43, 15, INK, 8, 8); px(44, 16, '#9b6bff', 6, 6); px(44, 16, '#e5dbff', 2, 2);
      // oblò-occhi luminosi
      for (const x of [22, 56]) {
        px(x, 40, INK, 16, 14); px(x + 1, 41, '#8a7a50', 14, 12);
        if (hit) { eyes(px, x + 3, 43, 0, true, 'ok', 8); }
        else { px(x + 3, 43, glow, 10, 8); px(x + 6, 45, '#ffffff', 4, 4); px(x + 3, 43, '#d3f9d8', 3, 2); }
      }
      if (!hit) { px(20, 37, INK, 14, 2); px(58, 37, INK, 14, 2); }
      // bocca di assi spezzate con denti
      px(26, 60, INK, 40, 12); px(27, 61, '#1a1020', 38, 10);
      if (!hit) for (let x = 28; x < 64; x += 5) { px(x, 61, '#e8dcb8', 3, 4); px(x + 2, 67, '#e8dcb8', 3, 4); }
      else px(36, 64, '#ff6b8a', 20, 4);
      // cannoni ai fianchi
      for (const [x, flip] of [[0, false], [80, true]] as [number, boolean][]) {
        px(x, 50, INK, 12, 10); px(x + 1, 51, '#3a3550', 10, 8); px(flip ? x + 9 : x + 1, 52, '#1f1633', 2, 6);
      }
      // alghe pendenti e acqua alla base
      for (const x of [12, 34, 60, 78]) for (let k = 0; k < 8; k++) px(x + (k % 2), 78 + k, '#2f9e44', 2, 1);
      px(0, 84, '#4a5a58', 92, 4); px(0, 84, '#7a8a86', 92, 1);
    },
  },
};

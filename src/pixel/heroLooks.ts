import type Phaser from 'phaser';
import { FRUIT_LOOKS, type FruitLook, type HeadKind, type MotifKind, type ShoulderKind, type CapeEdge } from '../data/fruitLooks';
import { block, INK, pixelTexture, shade, type Px } from './render';

/**
 * Disegni degli accessori "del frutto" che si aggiungono all'eroe a blocchi (dalla 0.6):
 * accessori in testa, spallacci, mantello, stemma, segni sul viso e particelle dell'aura.
 * Coordinate in pixel d'arte come in heroes.ts (origine ai piedi, y verso l'alto negativa).
 * Tutte forme geometriche originali.
 */

// --- primitive --------------------------------------------------------------------------

/** Disco pieno di raggio r. */
export function disc(px: Px, cx: number, cy: number, r: number, c: string): void {
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y) + 0.45);
    px(cx - w, cy + y, c, 2 * w + 1, 1);
  }
}

/** Disco con contorno e luce. */
export function ball(px: Px, cx: number, cy: number, r: number, c: string, hi = shade(c, 0.45)): void {
  disc(px, cx, cy, r + 1, INK);
  disc(px, cx, cy, r, c);
  if (r >= 2) { disc(px, cx + 1, cy + 1, Math.max(1, r - 2), shade(c, -0.15)); disc(px, cx, cy, Math.max(1, r - 1), c); }
  px(cx - Math.ceil(r / 2), cy - Math.ceil(r / 2), hi, Math.max(1, Math.floor(r / 2)), 1);
}

/** Anello (contorno di ellisse) spesso t. */
export function ring(px: Px, cx: number, cy: number, rx: number, ry: number, c: string, t = 1): void {
  for (let y = -ry; y <= ry; y++) {
    const o = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    const iry = ry - t, irx = rx - t;
    const i = iry > 0 && Math.abs(y) < iry ? Math.round(irx * Math.sqrt(Math.max(0, 1 - (y * y) / (iry * iry)))) : -1;
    if (i < 0) { px(cx - o, cy + y, c, 2 * o + 1, 1); continue; }
    px(cx - o, cy + y, c, o - i, 1);
    px(cx + i + 1, cy + y, c, o - i, 1);
  }
}

/** Punta verso l'alto (dir=-1) o verso il basso (dir=1), con curvatura opzionale. */
export function spike(px: Px, x: number, baseY: number, h: number, w: number, c: string, dir: 1 | -1 = -1, tilt = 0): void {
  for (let i = 0; i < h; i++) {
    const ww = Math.max(1, Math.round(w * (1 - i / h)));
    const dx = Math.round(tilt * (i / Math.max(1, h)) ** 2); // tilt = spostamento totale in punta
    px(x - Math.floor(ww / 2) + dx, baseY + dir * i, c, ww, 1);
  }
}

/** Punta con contorno. */
function spikeO(px: Px, x: number, baseY: number, h: number, w: number, c: string, dir: 1 | -1 = -1, tilt = 0): void {
  spike(px, x, baseY - dir, h + 2, w + 2, INK, dir, tilt);
  spike(px, x, baseY, h, w, c, dir, tilt);
}

/** Fiamma: tre strati di punte (esterno, medio, nucleo). */
function flame(px: Px, x: number, baseY: number, h: number, w: number, lk: FruitLook, dir: 1 | -1 = -1): void {
  spikeO(px, x, baseY, h, w, lk.main, dir);
  spike(px, x, baseY, Math.round(h * 0.7), Math.max(1, w - 2), lk.light, dir);
  spike(px, x, baseY, Math.round(h * 0.4), Math.max(1, w - 4), lk.glow, dir);
}

/** Cristallo esagonale. */
function crystal(px: Px, x: number, baseY: number, h: number, w: number, lk: FruitLook): void {
  const body = Math.max(1, h - Math.ceil(w / 2));
  px(x - Math.floor(w / 2) - 1, baseY - body, INK, w + 2, body + 1);
  spike(px, x, baseY - body, Math.ceil(w / 2) + 1, w + 2, INK);
  px(x - Math.floor(w / 2), baseY - body + 1, lk.main, w, body - 1);
  spike(px, x, baseY - body + 1, Math.ceil(w / 2), w, lk.main);
  px(x - Math.floor(w / 2), baseY - body, lk.light, 1, body);
  px(x - Math.floor(w / 2) + 1, baseY - body, lk.glow, 1, Math.max(1, Math.floor(body / 2)));
  px(x + Math.ceil(w / 2) - 1, baseY - body + 1, lk.dark, 1, body - 1);
}

/** Losanga di specchio (raggio r) con riflesso diagonale. */
function lozenge(px: Px, cx: number, cy: number, r: number, lk: FruitLook): void {
  for (let y = -r - 1; y <= r + 1; y++) { const w = r + 1 - Math.abs(y); px(cx - w, cy + y, INK, 2 * w + 1, 1); }
  for (let y = -r; y <= r; y++) { const w = r - Math.abs(y); px(cx - w, cy + y, y < 0 ? lk.light : lk.main, 2 * w + 1, 1); }
  for (let i = -Math.floor(r / 2); i <= Math.floor(r / 2); i++) px(cx + i, cy - i - 1, '#ffffff', 1, 1);
  px(cx, cy + r - 1, lk.dark, 1, 1);
}

/** Fogliolina inclinata. */
function leaf(px: Px, x: number, y: number, len: number, c: string, flip = false): void {
  const s = flip ? -1 : 1;
  for (let i = 0; i < len; i++) {
    const t = i / (len - 1);
    const hw = Math.max(0, Math.round(Math.sin(t * Math.PI) * 1.6));
    px(x + s * i, y - Math.round(t * len * 0.5) - hw - 1, INK, 1, hw * 2 + 3);
  }
  for (let i = 0; i < len; i++) {
    const t = i / (len - 1);
    const hw = Math.max(0, Math.round(Math.sin(t * Math.PI) * 1.6));
    px(x + s * i, y - Math.round(t * len * 0.5) - hw, c, 1, hw * 2 + 1);
    if (i > 0 && i < len - 1) px(x + s * i, y - Math.round(t * len * 0.5), shade(c, -0.25), 1, 1);
  }
}

/** Fulmine a zig-zag. */
function bolt(px: Px, x: number, y: number, seg: number, n: number, lk: FruitLook, dx = 1): void {
  let cx = x, cy = y;
  for (let i = 0; i < n; i++) {
    const nx = cx + (i % 2 ? -dx * 2 : dx * 3);
    px(Math.min(cx, nx) - 1, cy - seg - 1, INK, Math.abs(nx - cx) + 3, seg + 2);
    px(Math.min(cx, nx), cy - seg, lk.main, Math.abs(nx - cx) + 1, seg);
    px(Math.min(cx, nx), cy - seg, lk.glow, Math.abs(nx - cx) + 1, 1);
    cx = nx; cy -= seg;
  }
  px(cx - 1, cy - 2, lk.glow, 3, 2);
}

/** Molla a spire orizzontali con pallina in cima. */
function coil(px: Px, x: number, baseY: number, h: number, lk: FruitLook): void {
  for (let y = 0; y < h; y += 2) {
    const off = (y / 2) % 2 ? 1 : -1;
    px(x - 3 + off, baseY - y - 1, INK, 6, 3);
    px(x - 2 + off, baseY - y, (y / 2) % 2 ? lk.light : lk.main, 4, 1);
  }
  ball(px, x, baseY - h - 2, 2 + Math.floor(h / 10), lk.main, lk.glow);
}

const GREEN = '#4fb84a';
const SILVER = '#dfe7f2';

// --- accessori in testa -------------------------------------------------------------------

export interface HeadCtx { lk: FruitLook; s: 1 | 2 | 3; female: boolean; level: number }

type HeadDraw = { back?: (px: Px, c: HeadCtx) => void; front?: (px: Px, c: HeadCtx) => void };

/** y della "cima" del copricapo: sopra la bandana (lui) o sopra la cupola del cappello (lei). */
const topOf = (c: HeadCtx) => (c.female ? -84 : -76);
const pick = <T,>(c: HeadCtx, a: T, b: T, d: T): T => (c.s === 1 ? a : c.s === 2 ? b : d);

const HEADS: Record<HeadKind, HeadDraw> = {
  flameCrown: {
    back: (px, c) => {
      const t = topOf(c) + 6;
      const set = pick(c, [[2, 9, 7]], [[-8, 9, 6], [0, 13, 8], [8, 9, 6]], [[-14, 10, 6], [-7, 15, 7], [0, 20, 9], [7, 15, 7], [14, 10, 6]]);
      set.forEach(([x, h, w]) => flame(px, x, t, h, w, c.lk));
    },
  },
  iceCrown: {
    back: (px, c) => {
      const t = topOf(c) + 5;
      const set = pick(c, [[1, 9, 4]], [[-8, 8, 4], [0, 13, 5], [8, 8, 4]], [[-15, 9, 4], [-8, 13, 5], [0, 19, 6], [8, 13, 5], [15, 9, 4]]);
      set.forEach(([x, h, w]) => crystal(px, x, t, h, w, c.lk));
    },
  },
  rockHorns: {
    back: (px, c) => {
      const h = pick(c, 7, 11, 16), w = pick(c, 5, 6, 8);
      const y = c.female ? -74 : -70;
      spikeO(px, -14, y, h, w, c.lk.main, -1, -pick(c, 2, 4, 6));
      spikeO(px, 14, y, h, w, c.lk.main, -1, pick(c, 2, 4, 6));
      spike(px, -15, y, Math.round(h * 0.6), 2, c.lk.light, -1, -1);
      spike(px, 13, y, Math.round(h * 0.6), 2, c.lk.light, -1, 1);
      if (c.s === 3) [[-6, 6], [0, 9], [6, 6]].forEach(([x, hh]) => { px(x - 3, topOf(c) - hh + 4, INK, 7, hh); px(x - 2, topOf(c) - hh + 5, c.lk.dark, 5, hh - 2); px(x - 2, topOf(c) - hh + 5, c.lk.light, 2, 1); });
    },
  },
  boltAntennae: {
    back: (px, c) => {
      const n = pick(c, 2, 3, 4), seg = pick(c, 3, 4, 5);
      bolt(px, 8, topOf(c) + 4, seg, n, c.lk, 1);
      if (c.s >= 2) bolt(px, -8, topOf(c) + 4, seg, n, c.lk, -1);
      if (c.s === 3) bolt(px, 0, topOf(c) + 2, seg + 1, n + 1, c.lk, 1);
    },
  },
  leafCrown: {
    back: (px, c) => {
      if (c.s === 3) { leaf(px, -2, topOf(c) + 2, 12, c.lk.dark, true); leaf(px, 2, topOf(c) + 2, 12, c.lk.dark); }
    },
    front: (px, c) => {
      const y = c.female ? -76 : -71;
      const xs = pick(c, [[8, false]], [[-12, true], [-5, true], [3, false], [10, false]], [[-16, true], [-9, true], [-2, true], [5, false], [12, false]]) as [number, boolean][];
      xs.forEach(([x, f]) => leaf(px, x, y, 7, c.lk.main, f));
      if (c.s >= 2) {
        const fx = c.s === 3 ? 0 : 12, fy = y - (c.s === 3 ? 6 : 3), r = c.s === 3 ? 3 : 2;
        for (const [dx, dy] of [[-r, 0], [r, 0], [0, -r], [0, r]]) ball(px, fx + dx, fy + dy, r - 1 || 1, '#ffffff');
        ball(px, fx, fy, r - 1 || 1, c.lk.glow === '#f0ffd0' ? '#ffd94a' : c.lk.glow);
      }
    },
  },
  shadowHorns: {
    back: (px, c) => {
      const h = pick(c, 8, 13, 19), w = pick(c, 4, 5, 6);
      const y = c.female ? -76 : -71;
      const tl = pick(c, 3, 5, 8);
      spikeO(px, -10, y, h, w, c.lk.dark, -1, -tl);
      spikeO(px, 10, y, h, w, c.lk.dark, -1, tl);
      spike(px, -10 - Math.round(tl * 0.3), y - Math.round(h * 0.55), Math.round(h * 0.45), 2, c.lk.main, -1, -Math.round(tl * 0.6));
      spike(px, 10 + Math.round(tl * 0.3), y - Math.round(h * 0.55), Math.round(h * 0.45), 2, c.lk.main, -1, Math.round(tl * 0.6));
      if (c.s === 3) { px(-10 - tl - 1, y - h, c.lk.glow, 2, 2); px(10 + tl, y - h, c.lk.glow, 2, 2); }
    },
  },
  springAntenna: {
    back: (px, c) => {
      const h = pick(c, 8, 12, 15);
      coil(px, 6, topOf(c) + 3, h, c.lk);
      if (c.s === 3) coil(px, -7, topOf(c) + 3, h - 3, c.lk);
    },
  },
  mistHalo: {
    back: (px, c) => {
      const rx = pick(c, 8, 12, 16), y = topOf(c) - pick(c, 4, 6, 8);
      ring(px, 0, y, rx + 1, 4, INK, 3);
      ring(px, 0, y, rx, 3, c.lk.main, 1);
      ring(px, 0, y - 1, rx, 3, c.lk.light, 1);
      if (c.s === 3) for (const [x, yy, r] of [[-18, -2, 3], [18, -1, 3], [-10, -10, 2], [12, -9, 2]]) { disc(px, x, y + yy, r + 1, shade(c.lk.dark, 0.2)); disc(px, x, y + yy, r, c.lk.light); }
    },
  },
  beastEars: {
    back: (px, c) => {
      const h = pick(c, 6, 9, 12), w = pick(c, 7, 8, 10);
      const y = c.female ? -78 : -73;
      for (const s of [-1, 1]) {
        spikeO(px, s * 9, y, h, w, c.lk.main, -1, s * 2);
        spike(px, s * 9, y, h - 3, w - 4, c.lk.light, -1, s * 2);
      }
      if (c.s === 3) for (const [x, yy, hh] of [[-15, -60, 10], [15, -60, 10], [-17, -52, 8], [17, -52, 8]]) spikeO(px, x, yy, hh, 5, c.lk.dark, 1, x < 0 ? -3 : 3);
    },
  },
  gooBlob: {
    front: (px, c) => {
      const r = pick(c, 3, 5, 7), y = topOf(c) + (c.female ? 2 : 1);
      disc(px, 3, y, r + 1, INK); disc(px, 3, y, r, c.lk.main); px(1, y - r + 1, c.lk.light, 2, 2);
      const drips = pick(c, [[6, 4]], [[-2, 5], [7, 7]], [[-10, 8], [-3, 6], [5, 10], [12, 7]]);
      drips.forEach(([x, l]) => { px(x - 1, y, INK, 4, l + 1); px(x, y, c.lk.main, 2, l); ball(px, x + 1, y + l, 1, c.lk.main); });
      if (c.s >= 2) { px(-12, y + 2, INK, 25, 4); px(-11, y + 3, c.lk.main, 23, 2); px(-11, y + 3, c.lk.light, 23, 1); }
    },
  },
  tiara: {
    // diadema di specchi: losanghe riflettenti con la diagonale di luce
    back: (px, c) => {
      if (c.s < 2) return;
      const t = topOf(c) + 3;
      lozenge(px, 0, t - pick(c, 0, 7, 11), pick(c, 0, 5, 7), c.lk);
      if (c.s === 3) { lozenge(px, -11, t - 5, 4, c.lk); lozenge(px, 11, t - 5, 4, c.lk); }
    },
    front: (px, c) => {
      const y = c.female ? -77 : -73;
      px(-12, y - 1, INK, 25, 4); px(-11, y, SILVER, 23, 2); px(-11, y, '#ffffff', 23, 1);
      if (c.s === 1) lozenge(px, 0, y - 3, 3, c.lk);
    },
  },
  clockHalo: {
    back: (px, c) => {
      const r = pick(c, 9, 14, 19), cy = c.female ? -78 : -70;
      if (c.s === 3) for (let a = 0; a < 12; a++) { const t = (a / 12) * Math.PI * 2; px(Math.round(Math.cos(t) * (r + 2)) - 1, cy + Math.round(Math.sin(t) * (r + 2)) - 1, c.lk.dark, 3, 3); }
      disc(px, 0, cy, r + 1, INK); disc(px, 0, cy, r, c.lk.main); disc(px, 0, cy, r - 2, c.lk.light);
      for (let a = 0; a < 12; a++) { const t = (a / 12) * Math.PI * 2; px(Math.round(Math.cos(t) * (r - 3)), cy + Math.round(Math.sin(t) * (r - 3)), c.lk.dark, 1, 1); }
      // lancette che spuntano sopra la testa
      px(0, cy - r + 3, INK, 1, r - 3); px(-Math.round(r * 0.6), cy - Math.round(r * 0.5), INK, Math.round(r * 0.6), 1);
    },
  },
  magnetHorns: {
    back: (px, c) => {
      const h = pick(c, 6, 9, 13);
      const y = c.female ? -76 : -71;
      for (const s of [-1, 1]) {
        const x = s * 13 - 2;
        px(x - 1, y - h - 1, INK, 6, h + 2);
        px(x, y - h, c.lk.main, 4, h - 3);
        px(x, y - 3, c.lk.light, 4, 3); // punta argentata
        px(x, y - h, shade(c.lk.main, 0.3), 1, h - 3);
      }
      if (c.s === 3) { for (let i = 0; i < 4; i++) px(-8 + i * 4, y - h - 3 + (i % 2) * 2, c.lk.glow, 3, 1); px(-14, y - h - 2, INK, 28, 3); px(-13, y - h - 1, c.lk.main, 26, 1); }
    },
  },
  batWings: {
    back: (px, c) => {
      const w = pick(c, 6, 9, 14), y = c.female ? -72 : -68;
      for (const s of [-1, 1]) {
        const x0 = s * 12;
        for (let i = 0; i < w; i++) {
          const hgt = Math.round((w - i) * 0.9) + 2;
          const scallop = i % 4 === 3 ? 2 : 0;
          px(x0 + s * i - (s < 0 ? 0 : 0), y - hgt - 1, INK, 1, hgt + 2 - scallop);
          px(x0 + s * i, y - hgt, i % 4 === 0 ? c.lk.dark : c.lk.main, 1, Math.max(1, hgt - scallop));
        }
        px(x0 - 1, y - 2, INK, 3, 3);
      }
    },
  },
  stinkCloud: {
    back: (px, c) => {
      const y = topOf(c) - pick(c, 4, 6, 9), k = c.s;
      const puffs = [[-4, 0, 3], [2, -2, 4], [8, 0, 3], [-9, 2, 2], [13, 2, 2]].slice(0, 2 + k);
      puffs.forEach(([x, yy, r]) => disc(px, x, y + yy, r + k - 1 + 1, INK));
      puffs.forEach(([x, yy, r]) => disc(px, x, y + yy, r + k - 1, c.lk.main));
      puffs.forEach(([x, yy, r]) => px(x - 1, y + yy - r - k + 2, c.lk.light, 2, 1));
      // moscerini
      for (const [x, yy] of [[-12, -6], [14, -8], [4, -11], [-6, -12]].slice(0, k + 1)) px(x, y + yy, INK, 1, 1);
      if (c.s === 3) for (const x of [-14, 16]) for (let i = 0; i < 6; i++) px(x + (i % 2), y + 4 + i, c.lk.dark, 1, 1);
    },
  },
  goggles: {
    front: (px, c) => {
      const y = c.female ? -77 : -71, r = pick(c, 2, 3, 3);
      px(-13, y - 1, INK, 26, 3); px(-12, y, c.lk.dark, 24, 1);
      for (const x of [-5, 5]) { disc(px, x, y, r + 1, INK); disc(px, x, y, r, c.lk.main); px(x - 1, y - 1, '#ffffff', 1, 1); }
      if (c.s >= 2) for (const x of [-5, 5]) ring(px, x, y, r + 1, r + 1, SILVER, 1);
      if (c.s === 3) { px(9, y - 9, INK, 6, 9); px(10, y - 8, SILVER, 4, 7); px(10, y - 6, c.lk.main, 4, 4); px(11, y - 11, INK, 2, 3); ball(px, 11, y - 13, 1, c.lk.glow); }
    },
  },
  bubbleHelm: {
    front: (px, c) => {
      if (c.s === 3) {
        const cy = c.female ? -64 : -61;
        ring(px, 0, cy, 22, 22, 'rgba(255,255,255,0.18)', 22);
        ring(px, 0, cy, 23, 23, INK, 1);
        ring(px, 0, cy, 22, 22, c.lk.light, 1);
        px(-15, cy - 14, '#ffffff', 4, 2); px(-17, cy - 11, '#ffffff', 2, 3);
        return;
      }
      const bubbles = pick(c, [[14, -66, 3]], [[14, -66, 3], [18, -74, 2], [-15, -72, 2], [11, -80, 2]], []);
      bubbles.forEach(([x, y, r]) => { ring(px, x, y, r + 1, r + 1, INK, 1); ring(px, x, y, r, r, c.lk.light, 1); px(x - 1, y - 1, '#ffffff', 1, 1); });
    },
  },
  fuseHelm: {
    back: (px, c) => {
      const t = topOf(c) + 2;
      const fuseH = pick(c, 6, 7, 9);
      const fx = c.s === 1 ? 6 : 2;
      px(fx, t - fuseH - (c.s >= 2 ? 4 : 0), '#6b4a2e', 1, fuseH);
      const sy = t - fuseH - (c.s >= 2 ? 5 : 1);
      ball(px, fx, sy, c.s === 3 ? 2 : 1, '#ffcf3a', '#ffffff');
      if (c.s === 3) for (const [dx, dy] of [[-3, -2], [3, -3], [0, -4], [-2, 2]]) px(fx + dx, sy + dy, '#fff3b0', 1, 1);
    },
    front: (px, c) => {
      if (c.s < 2) return;
      const r = c.s === 3 ? 13 : 10, cy = (c.female ? -78 : -71);
      for (let y = 0; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); px(-w - 1, cy - y, INK, 2 * w + 3, 1); }
      for (let y = 0; y < r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)) - 1; px(-w, cy - y, c.lk.main, 2 * w + 1, 1); }
      for (const x of [-7, -2, 3, 8]) for (let y = 1; y < r - 1; y++) if (Math.abs(x) < Math.sqrt(r * r - y * y) - 1) px(x, cy - y, c.lk.dark, 1, 1);
      px(-r - 1, cy, INK, 2 * r + 3, 3); px(-r, cy, c.lk.light, 2 * r + 1, 2);
      if (c.s === 3) for (const x of [-8, -3, 2, 7]) px(x, cy + 1, INK, 1, 1);
    },
  },
  grapeBun: {
    back: (px, c) => {
      const t = topOf(c) + 1;
      const g = pick(c, [[3, 0], [7, 1], [5, -3]], [[-2, 0], [3, 0], [8, 0], [0, -4], [5, -4], [3, -8]], [[-7, 1], [-2, 1], [3, 1], [8, 1], [-5, -3], [0, -3], [5, -3], [-2, -7], [3, -7], [0, -11]]);
      const r = c.s === 3 ? 3 : 2;
      g.forEach(([x, y]) => disc(px, x, t + y, r + 1, INK));
      g.forEach(([x, y], i) => { disc(px, x, t + y, r, i % 3 ? c.lk.main : shade(c.lk.main, -0.2)); px(x - 1, t + y - 1, c.lk.light, 1, 1); });
      if (c.s >= 2) leaf(px, 3, t - (c.s === 3 ? 14 : 10), 7, GREEN);
    },
  },
  cherryClips: {
    front: (px, c) => {
      const sides = c.s === 3 ? [-1, 1] : [1];
      const r = pick(c, 2, 3, 4);
      for (const s of sides) {
        const x = s * (c.female ? 17 : 14), y = c.female ? -72 : -68;
        px(x - s * 3, y - r - 7, '#3f8a2e', 1, 6); px(x + s * 3, y - r - 7, '#3f8a2e', 1, 6); px(Math.min(x - s * 3, x + s * 3), y - r - 8, '#3f8a2e', 7, 1);
        ball(px, x - s * 3, y - 2, r, c.lk.main); ball(px, x + s * 3, y, r, c.lk.main);
        if (c.s >= 2) leaf(px, x, y - r - 8, 6, GREEN, s < 0);
      }
    },
  },
};

/** Ciuffi elementali dei capelli al V (dietro al copricapo). */
function hairFlare(px: Px, c: HeadCtx): void {
  if (c.level < 5) return;
  if (c.female) {
    for (const [x, h] of [[-15, 22], [13, 18]]) { px(x, -46, INK, 3, h - 14); px(x, -46, c.lk.hair, 2, h - 15); px(x, -33 - (22 - h), c.lk.glow, 2, 2); }
    return;
  }
  const t = -78;
  [[-11, 8, 6], [-4, 12, 7], [4, 11, 7], [11, 7, 6]].forEach(([x, h, w]) => { spikeO(px, x, t, h, w, c.lk.hair, -1, x < 0 ? -2 : 2); spike(px, x + (x < 0 ? -1 : 1), t - h + 3, 3, 2, c.lk.glow, -1); });
}

export function drawHeadBack(px: Px, c: HeadCtx): void {
  hairFlare(px, c);
  if (c.s > 0) HEADS[c.lk.head].back?.(px, c);
}

export function drawHeadFront(px: Px, c: HeadCtx): void {
  if (c.s > 0) HEADS[c.lk.head].front?.(px, c);
}

/** Segni sulle guance (dal II): due trattini del colore del frutto, luminosi al V. */
export function drawMarks(px: Px, lk: FruitLook, level: number): void {
  const col = level >= 5 ? lk.glow : lk.main;
  for (const [x, y] of [[-10, -56], [-10, -54], [8, -56], [8, -54]]) px(x, y, col, 3, 1);
  if (level >= 4) { px(-10, -55, shade(col, -0.3), 1, 1); px(10, -55, shade(col, -0.3), 1, 1); }
}

/** Stemma del frutto sul petto (dal I). */
export function drawEmblem(px: Px, lk: FruitLook, x: number, y: number): void {
  disc(px, x, y, 3, INK);
  disc(px, x, y, 2, lk.main);
  px(x - 1, y - 1, lk.light, 1, 1);
  px(x, y - 4, '#3f8a2e', 2, 2);
}

// --- spallacci --------------------------------------------------------------------------

export function drawShoulder(px: Px, lk: FruitLook, kind: ShoulderKind, cx: number, cy: number, big: boolean): void {
  const w = big ? 15 : 11, h = big ? 9 : 7;
  const x0 = cx - Math.floor(w / 2), y0 = cy - Math.floor(h / 2);
  const plate = (fill = lk.main) => { block(px, x0, y0, w, h, fill); px(x0 + 1, y0 + h - 2, lk.dark, w - 2, 1); };
  switch (kind) {
    case 'spiky':
      plate();
      (big ? [x0 + 3, cx, x0 + w - 3] : [x0 + 3, x0 + w - 4]).forEach((x, i) => {
        if (lk.motif === 'flame') flame(px, x, y0, big ? 8 : 6, 5, lk);
        else { spikeO(px, x, y0, big ? (i === 1 ? 8 : 6) : 5, 4, lk.dark); spike(px, x, y0 - 1, 3, 1, lk.light); }
      });
      break;
    case 'crystal':
      plate(lk.dark);
      (big ? [[x0 + 3, 7], [cx, 10], [x0 + w - 3, 7]] : [[x0 + 3, 6], [x0 + w - 4, 8]]).forEach(([x, hh]) => crystal(px, x, y0 + 1, hh, 3, lk));
      break;
    case 'boulder':
      ball(px, cx, cy - 1, big ? 7 : 5, lk.main, lk.light);
      px(cx - 2, cy - 3, lk.dark, 1, 3); px(cx - 1, cy, lk.dark, 3, 1); px(cx + 2, cy - 4, lk.dark, 1, 2);
      break;
    case 'coil':
      plate(SILVER);
      for (let x = x0 + 2; x < x0 + w - 2; x += 3) { px(x, y0 + 1, INK, 2, h - 2); px(x, y0 + 1, lk.main, 1, h - 3); }
      px(cx, y0 - 3, lk.glow, 1, 2); px(cx - 2, y0 - 2, lk.glow, 1, 1); px(cx + 2, y0 - 2, lk.glow, 1, 1);
      break;
    case 'leaf':
      leaf(px, x0 - 1, cy + 2, big ? 11 : 8, lk.dark);
      leaf(px, x0 + 2, cy, big ? 12 : 9, lk.main);
      if (big) ball(px, cx + 2, cy - 4, 1, '#ffd94a');
      break;
    case 'puff':
      (big ? [[cx - 5, cy, 4], [cx, cy - 2, 5], [cx + 5, cy, 4]] : [[cx - 3, cy, 3], [cx + 2, cy - 1, 4]]).forEach(([x, y, r]) => disc(px, x, y, r + 1, shade(lk.dark, 0.1)));
      (big ? [[cx - 5, cy, 4], [cx, cy - 2, 5], [cx + 5, cy, 4]] : [[cx - 3, cy, 3], [cx + 2, cy - 1, 4]]).forEach(([x, y, r]) => { disc(px, x, y, r, lk.main); px(x - 1, y - r + 1, lk.light, 2, 1); });
      break;
    case 'fur':
      px(x0 - 1, y0 - 1, INK, w + 2, h);
      px(x0, y0, lk.main, w, h - 2);
      for (let x = x0; x < x0 + w; x += 2) { px(x, y0 + h - 2, lk.main, 1, 2 + (x % 4 ? 1 : 0)); px(x, y0 + h, INK, 1, 1); }
      for (let x = x0 + 1; x < x0 + w - 1; x += 3) px(x, y0 + 1, lk.light, 1, 2);
      if (big) { spikeO(px, x0 + 3, y0, 4, 3, '#fff3dc'); spikeO(px, x0 + w - 4, y0, 4, 3, '#fff3dc'); }
      break;
    case 'drip':
      plate();
      (big ? [[x0 + 2, 4], [x0 + 6, 7], [x0 + 11, 5]] : [[x0 + 2, 3], [x0 + 7, 5]]).forEach(([x, l]) => { px(x - 1, y0 + h - 1, INK, 3, l + 1); px(x, y0 + h - 1, lk.main, 1, l); });
      px(x0 + 1, y0 + 1, lk.light, 3, 1);
      break;
    case 'gear': {
      const r = big ? 6 : 4;
      for (let a = 0; a < 8; a++) { const t = (a / 8) * Math.PI * 2; px(cx + Math.round(Math.cos(t) * (r + 1)) - 1, cy - 1 + Math.round(Math.sin(t) * (r + 1)) - 1, INK, 3, 3); px(cx + Math.round(Math.cos(t) * (r + 1)), cy - 1 + Math.round(Math.sin(t) * (r + 1)), lk.dark, 1, 1); }
      ball(px, cx, cy - 1, r, lk.main, lk.light);
      disc(px, cx, cy - 1, 1, lk.dark);
      break;
    }
    case 'plate':
      plate(lk.light);
      px(x0 + 1, y0 + 2, lk.main, w - 2, 2);
      for (const x of [x0 + 2, x0 + w - 3]) px(x, y0 + h - 3, INK, 1, 1);
      if (big) { px(x0 - 2, y0 + 1, INK, 3, h - 2); px(x0 + w - 1, y0 + 1, INK, 3, h - 2); }
      break;
    case 'rose':
      plate(lk.dark);
      ball(px, cx, cy - 2, big ? 4 : 3, lk.main, lk.light);
      px(cx - 1, cy - 3, shade(lk.main, -0.3), 2, 1); px(cx, cy - 2, shade(lk.main, -0.3), 1, 2);
      leaf(px, cx + 3, cy, 5, GREEN);
      break;
    case 'tank':
      plate(lk.dark);
      px(cx - 3, y0 - (big ? 8 : 5), INK, 7, big ? 9 : 6); px(cx - 2, y0 - (big ? 7 : 4), SILVER, 5, big ? 7 : 4);
      px(cx - 1, y0 - (big ? 5 : 3), lk.main, 3, big ? 4 : 2); px(cx - 1, y0 - (big ? 9 : 6), INK, 3, 2);
      break;
    case 'cluster':
      (big ? [[cx - 5, cy], [cx, cy - 2], [cx + 5, cy], [cx - 2, cy - 6], [cx + 3, cy - 6]] : [[cx - 3, cy], [cx + 2, cy - 1], [cx, cy - 5]]).forEach(([x, y]) => ball(px, x, y, big ? 3 : 2, lk.main, lk.light));
      break;
    case 'rind':
      plate(lk.main);
      for (let x = x0 + 2; x < x0 + w - 1; x += 3) px(x, y0 + 1, lk.dark, 1, h - 3);
      px(x0 + 1, y0 + h - 2, lk.light, w - 2, 1);
      if (big) for (const x of [x0 + 3, x0 + 7, x0 + 11]) px(x, y0 - 2, INK, 2, 2);
      break;
  }
}

// --- mantello (V) -------------------------------------------------------------------------

/** Mantello visto di lato: scende dalle spalle verso sinistra (l'eroe guarda a destra). */
export function drawCape(px: Px, lk: FruitLook, edge: CapeEdge): void {
  const top = -48, bottom = -12;
  const rows: [number, number][] = [];
  for (let y = top; y <= bottom; y++) {
    const t = (y - top) / (bottom - top);
    const left = Math.round(-11 - t * 12);
    const right = Math.round(-3 - t * 1);
    rows.push([left, right]);
  }
  if (edge === 'collar') {
    // colletto alto da vampiro dietro la testa
    for (const [x, h] of [[-10, 18], [-6, 22], [-2, 16]]) { spikeO(px, x, top + 2, h, 6, lk.dark); spike(px, x, top + 1, h - 4, 2, lk.main); }
  }
  rows.forEach(([l, r], i) => px(l - 1, top + i, INK, r - l + 3, 1));
  rows.forEach(([l, r], i) => {
    px(l, top + i, lk.main, r - l + 1, 1);
    px(r - 2, top + i, lk.dark, 2, 1); // fodera
    if (i % 6 === 3) px(l + 2, top + i, shade(lk.main, -0.18), Math.max(1, Math.round((r - l) * 0.4)), 1); // pieghe
  });
  px(-12, top, lk.light, 9, 1);
  drawEmblem(px, lk, -12, -30);
  const [bl, br] = rows[rows.length - 1];
  const W = br - bl + 1;
  // bordo inferiore
  switch (edge) {
    case 'flame':
      for (let x = bl; x < br - 1; x += 4) flame(px, x + 2, bottom + 1, 7 + ((x * 7) % 4), 4, lk, 1);
      break;
    case 'jagged':
      for (let x = bl; x < br - 1; x += 4) { spikeO(px, x + 2, bottom + 1, 6, 4, lk.main, 1); spike(px, x + 2, bottom + 1, 3, 1, lk.light, 1); }
      break;
    case 'leaf':
      for (let x = bl; x < br - 1; x += 5) leaf(px, x, bottom + 5, 6, x % 2 ? lk.main : lk.dark);
      break;
    case 'tatter':
      for (let x = bl; x < br; x += 3) { const l = 2 + ((x * 13) % 5); px(x - 1, bottom + 1, INK, 3, l + 1); px(x, bottom + 1, lk.main, 1, l); }
      break;
    case 'wave':
      for (let x = bl; x < br - 1; x += 4) { disc(px, x + 2, bottom + 1, 3, INK); disc(px, x + 2, bottom + 1, 2, lk.main); px(x + 1, bottom + 2, lk.light, 2, 1); }
      break;
    case 'drip':
      for (let x = bl + 1; x < br - 1; x += 3) { const l = 2 + ((x * 11) % 7); px(x - 1, bottom + 1, INK, 3, l + 1); px(x, bottom + 1, lk.main, 1, l); px(x, bottom + l, lk.light, 1, 1); }
      break;
    case 'collar':
      for (let x = bl; x < br - 1; x += 5) spikeO(px, x + 2, bottom + 1, 5, 5, lk.main, 1);
      break;
    case 'straight':
    default:
      px(bl, bottom + 1, INK, W, 2); px(bl, bottom, lk.light, W - 2, 1);
      break;
  }
}

// --- particelle dell'aura ----------------------------------------------------------------

export const motifKey = (fruitId: string) => `fx-motif-${fruitId}`;
export const MOTIF_SIZE = 11;

function drawMotif(px: Px, lk: FruitLook, kind: MotifKind): void {
  const c = 5; // centro della tela 11×11
  switch (kind) {
    case 'flame': flame(px, c, 9, 8, 5, lk); break;
    case 'flake': for (const [dx, dy] of [[0, -4], [0, 4], [-4, 0], [4, 0]]) px(c + Math.min(0, dx), c + Math.min(0, dy), lk.light, Math.abs(dx) + 1, Math.abs(dy) + 1); px(c - 1, c - 1, '#ffffff', 3, 3); px(c, c, lk.main, 1, 1); break;
    case 'rock': block(px, c - 3, c - 2, 6, 5, lk.main); break;
    case 'bolt': bolt(px, c - 1, 9, 2, 3, lk, 1); break;
    case 'leaf': leaf(px, c - 3, c + 2, 7, lk.main); break;
    case 'wisp': disc(px, c, c, 3, lk.main); disc(px, c - 1, c - 1, 1, lk.light); px(c + 2, c - 4, lk.main, 2, 2); break;
    case 'coil': for (let y = 0; y < 7; y += 2) { px(c - 2 + ((y / 2) % 2), 2 + y, lk.main, 4, 1); px(c - 2 + ((y / 2) % 2), 3 + y, lk.light, 4, 1); } break;
    case 'puff': disc(px, c, c, 4, lk.main); disc(px, c - 1, c - 1, 2, lk.light); break;
    case 'claw': for (let i = 0; i < 3; i++) for (let k = 0; k < 6; k++) px(2 + i * 3 + Math.floor(k / 2), 2 + k, i === 1 ? lk.light : lk.main, 1, 1); break;
    case 'drop': spike(px, c, 6, 4, 3, lk.main); disc(px, c, 7, 2, lk.main); px(c - 1, 6, lk.light, 1, 1); break;
    case 'shard': spike(px, c, c, 5, 5, lk.light); spike(px, c, c, 5, 5, lk.main, 1); px(c - 1, c - 2, '#ffffff', 1, 2); break;
    case 'gear': for (let a = 0; a < 6; a++) { const t = (a / 6) * Math.PI * 2; px(c + Math.round(Math.cos(t) * 4), c + Math.round(Math.sin(t) * 4), lk.dark, 1, 1); } disc(px, c, c, 3, lk.main); px(c, c, lk.dark, 1, 1); break;
    case 'spark': px(c, c - 4, lk.glow, 1, 9); px(c - 4, c, lk.glow, 9, 1); px(c - 1, c - 1, lk.main, 3, 3); break;
    case 'petal': disc(px, c - 1, c, 2, lk.main); disc(px, c + 1, c, 2, lk.main); spike(px, c, c + 1, 3, 5, lk.main, 1); px(c - 2, c - 1, lk.light, 1, 1); break;
    case 'cloud': disc(px, c - 2, c + 1, 2, lk.main); disc(px, c + 1, c, 3, lk.main); px(c, c - 2, lk.light, 2, 1); break;
    case 'bubble': ring(px, c, c, 4, 4, lk.light, 1); px(c - 2, c - 2, '#ffffff', 1, 1); break;
    case 'seed': disc(px, c, c, 2, '#2a1a14'); px(c - 1, c - 1, '#6b5a4a', 1, 1); break;
    case 'grape': disc(px, c, c, 3, lk.main); px(c - 1, c - 1, lk.light, 1, 1); break;
    case 'cherry': disc(px, c - 2, c + 2, 2, lk.main); disc(px, c + 2, c + 2, 2, lk.main); px(c - 2, c - 3, '#3f8a2e', 1, 3); px(c + 2, c - 3, '#3f8a2e', 1, 3); px(c - 2, c - 3, '#3f8a2e', 5, 1); break;
  }
}

export function makeMotifTexture(scene: Phaser.Scene, fruitId: string): string {
  const lk = FRUIT_LOOKS[fruitId];
  const key = motifKey(fruitId);
  if (lk) pixelTexture(scene, key, MOTIF_SIZE, MOTIF_SIZE, (px) => drawMotif(px, lk, lk.motif));
  return key;
}

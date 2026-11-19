import { block, INK, shade, type Px } from './render';

/** Mattoncini condivisi per disegnare le creature a blocchi. */
export type Draw = (px: Px, hit: boolean) => void;
export interface CreatureDef { w: number; h: number; draw: Draw }

export const GOLD = '#ffcf3a';

/** Blocco con angoli smussati (creature più morbide) e ombreggiatura a bande. */
export function rblock(px: Px, x: number, y: number, w: number, h: number, fill: string, r = 2): void {
  for (let i = 0; i <= r; i++) px(x + r - i, y + i, INK, w - 2 * (r - i), h - 2 * i);
  for (let i = 0; i <= r; i++) px(x + 1 + r - i, y + 1 + i, fill, w - 2 - 2 * (r - i), h - 2 - 2 * i);
  px(x + r + 1, y + 1, shade(fill, 0.3), w - 2 * r - 2, 1);
  px(x + 1, y + r + 1, shade(fill, 0.18), 1, h - 2 * r - 2);
  px(x + r + 1, y + h - 2, shade(fill, -0.25), w - 2 * r - 2, 1);
  px(x + w - 2, y + r + 1, shade(fill, -0.2), 1, h - 2 * r - 2);
}

/** Occhi: bianco con pupilla, iride e riflesso; arrabbiati o a X (colpito). */
export function eyes(px: Px, x: number, y: number, gap: number, hit: boolean, mood: 'ok' | 'angry' = 'ok', size = 4, iris = '#2a7fd4'): void {
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

export function bandana(px: Px, x: number, y: number, w: number, col: string): void {
  px(x, y, INK, w, 6);
  px(x + 1, y + 1, col, w - 2, 4); px(x + 1, y + 1, shade(col, 0.3), w - 2, 1); px(x + 1, y + 4, shade(col, -0.25), w - 2, 1);
  for (let i = x + 3; i < x + w - 3; i += 6) px(i, y + 2, '#fff3dc', 2, 2);
  px(x - 4, y + 2, INK, 5, 7); px(x - 3, y + 3, col, 3, 5);
}

/** Cappello da capitano squadrato con stemma inventato (gemma). */
export function captainHat(px: Px, x: number, y: number, w: number, col = '#2a2140'): void {
  block(px, x, y + 8, w, 6, col);
  block(px, x + 4, y, w - 8, 10, col);
  px(x + 5, y + 1, shade(col, 0.35), 3, 7);
  px(x + 4, y + 8, GOLD, w - 8, 2); px(x + 4, y + 9, shade(GOLD, -0.3), w - 8, 1);
  const cx = x + Math.floor(w / 2) - 2;
  px(cx - 1, y + 1, INK, 6, 6); px(cx, y + 2, '#e4342f', 4, 4); px(cx, y + 2, '#ff9a8a', 2, 2); px(cx + 3, y + 5, '#a8211e', 1, 1);
}


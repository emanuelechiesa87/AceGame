/**
 * Disposizione del campo di battaglia "in diagonale" (dalla 0.5.4): i nemici
 * occupano la metà alta dello schermo, spostati a destra; la squadra la metà
 * bassa, spostata a sinistra. Tutto è calcolato sulla parte di mondo davvero
 * visibile, così sugli schermi alti (S23) il campo si allunga invece di lasciare
 * una fascia vuota sotto i pulsanti.
 *
 * Modulo puro (niente Phaser): testato in `tests/battleLayout.test.ts`.
 */

export interface Box { x0: number; y0: number; x1: number; y1: number }
export interface Size { w: number; h: number }
export interface Spot { x: number; y: number; k: number }

export interface BattleFrame {
  /** Parte alta e bassa del mondo visibile (coordinate logiche). */
  top: number;
  bottom: number;
  /** Bordo superiore del pannello azioni. */
  panelTop: number;
  /** Spazio verticale in più rispetto a uno schermo 9:16 (0 su 720×1280). */
  ext: number;
  /** Riga del testo di stato in alto. */
  logY: number;
  /** Inizio del ponte nella scenografia. */
  groundTop: number;
  /** Scala dei nemici: più grandi quando lo schermo alto lascia spazio. */
  enemyK: number;
  bigEnemyK: number;
}

export const FIELD_W = 720;
/** Scala delle unità: i nemici sono "lontani", la squadra "vicina". */
export const ENEMY_K = 0.85;
export const BIG_ENEMY_K = 0.78; // élite e boss (già grandi di loro)
export const HERO_K = 0.95;
export const COMPANION_K = 0.9;

/** Spazio sopra lo sprite (fumetto dell'intenzione + nome) e sotto i piedi (barra HP). */
const ENEMY_HEAD = 96;
const ALLY_HEAD = 26;
const FOOT = 42;
const BUBBLE_HALF_W = 64;

export function frameFor(visTop: number, visBottom: number): BattleFrame {
  const panelTop = Math.max(930, Math.round(visBottom - 340));
  const ext = panelTop - 930;
  const top = visTop;
  const t = Math.min(1, ext / 140);
  return {
    top, bottom: visBottom, panelTop, ext, logY: Math.max(top + 54, 40), groundTop: Math.round(300 + ext * 0.35),
    enemyK: ENEMY_K + (1 - ENEMY_K) * t, bigEnemyK: BIG_ENEMY_K + (0.9 - BIG_ENEMY_K) * t,
  };
}

/** Posti fissi della squadra: eroe davanti, compagni attorno (2 davanti, 1 dietro). */
export function allySpots(f: BattleFrame): Spot[] {
  const y = f.panelTop - 72; // piedi della fila davanti
  return [
    { x: 236, y, k: HERO_K }, // eroe
    { x: 78, y: y - 6, k: COMPANION_K },
    { x: 404, y: y + 4, k: COMPANION_K },
    { x: 96, y: y - 214 - f.ext * 0.2, k: COMPANION_K * 0.92 },
  ];
}

export function enemyBox(x: number, y: number, s: Size): Box {
  const hw = Math.max(s.w / 2, BUBBLE_HALF_W);
  return { x0: x - hw, y0: y - s.h - ENEMY_HEAD, x1: x + hw, y1: y + FOOT };
}

export function allyBox(x: number, y: number, s: Size): Box {
  const hw = Math.max(s.w / 2, 66); // la barra HP è larga 130
  return { x0: x - hw, y0: y - s.h - ALLY_HEAD, x1: x + hw, y1: y + FOOT };
}

export function overlap(a: Box, b: Box): number {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return w > 0 && h > 0 ? w * h : 0;
}

/**
 * Sceglie dove far stare un nemico: tra i punti candidati prende quello che
 * si sovrappone meno a chi è già in campo e resta dentro lo schermo; a parità,
 * il più vicino al "punto focale" (davanti, un po' a destra).
 */
export function placeEnemy(f: BattleFrame, s: Size, occupied: Box[], first: boolean): { x: number; y: number } {
  const yMin = f.groundTop + 90, yMax = f.panelTop - 300;
  const focus = { x: first ? 470 : 430, y: first ? yMax - 10 : yMax - 60 };
  let best = { x: focus.x, y: focus.y, score: Infinity };
  for (let x = 150; x <= 650; x += 10) {
    for (let y = yMin; y <= yMax; y += 10) {
      const b = enemyBox(x, y, s);
      let score = 0;
      for (const o of occupied) score += overlap(b, o) * 4;
      // fuori dallo schermo o sotto il testo di stato
      score += Math.max(0, 6 - b.x0) * s.h * 6 + Math.max(0, b.x1 - (FIELD_W - 6)) * s.h * 6;
      score += Math.max(0, f.logY + 34 - b.y0) * s.w * 6;
      score += Math.hypot(x - focus.x, (y - focus.y) * 1.4) * 2;
      if (score < best.score) best = { x, y, score };
    }
  }
  return { x: best.x, y: best.y };
}

/** Un nemico toccabile: riquadro (sprite + fumetto + barra HP) e centro del corpo. */
export interface TapTarget { uid: string; box: Box; cx: number; cy: number }

/** Tolleranza del tocco fuori dai riquadri (coordinate logiche, ~un polpastrello). */
export const TAP_SLACK = 70;

/**
 * Sceglie il nemico toccato. Prima i riquadri che contengono il punto (se si
 * sovrappongono vince il corpo più vicino al dito); altrimenti il nemico il cui
 * riquadro dista meno di `TAP_SLACK`. Così un tocco un po' impreciso va comunque
 * a segno, e tra due nemici vicini vince quello indicato davvero.
 *
 * Nota (bug corretto nella 0.6.5): prima ogni nemico aveva un'area di tocco
 * Phaser su un Container, che Phaser sposta di metà larghezza e metà altezza:
 * l'area finiva in alto a sinistra rispetto allo sprite.
 */
export function pickTapTarget(x: number, y: number, targets: TapTarget[]): string | undefined {
  let best: string | undefined, bestScore = Infinity;
  for (const t of targets) {
    const dx = Math.max(t.box.x0 - x, 0, x - t.box.x1);
    const dy = Math.max(t.box.y0 - y, 0, y - t.box.y1);
    const out = Math.hypot(dx, dy);
    if (out > TAP_SLACK) continue;
    // dentro il riquadro conta solo la distanza dal corpo; fuori pesa molto la distanza dal riquadro
    const score = out * 10 + Math.hypot(x - t.cx, (y - t.cy) * 0.8);
    if (score < bestScore) { bestScore = score; best = t.uid; }
  }
  return best;
}

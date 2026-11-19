/**
 * F3 · Maree 1-10. Vincere una run alla Marea N sblocca la N+1.
 * I malus si sommano: la Marea N ha tutti quelli da 1 a N.
 * Tutti i valori sono qui, per ritararli in fretta dopo F4/F5 (F6).
 */
import { BALANCE } from './balance';

export interface TideEffects {
  startingPotions: number;
  /** Moltiplicatore delle monete guadagnate. */
  coinMult: number;
  normalRewardChance: number;
  restHealPct: number;
  restRevivePct: number;
  /** Affissi minimi delle élite in ogni mare. */
  eliteAffixMin: number;
  /** HP di tutti i nemici. */
  enemyHp: number;
  /** ATT dei nemici normali. */
  normalAtk: number;
  /** HP e ATT dei boss. */
  boss: number;
  /** Cura salpando verso un nuovo mare. */
  areaHealPct: number;
  /** Moltiplicatore dei colpi caricati. */
  chargedMult: number;
}

export interface TideDef { n: number; name: string; desc: string; apply: (e: TideEffects) => void }

export const TIDES: TideDef[] = [
  { n: 1, name: 'Stive vuote', desc: 'Si parte senza pozione', apply: (e) => { e.startingPotions = 0; } },
  { n: 2, name: 'Borse leggere', desc: 'Monete −20%', apply: (e) => { e.coinMult = 0.8; } },
  { n: 3, name: 'Bottino magro', desc: 'Ricompense negli scontri normali −25%', apply: (e) => { e.normalRewardChance *= 0.75; } },
  { n: 4, name: 'Legna umida', desc: 'Fuoco: cura 20%, rianima 30%', apply: (e) => { e.restHealPct = 0.2; e.restRevivePct = 0.3; } },
  { n: 5, name: 'Élite feroci', desc: 'Élite con 2 affissi in ogni mare', apply: (e) => { e.eliteAffixMin = 2; } },
  { n: 6, name: 'Scaglie dure', desc: 'Tutti i nemici +5% HP', apply: (e) => { e.enemyHp = 1.05; } },
  { n: 7, name: 'Zanne affilate', desc: 'Nemici normali +8% ATT', apply: (e) => { e.normalAtk = 1.08; } },
  { n: 8, name: 'Signori del mare', desc: 'Boss +8% HP e ATT', apply: (e) => { e.boss = 1.08; } },
  { n: 9, name: 'Mare grosso', desc: 'Cura salpando: 15%', apply: (e) => { e.areaHealPct = 0.15; } },
  { n: 10, name: 'Abisso', desc: 'Colpi caricati più forti (×2,3)', apply: (e) => { e.chargedMult = 2.3; } },
];

export const MAX_TIDE = TIDES.length;

export function clampTide(n: unknown): number {
  return typeof n === 'number' && isFinite(n) ? Math.max(0, Math.min(MAX_TIDE, Math.floor(n))) : 0;
}

/** Valori effettivi alla Marea `n` (0 = nessun malus). */
export function tideEffects(n: number): TideEffects {
  const e: TideEffects = {
    startingPotions: BALANCE.player.startingPotions,
    coinMult: 1,
    normalRewardChance: BALANCE.rewards.normalRewardChance,
    restHealPct: BALANCE.rest.healPct,
    restRevivePct: BALANCE.rest.reviveHpPct,
    eliteAffixMin: 0,
    enemyHp: 1,
    normalAtk: 1,
    boss: 1,
    areaHealPct: BALANCE.rewards.areaHealPct,
    chargedMult: BALANCE.combat.charged.mult,
  };
  for (const t of TIDES) if (t.n <= clampTide(n)) t.apply(e);
  return e;
}

/** Punteggio finale: ×(1 + 0,1·N). */
export function tideScore(score: number, n: number): number {
  return Math.round(score * (1 + BALANCE.tides.scoreBonus * clampTide(n)));
}

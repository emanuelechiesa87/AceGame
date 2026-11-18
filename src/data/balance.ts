/**
 * Coefficienti di bilanciamento centralizzati. Nessuna scena o sistema deve
 * contenere numeri "magici" di gameplay: vanno aggiunti qui.
 */
export const BALANCE = {
  version: 1,
  limits: {
    maxActivePowers: 3,
    maxCompanions: 3,
    maxPartySize: 4, // protagonista + 3 compagni
    hallOfFameSize: 3,
  },
  player: {
    baseHp: 100,
    baseAtk: 10,
    baseDef: 5,
    baseSpd: 10,
  },
  exploration: {
    walkSpeedPxPerSec: 120,
  },
} as const;

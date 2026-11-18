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
    baseAtk: 12,
    baseDef: 4,
    baseSpd: 10,
    startingPotions: 2,
  },
  combat: {
    defFactor: 4, // riduzione = 100 / (100 + DEF * defFactor)
    variance: 0.1, // ±10% sul danno
    critChance: 0.08,
    critMult: 1.5,
    guardMult: 0.5,
    vulnerableMult: 1.3,
    energyStart: 2,
    energyMax: 5,
    energyPerRound: 1,
    guardEnergy: 1, // energia extra quando ti difendi
    potionHealPct: 0.35,
    companionReviveHpPct: 0.3,
  },
  rewards: {
    restHealPct: 0.35,
    maxHpUp: 8,
    healRewardPct: 0.25,
  },
  score: {
    enemy: 10,
    elite: 50,
    boss: 200,
    areaCleared: 100,
    eventCompleted: 15,
    noKoBossBonus: 50,
  },
  exploration: {
    walkSpeedPxPerSec: 120,
  },
} as const;

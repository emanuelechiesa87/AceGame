/**
 * Coefficienti di bilanciamento centralizzati. Nessuna scena o sistema deve
 * contenere numeri "magici" di gameplay: vanno aggiunti qui.
 */
export const BALANCE = {
  version: 2,
  limits: {
    maxActivePowers: 1,
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
    acidGrowth: 1.4, // l'acido (Limone Acido) fa il 40% di danno in più a ogni turno
    energyStart: 2,
    energyMax: 5,
    energyPerRound: 1,
    guardEnergy: 1, // energia extra quando ti difendi
    potionHealPct: 0.35,
    /**
     * Colpi caricati (F1): le mosse "forti" dei nemici si caricano per un turno
     * (avviso nel fumetto + mirino sul bersaglio) e poi colpiscono più forte.
     * La Difesa le para quasi del tutto e ridà energia; se il bersaglio è un
     * compagno, l'eroe in Difesa si mette davanti e para al suo posto.
     */
    charged: { mult: 2.0, guardMult: 0.2, parryEnergy: 1, aimHero: 0.7 },
    companionReviveHpPct: 0.3,
  },
  /** Compagni: crescono a ogni mare, altrimenti dal secondo in poi non scalfiscono i nemici. */
  companions: {
    hpPerArea: 0.3,
    atkPerArea: 0.35,
  },
  /** Nemici più robusti: con un solo frutto molto forte il protagonista picchia duro. */
  enemies: {
    hpMult: 1.22,
    atkMult: 1.1,
    /** Ritocchi per grado: scontri normali che logorano, boss meno "muro" (fase 6). */
    tier: {
      normal: { hp: 1.1, atk: 1.4 },
      elite: { hp: 1, atk: 1.2 },
      boss: { hp: 0.85, atk: 0.9 },
    },
    /**
     * Chi colpiscono gli attacchi a bersaglio singolo (F1): probabilità di mirare
     * all'eroe e all'alleato più malconcio (in % di HP); il resto è a caso.
     */
    /** Affissi delle élite (F1): valori di ciascun tratto. */
    affix: {
      armored: { shieldPct: 0.25, def: 4 },
      swift: { every: 3 },
      vampire: { lifesteal: 0.4 },
      spiky: { reflect: 0.2 },
      regen: { pct: 0.05 },
      commander: { atkUp: 0.2 },
    },
    aim: {
      normal: { hero: 0.45, weakest: 0.35 },
      elite: { hero: 0.5, weakest: 0.4 },
      boss: { hero: 0.55, weakest: 0.35 },
    },
  },
  rewards: {
    restHealPct: 0.35,
    maxHpUp: 8,
    healRewardPct: 0.25,
    /** Cura (su HP max) di eroe e compagni quando si salpa verso un nuovo mare. */
    areaHealPct: 0.5,
    weights: { awaken: 26, artifact: 22, potion: 20, heal: 18, maxHp: 16 },
  },
  /** Sorteggio del frutto iniziale: peso per rarità e penalità per i frutti delle ultime run. */
  fruitDraw: {
    rarityWeight: { common: 60, rare: 30, epic: 10 },
    /** Moltiplicatore del peso per il frutto dell'ultima run, della penultima, della terzultima. */
    recentPenalty: [0.1, 0.35, 0.65],
  },
  unlocks: {
    pointsVictory: 2,
    pointsDefeat: 1,
    pointsPerFruit: 2, // ogni 2 punti un nuovo frutto entra nel pool iniziale
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

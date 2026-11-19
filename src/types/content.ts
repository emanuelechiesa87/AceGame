/** Tipi dei contenuti data-driven. Gli `id` sono stabili: non rinominarli mai
 *  dopo il rilascio, perché finiscono nei salvataggi. */

export type Rarity = 'common' | 'rare' | 'epic';
export type StatusId = 'burn' | 'poison' | 'stun' | 'shield' | 'atkUp' | 'vulnerable' | 'guard' | 'evade' | 'defUp' | 'slow' | 'reflect'
  // dalla 0.5.5 (fase 4): tanfo (-ATT), acido (danno che cresce, DIF annullata), bolla, mina, sciame di acini, gemella
  | 'weak' | 'acid' | 'bubble' | 'mine' | 'swarm' | 'twin';
export type TargetRule = 'enemy' | 'allEnemies' | 'self' | 'allAllies' | 'lowestAlly';
export type Intent = 'attack' | 'heavy' | 'defend' | 'debuff' | 'special';

export type Effect =
  | { kind: 'damage'; mult: number; lifesteal?: number; hits?: number }
  | { kind: 'heal'; pctMaxHp: number }
  | { kind: 'shield'; amount: number }
  | { kind: 'status'; status: StatusId; turns: number; value?: number; chance?: number }
  | { kind: 'cleanse' }
  /** Toglie lo scudo al bersaglio e lo dà a chi usa l'abilità. */
  | { kind: 'stealShield' }
  /** Chi usa l'abilità agisce di nuovo subito (solo protagonista). */
  | { kind: 'extraAction' }
  | { kind: 'summon'; enemyId: string; maxEnemies: number }
  /** Scioglie lo scudo del bersaglio (senza rubarlo). */
  | { kind: 'meltShield' }
  /** Chiude il bersaglio in una bolla: salta i turni, poi la bolla scoppia (danno `popMult`). I boss ci restano 1 turno. */
  | { kind: 'bubble'; turns: number; popMult: number }
  /** Piazza una mina: esplode all'inizio del prossimo turno del bersaglio (danno `mult`). */
  | { kind: 'mine'; mult: number }
  /** Aggiunge acini allo sciame dell'eroe: a fine turno ognuno colpisce il bersaglio (danno `mult`). */
  | { kind: 'swarm'; count: number; mult: number; max: number }
  /** Gemella: per `turns` turni ripete gli attacchi e i poteri dell'eroe con il `ratio` del danno. */
  | { kind: 'twin'; turns: number; ratio: number };

export interface Ability {
  id: string;
  name: string;
  description: string;
  target: TargetRule;
  effects: Effect[];
  intent?: Intent;
  /** Costo in energia (solo protagonista). */
  cost?: number;
}

export interface StatMods { maxHp?: number; atk?: number; def?: number; spd?: number }

export interface FruitDef {
  id: string;
  name: string;
  rarity: Rarity;
  element: 'fire' | 'ice' | 'storm' | 'stone' | 'life' | 'shadow' | 'elastic' | 'mist' | 'beast' | 'glue' | 'mirror' | 'time' | 'magnet'
    | 'blood' | 'stench' | 'acid' | 'bubble' | 'mine' | 'swarm' | 'twin';
  color: string;
  description: string;
  passive: StatMods;
  /** Potere ai livelli di risveglio I → V. */
  abilities: [Ability, Ability, Ability, Ability, Ability];
  startsUnlocked: boolean;
}

export interface ArtifactDef {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
  stats?: StatMods;
  powerDamageMult?: number;
  surviveLethalOncePerBattle?: boolean;
  healAfterVictoryPct?: number;
  /** Effetti in battaglia e nella run (0.6.1). */
  energyBonus?: number;
  potionHealPct?: number;
  openingShield?: number;
  critBonus?: number;
  basicPoison?: { chance: number; value: number; turns: number };
  companionDmgMult?: number;
  companionStartCharge?: number;
  thornsPct?: number;
  guardEnergyBonus?: number;
  reviveOncePerRunPct?: number;
  powerCostDown?: number;
  extraRewardChoice?: number;
}

export interface CompanionDef {
  id: string;
  name: string;
  role: 'difensore' | 'supporto' | 'assaltatore';
  description: string;
  stats: Required<StatMods>;
  /** Abilità automatica usata quando la condizione è vera, altrimenti attacco base. */
  auto: Ability & { when: 'allyBelowHalf' | 'always' };
  special: Ability;
  chargeMax: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  tier: 'normal' | 'elite' | 'boss';
  stats: Required<StatMods>;
  /** Sequenza ciclica di mosse: l'intenzione della prossima è visibile al giocatore. */
  pattern: string[];
  moves: Record<string, Ability>;
  /** Mossa unica usata una volta sotto il 50% di HP (boss). */
  enrage?: string;
}

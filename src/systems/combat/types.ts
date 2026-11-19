import type { Ability, Intent, StatusId } from '../../types/content';

export type Side = 'ally' | 'enemy';

export interface StatusInstance { id: StatusId; turns: number; value: number }

export interface Unit {
  uid: string;
  defId: string;
  name: string;
  side: Side;
  kind: 'hero' | 'companion' | 'enemy';
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  statuses: StatusInstance[];
  /** Ordine di inserimento, usato per spareggi stabili. */
  order: number;
  // compagni
  charge: number;
  chargeMax: number;
  // nemici
  patternIndex: number;
  nextMove?: string;
  enraged: boolean;
}

export interface BattleMods {
  powerDamageMult: number;
  surviveLethalOnce: boolean;
  /** Rinforzo dei nemici dell'area (anche quelli evocati). */
  enemyScale?: { hp: number; atk: number };
  /** Artefatti (0.6.1): tutti facoltativi, assenti = nessun effetto. */
  energyBonus?: number;
  potionHealPct?: number;
  openingShield?: number;
  critBonus?: number;
  basicPoison?: { chance: number; value: number; turns: number };
  companionDmgMult?: number;
  companionStartCharge?: number;
  thornsPct?: number;
  guardEnergyBonus?: number;
  /** Perla del Ritorno: a 0 HP l'eroe torna a questa frazione di HP (una volta). */
  reviveOncePct?: number;
  /** Cannone Abbandonato: i nemici iniziano con questa frazione di HP. */
  enemyStartHpPct?: number;
}

export type PlayerAction =
  | { type: 'attack'; targetUid: string }
  | { type: 'power'; abilityId: string; targetUid?: string }
  | { type: 'guard' }
  | { type: 'potion' }
  | { type: 'special'; companionUid: string; targetUid?: string };

/** Eventi prodotti dal motore: la scena li anima in sequenza (e può saltarli). */
export type BattleEvent =
  | { t: 'turn'; uid: string }
  | { t: 'use'; uid: string; ability: string; name: string; isPower?: boolean; isSpecial?: boolean; isTwin?: boolean }
  | { t: 'damage'; source: string; target: string; amount: number; absorbed: number; crit: boolean; kind: DamageKind }
  | { t: 'heal'; target: string; amount: number }
  | { t: 'shield'; target: string; amount: number }
  | { t: 'status'; target: string; status: StatusId; turns: number }
  | { t: 'resist'; target: string; status: StatusId }
  | { t: 'dodge'; target: string }
  | { t: 'steal'; source: string; target: string; amount: number }
  | { t: 'extraAction'; uid: string }
  | { t: 'cleanse'; target: string }
  | { t: 'stunned'; uid: string }
  | { t: 'ko'; uid: string }
  | { t: 'survive'; uid: string; by?: 'pearl' }
  | { t: 'summon'; unit: Unit }
  | { t: 'enrage'; uid: string }
  | { t: 'intent'; uid: string; intent: Intent; move: string }
  | { t: 'energy'; value: number }
  | { t: 'charge'; uid: string; value: number }
  | { t: 'round'; n: number }
  | { t: 'end'; result: 'victory' | 'defeat' }
  | { t: 'melt'; target: string; amount: number }
  /** Turno saltato dentro la bolla; `pop` = la bolla scoppia subito dopo. */
  | { t: 'bubbled'; uid: string; pop: boolean }
  /** Lo sciame di acini attacca (count acini); `lost` = acini scoppiati sull'eroe colpito. */
  | { t: 'swarm'; count: number }
  | { t: 'swarmLoss'; count: number };

export type DamageKind = 'hit' | 'burn' | 'poison' | 'reflect' | 'acid' | 'mine' | 'pop' | 'swarm';

export type Phase = 'awaitingInput' | 'victory' | 'defeat';

export interface PowerOption { ability: Ability; affordable: boolean }

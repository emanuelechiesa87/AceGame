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
  | { t: 'use'; uid: string; ability: string; name: string; isPower?: boolean; isSpecial?: boolean }
  | { t: 'damage'; source: string; target: string; amount: number; absorbed: number; crit: boolean; kind: 'hit' | 'burn' | 'poison' | 'reflect' }
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
  | { t: 'survive'; uid: string }
  | { t: 'summon'; unit: Unit }
  | { t: 'enrage'; uid: string }
  | { t: 'intent'; uid: string; intent: Intent; move: string }
  | { t: 'energy'; value: number }
  | { t: 'charge'; uid: string; value: number }
  | { t: 'round'; n: number }
  | { t: 'end'; result: 'victory' | 'defeat' };

export type Phase = 'awaitingInput' | 'victory' | 'defeat';

export interface PowerOption { ability: Ability; affordable: boolean }

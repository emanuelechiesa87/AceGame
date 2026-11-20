import type { Ability, AffixId, Intent, StatusId } from '../../types/content';

export type Side = 'ally' | 'enemy';

export interface StatusInstance { id: StatusId; turns: number; value: number; /** (F5) mina: frazione che colpisce gli altri nemici */ splash?: number }

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
  /** (F4b) Compagno con miccia accesa: al prossimo turno spara (Ottavio). */
  fuse?: boolean;
  // nemici
  patternIndex: number;
  nextMove?: string;
  enraged: boolean;
  /** Colpo caricato (F1): 'windup' = sta caricando, 'release' = al prossimo turno colpisce. */
  chargeState?: 'windup' | 'release';
  /** Bersaglio già scelto per la prossima mossa a bersaglio singolo (mostrato per i colpi caricati). */
  aimUid?: string;
  /** Turni di carica che restano (colpi caricati lunghi). */
  windupLeft?: number;
  /** (F1) Affissi delle élite. */
  affixes?: AffixId[];
  /** (F1) Seconda fase dei boss in corso. */
  phase?: 2;
  /** (F1) Si è già rialzato (vedi `EnemyDef.reviveOnce`). */
  revived?: boolean;
  /** (F1) Turni giocati (affisso Rapido: agisce due volte ogni 3 turni). */
  turns?: number;
}

/** Rinforzo dei nemici: per l'area e (F3 Maree) per grado. */
export interface EnemyScale { hp: number; atk: number; tier?: Partial<Record<'normal' | 'elite' | 'boss', { hp: number; atk: number }>> }

export interface BattleMods {
  powerDamageMult: number;
  surviveLethalOnce: boolean;
  /** Rinforzo dei nemici dell'area (anche quelli evocati). */
  enemyScale?: EnemyScale;
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
  /** (F1) Quanti affissi ricevono le élite (1 nei mari 1-2, 2 nei mari 3-4). */
  eliteAffixes?: number;
  /** (F3) Moltiplicatore dei colpi caricati (Marea 10); assente = BALANCE.combat.charged.mult. */
  chargedMult?: number;
  /** (F4b, 0.9.2) Artefatti delle costruzioni: tutti facoltativi. */
  parryShield?: number;
  guardMult?: number;
  parryBoost?: number;
  shieldMult?: number;
  specialEnergy?: number;
  atkPerCompanion?: number;
  poisonBonus?: { turns: number; value: number };
  poisonedVulnMult?: number;
  retaliatePoison?: { chance: number; value: number; turns: number };
  energyEvery?: number;
  energyMaxBonus?: number;
  firstPowerFree?: boolean;
  selfDamagePerTurn?: number;
}

/** Contatori dell'eroe in uno scontro (HP persi, cure, pozioni, HP minimo, turni giocati). */
export interface BattleTally {
  damageTaken: number;
  /** Tutte le cure ricevute in battaglia (pozioni, poteri, compagni, furto vita). */
  healed: number;
  /** Di cui da furto vita. */
  lifesteal: number;
  potions: number;
  minHp: number;
  /** Azioni dell'eroe (le speciali dei compagni non contano). */
  heroTurns: number;
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
  /** `aim` = alleato preso di mira (solo colpi caricati); `label` = testo del fumetto se diverso dal nome della mossa. */
  | { t: 'intent'; uid: string; intent: Intent; move: string; aim?: string; label?: string }
  /** Il nemico carica il colpo (primo turno dei due). */
  | { t: 'windup'; uid: string; aim?: string }
  /** L'eroe in Difesa si mette davanti al compagno preso di mira dal colpo caricato. */
  | { t: 'cover'; uid: string; ally: string }
  /** Colpo caricato parato con la Difesa: danno molto ridotto ed energia extra. */
  | { t: 'parry'; uid: string; energy: number }
  /** Carica interrotta (nemico congelato o nella bolla). */
  | { t: 'interrupt'; uid: string }
  /** (F4b) Ottavio accende la miccia: sparerà al prossimo turno. */
  | { t: 'fuse'; uid: string }
  /** (F1) Energia rubata all'eroe. */
  | { t: 'drain'; uid: string; amount: number; energy: number }
  /** (F1) Esplosione alla morte di un nemico. */
  | { t: 'burst'; uid: string }
  /** (F1) Il nemico si rialza. */
  | { t: 'rise'; uid: string; hp: number }
  /** (F1) Il boss entra nella seconda fase. */
  | { t: 'phase'; uid: string; name: string }
  /** (F1) Colpo annullato dall'immunità ai poteri. */
  | { t: 'immune'; target: string }
  /** (F1) Affissi delle élite, a inizio scontro. */
  | { t: 'affixes'; uid: string; affixes: AffixId[] }
  /** (F1) L'affisso Rapido fa agire di nuovo il nemico. */
  | { t: 'swift'; uid: string }
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

export type DamageKind = 'hit' | 'burn' | 'poison' | 'reflect' | 'acid' | 'mine' | 'pop' | 'swarm' | 'blast' | 'pact';

export type Phase = 'awaitingInput' | 'victory' | 'defeat';

export interface PowerOption { ability: Ability; affordable: boolean }

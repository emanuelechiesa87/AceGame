import type { NodeType } from '../data/areas';

export type AvatarVariant = 'a' | 'b';

export interface Stats {
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface MapStep {
  options: NodeType[];
  chosen?: NodeType;
}

export interface CompanionState { id: string; hp: number; charge: number }

/** Statistiche di un mare (F0: misurare durata e difficoltà reali). */
export interface AreaStats {
  battles: number;
  /** Azioni dell'eroe in battaglia. */
  heroTurns: number;
  /** HP persi in battaglia. */
  damageTaken: number;
  /** Cure ricevute in battaglia (pozioni, poteri, compagni, furto vita). */
  healedInBattle: number;
  /** Di cui da furto vita. */
  lifesteal: number;
  /** Cure fuori dalla battaglia (riposi, ricompense, eventi, cambio mare, artefatti). */
  healedOutside: number;
  potions: number;
  /** HP più bassi toccati nel mare, in frazione degli HP max (1 = mai colpito). */
  minHpPct: number;
  /** Secondi di gioco effettivo (app aperta e visibile). */
  playSec: number;
}

export interface RunStats { areas: AreaStats[] }

/** Stato temporaneo: esiste solo durante una run e si azzera alla morte. */
export interface RunState {
  runId: string;
  runSeed: number;
  /** Quanti numeri casuali sono già stati consumati: permette di riprendere la sequenza. */
  rngCursor: number;
  balanceVersion: number;
  startedAt: string;
  avatar: AvatarVariant;
  /** Nome scelto dal giocatore. */
  heroName: string;
  areaIndex: number;
  stepIndex: number;
  map: MapStep[];
  baseStats: Stats; // statistiche base + bonus permanenti di run (altari, livelli)
  currentHp: number;
  activeFruitIds: string[]; // un solo frutto per run
  /** Livello di risveglio del frutto (1..3). Assente nelle run salvate prima della 0.5. */
  fruitLevel?: number;
  artifactIds: string[];
  companions: CompanionState[]; // max BALANCE.limits.maxCompanions
  potions: number;
  usedFruitIds: string[];
  score: number;
  enemiesDefeated: number;
  elitesDefeated: number;
  bossesDefeated: number;
  eventsCompleted: number;
  heroKos: number;
  /** Perla del Ritorno già usata in questa run. */
  pearlUsed?: boolean;
  /** Cannone Abbandonato: i nemici del prossimo scontro partono con questa frazione di HP. */
  nextBattleEnemyHpPct?: number;
  /** Eventi già incontrati in questa run (non si ripetono). */
  seenEventIds?: string[];
  /** Monete della run (F2, 0.7.0; assenti nelle run salvate prima). */
  coins?: number;
  /** F3 · Marea della run (assente = 0). */
  tide?: number;
  /** Statistiche per mare (assenti nelle run salvate prima della 0.6.4). */
  stats?: RunStats;
}

export interface HallOfFameEntry {
  score: number;
  heroName?: string;
  date: string;
  durationSec: number;
  maxArea: number;
  bossesDefeated: number;
  enemiesDefeated: number;
  fruits: string[];
  result: 'defeat' | 'victory';
  /** F3 · Marea della run (assente = 0). */
  tide?: number;
}

/** Riassunto di una run conclusa, tenuto nel salvataggio (ultime 10) per misurare il bilanciamento. */
export interface RunLogEntry {
  date: string;
  result: 'defeat' | 'victory';
  fruit: string;
  fruitLevel: number;
  maxArea: number;
  stats: RunStats;
}

/** Stato permanente: sopravvive alla morte. */
export interface PersistentGameState {
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  selectedAvatar: AvatarVariant;
  /** Ultimo nome usato, proposto alla run successiva. */
  lastHeroName: string;
  /** Frutti mangiati almeno una volta (collezione). */
  discoveredFruitIds: string[];
  /** Frutti entrati nel pool iniziale grazie ai punti sblocco. */
  unlockedFruitIds: string[];
  /** Frutti iniziali delle ultime run (il più recente per primo): pesano meno al sorteggio. */
  recentFruitIds: string[];
  /** Punti verso il prossimo sblocco (vittoria +2, sconfitta +1). */
  unlockPoints: number;
  discoveredArtifactIds: string[];
  metCompanionIds: string[];
  hallOfFame: HallOfFameEntry[];
  /** Ultime run concluse con le statistiche (la più recente per prima). */
  runLog?: RunLogEntry[];
  /** F3 · Marea più alta sbloccata (0 = solo la base). */
  maxTideUnlocked?: number;
  /** F3 · Marea più alta vinta con ciascun frutto (id → Marea). */
  bestTideByFruit?: Record<string, number>;
  /** F3 · Ultima Marea scelta al menu. */
  selectedTide?: number;
  lifetime: { runs: number; victories: number; enemiesDefeated: number };
  settings: GameSettings;
}

export interface GameSettings {
  fastAnimations: boolean;
  /** volume della musica 0..1 */
  music: number;
  /** volume degli effetti 0..1 */
  sfx: number;
  /** vibrazione sui colpi importanti (dove il telefono la supporta) */
  vibration: boolean;
  /** tutorial della prima battaglia già visto */
  tutorialDone: boolean;
}

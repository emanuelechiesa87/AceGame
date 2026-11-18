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
  activeFruitIds: string[]; // max BALANCE.limits.maxActivePowers
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
}

/** Stato permanente: sopravvive alla morte. */
export interface PersistentGameState {
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  selectedAvatar: AvatarVariant;
  /** Ultimo nome usato, proposto alla run successiva. */
  lastHeroName: string;
  discoveredFruitIds: string[];
  discoveredArtifactIds: string[];
  metCompanionIds: string[];
  hallOfFame: HallOfFameEntry[];
  lifetime: { runs: number; victories: number; enemiesDefeated: number };
  settings: { fastAnimations: boolean };
}

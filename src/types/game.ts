export type AvatarVariant = 'a' | 'b';

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

/** Stato temporaneo: esiste solo durante una run e si azzera alla morte. */
export interface RunState {
  runId: string;
  runSeed: number;
  balanceVersion: number;
  startedAt: string;
  avatar: AvatarVariant;
  currentAreaIndex: number;
  currentEncounterIndex: number;
  playerStats: Stats;
  currentHp: number;
  activePowerIds: string[]; // max BALANCE.limits.maxActivePowers
  runArtifactIds: string[];
  companionIds: string[]; // max BALANCE.limits.maxCompanions
  runScore: number;
  enemiesDefeated: number;
  elitesDefeated: number;
  bossesDefeated: number;
}

export interface HallOfFameEntry {
  score: number;
  date: string;
  durationSec: number;
  maxArea: number;
  bossesDefeated: number;
  enemiesDefeated: number;
  result: 'defeat' | 'victory';
}

/** Stato permanente: sopravvive alla morte, salvato in IndexedDB (M3). */
export interface PersistentGameState {
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  selectedAvatar: AvatarVariant;
  discoveredPowerIds: string[];
  unlockedPowerIds: string[];
  discoveredArtifactIds: string[];
  unlockedArtifactIds: string[];
  hallOfFame: HallOfFameEntry[];
  settings: { skipAnimations: boolean };
}

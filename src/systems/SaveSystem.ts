import { BALANCE } from '../data/balance';
import type { HallOfFameEntry, PersistentGameState } from '../types/game';

export const SCHEMA_VERSION = 1;
const KEY = 'acegame.save';

export function emptyPersistentState(now = new Date()): PersistentGameState {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    selectedAvatar: 'a',
    lastHeroName: '',
    discoveredFruitIds: [],
    unlockedFruitIds: [],
    recentFruitIds: [],
    unlockPoints: 0,
    discoveredArtifactIds: [],
    metCompanionIds: [],
    hallOfFame: [],
    lifetime: { runs: 0, victories: 0, enemiesDefeated: 0 },
    settings: { fastAnimations: false },
  };
}

/** Ordinamento Top 3: punteggio, poi area più alta, poi durata più breve. */
export function insertHallOfFame(list: HallOfFameEntry[], entry: HallOfFameEntry): { list: HallOfFameEntry[]; rank: number } {
  const all = [...list, entry].sort((a, b) => b.score - a.score || b.maxArea - a.maxArea || a.durationSec - b.durationSec);
  const top = all.slice(0, BALANCE.limits.hallOfFameSize);
  return { list: top, rank: top.indexOf(entry) };
}

/** Convalida minima: rifiuta dati che non sembrano un salvataggio di questo gioco. */
export function parseSave(raw: string): PersistentGameState {
  const data = JSON.parse(raw) as Partial<PersistentGameState>;
  if (typeof data !== 'object' || data === null || typeof data.schemaVersion !== 'number') throw new Error('Formato non riconosciuto');
  if (data.schemaVersion > SCHEMA_VERSION) throw new Error('Salvataggio di una versione più recente del gioco');
  // migrazioni future: if (data.schemaVersion === 1) { ... }
  const base = emptyPersistentState();
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
  return {
    ...base,
    ...data,
    schemaVersion: SCHEMA_VERSION,
    lastHeroName: typeof data.lastHeroName === 'string' ? data.lastHeroName.slice(0, 12) : '',
    discoveredFruitIds: arr(data.discoveredFruitIds),
    unlockedFruitIds: arr(data.unlockedFruitIds),
    recentFruitIds: arr(data.recentFruitIds).slice(0, 3),
    unlockPoints: typeof data.unlockPoints === 'number' && data.unlockPoints >= 0 ? Math.floor(data.unlockPoints) : 0,
    discoveredArtifactIds: arr(data.discoveredArtifactIds),
    metCompanionIds: arr(data.metCompanionIds),
    hallOfFame: Array.isArray(data.hallOfFame) ? data.hallOfFame.slice(0, BALANCE.limits.hallOfFameSize) : [],
    lifetime: { ...base.lifetime, ...(data.lifetime ?? {}) },
    settings: { ...base.settings, ...(data.settings ?? {}) },
  };
}

/**
 * Salvataggio locale minimo (M1) su localStorage. In M3 passerà a IndexedDB con
 * export/import. Se il salvataggio esistente è illeggibile NON viene sovrascritto:
 * viene copiato in una chiave di backup.
 */
export class SaveSystem {
  private state: PersistentGameState;
  readonly loadError: string | null = null;

  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null) {
    this.state = emptyPersistentState();
    const raw = this.safeGet(KEY);
    if (raw) {
      try {
        this.state = parseSave(raw);
      } catch (err) {
        this.loadError = (err as Error).message;
        this.safeSet(`${KEY}.corrupt.${Date.now()}`, raw);
      }
    }
  }

  get data(): PersistentGameState { return this.state; }

  update(mutate: (s: PersistentGameState) => void): void {
    mutate(this.state);
    this.state.updatedAt = new Date().toISOString();
    this.safeSet(KEY, JSON.stringify(this.state));
  }

  private safeGet(k: string): string | null {
    try { return this.storage?.getItem(k) ?? null; } catch { return null; }
  }

  private safeSet(k: string, v: string): void {
    try { this.storage?.setItem(k, v); } catch (err) { console.warn('Salvataggio non riuscito', err); }
  }
}

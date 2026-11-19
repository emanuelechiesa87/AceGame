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
    runLog: [],
    lifetime: { runs: 0, victories: 0, enemiesDefeated: 0 },
    settings: { fastAnimations: false, music: 0.6, sfx: 0.8, vibration: true, tutorialDone: false },
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
    runLog: Array.isArray(data.runLog) ? data.runLog.filter((r) => r && typeof r === 'object' && Array.isArray(r.stats?.areas)).slice(0, 10) : [],
    lifetime: { ...base.lifetime, ...(data.lifetime ?? {}) },
    settings: cleanSettings(base.settings, data.settings),
  };
}

function cleanSettings(base: PersistentGameState['settings'], raw: unknown): PersistentGameState['settings'] {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const vol = (v: unknown, d: number) => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(1, v)) : d);
  const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
  return {
    fastAnimations: bool(r.fastAnimations, base.fastAnimations),
    music: vol(r.music, base.music),
    sfx: vol(r.sfx, base.sfx),
    vibration: bool(r.vibration, base.vibration),
    tutorialDone: bool(r.tutorialDone, base.tutorialDone),
  };
}

export const SAVE_KEY = KEY;

/**
 * Salvataggio locale su localStorage (veloce, sincrono), con copia in IndexedDB
 * tramite `onWrite` (vedi DurableStore). Se il salvataggio esistente è illeggibile
 * NON viene sovrascritto: viene copiato in una chiave di backup.
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

  /** Chiamato a ogni scrittura (copia di sicurezza in IndexedDB). */
  onWrite?: (key: string, raw: string) => void;

  get data(): PersistentGameState { return this.state; }

  update(mutate: (s: PersistentGameState) => void): void {
    mutate(this.state);
    this.state.updatedAt = new Date().toISOString();
    this.write();
  }

  /** Sostituisce tutto lo stato (importazione o recupero dalla copia di sicurezza). */
  replace(state: PersistentGameState, touch = true): void {
    this.state = state;
    if (touch) this.state.updatedAt = new Date().toISOString();
    this.write();
  }

  private write(): void {
    const raw = JSON.stringify(this.state);
    this.safeSet(KEY, raw);
    this.onWrite?.(KEY, raw);
  }

  private safeGet(k: string): string | null {
    try { return this.storage?.getItem(k) ?? null; } catch { return null; }
  }

  private safeSet(k: string, v: string): void {
    try { this.storage?.setItem(k, v); } catch (err) { console.warn('Salvataggio non riuscito', err); }
  }
}

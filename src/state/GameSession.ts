import { BALANCE } from '../data/balance';
import { FRUITS } from '../data/fruits';
import { RunController } from '../systems/RunController';
import { emptyPersistentState, insertHallOfFame, parseSave, SAVE_KEY, SaveSystem } from '../systems/SaveSystem';
import { DurableStore } from '../systems/DurableStore';
import { buildExport, parseExport } from '../systems/SaveTransfer';
import { BUILD_VERSION } from '../app/config';
import { randomSeed } from '../systems/Rng';
import type { AvatarVariant, HallOfFameEntry, RunState } from '../types/game';
import { createRunState } from './RunState';

const RUN_KEY = 'acegame.run';

/**
 * Sessione condivisa tra le scene: salvataggio permanente, run in corso e
 * controller delle regole. La run viene salvata a ogni nodo completato, così
 * un refresh o la chiusura di Chrome non la fanno perdere.
 */
class GameSessionStore {
  readonly save = new SaveSystem();
  run: RunState | null = null;
  ctl: RunController | null = null;

  constructor() {
    this.save.onWrite = (k, raw) => DurableStore.put(k, raw);
  }

  /**
   * All'avvio: recupera da IndexedDB salvataggio e run se localStorage è stato svuotato
   * o è più vecchio; poi riallinea la copia. Non lancia mai errori.
   */
  async restoreFromDurable(): Promise<'restored' | 'ok'> {
    let restored = false;
    try {
      const [rawSave, rawRun] = await Promise.all([DurableStore.get(SAVE_KEY), DurableStore.get(RUN_KEY)]);
      const local = this.save.data;
      const localEmpty = !local.lifetime.runs && !local.hallOfFame.length && !local.discoveredFruitIds.length;
      if (rawSave) {
        try {
          const durable = parseSave(rawSave);
          if (localEmpty || durable.updatedAt > local.updatedAt) {
            if (durable.lifetime.runs || durable.discoveredFruitIds.length) { this.save.replace(durable, false); restored = true; }
          }
        } catch { /* copia illeggibile: si tiene quella locale */ }
      }
      if (!this.hasSavedRun() && rawRun) {
        try { localStorage.setItem(RUN_KEY, rawRun); restored = true; } catch { /* ignorato */ }
      }
      // riallinea la copia di sicurezza con lo stato attuale
      DurableStore.put(SAVE_KEY, JSON.stringify(this.save.data));
      let localRun: string | null = null;
      try { localRun = localStorage.getItem(RUN_KEY); } catch { /* ignorato */ }
      DurableStore.put(RUN_KEY, localRun);
      void DurableStore.requestPersistence();
    } catch { /* IndexedDB non disponibile */ }
    return restored ? 'restored' : 'ok';
  }

  /** Testo del file di esportazione (progressi + eventuale run in corso). */
  exportText(): string {
    let run: RunState | null = this.run;
    if (!run) { try { const raw = localStorage.getItem(RUN_KEY); run = raw ? (JSON.parse(raw) as RunState) : null; } catch { run = null; } }
    return buildExport(this.save.data, run, BUILD_VERSION);
  }

  /** Importa un file esportato: sostituisce i progressi (e la run, se presente). */
  importText(text: string): { hasRun: boolean } {
    const { save, run } = parseExport(text);
    this.run = null; this.ctl = null;
    this.save.replace(save);
    if (run) { try { localStorage.setItem(RUN_KEY, JSON.stringify(run)); } catch { /* ignorato */ } DurableStore.put(RUN_KEY, JSON.stringify(run)); }
    else this.clearRun();
    return { hasRun: !!run };
  }

  /** Cancella tutti i progressi (tiene solo le impostazioni). */
  resetProgress(): void {
    const settings = { ...this.save.data.settings };
    const fresh = emptyPersistentState();
    fresh.settings = settings;
    this.save.replace(fresh);
    this.clearRun();
  }

  get selectedAvatar(): AvatarVariant { return this.save.data.selectedAvatar; }
  set selectedAvatar(v: AvatarVariant) { this.save.update((s) => (s.selectedAvatar = v)); }

  /** Frutti nel pool iniziale oltre a quelli di partenza: sbloccati o già mangiati. */
  unlockedFruitIds(): string[] {
    const s = this.save.data;
    return FRUITS.filter((f) => s.unlockedFruitIds.includes(f.id) || s.discoveredFruitIds.includes(f.id)).map((f) => f.id);
  }

  /** Frutti non ancora nel pool, nell'ordine in cui si sbloccano: comuni, rari, epici. */
  lockedFruitIds(): string[] {
    const open = new Set(this.unlockedFruitIds());
    const order = { common: 0, rare: 1, epic: 2 } as const;
    return FRUITS.filter((f) => !f.startsUnlocked && !open.has(f.id)).sort((a, b) => order[a.rarity] - order[b.rarity]).map((f) => f.id);
  }

  /** Assegna i punti di fine run e sblocca i frutti maturati. Ritorna i frutti sbloccati ora. */
  private grantUnlocks(result: 'victory' | 'defeat'): string[] {
    const U = BALANCE.unlocks;
    const unlocked: string[] = [];
    this.save.update((s) => {
      s.unlockPoints += result === 'victory' ? U.pointsVictory : U.pointsDefeat;
      while (s.unlockPoints >= U.pointsPerFruit) {
        const next = this.lockedFruitIds()[0];
        if (!next) { s.unlockPoints = 0; break; }
        s.unlockPoints -= U.pointsPerFruit;
        s.unlockedFruitIds.push(next);
        unlocked.push(next);
      }
    });
    return unlocked;
  }

  beginRun(avatar: AvatarVariant, heroName = this.save.data.lastHeroName || 'Eroe'): string {
    const name = heroName.trim() || 'Eroe';
    this.save.update((s) => (s.lastHeroName = name));
    this.run = createRunState(avatar, randomSeed(), new Date(), name);
    this.ctl = new RunController(this.run);
    const fruit = this.ctl.start(this.unlockedFruitIds(), this.save.data.recentFruitIds);
    this.discover({ fruits: [fruit] });
    this.save.update((s) => (s.recentFruitIds = [fruit, ...s.recentFruitIds.filter((x) => x !== fruit)].slice(0, 3)));
    this.save.update((s) => s.lifetime.runs++);
    this.persistRun();
    return fruit;
  }

  /** Registra scoperte permanenti (collezione). */
  discover(d: { fruits?: string[]; artifacts?: string[]; companions?: string[] }): void {
    this.save.update((s) => {
      const add = (arr: string[], ids?: string[]) => ids?.forEach((id) => !arr.includes(id) && arr.push(id));
      add(s.discoveredFruitIds, d.fruits);
      add(s.discoveredArtifactIds, d.artifacts);
      add(s.metCompanionIds, d.companions);
    });
  }

  persistRun(): void {
    if (!this.run) return;
    const raw = JSON.stringify(this.run);
    try { localStorage.setItem(RUN_KEY, raw); } catch { /* quota o privacy: la run resta in memoria (e in IndexedDB) */ }
    DurableStore.put(RUN_KEY, raw);
  }

  /** Ritorna true se c'è una run interrotta da riprendere. */
  hasSavedRun(): boolean {
    try { return !!localStorage.getItem(RUN_KEY); } catch { return false; }
  }

  resumeRun(): boolean {
    try {
      const raw = localStorage.getItem(RUN_KEY);
      if (!raw) return false;
      const run = JSON.parse(raw) as RunState;
      if (!Array.isArray(run.map) || typeof run.runSeed !== 'number') throw new Error('run non valida');
      if (typeof run.heroName !== 'string' || !run.heroName) run.heroName = 'Eroe'; // run salvate prima del nome
      run.activeFruitIds = run.activeFruitIds.slice(0, 1); // dalla 0.5: un solo frutto per run
      run.fruitLevel = run.fruitLevel ?? 1;
      this.run = run;
      this.ctl = new RunController(run);
      return true;
    } catch {
      this.clearRun();
      return false;
    }
  }

  /** Fine run: aggiorna record e statistiche, cancella SOLO lo stato temporaneo. */
  endRun(result: 'victory' | 'defeat'): { entry: HallOfFameEntry; rank: number; unlocked: string[] } | null {
    const run = this.run;
    if (!run) return null;
    const entry: HallOfFameEntry = {
      score: run.score,
      heroName: run.heroName,
      date: new Date().toISOString(),
      durationSec: Math.round((Date.now() - new Date(run.startedAt).getTime()) / 1000),
      maxArea: run.areaIndex + 1,
      bossesDefeated: run.bossesDefeated,
      enemiesDefeated: run.enemiesDefeated + run.elitesDefeated,
      fruits: [...run.usedFruitIds],
      result,
    };
    let rank = -1;
    this.save.update((s) => {
      const r = insertHallOfFame(s.hallOfFame, entry);
      s.hallOfFame = r.list;
      rank = r.rank;
      s.lifetime.enemiesDefeated += entry.enemiesDefeated;
      if (result === 'victory') s.lifetime.victories++;
    });
    const unlocked = this.grantUnlocks(result);
    this.clearRun();
    return { entry, rank, unlocked };
  }

  abandonRun(): void {
    this.clearRun();
  }

  private clearRun(): void {
    this.run = null;
    this.ctl = null;
    try { localStorage.removeItem(RUN_KEY); } catch { /* ignorato */ }
    DurableStore.put(RUN_KEY, null);
  }
}

export const GameSession = new GameSessionStore();

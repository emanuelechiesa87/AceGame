import { FRUITS } from '../data/fruits';
import { RunController } from '../systems/RunController';
import { insertHallOfFame, SaveSystem } from '../systems/SaveSystem';
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

  get selectedAvatar(): AvatarVariant { return this.save.data.selectedAvatar; }
  set selectedAvatar(v: AvatarVariant) { this.save.update((s) => (s.selectedAvatar = v)); }

  /** Frutti scoperti che non partono già sbloccati: entrano nel pool iniziale. */
  unlockedFruitIds(): string[] {
    return this.save.data.discoveredFruitIds.filter((id) => FRUITS.some((f) => f.id === id));
  }

  beginRun(avatar: AvatarVariant): string {
    this.run = createRunState(avatar, randomSeed());
    this.ctl = new RunController(this.run);
    const fruit = this.ctl.start(this.unlockedFruitIds());
    this.discover({ fruits: [fruit] });
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
    try { localStorage.setItem(RUN_KEY, JSON.stringify(this.run)); } catch { /* quota o privacy: la run resta in memoria */ }
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
      this.run = run;
      this.ctl = new RunController(run);
      return true;
    } catch {
      this.clearRun();
      return false;
    }
  }

  /** Fine run: aggiorna record e statistiche, cancella SOLO lo stato temporaneo. */
  endRun(result: 'victory' | 'defeat'): { entry: HallOfFameEntry; rank: number } | null {
    const run = this.run;
    if (!run) return null;
    const entry: HallOfFameEntry = {
      score: run.score,
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
    this.clearRun();
    return { entry, rank };
  }

  abandonRun(): void {
    this.clearRun();
  }

  private clearRun(): void {
    this.run = null;
    this.ctl = null;
    try { localStorage.removeItem(RUN_KEY); } catch { /* ignorato */ }
  }
}

export const GameSession = new GameSessionStore();

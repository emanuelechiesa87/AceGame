import type { AvatarVariant, RunState } from '../types/game';

/**
 * Contenitore in memoria condiviso tra le scene. In M0 non c'è persistenza:
 * IndexedDB, export/import e migrazioni arrivano in M3.
 */
class GameSessionStore {
  selectedAvatar: AvatarVariant = 'a';
  run: RunState | null = null;

  endRun(): void {
    this.run = null;
  }
}

export const GameSession = new GameSessionStore();

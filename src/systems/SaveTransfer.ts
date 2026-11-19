import type { PersistentGameState, RunState } from '../types/game';
import { parseSave } from './SaveSystem';

/**
 * File di esportazione dei progressi (dalla 0.6): collezione, record, sblocchi,
 * impostazioni e, se c'è, la run in corso. Serve per cambiare telefono o fare una copia.
 */
export const EXPORT_FORMAT = 'acegame-save';

export interface ExportFile {
  format: typeof EXPORT_FORMAT;
  gameVersion: string;
  exportedAt: string;
  save: PersistentGameState;
  run: RunState | null;
}

export function buildExport(save: PersistentGameState, run: RunState | null, gameVersion: string, now = new Date()): string {
  const file: ExportFile = { format: EXPORT_FORMAT, gameVersion, exportedAt: now.toISOString(), save, run };
  return JSON.stringify(file);
}

export function exportFileName(now = new Date()): string {
  const d = now.toISOString().slice(0, 10);
  return `acegame-salvataggio-${d}.json`;
}

/** Legge un file esportato. Lancia un errore leggibile se il file non va bene. */
export function parseExport(text: string): { save: PersistentGameState; run: RunState | null } {
  let data: Partial<ExportFile>;
  try { data = JSON.parse(text) as Partial<ExportFile>; } catch { throw new Error('Il file non è un salvataggio di AceGame'); }
  if (!data || typeof data !== 'object' || data.format !== EXPORT_FORMAT || !data.save) throw new Error('Il file non è un salvataggio di AceGame');
  const save = parseSave(JSON.stringify(data.save));
  const r = data.run as RunState | null | undefined;
  const run = r && Array.isArray(r.map) && typeof r.runSeed === 'number' && Array.isArray(r.activeFruitIds) ? r : null;
  return { save, run };
}

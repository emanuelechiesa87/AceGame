import type { AreaStats, RunStats } from '../types/game';

/** Somma delle statistiche di tutti i mari (HP minimo = il più basso). */
export function totalStats(stats: RunStats): AreaStats {
  const t: AreaStats = { battles: 0, heroTurns: 0, damageTaken: 0, healedInBattle: 0, lifesteal: 0, healedOutside: 0, potions: 0, minHpPct: 1, playSec: 0 };
  for (const a of stats.areas) {
    t.battles += a.battles; t.heroTurns += a.heroTurns; t.damageTaken += a.damageTaken;
    t.healedInBattle += a.healedInBattle; t.lifesteal += a.lifesteal; t.healedOutside += a.healedOutside;
    t.potions += a.potions; t.playSec += a.playSec; t.minHpPct = Math.min(t.minHpPct, a.minHpPct);
  }
  return t;
}

export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
}

/** Righe della tabella del riepilogo: etichetta + un valore per mare + totale. */
export function statsRows(stats: RunStats): { label: string; values: string[] }[] {
  const cols = [...stats.areas, totalStats(stats)];
  const row = (label: string, f: (a: AreaStats) => string) => ({ label, values: cols.map(f) });
  return [
    row('Tempo', (a) => formatDuration(a.playSec)),
    row('Scontri', (a) => String(a.battles)),
    row('Turni (media)', (a) => (a.battles ? (a.heroTurns / a.battles).toFixed(1) : '-')),
    row('HP persi', (a) => String(a.damageTaken)),
    row('Cure in lotta', (a) => String(a.healedInBattle)),
    row('· furto vita', (a) => String(a.lifesteal)),
    row('Cure fuori', (a) => String(a.healedOutside)),
    row('Pozioni', (a) => String(a.potions)),
    row('HP minimo', (a) => `${Math.round(a.minHpPct * 100)}%`),
  ];
}

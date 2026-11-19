import { describe, expect, it } from 'vitest';
import { FRUITS } from '../src/data/fruits';
import { playRun } from './sim';

describe('Run completa (simulazione senza grafica)', () => {
  it('una run di 4 mari si può completare', () => {
    const results = Array.from({ length: 300 }, (_, i) => playRun(i + 1));
    const wins = results.filter((r) => r.won).length;
    const rate = wins / results.length;
    const deaths = results.filter((r) => !r.won).reduce<Record<string, number>>((m, r) => { const k = `${r.area + 1}.${r.step}`; m[k] = (m[k] ?? 0) + 1; return m; }, {});
    const reached = [0, 1, 2, 3].map((a) => results.filter((r) => r.area >= a).length);
    console.log(`Arrivano al mare 1/2/3/4: ${reached.join(' / ')} · livello medio del frutto a fine run: ${(results.reduce((s, r) => s + r.level, 0) / results.length).toFixed(1)}`);
    console.log(`Vittorie: ${(rate * 100).toFixed(0)}% · morti per passo: ${JSON.stringify(deaths)} · punteggio medio vittorie: ${Math.round(results.filter((r) => r.won).reduce((s, r) => s + r.score, 0) / Math.max(1, wins))}`);
    // giocatore ingenuo (non legge le intenzioni, prende sempre la prima tappa = lo scontro):
    // obiettivo del piano < 10% di vittorie
    expect(rate).toBeLessThan(0.1);
    // la run resta completabile da un giocatore attento
    const smart = Array.from({ length: 60 }, (_, i) => playRun(i + 1, undefined, 'smart'));
    expect(smart.filter((r) => r.won).length).toBeGreaterThan(0);
  });

  it('ogni frutto da solo porta a vincere: nessun frutto inutile o rotto', () => {
    // giocatore attento: nessun frutto deve essere "rotto" (le percentuali fini si misurano col rapporto)
    const rates = FRUITS.map((f) => {
      const res = Array.from({ length: 40 }, (_, i) => playRun(1000 + i, f.id, 'smart'));
      return { id: f.id, rate: res.filter((r) => r.won).length / res.length };
    });
    console.log('Vittorie per frutto: ' + rates.map((r) => `${r.id.replace('fruit_', '')} ${(r.rate * 100).toFixed(0)}%`).join(' · '));
    // Le soglie assolute (attento 35-50%, ingenuo <10%) si misurano col rapporto di bilanciamento.
    // Dalla F2 la difficoltà conta e i frutti si separano molto (es. Bolla ~95%, Zanna ~20%):
    // la taratura dei frutti è nella F5/F6. Qui si controlla solo che nessun frutto sia inutile.
    const mean = rates.reduce((s, r) => s + r.rate, 0) / rates.length;
    for (const r of rates) expect(r.rate).toBeGreaterThan(mean * 0.25);
  });
});

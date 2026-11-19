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
    expect(wins).toBeGreaterThan(0);
    // bilanciamento del prototipo: né banale né impossibile per un giocatore medio
    expect(rate).toBeGreaterThan(0.25);
    expect(rate).toBeLessThan(0.97);
  });

  it('ogni frutto da solo porta a vincere: nessun frutto inutile o rotto', () => {
    const rates = FRUITS.map((f) => {
      const res = Array.from({ length: 120 }, (_, i) => playRun(1000 + i, f.id));
      return { id: f.id, rate: res.filter((r) => r.won).length / res.length };
    });
    console.log('Vittorie per frutto: ' + rates.map((r) => `${r.id.replace('fruit_', '')} ${(r.rate * 100).toFixed(0)}%`).join(' · '));
    // run di 4 mari: soglia minima più bassa (bilanciamento fine nella fase 6 della 0.6)
    for (const r of rates) { expect(r.rate).toBeGreaterThan(0.22); expect(r.rate).toBeLessThan(0.99); }
  });
});

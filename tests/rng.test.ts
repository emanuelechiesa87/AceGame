import { describe, expect, it } from 'vitest';
import { Rng } from '../src/systems/Rng';

describe('Rng', () => {
  it('produce la stessa sequenza a parità di seed', () => {
    const a = new Rng(12345);
    const b = new Rng(12345);
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(Array.from({ length: 20 }, () => b.next()));
  });

  it('produce sequenze diverse con seed diversi', () => {
    expect(new Rng(1).next()).not.toEqual(new Rng(2).next());
  });

  it('int resta nei limiti inclusi', () => {
    const r = new Rng(7);
    const values = Array.from({ length: 2000 }, () => r.int(1, 6));
    expect(Math.min(...values)).toBe(1);
    expect(Math.max(...values)).toBe(6);
  });

  it('weightedPick ignora i pesi nulli e rispetta le proporzioni', () => {
    const r = new Rng(99);
    const counts = { a: 0, b: 0, never: 0 };
    for (let i = 0; i < 10000; i++) {
      const k = r.weightedPick([
        { item: 'a' as const, weight: 3 },
        { item: 'b' as const, weight: 1 },
        { item: 'never' as const, weight: 0 },
      ]);
      counts[k]++;
    }
    expect(counts.never).toBe(0);
    expect(counts.a / counts.b).toBeGreaterThan(2.5);
    expect(counts.a / counts.b).toBeLessThan(3.5);
  });

  it('weightedPick fallisce se nessun peso è positivo', () => {
    expect(() => new Rng(1).weightedPick([{ item: 'x', weight: 0 }])).toThrow();
  });
});

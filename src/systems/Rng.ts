/**
 * Generatore casuale con seed (mulberry32): a parità di seed produce sempre
 * la stessa sequenza, così run e combattimenti sono riproducibili per il debug.
 * Tutta la casualità del gioco deve passare da qui, mai da Math.random().
 */
export class Rng {
  private state: number;

  constructor(readonly seed: number) {
    this.state = seed >>> 0;
  }

  /** Numero in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Intero in [min, max] inclusi. */
  int(min: number, max: number): number {
    if (max < min) throw new Error(`Intervallo non valido: ${min}..${max}`);
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Impossibile scegliere da una lista vuota');
    return items[this.int(0, items.length - 1)];
  }

  /** Scelta pesata: gli elementi con peso <= 0 non vengono mai scelti. */
  weightedPick<T>(items: readonly { item: T; weight: number }[]): T {
    const total = items.reduce((sum, e) => sum + Math.max(0, e.weight), 0);
    if (total <= 0) throw new Error('Nessun elemento con peso positivo');
    let roll = this.next() * total;
    for (const entry of items) {
      const w = Math.max(0, entry.weight);
      if (roll < w) return entry.item;
      roll -= w;
    }
    // Protezione contro errori di arrotondamento: ultimo elemento con peso > 0.
    return [...items].reverse().find((e) => e.weight > 0)!.item;
  }
}

export function randomSeed(): number {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0];
}

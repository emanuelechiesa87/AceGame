import { describe, expect, it } from 'vitest';
import { emptyPersistentState, insertHallOfFame, parseSave, SaveSystem } from '../src/systems/SaveSystem';
import type { HallOfFameEntry } from '../src/types/game';

const entry = (score: number, maxArea = 1, durationSec = 300): HallOfFameEntry => ({ score, maxArea, durationSec, date: '', bossesDefeated: 0, enemiesDefeated: 0, fruits: [], result: 'defeat' });

class MemStorage { m = new Map<string, string>(); getItem(k: string) { return this.m.get(k) ?? null; } setItem(k: string, v: string) { this.m.set(k, v); } }

describe('Hall of Fame locale', () => {
  it('tiene solo i 3 migliori, ordinati', () => {
    let list: HallOfFameEntry[] = [];
    for (const s of [50, 300, 120, 80, 500]) list = insertHallOfFame(list, entry(s)).list;
    expect(list.map((e) => e.score)).toEqual([500, 300, 120]);
  });

  it('a parità di punteggio vince l\'area più alta, poi la durata più breve', () => {
    let list = insertHallOfFame([], entry(100, 1, 200)).list;
    list = insertHallOfFame(list, entry(100, 2, 400)).list;
    list = insertHallOfFame(list, entry(100, 2, 100)).list;
    expect(list.map((e) => [e.maxArea, e.durationSec])).toEqual([[2, 100], [2, 400], [1, 200]]);
  });

  it('segnala il rango del nuovo record o -1', () => {
    const full = [entry(300), entry(200), entry(100)];
    expect(insertHallOfFame(full, entry(250)).rank).toBe(1);
    expect(insertHallOfFame(full, entry(10)).rank).toBe(-1);
  });
});

describe('SaveSystem', () => {
  it('persiste e ricarica', () => {
    const st = new MemStorage();
    new SaveSystem(st).update((s) => s.discoveredFruitIds.push('fruit_ember'));
    expect(new SaveSystem(st).data.discoveredFruitIds).toEqual(['fruit_ember']);
  });

  it('non sovrascrive un salvataggio illeggibile: lo mette da parte', () => {
    const st = new MemStorage();
    st.setItem('acegame.save', '{rotto');
    const s = new SaveSystem(st);
    expect(s.loadError).not.toBeNull();
    expect([...st.m.keys()].some((k) => k.startsWith('acegame.save.corrupt'))).toBe(true);
    expect(st.getItem('acegame.save')).toBe('{rotto');
  });

  it('rifiuta salvataggi di versioni future', () => {
    expect(() => parseSave(JSON.stringify({ ...emptyPersistentState(), schemaVersion: 99 }))).toThrow();
  });
});

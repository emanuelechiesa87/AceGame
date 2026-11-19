import { describe, expect, it } from 'vitest';
import { FRUITS } from '../src/data/fruits';
import { FRUIT_LOOKS, lookKey, lookStage, runLook } from '../src/data/fruitLooks';

describe('aspetto legato al frutto', () => {
  it('ogni frutto ha un aspetto, con accessorio in testa diverso', () => {
    for (const f of FRUITS) expect(FRUIT_LOOKS[f.id], f.id).toBeDefined();
    const heads = new Set(FRUITS.map((f) => FRUIT_LOOKS[f.id].head));
    expect(heads.size).toBe(FRUITS.length);
  });
  it('i cambiamenti crescono a ogni livello', () => {
    const score = (l: number) => { const s = lookStage(l); return +s.accent + +s.eyes + s.headSize + s.shoulders + +s.hair + +s.cape + s.aura + +s.glowEyes; };
    for (let l = 1; l <= 5; l++) expect(score(l)).toBeGreaterThan(score(l - 1));
    expect(lookStage(5).cape && lookStage(5).glowEyes && lookStage(5).aura === 2).toBe(true);
    expect(lookStage(3).cape).toBe(false);
  });
  it('chiave della variante e aspetto della run', () => {
    expect(lookKey(null)).toBe('');
    expect(lookKey({ fruitId: 'fruit_ember', level: 7 })).toBe('fruit_ember-5');
    expect(runLook({ activeFruitIds: ['fruit_frost'] })).toEqual({ fruitId: 'fruit_frost', level: 1 });
    expect(runLook({ activeFruitIds: [] })).toBeNull();
  });
});

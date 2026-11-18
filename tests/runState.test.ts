import { describe, expect, it } from 'vitest';
import { BALANCE } from '../src/data/balance';
import { createRunState, effectiveStats } from '../src/state/RunState';

describe('createRunState', () => {
  const run = createRunState('b', 42, new Date('2026-11-18T10:00:00Z'));

  it('parte senza frutti, artefatti né compagni e con le pozioni iniziali', () => {
    expect(run.activeFruitIds).toEqual([]);
    expect(run.artifactIds).toEqual([]);
    expect(run.companions).toEqual([]);
    expect(run.potions).toBe(BALANCE.player.startingPotions);
  });

  it('usa le statistiche base indipendentemente dall\'avatar', () => {
    const other = createRunState('a', 42, new Date('2026-11-18T10:00:00Z'));
    expect(run.baseStats).toEqual(other.baseStats);
    expect(run.currentHp).toBe(BALANCE.player.baseHp);
  });

  it('somma passive dei frutti e artefatti', () => {
    const r = createRunState('a', 1);
    r.activeFruitIds = ['fruit_ember', 'fruit_stone'];
    r.artifactIds = ['art_basalt_core'];
    const s = effectiveStats(r);
    expect(s.atk).toBe(BALANCE.player.baseAtk + 2);
    expect(s.maxHp).toBe(BALANCE.player.baseHp + 10);
    expect(s.def).toBe(BALANCE.player.baseDef + 4);
    expect(s.spd).toBe(BALANCE.player.baseSpd - 2);
  });

  it('rispetta i limiti di squadra dichiarati', () => {
    expect(BALANCE.limits.maxPartySize).toBe(BALANCE.limits.maxCompanions + 1);
    expect(BALANCE.limits.maxActivePowers).toBe(3);
  });
});

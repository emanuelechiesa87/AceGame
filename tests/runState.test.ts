import { describe, expect, it } from 'vitest';
import { BALANCE } from '../src/data/balance';
import { createRunState } from '../src/state/RunState';

describe('createRunState', () => {
  const run = createRunState('b', 42, new Date('2026-11-18T10:00:00Z'));

  it('parte senza poteri, artefatti né compagni', () => {
    expect(run.activePowerIds).toEqual([]);
    expect(run.runArtifactIds).toEqual([]);
    expect(run.companionIds).toEqual([]);
  });

  it('usa le statistiche base indipendentemente dall\'avatar', () => {
    const other = createRunState('a', 42, new Date('2026-11-18T10:00:00Z'));
    expect(run.playerStats).toEqual(other.playerStats);
    expect(run.currentHp).toBe(BALANCE.player.baseHp);
  });

  it('registra seed e versione di bilanciamento', () => {
    expect(run.runSeed).toBe(42);
    expect(run.balanceVersion).toBe(BALANCE.version);
  });

  it('rispetta i limiti di squadra dichiarati', () => {
    expect(BALANCE.limits.maxPartySize).toBe(BALANCE.limits.maxCompanions + 1);
    expect(BALANCE.limits.maxActivePowers).toBe(3);
  });
});

import { describe, expect, it } from 'vitest';
import { BALANCE } from '../src/data/balance';
import { clampTide, MAX_TIDE, TIDES, tideEffects, tideScore } from '../src/data/tides';
import { createRunState } from '../src/state/RunState';
import { makeEnemyUnit } from '../src/systems/combat/Battle';
import { RunController } from '../src/systems/RunController';
import { parseSave } from '../src/systems/SaveSystem';
import { playRun } from './sim';

const ctlAt = (tide: number) => { const c = new RunController(createRunState('a', 7, undefined, 'Kai', tide)); c.start([]); return c; };

describe('F3 · Maree', () => {
  it('10 Maree, numerate in ordine', () => {
    expect(MAX_TIDE).toBe(10);
    expect(TIDES.map((t) => t.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('Marea 0 = valori di base; i malus si sommano', () => {
    const e0 = tideEffects(0);
    expect(e0.startingPotions).toBe(BALANCE.player.startingPotions);
    expect(e0.normalRewardChance).toBe(BALANCE.rewards.normalRewardChance);
    expect(e0.chargedMult).toBe(BALANCE.combat.charged.mult);
    const e10 = tideEffects(10);
    expect(e10.startingPotions).toBe(0);
    expect(e10.coinMult).toBeLessThan(1);
    expect(e10.eliteAffixMin).toBe(2);
    expect(e10.areaHealPct).toBeLessThan(e0.areaHealPct);
    expect(e10.chargedMult).toBeGreaterThan(e0.chargedMult);
    expect(tideEffects(3).restHealPct).toBe(e0.restHealPct); // la Marea 4 non è ancora attiva
  });

  it('valori fuori scala vengono riportati tra 0 e 10', () => {
    expect([clampTide(-3), clampTide(99), clampTide('x'), clampTide(4.7)]).toEqual([0, 10, 0, 4]);
  });

  it('la run applica i malus: pozioni, nemici, affissi, colpi caricati', () => {
    expect(ctlAt(0).run.potions).toBe(BALANCE.player.startingPotions);
    expect(ctlAt(1).run.potions).toBe(0);
    const boss = (t: number) => makeEnemyUnit('en_shroom_boss', 'e0', ctlAt(t).enemyScale);
    expect(boss(8).maxHp).toBeGreaterThan(boss(5).maxHp);
    expect(boss(6).maxHp).toBeGreaterThan(boss(5).maxHp);
    expect(ctlAt(4).battleMods().eliteAffixes).toBe(1);
    expect(ctlAt(5).battleMods().eliteAffixes).toBe(2);
    expect(ctlAt(10).battleMods().chargedMult).toBe(2.3);
  });

  it('punteggio ×(1 + 0,1·N)', () => {
    expect(tideScore(1000, 0)).toBe(1000);
    expect(tideScore(1000, 3)).toBe(1300);
    expect(tideScore(1000, 10)).toBe(2000);
  });

  it('salvataggio: Maree pulite e Marea scelta mai oltre quella sbloccata', () => {
    const s = parseSave(JSON.stringify({ schemaVersion: 1, maxTideUnlocked: 3, selectedTide: 7, bestTideByFruit: { fruit_bubble: 2, x: 'no', y: 50 } }));
    expect(s.maxTideUnlocked).toBe(3);
    expect(s.selectedTide).toBe(3);
    expect(s.bestTideByFruit).toEqual({ fruit_bubble: 2, y: 10 });
    expect(parseSave(JSON.stringify({ schemaVersion: 1 })).maxTideUnlocked).toBe(0);
  });

  it('più alta la Marea, meno vittorie (giocatore attento)', () => {
    const rate = (t: number) => { let w = 0; for (let s = 0; s < 120; s++) if (playRun(300 + s, undefined, 'smart', t).won) w++; return w / 120; };
    const r0 = rate(0), r10 = rate(10);
    expect(r10).toBeLessThan(r0 - 0.2);
    expect(r10).toBeGreaterThan(0);
  }, 120_000);
});

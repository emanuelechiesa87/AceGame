import { describe, expect, it } from 'vitest';
import { createRunState } from '../src/state/RunState';
import { Battle, makeEnemyUnit, makeHeroUnit } from '../src/systems/combat/Battle';
import { RunController } from '../src/systems/RunController';
import { Rng } from '../src/systems/Rng';
import { parseSave, emptyPersistentState } from '../src/systems/SaveSystem';
import { statsRows, totalStats } from '../src/systems/runStats';
import { playRun } from './sim';

describe('Statistiche della run (F0)', () => {
  it('il motore conta HP persi, cure, pozioni, HP minimo e turni dell\'eroe', () => {
    const b = new Battle({
      hero: makeHeroUnit('Kai', { maxHp: 100, atk: 12, def: 0, spd: 1 }, 100),
      companions: [],
      enemies: [makeEnemyUnit('en_bat', 'e0')],
      powers: [], potions: 1, mods: { powerDamageMult: 1, surviveLethalOnce: false },
    }, new Rng(3));
    b.start();
    let guard = 0;
    while (b.phase === 'awaitingInput' && guard++ < 100) {
      if (b.hero.hp < 60 && b.potions) b.act({ type: 'potion' });
      else b.act({ type: 'attack', targetUid: b.enemies()[0].uid });
    }
    const t = b.tally;
    expect(t.heroTurns).toBe(guard);
    expect(t.damageTaken).toBeGreaterThan(0);
    expect(t.minHp).toBeLessThanOrEqual(b.hero.hp);
    expect(t.damageTaken - t.healed).toBe(100 - Math.max(0, b.hero.hp));
  });

  it('RunController registra scontri e cure fuori battaglia per mare', () => {
    const ctl = new RunController(createRunState('a', 5));
    ctl.start([]);
    ctl.run.currentHp = 50;
    ctl.recordBattle({ damageTaken: 50, healed: 10, lifesteal: 4, potions: 1, minHp: 30, heroTurns: 6 });
    ctl.healPct(0.2);
    ctl.addPlayTime(90);
    const a = ctl.run.stats!.areas[0];
    expect(a).toMatchObject({ battles: 1, heroTurns: 6, damageTaken: 50, healedInBattle: 10, lifesteal: 4, potions: 1, playSec: 90 });
    expect(a.minHpPct).toBeCloseTo(0.3, 2);
    expect(a.healedOutside).toBe(20);
    expect(statsRows(ctl.run.stats!)[0].values).toEqual(['1m 30s', '1m 30s']);
  });

  it('la run simulata produce statistiche coerenti per ogni mare raggiunto', () => {
    const r = playRun(11, undefined, 'smart');
    expect(r.stats.areas.length).toBe(r.won ? 4 : r.area + 1);
    expect(totalStats(r.stats).battles).toBe(r.battles);
  });

  it('il registro delle run sopravvive al salvataggio e scarta voci rotte', () => {
    const s = emptyPersistentState();
    const good = { date: 'x', result: 'victory' as const, fruit: 'fruit_blood', fruitLevel: 5, maxArea: 4, stats: { areas: [] } };
    const raw = JSON.stringify({ ...s, runLog: [good, { broken: true }, null] });
    expect(parseSave(raw).runLog).toEqual([good]);
    expect(parseSave(JSON.stringify(s)).runLog).toEqual([]);
  });
});

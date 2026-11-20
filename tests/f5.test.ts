import { describe, expect, it } from 'vitest';
import { BRANCH_LEVEL, FRUITS, FRUIT_BY_ID, fruitAbility } from '../src/data/fruits';
import { Battle, makeCompanionUnit, makeEnemyUnit, makeHeroUnit } from '../src/systems/combat/Battle';
import type { BattleEvent } from '../src/systems/combat/types';
import type { Ability, Effect } from '../src/types/content';
import { Rng } from '../src/systems/Rng';
import { RunController } from '../src/systems/RunController';
import { createRunState } from '../src/state/RunState';

const mods = { powerDamageMult: 1, surviveLethalOnce: false };
const pw = (effects: Effect[], target: Ability['target'] = 'enemy'): Ability => ({ id: 'p', name: 'P', description: '', target, cost: 0, effects });
function battle(power: Ability, enemies = ['en_jelly'], companions: string[] = [], seed = 1) {
  return new Battle({
    hero: makeHeroUnit('Ema', { maxHp: 200, atk: 20, def: 0, spd: 30 }, 100),
    companions: companions.map((c, i) => makeCompanionUnit(c, `c${i}`)),
    enemies: enemies.map((e, i) => makeEnemyUnit(e, `e${i}`)),
    powers: [power], potions: 0, mods,
  }, new Rng(seed));
}
const use = (b: Battle, target = 'e0'): BattleEvent[] => b.act({ type: 'power', abilityId: 'p', targetUid: target });

describe('F5 · strade dei frutti', () => {
  it('ogni frutto ha la strada B con 3 poteri dal III al V e id unici', () => {
    const ids = new Set<string>();
    for (const f of FRUITS) {
      expect(f.branches, f.id).toBeDefined();
      expect(f.branches!.b.abilities).toHaveLength(3);
      for (const a of [...f.abilities, ...f.branches!.b.abilities]) { expect(ids.has(a.id), a.id).toBe(false); ids.add(a.id); }
    }
    expect(ids.size).toBe(FRUITS.length * 8);
  });

  it('fruitAbility segue la strada solo dal III', () => {
    const f = FRUIT_BY_ID.get('fruit_ember')!;
    expect(fruitAbility(f, 2, 'b').id).toBe('pw_ember_2');
    expect(fruitAbility(f, 3, 'b').id).toBe('pwb_ember_3');
    expect(fruitAbility(f, 5, 'b').id).toBe('pwb_ember_5');
    expect(fruitAbility(f, 5, 'a').id).toBe('pw_ember_5');
  });

  it('la scelta si chiede al III e il potere in battaglia cambia', () => {
    const ctl = new RunController(createRunState('a', 1, undefined, 'Kai', 0));
    ctl.start([]);
    ctl.run.activeFruitIds = ['fruit_storm'];
    ctl.run.fruitLevel = BRANCH_LEVEL;
    expect(ctl.needsBranchChoice).toBe(true);
    expect(ctl.battlePowers()[0].id).toBe('pw_storm_3'); // finché non sceglie: strada A
    ctl.chooseBranch('b');
    expect(ctl.needsBranchChoice).toBe(false);
    expect(ctl.battlePowers()[0].id).toBe('pwb_storm_3');
  });

  it('Lama d\'Ombra: ignora lo scudo e dà energia se uccide', () => {
    const b = battle(pw([{ kind: 'damage', mult: 30, pierce: true }, { kind: 'energyOnKill', amount: 2 }]));
    b.start();
    b.unit('e0')!.statuses.push({ id: 'shield', turns: 3, value: 999 });
    const e0 = b.energy;
    const ev = use(b);
    expect(ev.some((e) => e.t === 'melt')).toBe(true);
    expect(b.unit('e0')!.hp).toBe(0);
    expect(ev.some((e) => e.t === 'energy' && e.value === Math.min(b.energyMax, e0 + 2))).toBe(true);
  });

  it('Patto di Sangue: la cura in eccesso diventa scudo', () => {
    const b = battle(pw([{ kind: 'damage', mult: 6, lifesteal: 1, overhealShield: true }]), ['en_shroom_boss']);
    b.start();
    b.hero.hp = b.hero.maxHp - 5;
    use(b);
    expect(b.hero.statuses.some((s) => s.id === 'shield' && s.value > 0)).toBe(true);
  });

  it('Bomba Grappolo: la mina colpisce anche gli altri', () => {
    const b = battle(pw([{ kind: 'mine', mult: 3, splash: 0.5 }]), ['en_jelly', 'en_jelly']);
    b.start();
    const hp1 = b.unit('e1')!.hp;
    use(b);
    for (let i = 0; i < 3 && b.phase === 'awaitingInput'; i++) b.act({ type: 'guard' });
    expect(b.unit('e1')!.hp).toBeLessThan(hp1);
  });

  it('Branco carica le speciali dei compagni; il congelamento lungo dura 2 turni (boss 1)', () => {
    const b = battle(pw([{ kind: 'chargeAllies', amount: 2 }], 'allAllies'), ['en_jelly'], ['comp_bobo']);
    b.start();
    const c0 = b.unit('c0')!.charge;
    use(b);
    expect(b.unit('c0')!.charge).toBeGreaterThanOrEqual(Math.min(b.unit('c0')!.chargeMax, c0 + 2));

    const stunned = (enemy: string) => {
      const s = battle(pw([{ kind: 'status', status: 'stun', turns: 2 }]), [enemy]);
      s.start();
      const ev = use(s);
      for (let i = 0; i < 3 && s.phase === 'awaitingInput'; i++) ev.push(...s.act({ type: 'guard' }));
      return ev.filter((e) => e.t === 'stunned').length;
    };
    expect(stunned('en_jelly')).toBe(2);
    expect(stunned('en_pudding_king')).toBe(1);
  });
});

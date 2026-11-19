import { describe, expect, it } from 'vitest';
import { ARTIFACTS } from '../src/data/artifacts';
import { EVENTS } from '../src/data/events';
import { createRunState, effectiveStats } from '../src/state/RunState';
import { Battle, makeCompanionUnit, makeEnemyUnit, makeHeroUnit } from '../src/systems/combat/Battle';
import type { BattleMods } from '../src/systems/combat/types';
import { resolveEvent } from '../src/systems/EventResolver';
import { Rng } from '../src/systems/Rng';
import { RunController } from '../src/systems/RunController';

const base: BattleMods = { powerDamageMult: 1, surviveLethalOnce: false };
function battle(mods: Partial<BattleMods>, opts: { hp?: number; enemies?: string[]; companions?: boolean; seed?: number } = {}) {
  return new Battle({
    hero: makeHeroUnit('Eroe', { maxHp: 100, atk: 12, def: 4, spd: 10 }, opts.hp ?? 100),
    companions: opts.companions ? [makeCompanionUnit('comp_zip', 'c0')] : [],
    enemies: (opts.enemies ?? ['en_jelly']).map((e, i) => makeEnemyUnit(e, `e${i}`)),
    powers: [], potions: 2, mods: { ...base, ...mods },
  }, new Rng(opts.seed ?? 1));
}
function ctlWith(arts: string[], seed = 5) {
  const ctl = new RunController(createRunState('a', seed));
  ctl.start([]);
  ctl.run.artifactIds = arts;
  return ctl;
}

describe('Artefatti 0.6.1', () => {
  it('sono 17, con id unici e almeno un effetto ciascuno', () => {
    expect(ARTIFACTS).toHaveLength(17);
    expect(new Set(ARTIFACTS.map((a) => a.id)).size).toBe(17);
    for (const a of ARTIFACTS) expect(Object.keys(a).length).toBeGreaterThan(4);
  });

  it('Bussola: +1 energia iniziale; Lanterna: +2 energia in difesa', () => {
    expect(battle({ energyBonus: 1 }).energy).toBe(3);
    const b = battle({ guardEnergyBonus: 1 }, { enemies: ['en_pudding_king'] });
    b.start();
    const e0 = b.energy;
    b.act({ type: 'guard' });
    expect(b.energy).toBeGreaterThanOrEqual(Math.min(5, e0 + 2));
  });

  it('Conchiglia: scudo a inizio battaglia; Fiaschetta: pozione al 50%', () => {
    const b = battle({ openingShield: 12 }, { enemies: ['en_pudding_king'] });
    b.start();
    expect(b.hero.statuses.some((s) => s.id === 'shield')).toBe(true);
    const p = battle({ potionHealPct: 0.5 }, { hp: 10, enemies: ['en_pudding_king'] });
    p.start();
    const before = p.hero.hp;
    p.act({ type: 'potion' });
    expect(p.hero.hp).toBeGreaterThanOrEqual(Math.min(100, before + 50) - 40); // i nemici possono colpire dopo
  });

  it('Amo: l\'attacco base può avvelenare', () => {
    let poisoned = false;
    for (let seed = 1; seed < 30 && !poisoned; seed++) {
      const b = battle({ basicPoison: { chance: 1, value: 4, turns: 3 } }, { enemies: ['en_pudding_king'], seed });
      b.start();
      b.act({ type: 'attack', targetUid: 'e0' });
      poisoned = b.unit('e0')!.statuses.some((s) => s.id === 'poison');
    }
    expect(poisoned).toBe(true);
  });

  it('Aculei: chi colpisce l\'eroe si punge', () => {
    const b = battle({ thornsPct: 0.5 }, { enemies: ['en_pudding_king'] });
    b.start();
    const boss = b.unit('e0')!;
    const hp0 = boss.hp;
    for (let i = 0; i < 4 && b.phase === 'awaitingInput'; i++) b.act({ type: 'guard' });
    expect(boss.hp).toBeLessThan(hp0);
  });

  it('Fischietto: compagni con carica iniziale', () => {
    const b = battle({ companionStartCharge: 1, companionDmgMult: 1.3 }, { companions: true });
    expect(b.unit('c0')!.charge).toBe(1);
  });

  it('Perla: a 0 HP si torna al 50%, una volta sola', () => {
    const b = battle({ reviveOncePct: 0.5 }, { hp: 1, enemies: ['en_pudding_king'] });
    b.start();
    for (let i = 0; i < 30 && b.phase === 'awaitingInput' && !b.reviveUsed; i++) b.act({ type: 'guard' });
    expect(b.reviveUsed).toBe(true);
  });

  it('Corona: il potere costa 1 in meno (minimo 1); Mappa: 4 ricompense', () => {
    const plain = ctlWith([]).battlePowers()[0].cost!;
    expect(ctlWith(['art_black_coral_crown']).battlePowers()[0].cost).toBe(Math.max(1, plain - 1));
    expect(ctlWith(['art_torn_map']).rewardOptions('battle')).toHaveLength(4);
    expect(ctlWith([]).rewardOptions('battle')).toHaveLength(3);
  });

  it('la perla già usata nella run non torna; il cannone vale per un solo scontro', () => {
    const ctl = ctlWith(['art_return_pearl']);
    expect(ctl.battleMods().reviveOncePct).toBe(0.5);
    ctl.afterBattle(true);
    expect(ctl.battleMods().reviveOncePct).toBeUndefined();
    ctl.run.nextBattleEnemyHpPct = 0.7;
    const b = new Battle({ hero: makeHeroUnit('E', effectiveStats(ctl.run), 100), companions: [], enemies: [makeEnemyUnit('en_jelly', 'e0')], powers: [], potions: 0, mods: ctl.battleMods() }, new Rng(1));
    expect(b.unit('e0')!.hp).toBe(Math.round(b.unit('e0')!.maxHp * 0.7));
    ctl.afterBattle(false);
    expect(ctl.run.nextBattleEnemyHpPct).toBeUndefined();
  });
});

describe('Eventi 0.6.1', () => {
  it('sono 14 e ogni esito è gestito', () => {
    expect(EVENTS).toHaveLength(14);
    for (const ev of EVENTS) for (const c of ev.choices) {
      const ctl = ctlWith([]);
      ctl.run.areaIndex = ev.areas?.[0] ?? 0;
      const out = resolveEvent(ctl, c.outcome);
      if (c.outcome !== 'nothing') expect(out.text).not.toBe('Prosegui per la tua strada.');
      expect(ctl.run.currentHp).toBeGreaterThan(0);
    }
  });

  it('escono solo nel loro mare e non si ripetono finché ce ne sono di nuovi', () => {
    for (let area = 0; area < 4; area++) {
      const ctl = ctlWith([], 10 + area);
      ctl.run.areaIndex = area;
      const here = EVENTS.filter((e) => !e.areas || e.areas.includes(area));
      const got = here.map(() => ctl.pickEvent().id);
      expect(new Set(got).size).toBe(here.length);
      for (const id of got) { const e = EVENTS.find((x) => x.id === id)!; expect(!e.areas || e.areas.includes(area)).toBe(true); }
    }
  });

  it('la tartaruga non fa mai saltare il boss', () => {
    const ctl = ctlWith([]);
    ctl.run.stepIndex = ctl.run.map.length - 2;
    resolveEvent(ctl, 'turtle_ride');
    expect(ctl.run.stepIndex).toBe(ctl.run.map.length - 2);
    ctl.run.stepIndex = 2;
    resolveEvent(ctl, 'turtle_ride');
    expect(ctl.run.stepIndex).toBe(3);
  });

  it('il patto della medusa rispetta il tetto del Risveglio', () => {
    const ctl = ctlWith([]);
    ctl.run.fruitLevel = 3; // tetto del mare 1
    const hp = ctl.run.baseStats.maxHp;
    const out = resolveEvent(ctl, 'medusa_pact');
    expect(out.awakened).toBeFalsy();
    expect(ctl.run.baseStats.maxHp).toBe(hp);
  });
});

import { describe, expect, it } from 'vitest';
import { COMPANIONS } from '../src/data/companions';
import { Battle, makeCompanionUnit, makeEnemyUnit, makeHeroUnit } from '../src/systems/combat/Battle';
import type { BattleEvent } from '../src/systems/combat/types';
import { Rng } from '../src/systems/Rng';

const mods = { powerDamageMult: 1, surviveLethalOnce: false };

function battle(companions: string[], enemy = 'en_shroom_boss', seed = 1) {
  return new Battle({
    hero: makeHeroUnit('Ema', { maxHp: 400, atk: 1, def: 0, spd: 30 }, 400),
    companions: companions.map((c, i) => makeCompanionUnit(c, `c${i}`)),
    enemies: [makeEnemyUnit(enemy, 'e0')],
    powers: [], potions: 9, mods,
  }, new Rng(seed));
}
const hitsOn = (ev: BattleEvent[], uid: string) => ev.filter((e) => e.t === 'damage' && e.target === uid && e.kind === 'hit').length;

describe('F4b · compagni nuovi', () => {
  it('ci sono 6 compagni con id unici', () => {
    expect(COMPANIONS.length).toBe(6);
    expect(new Set(COMPANIONS.map((c) => c.id)).size).toBe(6);
  });

  it('Ottavio accende la miccia un turno e spara al successivo', () => {
    const b = battle(['comp_ottavio']);
    b.start();
    const turns: BattleEvent[][] = [];
    for (let i = 0; i < 4 && b.phase === 'awaitingInput'; i++) turns.push(b.act({ type: 'guard' }));
    const all = turns.flat();
    const fuses = all.filter((e) => e.t === 'fuse').length;
    const shots = all.filter((e) => e.t === 'use' && e.uid === 'c0' && e.ability === 'ottavio_shot').length;
    expect(fuses).toBeGreaterThanOrEqual(1);
    expect(Math.abs(fuses - shots)).toBeLessThanOrEqual(1);
    // mai due micce di fila senza sparo
    const seq = all.filter((e) => (e.t === 'fuse') || (e.t === 'use' && e.uid === 'c0')).map((e) => e.t);
    for (let i = 1; i < seq.length; i++) expect(seq[i] === 'fuse' && seq[i - 1] === 'fuse').toBe(false);
  });

  it('Strillo interrompe la carica di un nemico una sola volta', () => {
    const b = battle(['comp_strillo']); // il Granchio Capitano apre con un colpo caricato
    const ev = [...b.start()];
    for (let i = 0; i < 6 && b.phase === 'awaitingInput'; i++) ev.push(...b.act({ type: 'guard' }));
    const interrupts = ev.filter((e) => e.t === 'interrupt').length;
    const alarms = ev.filter((e) => e.t === 'use' && e.ability === 'strillo_alarm').length;
    expect(alarms).toBe(1);
    expect(interrupts).toBeGreaterThanOrEqual(1);
  });

  it('Gonfio attira i colpi normali e con la Gonfiata li prende tutti', () => {
    // conta su molti semi chi viene colpito con e senza Gonfio
    let gonfio = 0, total = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const b = battle(['comp_gonfio', 'comp_bobo'], 'en_jelly', seed);
      const ev = [...b.start()];
      for (let i = 0; i < 4 && b.phase === 'awaitingInput'; i++) ev.push(...b.act({ type: 'guard' }));
      gonfio += hitsOn(ev, 'c0');
      total += hitsOn(ev, 'c0') + hitsOn(ev, 'c1') + hitsOn(ev, 'hero');
    }
    expect(gonfio / total).toBeGreaterThan(0.4);

    const b = battle(['comp_gonfio', 'comp_bobo'], 'en_jelly', 7);
    b.start();
    b.units.find((u) => u.uid === 'c0')!.charge = 99;
    const sp = b.act({ type: 'special', companionUid: 'c0' });
    expect(sp.some((e) => e.t === 'status' && e.status === 'taunt')).toBe(true);
    const ev = b.act({ type: 'guard' });
    expect(hitsOn(ev, 'hero') + hitsOn(ev, 'c1')).toBe(0);
  });
});

import { ARTIFACTS } from '../src/data/artifacts';
import type { BattleMods } from '../src/systems/combat/types';

function withMods(extra: Partial<BattleMods>, opts: { companions?: string[]; enemy?: string; seed?: number; powers?: Battle['powers'] } = {}) {
  return new Battle({
    hero: makeHeroUnit('Ema', { maxHp: 400, atk: 10, def: 0, spd: 30 }, 400),
    companions: (opts.companions ?? []).map((c, i) => makeCompanionUnit(c, `c${i}`)),
    enemies: [makeEnemyUnit(opts.enemy ?? 'en_shroom_boss', 'e0')],
    powers: opts.powers ?? [{ id: 'p', name: 'P', description: '', target: 'enemy', cost: 3, effects: [{ kind: 'damage', mult: 1 }] }],
    potions: 9, mods: { ...mods, ...extra },
  }, new Rng(opts.seed ?? 1));
}

describe('F4b · artefatti nuovi', () => {
  it('34 artefatti con id unici, 2 maledetti', () => {
    expect(ARTIFACTS.length).toBe(34);
    expect(new Set(ARTIFACTS.map((a) => a.id)).size).toBe(34);
    expect(ARTIFACTS.filter((a) => a.cursed).length).toBe(2);
  });

  it('Clessidra: energia fino a 6; Moneta: primo potere gratis', () => {
    const b = withMods({ energyMaxBonus: 1, firstPowerFree: true });
    b.start();
    expect(b.energyMax).toBe(6);
    expect(b.powerCost(b.powers[0])).toBe(0);
    b.act({ type: 'power', abilityId: 'p', targetUid: 'e0' });
    expect(b.powerCost(b.powers[0])).toBe(3);
    for (let i = 0; i < 8 && b.phase === 'awaitingInput'; i++) b.act({ type: 'guard' });
    expect(b.energy).toBeLessThanOrEqual(6);
    expect(b.energy).toBe(6);
  });

  it('Elmo e Ancora: la parata dà scudo e furia', () => {
    const b = withMods({ parryShield: 10, parryBoost: 0.6 });
    b.start();
    b.act({ type: 'potion' }); // il granchio carica
    const ev = b.act({ type: 'guard' });
    expect(ev.some((e) => e.t === 'parry')).toBe(true);
    expect(ev.some((e) => e.t === 'shield' && e.target === 'hero')).toBe(true);
    expect(b.hero.statuses.some((s) => s.id === 'atkUp')).toBe(true);
  });

  it('Guscio di Tartaruga: in Difesa si subisce meno', () => {
    const taken = (gm?: number) => {
      let tot = 0;
      for (let seed = 1; seed <= 30; seed++) {
        const b = withMods(gm ? { guardMult: gm } : {}, { enemy: 'en_jelly', seed });
        b.start();
        for (let i = 0; i < 3 && b.phase === 'awaitingInput'; i++) tot += b.act({ type: 'guard' }).filter((e) => e.t === 'damage' && e.target === 'hero').reduce((s, e) => s + (e as { amount: number }).amount, 0);
      }
      return tot;
    };
    expect(taken(0.35)).toBeLessThan(taken() * 0.85);
  });

  it('Teschio del Patto: 3 HP a ogni turno ma non uccide', () => {
    const b = withMods({ selfDamagePerTurn: 3 }, { enemy: 'en_jelly' });
    b.start();
    const hp0 = b.hero.hp;
    const ev = b.act({ type: 'guard' });
    expect(ev.some((e) => e.t === 'damage' && e.kind === 'pact')).toBe(true);
    expect(b.hero.hp).toBeLessThan(hp0);
    b.hero.hp = 2;
    b.act({ type: 'guard' });
    if (b.phase === 'awaitingInput') expect(b.hero.hp).toBeGreaterThanOrEqual(1);
  });

  it('Bandiera di Ciurma: più compagni, più danno', () => {
    const dmg = (flag: boolean) => {
      let tot = 0;
      for (let seed = 1; seed <= 20; seed++) {
        const b = withMods(flag ? { atkPerCompanion: 2 } : {}, { companions: ['comp_bobo', 'comp_lumi'], seed });
        b.start();
        tot += b.act({ type: 'attack', targetUid: 'e0' }).filter((e) => e.t === 'damage' && e.target === 'e0' && e.source === 'hero').reduce((s, e) => s + (e as { amount: number }).amount, 0);
      }
      return tot;
    };
    expect(dmg(true)).toBeGreaterThan(dmg(false) * 1.25);
  });

  it('Fiala di Murena e Tentacolo di Medusa: veleno più lungo e di ritorno', () => {
    const b = withMods({ poisonBonus: { turns: 1, value: 1 }, basicPoison: { chance: 1, value: 4, turns: 3 } });
    b.start();
    b.act({ type: 'attack', targetUid: 'e0' });
    const p = b.unit('e0')!.statuses.find((s) => s.id === 'poison');
    expect(p?.value).toBe(5);
    let poisoned = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const m = withMods({ retaliatePoison: { chance: 1, value: 5, turns: 3 } }, { enemy: 'en_jelly', seed });
      m.start();
      for (let i = 0; i < 3 && m.phase === 'awaitingInput'; i++) m.act({ type: 'guard' });
      if (m.unit('e0')!.statuses.some((s) => s.id === 'poison') || m.unit('e0')!.hp < m.unit('e0')!.maxHp) poisoned++;
    }
    expect(poisoned).toBeGreaterThan(10);
  });
});

import { RunController } from '../src/systems/RunController';
import { createRunState } from '../src/state/RunState';

describe('F4b · artefatti nella run', () => {
  it('Rancio Abbondante e Gavetta del Cuoco aiutano i compagni', () => {
    const ctl = new RunController(createRunState('a', 3, undefined, 'Kai', 0));
    ctl.start([]);
    ctl.recruit('comp_bobo');
    const base = ctl.run.companions[0].hp;
    ctl.gainArtifact('art_hearty_rations');
    expect(ctl.companionScale.hp).toBeCloseTo(1.2);
    ctl.gainArtifact('art_cook_mess');
    ctl.onVictory([], ctl.run.currentHp, [{ id: 'comp_bobo', hp: 10, charge: 0 }]);
    expect(ctl.run.companions[0].hp).toBe(10 + Math.round(Math.round(base * 1.2) * 0.1));
  });
});

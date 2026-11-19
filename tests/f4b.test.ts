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

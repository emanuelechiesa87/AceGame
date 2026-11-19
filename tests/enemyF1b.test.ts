import { describe, expect, it, vi } from 'vitest';
vi.mock('phaser', () => ({ default: {} }));
import { AREAS } from '../src/data/areas';
import { ENEMIES, ENEMY_BY_ID } from '../src/data/enemies';
import { FRUIT_BY_ID } from '../src/data/fruits';
import { CREATURE_SCALE, CREATURES } from '../src/pixel/creatures';
import { Battle, makeCompanionUnit, makeEnemyUnit, makeHeroUnit } from '../src/systems/combat/Battle';
import type { BattleEvent } from '../src/systems/combat/types';
import { Rng } from '../src/systems/Rng';

const mods = { powerDamageMult: 1, surviveLethalOnce: false };
function fight(enemies: string[], o: { seed?: number; comps?: string[]; atk?: number; affixes?: number; power?: string } = {}) {
  return new Battle({
    hero: makeHeroUnit('Ema', { maxHp: 300, atk: o.atk ?? 1, def: 0, spd: 50 }, 300),
    companions: (o.comps ?? []).map((c, i) => makeCompanionUnit(c, `c${i}`)),
    enemies: enemies.map((e, i) => makeEnemyUnit(e, `e${i}`)),
    powers: o.power ? [FRUIT_BY_ID.get(o.power)!.abilities[0]] : [], potions: 9, mods: { ...mods, eliteAffixes: o.affixes },
  }, new Rng(o.seed ?? 1));
}
const has = (ev: BattleEvent[], t: BattleEvent['t']) => ev.some((e) => e.t === t);

describe('F1b · contenuti', () => {
  it('ogni nemico ha disegno e scala, ogni evocazione esiste, ogni gruppo usa nemici veri', () => {
    for (const e of ENEMIES) { expect(CREATURES[e.id], e.id).toBeDefined(); expect(CREATURE_SCALE[e.id], e.id).toBeDefined(); }
    for (const e of ENEMIES) for (const m of Object.values(e.moves)) for (const f of m.effects) if (f.kind === 'summon') expect(ENEMY_BY_ID.has(f.enemyId)).toBe(true);
    for (const e of ENEMIES) for (const id of [...e.pattern, ...(e.phase2?.pattern ?? [])]) expect(e.moves[id], `${e.id}.${id}`).toBeDefined();
    for (const a of AREAS) for (const g of [...a.groups.early, ...a.groups.late, ...a.groups.elite, a.groups.boss, a.groups.miniboss].flat()) expect(ENEMY_BY_ID.has(g), g).toBe(true);
    expect(ENEMIES.length).toBe(23 + 17 + 4); // + 4 capibanda (F4)
  });
  it('ogni mare ha 2 élite e i 4 boss hanno la seconda fase', () => {
    for (const a of AREAS) { expect(a.groups.elite.length).toBe(2); expect(ENEMY_BY_ID.get(a.groups.boss[0])!.phase2).toBeDefined(); }
  });
});

describe('F1b · comportamenti', () => {
  it('ruba energia, ma non se sei in Difesa', () => {
    const b = fight(['en_rat']); b.start();
    b.act({ type: 'potion' }); // il topo rosicchia
    const e0 = b.energy;
    const ev = b.act({ type: 'potion' }); // ruba
    expect(has(ev, 'drain')).toBe(true);
    expect(b.energy).toBeLessThan(e0 + 1); // +1 del round, -1 rubata
    const b2 = fight(['en_rat']); b2.start(); b2.act({ type: 'potion' });
    expect(has(b2.act({ type: 'guard' }), 'drain')).toBe(false);
  });
  it('il Granchio Bombarolo esplode alla morte e colpisce tutta la squadra', () => {
    const b = fight(['en_bomb_crab'], { atk: 500, comps: ['comp_bobo'] }); b.start();
    const ev = b.act({ type: 'attack', targetUid: 'e0' });
    expect(has(ev, 'burst')).toBe(true);
    expect(ev.filter((e) => e.t === 'damage' && e.kind === 'blast').length).toBe(2);
  });
  it('lo Scheletro si rialza una volta sola', () => {
    const b = fight(['en_skeleton', 'en_jelly'], { atk: 500 }); b.start();
    expect(has(b.act({ type: 'attack', targetUid: 'e0' }), 'rise')).toBe(true);
    expect(b.unit('e0')!.hp).toBeGreaterThan(0);
    const ev = b.act({ type: 'attack', targetUid: 'e0' });
    expect(has(ev, 'rise')).toBe(false);
    expect(b.unit('e0')!.hp).toBe(0);
  });
  it('il Calamaro Mimo a turni alterni è immune ai poteri', () => {
    const b = fight(['en_mimic_squid'], { power: 'fruit_ember', atk: 5 }); b.start();
    b.act({ type: 'guard' }); // il calamaro agisce → diventa immune
    expect(b.hasStatus(b.unit('e0')!, 'immune')).toBe(true);
    b.energy = 5;
    const ev = b.act({ type: 'power', abilityId: b.powers[0].id, targetUid: 'e0' });
    expect(has(ev, 'immune')).toBe(true);
  });
  it('chi caccia i compagni non mira mai l\'eroe finché c\'è un compagno', () => {
    for (let s = 1; s < 30; s++) {
      const b = fight(['en_anglerfish'], { seed: s, comps: ['comp_bobo', 'comp_zip'] }); b.start();
      expect(b.unit('e0')!.aimUid === 'hero').toBe(false);
    }
  });
  it('il Pesce Vipera carica per 2 turni prima di colpire', () => {
    const b = fight(['en_viperfish']);
    const start = b.start();
    expect((start.find((e) => e.t === 'intent') as { label?: string }).label).toBe('Carica… 2');
    expect(has(b.act({ type: 'potion' }), 'damage')).toBe(false);
    expect(b.act({ type: 'potion' }).some((e) => e.t === 'damage' && e.target === 'hero')).toBe(false);
    expect(b.act({ type: 'potion' }).some((e) => e.t === 'damage' && e.target === 'hero')).toBe(true);
  });
  it('le élite ricevono gli affissi richiesti, i normali no', () => {
    const b = fight(['en_lobster', 'en_rat'], { affixes: 2 });
    expect(b.unit('e0')!.affixes?.length).toBe(2);
    expect(b.unit('e1')!.affixes).toBeUndefined();
    expect(has(b.start(), 'affixes')).toBe(true);
  });
  it('la Stella Marina si rigenera a ogni turno', () => {
    const b = fight(['en_starfish']); b.start();
    b.unit('e0')!.hp = 10;
    const ev = b.act({ type: 'guard' });
    expect(ev.some((e) => e.t === 'heal' && e.target === 'e0')).toBe(true);
  });
});

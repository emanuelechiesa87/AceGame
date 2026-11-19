import { describe, expect, it, vi } from 'vitest';
vi.mock('phaser', () => ({ default: {} }));
import { FRUIT_BY_ID } from '../src/data/fruits';
import { Battle, makeEnemyUnit, makeHeroUnit } from '../src/systems/combat/Battle';
import { Rng } from '../src/systems/Rng';

const mods = { powerDamageMult: 1, surviveLethalOnce: false };
const fight = (enemies: string[], power?: string, affixes?: number) => new Battle({
  hero: makeHeroUnit('Ema', { maxHp: 300, atk: 20, def: 0, spd: 50 }, 300),
  companions: [],
  enemies: enemies.map((e, i) => makeEnemyUnit(e, `e${i}`)),
  powers: power ? [FRUIT_BY_ID.get(power)!.abilities[0]] : [], potions: 0, mods: { ...mods, eliteAffixes: affixes },
}, new Rng(3));

describe('F4 · Capobanda e onda d\'urto', () => {
  it('i Capibanda sono élite ma non ricevono affissi', () => {
    for (const id of ['en_walrus', 'en_barracuda', 'en_nautilus', 'en_ghost_cook']) {
      const b = fight([id], undefined, 2);
      expect(b.unit('e0')!.affixes).toBeUndefined();
    }
  });
  it('Cocco Zanna: il potere su di sé colpisce anche tutti i nemici', () => {
    const b = fight(['en_jelly', 'en_bat'], 'fruit_fang'); b.start();
    const ev = b.act({ type: 'power', abilityId: FRUIT_BY_ID.get('fruit_fang')!.abilities[0].id });
    const hit = new Set(ev.filter((e) => e.t === 'damage').map((e) => (e as { target: string }).target));
    expect(hit.has('e0') && hit.has('e1')).toBe(true);
    expect(b.hero.statuses.some((s) => s.id === 'atkUp')).toBe(true);
  });
});

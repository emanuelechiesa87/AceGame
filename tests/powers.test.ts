import { describe, expect, it } from 'vitest';
import { FRUIT_BY_ID, FRUITS, fruitAbility } from '../src/data/fruits';
import { Battle, makeEnemyUnit, makeHeroUnit } from '../src/systems/combat/Battle';
import { Rng } from '../src/systems/Rng';

function setup(fruit: string, enemies = ['en_pudding_king'], seed = 1) {
  const b = new Battle({
    hero: makeHeroUnit('Ema', { maxHp: 100, atk: 12, def: 4, spd: 30 }, 100),
    companions: [],
    enemies: enemies.map((e, i) => makeEnemyUnit(e, `e${i}`)),
    powers: [FRUIT_BY_ID.get(fruit)!.abilities[0]],
    potions: 0,
    mods: { powerDamageMult: 1, surviveLethalOnce: false },
  }, new Rng(seed));
  b.start();
  b.energy = 5;
  return b;
}
const use = (b: Battle, fruit: string) => b.act({ type: 'power', abilityId: FRUIT_BY_ID.get(fruit)!.abilities[0].id, targetUid: 'e0' });

describe('Poteri dei frutti', () => {
  it('ogni frutto ha 3 livelli di risveglio con ID unici e il III è più forte del I', () => {
    const ids = FRUITS.flatMap((f) => f.abilities.map((a) => a.id));
    expect(new Set(ids).size).toBe(FRUITS.length * 3);
    for (const f of FRUITS) {
      const dmg = (lvl: number) => f.abilities[lvl].effects.reduce((m, e) => m + (e.kind === 'damage' ? e.mult * (e.hits ?? 1) * (f.abilities[lvl].target === 'allEnemies' ? 1.5 : 1) : 0), 0);
      expect(dmg(2)).toBeGreaterThanOrEqual(dmg(0));
      expect(fruitAbility(f, 9).id).toBe(f.abilities[2].id); // livello limitato a III
    }
  });

  it('ci sono 13 frutti con ID unici e almeno 3 iniziali', () => {
    expect(FRUITS).toHaveLength(13);
    expect(new Set(FRUITS.map((f) => f.id)).size).toBe(13);
    expect(FRUITS.filter((f) => f.startsUnlocked).length).toBeGreaterThanOrEqual(3);
  });

  it('Raffica Molleggiata colpisce 5 volte', () => {
    const b = setup('fruit_spring');
    const ev = use(b, 'fruit_spring');
    const hits = ev.filter((e) => e.t === 'damage' && e.source === 'hero' && e.target === 'e0');
    expect(hits.length).toBe(5);
  });

  it('Corpo di Nebbia fa schivare i colpi', () => {
    let dodges = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const b = setup('fruit_mist', ['en_jelly', 'en_jelly', 'en_bat'], seed);
      const ev = use(b, 'fruit_mist');
      dodges += ev.filter((e) => e.t === 'dodge' && e.target === 'hero').length;
    }
    expect(dodges).toBeGreaterThan(5);
  });

  it('i potenziamenti su se stessi durano davvero i turni indicati', () => {
    const b = setup('fruit_fang');
    use(b, 'fruit_fang');
    expect(b.getStatus(b.hero, 'atkUp')?.turns).toBe(3);
    expect(b.getStatus(b.hero, 'defUp')?.turns).toBe(3);
  });

  it('Rete Appiccicosa rallenta e rende vulnerabili tutti i nemici', () => {
    const b = setup('fruit_glue', ['en_bat', 'en_jelly']);
    use(b, 'fruit_glue');
    const bat = b.unit('e0')!;
    if (bat.hp > 0) {
      expect(b.effSpd(bat)).toBeLessThan(bat.spd);
      expect(b.hasStatus(bat, 'vulnerable')).toBe(true);
    }
  });

  it('Specchio Riflesso rimanda parte del danno a chi attacca', () => {
    const b = setup('fruit_mirror', ['en_shroom_boss']);
    const ev = use(b, 'fruit_mirror');
    expect(ev.some((e) => e.t === 'damage' && e.kind === 'reflect' && e.target === 'e0')).toBe(true);
  });

  it('Secondo Rintocco lascia il turno al protagonista', () => {
    const b = setup('fruit_clock');
    const ev = use(b, 'fruit_clock');
    expect(ev.some((e) => e.t === 'extraAction')).toBe(true);
    expect(ev.some((e) => e.t === 'turn' && e.uid === 'e0')).toBe(false); // il nemico non ha ancora agito
    expect(b.phase).toBe('awaitingInput');
  });

  it('Strappo Magnetico ruba lo scudo al nemico', () => {
    const b = setup('fruit_magnet');
    b.unit('e0')!.statuses.push({ id: 'shield', turns: 3, value: 25 });
    const ev = use(b, 'fruit_magnet');
    expect(ev.some((e) => e.t === 'steal' && e.amount === 25)).toBe(true);
    expect(b.hasStatus(b.unit('e0')!, 'shield')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { FRUIT_BY_ID, FRUITS, fruitAbility, MAX_FRUIT_LEVEL } from '../src/data/fruits';
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
  it('ogni frutto ha 5 livelli di risveglio con ID unici e il danno cresce dal III al V', () => {
    const ids = FRUITS.flatMap((f) => f.abilities.map((a) => a.id));
    expect(new Set(ids).size).toBe(FRUITS.length * MAX_FRUIT_LEVEL);
    for (const f of FRUITS) {
      expect(f.abilities).toHaveLength(MAX_FRUIT_LEVEL);
      const dmg = (lvl: number) => f.abilities[lvl].effects.reduce((m, e) => m + (e.kind === 'damage' ? e.mult * (e.hits ?? 1) * (f.abilities[lvl].target === 'allEnemies' ? 1.5 : 1) : 0), 0);
      // dal III in su ogni livello rafforza il precedente (II → III può scambiare bersaglio singolo con area)
      expect(dmg(2)).toBeGreaterThanOrEqual(dmg(0));
      for (let l = 3; l < MAX_FRUIT_LEVEL; l++) expect(dmg(l)).toBeGreaterThanOrEqual(dmg(l - 1));
      expect(fruitAbility(f, 9).id).toBe(f.abilities[MAX_FRUIT_LEVEL - 1].id); // livello limitato a V
    }
  });

  it('ci sono 20 frutti con ID unici e almeno 3 iniziali', () => {
    expect(FRUITS).toHaveLength(20);
    expect(new Set(FRUITS.map((f) => f.id)).size).toBe(20);
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
    const b = setup('fruit_mirror', ['en_jelly']);
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

  // --- frutti della 0.5.5 ---------------------------------------------------------------------
  it('Morso Vampiro cura l\'eroe con il danno inflitto', () => {
    const b = setup('fruit_blood');
    b.hero.hp = 50;
    const ev = use(b, 'fruit_blood');
    expect(ev.some((e) => e.t === 'heal' && e.target === 'hero' && e.amount > 0)).toBe(true);
  });

  it('Nube Puzzolente avvelena e indebolisce tutti: un nemico indebolito colpisce meno forte', () => {
    const b = setup('fruit_stench', ['en_jelly', 'en_bat']);
    use(b, 'fruit_stench');
    for (const u of b.alive('enemy')) { expect(b.hasStatus(u, 'weak')).toBe(true); expect(b.hasStatus(u, 'poison')).toBe(true); }
    const avg = (weak: boolean) => {
      let tot = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const x = setup('fruit_stone', ['en_pudding_king'], seed);
        if (weak) x.unit('e0')!.statuses.push({ id: 'weak', turns: 9, value: 0.3 });
        tot += x.act({ type: 'guard' }).reduce((m, e) => m + (e.t === 'damage' && e.target === 'hero' ? e.amount + e.absorbed : 0), 0);
      }
      return tot;
    };
    expect(avg(true)).toBeLessThan(avg(false));
  });

  it('Spruzzo Acido scioglie lo scudo e il suo danno cresce a ogni turno', () => {
    const b = setup('fruit_acid', ['en_pudding_king']);
    b.unit('e0')!.statuses.push({ id: 'shield', turns: 3, value: 30 });
    const ev = use(b, 'fruit_acid');
    expect(ev.some((e) => e.t === 'melt' && e.amount === 30)).toBe(true);
    const ticks: number[] = [];
    let all = ev;
    for (let i = 0; i < 3 && b.phase === 'awaitingInput'; i++) all = all.concat(b.act({ type: 'guard' }));
    for (const e of all) if (e.t === 'damage' && e.kind === 'acid') ticks.push(e.amount);
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    expect(ticks[1]).toBeGreaterThan(ticks[0]);
  });

  it('Bolla Prigione: il nemico salta il turno e poi la bolla scoppia', () => {
    const b = setup('fruit_bubble', ['en_jelly']);
    b.unit('e0')!.maxHp = b.unit('e0')!.hp = 999;
    let ev = use(b, 'fruit_bubble');
    for (let i = 0; i < 2 && b.phase === 'awaitingInput'; i++) ev = ev.concat(b.act({ type: 'guard' }));
    expect(ev.some((e) => e.t === 'bubbled' && e.uid === 'e0')).toBe(true);
    expect(ev.some((e) => e.t === 'damage' && e.kind === 'pop' && e.target === 'e0')).toBe(true);
  });

  it('nei boss la bolla dura al massimo 1 turno', () => {
    const b = setup('fruit_bubble', ['en_pudding_king']);
    b.act({ type: 'power', abilityId: 'pw_bubble', targetUid: 'e0' });
    const b2 = new Battle({
      hero: makeHeroUnit('Ema', { maxHp: 100, atk: 12, def: 4, spd: 30 }, 100), companions: [],
      enemies: [makeEnemyUnit('en_pudding_king', 'e0')], powers: [FRUIT_BY_ID.get('fruit_bubble')!.abilities[1]], potions: 0,
      mods: { powerDamageMult: 1, surviveLethalOnce: false },
    }, new Rng(3));
    b2.start(); b2.energy = 5;
    const ev = b2.act({ type: 'power', abilityId: 'pw_bubble_2', targetUid: 'e0' });
    const st = ev.find((e) => e.t === 'status' && e.status === 'bubble');
    expect(st && st.t === 'status' ? st.turns : 0).toBe(1);
  });

  it('Seme-Mina esplode all\'inizio del turno del nemico', () => {
    const b = setup('fruit_mine', ['en_pudding_king']);
    const ev = use(b, 'fruit_mine');
    const iTurn = ev.findIndex((e) => e.t === 'turn' && e.uid === 'e0');
    const iBoom = ev.findIndex((e) => e.t === 'damage' && e.kind === 'mine' && e.target === 'e0');
    expect(iTurn).toBeGreaterThanOrEqual(0);
    expect(iBoom).toBeGreaterThan(iTurn);
    expect(b.hasStatus(b.unit('e0')!, 'mine')).toBe(false);
  });

  it('Grappolo: gli acini attaccano a fine turno e scoppiano quando l\'eroe è colpito', () => {
    const b = setup('fruit_swarm', ['en_pudding_king']);
    const ev = use(b, 'fruit_swarm');
    const sw = ev.find((e) => e.t === 'swarm');
    expect(sw && sw.t === 'swarm' ? sw.count : 0).toBe(3);
    expect(ev.filter((e) => e.t === 'damage' && e.kind === 'swarm').length).toBe(3);
    const hits = ev.filter((e) => e.t === 'damage' && e.target === 'hero' && e.kind === 'hit' && e.amount > 0).length;
    expect(b.getStatus(b.hero, 'swarm')!.value).toBe(Math.max(0, 3 - hits));
  });

  it('Doppio: la gemella ripete gli attacchi dell\'eroe per i turni indicati', () => {
    const b = setup('fruit_twin', ['en_pudding_king']);
    b.unit('e0')!.maxHp = b.unit('e0')!.hp = 9999;
    const ev = use(b, 'fruit_twin');
    expect(ev.some((e) => e.t === 'use' && e.isTwin)).toBe(true);
    let twins = 0;
    for (let i = 0; i < 5 && b.phase === 'awaitingInput'; i++) twins += b.act({ type: 'attack', targetUid: 'e0' }).filter((e) => e.t === 'use' && e.isTwin).length;
    expect(twins).toBe(3); // 3 turni di gemella dopo il turno del potere
  });
});

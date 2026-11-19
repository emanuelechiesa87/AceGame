import { describe, expect, it } from 'vitest';
import { FRUIT_BY_ID } from '../src/data/fruits';
import { Battle, makeCompanionUnit, makeEnemyUnit, makeHeroUnit } from '../src/systems/combat/Battle';
import type { BattleEvent } from '../src/systems/combat/types';
import { Rng } from '../src/systems/Rng';

const mods = { powerDamageMult: 1, surviveLethalOnce: false };
const hero = (hp = 100, spd = 10) => makeHeroUnit('Kai', { maxHp: 100, atk: 12, def: 4, spd }, hp);

function battle(opts: { enemies?: string[]; companions?: string[]; seed?: number; heroHp?: number; heroSpd?: number; mods?: typeof mods } = {}) {
  return new Battle(
    {
      hero: hero(opts.heroHp, opts.heroSpd),
      companions: (opts.companions ?? []).map((c, i) => makeCompanionUnit(c, `c${i}`)),
      enemies: (opts.enemies ?? ['en_jelly']).map((e, i) => makeEnemyUnit(e, `e${i}`)),
      powers: [FRUIT_BY_ID.get('fruit_ember')!.abilities[0], FRUIT_BY_ID.get('fruit_storm')!.abilities[0]],
      potions: 1,
      mods: opts.mods ?? mods,
    },
    new Rng(opts.seed ?? 1),
  );
}

/** Gioca automaticamente: attacca sempre il primo nemico vivo. */
function autoplay(b: Battle): BattleEvent[] {
  const log = b.start();
  for (let i = 0; i < 300 && b.phase === 'awaitingInput'; i++) log.push(...b.act({ type: 'attack', targetUid: b.enemies()[0].uid }));
  return log;
}

describe('Battle', () => {
  it('i compagni attaccano e colpiscono il nemico scelto dal giocatore', () => {
    const b = battle({ enemies: ['en_jelly', 'en_shroom_boss'], companions: ['comp_bobo', 'comp_zip'] });
    b.start();
    const ev = [...b.act({ type: 'attack', targetUid: 'e1' }), ...b.act({ type: 'attack', targetUid: 'e1' })];
    const allyHits = ev.filter((e) => e.t === 'damage' && (e.source === 'c0' || e.source === 'c1') && e.kind === 'hit');
    expect(allyHits.length).toBeGreaterThanOrEqual(2);
    for (const h of allyHits) expect((h as { target: string }).target).toBe('e1');
  });

  it('i compagni crescono con i mari', () => {
    const base = makeCompanionUnit('comp_zip', 'c0');
    const later = makeCompanionUnit('comp_zip', 'c0', undefined, 0, { hp: 1.6, atk: 1.7 });
    expect(later.atk).toBeGreaterThan(base.atk);
    expect(later.maxHp).toBeGreaterThan(base.maxHp);
  });

  it('si ferma in attesa del protagonista', () => {
    const b = battle();
    b.start();
    expect(b.phase).toBe('awaitingInput');
  });

  it('ordina i turni per velocità: un nemico più veloce agisce prima', () => {
    const b = battle({ enemies: ['en_bat'], heroSpd: 10 }); // pipistrello VEL 14
    const ev = b.start();
    const firstTurn = ev.find((e) => e.t === 'turn');
    expect(firstTurn).toMatchObject({ uid: 'e0' });
    expect(b.hero.hp).toBeLessThan(100);
  });

  it('è deterministico a parità di seed', () => {
    const a = JSON.stringify(autoplay(battle({ enemies: ['en_jelly', 'en_bat'], seed: 42 })));
    const b = JSON.stringify(autoplay(battle({ enemies: ['en_jelly', 'en_bat'], seed: 42 })));
    expect(a).toBe(b);
  });

  it('una battaglia semplice termina con una vittoria', () => {
    const b = battle({ enemies: ['en_jelly'] });
    const ev = autoplay(b);
    expect(b.phase).toBe('victory');
    expect(ev.at(-1)).toEqual({ t: 'end', result: 'victory' });
  });

  it('se il protagonista cade è sconfitta anche con compagni vivi', () => {
    const b = battle({ enemies: ['en_pudding_king'], companions: ['comp_bobo'], heroHp: 5 });
    autoplay(b);
    expect(b.phase).toBe('defeat');
  });

  it('i poteri consumano energia e non si usano senza', () => {
    const b = battle();
    b.start();
    expect(b.energy).toBe(2);
    b.act({ type: 'power', abilityId: 'pw_ember', targetUid: 'e0' });
    // dopo il potere (-2) e un nuovo round (+1)
    expect(b.energy).toBeLessThanOrEqual(1);
    if (b.phase === 'awaitingInput') expect(() => b.act({ type: 'power', abilityId: 'pw_storm' })).toThrow();
  });

  it('il potere di fuoco applica bruciatura', () => {
    const b = battle({ enemies: ['en_pudding_king'] });
    b.start();
    const ev = b.act({ type: 'power', abilityId: 'pw_ember', targetUid: 'e0' });
    expect(ev.some((e) => e.t === 'status' && e.status === 'burn')).toBe(true);
  });

  it('il potere ad area colpisce tutti i nemici', () => {
    const b = battle({ enemies: ['en_pudding_king', 'en_shroom_boss'] });
    b.start();
    b.energy = 5;
    const ev = b.act({ type: 'power', abilityId: 'pw_storm' });
    const hit = new Set(ev.filter((e) => e.t === 'damage' && e.source === 'hero').map((e) => (e as { target: string }).target));
    expect(hit).toEqual(new Set(['e0', 'e1']));
  });

  it('la speciale del compagno è gratuita e richiede la carica piena', () => {
    const b = battle({ enemies: ['en_pudding_king'], companions: ['comp_bobo'] });
    b.start();
    const c = b.unit('c0')!;
    expect(b.canSpecial(c)).toBe(false);
    expect(() => b.act({ type: 'special', companionUid: 'c0' })).toThrow();
    c.charge = c.chargeMax;
    const ev = b.act({ type: 'special', companionUid: 'c0' });
    expect(ev.filter((e) => e.t === 'shield').length).toBe(2); // protagonista + Bobo
    expect(b.phase).toBe('awaitingInput'); // turno del protagonista non consumato
    expect(c.charge).toBe(0);
  });

  it('i compagni agiscono da soli e accumulano carica', () => {
    const b = battle({ enemies: ['en_pudding_king'], companions: ['comp_zip'] });
    b.start();
    b.act({ type: 'guard' });
    expect(b.unit('c0')!.charge).toBeGreaterThan(0);
  });

  it('la difesa dimezza i danni ricevuti', () => {
    const dmgTaken = (guard: boolean) => {
      const b = battle({ enemies: ['en_shroom_boss'], seed: 7 });
      b.start();
      const ev = b.act(guard ? { type: 'guard' } : { type: 'potion' });
      return ev.filter((e) => e.t === 'damage' && e.target === 'hero').reduce((s, e) => s + (e as { amount: number }).amount, 0);
    };
    expect(dmgTaken(true)).toBeLessThan(dmgTaken(false));
  });

  it('Filo del Destino salva da un colpo letale una volta', () => {
    const b = battle({ enemies: ['en_pudding_king'], heroHp: 3, mods: { powerDamageMult: 1, surviveLethalOnce: true } });
    const ev = b.start();
    ev.push(...b.act({ type: 'guard' }));
    expect(ev.some((e) => e.t === 'survive')).toBe(true);
  });

  it('il boss sotto metà HP evoca rinforzi una sola volta', () => {
    const b = battle({ enemies: ['en_pudding_king'], seed: 3 });
    b.start();
    b.unit('e0')!.hp = 90;
    const ev = b.act({ type: 'guard' });
    expect(ev.filter((e) => e.t === 'enrage').length).toBe(1);
    expect(ev.some((e) => e.t === 'summon')).toBe(true);
    const ev2 = b.phase === 'awaitingInput' ? b.act({ type: 'guard' }) : [];
    expect(ev2.some((e) => e.t === 'enrage')).toBe(false);
  });

  it('ogni nemico mostra in anticipo la prossima mossa', () => {
    const b = battle({ enemies: ['en_jelly', 'en_bat'] });
    const ev = b.start();
    expect(ev.filter((e) => e.t === 'intent').map((e) => (e as { uid: string }).uid)).toEqual(expect.arrayContaining(['e0', 'e1']));
  });

  it('il veleno danneggia all\'inizio del turno e poi scade', () => {
    const b = battle({ enemies: ['en_jelly'] });
    b.start();
    b.hero.statuses.push({ id: 'poison', turns: 1, value: 5 });
    const hp = b.hero.hp;
    const ev = b.act({ type: 'guard' });
    expect(ev.some((e) => e.t === 'damage' && e.kind === 'poison' && e.target === 'hero')).toBe(true);
    expect(b.hero.hp).toBeLessThan(hp);
    expect(b.hasStatus(b.hero, 'poison')).toBe(false);
  });
});

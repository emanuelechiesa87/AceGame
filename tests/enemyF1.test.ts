import { describe, expect, it } from 'vitest';
import { BALANCE } from '../src/data/balance';
import { ENEMIES } from '../src/data/enemies';
import { Battle, isCharged, makeCompanionUnit, makeEnemyUnit, makeHeroUnit } from '../src/systems/combat/Battle';
import type { BattleEvent } from '../src/systems/combat/types';
import { Rng } from '../src/systems/Rng';
import { pickTapTarget, TAP_SLACK } from '../src/scenes/battleLayout';

const mods = { powerDamageMult: 1, surviveLethalOnce: false };

/** Granchio Capitano: la prima mossa (Chela Gigante) è un colpo caricato. */
function crab(seed = 1, companions: string[] = []) {
  return new Battle({
    hero: makeHeroUnit('Ema', { maxHp: 200, atk: 1, def: 0, spd: 30 }, 200),
    companions: companions.map((c, i) => makeCompanionUnit(c, `c${i}`)),
    enemies: [makeEnemyUnit('en_shroom_boss', 'e0')],
    powers: [], potions: 3, mods,
  }, new Rng(seed));
}
const heroDamage = (ev: BattleEvent[]) => ev.filter((e) => e.t === 'damage' && e.target === 'hero' && e.kind === 'hit').reduce((s, e) => s + (e as { amount: number }).amount, 0);

describe('F1 · colpi caricati', () => {
  it('le mosse forti esistono e sono riconosciute come caricate', () => {
    const charged = ENEMIES.flatMap((d) => Object.values(d.moves)).filter(isCharged);
    expect(charged.length).toBeGreaterThan(10);
  });

  it('prima carica (avviso con mirino), poi colpisce al turno dopo', () => {
    const b = crab();
    const start = b.start();
    const intent = start.find((e) => e.t === 'intent') as Extract<BattleEvent, { t: 'intent' }>;
    expect(intent.intent).toBe('charge');
    expect(intent.aim).toBe('hero'); // senza compagni il mirino è per forza l'eroe
    const t1 = b.act({ type: 'potion' });
    expect(t1.some((e) => e.t === 'windup')).toBe(true);
    expect(heroDamage(t1)).toBe(0);
    const t2 = b.act({ type: 'potion' });
    expect(heroDamage(t2)).toBeGreaterThan(0);
  });

  it('la Difesa para il colpo caricato molto più di un colpo normale e ridà energia', () => {
    const run = (guard: boolean) => {
      const b = crab(3);
      b.start();
      b.act({ type: 'potion' }); // carica
      const e0 = b.energy;
      const ev = b.act(guard ? { type: 'guard' } : { type: 'potion' });
      return { dmg: heroDamage(ev), parry: ev.some((e) => e.t === 'parry'), energy: b.energy - e0 };
    };
    const open = run(false), guarded = run(true);
    expect(guarded.parry).toBe(true);
    expect(open.parry).toBe(false);
    expect(guarded.dmg).toBeLessThanOrEqual(Math.ceil(open.dmg * BALANCE.combat.charged.guardMult * 1.3));
    expect(guarded.energy).toBeGreaterThan(open.energy);
  });

  it("l'eroe in Difesa si mette davanti al compagno preso di mira", () => {
    // cerca un seme in cui il colpo caricato mira a un compagno
    for (let seed = 1; seed < 200; seed++) {
      const b = crab(seed, ['comp_bobo']);
      const start = b.start();
      const intent = start.find((e) => e.t === 'intent') as Extract<BattleEvent, { t: 'intent' }>;
      if (intent.aim !== 'c0') continue;
      b.act({ type: 'potion' });
      const ev = b.act({ type: 'guard' });
      expect(ev.some((e) => e.t === 'cover' && e.ally === 'c0')).toBe(true);
      expect(ev.some((e) => e.t === 'damage' && e.target === 'c0' && e.source === 'e0')).toBe(false);
      return;
    }
    throw new Error('nessun seme con il compagno nel mirino');
  });

  it('un nemico congelato perde la carica', () => {
    const b = crab();
    b.start();
    b.unit('e0')!.statuses.push({ id: 'stun', turns: 1, value: 0 });
    const ev = b.act({ type: 'potion' });
    expect(ev.some((e) => e.t === 'interrupt')).toBe(true);
    expect(b.unit('e0')!.chargeState).toBeUndefined();
  });
});

describe('F1 · bersaglio dei nemici', () => {
  it("con i compagni l'eroe è preso di mira più spesso che a caso (1 su 4)", () => {
    let heroHits = 0, all = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const b = new Battle({
        hero: makeHeroUnit('Ema', { maxHp: 500, atk: 1, def: 0, spd: 30 }, 500),
        companions: ['comp_bobo', 'comp_lumi', 'comp_zip'].map((c, i) => makeCompanionUnit(c, `c${i}`, 500)),
        enemies: [makeEnemyUnit('en_bat', 'e0')], powers: [], potions: 0, mods,
      }, new Rng(seed));
      b.start();
      const ev = b.act({ type: 'guard' });
      for (const e of ev) if (e.t === 'damage' && e.source === 'e0') { all++; if (e.target === 'hero') heroHits++; }
    }
    expect(heroHits / all).toBeGreaterThan(0.45);
  });
});

describe('Tocco dei nemici', () => {
  const box = (x: number, y: number) => ({ x0: x - 60, y0: y - 200, x1: x + 60, y1: y + 40 });
  const a = { uid: 'a', box: box(300, 500), cx: 300, cy: 420 };
  const b = { uid: 'b', box: box(480, 440), cx: 480, cy: 360 };
  it('il tocco sul corpo seleziona quel nemico', () => {
    expect(pickTapTarget(300, 420, [a, b])).toBe('a');
    expect(pickTapTarget(480, 360, [a, b])).toBe('b');
  });
  it('un tocco un po\' fuori va comunque a segno, uno lontano no', () => {
    expect(pickTapTarget(300, 560, [a, b])).toBe('a');
    expect(pickTapTarget(300, 540 + TAP_SLACK + 20, [a, b])).toBeUndefined();
  });
  it('nella zona in comune vince il corpo più vicino al dito', () => {
    expect(pickTapTarget(365, 380, [a, b])).toBe('a');
    expect(pickTapTarget(420, 360, [a, b])).toBe('b');
  });
});

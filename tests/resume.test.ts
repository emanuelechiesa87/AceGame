import { describe, expect, it } from 'vitest';
import { FRUITS } from '../src/data/fruits';
import { AREAS } from '../src/data/areas';
import { COMPANIONS } from '../src/data/companions';
import { createRunState } from '../src/state/RunState';
import { resumeTarget } from '../src/systems/checkpoint';
import { Battle, makeCompanionUnit, makeEnemyUnit, makeHeroUnit } from '../src/systems/combat/Battle';
import type { PlayerAction } from '../src/systems/combat/types';
import { Rng } from '../src/systems/Rng';
import { RunController } from '../src/systems/RunController';

function newBattle(seed: number) {
  const ctl = new RunController(createRunState('a', seed, undefined, 'Kai', 0));
  ctl.start([]);
  const run = ctl.run;
  run.activeFruitIds = [FRUITS[seed % FRUITS.length].id];
  run.fruitLevel = 1 + (seed % 5);
  run.fruitBranch = seed % 2 ? 'a' : 'b';
  for (let i = 0; i < 3; i++) ctl.recruit(COMPANIONS[(seed + i) % COMPANIONS.length].id);
  run.areaIndex = seed % AREAS.length;
  const g = ctl.area.groups;
  const ids = seed % 3 === 0 ? [...g.boss] : seed % 3 === 1 ? [...g.elite[seed % g.elite.length]] : [...g.late[seed % g.late.length]];
  const b = new Battle({
    hero: makeHeroUnit('Kai', run.baseStats, 100),
    companions: ctl.companionsReady.map((c, i) => makeCompanionUnit(c.id, `c${i}`, c.hp, c.charge, ctl.companionScale)),
    enemies: ids.map((id, i) => makeEnemyUnit(id, `e${i}`, ctl.enemyScale)),
    powers: ctl.battlePowers(), potions: 2, mods: ctl.battleMods(),
  }, ctl.rng);
  return { ctl, b };
}

function nextAction(b: Battle, k: number): PlayerAction {
  const t = b.enemies()[k % b.enemies().length].uid;
  const s = b.alive('ally').find((u) => b.canSpecial(u));
  if (s) return { type: 'special', companionUid: s.uid, targetUid: t };
  if (k % 4 === 3) return { type: 'guard' };
  const p = b.powers.find((x) => b.canUsePower(x));
  return p ? { type: 'power', abilityId: p.id, targetUid: t } : { type: 'attack', targetUid: t };
}

describe('Ripresa dello scontro', () => {
  it('chiudere e riaprire dopo ogni azione non cambia nulla', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const straight = newBattle(seed);
      let resumed = newBattle(seed);
      straight.b.start(); resumed.b.start();
      for (let k = 0; k < 200 && straight.b.phase === 'awaitingInput'; k++) {
        // "chiusura dell'app": run e scontro passano dal testo salvato
        const run = JSON.parse(JSON.stringify(resumed.ctl.run));
        const snap = JSON.parse(JSON.stringify(resumed.b.snapshot()));
        const ctl = new RunController(run);
        resumed = { ctl, b: Battle.restore(snap, ctl.battlePowers(), ctl.battleMods(), ctl.rng) };
        const a = nextAction(straight.b, k);
        expect(resumed.b.act(a)).toEqual(straight.b.act(a));
        expect(resumed.b.snapshot()).toEqual(straight.b.snapshot());
      }
    }
  }, 60000);

  it('lo scontro ripreso ha gli stessi campi di quello originale (nessuno dimenticato)', () => {
    const { b } = newBattle(5);
    b.start();
    const r = Battle.restore(b.snapshot(), b.powers, (b as unknown as { mods: never }).mods, new Rng(1));
    const keys = (x: object) => Object.keys(x).filter((k) => (x as Record<string, unknown>)[k] !== undefined).sort();
    expect(keys(r)).toEqual(keys(b));
  });
});

describe('Dove si riprende la run', () => {
  const run = () => { const c = new RunController(createRunState('a', 3)); c.start([]); return c.run; };

  it('tappa non iniziata: cammino; tappa scelta: si rientra nella stessa', () => {
    const r = run();
    expect(resumeTarget(r)).toEqual({ kind: 'scene', key: 'Exploration' });
    r.map[0].chosen = 'elite';
    expect(resumeTarget(r)).toEqual({ kind: 'scene', key: 'Battle', data: { node: 'elite' } });
    r.map[0].chosen = 'chest';
    expect(resumeTarget(r)).toMatchObject({ key: 'Reward', data: { mode: 'chest' } });
    r.map[0].chosen = 'rest';
    expect(resumeTarget(r)).toMatchObject({ key: 'Event', data: { node: 'rest' } });
  });

  it('ricompensa in sospeso e tappa già risolta', () => {
    const r = run();
    r.map[0].chosen = 'battle';
    r.pending = { phase: 'reward', node: 'battle', coins: 11, offered: true };
    expect(resumeTarget(r)).toMatchObject({ key: 'Reward', data: { mode: 'battle', coins: 11, offered: true } });
    r.pending = { phase: 'done' };
    expect(resumeTarget(r)).toEqual({ kind: 'finish' });
  });
});

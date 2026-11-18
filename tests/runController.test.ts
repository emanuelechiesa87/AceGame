import { describe, expect, it } from 'vitest';
import { AREAS } from '../src/data/areas';
import { FRUITS } from '../src/data/fruits';
import { createRunState } from '../src/state/RunState';
import { RunController } from '../src/systems/RunController';

const fresh = (seed = 5) => {
  const ctl = new RunController(createRunState('a', seed));
  ctl.start([]);
  return ctl;
};

describe('RunController', () => {
  it('assegna un frutto iniziale casuale dal pool sbloccato', () => {
    const starters = FRUITS.filter((f) => f.startsUnlocked).map((f) => f.id);
    const seen = new Set<string>();
    for (let s = 1; s < 60; s++) {
      const ctl = fresh(s);
      expect(ctl.run.activeFruitIds).toHaveLength(1);
      expect(starters).toContain(ctl.run.activeFruitIds[0]);
      seen.add(ctl.run.activeFruitIds[0]);
    }
    expect(seen.size).toBeGreaterThan(1); // non sempre lo stesso potere
  });

  it('i frutti scoperti entrano nel pool iniziale', () => {
    const seen = new Set<string>();
    for (let s = 1; s < 200; s++) {
      const ctl = new RunController(createRunState('a', s));
      seen.add(ctl.start(['fruit_shadow']));
    }
    expect(seen.has('fruit_shadow')).toBe(true);
  });

  it('genera una mappa che inizia con una battaglia e finisce col boss', () => {
    const ctl = fresh();
    const map = ctl.run.map;
    expect(map).toHaveLength(AREAS[0].steps + 1);
    expect(map[0].options).toEqual(['battle']);
    expect(map.at(-1)!.options).toEqual(['boss']);
    expect(map[1].options).toContain('recruit');
    expect(map.at(-2)!.options).toContain('rest');
  });

  it('massimo tre frutti: il quarto chiede sostituzione o rifiuto', () => {
    const ctl = fresh();
    const others = FRUITS.map((f) => f.id).filter((id) => !ctl.run.activeFruitIds.includes(id));
    expect(ctl.gainFruit(others[0])).toBe('added');
    expect(ctl.gainFruit(others[1])).toBe('added');
    expect(ctl.gainFruit(others[2])).toBe('needsReplace');
    expect(ctl.run.activeFruitIds).toHaveLength(3);
    const old = ctl.run.activeFruitIds[0];
    expect(ctl.gainFruit(others[2], old)).toBe('added');
    expect(ctl.run.activeFruitIds).toHaveLength(3);
    expect(ctl.run.activeFruitIds).not.toContain(old);
    expect(ctl.run.usedFruitIds).toContain(others[2]);
  });

  it('squadra massima quattro: il quarto compagno richiede sostituzione', () => {
    const ctl = fresh();
    expect(ctl.recruit('comp_bobo')).toBe('added');
    expect(ctl.recruit('comp_lumi')).toBe('added');
    expect(ctl.recruit('comp_zip')).toBe('added');
    expect(ctl.recruit('comp_bobo')).toBe('duplicate');
    expect(ctl.run.companions).toHaveLength(3);
  });

  it('le ricompense non propongono doppioni e l\'élite garantisce un artefatto', () => {
    const ctl = fresh();
    for (let i = 0; i < 20; i++) {
      const r = ctl.rewardOptions('battle');
      expect(new Set(r.map((x) => x.kind)).size).toBe(r.length);
      expect(r.length).toBe(3);
    }
    expect(ctl.rewardOptions('elite').some((r) => r.kind === 'artifact')).toBe(true);
  });

  it('punteggio: nemici, élite e boss', () => {
    const ctl = fresh();
    ctl.onVictory(['en_jelly', 'en_bat'], 50, []);
    expect(ctl.run.score).toBe(20);
    ctl.onVictory(['en_pudding_king'], 50, []);
    expect(ctl.run.score).toBe(220);
    expect(ctl.run.bossesDefeated).toBe(1);
  });

  it('i compagni KO tornano con parte degli HP dopo la vittoria', () => {
    const ctl = fresh();
    ctl.recruit('comp_bobo');
    ctl.onVictory(['en_jelly'], 40, [{ id: 'comp_bobo', hp: 0, charge: 2 }]);
    expect(ctl.run.companions[0].hp).toBeGreaterThan(0);
  });

  it('riprende la stessa sequenza casuale dopo un ricaricamento', () => {
    const a = fresh(9);
    const snapshot = JSON.parse(JSON.stringify(a.run));
    const nextA = a.rewardOptions('battle');
    const b = new RunController(snapshot);
    expect(b.rewardOptions('battle')).toEqual(nextA);
  });
});

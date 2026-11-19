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

  it('un solo frutto per run: nel primo mare il Risveglio arriva al livello III', () => {
    const ctl = fresh();
    expect(ctl.run.activeFruitIds).toHaveLength(1);
    expect(ctl.fruitLevel).toBe(1);
    expect(ctl.awaken()).toBe(true);
    expect(ctl.awaken()).toBe(true);
    expect(ctl.fruitLevel).toBe(3);
    expect(ctl.awaken()).toBe(false);
    expect(ctl.canAwaken).toBe(false);
    for (let i = 0; i < 20; i++) expect(ctl.rewardOptions('battle').some((r) => r.kind === 'awaken')).toBe(false);
  });

  it('le ricompense non offrono mai frutti nuovi e l\'élite offre il risveglio', () => {
    const ctl = fresh();
    for (let i = 0; i < 30; i++) for (const r of ctl.rewardOptions('battle')) expect(['awaken', 'artifact', 'potion', 'heal', 'maxHp']).toContain(r.kind);
    expect(ctl.rewardOptions('elite').some((r) => r.kind === 'awaken')).toBe(true);
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

  it('dopo il boss si salpa verso il mare successivo: nuova mappa, cura, tetto del Risveglio più alto', () => {
    const ctl = fresh();
    ctl.awaken(); ctl.awaken();
    expect(ctl.canAwaken).toBe(false);
    ctl.run.currentHp = 10;
    ctl.run.stepIndex = ctl.run.map.length;
    expect(ctl.nextArea()).toBe(true);
    expect(ctl.run.areaIndex).toBe(1);
    expect(ctl.run.stepIndex).toBe(0);
    expect(ctl.run.map.at(-1)!.options).toEqual(['boss']);
    expect(ctl.run.currentHp).toBeGreaterThan(10);
    expect(ctl.enemyScale.hp).toBeGreaterThan(1);
    expect(ctl.awaken()).toBe(true);
    expect(ctl.fruitLevel).toBe(4);
    expect(ctl.canAwaken).toBe(false);
    expect(ctl.nextArea()).toBe(true);
    expect(ctl.awaken()).toBe(true);
    expect(ctl.fruitLevel).toBe(5);
    expect(ctl.nextArea()).toBe(true);
    expect(ctl.run.areaIndex).toBe(AREAS.length - 1);
    expect(ctl.nextArea()).toBe(false); // ultimo mare: la run finisce qui
  });

  it('le aree diventano via via più dure', () => {
    for (let i = 1; i < AREAS.length; i++) {
      expect(AREAS[i].scale.hp).toBeGreaterThan(AREAS[i - 1].scale.hp);
      expect(AREAS[i].maxFruitLevel).toBeGreaterThanOrEqual(AREAS[i - 1].maxFruitLevel);
    }
    expect(AREAS).toHaveLength(4);
  });
});

import { describe, expect, it } from 'vitest';
import { COMPANIONS } from '../src/data/companions';
import { createRunState } from '../src/state/RunState';
import { RunController } from '../src/systems/RunController';

describe('Compagni al completo', () => {
  it('con 3 compagni non escono più incontri, né in questo mare né nei successivi', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const ctl = new RunController(createRunState('a', seed));
      ctl.start([]);
      for (const c of COMPANIONS) ctl.recruit(c.id);
      expect(ctl.teamFull).toBe(true);
      expect(ctl.run.map.slice(ctl.run.stepIndex).some((s) => s.options.includes('recruit'))).toBe(false);
      while (ctl.nextArea()) expect(ctl.run.map.some((s) => s.options.includes('recruit'))).toBe(false);
    }
  });

  it('un salvataggio vecchio con la squadra piena viene ripulito al caricamento', () => {
    const ctl = new RunController(createRunState('a', 7));
    ctl.start([]);
    ctl.run.companions = COMPANIONS.map((c) => ({ id: c.id, hp: 10, charge: 0 }));
    ctl.run.map[3].options = ['recruit', 'battle'];
    const again = new RunController(ctl.run);
    expect(again.run.map[3].options).not.toContain('recruit');
    expect(again.run.map[3].options).toHaveLength(2);
  });

  it('con meno di 3 compagni gli incontri restano', () => {
    const ctl = new RunController(createRunState('a', 3));
    ctl.start([]);
    expect(ctl.run.map[1].options).toContain('recruit');
  });
});

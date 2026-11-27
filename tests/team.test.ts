import { describe, expect, it } from 'vitest';
import { AREAS } from '../src/data/areas';
import { COMPANIONS } from '../src/data/companions';
import { createRunState } from '../src/state/RunState';
import { RunController } from '../src/systems/RunController';

/** Forza dei nemici (HP, ATT) nel mare `area` con `n` compagni reclutati. */
function scale(area: number, n: number) {
  const ctl = new RunController(createRunState('a', 7));
  ctl.start([]);
  for (let i = 0; i < n; i++) ctl.recruit(COMPANIONS[i].id);
  ctl.run.areaIndex = area;
  return ctl.enemyScale;
}

describe('Nemici in base alla squadra (0.11.0)', () => {
  it('nel primo mare la squadra non conta', () => {
    for (let n = 0; n <= 3; n++) expect(scale(0, n)).toEqual(scale(0, 0));
  });

  it('dal secondo mare meno compagni = nemici più deboli', () => {
    for (let a = 1; a < AREAS.length; a++) for (let n = 1; n <= 3; n++) {
      expect(scale(a, n).hp).toBeGreaterThan(scale(a, n - 1).hp);
      expect(scale(a, n).atk).toBeGreaterThan(scale(a, n - 1).atk);
    }
  });

  it('un compagno KO conta come presente: tenerlo a terra non indebolisce i nemici', () => {
    const ctl = new RunController(createRunState('a', 7));
    ctl.start([]);
    ctl.recruit(COMPANIONS[0].id);
    ctl.run.areaIndex = 2;
    const up = ctl.enemyScale;
    ctl.run.companions[0].hp = 0;
    expect(ctl.enemyScale).toEqual(up);
  });
});

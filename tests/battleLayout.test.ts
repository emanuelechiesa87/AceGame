import { describe, expect, it, vi } from 'vitest';
vi.mock('phaser', () => ({ default: { Textures: { FilterMode: { NEAREST: 1 } } } }));
import { AREAS } from '../src/data/areas';
import { ENEMY_BY_ID } from '../src/data/enemies';
import { CREATURES, CREATURE_SCALE } from '../src/pixel/creatures';
import { allyBox, allySpots, enemyBox, frameFor, overlap, placeEnemy, type Box } from '../src/scenes/battleLayout';

const size = (id: string, k: number) => ({ w: CREATURES[id].w * (CREATURE_SCALE[id] ?? 0.8) * k, h: CREATURES[id].h * (CREATURE_SCALE[id] ?? 0.8) * k });

const SUMMON: Record<string, string> = { en_pudding_king: 'en_jelly', en_anemone_queen: 'en_puffer_horn', en_abyss_lighthouse: 'en_lanternfish', en_wreck_admiral: 'en_barrel' };

/** Campo completo: squadra di 4 + gruppo di nemici (+ evocati fino a 4 per i boss). */
export function layout(visTop: number, visBottom: number, group: string[]) {
  const f = frameFor(visTop, visBottom);
  const spots = allySpots(f);
  const allyIds = ['hero', 'comp_bobo', 'comp_lumi', 'comp_zip'];
  const boxes: Box[] = spots.map((s, i) => allyBox(s.x, s.y, i === 0 ? { w: 170 * s.k, h: 270 * s.k } : size(allyIds[i], s.k)));
  const ids = [...group];
  if (SUMMON[group[0]]) ids.push(SUMMON[group[0]], SUMMON[group[0]], SUMMON[group[0]]);
  const placed: { id: string; x: number; y: number }[] = [];
  ids.forEach((id, i) => {
    const s = size(id, ENEMY_BY_ID.get(id)!.tier === 'normal' ? f.enemyK : f.bigEnemyK);
    const p = placeEnemy(f, s, boxes, i === 0);
    boxes.push(enemyBox(p.x, p.y, s));
    placed.push({ id, ...p });
  });
  let worst = 0;
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    const minArea = Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0));
    worst = Math.max(worst, overlap(a, b) / minArea);
  }
  return { f, placed, worst };
}

const groups = AREAS.flatMap((a) => [...a.groups.early, ...a.groups.late, ...a.groups.elite, [a.groups.boss[0]]]);

describe('Campo di battaglia in diagonale', () => {
  for (const [name, top, bottom] of [['9:16', 0, 1280], ['S23 (9:19,5)', -140, 1420]] as const) {
    it(`nessuna unità coperta per più di un terzo (${name})`, () => {
      let worst = 0;
      for (const g of groups) {
        const r = layout(top, bottom, g);
        worst = Math.max(worst, r.worst);
      }
      expect(worst).toBeLessThan(0.34);
    });
  }
});

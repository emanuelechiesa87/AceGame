import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';
vi.mock('phaser', () => ({ default: { Textures: { FilterMode: { NEAREST: 1 } } } }));
import { AREAS } from '../src/data/areas';
import { ENEMIES, ENEMY_BY_ID } from '../src/data/enemies';
import { CREATURE_SCALE } from '../src/pixel/creatures';

describe('Mari e nemici', () => {
  it('ogni mare ha nemici, élite e boss propri, tutti diversi tra i mari', () => {
    const seen = new Map<string, string>();
    for (const a of AREAS) {
      const ids = new Set([...a.groups.early.flat(), ...a.groups.late.flat(), ...a.groups.elite.flat(), ...a.groups.boss]);
      for (const id of ids) {
        expect(ENEMY_BY_ID.has(id), id).toBe(true);
        expect(seen.get(id) ?? a.id, `${id} usato in più mari`).toBe(a.id);
        seen.set(id, a.id);
      }
      expect(a.groups.boss.map((b) => ENEMY_BY_ID.get(b)!.tier)).toEqual(['boss']);
      for (const g of a.groups.elite) expect(g.some((id) => ENEMY_BY_ID.get(id)!.tier === 'elite')).toBe(true);
      const normals = [...ids].filter((id) => ENEMY_BY_ID.get(id)!.tier === 'normal');
      expect(normals.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('ogni nemico ha mosse valide, scala di disegno e nemici evocati esistenti', () => {
    for (const e of ENEMIES) {
      expect(CREATURE_SCALE[e.id], e.id).toBeGreaterThan(0);
      for (const m of e.pattern) expect(e.moves[m], `${e.id}.${m}`).toBeDefined();
      if (e.enrage) expect(e.moves[e.enrage]).toBeDefined();
      for (const mv of Object.values(e.moves)) for (const eff of mv.effects) if (eff.kind === 'summon') expect(ENEMY_BY_ID.has(eff.enemyId)).toBe(true);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { AREAS } from '../src/data/areas';
import { BOSS_LINES, storyPages } from '../src/data/story';
import { MAX_TIDE } from '../src/data/tides';
import { emptyPersistentState, parseSave } from '../src/systems/SaveSystem';

describe('Storia (0.12.0)', () => {
  it('ogni boss ha la sua battuta', () => {
    for (const a of AREAS) expect(BOSS_LINES[a.groups.boss[0]]).toBeTruthy();
  });

  it('il finale usa il nome dell\'eroe e cambia dopo l\'ultima Marea', () => {
    const base = storyPages('finale', 'Kai', 0), max = storyPages('finale', 'Kai', MAX_TIDE);
    expect(base).toHaveLength(3);
    expect(base[1].text).toMatch(/^Kai /);
    expect(max[2].text).not.toBe(base[2].text);
    expect(storyPages('intro', 'Kai', 0)).toHaveLength(3);
    expect(storyPages('tide', 'Kai', 3)).toHaveLength(1);
  });

  it('quello già visto resta nel salvataggio; i salvataggi vecchi non l\'hanno visto', () => {
    const s = emptyPersistentState();
    s.seen = { intro: true };
    expect(parseSave(JSON.stringify(s)).seen).toEqual({ intro: true, companionHint: false });
    const old = { ...emptyPersistentState() } as Record<string, unknown>;
    delete old.seen;
    expect(parseSave(JSON.stringify(old)).seen).toEqual({ intro: false, companionHint: false });
  });
});

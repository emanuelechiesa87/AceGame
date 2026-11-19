import { describe, expect, it } from 'vitest';
import { freq, TRACKS } from '../src/systems/Audio';
import { emptyPersistentState, parseSave } from '../src/systems/SaveSystem';
import { buildExport, exportFileName, parseExport } from '../src/systems/SaveTransfer';
import { createRunState } from '../src/state/RunState';

describe('export / import dei salvataggi', () => {
  it('andata e ritorno con run in corso', () => {
    const save = emptyPersistentState();
    save.discoveredFruitIds = ['fruit_ember'];
    save.settings.music = 0.4;
    const run = createRunState('a', 123, new Date(), 'Ema');
    const back = parseExport(buildExport(save, run, '0.6.0'));
    expect(back.save.discoveredFruitIds).toEqual(['fruit_ember']);
    expect(back.save.settings.music).toBe(0.4);
    expect(back.run?.heroName).toBe('Ema');
  });
  it('rifiuta file estranei con un messaggio chiaro', () => {
    expect(() => parseExport('{"a":1}')).toThrow(/AceGame/);
    expect(() => parseExport('non json')).toThrow(/AceGame/);
  });
  it('run danneggiata: si importano solo i progressi', () => {
    const txt = JSON.stringify({ format: 'acegame-save', save: emptyPersistentState(), run: { map: 3 } });
    expect(parseExport(txt).run).toBeNull();
  });
  it('nome del file con la data', () => {
    expect(exportFileName(new Date('2026-11-19T10:00:00Z'))).toBe('acegame-salvataggio-2026-11-19.json');
  });
});

describe('impostazioni', () => {
  it('i salvataggi vecchi ricevono i valori predefiniti', () => {
    const old = { ...emptyPersistentState(), settings: { fastAnimations: true } };
    const s = parseSave(JSON.stringify(old)).settings;
    expect(s).toMatchObject({ fastAnimations: true, music: 0.6, sfx: 0.8, vibration: true, tutorialDone: false });
  });
  it('valori fuori scala vengono corretti', () => {
    const bad = { ...emptyPersistentState(), settings: { music: 7, sfx: 'x', vibration: 1 } };
    const s = parseSave(JSON.stringify(bad)).settings;
    expect(s.music).toBe(1); expect(s.sfx).toBe(0.8); expect(s.vibration).toBe(true);
  });
});

describe('musica', () => {
  it('note valide e linee della stessa lunghezza', () => {
    expect(Math.round(freq('A4'))).toBe(440);
    for (const [name, t] of Object.entries(TRACKS)) {
      expect(t.bass.length, name).toBe(t.lead.length);
      expect(t.lead.length % (t.stepsPerBeat * 4 === 8 ? 8 : 6), name).toBe(0);
      for (const n of [...t.lead, ...t.bass]) if (n !== '.' && n !== '-') expect(() => freq(n), `${name} ${n}`).not.toThrow();
    }
  });
});

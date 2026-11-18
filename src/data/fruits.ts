import type { FruitDef } from '../types/content';

/** Frutti mistici: nomi, effetti e aspetto originali. */
export const FRUITS: FruitDef[] = [
  {
    id: 'fruit_ember', name: 'Bacca Brace', rarity: 'common', element: 'fire', color: '#ff6b3d',
    description: 'Scotta al tatto. Chi la mangia sente il fuoco nei pugni.',
    passive: { atk: 2 }, startsUnlocked: true,
    ability: { id: 'pw_ember', name: 'Pugno Brace', description: 'Danno 140% e brucia per 3 turni.', target: 'enemy', cost: 2,
      effects: [{ kind: 'damage', mult: 1.4 }, { kind: 'status', status: 'burn', turns: 3, value: 4 }] },
  },
  {
    id: 'fruit_frost', name: 'Mela Brina', rarity: 'common', element: 'ice', color: '#5fd3ff',
    description: 'Croccante come il ghiaccio. Rallenta chiunque la guardi.',
    passive: { def: 2 }, startsUnlocked: true,
    ability: { id: 'pw_frost', name: 'Morso di Brina', description: 'Danno 110%, 60% di congelare 1 turno.', target: 'enemy', cost: 2,
      effects: [{ kind: 'damage', mult: 1.1 }, { kind: 'status', status: 'stun', turns: 1, chance: 0.6 }] },
  },
  {
    id: 'fruit_stone', name: 'Fico Granito', rarity: 'common', element: 'stone', color: '#c8a26b',
    description: 'Pesante come un sasso. Ti fa la pelle dura.',
    passive: { maxHp: 10 }, startsUnlocked: true,
    ability: { id: 'pw_stone', name: 'Guscio di Pietra', description: 'Scudo da 22 a tutta la squadra.', target: 'allAllies', cost: 2,
      effects: [{ kind: 'shield', amount: 22 }] },
  },
  {
    id: 'fruit_storm', name: 'Pesca Tuono', rarity: 'rare', element: 'storm', color: '#ffd94a',
    description: 'Ronza. Se la stringi, fa scintille.',
    passive: { spd: 3 }, startsUnlocked: false,
    ability: { id: 'pw_storm', name: 'Catena Tuono', description: 'Danno 90% a tutti i nemici.', target: 'allEnemies', cost: 3,
      effects: [{ kind: 'damage', mult: 0.9 }] },
  },
  {
    id: 'fruit_life', name: 'Lampone Linfa', rarity: 'rare', element: 'life', color: '#6fe08a',
    description: 'Profuma di bosco dopo la pioggia.',
    passive: { maxHp: 6 }, startsUnlocked: false,
    ability: { id: 'pw_life', name: 'Rugiada Viva', description: 'Cura il 28% degli HP a tutta la squadra.', target: 'allAllies', cost: 3,
      effects: [{ kind: 'heal', pctMaxHp: 0.28 }] },
  },
  {
    id: 'fruit_shadow', name: 'Susina d\'Ombra', rarity: 'epic', element: 'shadow', color: '#9b6bff',
    description: 'Non fa ombra. Nessuno sa perché.',
    passive: { atk: 3 }, startsUnlocked: false,
    ability: { id: 'pw_shadow', name: 'Taglio d\'Ombra', description: 'Danno 220% e rende vulnerabile per 2 turni.', target: 'enemy', cost: 4,
      effects: [{ kind: 'damage', mult: 2.2 }, { kind: 'status', status: 'vulnerable', turns: 2 }] },
  },
  {
    id: 'fruit_spring', name: 'Gelso Molla', rarity: 'common', element: 'elastic', color: '#ff7fb0',
    description: 'Rimbalza se lo lasci cadere. Anche chi lo mangia.',
    passive: { spd: 2 }, startsUnlocked: true,
    ability: { id: 'pw_spring', name: 'Raffica Molleggiata', description: '4 colpi rapidi da 45% ciascuno.', target: 'enemy', cost: 2,
      effects: [{ kind: 'damage', mult: 0.45, hits: 4 }] },
  },
  {
    id: 'fruit_mist', name: 'Nespola Nebbia', rarity: 'rare', element: 'mist', color: '#c9d6e8',
    description: 'Si sbuccia da sola e si dissolve in vapore.',
    passive: { spd: 1, def: 1 }, startsUnlocked: false,
    ability: { id: 'pw_mist', name: 'Corpo di Nebbia', description: 'Per 2 turni schivi il 60% dei colpi.', target: 'self', cost: 2,
      effects: [{ kind: 'status', status: 'evade', turns: 2, value: 0.6 }] },
  },
  {
    id: 'fruit_fang', name: 'Cocco Zanna', rarity: 'rare', element: 'beast', color: '#b07b4a',
    description: 'Ha il pelo. E ringhia, se lo scuoti.',
    passive: { maxHp: 8 }, startsUnlocked: false,
    ability: { id: 'pw_fang', name: 'Risveglio Bestiale', description: 'Per 3 turni: +50% ATT e +50% DIF.', target: 'self', cost: 3,
      effects: [{ kind: 'status', status: 'atkUp', turns: 3, value: 0.5 }, { kind: 'status', status: 'defUp', turns: 3, value: 0.5 }] },
  },
  {
    id: 'fruit_glue', name: 'Kiwi Colla', rarity: 'common', element: 'glue', color: '#a8d84a',
    description: 'Appiccica tutto. Soprattutto le dita.',
    passive: { def: 1, maxHp: 4 }, startsUnlocked: false,
    ability: { id: 'pw_glue', name: 'Rete Appiccicosa', description: 'Tutti i nemici: -50% VEL e vulnerabili per 2 turni.', target: 'allEnemies', cost: 2,
      effects: [{ kind: 'status', status: 'slow', turns: 2, value: 0.5 }, { kind: 'status', status: 'vulnerable', turns: 2 }] },
  },
  {
    id: 'fruit_mirror', name: 'Prugna Specchio', rarity: 'rare', element: 'mirror', color: '#9fe8ff',
    description: 'Lucida come vetro. Ci vedi la tua faccia stupita.',
    passive: { def: 2 }, startsUnlocked: false,
    ability: { id: 'pw_mirror', name: 'Specchio Riflesso', description: 'Per 2 turni chi ti colpisce subisce il 70% del danno.', target: 'self', cost: 2,
      effects: [{ kind: 'status', status: 'reflect', turns: 2, value: 0.7 }] },
  },
  {
    id: 'fruit_clock', name: 'Ananas Orologio', rarity: 'epic', element: 'time', color: '#ffcf3a',
    description: 'Ticchetta. Nessuno ha il coraggio di aprirlo.',
    passive: { spd: 2 }, startsUnlocked: false,
    ability: { id: 'pw_clock', name: 'Secondo Rintocco', description: 'Danno 80% e agisci subito di nuovo.', target: 'enemy', cost: 3,
      effects: [{ kind: 'damage', mult: 0.8 }, { kind: 'extraAction' }] },
  },
  {
    id: 'fruit_magnet', name: 'Melagrana Magnete', rarity: 'common', element: 'magnet', color: '#e4342f',
    description: 'Le posate le volano addosso. Sempre.',
    passive: { atk: 1, def: 1 }, startsUnlocked: false,
    ability: { id: 'pw_magnet', name: 'Strappo Magnetico', description: 'Ruba lo scudo al bersaglio e colpisce al 100%.', target: 'enemy', cost: 2,
      effects: [{ kind: 'stealShield' }, { kind: 'damage', mult: 1 }] },
  },
];

export const FRUIT_BY_ID = new Map(FRUITS.map((f) => [f.id, f]));

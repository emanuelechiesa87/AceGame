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
];

export const FRUIT_BY_ID = new Map(FRUITS.map((f) => [f.id, f]));

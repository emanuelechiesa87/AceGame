import type { Ability, EnemyDef } from '../types/content';

const atk = (mult: number, name = 'Attacco'): Ability => ({ id: `atk_${mult}`, name, description: '', target: 'enemy', intent: mult > 1.2 ? 'heavy' : 'attack', effects: [{ kind: 'damage', mult }] });

export const ENEMIES: EnemyDef[] = [
  {
    id: 'en_jelly', name: 'Medusa Molla', tier: 'normal', stats: { maxHp: 30, atk: 7, def: 1, spd: 6 },
    pattern: ['bounce', 'bounce', 'harden'],
    moves: {
      bounce: atk(1, 'Pizzicotto'),
      harden: { id: 'harden', name: 'Gonfiata', description: '', target: 'self', intent: 'defend', effects: [{ kind: 'shield', amount: 10 }] },
    },
  },
  {
    id: 'en_bat', name: 'Gabbiano Predone', tier: 'normal', stats: { maxHp: 24, atk: 7, def: 0, spd: 14 },
    pattern: ['bite', 'bite', 'drain'],
    moves: {
      bite: atk(1, 'Beccata'),
      drain: { id: 'drain', name: 'Furto di Patatine', description: '', target: 'enemy', intent: 'attack', effects: [{ kind: 'damage', mult: 0.9, lifesteal: 1 }] },
    },
  },
  {
    id: 'en_shroom', name: 'Granchio Ladro', tier: 'normal', stats: { maxHp: 42, atk: 9, def: 3, spd: 8 },
    pattern: ['slap', 'spores', 'slap'],
    moves: {
      slap: atk(1, 'Chelata'),
      spores: { id: 'spores', name: 'Schizzo d\'Inchiostro', description: '', target: 'enemy', intent: 'debuff', effects: [{ kind: 'status', status: 'poison', turns: 3, value: 3 }] },
    },
  },
  {
    id: 'en_shroom_boss', name: 'Granchio Capitano', tier: 'elite', stats: { maxHp: 100, atk: 12, def: 5, spd: 9 },
    pattern: ['smash', 'cloud', 'slap', 'guard'],
    moves: {
      smash: atk(1.6, 'Chela Gigante'),
      slap: atk(1, 'Chelata'),
      cloud: { id: 'cloud', name: 'Nube Salmastra', description: '', target: 'allEnemies', intent: 'debuff', effects: [{ kind: 'status', status: 'poison', turns: 2, value: 3 }] },
      guard: { id: 'guard_e', name: 'Corazza', description: '', target: 'self', intent: 'defend', effects: [{ kind: 'shield', amount: 18 }] },
    },
  },
  {
    id: 'en_pudding_king', name: 'Capitan Pancia-Palla', tier: 'boss', stats: { maxHp: 200, atk: 11, def: 4, spd: 7 },
    pattern: ['slam', 'wave', 'harden', 'crush', 'wave'],
    enrage: 'royal_call',
    moves: {
      slam: atk(1, 'Panciata'),
      crush: atk(1.7, 'Aculeo Reale'),
      wave: { id: 'wave', name: 'Onda Anomala', description: '', target: 'allEnemies', intent: 'attack', effects: [{ kind: 'damage', mult: 0.75 }] },
      harden: { id: 'harden_k', name: 'Gonfiamento', description: '', target: 'self', intent: 'defend', effects: [{ kind: 'shield', amount: 25 }] },
      royal_call: { id: 'royal_call', name: 'Ciurma, a me!', description: '', target: 'self', intent: 'special', effects: [{ kind: 'summon', enemyId: 'en_jelly', maxEnemies: 3 }, { kind: 'status', status: 'atkUp', turns: 99, value: 0.25 }] },
    },
  },
];

export const ENEMY_BY_ID = new Map(ENEMIES.map((e) => [e.id, e]));

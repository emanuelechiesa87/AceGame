import type { Ability, Effect, EnemyDef, StatusId } from '../types/content';

const atk = (mult: number, name = 'Attacco'): Ability => ({ id: `atk_${mult}`, name, description: '', target: 'enemy', intent: mult > 1.2 ? 'heavy' : 'attack', effects: [{ kind: 'damage', mult }] });


type Target = Ability['target'];
const mv = (id: string, name: string, target: Target, intent: NonNullable<Ability['intent']>, effects: Ability['effects']): Ability => ({ id, name, description: '', target, intent, effects });
const st = (status: StatusId, turns: number, value?: number, chance?: number): Effect => ({ kind: 'status', status, turns, value, chance });

export const ENEMIES: EnemyDef[] = [
  // ===== Mare 1 · Porto delle Gemme =====================================================
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
  // ===== Mare 2 · Scogliera dei Coralli =================================================
  {
    id: 'en_urchin', name: 'Riccio Rotolante', tier: 'normal', stats: { maxHp: 36, atk: 7, def: 4, spd: 7 },
    pattern: ['curl', 'roll', 'poke'],
    moves: {
      curl: mv('curl', 'Palla di Aculei', 'self', 'defend', [{ kind: 'shield', amount: 12 }, st('reflect', 2, 0.3)]),
      roll: atk(1.4, 'Rotolata'),
      poke: atk(1, 'Punzecchiata'),
    },
  },
  {
    id: 'en_puffer_horn', name: 'Pesce Palla Trombettiere', tier: 'normal', stats: { maxHp: 30, atk: 6, def: 1, spd: 10 },
    pattern: ['toot', 'slap', 'slap'],
    moves: {
      toot: mv('toot', 'Squillo di Carica', 'allAllies', 'special', [st('atkUp', 2, 0.3)]),
      slap: atk(1, 'Pinnata'),
    },
  },
  {
    id: 'en_coral', name: 'Corallo Pungente', tier: 'normal', stats: { maxHp: 44, atk: 7, def: 5, spd: 4 },
    pattern: ['sting', 'sting', 'spray'],
    moves: {
      sting: mv('coral_sting', 'Puntura', 'enemy', 'attack', [{ kind: 'damage', mult: 0.8 }, st('poison', 3, 3)]),
      spray: mv('coral_spray', 'Pioggia di Spore', 'allEnemies', 'debuff', [st('poison', 2, 3)]),
    },
  },
  {
    id: 'en_hermit', name: 'Paguro Svuota-Tasche', tier: 'normal', stats: { maxHp: 34, atk: 8, def: 3, spd: 12 },
    pattern: ['snatch', 'pinch', 'hide'],
    moves: {
      snatch: mv('snatch', 'Mano Lesta', 'enemy', 'attack', [{ kind: 'stealShield' }, { kind: 'damage', mult: 1 }]),
      pinch: atk(1, 'Pizzico'),
      hide: mv('hide', 'Dentro la Conchiglia', 'self', 'defend', [{ kind: 'shield', amount: 14 }]),
    },
  },
  {
    id: 'en_moray', name: 'Murena a Due Teste', tier: 'elite', stats: { maxHp: 110, atk: 11, def: 4, spd: 13 },
    pattern: ['double', 'lunge', 'coil', 'double'],
    moves: {
      double: mv('double', 'Doppio Morso', 'enemy', 'attack', [{ kind: 'damage', mult: 0.75, hits: 2 }]),
      lunge: atk(1.6, 'Guizzo dalla Tana'),
      coil: mv('coil', 'Spire', 'self', 'defend', [{ kind: 'shield', amount: 16 }, st('defUp', 2, 0.5)]),
    },
  },
  {
    id: 'en_anemone_queen', name: 'Regina Anemone', tier: 'boss', stats: { maxHp: 230, atk: 12, def: 5, spd: 8 },
    pattern: ['lash', 'sting', 'bloom', 'lash', 'crush'],
    enrage: 'royal_bloom',
    moves: {
      lash: mv('lash', 'Frustata di Tentacoli', 'allEnemies', 'attack', [{ kind: 'damage', mult: 0.7 }]),
      sting: mv('queen_sting', 'Bacio Urticante', 'enemy', 'debuff', [{ kind: 'damage', mult: 1.1 }, st('stun', 1, undefined, 0.5)]),
      bloom: mv('bloom', 'Corona Chiusa', 'self', 'defend', [{ kind: 'shield', amount: 28 }]),
      crush: atk(1.7, 'Abbraccio Reale'),
      royal_bloom: mv('royal_bloom', 'Fioritura Reale', 'self', 'special', [{ kind: 'heal', pctMaxHp: 0.2 }, { kind: 'summon', enemyId: 'en_puffer_horn', maxEnemies: 3 }, st('atkUp', 99, 0.2)]),
    },
  },
  // ===== Mare 3 · Abisso Luminoso =======================================================
  {
    id: 'en_lanternfish', name: 'Lanterna Abissale', tier: 'normal', stats: { maxHp: 34, atk: 7, def: 2, spd: 9 },
    pattern: ['glare', 'bite', 'bite'],
    moves: {
      glare: mv('glare', 'Bagliore Accecante', 'enemy', 'debuff', [{ kind: 'damage', mult: 0.6 }, st('stun', 1, undefined, 0.35)]),
      bite: atk(1.2, 'Morso Abissale'),
    },
  },
  {
    id: 'en_neonjelly', name: 'Medusa Neon', tier: 'normal', stats: { maxHp: 32, atk: 6, def: 1, spd: 11 },
    pattern: ['zap', 'charge', 'zap'],
    moves: {
      zap: mv('zap', 'Scarica Neon', 'allEnemies', 'attack', [{ kind: 'damage', mult: 0.6 }]),
      charge: mv('neon_charge', 'Accumulo', 'self', 'special', [st('atkUp', 2, 0.4)]),
    },
  },
  {
    id: 'en_mimic_squid', name: 'Calamaro Mimo', tier: 'normal', stats: { maxHp: 38, atk: 8, def: 2, spd: 12 },
    pattern: ['ink', 'vanish', 'whip'],
    moves: {
      ink: mv('squid_ink', 'Spruzzo d\'Inchiostro', 'enemy', 'debuff', [{ kind: 'damage', mult: 0.5 }, st('vulnerable', 2)]),
      vanish: mv('vanish', 'Mimetismo', 'self', 'defend', [st('evade', 2, 0.5)]),
      whip: atk(1.3, 'Frustata'),
    },
  },
  {
    id: 'en_gunshrimp', name: 'Gamberone Pistolero', tier: 'normal', stats: { maxHp: 40, atk: 9, def: 3, spd: 8 },
    pattern: ['aim', 'bang', 'reload'],
    moves: {
      aim: mv('aim', 'Prende la Mira', 'self', 'special', [st('atkUp', 1, 0.6)]),
      bang: atk(1.8, 'Schiocco di Chela'),
      reload: mv('reload', 'Ricarica', 'self', 'defend', [{ kind: 'shield', amount: 10 }]),
    },
  },
  {
    id: 'en_archivist', name: 'Polpo Archivista', tier: 'elite', stats: { maxHp: 115, atk: 10, def: 4, spd: 10 },
    pattern: ['eight', 'ink_cloud', 'slam', 'eight'],
    moves: {
      eight: mv('eight', 'Otto Schedari', 'enemy', 'attack', [{ kind: 'damage', mult: 0.35, hits: 6 }]),
      ink_cloud: mv('ink_cloud', 'Nube d\'Inchiostro', 'allEnemies', 'debuff', [st('vulnerable', 2)]),
      slam: atk(1.5, 'Tomo Pesante'),
    },
  },
  {
    id: 'en_abyss_lighthouse', name: 'Faro Abissale', tier: 'boss', stats: { maxHp: 250, atk: 12, def: 4, spd: 7 },
    pattern: ['beam', 'dark', 'chomp', 'beam', 'flash'],
    enrage: 'full_beam',
    moves: {
      beam: mv('beam', 'Raggio del Faro', 'allEnemies', 'attack', [{ kind: 'damage', mult: 0.85 }]),
      dark: mv('dark', 'Luci Spente', 'self', 'defend', [st('evade', 2, 0.6)]),
      chomp: atk(1.5, 'Fauci Abissali'),
      flash: mv('flash', 'Lampo Ipnotico', 'enemy', 'debuff', [{ kind: 'damage', mult: 0.8 }, st('stun', 1, undefined, 0.5)]),
      full_beam: mv('full_beam', 'Luce a Pieno Fascio', 'self', 'special', [{ kind: 'summon', enemyId: 'en_lanternfish', maxEnemies: 3 }, st('atkUp', 99, 0.3)]),
    },
  },
  // ===== Mare 4 · Cimitero delle Navi ===================================================
  {
    id: 'en_anchor', name: 'Ancora Animata', tier: 'normal', stats: { maxHp: 50, atk: 10, def: 6, spd: 3 },
    pattern: ['swing', 'rest', 'swing'],
    moves: {
      swing: atk(1.8, 'Ancorata'),
      rest: mv('anchor_rest', 'Affonda', 'self', 'defend', [{ kind: 'shield', amount: 15 }]),
    },
  },
  {
    id: 'en_barrel', name: 'Barile Finto-Tesoro', tier: 'normal', stats: { maxHp: 30, atk: 8, def: 2, spd: 9 },
    pattern: ['wobble', 'wobble', 'boom'],
    moves: {
      wobble: mv('wobble', 'Ondeggia', 'self', 'defend', [{ kind: 'shield', amount: 8 }]),
      boom: mv('boom', 'Scoppio di Polvere', 'allEnemies', 'heavy', [{ kind: 'damage', mult: 1 }, st('burn', 2, 3)]),
    },
  },
  {
    id: 'en_siren', name: 'Sirena Stonata', tier: 'normal', stats: { maxHp: 34, atk: 7, def: 2, spd: 11 },
    pattern: ['song', 'scratch', 'scratch'],
    moves: {
      song: mv('song', 'Acuto Stonato', 'allEnemies', 'debuff', [st('slow', 2, 0.4), st('vulnerable', 1)]),
      scratch: atk(1.1, 'Graffio di Pinna'),
    },
  },
  {
    id: 'en_ghost_lamp', name: 'Lanterna Fantasma', tier: 'normal', stats: { maxHp: 30, atk: 7, def: 1, spd: 12 },
    pattern: ['flame', 'fade', 'flame'],
    moves: {
      flame: mv('ghost_flame', 'Fiamma Fredda', 'enemy', 'attack', [{ kind: 'damage', mult: 0.8 }, st('burn', 3, 4)]),
      fade: mv('fade', 'Svanisce', 'self', 'defend', [st('evade', 2, 0.5)]),
    },
  },
  {
    id: 'en_figurehead', name: 'Polena Vivente', tier: 'elite', stats: { maxHp: 120, atk: 12, def: 6, spd: 8 },
    pattern: ['ram', 'splinter', 'brace', 'ram'],
    moves: {
      ram: atk(1.7, 'Speronata'),
      splinter: mv('splinter', 'Pioggia di Schegge', 'allEnemies', 'attack', [{ kind: 'damage', mult: 0.7 }]),
      brace: mv('brace', 'Legno Stagionato', 'self', 'defend', [{ kind: 'shield', amount: 25 }, st('reflect', 2, 0.4)]),
    },
  },
  {
    id: 'en_wreck_admiral', name: 'Ammiraglio Relitto', tier: 'boss', stats: { maxHp: 280, atk: 13, def: 6, spd: 6 },
    pattern: ['broadside', 'cannon', 'repair', 'broadside', 'drag'],
    enrage: 'boarding',
    moves: {
      broadside: mv('broadside', 'Bordata', 'allEnemies', 'attack', [{ kind: 'damage', mult: 0.8 }]),
      cannon: atk(1.6, 'Cannone di Prua'),
      repair: mv('repair', 'Rattoppo', 'self', 'defend', [{ kind: 'shield', amount: 30 }]),
      drag: mv('drag', 'Catena dell\'Ancora', 'enemy', 'debuff', [{ kind: 'damage', mult: 1.2 }, st('stun', 1, undefined, 0.4)]),
      boarding: mv('boarding', 'All\'Arrembaggio!', 'self', 'special', [{ kind: 'summon', enemyId: 'en_barrel', maxEnemies: 3 }, st('atkUp', 99, 0.3)]),
    },
  },
];

export const ENEMY_BY_ID = new Map(ENEMIES.map((e) => [e.id, e]));

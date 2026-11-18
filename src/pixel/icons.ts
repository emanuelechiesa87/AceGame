import type Phaser from 'phaser';
import { TEXTURE_SCALE } from '../app/config';
import { iconKey } from './keys';
import { INK, pixelTexture, shade, type Px } from './render';

/**
 * Icone 16×16 in pixel art. Le forme sono scritte senza contorno: il contorno
 * scuro viene aggiunto in automatico attorno a ogni pixel colorato.
 * Texture già ingrandite a 120 px logici (come le vecchie icone vettoriali).
 */
const N = 16;
const ICON_SCALE = (120 * TEXTURE_SCALE) / N;

type Cells = Map<string, string>;

function fromGrid(rows: string[], pal: Record<string, string>, ox = 1, oy = 1): Cells {
  const m: Cells = new Map();
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === '.' || ch === ' ') return;
    const c = pal[ch];
    if (!c) throw new Error(`icona: colore '${ch}' mancante`);
    m.set(`${x + ox},${y + oy}`, c);
  }));
  return m;
}

/** Simmetria orizzontale: si scrive solo la metà sinistra (7 colonne) di una forma larga 14. */
function sym(rows: string[]): string[] {
  return rows.map((r) => { const h = r.padEnd(7, '.').slice(0, 7); return h + [...h].reverse().join(''); });
}

function render(px: Px, cells: Cells): void {
  const pts = [...cells.keys()].map((k) => k.split(',').map(Number) as [number, number]);
  for (const [x, y] of pts) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!cells.has(`${x + dx},${y + dy}`)) px(x + dx, y + dy, INK);
  for (const [x, y] of pts) px(x, y, cells.get(`${x},${y}`)!);
}

function make(scene: Phaser.Scene, key: string, cells: Cells | (() => Cells)): void {
  pixelTexture(scene, key, N, N, (px) => render(px, typeof cells === 'function' ? cells() : cells), ICON_SCALE);
}

// --- Frutti: corpo a forma di frutto + gemma interna + motivo dell'elemento -----------------
type Shape = 'round' | 'tall' | 'drop';
const HALF: Record<Shape, number[]> = {
  // semi-larghezza per riga, dalla riga 4 alla 14 (y)
  round: [3, 5, 6, 6, 6, 6, 6, 6, 5, 4, 2],
  tall: [3, 4, 5, 5, 5, 5, 5, 5, 5, 4, 2],
  drop: [1, 2, 3, 4, 5, 6, 6, 6, 5, 4, 2],
};

function fruit(body: string, gem: string, shape: Shape, top: string[], topPal: Record<string, string>, decor?: (m: Cells) => void): Cells {
  const m: Cells = new Map();
  const dark = shade(body, -0.25), light = shade(body, 0.4);
  HALF[shape].forEach((hw, i) => {
    const y = 4 + i;
    for (let x = 8 - hw; x < 8 + hw; x++) m.set(`${x},${y}`, x >= 8 + hw - 2 || i >= HALF[shape].length - 2 ? dark : body);
  });
  m.set('5,6', light); m.set('5,7', light); m.set('6,6', light);
  decor?.(m);
  // gemma sfaccettata al centro (niente spirali)
  const g = [[7, 8], [8, 8], [6, 9], [7, 9], [8, 9], [9, 9], [6, 10], [7, 10], [8, 10], [9, 10], [7, 11], [8, 11]];
  g.forEach(([x, y]) => m.set(`${x},${y}`, gem));
  m.set('7,9', '#ffffff'); m.set('8,11', shade(gem, -0.3)); m.set('9,10', shade(gem, -0.2));
  // motivo in cima (righe 0-4)
  fromGrid(top, topPal, 0, 0).forEach((c, k) => m.set(k, c));
  return m;
}

const leaf = { G: '#3fb36a', g: '#2b8a3e', B: '#8d5524' };

const FRUITS: Record<string, () => Cells> = {
  fruit_ember: () => fruit('#ff6b3d', '#ffe14a', 'round', ['......Y..Y', '.....YO.YO', '......OYO', '.......B'], { Y: '#ffe14a', O: '#ff9a2a', B: '#8d5524' }),
  fruit_frost: () => fruit('#5fd3ff', '#e8fbff', 'round', ['.......W', '.....W.W.W', '......WWW', '.......W'], { W: '#e8fbff' }, (m) => { m.set('10,6', '#e8fbff'); m.set('11,12', '#e8fbff'); }),
  fruit_stone: () => fruit('#c8a26b', '#ff9a6a', 'tall', ['......SS', '.....SSsS', '......Ss'], { S: '#9a9aaa', s: '#6e6e80' }, (m) => { m.set('4,10', '#9a7a4a'); m.set('11,7', '#9a7a4a'); m.set('10,12', '#9a7a4a'); }),
  fruit_storm: () => fruit('#ffd94a', '#ffffff', 'round', ['........C', '.......C', '......CCC', '.......C'], { C: '#5fd3ff' }),
  fruit_life: () => fruit('#6fe08a', '#ff7fa6', 'round', ['....GG...GG', '.....GGBGG', '.......B'], leaf),
  fruit_spring: () => fruit('#ff7fb0', '#fff1a8', 'drop', ['.......G', '......G', '.......G', '......G'], { G: '#7fe09a' }),
  fruit_mist: () => fruit('#c9d6e8', '#ffffff', 'round', ['....WW...WW', '...WWWW.WWWW', '.......B'], { W: '#f4f8ff', B: '#8d5524' }, (m) => { m.set('4,8', '#eef3fb'); m.set('11,11', '#eef3fb'); }),
  fruit_fang: () => fruit('#b07b4a', '#fff1df', 'round', ['.....W...W', '.....WW.WW', '......BBB'], { W: '#fff7e6', B: '#5f3520' }, (m) => { for (const k of ['4,7', '10,6', '11,9', '5,12', '9,13']) m.set(k, '#7a5230'); }),
  fruit_glue: () => fruit('#a8d84a', '#fff7c2', 'round', ['......GG', '.......B'], leaf, (m) => { m.set('5,15', '#a8d84a'); m.set('10,15', '#a8d84a'); }),
  fruit_mirror: () => fruit('#9fe8ff', '#ffffff', 'drop', ['.......S', '......SSS', '.......S'], { S: '#dfe7f2' }, (m) => { m.set('10,5', '#ffffff'); m.set('11,6', '#ffffff'); m.set('4,12', '#ffffff'); }),
  fruit_clock: () => fruit('#ffcf3a', '#ffffff', 'tall', ['....G.G.G.G', '....GGGGGGG', '.....GGGGG'], { G: '#3fb36a' }, (m) => { for (const k of ['5,6', '10,6', '4,9', '11,9', '5,12', '10,12']) m.set(k, '#e09a12'); }),
  fruit_magnet: () => fruit('#e4342f', '#fff1df', 'round', ['.....S...S', '.....R...R', '.....RR.RR', '......RRR'], { S: '#dfe7f2', R: '#4a4a5a' }),
  fruit_shadow: () => fruit('#9b6bff', '#ff5f8a', 'drop', ['....P...P', '.....P.P', '......PP', '.......B'], { P: '#4a2a8a', B: '#2a1f2e' }),
};

// --- Artefatti -----------------------------------------------------------------------
const ARTIFACTS: Record<string, () => Cells> = {
  art_basalt_core: () => fromGrid([
    '....DDDDDD', '...DGGGGGGD', '..DGGOGGGGGD', '.DGGGOOGGGGGD', '.DGGGGOGGGGGD', '.DGGGGOOOGGGD', '.DGGGGGGOGGGD', '.DGGGOGGOGGGD', '.DGGGOOOGGGGD', '..DGGGGGGGGD', '...DGGGGGGD', '....DDDDDD',
  ], { D: '#3a3550', G: '#5a5670', O: '#ff8a2a' }, 1, 2),
  art_wolf_fang: () => fromGrid([
    '.CCCCCCCCCCC', 'C...........C', '......W', '.....WWW', '.....WWW', '.....WWWW', '......WWW', '......WWW', '.......WW', '.......WS', '........S',
  ], { C: '#8a5232', W: '#fff7e6', S: '#d9c9b0' }, 1, 1),
  art_fate_thread: () => fromGrid(sym([
    '.WWWWWW', '..WWWWW', '...RRRR', '...RrRR', '...RRRR', '...RrRR', '...RRRR', '...RrRR', '...RRRR', '..WWWWW', '.WWWWWW',
  ]).concat(['..........RR', '...........RR', '............R']), { W: '#c8a26b', R: '#e4342f', r: '#a8211e' }, 1, 1),
  art_unstable_prism: () => fromGrid(sym([
    '......W', '.....WW', '.....WC', '....WCC', '....WCC', '...WCCC', '...WCCC', '..WCCCC', '..WCCCC', '.WCCCCC', '.CCCCCC',
  ]).concat(['RROOYYGGBBPP']), { W: '#ffffff', C: '#bdeeff', R: '#ff5f6d', O: '#ff9a2a', Y: '#ffe14a', G: '#6fe08a', B: '#5fa8ff', P: '#b07bff' }, 1, 2),
  art_return_bell: () => fromGrid(sym([
    '......D', '.....DD', '....YYY', '...YYYY', '...YWYY', '...YWYY', '..YYYYY', '..YYYYY', '.YYYYYY', 'DDDDDDD', '......B', '.....BB',
  ]), { D: '#8a5232', Y: '#ffcf3a', W: '#fff3b0', B: '#5f3520' }, 1, 1),
};

// --- Nodi della mappa ----------------------------------------------------------------------
const swords = () => fromGrid([
  'S...........S', '.S.........S', '..S.......S', '...S.....S', '....S...S', '.....S.S', '......S', '.....S.S', '....S...S', '.YY.......YY', '.YBY.....YBY', '..Y.......Y', '.B.........B',
], { S: '#dfe7f2', Y: '#ffcf3a', B: '#8a5232' }, 1, 1);

const NODES: Record<string, () => Cells> = {
  battle: swords,
  elite: () => fromGrid(sym([
    'H.....', 'HH....H', '.HRRRRR', '.RRRRRR', 'RRWWRRR', 'RRWKRRR', 'RRRRRRR', 'RRRRRRR', '.RRKKKK', '.RRKWKW', '..RRRRR', '...RRRR',
  ]), { H: '#ffcf3a', R: '#e4342f', W: '#ffffff', K: INK }, 1, 1),
  chest: () => fromGrid([
    '..BBBBBBBBBB', '.BbbbbbbbbbbB', 'BbbbbbbbbbbbbB', 'BBBBBBYYBBBBBB', 'YYYYYYKKYYYYYY', 'BbbbbbYYbbbbbB', 'BbbbbbbbbbbbbB', 'BbbbbbbbbbbbbB', 'YYYYYYYYYYYYYY', 'BbbbbbbbbbbbbB',
  ], { B: '#6b3a1e', b: '#a9693c', Y: '#ffcf3a', K: INK }, 1, 3),
  rest: () => fromGrid([
    '......Y', '.....YO', '....YOOY', '...YORROY', '...ORRROO', '..OORYRRO', '..ORRYYRO', '...RYYYR', 'BB.......BB', '.BBBB.BBBB', '...BBBBB', '.BBBB.BBBB', 'BB.......BB',
  ], { Y: '#ffe14a', O: '#ff9a2a', R: '#e4342f', B: '#8a5232' }, 1, 1),
  recruit: () => fromGrid(sym([
    '.RRR.', 'RWRRRR', 'RWRRRRR', 'RRRRRRR', 'RRRRRRR', '.RRRRRR', '..RRRRR', '...RRRR', '....RRR', '.....RR', '......R',
  ]), { R: '#ff5f8a', W: '#ffd6e6' }, 1, 2),
  event: () => fromGrid([
    '.PPPPPPPPPPPP', 'PppppKKKKpppP', 'PpppKppppKppP', 'PpppppppKpppP', 'PppppppKppppP', 'PpppppKppppP', 'PpppppKppppP', 'PppppppppppP', 'PpppppKppppP', '.PPPPPPPPPPPP',
  ], { P: '#d9b878', p: '#f1d7a8', K: '#6b3a1e' }, 1, 3),
  boss: () => fromGrid(sym([
    'Y..Y..Y', 'YY.YY.Y', 'YYYYYYY', 'YYYYYYY', 'YYRYYGY', 'YYYYYYY', 'BBBBBBB',
  ]).concat(['..CCC....CCC', '..CCC....CCC']), { Y: '#ffcf3a', R: '#e4342f', G: '#6fe08a', B: '#e09a12', C: '#ffcf3a' }, 1, 3),
};

// --- Intenzioni e stati -------------------------------------------------------------------
const shield = (main: string, plus = false) => () => fromGrid(sym([
  'WWWWWWW', 'WMMMMMM', 'WMMMMMM', 'WMMMMMM', 'WMMMMMM', '.WMMMMM', '.WMMMMM', '..WMMMM', '...WMMM', '....WMM', '.....WM',
].map((r, i) => (plus && i >= 3 && i <= 6 ? r.slice(0, 5) + (i === 3 || i === 6 ? 'MP' : 'PP') : r))), { W: '#ffffff', M: main, P: '#ffffff' }, 1, 2);

const flame = () => fromGrid([
  '.....R', '.....RR', '....RRR..R', '...RROR.RR', '...ROORRRR', '..RROOORRR', '..ROOYOORR', '.RROYYYORR', '.ROOYYYOOR', '.ROYYWYYOR', '..ROYYYOR', '...RRRRR',
], { R: '#e4342f', O: '#ff9a2a', Y: '#ffe14a', W: '#fff7e6' }, 2, 2);

const drop = (c: string) => () => fromGrid(sym([
  '......C', '......C', '.....CC', '.....CC', '....CWC', '...CCWC', '..CCCCC', '..CCCCC', '..CCCCC', '...CCCC', '....CCC',
]), { C: c, W: '#ffffff' }, 1, 2);

const INTENTS: Record<string, () => Cells> = {
  attack: swords,
  heavy: () => { const m = swords(); for (const [x, y] of [[13, 1], [13, 2], [13, 3], [13, 5]]) m.set(`${x},${y}`, '#ff5f6d'); return m; },
  defend: shield('#5fa8ff'),
  debuff: drop('#9be06a'),
  special: () => fromGrid(sym([
    '......Y', '.....YY', '.....YY', 'YYYYYYY', '.YYYYWY', '..YYYYY', '...YYYY', '...YYYY', '..YYY.Y', '..YY...', '.Y.....',
  ]), { Y: '#ffcf3a', W: '#fff3b0' }, 1, 2),
};

const STATUSES: Record<string, () => Cells> = {
  burn: flame,
  poison: drop('#9be06a'),
  stun: () => fromGrid([
    '......I', '..I...I...I', '...I..I..I', '....I.I.I', '.....III', 'IIIIIIIIIIIII', '.....III', '....I.I.I', '...I..I..I', '..I...I...I', '......I',
  ], { I: '#bff4ff' }, 1, 2),
  shield: shield('#5fa8ff'),
  atkUp: () => fromGrid(sym([
    '......R', '.....RR', '....RRR', '...RRRR', '..RRRRR', '.RRRRRR', '....RRR', '....RRR', '....RRR', '....RRR', '....RRR',
  ]), { R: '#ff5f6d' }, 1, 2),
  vulnerable: () => fromGrid(sym([
    '......P', '.....PP', '.....PP', '....PPK', '....PPP', '...PPPK', '...PPPP', '..PPPPP', '..PPPPK', '.PPPPPP', 'PPPPPPP',
  ]), { P: '#9b6bff', K: '#ffffff' }, 1, 2),
  guard: shield('#9cc8ff'),
  evade: () => fromGrid([
    '....WWW', '..WWWWWWW..WW', '.WWWWWWWWWWWWW', 'WWWWWWWWWWWWWW', '.WWWWWWWWWWWW', '...WW...WWW', '', '...WWWWW', '.WWWWWWWWW',
  ], { W: '#e8f0fb' }, 1, 3),
  defUp: shield('#ffcf3a', true),
  slow: () => fromGrid([
    '..GGGGGGGGG', '.GGWGGGGGGGG', 'GGGGGGGGGGGGG', 'GGGGGGGGGGGGGG', '.GGGGGGGGGGGG', '..G..GG..GG', '..G...G...G', '..........G',
  ], { G: '#a8d84a', W: '#f1ffc2' }, 1, 4),
  reflect: () => fromGrid([
    'FFFFFFFFFF', 'FMMMMMMMMF', 'FMWMMMMMMF', 'FMMWMMMMMF', 'FMMMWMMMMF', 'FMWMMWMMMF', 'FMMWMMMMMF', 'FMMMWMMMMF', 'FMMMMMMMMF', 'FMMMMMMMMF', 'FFFFFFFFFF', '....FF', '...FFFF',
  ], { F: '#c8a26b', M: '#9fe8ff', W: '#ffffff' }, 3, 1),
};

const POTION = () => fromGrid(sym([
  '.....BB', '.....BB', '.....GG', '....GWR', '...GWRR', '..GRRRR', '.GRRRRR', '.GRRRRR', '.GRRRRR', '..GRRRR', '...GGGG',
]), { B: '#8a5232', G: '#dff6ff', W: '#ffffff', R: '#ff5f8a' }, 1, 2);

export function makeIconTextures(scene: Phaser.Scene): void {
  const group = (g: Parameters<typeof iconKey>[0], map: Record<string, () => Cells>) => Object.entries(map).forEach(([id, f]) => make(scene, iconKey(g, id), f));
  group('fruit', FRUITS);
  group('artifact', ARTIFACTS);
  group('node', NODES);
  group('intent', INTENTS);
  group('status', STATUSES);
  make(scene, iconKey('misc', 'potion'), POTION);
}

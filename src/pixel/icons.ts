import type Phaser from 'phaser';
import { TEXTURE_SCALE } from '../app/config';
import { iconKey } from './keys';
import { INK, pixelTexture, type Px } from './render';
import { drawFruit, FRUIT_DESIGNS } from './fruitArt';

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
  // dalla 0.5.5: tanfo, acido, bolla, mina, sciame, gemella
  weak: () => fromGrid(sym([
    '...GG..', '..G..G.', '..G....', '...G...', '....RRR', '....RRR', '....RRR', '....RRR', 'RRRRRRR', '.RRRRRR', '..RRRRR', '...RRRR', '....RRR', '.....RR', '......R',
  ]), { G: '#c9c23a', R: '#9b8a5a' }, 1, 0),
  acid: () => fromGrid(sym([
    '......A', '.....AA', '.....AA', '....AWA', '...AAWA', '..AAAAA', '..AAAAA', '...AAAA', '....AAA', '', '.A....A', 'AAA..AA',
  ]), { A: '#d8f04a', W: '#ffffff' }, 1, 2),
  bubble: () => fromGrid(sym([
    '....BBB', '..BB...', '.B.WW..', '.B.W...', 'B......', 'B......', 'B......', 'B......', '.B.....', '.B.....', '..BB...', '....BBB',
  ]), { B: '#ffb45f', W: '#ffffff' }, 1, 2),
  mine: () => fromGrid(sym([
    '......R', '......D', '...GGGG', '..GgGGG', '.GGGgGG', '.GgGGGg', '.GGGgGG', '.GgGGGg', '..GGGgG', '...GGGG',
  ]), { R: '#ff3b30', D: '#3a2414', G: '#3fae4a', g: '#a8e86a' }, 1, 3),
  swarm: () => fromGrid([
    '......S', '.....SS', '..PPP.PPP', '.PWPPPWPPP', '.PPPPPPPPP', '..PPPPPPP', '...PWPPPP', '...PPPPP', '....PPP', '.....P',
  ], { S: '#3fb36a', P: '#8a52e0', W: '#d9b8ff' }, 2, 3),
  twin: () => fromGrid([
    '......SS', '.....S..S', '....S....S', '...S......S', '..RRR....RRR', '.RWRRR..RWRRR', '.RRRRR..RRRRR', '.RRRRR..RRRRR', '..RRR....RRR',
  ], { S: '#3fb36a', R: '#e8264a', W: '#ffffff' }, 1, 3),
};

const POTION = () => fromGrid(sym([
  '.....BB', '.....BB', '.....GG', '....GWR', '...GWRR', '..GRRRR', '.GRRRRR', '.GRRRRR', '.GRRRRR', '..GRRRR', '...GGGG',
]), { B: '#8a5232', G: '#dff6ff', W: '#ffffff', R: '#ff5f8a' }, 1, 2);

export function makeIconTextures(scene: Phaser.Scene): void {
  const group = (g: Parameters<typeof iconKey>[0], map: Record<string, () => Cells>) => Object.entries(map).forEach(([id, f]) => make(scene, iconKey(g, id), f));
  // frutti: icona 32×32 e immagine grande 64×64 per rivelazione e animazioni
  for (const [id, d] of Object.entries(FRUIT_DESIGNS)) {
    pixelTexture(scene, iconKey('fruit', id), 32, 32, (px) => drawFruit(px, d, 32), 8);
    pixelTexture(scene, iconKey('fruitbig', id), 64, 64, (px) => drawFruit(px, d, 64), 4);
  }
  group('artifact', ARTIFACTS);
  group('node', NODES);
  group('intent', INTENTS);
  group('status', STATUSES);
  make(scene, iconKey('misc', 'potion'), POTION);
}

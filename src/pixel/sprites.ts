/**
 * Pixel art originale definita come griglie di caratteri: ogni carattere è un
 * colore della palette, '.' è trasparente. Le parti simmetriche sono scritte a
 * metà e specchiate (mirror), così restano pulite e facili da modificare.
 */
export type Grid = string[];
export type Palette = Record<string, string>;

export function mirror(half: Grid): Grid {
  return half.map((r) => r + [...r].reverse().join(''));
}

/** Sovrascrive pixel (x, y) con il carattere dato: dettagli asimmetrici. */
export function paint(grid: Grid, pixels: [number, number, string][]): Grid {
  const g = grid.map((r) => [...r]);
  for (const [x, y, c] of pixels) if (g[y] && x >= 0 && x < g[y].length) g[y][x] = c;
  return g.map((r) => r.join(''));
}

export function check(name: string, grid: Grid): Grid {
  const w = grid[0].length;
  grid.forEach((r, i) => { if (r.length !== w) throw new Error(`${name}: riga ${i} lunga ${r.length}, attesa ${w}`); });
  return grid;
}

// --- Eroe pirata (24×36) ------------------------------------------------------
export const HERO_PAL: Palette = {
  K: '#1f1633', S: '#ffd9b8', s: '#f0a890', H: '#ff6b3d', h: '#c8402a', R: '#e4342f', r: '#a8211e',
  W: '#fff7e6', I: '#2fa8ff', B: '#2f6fdf', b: '#21499e', V: '#8a5232', v: '#5f3520', Y: '#ffcf3a',
  P: '#3a3550', O: '#6b3a1e', M: '#7a1f2e',
};

const HERO_HEAD = mirror([
  '..........KK',
  '........KKRR',
  '......KKRRRR',
  '.....KRRRRRR',
  '....KRRWRRRR',
  '...KHRRRRRRR',
  '..KHHrrrrrrr',
  '..KHHSSSSSSS',
  '.KHHSSSSSSSS',
  '.KHSSKKKSSSS',
  '.KHSSKWIKSSS',
  '.KHSSKIIKSSS',
  '..KSSSKKSSSS',
  '..KSsSSSSSSS',
  '...KSSSSSKMM',
  '....KSSSSSKW',
  '.....KKSSSSS',
  '......KKKKKK',
]);
const HERO_BODY = mirror([
  '........KSSS',
  '.....KKKWBWB',
  '....KVVWBWBW',
  '...KVVVBWBWB',
  '..KSKVVWBWBW',
  '..KSKVVBWBWB',
  '..KSKYYYYYYY',
  '..KKKYYYYYYY',
  '....KPPPPPPP',
  '....KPPPPPKK',
]);
const LEGS_IDLE = [
  '.....KPPPPK..KPPPPK.....',
  '.....KPPPPK..KPPPPK.....',
  '.....KPPPPK..KPPPPK.....',
  '.....KYYYYK..KYYYYK.....',
  '....KOOOOOK..KOOOOOK....',
  '....KOOOOOOK.KOOOOOOK...',
  '....KKKKKKKK.KKKKKKKK...',
  '........................',
];
const LEGS_STRIDE = [
  '....KPPPPK....KPPPPK....',
  '...KPPPPK......KPPPPK...',
  '..KPPPPK........KPPPPK..',
  '..KYYYYK........KYYYYK..',
  '.KOOOOOK.........KOOOOK.',
  '.KOOOOOOK........KOOOOOK',
  '.KKKKKKKK........KKKKKKK',
  '........................',
];
const LEGS_PASS = [
  '.....KPPPPK..KPPPPK.....',
  '.....KPPPPK...KPPPPK....',
  '.....KPPPPK...KYYYYK....',
  '.....KYYYYK..KOOOOOK....',
  '....KOOOOOK..KOOOOOOK...',
  '....KOOOOOOK.KKKKKKKK...',
  '....KKKKKKKK............',
  '........................',
];

/** Nodo della bandana che sventola a destra (2 varianti per l'animazione). */
function knot(g: Grid, wave: boolean): Grid {
  return paint(g, wave
    ? [[19, 6, 'R'], [20, 6, 'R'], [21, 7, 'R'], [22, 7, 'r'], [21, 6, 'K'], [22, 6, 'K'], [23, 7, 'K'], [22, 8, 'K'], [21, 8, 'K']]
    : [[19, 6, 'R'], [20, 7, 'R'], [21, 8, 'R'], [22, 9, 'r'], [20, 6, 'K'], [21, 7, 'K'], [22, 8, 'K'], [23, 9, 'K'], [21, 9, 'K'], [22, 10, 'K']]);
}

export const HERO_FRAMES: Record<string, Grid> = {
  idle0: check('idle0', knot([...HERO_HEAD, ...HERO_BODY, ...LEGS_IDLE], false)),
  idle1: check('idle1', knot([...HERO_HEAD, ...HERO_BODY, ...LEGS_IDLE], true)),
  walk0: check('walk0', knot([...HERO_HEAD, ...HERO_BODY, ...LEGS_STRIDE], true)),
  walk1: check('walk1', knot([...HERO_HEAD, ...HERO_BODY, ...LEGS_PASS], false)),
  // occhi chiusi per il battito di ciglia
  blink: check('blink', knot(paint([...HERO_HEAD, ...HERO_BODY, ...LEGS_IDLE], [
    [6, 10, 'S'], [7, 10, 'S'], [6, 11, 'K'], [7, 11, 'K'], [16, 10, 'S'], [17, 10, 'S'], [16, 11, 'K'], [17, 11, 'K'],
  ]), false)),
};

// --- Granchio pirata (26×18) ----------------------------------------------------
export const CRAB_PAL: Palette = { K: '#1f1633', R: '#ff5a3d', r: '#c23a26', W: '#fff7e6', I: '#1f1633', M: '#7a1f2e', Y: '#ffcf3a' };
const CRAB = mirror([
  '..KKK........',
  '.KRRRK.......',
  'KRRWRRK......',
  'KRRRRK...KKK.',
  '.KRRK...KWWIK',
  '..KRK...KKKKK',
  '..KRK....KK..',
  '...KRK..KKKKK',
  '....KRKKRRRRR',
  '....KKRRRRRRR',
  '...KRRRRWRRRR',
  '..KRRRRRRRRRR',
  '..KRRKRRRRRRR',
  '..KrrrrrrKMMM',
  '...KrrrrrrKWM',
  '....KKKKKKKKK',
  '....KR.KR..KR',
  '...KR.KR..KR.',
]);
// bandana gialla da pirata sul guscio + sopracciglia arrabbiate
export const CRAB_FRAMES: Record<string, Grid> = {
  idle0: check('crab0', paint(CRAB, [[9, 3, 'K'], [10, 2, 'K'], [16, 2, 'K'], [17, 3, 'K'], [10, 7, 'Y'], [11, 7, 'Y'], [12, 7, 'Y'], [13, 7, 'Y'], [14, 7, 'Y'], [15, 7, 'Y']])),
  idle1: check('crab1', paint(CRAB, [[9, 3, 'K'], [10, 2, 'K'], [16, 2, 'K'], [17, 3, 'K'], [10, 7, 'Y'], [11, 7, 'Y'], [12, 7, 'Y'], [13, 7, 'Y'], [14, 7, 'Y'], [15, 7, 'Y'],
    [0, 2, '.'], [0, 3, '.'], [1, 1, '.'], [25, 2, '.'], [25, 3, '.'], [24, 1, '.'], [1, 2, 'K'], [24, 2, 'K']])),
};

// --- Frutti (16×16): forma comune + gemma interna, motivo diverso per ciascuno ----
const FRUIT_BASE = mirror([
  '........',
  '.....KKK',
  '...KKCCC',
  '..KCWCCC',
  '.KCWCCCC',
  '.KCCCCCK',
  'KCCCCCKG',
  'KCCCCKGG',
  'KCCCCKGG',
  'KdCCCCKG',
  'KddCCCCK',
  '.KddCCCC',
  '.KdddCCC',
  '..KKdddd',
  '....KKKK',
  '........',
]);

export const FRUIT_PIXELS: Record<string, { grid: Grid; pal: Palette; name: string }> = {
  fruit_ember: {
    name: 'Bacca Brace',
    pal: { K: '#1f1633', C: '#ff6b3d', d: '#c8402a', W: '#ffd0a8', G: '#ffe14a', F: '#ffb43a', f: '#ffe14a' },
    grid: check('ember', paint(FRUIT_BASE, [[7, 0, 'F'], [8, 0, 'F'], [8, 1, 'f'], [9, 0, 'K'], [6, 0, 'K'], [7, 1, 'F'], [9, 1, 'K']])),
  },
  fruit_frost: {
    name: 'Mela Brina',
    pal: { K: '#1f1633', C: '#5fd3ff', d: '#2f8fc8', W: '#e8fbff', G: '#ffffff', F: '#e8fbff' },
    grid: check('frost', paint(FRUIT_BASE, [[7, 0, 'F'], [8, 0, 'F'], [6, 1, 'F'], [9, 1, 'F'], [7, 1, 'K'], [8, 1, 'K']])),
  },
  fruit_spring: {
    name: 'Gelso Molla',
    pal: { K: '#1f1633', C: '#ff7fb0', d: '#d94f86', W: '#ffd6e6', G: '#fff1a8', F: '#7fe09a' },
    grid: check('spring', paint(FRUIT_BASE, [[7, 0, 'F'], [8, 0, 'K'], [9, 0, 'F'], [7, 1, 'K'], [8, 1, 'F'], [9, 1, 'K']])),
  },
};

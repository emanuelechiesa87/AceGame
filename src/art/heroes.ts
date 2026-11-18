import { ellipse, OUTLINE, path, spikes, svgDoc } from './svg';

/**
 * Protagonisti in stile gacha "simpatico": testa grande (~3 teste di altezza),
 * contorno spesso, ombre nette a due toni, espressioni esagerate.
 * Tutto originale: nessun riferimento a personaggi esistenti.
 */

export type HeroId = 'm' | 'f';
export type Eyes = 'open' | 'closed' | 'happy' | 'fierce';
export type Mouth = 'grin' | 'shout' | 'smirk' | 'ouch';

interface Palette {
  skin: string; skinShade: string;
  hair: string; hairShade: string; hairLight: string;
  iris: string; irisDark: string;
  top: string; topShade: string;
  accent: string; accentShade: string;
  pants: string; boots: string; bootsShade: string;
}

export const PALETTES: Record<HeroId, Palette> = {
  m: {
    skin: '#ffd9b8', skinShade: '#efb08c',
    hair: '#ff6b3d', hairShade: '#d8402a', hairLight: '#ffb48a',
    iris: '#2fa8ff', irisDark: '#1554c9',
    top: '#2f6fdf', topShade: '#21499e',
    accent: '#ffcf3a', accentShade: '#e09a12',
    pants: '#3a3550', boots: '#8a5232', bootsShade: '#5f3520',
  },
  f: {
    skin: '#ffe0c7', skinShade: '#f1b796',
    hair: '#7a55ff', hairShade: '#4d2fd0', hairLight: '#b9a6ff',
    iris: '#ff9a2e', irisDark: '#c9500e',
    top: '#22b893', topShade: '#167a63',
    accent: '#ff5f8a', accentShade: '#c93a62',
    pants: '#2e3548', boots: '#4a3a66', bootsShade: '#2f2446',
  },
};

// --- Punti di aggancio (pivot) condivisi con il rig in Phaser -----------------
export const PIVOTS = {
  head: { x: 120, y: 178 },      // collo
  armBack: { x: 90, y: 196 },
  armFront: { x: 152, y: 196 },
  legBack: { x: 106, y: 262 },
  legFront: { x: 134, y: 262 },
  scarfTail: { x: 104, y: 186 },
} as const;

const doc = (body: string) => svgDoc(body);

// --- Gambe ----------------------------------------------------------------------
export function leg(id: HeroId, front: boolean): string {
  const p = PALETTES[id];
  const x = front ? 134 : 106;
  const dim = front ? '' : ' opacity="1"';
  const pants = path(`M${x - 13},258 L${x + 13},258 L${x + 11},304 L${x - 11},304 Z`, front ? p.pants : shade(p.pants));
  const boot = path(`M${x - 14},300 L${x + 10},300 Q${x + 12},314 ${x + 26},318 Q${x + 30},332 ${x + 18},334 L${x - 16},334 Q${x - 20},316 ${x - 14},300 Z`, front ? p.boots : p.bootsShade);
  const cuff = path(`M${x - 16},298 L${x + 13},298 L${x + 13},307 L${x - 16},307 Z`, front ? p.accent : p.accentShade, OUTLINE, 4);
  return doc(`<g${dim}>${pants}${boot}${cuff}</g>`);
}

// --- Busto ------------------------------------------------------------------------
export function body(id: HeroId): string {
  const p = PALETTES[id];
  if (id === 'm') {
    const jacket = path('M84,190 Q120,176 156,190 L164,262 Q120,272 76,262 Z', p.top);
    const shadeR = path('M132,186 Q146,188 156,192 L163,260 Q148,265 136,266 Z', p.topShade, null);
    const shirt = path('M108,190 L132,190 L128,262 L112,262 Z', '#f4f1e8');
    const belt = path('M78,250 L162,250 L163,264 L77,264 Z', '#2a2238', OUTLINE, 4);
    const buckle = path('M112,249 L128,249 L128,265 L112,265 Z', p.accent, OUTLINE, 4);
    const scarf = path('M88,186 Q120,204 152,186 Q154,198 146,204 Q120,216 94,204 Q86,198 88,186 Z', p.accent);
    const scarfShade = path('M120,208 Q138,206 146,200 Q144,206 138,208 Q128,212 120,212 Z', p.accentShade, null);
    return doc(jacket + shadeR + shirt + belt + buckle + scarf + scarfShade);
  }
  const coat = path('M82,192 Q120,178 158,192 L170,270 Q120,282 70,270 Z', p.top);
  const shadeR = path('M134,188 Q148,190 158,194 L169,268 Q152,274 138,275 Z', p.topShade, null);
  const zip = path('M120,196 L120,272', 'none', OUTLINE, 4);
  const pocket = path('M90,236 L112,236 L110,256 L92,256 Z', p.topShade, OUTLINE, 4);
  const hood = path('M86,184 Q120,206 154,184 Q160,198 150,206 Q120,220 90,206 Q80,198 86,184 Z', p.accent);
  const hoodShade = path('M120,212 Q140,210 150,202 Q146,210 138,212 Q128,216 120,216 Z', p.accentShade, null);
  const badge = `${ellipse(146, 236, 9, 9, p.accent, OUTLINE, 4)}${path('M146,229 L148,234 L153,235 L149,238 L150,243 L146,240 L142,243 L143,238 L139,235 L144,234 Z', '#fff7d6', null)}`;
  return doc(coat + shadeR + zip + pocket + hood + hoodShade + badge);
}

export function scarfTail(id: HeroId): string {
  const p = PALETTES[id];
  if (id === 'f') return doc(''); // lei ha il cappuccio, non la sciarpa
  return doc(
    path('M104,190 Q84,200 62,196 Q48,206 40,200 Q52,214 66,212 Q88,214 108,202 Z', p.accent) +
    path('M62,196 Q48,206 40,200 Q52,214 66,212 Z', p.accentShade, null),
  );
}

// --- Braccia ----------------------------------------------------------------------
export function arm(id: HeroId, front: boolean): string {
  const p = PALETTES[id];
  const x = front ? 152 : 88;
  const dir = front ? 1 : -1;
  const sleeve = path(`M${x - 11},192 Q${x + 4 * dir},188 ${x + 12},196 L${x + 10 * dir + (front ? 4 : -4)},240 L${x - 8 * dir},242 Z`, front ? p.top : p.topShade);
  const cuffCol = id === 'm' ? p.accent : p.accent;
  const cuff = path(`M${x - 10},236 L${x + 12},234 L${x + 13},246 L${x - 10},248 Z`, front ? cuffCol : p.accentShade, OUTLINE, 4);
  const hand = ellipse(x + 2, 256, 13, 12, front ? p.skin : p.skinShade);
  // lei porta un guanto-tirapugni sul braccio davanti: tocco "action"
  const glove = id === 'f' && front ? ellipse(x + 2, 256, 15, 14, '#3b3456') + path(`M${x - 8},250 L${x + 12},250`, 'none', '#ffcf3a', 3) : '';
  return doc(sleeve + cuff + hand + glove);
}

// --- Testa (viso + capelli) --------------------------------------------------------
const FACE = 'M64,104 C62,52 178,52 176,104 C176,146 150,176 120,178 C90,176 64,146 64,104 Z';

export function head(id: HeroId): string {
  const p = PALETTES[id];
  const faceShade = path('M150,80 C174,90 176,110 172,128 C166,152 148,170 126,176 C150,160 162,130 150,80 Z', p.skinShade, null);
  const ears = ellipse(64, 116, 10, 14, p.skin) + ellipse(176, 116, 10, 14, p.skin);
  const face = path(FACE, p.skin);
  const blush = `<ellipse cx="82" cy="142" rx="12" ry="6" fill="#ff7b8a" opacity="0.45"/><ellipse cx="158" cy="142" rx="12" ry="6" fill="#ff7b8a" opacity="0.45"/>`;

  if (id === 'm') {
    const back = path(spikes(120, 92, 54, 104, 150, 390, 9, 10), p.hair) + path(spikes(120, 92, 50, 88, 200, 340, 5, 6), p.hairShade, null);
    const bandage = path('M146,146 L168,138 L172,148 L150,156 Z', '#fff1df', OUTLINE, 3) + path('M156,143 L159,152 M161,141 L164,150', 'none', '#e8bfa0', 2);
    const bangs = path(
      'M62,92 Q70,46 120,40 Q172,44 180,96 L168,84 L170,110 L152,82 L146,104 L132,78 L122,100 L110,76 L98,102 L92,78 L76,104 L76,84 Z',
      p.hair,
    );
    const shine = path('M92,58 Q110,48 128,50 Q112,56 100,66 Z', p.hairLight, null);
    const headband = path('M60,86 Q120,62 180,86 L180,98 Q120,76 60,98 Z', '#e4342f', OUTLINE, 4) + path('M60,92 L40,84 L44,100 L30,104 L52,108 L62,98 Z', '#e4342f', OUTLINE, 4);
    return doc(back + ears + face + faceShade + blush + bandage + bangs + shine + headband);
  }
  // lei: caschetto a ciocche, ahoge ribelle, occhialoni sulla fronte
  const back = path('M56,110 Q48,40 120,34 Q192,40 184,110 Q190,150 176,170 L160,150 Q150,168 138,160 L120,120 L102,160 Q90,168 80,150 L64,170 Q50,150 56,110 Z', p.hair) +
    path('M150,60 Q186,80 180,140 L170,156 Q174,110 150,60 Z', p.hairShade, null);
  const ahoge = path('M118,38 Q104,6 128,8 Q146,10 136,24 Q130,30 124,26', 'none', OUTLINE, 9) + path('M118,38 Q104,6 128,8 Q146,10 136,24 Q130,30 124,26', 'none', p.hair, 5);
  const bangs = path('M60,104 Q60,50 120,46 Q182,50 180,104 L166,90 L164,118 L148,92 L138,112 L126,90 L114,114 L104,90 L92,112 L84,92 L74,116 Z', p.hair);
  const shine = path('M96,58 Q116,50 136,54 Q116,60 104,68 Z', p.hairLight, null);
  const goggles = path('M58,84 Q120,62 182,84 L182,94 Q120,74 58,94 Z', '#3b3456', OUTLINE, 4) +
    ellipse(98, 76, 17, 14, '#ffb43a') + ellipse(98, 76, 9, 7, '#fff0c2', null) +
    ellipse(142, 76, 17, 14, '#ffb43a') + ellipse(142, 76, 9, 7, '#fff0c2', null);
  const clip = path('M164,120 L170,108 L176,120 L188,122 L178,130 L180,142 L170,136 L160,142 L162,130 L152,122 Z', '#ffe14a', OUTLINE, 3);
  return doc(back + ahoge + ears + face + faceShade + blush + bangs + shine + goggles + clip);
}

// --- Occhi ------------------------------------------------------------------------
function anime_eye(cx: number, cy: number, p: Palette, flip: boolean, fierce: boolean): string {
  const tilt = fierce ? (flip ? -12 : 12) : 0;
  const white = path(`M${cx - 15},${cy - 4 + tilt / 2} Q${cx},${cy - 22} ${cx + 15},${cy - 4 - tilt / 2} Q${cx + 16},${cy + 18} ${cx},${cy + 19} Q${cx - 16},${cy + 18} ${cx - 15},${cy - 4 + tilt / 2} Z`, '#ffffff', OUTLINE, 4);
  const iris = ellipse(cx + (flip ? -1 : 1), cy + 4, 10, 13, p.iris, null) + `<ellipse cx="${cx + (flip ? -1 : 1)}" cy="${cy + 9}" rx="9" ry="7" fill="${p.irisDark}"/>`;
  const pupil = ellipse(cx + (flip ? -1 : 1), cy + 5, 5, 7, OUTLINE, null);
  const shine = ellipse(cx + 4, cy - 2, 4, 5, '#ffffff', null) + ellipse(cx - 4, cy + 11, 2, 2, '#ffffff', null);
  const lash = path(`M${cx - 17},${cy - 3 + tilt / 2} Q${cx},${cy - 25} ${cx + 17},${cy - 3 - tilt / 2}`, 'none', OUTLINE, 6);
  const lid = fierce ? path(`M${cx - 17},${cy - 3 + tilt / 2} L${cx + 17},${cy - 3 - tilt / 2} L${cx + 17},${cy - 24} L${cx - 17},${cy - 24} Z`, 'none', null) + path(`M${cx - 17},${cy + 2 + tilt / 2} L${cx + 17},${cy + 2 - tilt / 2}`, 'none', OUTLINE, 7) : '';
  return white + iris + pupil + shine + lash + lid;
}

export function eyes(id: HeroId, kind: Eyes): string {
  const p = PALETTES[id];
  const lx = 96, rx = 144, y = 120;
  // sopracciglia: spesse e molto espressive, sono metà della comicità
  const browsUp = path(`M${lx - 15},${y - 22} Q${lx},${y - 32} ${lx + 13},${y - 24}`, 'none', OUTLINE, 6) + path(`M${rx - 13},${y - 24} Q${rx},${y - 32} ${rx + 15},${y - 22}`, 'none', OUTLINE, 6);
  const browsAngry = path(`M${lx - 17},${y - 32} L${lx + 14},${y - 18}`, 'none', OUTLINE, 8) + path(`M${rx - 14},${y - 18} L${rx + 17},${y - 32}`, 'none', OUTLINE, 8);
  const browsSmug = path(`M${lx - 15},${y - 21} Q${lx},${y - 26} ${lx + 13},${y - 21}`, 'none', OUTLINE, 6) + path(`M${rx - 13},${y - 26} Q${rx},${y - 38} ${rx + 15},${y - 30}`, 'none', OUTLINE, 6);

  switch (kind) {
    case 'closed':
      return doc(path(`M${lx - 15},${y + 2} Q${lx},${y + 10} ${lx + 15},${y + 2}`, 'none', OUTLINE, 5) + path(`M${rx - 15},${y + 2} Q${rx},${y + 10} ${rx + 15},${y + 2}`, 'none', OUTLINE, 5) + browsUp);
    case 'happy':
      return doc(path(`M${lx - 15},${y + 6} Q${lx},${y - 14} ${lx + 15},${y + 6}`, 'none', OUTLINE, 6) + path(`M${rx - 15},${y + 6} Q${rx},${y - 14} ${rx + 15},${y + 6}`, 'none', OUTLINE, 6) + browsUp);
    case 'fierce':
      return doc(anime_eye(lx, y, p, false, true) + anime_eye(rx, y, p, true, true) + browsAngry);
    default:
      return doc(anime_eye(lx, y, p, false, false) + anime_eye(rx, y, p, true, false) + (id === 'f' ? browsSmug : browsUp));
  }
}

// --- Bocca ------------------------------------------------------------------------
export function mouth(_id: HeroId, kind: Mouth): string {
  const cx = 120, y = 152;
  switch (kind) {
    case 'shout':
      return doc(path(`M${cx - 16},${y - 6} Q${cx},${y - 10} ${cx + 16},${y - 6} Q${cx + 14},${y + 22} ${cx},${y + 22} Q${cx - 14},${y + 22} ${cx - 16},${y - 6} Z`, '#7a1f2e', OUTLINE, 4) + path(`M${cx - 8},${y + 16} Q${cx},${y + 10} ${cx + 8},${y + 16} Q${cx},${y + 21} ${cx - 8},${y + 16} Z`, '#ff6f7d', null));
    case 'smirk':
      return doc(path(`M${cx - 12},${y + 2} Q${cx + 2},${y + 8} ${cx + 16},${y - 6}`, 'none', OUTLINE, 5) + path(`M${cx + 8},${y + 1} L${cx + 11},${y + 8} L${cx + 14},${y}`, '#ffffff', OUTLINE, 2));
    case 'ouch':
      return doc(path(`M${cx - 14},${y + 6} L${cx - 7},${y} L${cx},${y + 6} L${cx + 7},${y} L${cx + 14},${y + 6}`, 'none', OUTLINE, 5));
    default: // grin con zanna: il marchio "simpatico" del protagonista
      return doc(path(`M${cx - 20},${y - 6} Q${cx},${y - 2} ${cx + 20},${y - 6} Q${cx + 16},${y + 16} ${cx},${y + 16} Q${cx - 16},${y + 16} ${cx - 20},${y - 6} Z`, '#7a1f2e', OUTLINE, 4) +
        path(`M${cx - 17},${y - 4} Q${cx},${y} ${cx + 17},${y - 4} L${cx + 15},${y + 2} Q${cx},${y + 5} ${cx - 15},${y + 2} Z`, '#ffffff', null) +
        path(`M${cx + 6},${y + 1} L${cx + 10},${y + 9} L${cx + 13},${y}`, '#ffffff', OUTLINE, 2) +
        path(`M${cx - 8},${y + 12} Q${cx},${y + 6} ${cx + 8},${y + 12} Q${cx},${y + 15} ${cx - 8},${y + 12} Z`, '#ff6f7d', null));
  }
}

function shade(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(v * 0.78).toString(16).padStart(2, '0');
  return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`;
}

/** Composizione statica completa (per anteprime e icone). */
export function fullHero(id: HeroId, e: Eyes = 'open', m: Mouth = id === 'm' ? 'grin' : 'smirk'): string {
  const inner = (s: string) => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return svgDoc([scarfTail(id), leg(id, false), arm(id, false), leg(id, true), body(id), head(id), eyes(id, e), mouth(id, m), arm(id, true)].map(inner).join(''));
}

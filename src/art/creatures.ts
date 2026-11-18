import { ellipse, OUTLINE, path, svgDoc } from './svg';

/**
 * Nemici e compagni. Ogni creatura è un'unica immagine con i piedi al centro
 * del bordo inferiore; l'animazione (rimbalzo, colpo, KO) è fatta dal codice.
 * Ogni definizione ha anche una variante "ouch" per quando viene colpita.
 */
export interface CreatureArt { w: number; h: number; normal: string; hit: string }

const eyesPair = (lx: number, rx: number, y: number, r: number, angry: boolean, iris = OUTLINE) => {
  const one = (x: number, flip: boolean) =>
    ellipse(x, y, r, r * 1.15, '#fff', OUTLINE, 4) + ellipse(x + (flip ? -2 : 2), y + 2, r * 0.6, r * 0.75, iris, null) +
    ellipse(x + (flip ? -1 : 3), y - r * 0.3, r * 0.25, r * 0.28, '#fff', null);
  const brows = angry
    ? path(`M${lx - r - 2},${y - r - 10} L${lx + r},${y - r + 2}`, 'none', OUTLINE, 6) + path(`M${rx - r},${y - r + 2} L${rx + r + 2},${y - r - 10}`, 'none', OUTLINE, 6)
    : '';
  return one(lx, false) + one(rx, true) + brows;
};
const xEyes = (lx: number, rx: number, y: number, r: number) =>
  [lx, rx].map((x) => path(`M${x - r},${y - r} L${x + r},${y + r} M${x + r},${y - r} L${x - r},${y + r}`, 'none', OUTLINE, 6)).join('');

// --- Gelatina -------------------------------------------------------------------
function jelly(hit: boolean, body = '#6fe08a', shade = '#3fb36a', light = '#c8ffd2'): string {
  const w = 200, h = 170;
  const blob = path('M24,160 Q8,160 14,130 Q24,40 100,34 Q176,40 186,130 Q192,160 176,160 Z', body);
  const sh = path('M140,52 Q182,80 184,134 Q186,156 172,158 Q168,96 140,52 Z', shade, null);
  const shine = ellipse(64, 70, 16, 24, light, null) + ellipse(88, 54, 6, 7, light, null);
  const leaf = path('M100,36 Q96,12 116,6 Q120,26 100,36 Z', '#3a9a4e') + path('M100,36 L108,16', 'none', OUTLINE, 3);
  const face = hit ? xEyes(72, 128, 100, 12) + path('M86,132 Q100,122 114,132', 'none', OUTLINE, 5)
    : eyesPair(74, 128, 98, 14, true) + path('M84,128 Q100,140 116,126', 'none', OUTLINE, 5) + path('M108,130 L112,138 L116,128', '#fff', OUTLINE, 2);
  return svgDoc(blob + sh + shine + leaf + face, w, h);
}

// --- Pipistrillo -------------------------------------------------------------------
function bat(hit: boolean): string {
  const w = 240, h = 190;
  const wingL = path('M92,90 Q40,40 6,70 Q26,78 22,96 Q40,92 44,112 Q60,100 72,118 Q84,104 96,112 Z', '#5b3a86');
  const wingR = path('M148,90 Q200,40 234,70 Q214,78 218,96 Q200,92 196,112 Q180,100 168,118 Q156,104 144,112 Z', '#5b3a86');
  const membrane = path('M90,96 Q52,70 26,78', 'none', '#7a55b0', 4) + path('M150,96 Q188,70 214,78', 'none', '#7a55b0', 4);
  const ears = path('M88,62 L80,18 L110,50 Z', '#7a55b0') + path('M152,62 L160,18 L130,50 Z', '#7a55b0') + path('M88,54 L86,32 L100,48 Z', '#ff9ab0', null) + path('M152,54 L154,32 L140,48 Z', '#ff9ab0', null);
  const body = ellipse(120, 98, 50, 46, '#7a55b0') + path('M150,66 Q172,96 158,130 Q150,104 150,66 Z', '#5b3a86', null) + ellipse(120, 120, 26, 20, '#c9b2f0', null);
  const feet = path('M104,140 L100,160 M136,140 L140,160', 'none', OUTLINE, 6);
  const face = hit ? xEyes(102, 138, 92, 10) + path('M110,118 L130,118', 'none', OUTLINE, 5)
    : eyesPair(102, 138, 90, 12, true, '#ff3b5c') + path('M108,114 Q120,122 132,114', 'none', OUTLINE, 5) + path('M112,116 L115,126 L118,117 M122,117 L125,126 L128,116', '#fff', OUTLINE, 2);
  return svgDoc(wingL + wingR + membrane + ears + body + feet + face, w, h);
}

// --- Fungotto (e Capo) ---------------------------------------------------------------
function shroom(hit: boolean, boss: boolean): string {
  const w = 220, h = 230;
  const cap = boss ? '#8a3fd1' : '#e4342f', capShade = boss ? '#5d2496' : '#a8211e', spots = boss ? '#ffd94a' : '#fff1df';
  const stem = path('M64,120 Q60,190 74,206 L146,206 Q160,190 156,120 Z', '#fff1df') + path('M130,124 Q150,160 144,204 L146,206 Q160,190 156,120 Z', '#e8cdb0', null);
  const feet = ellipse(84, 210, 22, 12, '#8a5232') + ellipse(136, 210, 22, 12, '#8a5232');
  const capP = path('M16,124 Q10,40 110,26 Q210,40 204,124 Q180,138 110,136 Q40,138 16,124 Z', cap) + path('M150,40 Q204,62 202,122 Q186,132 160,134 Q190,96 150,40 Z', capShade, null);
  const sp = ellipse(60, 80, 16, 12, spots, null) + ellipse(110, 54, 20, 14, spots, null) + ellipse(160, 84, 14, 11, spots, null) + ellipse(84, 112, 10, 7, spots, null);
  const face = hit ? xEyes(88, 132, 156, 10) + path('M100,186 Q110,178 120,186', 'none', OUTLINE, 5)
    : eyesPair(88, 132, 154, 12, true) + path('M96,182 Q110,192 124,180', 'none', OUTLINE, 5);
  const extra = boss
    ? path('M78,176 Q96,164 110,174 Q124,164 142,176 Q130,186 110,180 Q90,186 78,176 Z', '#6b3a1e') + // baffoni
      path('M60,30 L72,0 L90,22 L110,-4 L130,22 L148,0 L160,30 Z', '#ffd94a').replace('M60,30', 'M64,34') // corona
    : '';
  return svgDoc(stem + feet + capP + sp + face + extra, w, h);
}

// --- Re Budino ------------------------------------------------------------------------
function puddingKing(hit: boolean): string {
  const w = 340, h = 330;
  const cape = path('M40,300 Q30,170 90,140 L250,140 Q310,170 300,300 Z', '#c9283a') + path('M240,146 Q300,180 300,300 L270,300 Q280,200 240,146 Z', '#8f1a2a', null);
  const body = path('M54,306 Q40,300 50,250 L76,120 Q170,96 264,120 L290,250 Q300,300 286,306 Z', '#ffcf6a') + path('M220,112 Q262,118 264,120 L290,250 Q300,300 286,306 L250,306 Q276,200 220,112 Z', '#e8a53a', null);
  const caramel = path('M72,124 Q170,94 268,124 L264,152 Q250,176 240,150 Q226,186 210,152 Q190,172 176,150 Q160,190 140,152 Q124,172 110,150 Q94,180 82,150 Z', '#8a4a1e') + ellipse(140, 116, 30, 8, '#b5682e', null);
  const crown = path('M112,104 L104,46 L136,76 L170,30 L204,76 L236,46 L228,104 Z', '#ffd94a') + ellipse(170, 66, 9, 9, '#ff5f8a', OUTLINE, 3) + ellipse(122, 86, 6, 6, '#5fd3ff', OUTLINE, 3) + ellipse(218, 86, 6, 6, '#6fe08a', OUTLINE, 3);
  const shine = ellipse(96, 210, 14, 30, '#fff3c4', null);
  const face = hit ? xEyes(136, 204, 210, 14) + path('M150,262 Q170,248 190,262', 'none', OUTLINE, 6)
    : eyesPair(136, 204, 208, 17, true) + path('M140,256 Q170,276 200,252', 'none', OUTLINE, 6) + path('M186,258 L190,268 L195,256', '#fff', OUTLINE, 2) +
      path('M118,246 Q132,240 140,246', 'none', '#e8a53a', 4);
  return svgDoc(cape + body + caramel + crown + shine + face, w, h);
}

// --- Compagni ---------------------------------------------------------------------
function bobo(hit: boolean): string {
  const w = 220, h = 230;
  const ears = ellipse(62, 70, 18, 18, '#9a8a7a') + ellipse(146, 70, 18, 18, '#9a8a7a') + ellipse(62, 70, 8, 8, '#d9b8a0', null) + ellipse(146, 70, 8, 8, '#d9b8a0', null);
  const body = ellipse(104, 170, 62, 52, '#9a8a7a') + ellipse(104, 180, 36, 28, '#d9cfc2', null);
  const head = ellipse(104, 106, 58, 50, '#b0a090') + path('M140,70 Q168,96 158,138 Q148,110 140,70 Z', '#8a7a6a', null);
  const helmet = path('M48,92 Q50,40 104,36 Q158,40 160,92 Q104,78 48,92 Z', '#8a5232') + path('M60,80 L148,80', 'none', '#6b3a1e', 4) + path('M104,36 L104,22', 'none', OUTLINE, 6);
  const snout = ellipse(104, 126, 20, 14, '#e8dccb') + ellipse(104, 120, 7, 5, OUTLINE, null);
  const face = hit ? xEyes(80, 128, 104, 8) : eyesPair(80, 128, 104, 9, false) + path('M96,134 Q104,140 112,134', 'none', OUTLINE, 4);
  const shield = ellipse(170, 172, 34, 40, '#c08a4a') + path('M140,150 Q170,120 200,150 Q170,140 140,150 Z', '#8a5232') + ellipse(170, 182, 14, 16, '#e0aa6a', null);
  const feet = ellipse(78, 218, 22, 12, '#8a7a6a') + ellipse(130, 218, 22, 12, '#8a7a6a');
  return svgDoc(feet + body + ears + head + helmet + snout + face + shield, w, h);
}

function lumi(hit: boolean): string {
  const w = 190, h = 240;
  const flame = path('M95,58 Q70,30 92,4 Q92,26 108,18 Q124,40 95,58 Z', '#ffb43a') + path('M95,52 Q84,36 96,20 Q100,34 106,30 Q110,44 95,52 Z', '#fff2a8', null);
  const top = path('M62,62 L128,62 L124,76 L66,76 Z', '#3b3456');
  const body = path('M50,76 Q30,140 56,196 L134,196 Q160,140 140,76 Z', '#ffe0a0') + path('M110,78 Q150,130 132,194 L134,196 Q160,140 140,76 Z', '#f5b45a', null);
  const ribs = path('M44,110 Q95,120 146,110 M40,150 Q95,160 150,150', 'none', '#e89a3a', 3);
  const bottom = path('M60,196 L130,196 L124,210 L66,210 Z', '#3b3456') + path('M95,210 L95,232', 'none', '#ff5f8a', 5);
  const arms = path('M44,130 Q20,124 16,104', 'none', OUTLINE, 9) + path('M44,130 Q20,124 16,104', 'none', '#ffe0a0', 5) + path('M146,130 Q170,124 174,104', 'none', OUTLINE, 9) + path('M146,130 Q170,124 174,104', 'none', '#ffe0a0', 5);
  const face = hit ? xEyes(76, 114, 128, 8) + path('M88,156 L102,156', 'none', OUTLINE, 4)
    : eyesPair(76, 114, 126, 11, false, '#c9500e') + path('M84,152 Q95,164 106,152 Z', '#7a1f2e', OUTLINE, 3) + `<ellipse cx="64" cy="150" rx="9" ry="5" fill="#ff7b8a" opacity="0.5"/><ellipse cx="126" cy="150" rx="9" ry="5" fill="#ff7b8a" opacity="0.5"/>`;
  const glow = `<circle cx="95" cy="130" r="88" fill="#ffd38a" opacity="0.18"/>`;
  return svgDoc(glow + arms + flame + top + body + ribs + bottom + face, w, h);
}

function zip(hit: boolean): string {
  const w = 240, h = 210;
  const tail = path('M70,150 Q10,150 8,96 Q30,120 52,112 Q30,80 50,60 Q60,110 96,128 Z', '#ff8a3d') + path('M8,96 Q20,108 30,104 Q22,86 30,74 Q14,80 8,96 Z', '#fff1df', null);
  const body = ellipse(122, 150, 44, 36, '#ff8a3d') + ellipse(122, 160, 24, 20, '#fff1df', null);
  const legs = path('M100,180 L96,200 M144,180 L148,200', 'none', OUTLINE, 9) + path('M100,180 L96,200 M144,180 L148,200', 'none', '#3b3456', 5);
  const ears = path('M92,62 L84,14 L118,48 Z', '#ff8a3d') + path('M168,62 L178,14 L144,48 Z', '#ff8a3d') + path('M94,52 L90,28 L108,46 Z', '#3b3456', null) + path('M166,52 L172,28 L154,46 Z', '#3b3456', null);
  const head = ellipse(130, 92, 50, 42, '#ff8a3d') + path('M86,100 Q130,140 176,100 Q170,128 130,134 Q92,128 86,100 Z', '#fff1df');
  const goggles = path('M80,74 Q130,56 180,74 L180,84 Q130,66 80,84 Z', '#3b3456', OUTLINE, 3) + ellipse(112, 66, 12, 10, '#5fd3ff') + ellipse(150, 66, 12, 10, '#5fd3ff');
  const scarf = path('M92,124 Q130,140 168,124 L170,136 Q130,150 90,136 Z', '#5fd3ff') + path('M96,132 Q70,140 58,128 Q66,146 92,142 Z', '#5fd3ff');
  const face = hit ? xEyes(112, 150, 94, 8) : eyesPair(112, 150, 94, 10, false, '#2fa8ff') + path('M122,114 Q130,122 140,114', 'none', OUTLINE, 4) + ellipse(131, 108, 5, 4, OUTLINE, null);
  return svgDoc(tail + legs + body + scarf + ears + head + goggles + face, w, h);
}

const pair = (w: number, h: number, f: (hit: boolean) => string): CreatureArt => ({ w, h, normal: f(false), hit: f(true) });

export const CREATURES: Record<string, CreatureArt> = {
  en_jelly: pair(200, 170, (h) => jelly(h)),
  en_bat: pair(240, 190, bat),
  en_shroom: pair(220, 230, (h) => shroom(h, false)),
  en_shroom_boss: pair(220, 230, (h) => shroom(h, true)),
  en_pudding_king: pair(340, 330, puddingKing),
  comp_bobo: pair(220, 230, bobo),
  comp_lumi: pair(190, 240, lumi),
  comp_zip: pair(240, 210, zip),
};

/** Scala di disegno in battaglia (l'élite è un fungotto ingrandito). */
export const CREATURE_SCALE: Record<string, number> = {
  en_jelly: 0.8, en_bat: 0.72, en_shroom: 0.78, en_shroom_boss: 1.15, en_pudding_king: 1.05,
  comp_bobo: 0.72, comp_lumi: 0.68, comp_zip: 0.7,
};

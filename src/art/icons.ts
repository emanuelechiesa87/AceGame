import { ellipse, OUTLINE, path, svgDoc } from './svg';

/** Icone 120×120: frutti, artefatti, nodi della mappa, intenzioni, stati. */
const S = 120;
const doc = (b: string) => svgDoc(b, S, S);

// --- Frutti: forma del frutto + nucleo luminoso a gemma + motivo dell'elemento ----------
function fruitBase(body: string, shade: string, gem: string, extra: string, shape: 'round' | 'tall' | 'drop' = 'round'): string {
  const outline = shape === 'tall' ? 'M60,20 Q100,26 98,70 Q96,108 60,110 Q24,108 22,70 Q20,26 60,20 Z'
    : shape === 'drop' ? 'M60,14 Q96,54 96,78 Q96,110 60,110 Q24,110 24,78 Q24,54 60,14 Z'
    : 'M60,26 Q104,22 104,68 Q102,110 60,110 Q18,110 16,68 Q16,22 60,26 Z';
  const glow = `<circle cx="60" cy="66" r="56" fill="${gem}" opacity="0.25"/>`;
  const fr = path(outline, body);
  const sh = path('M76,32 Q104,46 100,80 Q96,104 70,108 Q94,80 76,32 Z', shade, null);
  // gemma sfaccettata al centro: il "cuore" magico del frutto
  const g = path('M60,52 L74,64 L68,84 L52,84 L46,64 Z', gem, OUTLINE, 3) + path('M60,52 L60,84 M46,64 L74,64', 'none', '#ffffff', 2) + path('M52,58 L56,62', 'none', '#fff', 3);
  const shine = ellipse(40, 50, 7, 12, '#ffffff', null).replace('/>', ' opacity="0.7"/>');
  return doc(glow + extra + fr + sh + g + shine);
}

export const FRUIT_ICONS: Record<string, string> = {
  fruit_ember: fruitBase('#ff6b3d', '#d8402a', '#ffe14a',
    path('M60,28 Q50,8 62,0 Q62,14 74,10 Q76,24 60,28 Z', '#ffb43a') + path('M60,28 Q56,16 63,8', 'none', OUTLINE, 3)),
  fruit_frost: fruitBase('#5fd3ff', '#2f9fd1', '#e8fbff',
    path('M60,26 L60,6 M52,12 L68,20 M68,12 L52,20', 'none', OUTLINE, 6) + path('M60,26 L60,6 M52,12 L68,20 M68,12 L52,20', 'none', '#e8fbff', 3)),
  fruit_stone: fruitBase('#c8a26b', '#9a7a4a', '#ff9a6a',
    path('M50,26 L56,8 L66,14 L72,4 L74,26 Z', '#8a8a9a'), 'tall'),
  fruit_storm: fruitBase('#ffd94a', '#e0a515', '#ffffff',
    path('M62,26 L56,14 L66,14 L58,0 L76,16 L66,16 L72,26 Z', '#5fd3ff')),
  fruit_life: fruitBase('#6fe08a', '#3fb36a', '#ff7fa6',
    path('M60,28 Q36,6 26,22 Q44,30 60,28 Z', '#2f8a5a') + path('M60,28 Q82,4 94,20 Q76,30 60,28 Z', '#3fa37a') + ellipse(40, 80, 3, 3, '#3fb36a', null) + ellipse(80, 90, 3, 3, '#3fb36a', null), 'round'),
  fruit_spring: fruitBase('#ff7fb0', '#d94f86', '#fff1a8',
    path('M60,26 Q52,18 60,14 Q68,10 60,6 Q52,2 60,-2', 'none', OUTLINE, 6) + path('M60,26 Q52,18 60,14 Q68,10 60,6', 'none', '#7fe09a', 3), 'tall'),
  fruit_mist: fruitBase('#c9d6e8', '#8fa3c4', '#ffffff',
    `<circle cx="34" cy="30" r="12" fill="#e8f0fb" opacity="0.8"/><circle cx="84" cy="24" r="10" fill="#e8f0fb" opacity="0.8"/><circle cx="60" cy="16" r="9" fill="#e8f0fb" opacity="0.8"/>`, 'drop'),
  fruit_fang: fruitBase('#b07b4a', '#7a5230', '#fff1df',
    path('M44,30 L50,4 L58,28 Z', '#fff1df') + path('M62,28 L70,4 L76,30 Z', '#fff1df'), 'round'),
  fruit_glue: fruitBase('#a8d84a', '#78a828', '#fff7c2',
    path('M30,98 Q32,116 38,116 Q44,116 42,100', '#c8f06a') + path('M80,100 Q80,118 86,118 Q92,118 90,98', '#c8f06a') + path('M60,26 L60,10', 'none', '#6b4a2a', 6)),
  fruit_mirror: fruitBase('#9fe8ff', '#5fb8d8', '#ffffff',
    path('M60,26 L52,8 L68,8 Z', '#d9f6ff') + path('M28,40 L46,24 M80,96 L96,80', 'none', '#ffffff', 5), 'round'),
  fruit_clock: fruitBase('#ffcf3a', '#e09a12', '#ffffff',
    path('M60,28 L46,4 M60,28 L60,0 M60,28 L74,4', 'none', '#3fa37a', 7) + path('M60,92 L60,104 M24,68 L34,68 M86,68 L96,68', 'none', OUTLINE, 4), 'tall'),
  fruit_magnet: fruitBase('#e4342f', '#a8211e', '#fff1df',
    path('M44,26 L44,10 Q44,2 52,2 L68,2 Q76,2 76,10 L76,26 L66,26 L66,12 L54,12 L54,26 Z', '#d9e1ef') + path('M44,26 L44,20 L54,20 L54,26 Z M66,20 L76,20 L76,26 L66,26 Z', '#5fa8ff', null)),
  fruit_shadow: fruitBase('#9b6bff', '#6a3fd1', '#ff5f8a',
    path('M60,24 Q48,2 34,10 Q50,16 60,24 Z', '#3b3456') + path('M60,24 Q74,0 88,8 Q72,16 60,24 Z', '#3b3456'), 'drop'),
};

// --- Artefatti -------------------------------------------------------------------
export const ARTIFACT_ICONS: Record<string, string> = {
  art_basalt_core: doc(path('M60,14 L100,38 L100,84 L60,108 L20,84 L20,38 Z', '#4a4458') + path('M60,14 L100,38 L60,60 L20,38 Z', '#6b6480', null) +
    path('M60,60 L60,108 M20,38 L60,60 L100,38', 'none', OUTLINE, 3) + ellipse(60, 72, 12, 12, '#ff6b3d', OUTLINE, 3)),
  art_wolf_fang: doc(path('M44,16 Q80,20 82,50 Q86,90 56,108 Q66,70 44,16 Z', '#fff1df') + path('M44,16 Q64,30 70,60', 'none', '#d9c4a8', 4) +
    path('M30,30 Q60,20 90,30', 'none', '#8a5232', 6)),
  art_fate_thread: doc(path('M20,90 Q30,30 60,60 Q90,90 100,30', 'none', OUTLINE, 12) + path('M20,90 Q30,30 60,60 Q90,90 100,30', 'none', '#ff5f8a', 7) +
    ellipse(20, 90, 9, 9, '#ffd94a') + ellipse(100, 30, 9, 9, '#ffd94a')),
  art_unstable_prism: doc(path('M60,10 L100,96 L20,96 Z', '#b9e8ff') + path('M60,10 L100,96 L60,96 Z', '#7ab8e8', null) + path('M60,10 L20,96 L100,96 Z', 'none') +
    path('M100,60 L118,50 M102,70 L120,72 M100,80 L116,92', 'none', '#ff5f8a', 5)),
  art_return_bell: doc(path('M60,14 Q92,20 92,64 L100,88 L20,88 L28,64 Q28,20 60,14 Z', '#ffcf3a') + path('M76,22 Q92,34 92,64 L100,88 L80,88 Q86,50 76,22 Z', '#e09a12', null) +
    ellipse(60, 96, 10, 10, '#c08a4a') + path('M60,4 L60,14', 'none', OUTLINE, 6)),
};

export const POTION_ICON = doc(path('M48,14 L72,14 L72,38 Q100,50 98,80 Q96,108 60,108 Q24,108 22,80 Q20,50 48,38 Z', '#ff5f8a') +
  path('M24,72 Q60,60 96,72 Q96,106 60,106 Q24,106 24,72 Z', '#c93a62', null) + path('M44,10 L76,10 L76,20 L44,20 Z', '#8a5232', OUTLINE, 4) + ellipse(44, 62, 6, 10, '#fff', null));

// --- Nodi della mappa ----------------------------------------------------------------
const sword = (rot: number) => `<g transform="rotate(${rot} 60 60)">${path('M56,14 L64,14 L64,78 L56,78 Z', '#e8eef8')}${path('M42,78 L78,78 L78,86 L42,86 Z', '#ffcf3a', OUTLINE, 4)}${path('M56,86 L64,86 L64,104 L56,104 Z', '#8a5232', OUTLINE, 4)}</g>`;
export const NODE_ICONS: Record<string, string> = {
  battle: doc(sword(-35) + sword(35)),
  elite: doc(path('M60,14 Q100,14 100,56 Q100,78 86,86 L86,104 L34,104 L34,86 Q20,78 20,56 Q20,14 60,14 Z', '#fff1df') +
    ellipse(44, 58, 12, 14, OUTLINE, null) + ellipse(76, 58, 12, 14, OUTLINE, null) + path('M54,80 L60,70 L66,80 Z', OUTLINE, null) + path('M46,92 L46,104 M60,92 L60,104 M74,92 L74,104', 'none', OUTLINE, 4)),
  chest: doc(path('M14,52 L106,52 L106,104 L14,104 Z', '#c0703a') + path('M14,52 Q14,18 60,18 Q106,18 106,52 Z', '#e08a4a') +
    path('M14,52 L106,52', 'none', OUTLINE, 5) + path('M52,46 L68,46 L68,68 L52,68 Z', '#ffcf3a', OUTLINE, 4)),
  rest: doc(path('M24,100 L96,84 M24,84 L96,100', 'none', '#8a5232', 12) + path('M60,90 Q30,60 54,24 Q56,48 70,40 Q90,64 60,90 Z', '#ff8a3d') + path('M60,88 Q48,70 60,52 Q64,66 72,62 Q76,78 60,88 Z', '#ffe14a', null)),
  recruit: doc(path('M60,104 Q10,70 18,40 Q28,14 60,38 Q92,14 102,40 Q110,70 60,104 Z', '#ff5f8a') + path('M80,30 Q98,30 100,48', 'none', '#fff', 5)),
  event: doc(path('M40,40 Q40,14 62,14 Q86,14 86,36 Q86,52 66,58 L66,74 L54,74 L54,50 Q72,46 72,36 Q72,26 62,26 Q52,26 52,40 Z', '#9b6bff') + ellipse(60, 96, 9, 9, '#9b6bff')),
  boss: doc(path('M16,92 L10,30 L38,56 L60,14 L82,56 L110,30 L104,92 Z', '#ffd94a') + path('M16,92 L104,92 L104,106 L16,106 Z', '#e0a515') + ellipse(60, 64, 8, 8, '#ff5f8a', OUTLINE, 3)),
};

// --- Intenzioni dei nemici (mostrate sopra la testa) --------------------------------------
export const INTENT_ICONS: Record<string, string> = {
  attack: NODE_ICONS.battle,
  heavy: doc(sword(-35) + sword(35) + path('M86,10 L96,30 L114,20 L104,40 L118,50 L98,52', 'none', '#ff3b5c', 6)),
  defend: doc(path('M60,10 L100,24 Q100,80 60,110 Q20,80 20,24 Z', '#5fa8ff') + path('M60,10 L100,24 Q100,80 60,110 Z', '#3a78d8', null)),
  debuff: doc(ellipse(60, 66, 40, 36, '#9be06a') + ellipse(44, 56, 10, 10, '#c8ff9a', null) + ellipse(76, 78, 8, 8, '#6fb03a', null) + ellipse(70, 44, 6, 6, '#6fb03a', null)),
  special: doc(path('M60,8 L74,44 L112,46 L82,70 L94,108 L60,86 L26,108 L38,70 L8,46 L46,44 Z', '#ffd94a')),
};

// --- Stati ---------------------------------------------------------------------------------
export const STATUS_ICONS: Record<string, string> = {
  burn: doc(path('M60,110 Q14,80 44,30 Q46,60 64,50 Q60,24 78,8 Q110,60 96,88 Q86,110 60,110 Z', '#ff6b3d') + path('M60,106 Q38,86 54,64 Q58,78 68,74 Q80,90 60,106 Z', '#ffe14a', null)),
  poison: INTENT_ICONS.debuff,
  stun: doc(path('M60,8 L60,112 M14,34 L106,86 M14,86 L106,34', 'none', OUTLINE, 14) + path('M60,8 L60,112 M14,34 L106,86 M14,86 L106,34', 'none', '#bff4ff', 8)),
  shield: INTENT_ICONS.defend,
  atkUp: doc(path('M60,10 L104,58 L78,58 L78,108 L42,108 L42,58 L16,58 Z', '#ff5f6d')),
  vulnerable: doc(path('M60,10 L106,100 L14,100 Z', '#9b6bff') + path('M60,30 L50,56 L66,60 L54,92', 'none', OUTLINE, 6)),
  guard: INTENT_ICONS.defend,
  evade: doc(`<circle cx="40" cy="70" r="26" fill="#c9d6e8" opacity="0.7"/><circle cx="66" cy="54" r="30" fill="#e8f0fb" opacity="0.85"/><circle cx="86" cy="76" r="22" fill="#c9d6e8" opacity="0.8"/>`),
  defUp: doc(path('M60,10 L100,24 Q100,80 60,110 Q20,80 20,24 Z', '#ffcf3a') + path('M60,34 L82,58 L68,58 L68,86 L52,86 L52,58 L38,58 Z', '#ffffff', OUTLINE, 3)),
  slow: doc(ellipse(60, 70, 44, 32, '#a8d84a') + path('M30,60 Q60,40 90,60 M30,80 Q60,60 90,80', 'none', '#78a828', 5)),
  reflect: doc(path('M30,14 L90,14 L90,106 L30,106 Z', '#9fe8ff') + path('M40,30 L70,30 M40,46 L60,46', 'none', '#ffffff', 6)),
};

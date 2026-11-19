/**
 * Aspetto dell'eroe legato al frutto mangiato (dalla 0.6).
 * Il frutto "contagia" il personaggio per gradi, a ogni Risveglio:
 *   I   colori del frutto su bandana/cappello e cintura, stemma sul petto
 *   II  occhi del colore del frutto, segni sulle guance, bordi degli abiti
 *   III accessorio del frutto in testa (piccolo) e spallaccio sul braccio davanti
 *   IV  capelli e abiti nei colori del frutto, accessorio più grande, aura leggera
 *   V   trasformazione: accessorio grande, due spallacci, mantello, occhi luminosi, aura piena
 * Solo grafica: nessun effetto sul gioco.
 */

export type HeadKind =
  | 'flameCrown' | 'iceCrown' | 'rockHorns' | 'boltAntennae' | 'leafCrown' | 'shadowHorns' | 'springAntenna'
  | 'mistHalo' | 'beastEars' | 'gooBlob' | 'tiara' | 'clockHalo' | 'magnetHorns' | 'batWings' | 'stinkCloud'
  | 'goggles' | 'bubbleHelm' | 'fuseHelm' | 'grapeBun' | 'cherryClips';
export type ShoulderKind = 'spiky' | 'crystal' | 'boulder' | 'coil' | 'leaf' | 'puff' | 'fur' | 'drip' | 'gear' | 'plate' | 'rose' | 'tank' | 'cluster' | 'rind';
export type CapeEdge = 'flame' | 'jagged' | 'straight' | 'leaf' | 'tatter' | 'wave' | 'drip' | 'collar';
export type MotifKind = 'flame' | 'flake' | 'rock' | 'bolt' | 'leaf' | 'wisp' | 'coil' | 'puff' | 'claw' | 'drop' | 'shard' | 'gear' | 'spark' | 'petal' | 'cloud' | 'bubble' | 'seed' | 'grape' | 'cherry';

export interface FruitLook {
  /** colore principale (abiti, accessori) */
  main: string;
  /** tono scuro (giacca, ombre, mantello interno) */
  dark: string;
  /** tono chiaro (bordi, riflessi) */
  light: string;
  /** capelli dal livello IV */
  hair: string;
  /** occhi dal livello II */
  eye: string;
  /** bagliore (punte dei capelli al V, occhi luminosi, aura) */
  glow: string;
  head: HeadKind;
  shoulder: ShoulderKind;
  cape: CapeEdge;
  motif: MotifKind;
}

const L = (main: string, dark: string, light: string, hair: string, eye: string, glow: string, head: HeadKind, shoulder: ShoulderKind, cape: CapeEdge, motif: MotifKind): FruitLook =>
  ({ main, dark, light, hair, eye, glow, head, shoulder, cape, motif });

export const FRUIT_LOOKS: Record<string, FruitLook> = {
  fruit_ember: L('#ff6b3d', '#9e2a14', '#ffd36b', '#ff7a22', '#ffcf3a', '#fff09a', 'flameCrown', 'spiky', 'flame', 'flame'),
  fruit_frost: L('#5fd3ff', '#1f5f9e', '#e8fbff', '#d8f4ff', '#7ae0ff', '#ffffff', 'iceCrown', 'crystal', 'jagged', 'flake'),
  fruit_stone: L('#c8a26b', '#5e4a36', '#efdcae', '#8c7a66', '#ffb84a', '#ffe2a8', 'rockHorns', 'boulder', 'straight', 'rock'),
  fruit_storm: L('#ffd94a', '#2f3f86', '#fffbd0', '#ffe45a', '#fff27a', '#ffffff', 'boltAntennae', 'coil', 'jagged', 'bolt'),
  fruit_life: L('#6fe08a', '#2a7a4a', '#d8ffc8', '#7ed85a', '#b6ff7a', '#f0ffd0', 'leafCrown', 'leaf', 'leaf', 'leaf'),
  fruit_shadow: L('#9b6bff', '#2a1a4a', '#d8c8ff', '#3a2266', '#e04aff', '#d8a0ff', 'shadowHorns', 'spiky', 'tatter', 'wisp'),
  fruit_spring: L('#ff7fb0', '#a83a6a', '#ffd6e6', '#ff8fbe', '#ff4f98', '#fff0f6', 'springAntenna', 'coil', 'wave', 'coil'),
  fruit_mist: L('#c9d6e8', '#5a6a88', '#ffffff', '#e8eef8', '#8fd0ff', '#ffffff', 'mistHalo', 'puff', 'tatter', 'puff'),
  fruit_fang: L('#b07b4a', '#4a2e1a', '#f0d2a0', '#7a4a22', '#ffcf3a', '#ffe6a0', 'beastEars', 'fur', 'tatter', 'claw'),
  fruit_glue: L('#a8d84a', '#4a7a1a', '#e8ffb0', '#b0e050', '#d8ff6a', '#f4ffd0', 'gooBlob', 'drip', 'drip', 'drop'),
  fruit_mirror: L('#b8e4ff', '#4a4f8a', '#ffffff', '#eef2ff', '#8a7aff', '#ffffff', 'tiara', 'plate', 'straight', 'shard'),
  fruit_clock: L('#ffcf3a', '#7a5a1a', '#fff4b0', '#ffd96a', '#ffcf3a', '#fffbe0', 'clockHalo', 'gear', 'straight', 'gear'),
  fruit_magnet: L('#e4342f', '#45485a', '#e8eef6', '#c8d2e0', '#ff4a4a', '#ffd6d6', 'magnetHorns', 'plate', 'straight', 'spark'),
  fruit_blood: L('#e8304f', '#5a0a1e', '#ffb0c0', '#a8122e', '#ff2a4a', '#ffd0d8', 'batWings', 'rose', 'collar', 'petal'),
  fruit_stench: L('#c9c23a', '#55581a', '#f4f0a0', '#9aa83a', '#e8f04a', '#f8ffb0', 'stinkCloud', 'spiky', 'tatter', 'cloud'),
  fruit_acid: L('#e6f04a', '#4f6e1a', '#fbffd0', '#d4ee4a', '#c8ff3a', '#fbffd0', 'goggles', 'tank', 'drip', 'drop'),
  fruit_bubble: L('#ff9a2a', '#a8501a', '#ffe0b0', '#ffae50', '#ffb45f', '#ffffff', 'bubbleHelm', 'cluster', 'wave', 'bubble'),
  fruit_mine: L('#3fae4a', '#1e5a2a', '#ff7a86', '#4ac25a', '#ff5a6a', '#ffe0e0', 'fuseHelm', 'rind', 'straight', 'seed'),
  fruit_swarm: L('#8a52e0', '#3a1a6a', '#d8c0ff', '#a070f0', '#c8a0ff', '#f0e0ff', 'grapeBun', 'cluster', 'wave', 'grape'),
  fruit_twin: L('#e8264a', '#6a0a1e', '#ffc0c8', '#e8304f', '#ff6080', '#ffe0e6', 'cherryClips', 'cluster', 'wave', 'cherry'),
};

/** Cosa cambia a ogni livello (1..5). */
export interface LookStage {
  accent: boolean; // colori su bandana/cappello, cintura, stemma
  eyes: boolean; // occhi del frutto + segni sulle guance
  glowEyes: boolean; // occhi luminosi (V)
  headSize: 0 | 1 | 2 | 3; // accessorio in testa
  shoulders: 0 | 1 | 2; // spallacci (davanti / entrambi)
  shoulderSize: 1 | 2; // spallacci grandi al V
  hair: boolean; // capelli del frutto
  clothes: boolean; // abiti del frutto
  cape: boolean; // mantello
  aura: 0 | 1 | 2; // particelle attorno
}

export function lookStage(level: number): LookStage {
  const l = Math.max(0, Math.min(5, Math.floor(level)));
  return {
    accent: l >= 1,
    eyes: l >= 2,
    glowEyes: l >= 5,
    headSize: l >= 5 ? 3 : l >= 4 ? 2 : l >= 3 ? 1 : 0,
    shoulders: l >= 5 ? 2 : l >= 3 ? 1 : 0,
    shoulderSize: l >= 5 ? 2 : 1,
    hair: l >= 4,
    clothes: l >= 4,
    cape: l >= 5,
    aura: l >= 5 ? 2 : l >= 4 ? 1 : 0,
  };
}

export interface HeroLook { fruitId: string; level: number }

/** Chiave della variante grafica ('' = aspetto base). */
export function lookKey(look?: HeroLook | null): string {
  if (!look || !FRUIT_LOOKS[look.fruitId] || look.level < 1) return '';
  return `${look.fruitId}-${Math.min(5, Math.floor(look.level))}`;
}

/** Aspetto dell'eroe per la run in corso (frutto mangiato + livello del Risveglio). */
export function runLook(run?: { activeFruitIds: string[]; fruitLevel?: number } | null): HeroLook | null {
  const fruitId = run?.activeFruitIds?.[0];
  if (!fruitId || !FRUIT_LOOKS[fruitId]) return null;
  return { fruitId, level: run!.fruitLevel ?? 1 };
}

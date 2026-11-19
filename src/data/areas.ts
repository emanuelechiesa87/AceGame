export type NodeType = 'battle' | 'elite' | 'chest' | 'rest' | 'recruit' | 'event' | 'boss';

export interface AreaDef {
  id: string;
  name: string;
  /** Sottotitolo mostrato nella schermata "Nuovo mare". */
  tagline: string;
  /** Passi prima del boss (il primo è sempre una battaglia). */
  steps: number;
  nodeWeights: Partial<Record<NodeType, number>>;
  /** Gruppi di nemici per difficoltà crescente: early = primi passi. */
  groups: { early: string[][]; late: string[][]; elite: string[][]; boss: string[] };
  /** Moltiplicatori dei nemici in quest'area (oltre a BALANCE.enemies). */
  scale: { hp: number; atk: number };
  /** Livello massimo di Risveglio raggiungibile in quest'area. */
  maxFruitLevel: number;
  /** Tinta dello scenario (0xRRGGBB) finché l'area non ha sfondi propri. */
  tint?: number;
}

/** Gruppi della prima area: per ora riusati (rinforzati) anche nelle aree 2-4,
 *  finché non arrivano i loro nemici, élite e boss (fase 3 della 0.6). */
const PORT_GROUPS: AreaDef['groups'] = {
  early: [['en_jelly'], ['en_bat'], ['en_jelly', 'en_bat']],
  late: [['en_jelly', 'en_jelly'], ['en_shroom', 'en_bat'], ['en_shroom', 'en_jelly'], ['en_bat', 'en_bat', 'en_jelly']],
  elite: [['en_shroom_boss']],
  boss: ['en_pudding_king'],
};
/** Dalla seconda area i gruppi "early" sono già quelli più numerosi. */
const PORT_GROUPS_HARD: AreaDef['groups'] = { ...PORT_GROUPS, early: PORT_GROUPS.late };

const WEIGHTS: AreaDef['nodeWeights'] = { battle: 40, event: 16, chest: 14, rest: 10, recruit: 12, elite: 10 };

/**
 * Quattro mari affrontati in sequenza nella stessa run (morte = fine run).
 * Gli `id` finiscono nei salvataggi: non rinominarli. Nomi e temi delle aree
 * 2-4 sono provvisori, in attesa dei contenuti definitivi.
 */
export const AREAS: AreaDef[] = [
  {
    id: 'area_sunset_plains', name: 'Porto delle Gemme', tagline: 'Dove tutto comincia', steps: 6,
    nodeWeights: WEIGHTS, groups: PORT_GROUPS, scale: { hp: 1, atk: 1 }, maxFruitLevel: 3,
  },
  {
    id: 'area_coral_reef', name: 'Scogliera dei Coralli', tagline: 'Acque basse, guai profondi', steps: 6,
    nodeWeights: WEIGHTS, groups: PORT_GROUPS_HARD, scale: { hp: 1.3, atk: 1.15 }, maxFruitLevel: 4, tint: 0xffc2c8,
  },
  {
    id: 'area_glow_abyss', name: 'Abisso Luminoso', tagline: 'Laggiù qualcosa si accende', steps: 6,
    nodeWeights: WEIGHTS, groups: PORT_GROUPS_HARD, scale: { hp: 2.1, atk: 1.55 }, maxFruitLevel: 5, tint: 0x9fd8ff,
  },
  {
    id: 'area_ship_graveyard', name: 'Cimitero delle Navi', tagline: 'L\'ultimo mare', steps: 6,
    nodeWeights: WEIGHTS, groups: PORT_GROUPS_HARD, scale: { hp: 2.9, atk: 1.9 }, maxFruitLevel: 5, tint: 0xc8b8e8,
  },
];

export const LAST_AREA_INDEX = AREAS.length - 1;

export const NODE_LABELS: Record<NodeType, { title: string; hint: string }> = {
  battle: { title: 'Battaglia', hint: 'Nemici in vista' },
  elite: { title: 'Élite', hint: 'Duro, ma premia bene' },
  chest: { title: 'Forziere', hint: 'Un tesoro sul molo' },
  rest: { title: 'Fuoco', hint: 'Riposa un attimo' },
  recruit: { title: 'Incontro', hint: 'Qualcuno chiede aiuto' },
  event: { title: 'Mistero', hint: 'Chissà cosa succede...' },
  boss: { title: 'BOSS', hint: 'Il signore di questo mare' },
};

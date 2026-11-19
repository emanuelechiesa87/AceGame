export type BackdropTheme = 'port' | 'reef' | 'abyss' | 'graveyard';
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
  /** Scenario del mare (cielo, orizzonte, acqua): vedi `src/pixel/backgrounds.ts`. */
  backdrop: BackdropTheme;
  /** Tinta opzionale dello scenario (0xRRGGBB). */
  tint?: number;
}

const PORT_GROUPS: AreaDef['groups'] = {
  early: [['en_jelly'], ['en_bat'], ['en_jelly', 'en_bat']],
  late: [['en_jelly', 'en_jelly'], ['en_shroom', 'en_bat'], ['en_shroom', 'en_jelly'], ['en_bat', 'en_bat', 'en_jelly']],
  elite: [['en_shroom_boss']],
  boss: ['en_pudding_king'],
};
const REEF_GROUPS: AreaDef['groups'] = {
  early: [['en_urchin', 'en_puffer_horn'], ['en_coral', 'en_hermit'], ['en_hermit', 'en_puffer_horn']],
  late: [['en_urchin', 'en_coral'], ['en_hermit', 'en_hermit', 'en_puffer_horn'], ['en_coral', 'en_urchin', 'en_puffer_horn'], ['en_urchin', 'en_hermit']],
  elite: [['en_moray']],
  boss: ['en_anemone_queen'],
};
const ABYSS_GROUPS: AreaDef['groups'] = {
  early: [['en_lanternfish', 'en_neonjelly'], ['en_mimic_squid', 'en_lanternfish'], ['en_gunshrimp', 'en_neonjelly']],
  late: [['en_gunshrimp', 'en_mimic_squid'], ['en_neonjelly', 'en_neonjelly', 'en_lanternfish'], ['en_lanternfish', 'en_gunshrimp', 'en_mimic_squid'], ['en_mimic_squid', 'en_neonjelly']],
  elite: [['en_archivist']],
  boss: ['en_abyss_lighthouse'],
};
const GRAVE_GROUPS: AreaDef['groups'] = {
  early: [['en_anchor', 'en_ghost_lamp'], ['en_barrel', 'en_siren'], ['en_ghost_lamp', 'en_barrel']],
  late: [['en_anchor', 'en_siren'], ['en_barrel', 'en_barrel', 'en_ghost_lamp'], ['en_siren', 'en_ghost_lamp', 'en_anchor'], ['en_anchor', 'en_barrel']],
  elite: [['en_figurehead']],
  boss: ['en_wreck_admiral'],
};

const WEIGHTS: AreaDef['nodeWeights'] = { battle: 40, event: 16, chest: 14, rest: 10, recruit: 12, elite: 10 };

/**
 * Quattro mari affrontati in sequenza nella stessa run (morte = fine run).
 * Gli `id` finiscono nei salvataggi: non rinominarli. Ogni mare ha nemici,
 * élite, boss e scenario propri.
 */
export const AREAS: AreaDef[] = [
  {
    id: 'area_sunset_plains', name: 'Porto delle Gemme', tagline: 'Dove tutto comincia', steps: 6,
    nodeWeights: WEIGHTS, groups: PORT_GROUPS, scale: { hp: 1, atk: 1 }, maxFruitLevel: 3, backdrop: 'port',
  },
  {
    id: 'area_coral_reef', name: 'Scogliera dei Coralli', tagline: 'Acque basse, guai profondi', steps: 6,
    nodeWeights: WEIGHTS, groups: REEF_GROUPS, scale: { hp: 1.15, atk: 1.05 }, maxFruitLevel: 4, backdrop: 'reef',
  },
  {
    id: 'area_glow_abyss', name: 'Abisso Luminoso', tagline: 'Laggiù qualcosa si accende', steps: 6,
    nodeWeights: WEIGHTS, groups: ABYSS_GROUPS, scale: { hp: 2.2, atk: 1.6 }, maxFruitLevel: 5, backdrop: 'abyss', tint: 0x8e9ad8,
  },
  {
    id: 'area_ship_graveyard', name: 'Cimitero delle Navi', tagline: 'L\'ultimo mare', steps: 6,
    nodeWeights: WEIGHTS, groups: GRAVE_GROUPS, scale: { hp: 2.9, atk: 1.9 }, maxFruitLevel: 5, backdrop: 'graveyard', tint: 0xb4a8b8,
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

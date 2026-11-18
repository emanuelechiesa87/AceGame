export type NodeType = 'battle' | 'elite' | 'chest' | 'rest' | 'recruit' | 'event' | 'boss';

export interface AreaDef {
  id: string;
  name: string;
  /** Passi prima del boss (il primo è sempre una battaglia). */
  steps: number;
  nodeWeights: Partial<Record<NodeType, number>>;
  /** Gruppi di nemici per difficoltà crescente: early = primi passi. */
  groups: { early: string[][]; late: string[][]; elite: string[][]; boss: string[] };
}

export const AREAS: AreaDef[] = [
  {
    id: 'area_sunset_plains', name: 'Pianure del Tramonto', steps: 6,
    nodeWeights: { battle: 40, event: 16, chest: 14, rest: 10, recruit: 12, elite: 10 },
    groups: {
      early: [['en_jelly'], ['en_bat'], ['en_jelly', 'en_bat']],
      late: [['en_jelly', 'en_jelly'], ['en_shroom', 'en_bat'], ['en_shroom', 'en_jelly'], ['en_bat', 'en_bat', 'en_jelly']],
      elite: [['en_shroom_boss']],
      boss: ['en_pudding_king'],
    },
  },
];

export const NODE_LABELS: Record<NodeType, { title: string; hint: string }> = {
  battle: { title: 'Battaglia', hint: 'Nemici in vista' },
  elite: { title: 'Élite', hint: 'Duro, ma premia bene' },
  chest: { title: 'Forziere', hint: 'Un tesoro sul sentiero' },
  rest: { title: 'Fuoco', hint: 'Riposa un attimo' },
  recruit: { title: 'Incontro', hint: 'Qualcuno chiede aiuto' },
  event: { title: 'Mistero', hint: 'Chissà cosa succede...' },
  boss: { title: 'BOSS', hint: 'Il signore dell\'area' },
};

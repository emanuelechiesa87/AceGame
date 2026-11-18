/** Eventi narrativi brevi: ogni scelta ha un rischio o un costo leggibile. */
export interface EventChoice { label: string; outcome: string }
export interface EventDef { id: string; title: string; text: string; choices: EventChoice[] }

export const EVENTS: EventDef[] = [
  {
    id: 'ev_fizzy_spring', title: 'Fonte Frizzante',
    text: 'Una fonte fa le bollicine e ride da sola. L\'acqua sa di limonata... forse.',
    choices: [{ label: 'Bevi! (70% cura, 30% mal di pancia)', outcome: 'spring_drink' }, { label: 'Meglio di no', outcome: 'nothing' }],
  },
  {
    id: 'ev_hooded_trader', title: 'Mercante del Molo',
    text: '«Psst! Una pozione per un\'essenza che risveglia i frutti? Affare dell\'anno, garantito al 50%!»',
    choices: [{ label: 'Scambia 1 pozione', outcome: 'trade_potion_fruit' }, { label: 'Non mi fido', outcome: 'nothing' }],
  },
  {
    id: 'ev_old_altar', title: 'Idolo del Relitto',
    text: 'Un idolo sul relitto chiede un piccolo sacrificio di energia vitale. In cambio, promette forza.',
    choices: [{ label: 'Offri 12 HP max: +3 ATT', outcome: 'altar_strength' }, { label: 'Lascia stare', outcome: 'nothing' }],
  },
  {
    id: 'ev_lost_cat', title: 'Gatto Smarrito',
    text: 'Il gatto di bordo ti fissa. Poi indica un barile. Poi ti fissa di nuovo.',
    choices: [{ label: 'Guarda nel barile', outcome: 'cat_bush' }, { label: 'Accarezza il gatto', outcome: 'cat_pet' }],
  },
];

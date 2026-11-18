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
    id: 'ev_hooded_trader', title: 'Viandante Incappucciato',
    text: '«Psst! Una pozione per un frutto misterioso? Affare dell\'anno, garantito al 40%!»',
    choices: [{ label: 'Scambia 1 pozione', outcome: 'trade_potion_fruit' }, { label: 'Non mi fido', outcome: 'nothing' }],
  },
  {
    id: 'ev_old_altar', title: 'Altare Antico',
    text: 'Un altare chiede un piccolo sacrificio di energia vitale. In cambio, promette forza.',
    choices: [{ label: 'Offri 12 HP max: +3 ATT', outcome: 'altar_strength' }, { label: 'Lascia stare', outcome: 'nothing' }],
  },
  {
    id: 'ev_lost_cat', title: 'Gatto Smarrito',
    text: 'Un gatto con il mantello ti fissa. Poi indica un cespuglio. Poi ti fissa di nuovo.',
    choices: [{ label: 'Guarda nel cespuglio', outcome: 'cat_bush' }, { label: 'Accarezza il gatto', outcome: 'cat_pet' }],
  },
];

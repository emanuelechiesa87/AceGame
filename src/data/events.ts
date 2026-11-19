/** Eventi narrativi brevi: ogni scelta ha un rischio o un costo leggibile. */
export interface EventChoice { label: string; outcome: string }
/** `areas`: indici dei mari in cui può uscire (assente = tutti). */
export interface EventDef { id: string; title: string; text: string; choices: EventChoice[]; areas?: number[] }

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
  // --- 0.6.1: Porto delle Gemme ---
  {
    id: 'ev_smuggler_gulls', title: 'Gabbiani Contrabbandieri', areas: [0],
    text: 'Tre gabbiani con gli occhiali da sole aprono un fagotto. «Roba buona, capo. Si paga in... sangue. Poco, eh.»',
    choices: [{ label: 'Paga 15 HP: un artefatto', outcome: 'gulls_buy' }, { label: 'Niente affari coi gabbiani', outcome: 'nothing' }],
  },
  {
    id: 'ev_octopus_cups', title: 'Bussolotti del Polpo', areas: [0],
    text: 'Un polpo muove tre bicchieri con otto braccia. «Indovina dov\'è la perla! Scommetti una pozione?»',
    choices: [{ label: 'Scommetti 1 pozione (50%: +2)', outcome: 'octopus_bet' }, { label: 'Otto braccia? Imbroglia', outcome: 'nothing' }],
  },
  // --- Scogliera dei Coralli ---
  {
    id: 'ev_old_turtle', title: 'Tartaruga Anziana', areas: [1],
    text: 'Una tartaruga grande come una barca sbadiglia. «Ti do un passaggio, giovane. Oppure un consiglio. Gratis, alla mia età.»',
    choices: [{ label: 'Passaggio: salta una tappa, +20% HP', outcome: 'turtle_ride' }, { label: 'Consiglio: +4 HP max', outcome: 'turtle_advice' }],
  },
  {
    id: 'ev_giant_clam', title: 'Vongola Gigante', areas: [1],
    text: 'Una vongola enorme dorme a bocca aperta. Dentro qualcosa luccica. Russa forte.',
    choices: [{ label: 'Infila la mano (60% tesoro)', outcome: 'clam_reach' }, { label: 'Lasciala dormire', outcome: 'nothing' }],
  },
  // --- Abisso Luminoso ---
  {
    id: 'ev_neon_pact', title: 'Patto della Medusa Neon', areas: [2],
    text: 'Una medusa luminosa ti avvolge con un filamento. «Ti do luce per il tuo frutto. In cambio, prendo un po\' di te.»',
    choices: [{ label: 'Accetta: Risveglio, -15% HP max', outcome: 'medusa_pact' }, { label: 'Rifiuta', outcome: 'nothing' }],
  },
  {
    id: 'ev_sunken_library', title: 'Biblioteca Sommersa', areas: [2],
    text: 'Scaffali di libri che non si bagnano. Uno sporge, come se volesse farsi leggere.',
    choices: [{ label: 'Prendi il libro', outcome: 'library_read' }, { label: 'Odi leggere', outcome: 'nothing' }],
  },
  // --- Cimitero delle Navi ---
  {
    id: 'ev_ghost_crew', title: 'Ciurma Fantasma', areas: [3],
    text: 'Fantasmi seduti a un tavolo ti fanno posto. «Una mano a carte? Se vinci, un tesoro. Se perdi... un pezzetto di vita.»',
    choices: [{ label: 'Gioca (50%: artefatto raro)', outcome: 'ghost_cards' }, { label: 'Non gioco coi morti', outcome: 'nothing' }],
  },
  {
    id: 'ev_old_cannon', title: 'Cannone Abbandonato', areas: [3],
    text: 'Un cannone ancora carico punta verso la nebbia. La miccia è asciutta. Che fortuna.',
    choices: [{ label: 'Spara nella nebbia', outcome: 'cannon_take' }, { label: 'Lascialo stare', outcome: 'nothing' }],
  },
  // --- in tutti i mari ---
  {
    id: 'ev_wandering_cook', title: 'Cuoco Ambulante',
    text: 'Un cuoco su una zattera-cucina rimesta un pentolone. «Piatto del giorno o piatto piccante? Il piccante è... coraggioso.»',
    choices: [{ label: 'Piatto del giorno: +30% HP', outcome: 'cook_meal' }, { label: 'Piccante: +5 HP max, -10 HP', outcome: 'cook_spicy' }],
  },
  {
    id: 'ev_message_bottle', title: 'Bottiglia col Messaggio',
    text: 'Una bottiglia tappata galleggia fino ai tuoi piedi. Dentro c\'è un foglio arrotolato.',
    choices: [{ label: 'Stappa e leggi', outcome: 'bottle_read' }, { label: 'Ributtala in mare', outcome: 'nothing' }],
  },
];

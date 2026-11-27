/**
 * 0.12.0 · Cornice narrativa: la marea restituisce i frutti, l'Ammiraglio Relitto li vuole
 * per far riemergere la sua flotta. Solo testi: la scena è `StoryScene`.
 */
import { MAX_TIDE } from './tides';

export type StoryId = 'intro' | 'tide' | 'finale';

/** Cosa si vede sopra il testo: l'eroe, un nemico (id) o entrambi. */
export interface StoryPage { text: string; hero?: boolean; foe?: string; theme: 'port' | 'reef' | 'abyss' | 'graveyard' }

const INTRO: StoryPage[] = [
  { text: 'Una notte il mare si è ritirato. Al ritorno ha lasciato sulla riva strani frutti.', theme: 'port' },
  { text: 'Chi ne mangia uno riceve un potere. Uno solo, per sempre. Tu hai appena dato il primo morso.', hero: true, theme: 'port' },
  { text: "Dal Cimitero delle Navi l'Ammiraglio Relitto li reclama tutti. Con quelli, la sua flotta tornerà a galla. Salpa!", foe: 'en_wreck_admiral', theme: 'graveyard' },
];

const TIDE_INTRO: StoryPage[] = [
  { text: "La marea è salita. L'Ammiraglio è tornato.", foe: 'en_wreck_admiral', theme: 'graveyard' },
];

const FINALE: StoryPage[] = [
  { text: "Il relitto dell'Ammiraglio si spezza. La flotta torna a dormire sul fondo.", foe: 'en_wreck_admiral', theme: 'graveyard' },
  { text: '{nome} riporta la ciurma al porto. Il potere del frutto non se ne va.', hero: true, theme: 'port' },
  { text: 'Ma il mare si sta ritirando di nuovo... e la prossima marea sarà più alta.', hero: true, theme: 'port' },
];

/** Dopo l'ultima Marea non ce n'è una più alta. */
const FINALE_MAX: StoryPage[] = [
  FINALE[0],
  FINALE[1],
  { text: "L'Abisso è domato. Il mare si ritira in silenzio, e stavolta non riporta nessuna flotta. Per ora.", hero: true, theme: 'abyss' },
];

export function storyPages(id: StoryId, heroName: string, tide: number): StoryPage[] {
  const pages = id === 'intro' ? INTRO : id === 'tide' ? TIDE_INTRO : tide >= MAX_TIDE ? FINALE_MAX : FINALE;
  return pages.map((p) => ({ ...p, text: p.text.replace('{nome}', heroName) }));
}

/** Battuta del boss prima dello scontro. */
export const BOSS_LINES: Record<string, string> = {
  en_pudding_king: 'Un frutto? Mi mancava giusto il dolce!',
  en_anemone_queen: 'Ciò che il mare dona, la scogliera trattiene.',
  en_abyss_lighthouse: 'Avvicinati. La luce non morde. Io sì.',
  en_wreck_admiral: 'Quel frutto è un pezzo della mia flotta. Restituiscilo.',
};

export const COMPANION_HINT = {
  title: 'LA CIURMA CONTA',
  text: 'I compagni combattono al tuo fianco. Per arrivare in fondo te ne servono almeno due, meglio tre: non rinunciare agli incontri.',
};

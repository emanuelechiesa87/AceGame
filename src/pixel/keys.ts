/** Chiavi delle texture e tipi condivisi della grafica pixel. */
export type HeroId = 'm' | 'f';
export type Eyes = 'open' | 'closed' | 'happy' | 'fierce';
export type Mouth = 'grin' | 'shout' | 'smirk' | 'ouch';

export const heroKey = (id: HeroId, part: string) => `hero-${id}-${part}`;
export const creatureKey = (id: string, hit = false) => `cr-${id}${hit ? '-hit' : ''}`;
export const iconKey = (group: 'fruit' | 'fruitbig' | 'artifact' | 'node' | 'intent' | 'status' | 'misc', id: string) => `ic-${group}-${id}`;

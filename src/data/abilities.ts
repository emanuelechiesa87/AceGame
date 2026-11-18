import type { Ability } from '../types/content';

export const BASIC_ATTACK: Ability = {
  id: 'basic_attack', name: 'Attacco', description: 'Colpo semplice al bersaglio.',
  target: 'enemy', effects: [{ kind: 'damage', mult: 1 }], intent: 'attack',
};

export const GUARD: Ability = {
  id: 'guard', name: 'Difesa', description: 'Dimezza i danni fino al tuo prossimo turno e ricarica energia.',
  target: 'self', effects: [{ kind: 'status', status: 'guard', turns: 1 }],
};

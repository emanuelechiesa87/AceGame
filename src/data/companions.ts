import type { CompanionDef } from '../types/content';

export const COMPANIONS: CompanionDef[] = [
  {
    id: 'comp_bobo', name: 'Bobo', role: 'difensore',
    description: 'Orsetto di pietra testardo. Para tutto con la sua ghianda-scudo.',
    stats: { maxHp: 70, atk: 7, def: 6, spd: 6 }, chargeMax: 3,
    auto: { id: 'bobo_bonk', name: 'Testata', description: 'Colpisce il bersaglio.', target: 'enemy', when: 'always', effects: [{ kind: 'damage', mult: 1 }] },
    special: { id: 'bobo_acorn', name: 'Muro di Ghiande', description: 'Scudo da 30 a tutta la squadra.', target: 'allAllies', effects: [{ kind: 'shield', amount: 30 }] },
  },
  {
    id: 'comp_lumi', name: 'Lumi', role: 'supporto',
    description: 'Spiritello-lanterna chiacchierone. Cura chi è in difficoltà.',
    stats: { maxHp: 50, atk: 6, def: 2, spd: 12 }, chargeMax: 3,
    auto: { id: 'lumi_glow', name: 'Bagliore', description: 'Cura il 12% all\'alleato più ferito.', target: 'lowestAlly', when: 'allyBelowHalf', effects: [{ kind: 'heal', pctMaxHp: 0.12 }] },
    special: { id: 'lumi_dawn', name: 'Alba Tascabile', description: 'Cura il 35% a tutti e rimuove gli effetti negativi.', target: 'allAllies', effects: [{ kind: 'heal', pctMaxHp: 0.35 }, { kind: 'cleanse' }] },
  },
  {
    id: 'comp_zip', name: 'Zip', role: 'assaltatore',
    description: 'Volpe-razzo iperattiva. Prima colpisce, poi chiede.',
    stats: { maxHp: 55, atk: 10, def: 2, spd: 15 }, chargeMax: 3,
    auto: { id: 'zip_dash', name: 'Scatto', description: 'Colpisce il bersaglio.', target: 'enemy', when: 'always', effects: [{ kind: 'damage', mult: 1 }] },
    special: { id: 'zip_comet', name: 'Coda Cometa', description: 'Danno 120% a tutti i nemici.', target: 'allEnemies', effects: [{ kind: 'damage', mult: 1.2 }] },
  },
];

export const COMPANION_BY_ID = new Map(COMPANIONS.map((c) => [c.id, c]));

import type { CompanionDef } from '../types/content';
import { BALANCE } from './balance';

export const COMPANIONS: CompanionDef[] = [
  {
    id: 'comp_bobo', name: 'Bobo', role: 'difensore',
    description: 'Orso marinaio testardo. Para tutto col suo coperchio di botte.',
    stats: { maxHp: 70, atk: 9, def: 6, spd: 6 }, chargeMax: 3,
    auto: { id: 'bobo_bonk', name: 'Testata', description: 'Colpisce il bersaglio.', target: 'enemy', when: 'always', effects: [{ kind: 'damage', mult: 1 }] },
    special: { id: 'bobo_acorn', name: 'Muro di Botti', description: 'Scudo da 30 a tutta la squadra.', target: 'allAllies', effects: [{ kind: 'shield', amount: 30 }] },
  },
  {
    id: 'comp_lumi', name: 'Lumi', role: 'supporto',
    description: 'Lanterna di bordo chiacchierona. Cura chi è in difficoltà.',
    stats: { maxHp: 50, atk: 8, def: 2, spd: 12 }, chargeMax: 3,
    auto: { id: 'lumi_glow', name: 'Bagliore', description: 'Cura il 12% all\'alleato più ferito.', target: 'lowestAlly', when: 'allyBelowHalf', effects: [{ kind: 'heal', pctMaxHp: 0.12 }] },
    special: { id: 'lumi_dawn', name: 'Alba Tascabile', description: 'Cura il 35% a tutti e rimuove gli effetti negativi.', target: 'allAllies', effects: [{ kind: 'heal', pctMaxHp: 0.35 }, { kind: 'cleanse' }] },
  },
  {
    id: 'comp_zip', name: 'Zip', role: 'assaltatore',
    description: 'Volpe mozzo iperattiva. Prima colpisce, poi chiede.',
    stats: { maxHp: 55, atk: 12, def: 2, spd: 15 }, chargeMax: 3,
    auto: { id: 'zip_dash', name: 'Scatto', description: 'Colpisce il bersaglio.', target: 'enemy', when: 'always', effects: [{ kind: 'damage', mult: 1 }] },
    special: { id: 'zip_comet', name: 'Coda Cometa', description: 'Danno 120% a tutti i nemici.', target: 'allEnemies', effects: [{ kind: 'damage', mult: 1.2 }] },
  },
];

export const COMPANION_BY_ID = new Map(COMPANIONS.map((c) => [c.id, c]));

/** Crescita dei compagni nel mare `areaIndex` (0 = primo). */
export function companionScale(areaIndex: number): { hp: number; atk: number } {
  const C = BALANCE.companions;
  return { hp: 1 + C.hpPerArea * areaIndex, atk: 1 + C.atkPerArea * areaIndex };
}

/** HP massimi del compagno nel mare dato. */
export function companionMaxHp(id: string, areaIndex: number): number {
  const d = COMPANION_BY_ID.get(id);
  if (!d) throw new Error(`Compagno sconosciuto: ${id}`);
  return Math.round(d.stats.maxHp * companionScale(areaIndex).hp);
}

import type { CompanionDef } from '../types/content';
import { BALANCE } from './balance';

export const COMPANIONS: CompanionDef[] = [
  {
    id: 'comp_bobo', name: 'Bobo', role: 'difensore',
    description: 'Orso marinaio testardo. Para tutto col suo coperchio di botte.',
    stats: { maxHp: 70, atk: 9, def: 6, spd: 6 }, chargeMax: 3,
    auto: { id: 'bobo_bonk', name: 'Testata', description: 'Colpisce il bersaglio.', target: 'enemy', when: 'always', effects: [{ kind: 'damage', mult: 1 }] },
    special: { id: 'bobo_acorn', name: 'Muro di Botti', description: 'Scudo da 20 a tutta la squadra.', target: 'allAllies', effects: [{ kind: 'shield', amount: 20 }] },
  },
  {
    id: 'comp_lumi', name: 'Lumi', role: 'supporto',
    description: 'Lanterna di bordo chiacchierona. Cura chi è in difficoltà.',
    stats: { maxHp: 50, atk: 8, def: 2, spd: 12 }, chargeMax: 4,
    auto: { id: 'lumi_glow', name: 'Bagliore', description: 'Cura il 6% all\'alleato più ferito.', target: 'lowestAlly', when: 'allyBelowHalf', effects: [{ kind: 'heal', pctMaxHp: 0.06 }] },
    special: { id: 'lumi_dawn', name: 'Alba Tascabile', description: 'Cura il 15% a tutti e rimuove gli effetti negativi.', target: 'allAllies', effects: [{ kind: 'heal', pctMaxHp: 0.15 }, { kind: 'cleanse' }] },
  },
  {
    id: 'comp_zip', name: 'Zip', role: 'assaltatore',
    description: 'Volpe mozzo iperattiva. Prima colpisce, poi chiede.',
    stats: { maxHp: 55, atk: 12, def: 2, spd: 15 }, chargeMax: 3,
    auto: { id: 'zip_dash', name: 'Scatto', description: 'Colpisce il bersaglio.', target: 'enemy', when: 'always', effects: [{ kind: 'damage', mult: 1 }] },
    special: { id: 'zip_comet', name: 'Coda Cometa', description: 'Danno 120% a tutti i nemici.', target: 'allEnemies', effects: [{ kind: 'damage', mult: 1.2 }] },
  },
  // --- F4b (0.9.1) ---------------------------------------------------------------------------
  {
    id: 'comp_ottavio', name: 'Ottavio', role: 'cannoniere',
    description: 'Polpo artigliere flemmatico, un cannoncino per tentacolo. Lento a prendere la mira, ma quando spara si sente.',
    stats: { maxHp: 60, atk: 13, def: 3, spd: 5 }, chargeMax: 4,
    auto: { id: 'ottavio_shot', name: 'Cannonata', description: 'Un turno accende la miccia, quello dopo spara: danno 200%.', target: 'enemy', when: 'fuse', effects: [{ kind: 'damage', mult: 2 }] },
    special: { id: 'ottavio_broadside', name: 'Bordata', description: 'Tre colpi da 90% sul bersaglio.', target: 'enemy', effects: [{ kind: 'damage', mult: 0.9, hits: 3 }] },
  },
  {
    id: 'comp_strillo', name: 'Strillo', role: 'vedetta',
    description: 'Gabbiano di coffa che urla prima di tutti. Se un nemico carica un colpo, gli piomba addosso e glielo fa perdere.',
    stats: { maxHp: 45, atk: 10, def: 2, spd: 16 }, chargeMax: 3,
    auto: { id: 'strillo_alarm', name: 'Allarme', description: 'Colpisce chi sta caricando e gli fa perdere la carica (una volta per nemico).', target: 'enemy', when: 'enemyCharging', effects: [{ kind: 'damage', mult: 1 }] },
    special: { id: 'strillo_screech', name: 'Strilli di Coffa', description: 'Tutti i nemici Vulnerabili e Indeboliti (-25% ATT) per 2 turni.', target: 'allEnemies', effects: [{ kind: 'status', status: 'vulnerable', turns: 2 }, { kind: 'status', status: 'weak', turns: 2, value: 0.25 }] },
  },
  {
    id: 'comp_gonfio', name: 'Gonfio', role: 'difensore',
    description: 'Pesce palla permaloso: se lo guardi si gonfia. I nemici non resistono a prenderlo di mira.',
    stats: { maxHp: 90, atk: 7, def: 6, spd: 7 }, chargeMax: 3, provoke: 0.5,
    auto: { id: 'gonfio_spike', name: 'Spinata', description: 'Colpisce il bersaglio. Passiva: attira metà dei colpi normali dei nemici.', target: 'enemy', when: 'always', effects: [{ kind: 'damage', mult: 1 }] },
    special: { id: 'gonfio_puff', name: 'Gonfiata', description: 'Per 2 turni attira tutti i colpi singoli, rimanda il 40% del danno e ottiene 22 di scudo.', target: 'self', effects: [{ kind: 'status', status: 'taunt', turns: 2 }, { kind: 'status', status: 'reflect', turns: 2, value: 0.4 }, { kind: 'shield', amount: 22 }] },
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

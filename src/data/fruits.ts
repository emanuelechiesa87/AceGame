import type { Ability, Effect, FruitDef, TargetRule } from '../types/content';

/** Livello massimo del risveglio di un frutto (I → III). */
export const MAX_FRUIT_LEVEL = 3;

const lv = (id: string, name: string, description: string, cost: number, target: TargetRule, effects: Effect[]): Ability => ({ id, name, description, cost, target, effects });

/**
 * Un solo frutto per run, quindi il potere è molto forte e cresce con il
 * "Risveglio" (ricompensa dopo gli scontri): livello I → II → III.
 */

/** Frutti mistici: nomi, effetti e aspetto originali. */
export const FRUITS: FruitDef[] = [
  {
    id: 'fruit_ember', name: 'Bacca Brace', rarity: 'common', element: 'fire', color: '#ff6b3d',
    description: 'Scotta al tatto. Chi la mangia sente il fuoco nei pugni.',
    passive: { atk: 2 }, startsUnlocked: true,
    abilities: [
      lv('pw_ember', 'Pugno Brace', 'Danno 180% e brucia (5/turno) per 3 turni.', 2, 'enemy', [{ kind: 'damage', mult: 1.8 }, { kind: 'status', status: 'burn', turns: 3, value: 5 }]),
      lv('pw_ember_2', 'Pugno Brace II', 'Danno 220% e brucia (8/turno) per 3 turni.', 2, 'enemy', [{ kind: 'damage', mult: 2.2 }, { kind: 'status', status: 'burn', turns: 3, value: 8 }]),
      lv('pw_ember_3', 'Pugno Vulcano', 'Danno 180% a TUTTI i nemici e brucia (8/turno) per 3 turni.', 3, 'allEnemies', [{ kind: 'damage', mult: 1.8 }, { kind: 'status', status: 'burn', turns: 3, value: 8 }]),
    ],
  },
  {
    id: 'fruit_frost', name: 'Mela Brina', rarity: 'common', element: 'ice', color: '#5fd3ff',
    description: 'Croccante come il ghiaccio. Rallenta chiunque la guardi.',
    passive: { def: 2 }, startsUnlocked: true,
    abilities: [
      lv('pw_frost', 'Morso di Brina', 'Danno 190% e 80% di congelare per 1 turno.', 2, 'enemy', [{ kind: 'damage', mult: 1.9 }, { kind: 'status', status: 'stun', turns: 1, chance: 0.8 }]),
      lv('pw_frost_2', 'Morso di Brina II', 'Danno 230% e congela sempre per 1 turno.', 2, 'enemy', [{ kind: 'damage', mult: 2.3 }, { kind: 'status', status: 'stun', turns: 1 }]),
      lv('pw_frost_3', 'Era Glaciale', 'Danno 180% a TUTTI i nemici, 80% di congelarli.', 3, 'allEnemies', [{ kind: 'damage', mult: 1.8 }, { kind: 'status', status: 'stun', turns: 1, chance: 0.8 }]),
    ],
  },
  {
    id: 'fruit_stone', name: 'Fico Granito', rarity: 'common', element: 'stone', color: '#c8a26b',
    description: 'Pesante come un sasso. Ti fa la pelle dura.',
    passive: { maxHp: 10 }, startsUnlocked: true,
    abilities: [
      lv('pw_stone', 'Guscio di Pietra', 'Scudo 35 e corazza (+50% DIF) a tutta la squadra per 2 turni.', 2, 'allAllies', [{ kind: 'shield', amount: 35 }, { kind: 'status', status: 'defUp', turns: 2, value: 0.5 }]),
      lv('pw_stone_2', 'Guscio di Pietra II', 'Scudo 50 e corazza (+60% DIF) a tutta la squadra per 3 turni.', 2, 'allAllies', [{ kind: 'shield', amount: 50 }, { kind: 'status', status: 'defUp', turns: 3, value: 0.6 }]),
      lv('pw_stone_3', 'Fortezza di Granito', 'Scudo 70, corazza e furia (+40% ATT) a tutta la squadra per 3 turni.', 2, 'allAllies', [{ kind: 'shield', amount: 70 }, { kind: 'status', status: 'defUp', turns: 3, value: 0.7 }, { kind: 'status', status: 'atkUp', turns: 3, value: 0.4 }]),
    ],
  },
  {
    id: 'fruit_storm', name: 'Pesca Tuono', rarity: 'rare', element: 'storm', color: '#ffd94a',
    description: 'Ronza. Se la stringi, fa scintille.',
    passive: { spd: 3 }, startsUnlocked: false,
    abilities: [
      lv('pw_storm', 'Catena Tuono', 'Danno 175% a tutti i nemici.', 2, 'allEnemies', [{ kind: 'damage', mult: 1.75 }]),
      lv('pw_storm_2', 'Catena Tuono II', 'Danno 205% a tutti i nemici, 30% di paralizzarli.', 2, 'allEnemies', [{ kind: 'damage', mult: 2.05 }, { kind: 'status', status: 'stun', turns: 1, chance: 0.3 }]),
      lv('pw_storm_3', 'Tempesta Furiosa', '2 fulmini da 140% su tutti i nemici, 40% di paralizzarli.', 3, 'allEnemies', [{ kind: 'damage', mult: 1.4, hits: 2 }, { kind: 'status', status: 'stun', turns: 1, chance: 0.4 }]),
    ],
  },
  {
    id: 'fruit_life', name: 'Lampone Linfa', rarity: 'rare', element: 'life', color: '#6fe08a',
    description: 'Profuma di bosco dopo la pioggia.',
    passive: { maxHp: 6 }, startsUnlocked: false,
    abilities: [
      lv('pw_life', 'Rugiada Viva', 'Cura il 15% a tutta la squadra e +30% ATT per 2 turni.', 3, 'allAllies', [{ kind: 'heal', pctMaxHp: 0.15 }, { kind: 'status', status: 'atkUp', turns: 2, value: 0.3 }]),
      lv('pw_life_2', 'Rugiada Viva II', 'Cura il 17%, scudo 10 e furia (+35% ATT) per 2 turni a tutti.', 3, 'allAllies', [{ kind: 'heal', pctMaxHp: 0.17 }, { kind: 'shield', amount: 10 }, { kind: 'status', status: 'atkUp', turns: 2, value: 0.35 }]),
      lv('pw_life_3', 'Fioritura', 'Cura il 20%, scudo 12, furia (+50% ATT) e rimuove i malus a tutti.', 3, 'allAllies', [{ kind: 'cleanse' }, { kind: 'heal', pctMaxHp: 0.2 }, { kind: 'shield', amount: 12 }, { kind: 'status', status: 'atkUp', turns: 3, value: 0.5 }]),
    ],
  },
  {
    id: 'fruit_shadow', name: 'Susina d\'Ombra', rarity: 'epic', element: 'shadow', color: '#9b6bff',
    description: 'Non fa ombra. Nessuno sa perché.',
    passive: { atk: 3 }, startsUnlocked: false,
    abilities: [
      lv('pw_shadow', 'Taglio d\'Ombra', 'Danno 320% e vulnerabile per 2 turni.', 3, 'enemy', [{ kind: 'damage', mult: 3.2 }, { kind: 'status', status: 'vulnerable', turns: 2 }]),
      lv('pw_shadow_2', 'Taglio d\'Ombra II', 'Danno 400% e vulnerabile per 3 turni.', 3, 'enemy', [{ kind: 'damage', mult: 4 }, { kind: 'status', status: 'vulnerable', turns: 3 }]),
      lv('pw_shadow_3', 'Eclissi', 'Danno 260% a TUTTI i nemici e vulnerabili per 3 turni.', 3, 'allEnemies', [{ kind: 'damage', mult: 2.6 }, { kind: 'status', status: 'vulnerable', turns: 3 }]),
    ],
  },
  {
    id: 'fruit_spring', name: 'Gelso Molla', rarity: 'common', element: 'elastic', color: '#ff7fb0',
    description: 'Rimbalza se lo lasci cadere. Anche chi lo mangia.',
    passive: { spd: 2 }, startsUnlocked: true,
    abilities: [
      lv('pw_spring', 'Raffica Molleggiata', '5 colpi rapidi da 72% ciascuno.', 2, 'enemy', [{ kind: 'damage', mult: 0.72, hits: 5 }]),
      lv('pw_spring_2', 'Raffica Molleggiata II', '6 colpi rapidi da 75% ciascuno.', 2, 'enemy', [{ kind: 'damage', mult: 0.75, hits: 6 }]),
      lv('pw_spring_3', 'Pioggia di Molle', '4 colpi da 68% su TUTTI i nemici.', 3, 'allEnemies', [{ kind: 'damage', mult: 0.68, hits: 4 }]),
    ],
  },
  {
    id: 'fruit_mist', name: 'Nespola Nebbia', rarity: 'rare', element: 'mist', color: '#c9d6e8',
    description: 'Si sbuccia da sola e si dissolve in vapore.',
    passive: { spd: 1, def: 1 }, startsUnlocked: false,
    abilities: [
      lv('pw_mist', 'Corpo di Nebbia', 'Per 2 turni schivi il 60% dei colpi e +40% ATT.', 2, 'self', [{ kind: 'status', status: 'evade', turns: 2, value: 0.6 }, { kind: 'status', status: 'atkUp', turns: 2, value: 0.4 }]),
      lv('pw_mist_2', 'Corpo di Nebbia II', 'Per 3 turni schivi il 65% dei colpi e +60% ATT.', 2, 'self', [{ kind: 'status', status: 'evade', turns: 3, value: 0.65 }, { kind: 'status', status: 'atkUp', turns: 3, value: 0.6 }]),
      lv('pw_mist_3', 'Spettro del Porto', 'Per 3 turni schivi il 75% dei colpi e +90% ATT.', 2, 'self', [{ kind: 'status', status: 'evade', turns: 3, value: 0.75 }, { kind: 'status', status: 'atkUp', turns: 3, value: 0.9 }]),
    ],
  },
  {
    id: 'fruit_fang', name: 'Cocco Zanna', rarity: 'rare', element: 'beast', color: '#b07b4a',
    description: 'Ha il pelo. E ringhia, se lo scuoti.',
    passive: { maxHp: 8 }, startsUnlocked: false,
    abilities: [
      lv('pw_fang', 'Risveglio Bestiale', 'Per 3 turni: +120% ATT e +60% DIF.', 2, 'self', [{ kind: 'status', status: 'atkUp', turns: 3, value: 1.2 }, { kind: 'status', status: 'defUp', turns: 3, value: 0.6 }]),
      lv('pw_fang_2', 'Risveglio Bestiale II', 'Per 3 turni: +150% ATT e +70% DIF.', 2, 'self', [{ kind: 'status', status: 'atkUp', turns: 3, value: 1.5 }, { kind: 'status', status: 'defUp', turns: 3, value: 0.7 }]),
      lv('pw_fang_3', 'Re della Giungla', 'Per 4 turni: +180% ATT e +90% DIF.', 2, 'self', [{ kind: 'status', status: 'atkUp', turns: 4, value: 1.8 }, { kind: 'status', status: 'defUp', turns: 4, value: 0.9 }]),
    ],
  },
  {
    id: 'fruit_glue', name: 'Kiwi Colla', rarity: 'common', element: 'glue', color: '#a8d84a',
    description: 'Appiccica tutto. Soprattutto le dita.',
    passive: { def: 1, maxHp: 4 }, startsUnlocked: false,
    abilities: [
      lv('pw_glue', 'Rete Appiccicosa', 'Danno 120% a tutti, -50% VEL e vulnerabili per 2 turni.', 2, 'allEnemies', [{ kind: 'damage', mult: 1.2 }, { kind: 'status', status: 'slow', turns: 2, value: 0.5 }, { kind: 'status', status: 'vulnerable', turns: 2 }]),
      lv('pw_glue_2', 'Rete Appiccicosa II', 'Danno 150% a tutti, -50% VEL e vulnerabili per 3 turni.', 2, 'allEnemies', [{ kind: 'damage', mult: 1.5 }, { kind: 'status', status: 'slow', turns: 3, value: 0.5 }, { kind: 'status', status: 'vulnerable', turns: 3 }]),
      lv('pw_glue_3', 'Palude di Colla', 'Danno 180% a tutti, -60% VEL e vulnerabili per 3 turni.', 2, 'allEnemies', [{ kind: 'damage', mult: 1.8 }, { kind: 'status', status: 'slow', turns: 3, value: 0.6 }, { kind: 'status', status: 'vulnerable', turns: 3 }]),
    ],
  },
  {
    id: 'fruit_mirror', name: 'Prugna Specchio', rarity: 'rare', element: 'mirror', color: '#9fe8ff',
    description: 'Lucida come vetro. Ci vedi la tua faccia stupita.',
    passive: { def: 2 }, startsUnlocked: false,
    abilities: [
      lv('pw_mirror', 'Specchio Riflesso', 'Scudo 15 e per 2 turni chi ti colpisce subisce il 60% del colpo.', 2, 'self', [{ kind: 'shield', amount: 15 }, { kind: 'status', status: 'reflect', turns: 2, value: 0.6 }]),
      lv('pw_mirror_2', 'Specchio Riflesso II', 'Scudo 22 e per 3 turni riflette l\'80% del colpo.', 2, 'self', [{ kind: 'shield', amount: 22 }, { kind: 'status', status: 'reflect', turns: 3, value: 0.8 }]),
      lv('pw_mirror_3', 'Sala degli Specchi', 'Scudo 30, riflette il 100% e +40% ATT per 3 turni.', 2, 'self', [{ kind: 'shield', amount: 30 }, { kind: 'status', status: 'reflect', turns: 3, value: 1 }, { kind: 'status', status: 'atkUp', turns: 3, value: 0.4 }]),
    ],
  },
  {
    id: 'fruit_clock', name: 'Ananas Orologio', rarity: 'epic', element: 'time', color: '#ffcf3a',
    description: 'Ticchetta. Nessuno ha il coraggio di aprirlo.',
    passive: { spd: 2 }, startsUnlocked: false,
    abilities: [
      lv('pw_clock', 'Secondo Rintocco', 'Danno 190% e agisci subito di nuovo.', 2, 'enemy', [{ kind: 'damage', mult: 1.9 }, { kind: 'extraAction' }]),
      lv('pw_clock_2', 'Secondo Rintocco II', 'Danno 230% e agisci subito di nuovo.', 2, 'enemy', [{ kind: 'damage', mult: 2.3 }, { kind: 'extraAction' }]),
      lv('pw_clock_3', 'Mezzanotte', 'Danno 180% a TUTTI e agisci subito di nuovo.', 2, 'allEnemies', [{ kind: 'damage', mult: 1.8 }, { kind: 'extraAction' }]),
    ],
  },
  {
    id: 'fruit_magnet', name: 'Melagrana Magnete', rarity: 'common', element: 'magnet', color: '#e4342f',
    description: 'Le posate le volano addosso. Sempre.',
    passive: { atk: 1, def: 1 }, startsUnlocked: false,
    abilities: [
      lv('pw_magnet', 'Strappo Magnetico', 'Ruba lo scudo, danno 190% e vulnerabile per 2 turni.', 2, 'enemy', [{ kind: 'stealShield' }, { kind: 'damage', mult: 1.9 }, { kind: 'status', status: 'vulnerable', turns: 2 }]),
      lv('pw_magnet_2', 'Strappo Magnetico II', 'Ruba lo scudo, danno 240% e vulnerabile per 3 turni.', 2, 'enemy', [{ kind: 'stealShield' }, { kind: 'damage', mult: 2.4 }, { kind: 'status', status: 'vulnerable', turns: 3 }]),
      lv('pw_magnet_3', 'Polo Assoluto', 'Ruba gli scudi e danno 180% a TUTTI, vulnerabili per 2 turni.', 3, 'allEnemies', [{ kind: 'stealShield' }, { kind: 'damage', mult: 1.8 }, { kind: 'status', status: 'vulnerable', turns: 2 }]),
    ],
  },
];

export const FRUIT_BY_ID = new Map(FRUITS.map((f) => [f.id, f]));

/** Potere del frutto al livello di risveglio dato (1..3). */
export function fruitAbility(f: FruitDef, level: number): Ability {
  return f.abilities[Math.max(1, Math.min(MAX_FRUIT_LEVEL, Math.floor(level || 1))) - 1];
}

/** Frutto a cui appartiene un potere (per animazioni e descrizioni). */
export function fruitOfAbility(abilityId: string): FruitDef | undefined {
  return FRUITS.find((f) => f.abilities.some((a) => a.id === abilityId));
}

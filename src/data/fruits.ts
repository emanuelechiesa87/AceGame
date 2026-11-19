import type { Ability, Effect, FruitDef, TargetRule } from '../types/content';

/** Livello massimo del risveglio di un frutto (I → V). */
export const MAX_FRUIT_LEVEL = 5;

const lv = (id: string, name: string, description: string, cost: number, target: TargetRule, effects: Effect[]): Ability => ({ id, name, description, cost, target, effects });

/**
 * Un solo frutto per run, quindi il potere è molto forte e cresce con il
 * "Risveglio" (ricompensa dopo gli scontri): livello I → V. Il tetto sale
 * con le aree (vedi `AreaDef.maxFruitLevel`).
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
      lv('pw_ember_4', 'Pugno Vulcano II', 'Danno 220% a TUTTI i nemici e brucia (11/turno) per 3 turni.', 3, 'allEnemies', [{ kind: 'damage', mult: 2.2 }, { kind: 'status', status: 'burn', turns: 3, value: 11 }]),
      lv('pw_ember_5', 'Cuore di Magma', 'Danno 260% a TUTTI, brucia (15/turno) per 3 turni e vulnerabili per 2 turni.', 3, 'allEnemies', [{ kind: 'damage', mult: 2.6 }, { kind: 'status', status: 'burn', turns: 3, value: 15 }, { kind: 'status', status: 'vulnerable', turns: 2 }]),
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
      lv('pw_frost_4', 'Era Glaciale II', 'Danno 220% a TUTTI i nemici e li congela sempre per 1 turno.', 3, 'allEnemies', [{ kind: 'damage', mult: 2.2 }, { kind: 'status', status: 'stun', turns: 1 }]),
      lv('pw_frost_5', 'Zero Assoluto', 'Danno 260% a TUTTI, li congela per 1 turno e -50% VEL per 3 turni.', 3, 'allEnemies', [{ kind: 'damage', mult: 2.6 }, { kind: 'status', status: 'stun', turns: 1 }, { kind: 'status', status: 'slow', turns: 3, value: 0.5 }]),
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
      lv('pw_stone_4', 'Fortezza di Granito II', 'Scudo 90, corazza (+80% DIF) e furia (+50% ATT) a tutta la squadra per 3 turni.', 2, 'allAllies', [{ kind: 'shield', amount: 90 }, { kind: 'status', status: 'defUp', turns: 3, value: 0.8 }, { kind: 'status', status: 'atkUp', turns: 3, value: 0.5 }]),
      lv('pw_stone_5', 'Montagna Vivente', 'Scudo 120, corazza (+100% DIF) e furia (+70% ATT) a tutta la squadra per 4 turni.', 2, 'allAllies', [{ kind: 'shield', amount: 120 }, { kind: 'status', status: 'defUp', turns: 4, value: 1 }, { kind: 'status', status: 'atkUp', turns: 4, value: 0.7 }]),
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
      lv('pw_storm_4', 'Tempesta Furiosa II', '2 fulmini da 165% su tutti i nemici, 50% di paralizzarli.', 3, 'allEnemies', [{ kind: 'damage', mult: 1.65, hits: 2 }, { kind: 'status', status: 'stun', turns: 1, chance: 0.5 }]),
      lv('pw_storm_5', 'Occhio del Ciclone', '3 fulmini da 150% su tutti i nemici, 50% di paralizzarli.', 3, 'allEnemies', [{ kind: 'damage', mult: 1.5, hits: 3 }, { kind: 'status', status: 'stun', turns: 1, chance: 0.5 }]),
    ],
  },
  {
    id: 'fruit_life', name: 'Lampone Linfa', rarity: 'rare', element: 'life', color: '#6fe08a',
    description: 'Profuma di bosco dopo la pioggia.',
    passive: { def: 1 }, startsUnlocked: false,
    abilities: [
      lv('pw_life', 'Rugiada Viva', 'Cura il 14% a tutta la squadra e +30% ATT per 2 turni.', 3, 'allAllies', [{ kind: 'heal', pctMaxHp: 0.14 }, { kind: 'status', status: 'atkUp', turns: 2, value: 0.3 }]),
      lv('pw_life_2', 'Rugiada Viva II', 'Cura il 16%, scudo 8 e furia (+35% ATT) per 2 turni a tutti.', 3, 'allAllies', [{ kind: 'heal', pctMaxHp: 0.16 }, { kind: 'shield', amount: 8 }, { kind: 'status', status: 'atkUp', turns: 2, value: 0.35 }]),
      lv('pw_life_3', 'Fioritura', 'Cura il 18%, scudo 9, furia (+50% ATT) e rimuove i malus a tutti.', 3, 'allAllies', [{ kind: 'cleanse' }, { kind: 'heal', pctMaxHp: 0.18 }, { kind: 'shield', amount: 9 }, { kind: 'status', status: 'atkUp', turns: 3, value: 0.5 }]),
      lv('pw_life_4', 'Fioritura II', 'Cura il 20%, scudo 13, furia (+50% ATT) e rimuove i malus a tutti.', 3, 'allAllies', [{ kind: 'cleanse' }, { kind: 'heal', pctMaxHp: 0.2 }, { kind: 'shield', amount: 13 }, { kind: 'status', status: 'atkUp', turns: 3, value: 0.5 }]),
      lv('pw_life_5', 'Primavera Eterna', 'Cura il 22%, scudo 18, furia (+60% ATT) e rimuove i malus a tutti.', 3, 'allAllies', [{ kind: 'cleanse' }, { kind: 'heal', pctMaxHp: 0.22 }, { kind: 'shield', amount: 18 }, { kind: 'status', status: 'atkUp', turns: 3, value: 0.6 }]),
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
      lv('pw_shadow_4', 'Eclissi II', 'Danno 320% a TUTTI i nemici e vulnerabili per 3 turni.', 3, 'allEnemies', [{ kind: 'damage', mult: 3.2 }, { kind: 'status', status: 'vulnerable', turns: 3 }]),
      lv('pw_shadow_5', 'Notte Senza Luna', 'Danno 400% a TUTTI i nemici e vulnerabili per 4 turni.', 3, 'allEnemies', [{ kind: 'damage', mult: 4 }, { kind: 'status', status: 'vulnerable', turns: 4 }]),
    ],
  },
  {
    id: 'fruit_spring', name: 'Gelso Molla', rarity: 'common', element: 'elastic', color: '#ff7fb0',
    description: 'Rimbalza se lo lasci cadere. Anche chi lo mangia.',
    passive: { spd: 2, atk: 1, maxHp: 8 }, startsUnlocked: true,
    abilities: [
      lv('pw_spring', 'Raffica Molleggiata', '5 colpi rapidi da 72% ciascuno.', 2, 'enemy', [{ kind: 'damage', mult: 0.72, hits: 5 }]),
      lv('pw_spring_2', 'Raffica Molleggiata II', '6 colpi rapidi da 75% ciascuno.', 2, 'enemy', [{ kind: 'damage', mult: 0.75, hits: 6 }]),
      lv('pw_spring_3', 'Pioggia di Molle', '4 colpi da 68% su TUTTI i nemici.', 3, 'allEnemies', [{ kind: 'damage', mult: 0.68, hits: 4 }]),
      lv('pw_spring_4', 'Pioggia di Molle II', '5 colpi da 70% su TUTTI i nemici.', 3, 'allEnemies', [{ kind: 'damage', mult: 0.7, hits: 5 }]),
      lv('pw_spring_5', 'Tempesta Elastica', '6 colpi da 76% su TUTTI i nemici.', 3, 'allEnemies', [{ kind: 'damage', mult: 0.76, hits: 6 }]),
    ],
  },
  {
    id: 'fruit_mist', name: 'Nespola Nebbia', rarity: 'rare', element: 'mist', color: '#c9d6e8',
    description: 'Si sbuccia da sola e si dissolve in vapore.',
    passive: { spd: 1, def: 2, atk: 2, maxHp: 6 }, startsUnlocked: false,
    abilities: [
      lv('pw_mist', 'Corpo di Nebbia', 'Per 2 turni schivi il 60% dei colpi e +40% ATT.', 2, 'self', [{ kind: 'status', status: 'evade', turns: 2, value: 0.6 }, { kind: 'status', status: 'atkUp', turns: 2, value: 0.4 }]),
      lv('pw_mist_2', 'Corpo di Nebbia II', 'Per 3 turni schivi il 65% dei colpi e +60% ATT.', 2, 'self', [{ kind: 'status', status: 'evade', turns: 3, value: 0.65 }, { kind: 'status', status: 'atkUp', turns: 3, value: 0.6 }]),
      lv('pw_mist_3', 'Spettro del Porto', 'Per 3 turni schivi il 75% dei colpi e +100% ATT.', 2, 'self', [{ kind: 'status', status: 'evade', turns: 3, value: 0.75 }, { kind: 'status', status: 'atkUp', turns: 3, value: 1 }]),
      lv('pw_mist_4', 'Spettro del Porto II', 'Per 4 turni schivi il 78% dei colpi e +135% ATT.', 2, 'self', [{ kind: 'status', status: 'evade', turns: 4, value: 0.78 }, { kind: 'status', status: 'atkUp', turns: 4, value: 1.35 }]),
      lv('pw_mist_5', 'Fantasma dell\'Abisso', 'Per 4 turni schivi l\'80% dei colpi e +170% ATT.', 2, 'self', [{ kind: 'status', status: 'evade', turns: 4, value: 0.8 }, { kind: 'status', status: 'atkUp', turns: 4, value: 1.7 }]),
    ],
  },
  {
    id: 'fruit_fang', name: 'Cocco Zanna', rarity: 'rare', element: 'beast', color: '#b07b4a',
    description: 'Ha il pelo. E ringhia, se lo scuoti.',
    passive: { maxHp: 15, def: 2 }, startsUnlocked: false,
    abilities: [
      lv('pw_fang', 'Risveglio Bestiale', 'Per 3 turni: +120% ATT e +60% DIF.', 2, 'self', [{ kind: 'status', status: 'atkUp', turns: 3, value: 1.2 }, { kind: 'status', status: 'defUp', turns: 3, value: 0.6 }]),
      lv('pw_fang_2', 'Risveglio Bestiale II', 'Per 3 turni: +150% ATT e +70% DIF.', 2, 'self', [{ kind: 'status', status: 'atkUp', turns: 3, value: 1.5 }, { kind: 'status', status: 'defUp', turns: 3, value: 0.7 }]),
      lv('pw_fang_3', 'Re della Giungla', 'Per 4 turni: +180% ATT e +90% DIF.', 2, 'self', [{ kind: 'status', status: 'atkUp', turns: 4, value: 1.8 }, { kind: 'status', status: 'defUp', turns: 4, value: 0.9 }]),
      lv('pw_fang_4', 'Re della Giungla II', 'Per 4 turni: +220% ATT e +110% DIF.', 2, 'self', [{ kind: 'status', status: 'atkUp', turns: 4, value: 2.2 }, { kind: 'status', status: 'defUp', turns: 4, value: 1.1 }]),
      lv('pw_fang_5', 'Bestia Primordiale', 'Scudo 30 e per 4 turni: +260% ATT e +130% DIF.', 2, 'self', [{ kind: 'shield', amount: 30 }, { kind: 'status', status: 'atkUp', turns: 4, value: 2.6 }, { kind: 'status', status: 'defUp', turns: 4, value: 1.3 }]),
    ],
  },
  {
    id: 'fruit_glue', name: 'Kiwi Colla', rarity: 'common', element: 'glue', color: '#a8d84a',
    description: 'Appiccica tutto. Soprattutto le dita.',
    passive: { def: 1 }, startsUnlocked: true,
    abilities: [
      lv('pw_glue', 'Rete Appiccicosa', 'Danno 120% a tutti, -50% VEL e vulnerabili per 2 turni.', 2, 'allEnemies', [{ kind: 'damage', mult: 1.2 }, { kind: 'status', status: 'slow', turns: 2, value: 0.5 }, { kind: 'status', status: 'vulnerable', turns: 2 }]),
      lv('pw_glue_2', 'Rete Appiccicosa II', 'Danno 150% a tutti, -50% VEL e vulnerabili per 3 turni.', 2, 'allEnemies', [{ kind: 'damage', mult: 1.5 }, { kind: 'status', status: 'slow', turns: 3, value: 0.5 }, { kind: 'status', status: 'vulnerable', turns: 3 }]),
      lv('pw_glue_3', 'Palude di Colla', 'Danno 180% a tutti, -60% VEL e vulnerabili per 3 turni.', 2, 'allEnemies', [{ kind: 'damage', mult: 1.8 }, { kind: 'status', status: 'slow', turns: 3, value: 0.6 }, { kind: 'status', status: 'vulnerable', turns: 3 }]),
      lv('pw_glue_4', 'Palude di Colla II', 'Danno 215% a tutti, -60% VEL e vulnerabili per 4 turni.', 2, 'allEnemies', [{ kind: 'damage', mult: 2.15 }, { kind: 'status', status: 'slow', turns: 4, value: 0.6 }, { kind: 'status', status: 'vulnerable', turns: 4 }]),
      lv('pw_glue_5', 'Mare di Colla', 'Danno 250% a tutti, -70% VEL, vulnerabili per 4 turni e 30% di bloccarli.', 2, 'allEnemies', [{ kind: 'damage', mult: 2.5 }, { kind: 'status', status: 'slow', turns: 4, value: 0.7 }, { kind: 'status', status: 'vulnerable', turns: 4 }, { kind: 'status', status: 'stun', turns: 1, chance: 0.3 }]),
    ],
  },
  {
    id: 'fruit_mirror', name: 'Prugna Specchio', rarity: 'rare', element: 'mirror', color: '#9fe8ff',
    description: 'Lucida come vetro. Ci vedi la tua faccia stupita.',
    passive: { def: 3, maxHp: 8 }, startsUnlocked: false,
    abilities: [
      lv('pw_mirror', 'Specchio Riflesso', 'Scudo 15 e per 2 turni chi ti colpisce subisce il 60% del colpo.', 2, 'self', [{ kind: 'shield', amount: 15 }, { kind: 'status', status: 'reflect', turns: 2, value: 0.6 }]),
      lv('pw_mirror_2', 'Specchio Riflesso II', 'Scudo 22 e per 3 turni riflette l\'80% del colpo.', 2, 'self', [{ kind: 'shield', amount: 22 }, { kind: 'status', status: 'reflect', turns: 3, value: 0.8 }]),
      lv('pw_mirror_3', 'Sala degli Specchi', 'Scudo 30, riflette il 100% e +40% ATT per 3 turni.', 2, 'self', [{ kind: 'shield', amount: 30 }, { kind: 'status', status: 'reflect', turns: 3, value: 1 }, { kind: 'status', status: 'atkUp', turns: 3, value: 0.4 }]),
      lv('pw_mirror_4', 'Sala degli Specchi II', 'Scudo 40, riflette il 120% e +60% ATT per 3 turni.', 2, 'self', [{ kind: 'shield', amount: 40 }, { kind: 'status', status: 'reflect', turns: 3, value: 1.2 }, { kind: 'status', status: 'atkUp', turns: 3, value: 0.6 }]),
      lv('pw_mirror_5', 'Labirinto di Cristallo', 'Scudo 55, riflette il 150% e +80% ATT per 4 turni.', 2, 'self', [{ kind: 'shield', amount: 55 }, { kind: 'status', status: 'reflect', turns: 4, value: 1.5 }, { kind: 'status', status: 'atkUp', turns: 4, value: 0.8 }]),
    ],
  },
  {
    id: 'fruit_clock', name: 'Ananas Orologio', rarity: 'epic', element: 'time', color: '#ffcf3a',
    description: 'Ticchetta. Nessuno ha il coraggio di aprirlo.',
    passive: { spd: 2, maxHp: 10 }, startsUnlocked: false,
    abilities: [
      lv('pw_clock', 'Secondo Rintocco', 'Danno 190% e agisci subito di nuovo.', 2, 'enemy', [{ kind: 'damage', mult: 1.9 }, { kind: 'extraAction' }]),
      lv('pw_clock_2', 'Secondo Rintocco II', 'Danno 230% e agisci subito di nuovo.', 2, 'enemy', [{ kind: 'damage', mult: 2.3 }, { kind: 'extraAction' }]),
      lv('pw_clock_3', 'Mezzanotte', 'Danno 180% a TUTTI e agisci subito di nuovo.', 2, 'allEnemies', [{ kind: 'damage', mult: 1.8 }, { kind: 'extraAction' }]),
      lv('pw_clock_4', 'Mezzanotte II', 'Danno 220% a TUTTI e agisci subito di nuovo.', 2, 'allEnemies', [{ kind: 'damage', mult: 2.2 }, { kind: 'extraAction' }]),
      lv('pw_clock_5', 'Fine del Tempo', 'Danno 260% a TUTTI, -50% VEL per 2 turni e agisci subito di nuovo.', 2, 'allEnemies', [{ kind: 'damage', mult: 2.6 }, { kind: 'status', status: 'slow', turns: 2, value: 0.5 }, { kind: 'extraAction' }]),
    ],
  },
  {
    id: 'fruit_magnet', name: 'Melagrana Magnete', rarity: 'common', element: 'magnet', color: '#e4342f',
    description: 'Le posate le volano addosso. Sempre.',
    passive: { atk: 2, def: 1, maxHp: 6 }, startsUnlocked: true,
    abilities: [
      lv('pw_magnet', 'Strappo Magnetico', 'Ruba lo scudo, danno 190% e vulnerabile per 2 turni.', 2, 'enemy', [{ kind: 'stealShield' }, { kind: 'damage', mult: 1.9 }, { kind: 'status', status: 'vulnerable', turns: 2 }]),
      lv('pw_magnet_2', 'Strappo Magnetico II', 'Ruba lo scudo, danno 240% e vulnerabile per 3 turni.', 2, 'enemy', [{ kind: 'stealShield' }, { kind: 'damage', mult: 2.4 }, { kind: 'status', status: 'vulnerable', turns: 3 }]),
      lv('pw_magnet_3', 'Polo Assoluto', 'Ruba gli scudi e danno 180% a TUTTI, vulnerabili per 2 turni.', 3, 'allEnemies', [{ kind: 'stealShield' }, { kind: 'damage', mult: 1.8 }, { kind: 'status', status: 'vulnerable', turns: 2 }]),
      lv('pw_magnet_4', 'Polo Assoluto II', 'Ruba gli scudi e danno 220% a TUTTI, vulnerabili per 3 turni.', 3, 'allEnemies', [{ kind: 'stealShield' }, { kind: 'damage', mult: 2.2 }, { kind: 'status', status: 'vulnerable', turns: 3 }]),
      lv('pw_magnet_5', 'Campo Gravitazionale', 'Ruba gli scudi, danno 260% a TUTTI, vulnerabili per 3 turni e 30% di bloccarli.', 3, 'allEnemies', [{ kind: 'stealShield' }, { kind: 'damage', mult: 2.6 }, { kind: 'status', status: 'vulnerable', turns: 3 }, { kind: 'status', status: 'stun', turns: 1, chance: 0.3 }]),
    ],
  },
  // --- dalla 0.5.5 (fase 4 della 0.6): 7 frutti con meccaniche nuove -----------------------------
  {
    id: 'fruit_blood', name: 'Fragola Vampira', rarity: 'common', element: 'blood', color: '#e8304f',
    description: 'Ha due semi più lunghi degli altri. Sembrano canini.',
    passive: { atk: 2, maxHp: 12 }, startsUnlocked: false,
    abilities: [
      lv('pw_blood', 'Morso Vampiro', 'Danno 190% e ti curi del 60% del danno inflitto.', 2, 'enemy', [{ kind: 'damage', mult: 1.9, lifesteal: 0.6 }]),
      lv('pw_blood_2', 'Morso Vampiro II', 'Danno 230% e ti curi del 70% del danno inflitto.', 2, 'enemy', [{ kind: 'damage', mult: 2.3, lifesteal: 0.7 }]),
      lv('pw_blood_3', 'Banchetto Rosso', 'Danno 170% a TUTTI e ti curi del 40% del danno inflitto.', 3, 'allEnemies', [{ kind: 'damage', mult: 1.7, lifesteal: 0.4 }]),
      lv('pw_blood_4', 'Banchetto Rosso II', 'Danno 210% a TUTTI e ti curi del 45% del danno inflitto.', 3, 'allEnemies', [{ kind: 'damage', mult: 2.1, lifesteal: 0.45 }]),
      lv('pw_blood_5', 'Notte Cremisi', 'Danno 250% a TUTTI, ti curi del 50% del danno e vulnerabili per 2 turni.', 3, 'allEnemies', [{ kind: 'damage', mult: 2.5, lifesteal: 0.5 }, { kind: 'status', status: 'vulnerable', turns: 2 }]),
    ],
  },
  {
    id: 'fruit_stench', name: 'Durian Tanfo', rarity: 'common', element: 'stench', color: '#c9c23a',
    description: 'Si sente da tre isole di distanza. I gabbiani svengono.',
    passive: { spd: 1 }, startsUnlocked: false,
    abilities: [
      lv('pw_stench', 'Nube Puzzolente', 'Danno 100% a TUTTI, veleno (4/turno) per 3 turni e -20% ATT per 2 turni.', 2, 'allEnemies', [{ kind: 'damage', mult: 1 }, { kind: 'status', status: 'poison', turns: 3, value: 4 }, { kind: 'status', status: 'weak', turns: 2, value: 0.2 }]),
      lv('pw_stench_2', 'Nube Puzzolente II', 'Danno 120% a TUTTI, veleno (6/turno) per 3 turni e -25% ATT per 3 turni.', 2, 'allEnemies', [{ kind: 'damage', mult: 1.2 }, { kind: 'status', status: 'poison', turns: 3, value: 6 }, { kind: 'status', status: 'weak', turns: 3, value: 0.25 }]),
      lv('pw_stench_3', 'Miasma', 'Danno 150% a TUTTI, veleno (7/turno) per 3 turni e -30% ATT per 3 turni.', 3, 'allEnemies', [{ kind: 'damage', mult: 1.5 }, { kind: 'status', status: 'poison', turns: 3, value: 7 }, { kind: 'status', status: 'weak', turns: 3, value: 0.3 }]),
      lv('pw_stench_4', 'Miasma II', 'Danno 180% a TUTTI, veleno (8/turno) per 3 turni e -35% ATT per 3 turni.', 3, 'allEnemies', [{ kind: 'damage', mult: 1.8 }, { kind: 'status', status: 'poison', turns: 3, value: 8 }, { kind: 'status', status: 'weak', turns: 3, value: 0.35 }]),
      lv('pw_stench_5', 'Tanfo Leggendario', 'Danno 220% a TUTTI, veleno (10/turno) per 4 turni, -40% ATT per 3 turni e -30% VEL.', 3, 'allEnemies', [{ kind: 'damage', mult: 2.2 }, { kind: 'status', status: 'poison', turns: 4, value: 10 }, { kind: 'status', status: 'weak', turns: 3, value: 0.4 }, { kind: 'status', status: 'slow', turns: 2, value: 0.3 }]),
    ],
  },
  {
    id: 'fruit_acid', name: 'Limone Acido', rarity: 'rare', element: 'acid', color: '#e6f04a',
    description: 'Una goccia buca il ponte. Due bucano la stiva.',
    passive: { atk: 2 }, startsUnlocked: false,
    abilities: [
      lv('pw_acid', 'Spruzzo Acido', 'Scioglie lo scudo, danno 170% e acido per 3 turni: 6 danni che crescono ogni turno, DIF annullata.', 2, 'enemy', [{ kind: 'meltShield' }, { kind: 'damage', mult: 1.7 }, { kind: 'status', status: 'acid', turns: 3, value: 6 }]),
      lv('pw_acid_2', 'Spruzzo Acido II', 'Scioglie lo scudo, danno 210% e acido (9, cresce ogni turno) per 3 turni.', 2, 'enemy', [{ kind: 'meltShield' }, { kind: 'damage', mult: 2.1 }, { kind: 'status', status: 'acid', turns: 3, value: 9 }]),
      lv('pw_acid_3', 'Pioggia Acida', 'Scioglie gli scudi, danno 150% a TUTTI e acido (9, cresce) per 3 turni.', 3, 'allEnemies', [{ kind: 'meltShield' }, { kind: 'damage', mult: 1.5 }, { kind: 'status', status: 'acid', turns: 3, value: 9 }]),
      lv('pw_acid_4', 'Pioggia Acida II', 'Scioglie gli scudi, danno 185% a TUTTI e acido (10, cresce) per 3 turni.', 3, 'allEnemies', [{ kind: 'meltShield' }, { kind: 'damage', mult: 1.85 }, { kind: 'status', status: 'acid', turns: 3, value: 10 }]),
      lv('pw_acid_5', 'Diluvio Corrosivo', 'Scioglie gli scudi, danno 220% a TUTTI, acido (12, cresce) per 4 turni e vulnerabili per 2 turni.', 3, 'allEnemies', [{ kind: 'meltShield' }, { kind: 'damage', mult: 2.2 }, { kind: 'status', status: 'acid', turns: 4, value: 12 }, { kind: 'status', status: 'vulnerable', turns: 2 }]),
    ],
  },
  {
    id: 'fruit_bubble', name: 'Arancia Bolla', rarity: 'rare', element: 'bubble', color: '#ff9a2a',
    description: 'Se la sbucci, ne escono bolle. Tante. Troppe.',
    passive: { spd: 1 }, startsUnlocked: false,
    abilities: [
      lv('pw_bubble', 'Bolla Prigione', 'Danno 120% e chiude il nemico in una bolla per 1 turno; poi scoppia (100%).', 2, 'enemy', [{ kind: 'damage', mult: 1.2 }, { kind: 'bubble', turns: 1, popMult: 1 }]),
      lv('pw_bubble_2', 'Bolla Prigione II', 'Danno 145%, bolla per 2 turni, poi scoppia (110%). I boss restano nella bolla 1 turno.', 2, 'enemy', [{ kind: 'damage', mult: 1.45 }, { kind: 'bubble', turns: 2, popMult: 1.1 }]),
      lv('pw_bubble_3', 'Mare di Bolle', 'Danno 110% a TUTTI e li chiude in bolle per 1 turno; poi scoppiano (80%).', 3, 'allEnemies', [{ kind: 'damage', mult: 1.1 }, { kind: 'bubble', turns: 1, popMult: 0.8 }]),
      lv('pw_bubble_4', 'Mare di Bolle II', 'Danno 140% a TUTTI, bolle per 1 turno, poi scoppiano (105%).', 3, 'allEnemies', [{ kind: 'damage', mult: 1.4 }, { kind: 'bubble', turns: 1, popMult: 1.05 }]),
      lv('pw_bubble_5', 'Bolla Oceanica', 'Danno 160% a TUTTI, bolle per 2 turni (boss 1), poi scoppiano (120%).', 3, 'allEnemies', [{ kind: 'damage', mult: 1.6 }, { kind: 'bubble', turns: 2, popMult: 1.2 }]),
    ],
  },
  {
    id: 'fruit_mine', name: 'Anguria Mina', rarity: 'rare', element: 'mine', color: '#3fae4a',
    description: 'I semi ticchettano. Meglio non sputarli vicino a qualcuno.',
    passive: { maxHp: 14, def: 1 }, startsUnlocked: false,
    abilities: [
      lv('pw_mine', 'Seme-Mina', 'Pianta una mina: all\'inizio del suo prossimo turno il nemico esplode (danno 320%).', 2, 'enemy', [{ kind: 'mine', mult: 3.2 }]),
      lv('pw_mine_2', 'Seme-Mina II', 'Mina da 400% sul nemico: esplode all\'inizio del suo prossimo turno.', 2, 'enemy', [{ kind: 'mine', mult: 4 }]),
      lv('pw_mine_3', 'Campo Minato', 'Una mina da 290% sotto OGNI nemico.', 3, 'allEnemies', [{ kind: 'mine', mult: 2.9 }]),
      lv('pw_mine_4', 'Campo Minato II', 'Una mina da 360% sotto OGNI nemico.', 3, 'allEnemies', [{ kind: 'mine', mult: 3.6 }]),
      lv('pw_mine_5', 'Anguria Atomica', 'Una mina da 450% sotto OGNI nemico, che intanto rallenta (-30% VEL).', 3, 'allEnemies', [{ kind: 'mine', mult: 4.5 }, { kind: 'status', status: 'slow', turns: 2, value: 0.3 }]),
    ],
  },
  {
    id: 'fruit_swarm', name: 'Uva Sciame', rarity: 'epic', element: 'swarm', color: '#8a52e0',
    description: 'Gli acini si staccano da soli e ronzano come api.',
    passive: { atk: 2, spd: 1 }, startsUnlocked: false,
    abilities: [
      lv('pw_swarm', 'Grappolo', 'Danno 110% e +3 acini (max 6): a fine turno ognuno colpisce (35%). Ogni colpo che subisci ne fa scoppiare uno.', 2, 'enemy', [{ kind: 'damage', mult: 1.1 }, { kind: 'swarm', count: 3, mult: 0.35, max: 6 }]),
      lv('pw_swarm_2', 'Grappolo II', 'Danno 130% e +3 acini (max 6), ognuno colpisce per il 40%.', 2, 'enemy', [{ kind: 'damage', mult: 1.3 }, { kind: 'swarm', count: 3, mult: 0.4, max: 6 }]),
      lv('pw_swarm_3', 'Vendemmia', 'Danno 120% a TUTTI e +4 acini (max 8), ognuno colpisce per il 40%.', 3, 'allEnemies', [{ kind: 'damage', mult: 1.2 }, { kind: 'swarm', count: 4, mult: 0.4, max: 8 }]),
      lv('pw_swarm_4', 'Vendemmia II', 'Danno 150% a TUTTI e +4 acini (max 8), ognuno colpisce per il 45%.', 3, 'allEnemies', [{ kind: 'damage', mult: 1.5 }, { kind: 'swarm', count: 4, mult: 0.45, max: 8 }]),
      lv('pw_swarm_5', 'Tempesta di Chicchi', 'Danno 180% a TUTTI e +5 acini (max 10), ognuno colpisce per il 50%.', 3, 'allEnemies', [{ kind: 'damage', mult: 1.8 }, { kind: 'swarm', count: 5, mult: 0.5, max: 10 }]),
    ],
  },
  {
    id: 'fruit_twin', name: 'Ciliegia Gemella', rarity: 'epic', element: 'twin', color: '#e8264a',
    description: 'Due ciliegie, un picciolo. Chi la mangia non è più solo.',
    passive: { atk: 3, def: 1, maxHp: 8 }, startsUnlocked: false,
    abilities: [
      lv('pw_twin', 'Doppio', 'Danno 140% e una gemella ti affianca per 3 turni: ripete attacchi e poteri al 50%.', 2, 'enemy', [{ kind: 'twin', turns: 3, ratio: 0.5 }, { kind: 'damage', mult: 1.4 }]),
      lv('pw_twin_2', 'Doppio II', 'Danno 170% e gemella per 3 turni al 60%.', 2, 'enemy', [{ kind: 'twin', turns: 3, ratio: 0.6 }, { kind: 'damage', mult: 1.7 }]),
      lv('pw_twin_3', 'Sorelle Ciliegia', 'Danno 130% a TUTTI e gemella per 3 turni al 70%.', 3, 'allEnemies', [{ kind: 'twin', turns: 3, ratio: 0.7 }, { kind: 'damage', mult: 1.3 }]),
      lv('pw_twin_4', 'Sorelle Ciliegia II', 'Danno 160% a TUTTI e gemella per 4 turni all\'80%.', 3, 'allEnemies', [{ kind: 'twin', turns: 4, ratio: 0.8 }, { kind: 'damage', mult: 1.6 }]),
      lv('pw_twin_5', 'Legione Gemella', 'Danno 190% a TUTTI e gemella per 4 turni al 100%: ogni colpo vale doppio.', 3, 'allEnemies', [{ kind: 'twin', turns: 4, ratio: 1 }, { kind: 'damage', mult: 1.9 }]),
    ],
  },
];

export const FRUIT_BY_ID = new Map(FRUITS.map((f) => [f.id, f]));

/** Potere del frutto al livello di risveglio dato (1..5). */
export function fruitAbility(f: FruitDef, level: number): Ability {
  return f.abilities[Math.max(1, Math.min(MAX_FRUIT_LEVEL, Math.floor(level || 1))) - 1];
}

/** Frutto a cui appartiene un potere (per animazioni e descrizioni). */
export function fruitOfAbility(abilityId: string): FruitDef | undefined {
  return FRUITS.find((f) => f.abilities.some((a) => a.id === abilityId));
}

import type { Ability, Effect, FruitDef, TargetRule } from '../types/content';

/**
 * F5 (0.10.0) — Strade dei frutti. Al Risveglio III si sceglie tra la strada A
 * (i livelli III-V di `FruitDef.abilities`, quasi sempre "ampia") e la strada B
 * qui sotto (quasi sempre "mirata" o con un'idea diversa). Poteri: III, IV, V.
 */
const lv = (id: string, name: string, description: string, cost: number, target: TargetRule, effects: Effect[]): Ability => ({ id, name, description, cost, target, effects });
type B = { a: string; b: { name: string; abilities: [Ability, Ability, Ability] } };

export const FRUIT_BRANCHES: Record<string, B> = {
  fruit_ember: { a: 'Vulcano', b: { name: 'Sole Nero', abilities: [
    lv('pwb_ember_3', 'Pugno Fornace', 'Danno 320% a un nemico e brucia (12/turno) per 3 turni.', 3, 'enemy', [{ kind: 'damage', mult: 3.2 }, { kind: 'status', status: 'burn', turns: 3, value: 12 }]),
    lv('pwb_ember_4', 'Pugno Fornace II', 'Danno 380% a un nemico e brucia (16/turno) per 3 turni.', 3, 'enemy', [{ kind: 'damage', mult: 3.8 }, { kind: 'status', status: 'burn', turns: 3, value: 16 }]),
    lv('pwb_ember_5', 'Sole Nero', 'Danno 460% a un nemico, brucia (22/turno) per 3 turni e vulnerabile per 2 turni.', 3, 'enemy', [{ kind: 'status', status: 'vulnerable', turns: 2 }, { kind: 'damage', mult: 4.6 }, { kind: 'status', status: 'burn', turns: 3, value: 22 }]),
  ] } },
  fruit_frost: { a: 'Era Glaciale', b: { name: 'Prigione di Ghiaccio', abilities: [
    lv('pwb_frost_3', 'Gabbia di Brina', 'Danno 210% a un nemico e lo congela per 2 turni (boss e Capibanda 1).', 3, 'enemy', [{ kind: 'damage', mult: 2.1 }, { kind: 'status', status: 'stun', turns: 2 }]),
    lv('pwb_frost_4', 'Gabbia di Brina II', 'Danno 250% a un nemico e lo congela per 2 turni (boss e Capibanda 1).', 3, 'enemy', [{ kind: 'damage', mult: 2.5 }, { kind: 'status', status: 'stun', turns: 2 }]),
    lv('pwb_frost_5', 'Prigione di Ghiaccio', 'Danno 310% a un nemico, congelato 2 turni (boss e Capibanda 1), vulnerabile e -50% VEL per 3 turni.', 3, 'enemy', [{ kind: 'status', status: 'vulnerable', turns: 3 }, { kind: 'damage', mult: 3.1 }, { kind: 'status', status: 'stun', turns: 2 }, { kind: 'status', status: 'slow', turns: 3, value: 0.5 }]),
  ] } },
  fruit_stone: { a: 'Fortezza', b: { name: 'Valanga', abilities: [
    lv('pwb_stone_3', 'Frana', 'Scudo 30 a te e massi: danno 190% a TUTTI i nemici.', 2, 'self', [{ kind: 'shield', amount: 30 }, { kind: 'shockwave', mult: 1.9 }]),
    lv('pwb_stone_4', 'Frana II', 'Scudo 40 a te e massi: danno 230% a TUTTI i nemici.', 2, 'self', [{ kind: 'shield', amount: 40 }, { kind: 'shockwave', mult: 2.3 }]),
    lv('pwb_stone_5', 'Valanga', 'Scudo 55 e +50% DIF a te per 3 turni, massi: danno 280% a TUTTI i nemici.', 2, 'self', [{ kind: 'shield', amount: 55 }, { kind: 'status', status: 'defUp', turns: 3, value: 0.5 }, { kind: 'shockwave', mult: 2.8 }]),
  ] } },
  fruit_storm: { a: 'Tempesta', b: { name: 'Saetta', abilities: [
    lv('pwb_storm_3', 'Saetta', 'Un fulmine da 330% su un nemico: lo paralizza sempre.', 3, 'enemy', [{ kind: 'damage', mult: 3.3 }, { kind: 'status', status: 'stun', turns: 1 }]),
    lv('pwb_storm_4', 'Saetta II', 'Un fulmine da 380% su un nemico: lo paralizza sempre.', 3, 'enemy', [{ kind: 'damage', mult: 3.8 }, { kind: 'status', status: 'stun', turns: 1 }]),
    lv('pwb_storm_5', 'Saetta Divina', 'Un fulmine da 450% su un nemico: paralizzato e vulnerabile per 2 turni.', 3, 'enemy', [{ kind: 'status', status: 'vulnerable', turns: 2 }, { kind: 'damage', mult: 4.5 }, { kind: 'status', status: 'stun', turns: 1 }]),
  ] } },
  fruit_life: { a: 'Primavera', b: { name: 'Rovo', abilities: [
    lv('pwb_life_3', 'Rovo', 'Cura il 15% a tutta la squadra e spine: danno 160% a TUTTI i nemici.', 3, 'allAllies', [{ kind: 'heal', pctMaxHp: 0.15 }, { kind: 'shockwave', mult: 1.6 }]),
    lv('pwb_life_4', 'Rovo II', 'Cura il 17% a tutta la squadra e spine: danno 200% a TUTTI i nemici.', 3, 'allAllies', [{ kind: 'heal', pctMaxHp: 0.17 }, { kind: 'shockwave', mult: 2.0 }]),
    lv('pwb_life_5', 'Bosco Spinato', 'Cura il 20% e rimuove i malus a tutta la squadra, spine: danno 250% a TUTTI i nemici.', 3, 'allAllies', [{ kind: 'cleanse' }, { kind: 'heal', pctMaxHp: 0.2 }, { kind: 'shockwave', mult: 2.5 }]),
  ] } },
  fruit_shadow: { a: 'Eclissi', b: { name: "Lama d'Ombra", abilities: [
    lv('pwb_shadow_3', "Lama d'Ombra", 'Danno 450% a un nemico, ignora lo scudo. Se lo uccidi: +2⚡.', 3, 'enemy', [{ kind: 'damage', mult: 4.5, pierce: true }, { kind: 'energyOnKill', amount: 2 }]),
    lv('pwb_shadow_4', "Lama d'Ombra II", 'Danno 550% a un nemico, ignora lo scudo. Se lo uccidi: +2⚡.', 3, 'enemy', [{ kind: 'damage', mult: 5.5, pierce: true }, { kind: 'energyOnKill', amount: 2 }]),
    lv('pwb_shadow_5', 'Taglio del Vuoto', 'Danno 700% a un nemico, ignora lo scudo. Se lo uccidi: +3⚡.', 3, 'enemy', [{ kind: 'damage', mult: 7, pierce: true }, { kind: 'energyOnKill', amount: 3 }]),
  ] } },
  fruit_spring: { a: 'Pioggia di Molle', b: { name: 'Molla Carica', abilities: [
    lv('pwb_spring_3', 'Molla Carica', '7 colpi rapidi da 70% su un nemico.', 3, 'enemy', [{ kind: 'damage', mult: 0.7, hits: 7 }]),
    lv('pwb_spring_4', 'Molla Carica II', '8 colpi rapidi da 75% su un nemico.', 3, 'enemy', [{ kind: 'damage', mult: 0.75, hits: 8 }]),
    lv('pwb_spring_5', 'Molla Infinita', '10 colpi rapidi da 80% su un nemico.', 3, 'enemy', [{ kind: 'damage', mult: 0.8, hits: 10 }]),
  ] } },
  fruit_mist: { a: 'Spettro', b: { name: 'Nebbia Fitta', abilities: [
    lv('pwb_mist_3', 'Nebbia Fitta', 'Tutta la squadra schiva il 45% dei colpi e +30% ATT per 2 turni. Nebbia Tagliente: danno 50% a tutti i nemici.', 2, 'allAllies', [{ kind: 'status', status: 'evade', turns: 2, value: 0.45 }, { kind: 'status', status: 'atkUp', turns: 2, value: 0.3 }, { kind: 'shockwave', mult: 0.5 }]),
    lv('pwb_mist_4', 'Nebbia Fitta II', 'Tutta la squadra schiva il 50% dei colpi e +40% ATT per 3 turni. Nebbia Tagliente: danno 65% a tutti i nemici.', 2, 'allAllies', [{ kind: 'status', status: 'evade', turns: 3, value: 0.5 }, { kind: 'status', status: 'atkUp', turns: 3, value: 0.4 }, { kind: 'shockwave', mult: 0.65 }]),
    lv('pwb_mist_5', 'Banco di Nebbia', 'Tutta la squadra schiva il 55% dei colpi e +50% ATT per 3 turni. Nebbia Tagliente: danno 80% a tutti i nemici.', 2, 'allAllies', [{ kind: 'status', status: 'evade', turns: 3, value: 0.55 }, { kind: 'status', status: 'atkUp', turns: 3, value: 0.5 }, { kind: 'shockwave', mult: 0.8 }]),
  ] } },
  fruit_fang: { a: 'Re della Giungla', b: { name: 'Branco', abilities: [
    lv('pwb_fang_3', 'Branco', 'Tutta la squadra +80% ATT per 3 turni e speciali dei compagni +1 carica. Ruggito: danno 45% a tutti i nemici.', 2, 'allAllies', [{ kind: 'status', status: 'atkUp', turns: 3, value: 0.8 }, { kind: 'chargeAllies', amount: 1 }, { kind: 'shockwave', mult: 0.45 }]),
    lv('pwb_fang_4', 'Branco II', 'Tutta la squadra +100% ATT per 3 turni e speciali dei compagni +1 carica. Ruggito: danno 55% a tutti i nemici.', 2, 'allAllies', [{ kind: 'status', status: 'atkUp', turns: 3, value: 1 }, { kind: 'chargeAllies', amount: 1 }, { kind: 'shockwave', mult: 0.55 }]),
    lv('pwb_fang_5', 'Branco Alfa', 'Tutta la squadra +130% ATT per 4 turni e speciali dei compagni +2 cariche. Ruggito: danno 70% a tutti i nemici.', 2, 'allAllies', [{ kind: 'status', status: 'atkUp', turns: 4, value: 1.3 }, { kind: 'chargeAllies', amount: 2 }, { kind: 'shockwave', mult: 0.7 }]),
  ] } },
  fruit_glue: { a: 'Palude', b: { name: 'Trappola', abilities: [
    lv('pwb_glue_3', 'Trappola', 'Danno 150% a un nemico: bloccato 1 turno e vulnerabile per 2 turni.', 2, 'enemy', [{ kind: 'status', status: 'vulnerable', turns: 2 }, { kind: 'damage', mult: 1.5 }, { kind: 'status', status: 'stun', turns: 1 }]),
    lv('pwb_glue_4', 'Trappola II', 'Danno 180% a un nemico: bloccato 1 turno e vulnerabile per 2 turni.', 2, 'enemy', [{ kind: 'status', status: 'vulnerable', turns: 2 }, { kind: 'damage', mult: 1.8 }, { kind: 'status', status: 'stun', turns: 1 }]),
    lv('pwb_glue_5', 'Trappola Mortale', 'Danno 230% a un nemico: bloccato 2 turni (boss e Capibanda 1), vulnerabile per 3 turni e -60% VEL.', 2, 'enemy', [{ kind: 'status', status: 'vulnerable', turns: 3 }, { kind: 'damage', mult: 2.3 }, { kind: 'status', status: 'stun', turns: 2 }, { kind: 'status', status: 'slow', turns: 4, value: 0.6 }]),
  ] } },
  fruit_mirror: { a: 'Labirinto', b: { name: 'Specchio Infranto', abilities: [
    lv('pwb_mirror_3', 'Specchio Infranto', 'Schegge: 2 colpi da 130% a TUTTI i nemici.', 2, 'allEnemies', [{ kind: 'damage', mult: 1.3, hits: 2 }]),
    lv('pwb_mirror_4', 'Specchio Infranto II', 'Schegge: 2 colpi da 150% a TUTTI i nemici.', 2, 'allEnemies', [{ kind: 'damage', mult: 1.5, hits: 2 }]),
    lv('pwb_mirror_5', 'Pioggia di Cristalli', 'Schegge: 3 colpi da 135% a TUTTI i nemici e vulnerabili per 2 turni.', 2, 'allEnemies', [{ kind: 'status', status: 'vulnerable', turns: 2 }, { kind: 'damage', mult: 1.35, hits: 3 }]),
  ] } },
  fruit_clock: { a: 'Mezzanotte', b: { name: 'Lancetta', abilities: [
    lv('pwb_clock_3', 'Lancetta', 'Danno 310% a un nemico e agisci subito di nuovo.', 2, 'enemy', [{ kind: 'damage', mult: 3.1 }, { kind: 'extraAction' }]),
    lv('pwb_clock_4', 'Lancetta II', 'Danno 370% a un nemico e agisci subito di nuovo.', 2, 'enemy', [{ kind: 'damage', mult: 3.7 }, { kind: 'extraAction' }]),
    lv('pwb_clock_5', 'Ora Esatta', 'Danno 450% a un nemico, vulnerabile per 2 turni, e agisci subito di nuovo.', 2, 'enemy', [{ kind: 'status', status: 'vulnerable', turns: 2 }, { kind: 'damage', mult: 4.5 }, { kind: 'extraAction' }]),
  ] } },
  fruit_magnet: { a: 'Campo Gravitazionale', b: { name: 'Calamita', abilities: [
    lv('pwb_magnet_3', 'Calamita', 'Per 2 turni attiri tu tutti i colpi, scudo 60 e rifletti il 60%. Impulso: danno 40% a tutti i nemici.', 3, 'self', [{ kind: 'status', status: 'taunt', turns: 2 }, { kind: 'shield', amount: 60 }, { kind: 'status', status: 'reflect', turns: 2, value: 0.6 }, { kind: 'shockwave', mult: 0.4 }]),
    lv('pwb_magnet_4', 'Calamita II', 'Per 2 turni attiri tu tutti i colpi, scudo 85 e rifletti l\'80%. Impulso: danno 50% a tutti i nemici.', 3, 'self', [{ kind: 'status', status: 'taunt', turns: 2 }, { kind: 'shield', amount: 85 }, { kind: 'status', status: 'reflect', turns: 2, value: 0.8 }, { kind: 'shockwave', mult: 0.5 }]),
    lv('pwb_magnet_5', 'Polo Nord', 'Per 3 turni attiri tu tutti i colpi, scudo 120, +50% DIF e rifletti il 100%. Impulso: danno 65% a tutti i nemici.', 3, 'self', [{ kind: 'status', status: 'taunt', turns: 3 }, { kind: 'shield', amount: 120 }, { kind: 'status', status: 'defUp', turns: 3, value: 0.5 }, { kind: 'status', status: 'reflect', turns: 3, value: 1 }, { kind: 'shockwave', mult: 0.65 }]),
  ] } },
  fruit_blood: { a: 'Notte Cremisi', b: { name: 'Patto di Sangue', abilities: [
    lv('pwb_blood_3', 'Patto di Sangue', 'Danno 200% a un nemico: ti curi del 60% del danno, l\'eccesso diventa scudo.', 3, 'enemy', [{ kind: 'damage', mult: 2, lifesteal: 0.6, overhealShield: true }]),
    lv('pwb_blood_4', 'Patto di Sangue II', 'Danno 240% a un nemico: ti curi del 60% del danno, l\'eccesso diventa scudo.', 3, 'enemy', [{ kind: 'damage', mult: 2.4, lifesteal: 0.6, overhealShield: true }]),
    lv('pwb_blood_5', 'Sangue Antico', 'Danno 290% a un nemico, vulnerabile per 2 turni: ti curi del 60%, l\'eccesso diventa scudo.', 3, 'enemy', [{ kind: 'status', status: 'vulnerable', turns: 2 }, { kind: 'damage', mult: 2.9, lifesteal: 0.6, overhealShield: true }]),
  ] } },
  fruit_stench: { a: 'Miasma', b: { name: 'Fogna', abilities: [
    lv('pwb_stench_3', 'Fogna', 'Danno 170% a un nemico e veleno (18/turno) per 5 turni.', 3, 'enemy', [{ kind: 'damage', mult: 1.7 }, { kind: 'status', status: 'poison', turns: 5, value: 18 }]),
    lv('pwb_stench_4', 'Fogna II', 'Danno 210% a un nemico e veleno (24/turno) per 5 turni.', 3, 'enemy', [{ kind: 'damage', mult: 2.1 }, { kind: 'status', status: 'poison', turns: 5, value: 24 }]),
    lv('pwb_stench_5', 'Cloaca Maxima', 'Danno 260% a un nemico, veleno (30/turno) per 5 turni e -40% ATT per 3 turni.', 3, 'enemy', [{ kind: 'damage', mult: 2.6 }, { kind: 'status', status: 'poison', turns: 5, value: 30 }, { kind: 'status', status: 'weak', turns: 3, value: 0.4 }]),
  ] } },
  fruit_acid: { a: 'Diluvio', b: { name: 'Corrosione Profonda', abilities: [
    lv('pwb_acid_3', 'Corrosione', 'Scioglie lo scudo, danno 220% a un nemico e acido (16, cresce) per 4 turni.', 3, 'enemy', [{ kind: 'meltShield' }, { kind: 'damage', mult: 2.2 }, { kind: 'status', status: 'acid', turns: 4, value: 16 }]),
    lv('pwb_acid_4', 'Corrosione II', 'Scioglie lo scudo, danno 260% a un nemico e acido (21, cresce) per 4 turni.', 3, 'enemy', [{ kind: 'meltShield' }, { kind: 'damage', mult: 2.6 }, { kind: 'status', status: 'acid', turns: 4, value: 21 }]),
    lv('pwb_acid_5', 'Corrosione Profonda', 'Scioglie lo scudo, danno 320% a un nemico, acido (27, cresce) per 5 turni e vulnerabile per 3 turni.', 3, 'enemy', [{ kind: 'meltShield' }, { kind: 'status', status: 'vulnerable', turns: 3 }, { kind: 'damage', mult: 3.2 }, { kind: 'status', status: 'acid', turns: 5, value: 27 }]),
  ] } },
  fruit_bubble: { a: 'Mare di Bolle', b: { name: 'Bolla Scudo', abilities: [
    lv('pwb_bubble_3', 'Bolla Scudo', 'Scudo 30 a tutta la squadra e per 1 turno schivate ogni colpo. Le bolle scoppiano: danno 90% a tutti i nemici.', 3, 'allAllies', [{ kind: 'shield', amount: 30 }, { kind: 'status', status: 'evade', turns: 1, value: 1 }, { kind: 'shockwave', mult: 0.9 }]),
    lv('pwb_bubble_4', 'Bolla Scudo II', 'Scudo 42 a tutta la squadra e per 1 turno schivate ogni colpo. Le bolle scoppiano: danno 110% a tutti i nemici.', 3, 'allAllies', [{ kind: 'shield', amount: 42 }, { kind: 'status', status: 'evade', turns: 1, value: 1 }, { kind: 'shockwave', mult: 1.1 }]),
    lv('pwb_bubble_5', 'Cupola di Schiuma', 'Scudo 58 e +40% ATT a tutta la squadra; per 1 turno schivate ogni colpo. Le bolle scoppiano: danno 140% a tutti i nemici.', 3, 'allAllies', [{ kind: 'shield', amount: 58 }, { kind: 'status', status: 'evade', turns: 1, value: 1 }, { kind: 'status', status: 'atkUp', turns: 2, value: 0.4 }, { kind: 'shockwave', mult: 1.4 }]),
  ] } },
  fruit_mine: { a: 'Campo Minato', b: { name: 'Bomba Grappolo', abilities: [
    lv('pwb_mine_3', 'Bomba Grappolo', 'Una mina da 480% sotto un nemico: scoppiando colpisce gli altri al 40%.', 3, 'enemy', [{ kind: 'mine', mult: 4.8, splash: 0.4 }]),
    lv('pwb_mine_4', 'Bomba Grappolo II', 'Una mina da 580% sotto un nemico: scoppiando colpisce gli altri al 45%.', 3, 'enemy', [{ kind: 'mine', mult: 5.8, splash: 0.45 }]),
    lv('pwb_mine_5', 'Megabomba', 'Una mina da 720% sotto un nemico, che intanto rallenta: scoppiando colpisce gli altri al 50%.', 3, 'enemy', [{ kind: 'mine', mult: 7.2, splash: 0.5 }, { kind: 'status', status: 'slow', turns: 2, value: 0.3 }]),
  ] } },
  fruit_swarm: { a: 'Vendemmia', b: { name: 'Botte', abilities: [
    lv('pwb_swarm_3', 'Botte', 'Danno 150% a un nemico e +6 acini (max 12), ognuno colpisce per il 40%.', 3, 'enemy', [{ kind: 'damage', mult: 1.5 }, { kind: 'swarm', count: 6, mult: 0.4, max: 12 }]),
    lv('pwb_swarm_4', 'Botte II', 'Danno 180% a un nemico e +7 acini (max 14), ognuno colpisce per il 45%.', 3, 'enemy', [{ kind: 'damage', mult: 1.8 }, { kind: 'swarm', count: 7, mult: 0.45, max: 14 }]),
    lv('pwb_swarm_5', 'Cantina', 'Danno 220% a un nemico e +8 acini (max 15), ognuno colpisce per il 50%.', 3, 'enemy', [{ kind: 'damage', mult: 2.2 }, { kind: 'swarm', count: 8, mult: 0.5, max: 15 }]),
  ] } },
  fruit_twin: { a: 'Legione', b: { name: 'Doppio Cuore', abilities: [
    lv('pwb_twin_3', 'Doppio Cuore', 'Danno 250% a un nemico e gemella per 5 turni al 75%.', 3, 'enemy', [{ kind: 'damage', mult: 2.5 }, { kind: 'twin', turns: 5, ratio: 0.75 }]),
    lv('pwb_twin_4', 'Doppio Cuore II', 'Danno 290% a un nemico e gemella per 5 turni al 90%.', 3, 'enemy', [{ kind: 'damage', mult: 2.9 }, { kind: 'twin', turns: 5, ratio: 0.9 }]),
    lv('pwb_twin_5', 'Anima Gemella', 'Danno 350% a un nemico e gemella per 6 turni al 100%.', 3, 'enemy', [{ kind: 'damage', mult: 3.5 }, { kind: 'twin', turns: 6, ratio: 1 }]),
  ] } },
};

/** Collega le strade ai frutti (chiamata una volta da fruits.ts). */
export function attachBranches(fruits: FruitDef[]): void {
  for (const f of fruits) { const b = FRUIT_BRANCHES[f.id]; if (b) f.branches = b; }
}

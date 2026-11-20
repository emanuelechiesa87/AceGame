import type { ArtifactDef } from '../types/content';

export const ARTIFACTS: ArtifactDef[] = [
  { id: 'art_basalt_core', name: 'Nucleo di Basalto', rarity: 'common', description: '+4 DIF, -2 VEL.', stats: { def: 4, spd: -2 } },
  { id: 'art_wolf_fang', name: 'Dente di Lupo', rarity: 'common', description: '+3 ATT.', stats: { atk: 3 } },
  { id: 'art_fate_thread', name: 'Filo del Destino', rarity: 'rare', description: 'Una volta per battaglia sopravvivi a un colpo letale.', surviveLethalOncePerBattle: true },
  { id: 'art_unstable_prism', name: 'Prisma Instabile', rarity: 'rare', description: 'I poteri dei frutti fanno +30% danni.', powerDamageMult: 1.3 },
  { id: 'art_return_bell', name: 'Campana del Ritorno', rarity: 'common', description: 'Dopo ogni vittoria recuperi il 6% degli HP.', healAfterVictoryPct: 0.06 },
  // 0.6.1 — comuni
  { id: 'art_bent_compass', name: 'Bussola Storta', rarity: 'common', description: 'Inizi ogni battaglia con +1 energia.', energyBonus: 1 },
  { id: 'art_coconut_flask', name: 'Fiaschetta di Latte di Cocco', rarity: 'common', description: 'Le pozioni curano il 50% invece del 35%.', potionHealPct: 0.5 },
  { id: 'art_shell_armor', name: 'Conchiglia Corazza', rarity: 'common', description: 'Scudo da 12 all\'inizio di ogni battaglia.', openingShield: 12 },
  { id: 'art_good_eye', name: 'Benda dell\'Occhio Buono', rarity: 'common', description: '+8% di probabilità di colpo critico.', critBonus: 0.08 },
  { id: 'art_cork_ring', name: 'Ciambella di Sughero', rarity: 'common', description: '+15 HP massimi.', stats: { maxHp: 15 } },
  { id: 'art_rusty_hook', name: 'Amo Arrugginito', rarity: 'common', description: 'L\'attacco base ha il 25% di avvelenare (4 danni per 3 turni).', basicPoison: { chance: 0.25, value: 4, turns: 3 } },
  // 0.6.1 — rari
  { id: 'art_bosun_whistle', name: 'Fischietto di Bordo', rarity: 'rare', description: 'I compagni fanno +30% di danni e partono con la speciale già un po\' carica.', companionDmgMult: 1.3, companionStartCharge: 1 },
  { id: 'art_urchin_spines', name: 'Aculei di Riccio', rarity: 'rare', description: 'Chi ti colpisce subisce il 20% del danno.', thornsPct: 0.2 },
  { id: 'art_sunken_lantern', name: 'Lanterna Sommersa', rarity: 'rare', description: 'Se ti difendi guadagni 2 energia invece di 1.', guardEnergyBonus: 1 },
  { id: 'art_torn_map', name: 'Mappa Strappata', rarity: 'rare', description: 'Dopo ogni scontro scegli tra 4 ricompense invece di 3.', extraRewardChoice: 1 },
  // 0.6.1 — epici
  { id: 'art_return_pearl', name: 'Perla del Ritorno', rarity: 'epic', description: 'Una volta per run, quando vai a 0 HP torni al 50%.', reviveOncePerRunPct: 0.5 },
  { id: 'art_black_coral_crown', name: 'Corona di Corallo Nero', rarity: 'epic', description: 'Il potere del frutto costa 1 energia in meno.', powerCostDown: 1 },
  // F4b (0.9.2) — difesa e cariche
  { id: 'art_diver_helmet', name: 'Elmo da Palombaro', rarity: 'common', description: 'Quando pari un colpo caricato ottieni anche 10 di scudo.', parryShield: 10 },
  { id: 'art_turtle_shell', name: 'Guscio di Tartaruga', rarity: 'common', description: 'In Difesa subisci il 35% del danno invece del 50%.', guardMult: 0.35 },
  { id: 'art_broken_anchor', name: 'Ancora Spezzata', rarity: 'rare', description: 'Dopo aver parato un colpo caricato, nel tuo turno successivo fai +60% di danni.', parryBoost: 0.6 },
  { id: 'art_figurehead', name: 'Polena di Prua', rarity: 'epic', description: 'Tutti gli scudi che ricevi sono più grandi del 50%.', shieldMult: 1.5 },
  // F4b — compagni
  { id: 'art_hearty_rations', name: 'Rancio Abbondante', rarity: 'common', description: 'I compagni hanno il 20% di HP massimi in più.', companionHpMult: 1.2 },
  { id: 'art_cook_mess', name: 'Gavetta del Cuoco', rarity: 'common', description: 'Dopo ogni vittoria i compagni in piedi recuperano il 10% degli HP.', companionHealAfterVictoryPct: 0.1 },
  { id: 'art_fog_horn', name: 'Corno da Nebbia', rarity: 'rare', description: 'Quando un compagno usa la speciale ottieni 1 energia.', specialEnergy: 1 },
  { id: 'art_crew_flag', name: 'Bandiera di Ciurma', rarity: 'rare', description: '+2 ATT per ogni compagno in piedi.', atkPerCompanion: 2 },
  // F4b — veleno e spine
  { id: 'art_moray_vial', name: 'Fiala di Murena', rarity: 'common', description: 'Il veleno che infliggi (tu e i compagni) dura 1 turno in più e fa +1 danno.', poisonBonus: { turns: 1, value: 1 } },
  { id: 'art_crab_armor', name: 'Corazza di Granchio', rarity: 'common', description: '+2 DIF e chi ti colpisce subisce il 10% del danno.', stats: { def: 2 }, thornsPct: 0.1 },
  { id: 'art_stinging_net', name: 'Rete Urticante', rarity: 'rare', description: 'I nemici avvelenati subiscono +15% di danni dalla tua squadra.', poisonedVulnMult: 1.15 },
  { id: 'art_jelly_tentacle', name: 'Tentacolo di Medusa', rarity: 'epic', description: 'Chi ti colpisce ha il 30% di essere avvelenato (5 per 3 turni).', retaliatePoison: { chance: 0.3, value: 5, turns: 3 } },
  // F4b — energia
  { id: 'art_eel_battery', name: "Pila d'Anguilla", rarity: 'common', description: 'Ogni 3 round ottieni 1 energia in più.', energyEvery: 3 },
  { id: 'art_black_hourglass', name: 'Clessidra di Sabbia Nera', rarity: 'rare', description: 'Energia massima +1 (da 5 a 6).', energyMaxBonus: 1 },
  { id: 'art_first_coin', name: 'Moneta del Primo Colpo', rarity: 'rare', description: 'Il primo potere di ogni battaglia è gratis.', firstPowerFree: true },
  // F4b — maledetti
  { id: 'art_pact_skull', name: 'Teschio del Patto', rarity: 'epic', cursed: true, description: 'MALEDETTO. I poteri fanno +40% di danni, ma perdi 3 HP all\'inizio di ogni tuo turno (non ti uccide).', powerDamageMult: 1.4, selfDamagePerTurn: 3 },
  { id: 'art_abyss_eye', name: "Occhio dell'Abisso", rarity: 'epic', cursed: true, description: 'MALEDETTO. +2 energia a inizio battaglia e +4 ATT, ma -20 HP massimi.', energyBonus: 2, stats: { atk: 4, maxHp: -20 } },
];

export const ARTIFACT_BY_ID = new Map(ARTIFACTS.map((a) => [a.id, a]));

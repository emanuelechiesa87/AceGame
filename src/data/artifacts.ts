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
];

export const ARTIFACT_BY_ID = new Map(ARTIFACTS.map((a) => [a.id, a]));

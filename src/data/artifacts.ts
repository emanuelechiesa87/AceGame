import type { ArtifactDef } from '../types/content';

export const ARTIFACTS: ArtifactDef[] = [
  { id: 'art_basalt_core', name: 'Nucleo di Basalto', rarity: 'common', description: '+4 DIF, -2 VEL.', stats: { def: 4, spd: -2 } },
  { id: 'art_wolf_fang', name: 'Dente di Lupo', rarity: 'common', description: '+3 ATT.', stats: { atk: 3 } },
  { id: 'art_fate_thread', name: 'Filo del Destino', rarity: 'rare', description: 'Una volta per battaglia sopravvivi a un colpo letale.', surviveLethalOncePerBattle: true },
  { id: 'art_unstable_prism', name: 'Prisma Instabile', rarity: 'rare', description: 'I poteri dei frutti fanno +30% danni.', powerDamageMult: 1.3 },
  { id: 'art_return_bell', name: 'Campana del Ritorno', rarity: 'common', description: 'Dopo ogni vittoria recuperi il 10% degli HP.', healAfterVictoryPct: 0.1 },
];

export const ARTIFACT_BY_ID = new Map(ARTIFACTS.map((a) => [a.id, a]));

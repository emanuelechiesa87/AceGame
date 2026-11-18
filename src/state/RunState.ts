import { BALANCE } from '../data/balance';
import type { AvatarVariant, RunState } from '../types/game';

export function createRunState(avatar: AvatarVariant, seed: number, now = new Date()): RunState {
  const p = BALANCE.player;
  return {
    runId: `run-${seed.toString(16)}-${now.getTime().toString(36)}`,
    runSeed: seed,
    balanceVersion: BALANCE.version,
    startedAt: now.toISOString(),
    avatar,
    currentAreaIndex: 0,
    currentEncounterIndex: 0,
    playerStats: { hp: p.baseHp, atk: p.baseAtk, def: p.baseDef, spd: p.baseSpd },
    currentHp: p.baseHp,
    activePowerIds: [],
    runArtifactIds: [],
    companionIds: [],
    runScore: 0,
    enemiesDefeated: 0,
    elitesDefeated: 0,
    bossesDefeated: 0,
  };
}

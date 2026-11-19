import { BALANCE } from '../data/balance';
import { clampTide, tideEffects } from '../data/tides';
import { FRUIT_BY_ID } from '../data/fruits';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import type { AvatarVariant, RunState, Stats } from '../types/game';

export function createRunState(avatar: AvatarVariant, seed: number, now = new Date(), heroName = 'Eroe', tide = 0): RunState {
  const p = BALANCE.player;
  return {
    runId: `run-${seed.toString(16)}-${now.getTime().toString(36)}`,
    runSeed: seed,
    rngCursor: 0,
    balanceVersion: BALANCE.version,
    startedAt: now.toISOString(),
    avatar,
    heroName,
    areaIndex: 0,
    stepIndex: 0,
    map: [],
    baseStats: { maxHp: p.baseHp, atk: p.baseAtk, def: p.baseDef, spd: p.baseSpd },
    currentHp: p.baseHp,
    activeFruitIds: [],
    fruitLevel: 1,
    artifactIds: [],
    companions: [],
    potions: tideEffects(tide).startingPotions,
    tide: clampTide(tide),
    usedFruitIds: [],
    score: 0,
    enemiesDefeated: 0,
    elitesDefeated: 0,
    bossesDefeated: 0,
    eventsCompleted: 0,
    heroKos: 0,
  };
}

/** Statistiche effettive: base + passive dei frutti + artefatti. */
export function effectiveStats(run: RunState): Stats {
  const s = { ...run.baseStats };
  const mods = [...run.activeFruitIds.map((id) => FRUIT_BY_ID.get(id)?.passive), ...run.artifactIds.map((id) => ARTIFACT_BY_ID.get(id)?.stats)];
  for (const m of mods) {
    if (!m) continue;
    s.maxHp += m.maxHp ?? 0;
    s.atk += m.atk ?? 0;
    s.def += m.def ?? 0;
    s.spd += m.spd ?? 0;
  }
  s.spd = Math.max(1, s.spd);
  return s;
}

export const HERO_NAME_MAX = 12;

/** Pulisce il nome: solo lettere, cifre, spazi, apostrofo, trattino e punto. */
export function sanitizeHeroName(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N} '\-.]/gu, '')
    .replace(/\s+/g, ' ')
    .trimStart()
    .slice(0, HERO_NAME_MAX);
}

export function isValidHeroName(name: string): boolean {
  const n = name.trim();
  return n.length >= 1 && n.length <= HERO_NAME_MAX && /\p{L}|\p{N}/u.test(n);
}

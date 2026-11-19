import { AREAS, LAST_AREA_INDEX, type NodeType } from '../data/areas';
import { ARTIFACTS, ARTIFACT_BY_ID } from '../data/artifacts';
import { BALANCE } from '../data/balance';
import { COMPANIONS } from '../data/companions';
import { ENEMY_BY_ID } from '../data/enemies';
import { FRUITS, MAX_FRUIT_LEVEL } from '../data/fruits';
import { effectiveStats } from '../state/RunState';
import type { Rarity } from '../types/content';
import type { MapStep, RunState } from '../types/game';
import { Rng } from './Rng';

const RARITY_WEIGHT: Record<Rarity, number> = { common: 60, rare: 30, epic: 10 };
const L = BALANCE.limits;

export type Reward =
  | { kind: 'awaken' }
  | { kind: 'artifact'; id: string }
  | { kind: 'potion' }
  | { kind: 'heal' }
  | { kind: 'maxHp' };

export type GainResult = 'added' | 'needsReplace' | 'duplicate';

/**
 * Regole della run, senza grafica: mappa, incontri, ricompense, limiti di
 * risveglio del frutto, compagni, punteggio. Tutta la casualità passa da un Rng con seed,
 * il cui avanzamento è salvato nel RunState (rngCursor).
 */
export class RunController {
  readonly rng: Rng;

  constructor(readonly run: RunState) {
    this.rng = new Rng(run.runSeed);
    for (let i = 0; i < run.rngCursor; i++) this.rng.next();
    const next = this.rng.next.bind(this.rng);
    this.rng.next = () => { run.rngCursor++; return next(); };
  }

  get area() { return AREAS[Math.min(this.run.areaIndex, LAST_AREA_INDEX)]; }
  /** Numero dell'area per l'interfaccia (1..4). */
  get areaNumber(): number { return this.run.areaIndex + 1; }
  get hasNextArea(): boolean { return this.run.areaIndex < LAST_AREA_INDEX; }
  /** Rinforzo dei nemici dell'area corrente (da passare alla battaglia). */
  get enemyScale(): { hp: number; atk: number } { return { ...this.area.scale }; }

  /**
   * Dopo il boss di un'area si salpa verso la successiva con lo stesso eroe:
   * nuova mappa, cura parziale di eroe e compagni. Ritorna false se era l'ultima.
   */
  nextArea(): boolean {
    if (!this.hasNextArea) return false;
    this.run.areaIndex++;
    this.run.stepIndex = 0;
    this.run.map = this.generateMap();
    const pct = BALANCE.rewards.areaHealPct;
    this.healPct(pct);
    this.run.companions = this.run.companions.map((c) => {
      const max = COMPANIONS.find((d) => d.id === c.id)!.stats.maxHp;
      return { ...c, hp: Math.min(max, c.hp + Math.round(max * pct)) };
    });
    return true;
  }

  // --- avvio -------------------------------------------------------------------
  /** Frutto iniziale casuale dal pool sbloccato, pesato per rarità. */
  start(unlockedFruitIds: string[]): string {
    const pool = FRUITS.filter((f) => f.startsUnlocked || unlockedFruitIds.includes(f.id));
    const fruit = this.rng.weightedPick(pool.map((f) => ({ item: f.id, weight: RARITY_WEIGHT[f.rarity] })));
    this.run.activeFruitIds = [fruit];
    this.run.usedFruitIds = [fruit];
    this.run.fruitLevel = 1;
    this.run.map = this.generateMap();
    return fruit;
  }

  generateMap(): MapStep[] {
    const a = this.area;
    const steps: MapStep[] = [{ options: ['battle'] }];
    for (let i = 1; i < a.steps; i++) {
      const weights = Object.entries(a.nodeWeights).filter(([t]) => !(t === 'elite' && i < 2)) as [NodeType, number][];
      const first = this.rng.weightedPick(weights.map(([item, weight]) => ({ item, weight })));
      let second = first;
      for (let k = 0; k < 10 && second === first; k++) second = this.rng.weightedPick(weights.map(([item, weight]) => ({ item, weight })));
      const opts: NodeType[] = second === first ? [first] : [first, second];
      // garanzia: un incontro con un compagno nei primi passi
      if (i === 1 && !opts.includes('recruit')) opts[opts.length - 1] = 'recruit';
      // prima del boss si può sempre riposare
      if (i === a.steps - 1 && !opts.includes('rest')) opts[0] = 'rest';
      steps.push({ options: opts });
    }
    steps.push({ options: ['boss'] });
    return steps;
  }

  get currentStep(): MapStep { return this.run.map[this.run.stepIndex]; }
  get isLastStep(): boolean { return this.run.stepIndex >= this.run.map.length - 1; }

  choose(node: NodeType): void {
    if (!this.currentStep.options.includes(node)) throw new Error(`Nodo non disponibile: ${node}`);
    this.currentStep.chosen = node;
  }

  /** Dopo aver risolto il nodo corrente. */
  advance(): void {
    this.run.stepIndex++;
  }

  // --- incontri ------------------------------------------------------------------
  enemyGroup(node: NodeType): string[] {
    const g = this.area.groups;
    if (node === 'boss') return [...g.boss];
    if (node === 'elite') return [...this.rng.pick(g.elite)];
    return [...this.rng.pick(this.run.stepIndex <= 1 ? g.early : g.late)];
  }

  /** Registra la vittoria: punteggio, contatori, cure post-battaglia, compagni KO rianimati. */
  onVictory(enemyIds: string[], heroHp: number, companions: { id: string; hp: number; charge: number }[]): void {
    const S = BALANCE.score;
    for (const id of enemyIds) {
      const tier = ENEMY_BY_ID.get(id)?.tier ?? 'normal';
      if (tier === 'boss') { this.run.bossesDefeated++; this.run.score += S.boss; }
      else if (tier === 'elite') { this.run.elitesDefeated++; this.run.score += S.elite; }
      else { this.run.enemiesDefeated++; this.run.score += S.enemy; }
    }
    const stats = effectiveStats(this.run);
    let hp = heroHp;
    for (const aid of this.run.artifactIds) {
      const pct = ARTIFACT_BY_ID.get(aid)?.healAfterVictoryPct;
      if (pct) hp += Math.round(stats.maxHp * pct);
    }
    this.run.currentHp = Math.min(stats.maxHp, Math.max(1, hp));
    this.run.companions = companions.map((c) => {
      const max = COMPANIONS.find((d) => d.id === c.id)!.stats.maxHp;
      return { id: c.id, charge: c.charge, hp: c.hp > 0 ? c.hp : Math.round(max * BALANCE.combat.companionReviveHpPct) };
    });
  }

  onAreaCleared(): void {
    this.run.score += BALANCE.score.areaCleared;
    if (this.run.heroKos === 0) this.run.score += BALANCE.score.noKoBossBonus;
  }

  // --- ricompense ------------------------------------------------------------------
  /** Livello di risveglio del frutto (le run salvate prima del risveglio valgono 1). */
  get fruitLevel(): number { return this.run.fruitLevel ?? 1; }
  /** Tetto del Risveglio nell'area corrente (III nel primo mare, poi IV e V). */
  get fruitLevelCap(): number { return Math.min(MAX_FRUIT_LEVEL, this.area.maxFruitLevel); }
  get canAwaken(): boolean { return this.fruitLevel < this.fruitLevelCap; }

  /**
   * Ricompense dopo ogni scontro: mai frutti nuovi (se ne mangia uno solo).
   * Élite e boss garantiscono un artefatto e, se possibile, il Risveglio.
   */
  rewardOptions(node: NodeType): Reward[] {
    const out: Reward[] = [];
    const artifact = this.randomNewArtifact();
    const R = BALANCE.rewards.weights;
    if (node === 'elite' || node === 'boss') {
      if (artifact) out.push({ kind: 'artifact', id: artifact });
      if (this.canAwaken) out.push({ kind: 'awaken' });
    }
    const pool: { item: Reward['kind']; weight: number }[] = [
      { item: 'awaken', weight: this.canAwaken ? R.awaken : 0 }, { item: 'artifact', weight: artifact ? R.artifact : 0 },
      { item: 'potion', weight: R.potion }, { item: 'heal', weight: R.heal }, { item: 'maxHp', weight: R.maxHp },
    ];
    for (let guard = 0; out.length < 3 && guard < 50; guard++) {
      const kind = this.rng.weightedPick(pool);
      if (out.some((r) => r.kind === kind)) continue;
      if (kind === 'artifact') out.push({ kind, id: artifact! });
      else out.push({ kind } as Reward);
    }
    return out;
  }

  /** Risveglio: il potere del frutto sale di livello (tetto dato dall'area, max V). */
  awaken(): boolean {
    if (!this.canAwaken) return false;
    this.run.fruitLevel = this.fruitLevel + 1;
    return true;
  }

  randomNewArtifact(): string | undefined {
    const pool = ARTIFACTS.filter((a) => !this.run.artifactIds.includes(a.id));
    return pool.length ? this.rng.weightedPick(pool.map((a) => ({ item: a.id, weight: RARITY_WEIGHT[a.rarity] }))) : undefined;
  }

  randomNewCompanion(): string | undefined {
    const pool = COMPANIONS.filter((c) => !this.run.companions.some((x) => x.id === c.id));
    return pool.length ? this.rng.pick(pool).id : undefined;
  }

  /** Applica ricompense semplici; artefatti e risveglio hanno metodi dedicati. */
  applySimple(kind: 'potion' | 'heal' | 'maxHp' | 'awaken'): void {
    if (kind === 'awaken') { this.awaken(); return; }
    const R = BALANCE.rewards;
    if (kind === 'potion') this.run.potions++;
    if (kind === 'heal') this.healPct(R.healRewardPct);
    if (kind === 'maxHp') { this.run.baseStats.maxHp += R.maxHpUp; this.run.currentHp += R.maxHpUp; }
  }

  healPct(pct: number): void {
    const max = effectiveStats(this.run).maxHp;
    this.run.currentHp = Math.min(max, this.run.currentHp + Math.round(max * pct));
  }

  gainArtifact(id: string): GainResult {
    if (!ARTIFACT_BY_ID.has(id)) throw new Error(`Artefatto sconosciuto: ${id}`);
    if (this.run.artifactIds.includes(id)) return 'duplicate';
    this.run.artifactIds.push(id);
    const bonus = ARTIFACT_BY_ID.get(id)!.stats?.maxHp ?? 0;
    this.run.currentHp += Math.max(0, bonus);
    this.clampHp();
    return 'added';
  }

  /** Squadra massima 4: protagonista + 3 compagni. */
  recruit(id: string, replaceId?: string): GainResult {
    const def = COMPANIONS.find((c) => c.id === id);
    if (!def) throw new Error(`Compagno sconosciuto: ${id}`);
    const cs = this.run.companions;
    if (cs.some((c) => c.id === id)) return 'duplicate';
    const fresh = { id, hp: def.stats.maxHp, charge: 0 };
    if (cs.length >= L.maxCompanions) {
      if (!replaceId) return 'needsReplace';
      const idx = cs.findIndex((c) => c.id === replaceId);
      if (idx < 0) throw new Error('Compagno da sostituire non presente');
      cs[idx] = fresh;
    } else cs.push(fresh);
    return 'added';
  }

  completeEvent(): void {
    this.run.eventsCompleted++;
    this.run.score += BALANCE.score.eventCompleted;
  }

  private clampHp(): void {
    const max = effectiveStats(this.run).maxHp;
    this.run.currentHp = Math.max(1, Math.min(max, this.run.currentHp));
  }
}

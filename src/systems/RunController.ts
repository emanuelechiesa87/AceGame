import { AREAS, LAST_AREA_INDEX, type NodeType } from '../data/areas';
import { ARTIFACTS, ARTIFACT_BY_ID } from '../data/artifacts';
import { BALANCE } from '../data/balance';
import { COMPANION_BY_ID, COMPANIONS, companionScale } from '../data/companions';
import { ENEMY_BY_ID } from '../data/enemies';
import { EVENTS, type EventDef } from '../data/events';
import { BRANCH_LEVEL, FRUITS, FRUIT_BY_ID, MAX_FRUIT_LEVEL, fruitAbility, type FruitBranch } from '../data/fruits';
import { effectiveStats } from '../state/RunState';
import type { Ability, ArtifactDef, Rarity } from '../types/content';
import type { BattleMods, BattleTally, EnemyScale } from './combat/types';
import { clampTide, tideEffects, type TideEffects } from '../data/tides';
import type { AreaStats, MapStep, RunState } from '../types/game';
import { Rng } from './Rng';

const RARITY_WEIGHT: Record<Rarity, number> = { common: 60, rare: 30, epic: 10 };
const L = BALANCE.limits;

export type ShopItem =
  | { kind: 'potion' | 'heal' | 'revive' | 'awaken'; price: number }
  | { kind: 'artifact'; id: string; price: number };

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
    // salvataggi vecchi: squadra già al completo ma incontri ancora in mappa
    if (run.map.length) this.pruneRecruitNodes();
  }

  /** Squadra al completo: non ci sono più compagni da incontrare. */
  get teamFull(): boolean {
    return this.run.companions.length >= L.maxCompanions || !COMPANIONS.some((c) => !this.run.companions.some((x) => x.id === c.id));
  }

  /**
   * Con la squadra al completo l'incontro con un compagno non ha senso: nelle
   * tappe ancora da giocare lo sostituisce con un altro tipo di tappa.
   * Non consuma il generatore casuale (sostituzione fissa), così la run resta riproducibile.
   */
  pruneRecruitNodes(): void {
    if (!this.teamFull) return;
    const fallback: NodeType[] = ['event', 'chest', 'battle', 'rest'];
    for (let i = this.run.stepIndex; i < this.run.map.length; i++) {
      const step = this.run.map[i];
      if (step.chosen || !step.options.includes('recruit')) continue;
      const alt = fallback.find((t) => !step.options.includes(t))!;
      step.options = step.options.map((t) => (t === 'recruit' ? alt : t));
    }
  }

  get area() { return AREAS[Math.min(this.run.areaIndex, LAST_AREA_INDEX)]; }
  /** Numero dell'area per l'interfaccia (1..4). */
  get areaNumber(): number { return this.run.areaIndex + 1; }
  get hasNextArea(): boolean { return this.run.areaIndex < LAST_AREA_INDEX; }
  /** Rinforzo dei nemici dell'area corrente (da passare alla battaglia). */
  get enemyScale(): EnemyScale {
    const t = this.tx;
    const team = this.run.areaIndex >= BALANCE.enemies.teamFromArea ? BALANCE.enemies.team[Math.min(this.run.companions.length, L.maxCompanions)] : { hp: 1, atk: 1 };
    return { hp: this.area.scale.hp * t.enemyHp * team.hp, atk: this.area.scale.atk * team.atk, tier: { normal: { hp: 1, atk: t.normalAtk }, boss: { hp: t.boss, atk: t.boss } } };
  }
  /** F3 · Marea della run (0 = nessun malus). */
  get tide(): number { return clampTide(this.run.tide); }
  private txCache?: { n: number; e: TideEffects };
  /** F3 · Valori effettivi con i malus della Marea. */
  get tx(): TideEffects {
    if (this.txCache?.n !== this.tide) this.txCache = { n: this.tide, e: tideEffects(this.tide) };
    return this.txCache.e;
  }
  /** Crescita dei compagni nel mare corrente. */
  get companionScale(): { hp: number; atk: number } {
    const sc = companionScale(this.run.areaIndex);
    const mult = this.arts.reduce((m, x) => m * (x.companionHpMult ?? 1), 1);
    return { hp: sc.hp * mult, atk: sc.atk };
  }

  /** HP massimi di un compagno in questa run (crescita del mare e Rancio Abbondante). */
  private compMax(id: string): number {
    const d = COMPANION_BY_ID.get(id);
    if (!d) throw new Error(`Compagno sconosciuto: ${id}`);
    return Math.round(d.stats.maxHp * this.companionScale.hp);
  }

  /**
   * Dopo il boss di un'area si salpa verso la successiva con lo stesso eroe:
   * nuova mappa, cura parziale di eroe e compagni. Ritorna false se era l'ultima.
   */
  nextArea(): boolean {
    if (!this.hasNextArea) return false;
    this.run.areaIndex++;
    this.run.stepIndex = 0;
    this.run.map = this.generateMap();
    const pct = this.tx.areaHealPct;
    this.healPct(pct);
    this.run.companions = this.run.companions.map((c) => {
      const max = this.compMax(c.id);
      // F2: chi era KO si rialza salpando, con poca vita
      if (c.hp <= 0) return { ...c, hp: Math.round(max * BALANCE.combat.companionReviveHpPct) };
      return { ...c, hp: Math.min(max, c.hp + Math.round(max * pct)) };
    });
    return true;
  }

  // --- battaglia: effetti di artefatti ed eventi --------------------------------------
  private get arts(): ArtifactDef[] { return this.run.artifactIds.map((id) => ARTIFACT_BY_ID.get(id)).filter((a): a is ArtifactDef => !!a); }

  // --- statistiche (F0) ----------------------------------------------------------------
  /** Statistiche del mare corrente (create al primo uso, anche per le run vecchie). */
  get areaStats(): AreaStats {
    const st = (this.run.stats ??= { areas: [] });
    while (st.areas.length <= this.run.areaIndex) st.areas.push(emptyAreaStats());
    return st.areas[this.run.areaIndex];
  }

  /** Registra uno scontro (vinto o perso) nelle statistiche del mare. */
  recordBattle(t: BattleTally): void {
    const a = this.areaStats;
    const max = effectiveStats(this.run).maxHp;
    a.battles++;
    a.heroTurns += t.heroTurns;
    a.damageTaken += t.damageTaken;
    a.healedInBattle += t.healed;
    a.lifesteal += t.lifesteal;
    a.potions += t.potions;
    a.minHpPct = Math.min(a.minHpPct, Math.max(0, t.minHp) / max);
  }

  addPlayTime(sec: number): void { this.areaStats.playSec += sec; }

  private recordOutsideHeal(amount: number): void { if (amount > 0) this.areaStats.healedOutside += amount; }

  /** Modificatori della battaglia dati da artefatti ed eventi (unico punto, usato da scena e simulazione). */
  battleMods(): BattleMods {
    const a = this.arts;
    const sum = (f: (x: ArtifactDef) => number | undefined) => a.reduce((m, x) => m + (f(x) ?? 0), 0);
    const pick = <T>(f: (x: ArtifactDef) => T | undefined) => a.map(f).find((v) => v !== undefined);
    const pearl = this.run.pearlUsed ? undefined : pick((x) => x.reviveOncePerRunPct);
    return {
      powerDamageMult: a.reduce((m, x) => m * (x.powerDamageMult ?? 1), 1),
      surviveLethalOnce: a.some((x) => x.surviveLethalOncePerBattle),
      enemyScale: this.enemyScale,
      energyBonus: sum((x) => x.energyBonus),
      potionHealPct: pick((x) => x.potionHealPct),
      openingShield: sum((x) => x.openingShield),
      critBonus: sum((x) => x.critBonus),
      basicPoison: pick((x) => x.basicPoison),
      companionDmgMult: a.reduce((m, x) => m * (x.companionDmgMult ?? 1), 1),
      companionStartCharge: sum((x) => x.companionStartCharge),
      thornsPct: sum((x) => x.thornsPct),
      guardEnergyBonus: sum((x) => x.guardEnergyBonus),
      reviveOncePct: pearl,
      enemyStartHpPct: this.run.nextBattleEnemyHpPct,
      eliteAffixes: Math.max(this.run.areaIndex >= 2 ? 2 : 1, this.tx.eliteAffixMin),
      chargedMult: this.tx.chargedMult,
      parryShield: sum((x) => x.parryShield) || undefined,
      guardMult: pick((x) => x.guardMult),
      parryBoost: sum((x) => x.parryBoost) || undefined,
      shieldMult: pick((x) => x.shieldMult),
      specialEnergy: sum((x) => x.specialEnergy) || undefined,
      atkPerCompanion: sum((x) => x.atkPerCompanion) || undefined,
      poisonBonus: pick((x) => x.poisonBonus),
      poisonedVulnMult: pick((x) => x.poisonedVulnMult),
      retaliatePoison: pick((x) => x.retaliatePoison),
      energyEvery: pick((x) => x.energyEvery),
      energyMaxBonus: sum((x) => x.energyMaxBonus) || undefined,
      firstPowerFree: a.some((x) => x.firstPowerFree) || undefined,
      selfDamagePerTurn: sum((x) => x.selfDamagePerTurn) || undefined,
    };
  }

  /** Poteri del frutto per la battaglia (la Corona di Corallo Nero abbassa il costo, minimo 1). */
  battlePowers(): Ability[] {
    const down = this.arts.reduce((m, x) => m + (x.powerCostDown ?? 0), 0);
    return this.run.activeFruitIds.slice(0, 1).map((id) => {
      const ab = fruitAbility(FRUIT_BY_ID.get(id)!, this.fruitLevel, this.fruitBranch);
      return down ? { ...ab, cost: Math.max(1, (ab.cost ?? 0) - down) } : ab;
    });
  }

  /** Dopo una battaglia vinta: consuma il cannone e segna la perla usata. */
  afterBattle(reviveUsed: boolean): void {
    this.run.nextBattleEnemyHpPct = undefined;
    if (reviveUsed) this.run.pearlUsed = true;
  }

  // --- avvio -------------------------------------------------------------------
  /**
   * Frutto iniziale casuale dal pool sbloccato, pesato per rarità. I frutti
   * delle ultime run (`recentFruitIds`, il più recente per primo) pesano molto
   * meno: si evita di ripartire sempre con lo stesso frutto.
   */
  start(unlockedFruitIds: string[], recentFruitIds: string[] = []): string {
    const D = BALANCE.fruitDraw;
    const pool = FRUITS.filter((f) => f.startsUnlocked || unlockedFruitIds.includes(f.id));
    const weight = (id: string, rarity: Rarity) => {
      const i = recentFruitIds.indexOf(id);
      return D.rarityWeight[rarity] * (i >= 0 && i < D.recentPenalty.length ? D.recentPenalty[i] : 1);
    };
    const fruit = this.rng.weightedPick(pool.map((f) => ({ item: f.id, weight: weight(f.id, f.rarity) })));
    this.run.activeFruitIds = [fruit];
    this.run.usedFruitIds = [fruit];
    this.run.fruitLevel = 1;
    this.run.map = this.generateMap();
    return fruit;
  }

  /**
   * Mappa di un mare. Per non poter più evitare quasi ogni scontro (feedback 19/11):
   * - tappa 0: scontro obbligato; penultima: riposo (o altro), poi il boss;
   * - tappe di mezzo "di combattimento": la scelta è tra scontro ed élite;
   * - solo poche tappe "libere" (BALANCE.map.freeSteps, +1 finché la squadra non è
   *   al completo) offrono scontro contro una tappa senza combattimento.
   */
  generateMap(): MapStep[] {
    const a = this.area;
    const M = BALANCE.map;
    const steps: MapStep[] = [{ options: ['battle'] }];
    const full = this.teamFull;
    const last = a.steps - 1;
    const middle: number[] = [];
    for (let i = 1; i < last; i++) middle.push(i);
    // F4: tappe fisse a metà mare (Capobanda, poi Fuoco o Mercante), solo se il mare è abbastanza lungo
    const mb = last > M.campStep + 1 ? M.miniBossStep : -1, camp = mb >= 0 ? M.campStep : -1;
    // la prima tappa di mezzo è sempre libera (incontro coi compagni); le altre libere a caso
    const open = middle.filter((i) => i !== mb && i !== camp);
    const nFree = Math.min(open.length, M.freeSteps + (full ? 0 : 1));
    const free = new Set<number>(open.length ? [open[0]] : []);
    const rest = open.slice(1);
    while (free.size < nFree && rest.length) free.add(rest.splice(this.rng.int(0, rest.length - 1), 1)[0]);
    const calm = Object.entries(a.nodeWeights)
      .filter(([t]) => t !== 'battle' && t !== 'elite' && !(t === 'recruit' && full)) as [NodeType, number][];
    const pickCalm = (): NodeType => this.rng.weightedPick(calm.map(([item, weight]) => ({ item, weight })));
    for (let i = 1; i < last; i++) {
      if (i === mb) steps.push({ options: ['miniboss'] });
      else if (i === camp) steps.push({ options: ['rest', 'shop'] });
      else if (free.has(i)) {
        let other = pickCalm();
        // garanzia: un incontro con un compagno nei primi passi (se c'è ancora qualcuno da incontrare)
        if (i === 1 && !full) other = 'recruit';
        steps.push({ options: ['battle', other] });
      } else {
        steps.push({ options: i >= M.eliteFromStep ? ['battle', 'elite'] : ['battle'] });
      }
    }
    // prima del boss si può sempre riposare
    if (last >= 1) {
      let other = pickCalm();
      for (let k = 0; k < 10 && other === 'rest'; k++) other = pickCalm();
      steps.push({ options: other === 'rest' ? ['rest'] : ['rest', other] });
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
    if (node === 'miniboss') return [...g.miniboss];
    return [...this.rng.pick(this.run.stepIndex <= BALANCE.map.earlySteps ? g.early : g.late)];
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
    this.recordOutsideHeal(Math.min(stats.maxHp, hp) - heroHp);
    this.run.currentHp = Math.min(stats.maxHp, Math.max(1, hp));
    // F2: i compagni KO restano KO (si rialzano al Fuoco da campo, al Mercante o salpando)
    const mess = this.arts.reduce((m, x) => m + (x.companionHealAfterVictoryPct ?? 0), 0); // Gavetta del Cuoco
    this.run.companions = this.run.companions.map((c) => {
      const b = companions.find((x) => x.id === c.id);
      const hp = Math.max(0, b ? b.hp : c.hp);
      const max = this.compMax(c.id);
      const healed = hp > 0 && mess ? Math.min(max, hp + Math.round(max * mess)) : hp;
      return b ? { id: c.id, charge: b.charge, hp: healed } : { ...c, hp: healed };
    });
  }

  /** Compagni in piedi: solo questi scendono in battaglia (F2). */
  get companionsReady() { return this.run.companions.filter((c) => c.hp > 0); }
  get companionsKo() { return this.run.companions.filter((c) => c.hp <= 0); }

  // --- monete e negozio (F2) ---------------------------------------------------------
  get coins(): number { return this.run.coins ?? 0; }
  /** Monete guadagnate da uno scontro o da un forziere (sorteggio nell'intervallo di BALANCE.economy.coins). */
  rollCoins(source: NodeType): number {
    const r = BALANCE.economy.coins[source];
    if (!r) return 0;
    const n = Math.round(this.rng.int(r[0], r[1]) * this.tx.coinMult);
    this.run.coins = this.coins + n;
    return n;
  }
  spend(n: number): boolean {
    if (this.coins < n) return false;
    this.run.coins = this.coins - n;
    return true;
  }

  /** Dopo uno scontro: c'è la scelta 1 su 3? Élite e boss sempre, scontri normali solo a volte. */
  rewardOffered(node: NodeType): boolean {
    if (node !== 'battle') return true;
    return this.rng.next() < this.tx.normalRewardChance;
  }

  /** Banco del Mercante: 4 articoli al massimo, prezzi da BALANCE.economy.prices. */
  shopOffers(): ShopItem[] {
    const P = BALANCE.economy.prices;
    const out: ShopItem[] = [{ kind: 'potion', price: P.potion }, { kind: 'heal', price: P.heal }];
    if (this.companionsKo.length) out.push({ kind: 'revive', price: P.revive });
    const art = this.randomNewArtifact();
    if (art) out.push({ kind: 'artifact', id: art, price: P.artifact[ARTIFACT_BY_ID.get(art)!.rarity] });
    if (this.canAwaken && out.length < 4) out.push({ kind: 'awaken', price: P.awaken });
    return out.slice(0, 4);
  }

  /** Compra un articolo (gli artefatti vanno poi consegnati con gainArtifact/offerArtifact). */
  buy(item: ShopItem): boolean {
    if (!this.spend(item.price)) return false;
    switch (item.kind) {
      case 'potion': this.run.potions++; break;
      case 'heal': this.healPct(BALANCE.economy.shopHealPct); break;
      case 'revive': this.reviveCompanions(); break;
      case 'awaken': this.awaken(); break;
      case 'artifact': break;
    }
    return true;
  }

  // --- Fuoco da campo (F2): una sola scelta ---------------------------------------------
  /** Cura eroe e compagni in piedi. */
  restHeal(): void {
    const pct = this.tx.restHealPct;
    this.healPct(pct);
    this.run.companions = this.run.companions.map((c) => {
      if (c.hp <= 0) return c;
      const max = this.compMax(c.id);
      return { ...c, hp: Math.min(max, c.hp + Math.round(max * pct)) };
    });
  }
  /** Rialza i compagni KO con una frazione della vita. Ritorna quanti. */
  reviveCompanions(pct: number = this.tx.restRevivePct): number {
    let n = 0;
    this.run.companions = this.run.companions.map((c) => {
      if (c.hp > 0) return c;
      n++;
      return { ...c, hp: Math.max(1, Math.round(this.compMax(c.id) * pct)) };
    });
    return n;
  }
  /** Allenamento: potenziamento permanente della run. */
  restTrain(): void {
    const T = BALANCE.rest;
    this.run.baseStats.atk += T.trainAtk;
    this.run.baseStats.maxHp += T.trainMaxHp;
    this.run.currentHp += T.trainMaxHp;
  }

  onAreaCleared(): void {
    this.run.score += BALANCE.score.areaCleared;
    if (this.run.heroKos === 0) this.run.score += BALANCE.score.noKoBossBonus;
  }

  // --- ricompense ------------------------------------------------------------------
  /** Livello di risveglio del frutto (le run salvate prima del risveglio valgono 1). */
  get fruitLevel(): number { return this.run.fruitLevel ?? 1; }
  /** (F5) Strada del frutto ('a' finché non si sceglie). */
  get fruitBranch(): FruitBranch { return this.run.fruitBranch ?? 'a'; }
  /** (F5) Il frutto è arrivato al III e la strada va ancora scelta. */
  get needsBranchChoice(): boolean {
    const f = FRUIT_BY_ID.get(this.run.activeFruitIds[0] ?? '');
    return !!f?.branches && this.fruitLevel >= BRANCH_LEVEL && !this.run.fruitBranch;
  }
  chooseBranch(b: FruitBranch): void { this.run.fruitBranch = b; }
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
    const n = 3 + this.arts.reduce((m, x) => m + (x.extraRewardChoice ?? 0), 0);
    // F4: il Capobanda lascia sempre una scelta tra artefatti (poi, se finiti, il resto)
    if (node === 'miniboss') {
      for (let guard = 0; out.length < n && guard < 30; guard++) {
        const a = this.randomNewArtifact();
        if (!a) break;
        if (!out.some((r) => r.kind === 'artifact' && r.id === a)) out.push({ kind: 'artifact', id: a });
      }
    }
    if (node === 'elite' || node === 'boss') {
      if (artifact) out.push({ kind: 'artifact', id: artifact });
      if (this.canAwaken) out.push({ kind: 'awaken' });
    }
    const pool: { item: Reward['kind']; weight: number }[] = [
      { item: 'awaken', weight: this.canAwaken ? R.awaken : 0 }, { item: 'artifact', weight: artifact ? R.artifact : 0 },
      { item: 'potion', weight: R.potion }, { item: 'heal', weight: R.heal }, { item: 'maxHp', weight: R.maxHp },
    ];
    for (let guard = 0; out.length < n && guard < 50; guard++) {
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

  randomNewArtifact(minRarity?: Rarity): string | undefined {
    const order: Rarity[] = ['common', 'rare', 'epic'];
    const pool = ARTIFACTS.filter((a) => !this.run.artifactIds.includes(a.id) && (!minRarity || order.indexOf(a.rarity) >= order.indexOf(minRarity)));
    return pool.length ? this.rng.weightedPick(pool.map((a) => ({ item: a.id, weight: RARITY_WEIGHT[a.rarity] }))) : undefined;
  }

  /** Evento misterioso: solo quelli del mare corrente o generici, mai uno già visto nella run (se possibile). */
  pickEvent(): EventDef {
    const seen = (this.run.seenEventIds ??= []);
    const here = EVENTS.filter((e) => !e.areas || e.areas.includes(this.run.areaIndex));
    const fresh = here.filter((e) => !seen.includes(e.id));
    const pool = fresh.length ? fresh : here;
    // gli eventi del proprio mare escono un po' più spesso di quelli generici
    const ev = this.rng.weightedPick(pool.map((e) => ({ item: e, weight: e.areas ? 1.5 : 1 })));
    if (!seen.includes(ev.id)) seen.push(ev.id);
    return ev;
  }

  randomNewCompanion(): string | undefined {
    return this.randomNewCompanions(1)[0];
  }

  /** (F4b) Candidati per l'incontro: fino a `n` compagni diversi non ancora in squadra. */
  randomNewCompanions(n = 2): string[] {
    const pool = COMPANIONS.filter((c) => !this.run.companions.some((x) => x.id === c.id)).map((c) => c.id);
    const out: string[] = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(this.rng.next() * pool.length), 1)[0]);
    return out;
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
    const before = this.run.currentHp;
    this.run.currentHp = Math.min(max, this.run.currentHp + Math.round(max * pct));
    this.recordOutsideHeal(this.run.currentHp - before);
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
    const fresh = { id, hp: this.compMax(id), charge: 0 };
    if (cs.length >= L.maxCompanions) {
      if (!replaceId) return 'needsReplace';
      const idx = cs.findIndex((c) => c.id === replaceId);
      if (idx < 0) throw new Error('Compagno da sostituire non presente');
      cs[idx] = fresh;
    } else cs.push(fresh);
    this.pruneRecruitNodes();
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

export function emptyAreaStats(): AreaStats {
  return { battles: 0, heroTurns: 0, damageTaken: 0, healedInBattle: 0, lifesteal: 0, healedOutside: 0, potions: 0, minHpPct: 1, playSec: 0 };
}

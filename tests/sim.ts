import { ENEMY_BY_ID } from '../src/data/enemies';
import { BALANCE } from '../src/data/balance';
import { ARTIFACT_BY_ID } from '../src/data/artifacts';
import type { NodeType } from '../src/data/areas';
import { createRunState, effectiveStats } from '../src/state/RunState';
import { Battle, makeCompanionUnit, makeEnemyUnit, makeHeroUnit } from '../src/systems/combat/Battle';
import type { Unit } from '../src/systems/combat/types';
import { resolveEvent } from '../src/systems/EventResolver';
import { RunController, type Reward } from '../src/systems/RunController';
import type { Ability } from '../src/types/content';
import type { RunStats } from '../src/types/game';

export interface RunResult {
  won: boolean; step: number; area: number; score: number; turns: number; level: number; rounds: number; battles: number;
  deathNode?: string; hpAtBoss: number[]; fruit: string; stats: RunStats;
}

/**
 * Due giocatori simulati:
 * - `naive` (fino alla 0.6.3): poteri quando può, pozione sotto il 35%, primo nemico, sempre la prima opzione.
 * - `smart` "giocatore attento" (F0): legge le intenzioni e si difende dai colpi forti, sceglie il bersaglio,
 *   usa i poteri ad area con più nemici, valuta tappe, ricompense ed eventi.
 */
export type Strategy = 'naive' | 'smart';

/** Interruttori del giocatore attento, per capire quale abilità conta di più (analisi F0). */
export const SMART = { guard: true, target: true, nodes: true, rewards: true, events: true };

export function playRun(seed: number, forceFruit?: string, strategy: Strategy = 'naive'): RunResult {
  const ctl = new RunController(createRunState('a', seed));
  ctl.start([]);
  const run = ctl.run;
  let rounds = 0, battles = 0; const hpAtBoss: number[] = [];
  if (forceFruit) { run.activeFruitIds = [forceFruit]; run.usedFruitIds = [forceFruit]; }
  const smart = strategy === 'smart';
  const hpPct = () => run.currentHp / effectiveStats(run).maxHp;
  const result = (won: boolean, turns: number, deathNode?: string): RunResult =>
    ({ won, step: run.stepIndex, area: run.areaIndex, score: run.score, turns, level: ctl.fruitLevel, rounds, battles, deathNode, hpAtBoss, fruit: run.activeFruitIds[0], stats: run.stats ?? { areas: [] } });
  for (;;) {
    if (run.stepIndex >= run.map.length) { if (!ctl.nextArea()) break; }
    const node = smart && SMART.nodes ? pickNode(ctl, ctl.currentStep.options, hpPct()) : ctl.currentStep.options[0];
    ctl.choose(node);
    if (node === 'battle' || node === 'elite' || node === 'boss') {
      const stats = effectiveStats(run);
      if (node === 'boss') hpAtBoss[run.areaIndex] = run.currentHp / stats.maxHp;
      battles++;
      const enemies = ctl.enemyGroup(node);
      const b = new Battle({
        hero: makeHeroUnit('Kai', stats, run.currentHp),
        companions: run.companions.map((c, i) => makeCompanionUnit(c.id, `c${i}`, c.hp, c.charge, ctl.companionScale)),
        enemies: enemies.map((id, i) => makeEnemyUnit(id, `e${i}`, ctl.enemyScale)),
        powers: ctl.battlePowers(),
        potions: run.potions,
        mods: ctl.battleMods(),
      }, ctl.rng);
      b.start();
      let turns = 0;
      while (b.phase === 'awaitingInput' && turns++ < 300) (smart ? smartTurn : naiveTurn)(b);
      rounds += turns;
      ctl.recordBattle(b.tally);
      if (b.phase !== 'victory') return result(false, turns, node);
      run.potions = b.potions;
      ctl.afterBattle(b.reviveUsed);
      ctl.onVictory(enemies, b.hero.hp, b.units.filter((u) => u.kind === 'companion').map((u) => ({ id: u.defId, hp: u.hp, charge: u.charge })));
      if (node === 'boss') ctl.onAreaCleared();
      const opts = ctl.rewardOptions(node);
      const r = smart && SMART.rewards ? pickReward(ctl, opts, hpPct()) : opts.find((o) => o.kind === 'awaken') ?? opts[0];
      if (r.kind === 'artifact') ctl.gainArtifact(r.id);
      else ctl.applySimple(r.kind);
    } else if (node === 'rest') ctl.healPct(BALANCE.rewards.restHealPct);
    else if (node === 'recruit') { const c = ctl.randomNewCompanion(); if (c) ctl.recruit(c); }
    else if (node === 'chest') { if (ctl.canAwaken && ctl.rng.next() < 0.35) ctl.awaken(); else { const a = ctl.randomNewArtifact(); if (a) ctl.gainArtifact(a); } }
    else if (node === 'event') {
      const ev = ctl.pickEvent();
      const choice = smart && SMART.events ? ev.choices.reduce((best, c) => (eventValue(ctl, c.outcome) > eventValue(ctl, best.outcome) ? c : best)) : ev.choices[0];
      const out = resolveEvent(ctl, choice.outcome);
      if (out.artifactOffer) ctl.gainArtifact(out.artifactOffer);
      ctl.completeEvent();
    }
    ctl.advance();
  }
  return result(true, 0);
}

// --- giocatore ingenuo (0.6.3) ---------------------------------------------------------------
function naiveTurn(b: Battle): void {
  const ready = b.alive('ally').find((u) => b.canSpecial(u));
  if (ready) { b.act({ type: 'special', companionUid: ready.uid }); return; }
  const target = b.enemies()[0].uid;
  const power = b.powers.find((p) => b.canUsePower(p) && powerUseful(b, p));
  if (b.hero.hp < b.hero.maxHp * 0.35 && b.potions > 0) b.act({ type: 'potion' });
  else if (power) b.act({ type: 'power', abilityId: power.id, targetUid: target });
  else b.act({ type: 'attack', targetUid: target });
}

/** Non rilancia un potenziamento ancora attivo e cura solo se serve. */
function powerUseful(b: Battle, p: Ability): boolean {
  const has = (id: string) => b.hero.statuses.some((st) => st.id === id);
  if (p.target === 'self') return !p.effects.some((e) => e.kind === 'status' && has(e.status));
  if (p.target === 'allAllies') return p.effects.some((e) => e.kind === 'heal') ? b.alive('ally').some((u) => u.hp < u.maxHp * 0.6) : !has('shield');
  return true;
}

// --- giocatore attento (F0) -------------------------------------------------------------------
const DEF_FACTOR = BALANCE.combat.defFactor;
const mitig = (def: number) => 100 / (100 + Math.max(0, def) * DEF_FACTOR);
const statusVal = (u: Unit, id: string) => u.statuses.find((s) => s.id === id)?.value ?? 0;
const dmgMult = (a: Ability) => a.effects.reduce((m, e) => m + (e.kind === 'damage' ? e.mult * (e.hits ?? 1) : 0), 0);

/** Danno atteso sull'eroe dalla prossima mossa di un nemico (in base all'intenzione mostrata). */
function expectedHit(b: Battle, e: Unit): number {
  const mv = b.moveOf(e);
  const mult = dmgMult(mv);
  if (!mult) return 0;
  // F1: il bersaglio è deciso in anticipo; i colpi caricati sono più forti
  const share = mv.target === 'allEnemies' ? 1 : mv.target === 'enemy' ? (e.aimUid === b.hero.uid ? 1 : 0) : 0;
  const boost = e.chargeState === 'release' ? BALANCE.combat.charged.mult : e.chargeState === 'windup' ? 0 : 1;
  const atk = e.atk * (1 + statusVal(e, 'atkUp')) * (1 - statusVal(e, 'weak'));
  const shield = statusVal(b.hero, 'shield');
  return Math.max(0, atk * mult * boost * mitig(b.hero.def) * share - shield / Math.max(1, b.enemies().length));
}

/** Bersaglio: chi si può finire subito, altrimenti chi fa più male per HP rimasto (evocatori in testa). */
function pickTarget(b: Battle): Unit {
  const foes = b.enemies();
  const basic = b.hero.atk * mitig(0) * 0.9;
  const killable = foes.filter((f) => f.hp <= basic * mitig(f.def));
  if (killable.length) return killable.reduce((m, f) => (f.atk > m.atk ? f : m));
  const threat = (f: Unit) => {
    const mv = b.moveOf(f);
    const summoner = mv.effects.some((e) => e.kind === 'summon') ? 2 : 1;
    // F1: chi cura o protegge gli alleati va eliminato presto
    const support = Object.values(ENEMY_BY_ID.get(f.defId)!.moves).some((m) => m.target !== 'self' && m.effects.some((e) => e.kind === 'heal' || e.kind === 'shield')) ? 1.8 : 1;
    return ((f.atk * Math.max(0.5, dmgMult(mv))) * summoner * support) / f.hp;
  };
  return foes.reduce((m, f) => (threat(f) > threat(m) ? f : m));
}

function smartTurn(b: Battle): void {
  const hero = b.hero;
  const target = SMART.target ? pickTarget(b) : b.enemies()[0];
  const ready = b.alive('ally').find((u) => b.canSpecial(u));
  if (ready) { b.act({ type: 'special', companionUid: ready.uid, targetUid: target.uid }); return; }
  const foes = b.enemies();
  const incoming = foes.reduce((s, e) => s + expectedHit(b, e), 0);
  const heavy = foes.some((e) => b.moveOf(e).intent === 'heavy');
  const usable = b.powers.filter((p) => b.canUsePower(p) && powerUseful(b, p));
  const aoe = usable.find((p) => p.target === 'allEnemies');
  const protective = usable.find((p) => p.target === 'self' || p.target === 'allAllies');
  const single = usable.find((p) => p.target === 'enemy');

  // 1) pericolo di morte: pozione (se la cura serve davvero), altrimenti difesa
  const potionHeal = hero.maxHp * BALANCE.combat.potionHealPct;
  if (hero.hp <= incoming * 1.25 || hero.hp < hero.maxHp * 0.3) {
    if (b.potions > 0 && hero.maxHp - hero.hp >= potionHeal * 0.8) { b.act({ type: 'potion' }); return; }
    if (protective && heavy) { b.act({ type: 'power', abilityId: protective.id }); return; }
    if (SMART.guard && incoming > 0) { b.act({ type: 'guard' }); return; }
  }
  // 2) F1: colpo caricato in partenza (su di te o su un compagno): si para
  const releasing = foes.filter((e) => e.chargeState === 'release' && dmgMult(b.moveOf(e)) > 0);
  const killNow = releasing.length === 1 && foes.length === 1 && single && releasing[0].hp <= hero.atk * dmgMult(single) * mitig(releasing[0].def) * 0.9;
  if (SMART.guard && releasing.length && !killNow) { b.act({ type: 'guard' }); return; }
  // 3) colpo forte in arrivo: ci si difende (dimezza e dà energia), a meno di poter chiudere lo scontro
  const canFinish = foes.length === 1 && single && foes[0].hp <= hero.atk * dmgMult(single) * mitig(foes[0].def) * 0.9;
  if (SMART.guard && heavy && incoming >= hero.maxHp * 0.12 && !canFinish) {
    if (protective) { b.act({ type: 'power', abilityId: protective.id }); return; }
    b.act({ type: 'guard' }); return;
  }
  // 3) potere ad area con più nemici, poi potere sul bersaglio, poi potenziamenti
  if (aoe && foes.length >= 2) { b.act({ type: 'power', abilityId: aoe.id }); return; }
  if (single) { b.act({ type: 'power', abilityId: single.id, targetUid: target.uid }); return; }
  if (aoe) { b.act({ type: 'power', abilityId: aoe.id }); return; }
  if (protective && incoming > 0) { b.act({ type: 'power', abilityId: protective.id }); return; }
  b.act({ type: 'attack', targetUid: target.uid });
}

/** Preferenze di tappa del giocatore attento (modificabili per le analisi). */
export const NODE_SCORE = {
  low: { rest: 100, chest: 70, event: 60, recruit: 55, battle: 20, elite: 0, boss: 0 } as Record<string, number>,
  high: (hp: number): Record<string, number> => ({ recruit: 90, elite: hp > 0.7 ? 85 : 30, chest: 75, event: 55, battle: 50, rest: hp < 0.7 ? 65 : 10, boss: 0 }),
};

function pickNode(ctl: RunController, opts: NodeType[], hp: number): NodeType {
  const score = hp < 0.45 ? NODE_SCORE.low : NODE_SCORE.high(hp);
  void ctl;
  return opts.reduce((best, o) => ((score[o] ?? 0) > (score[best] ?? 0) ? o : best));
}

function pickReward(ctl: RunController, opts: Reward[], hp: number): Reward {
  const v = (r: Reward): number => {
    switch (r.kind) {
      case 'awaken': return 100;
      case 'artifact': { const rar = ARTIFACT_BY_ID.get(r.id)?.rarity; return rar === 'epic' ? 90 : rar === 'rare' ? 70 : 50; }
      case 'heal': return hp < 0.5 ? 85 : hp < 0.75 ? 45 : 15;
      case 'potion': return ctl.run.potions < 2 ? 60 : 30;
      case 'maxHp': return 40;
    }
  };
  return opts.reduce((best, r) => (v(r) > v(best) ? r : best));
}

/** Valore atteso di una scelta d'evento per un giocatore attento (0 = non fare nulla). */
function eventValue(ctl: RunController, outcome: string): number {
  const run = ctl.run;
  const hp = run.currentHp / effectiveStats(run).maxHp;
  switch (outcome) {
    case 'spring_drink': return hp < 0.8 ? 1 : 0.2;
    case 'trade_potion_fruit': return run.potions > 0 && ctl.canAwaken ? 0.9 : -1;
    case 'altar_strength': return hp > 0.5 ? 0.5 : -0.5;
    case 'cat_bush': return 0.8;
    case 'cat_pet': return 0.6;
    case 'gulls_buy': return hp > 0.4 ? 0.8 : -1;
    case 'octopus_bet': return run.potions > 0 ? 0.1 : -1;
    case 'turtle_ride': return hp < 0.6 ? 0.9 : 0.3;
    case 'turtle_advice': return 0.5;
    case 'clam_reach': return hp > 0.5 ? 0.6 : -1;
    case 'medusa_pact': return ctl.canAwaken ? 0.9 : -1;
    case 'library_read': return 0.7;
    case 'ghost_cards': return 0.3;
    case 'cannon_take': return 0.8;
    case 'cook_meal': return hp < 0.8 ? 0.9 : 0.2;
    case 'cook_spicy': return hp > 0.5 ? 0.5 : -0.2;
    case 'bottle_read': return 0.3;
    default: return 0;
  }
}


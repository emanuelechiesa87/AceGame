import { ARTIFACT_BY_ID } from '../src/data/artifacts';
import { FRUIT_BY_ID, fruitAbility } from '../src/data/fruits';
import { createRunState, effectiveStats } from '../src/state/RunState';
import { Battle, makeCompanionUnit, makeEnemyUnit, makeHeroUnit } from '../src/systems/combat/Battle';
import { resolveEvent } from '../src/systems/EventResolver';
import { RunController } from '../src/systems/RunController';
import { EVENTS } from '../src/data/events';

export interface RunResult { won: boolean; step: number; area: number; score: number; turns: number; level: number; rounds: number; battles: number; deathNode?: string; hpAtBoss: number[] }

/** Strategia "giocatore medio": poteri quando può, pozione sotto il 35%, speciali appena pronte. */
export function playRun(seed: number, forceFruit?: string): RunResult {
  const ctl = new RunController(createRunState('a', seed));
  ctl.start([]);
  const run = ctl.run;
  let rounds = 0, battles = 0; const hpAtBoss: number[] = [];
  if (forceFruit) { run.activeFruitIds = [forceFruit]; run.usedFruitIds = [forceFruit]; }
  for (;;) {
    if (run.stepIndex >= run.map.length) { if (!ctl.nextArea()) break; }
    const node = ctl.currentStep.options[0];
    ctl.choose(node);
    if (node === 'battle' || node === 'elite' || node === 'boss') {
      const stats = effectiveStats(run);
      if (node === 'boss') hpAtBoss[run.areaIndex] = run.currentHp / stats.maxHp;
      battles++;
      const enemies = ctl.enemyGroup(node);
      const arts = run.artifactIds.map((id) => ARTIFACT_BY_ID.get(id)!);
      const b = new Battle({
        hero: makeHeroUnit('Kai', stats, run.currentHp),
        companions: run.companions.map((c, i) => makeCompanionUnit(c.id, `c${i}`, c.hp, c.charge, ctl.companionScale)),
        enemies: enemies.map((id, i) => makeEnemyUnit(id, `e${i}`, ctl.enemyScale)),
        powers: run.activeFruitIds.map((id) => fruitAbility(FRUIT_BY_ID.get(id)!, ctl.fruitLevel)),
        potions: run.potions,
        mods: { powerDamageMult: arts.reduce((m, a) => m * (a.powerDamageMult ?? 1), 1), surviveLethalOnce: arts.some((a) => a.surviveLethalOncePerBattle), enemyScale: ctl.enemyScale },
      }, ctl.rng);
      b.start();
      let turns = 0;
      while (b.phase === 'awaitingInput' && turns++ < 200) {
        const ready = b.alive('ally').find((u) => b.canSpecial(u));
        if (ready) { b.act({ type: 'special', companionUid: ready.uid }); continue; }
        const target = b.enemies()[0].uid;
        // un giocatore medio non rilancia un potenziamento ancora attivo e cura solo se serve
        const has = (id: string) => b.hero.statuses.some((st) => st.id === id);
        const useful = (p: (typeof b.powers)[number]) => {
          if (p.target === 'self') return !p.effects.some((e) => e.kind === 'status' && has(e.status));
          if (p.target === 'allAllies') return p.effects.some((e) => e.kind === 'heal') ? b.alive('ally').some((u) => u.hp < u.maxHp * 0.6) : !has('shield');
          return true;
        };
        const power = b.powers.find((p) => b.canUsePower(p) && useful(p));
        if (b.hero.hp < b.hero.maxHp * 0.35 && b.potions > 0) b.act({ type: 'potion' });
        else if (power) b.act({ type: 'power', abilityId: power.id, targetUid: target });
        else b.act({ type: 'attack', targetUid: target });
      }
      rounds += turns;
      if (b.phase !== 'victory') return { won: false, step: run.stepIndex, area: run.areaIndex, score: run.score, turns, level: ctl.fruitLevel, rounds, battles, deathNode: node, hpAtBoss };
      run.potions = b.potions;
      ctl.onVictory(enemies, b.hero.hp, b.units.filter((u) => u.kind === 'companion').map((u) => ({ id: u.defId, hp: u.hp, charge: u.charge })));
      if (node === 'boss') ctl.onAreaCleared();
      // giocatore medio: risveglio se c'è, altrimenti la prima opzione
      const opts = ctl.rewardOptions(node);
      const r = opts.find((o) => o.kind === 'awaken') ?? opts[0];
      if (r.kind === 'artifact') ctl.gainArtifact(r.id);
      else ctl.applySimple(r.kind);
    } else if (node === 'rest') ctl.healPct(0.35);
    else if (node === 'recruit') { const c = ctl.randomNewCompanion(); if (c) ctl.recruit(c); }
    else if (node === 'chest') { if (ctl.canAwaken && ctl.rng.next() < 0.35) ctl.awaken(); else { const a = ctl.randomNewArtifact(); if (a) ctl.gainArtifact(a); } }
    else if (node === 'event') { const ev = ctl.rng.pick(EVENTS); const out = resolveEvent(ctl, ev.choices[0].outcome); if (out.artifactOffer) ctl.gainArtifact(out.artifactOffer); }
    ctl.advance();
  }
  return { won: true, step: run.stepIndex, area: run.areaIndex, score: run.score, turns: 0, level: ctl.fruitLevel, rounds, battles, hpAtBoss };
}


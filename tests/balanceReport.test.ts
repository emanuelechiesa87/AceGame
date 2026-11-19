import { describe, it } from 'vitest';
declare const process: { env: Record<string, string | undefined> };
import { FRUITS } from '../src/data/fruits';
import { totalStats } from '../src/systems/runStats';
import { Battle } from '../src/systems/combat/Battle';
import { NODE_SCORE, playRun, SMART, type RunResult, type Strategy } from './sim';

/**
 * Rapporto di bilanciamento: BAL=1 npx vitest run tests/balanceReport.test.ts
 * Opzioni: BAL_N (run per frutto, default 150), BAL_FRUITS=0 (solo il generale),
 * BAL_STRAT=naive|smart|both (default both), BAL_ANALYSIS=1 (cosa rende facile la run: compagni, tappe, difesa).
 */
const on = !!process.env.BAL;
const N = Number(process.env.BAL_N ?? 150);
const STRATS: Strategy[] = process.env.BAL_STRAT === 'naive' ? ['naive'] : process.env.BAL_STRAT === 'smart' ? ['smart'] : ['naive', 'smart'];

const pct = (x: number) => (isNaN(x) ? '-' : `${(x * 100).toFixed(0)}%`);
const avg = (v: number[]) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : NaN);

function report(label: string, res: RunResult[]) {
  const n = res.length;
  const reached = [0, 1, 2, 3].map((a) => res.filter((r) => r.area >= a).length);
  const survived = [0, 1, 2, 3].map((a) => (reached[a] ? 1 - res.filter((r) => !r.won && r.area === a).length / reached[a] : NaN));
  const bossDeaths = [0, 1, 2, 3].map((a) => res.filter((r) => !r.won && r.area === a && r.deathNode === 'boss').length);
  const allDeaths = [0, 1, 2, 3].map((a) => res.filter((r) => !r.won && r.area === a).length);
  const hpBoss = [0, 1, 2, 3].map((a) => avg(res.map((r) => r.hpAtBoss[a]).filter((x) => x !== undefined)));
  const won = res.filter((r) => r.won);
  const tot = won.map((r) => totalStats(r.stats));
  const minHp = [0, 1, 2, 3].map((a) => avg(won.map((r) => r.stats.areas[a]?.minHpPct ?? NaN)));
  const turns = avg(tot.map((t) => t.heroTurns));
  const dmg = avg(tot.map((t) => t.damageTaken));
  const healIn = avg(tot.map((t) => t.healedInBattle));
  const steal = avg(tot.map((t) => t.lifesteal));
  const healOut = avg(tot.map((t) => t.healedOutside));
  const pots = avg(tot.map((t) => t.potions));
  console.log(
    `[${label}] vittorie ${pct(won.length / n)} · superano i mari ${survived.map(pct).join('/')} · morti boss/tot ${bossDeaths.map((b, i) => `${b}/${allDeaths[i]}`).join(' ')} · HP dal boss ${hpBoss.map(pct).join('/')}\n` +
    `    vittorie: turni eroe ${turns.toFixed(0)} (${avg(tot.map((t) => t.heroTurns / t.battles)).toFixed(1)}/scontro) · HP persi ${dmg.toFixed(0)} · cure in lotta ${healIn.toFixed(0)} (furto vita ${steal.toFixed(0)}) · cure fuori ${healOut.toFixed(0)} · pozioni ${pots.toFixed(1)} · HP minimo per mare ${minHp.map(pct).join('/')}`,
  );
}

describe.skipIf(!on)('Rapporto di bilanciamento', () => {
  it('generale e per frutto', () => {
    for (const s of STRATS) {
      console.log(`\n===== giocatore ${s === 'smart' ? 'ATTENTO' : 'INGENUO'} =====`);
      report('tutti', Array.from({ length: N * 2 }, (_, i) => playRun(i + 1, undefined, s)));
      if (process.env.BAL_FRUITS !== '0') for (const f of FRUITS) report(f.id.replace('fruit_', ''), Array.from({ length: N }, (_, i) => playRun(5000 + i, f.id, s)));
    }
  }, 1200000);
});

/** Analisi F0: quanto pesano compagni, scelta delle tappe e difesa per il giocatore attento. */
describe.skipIf(!on || !process.env.BAL_ANALYSIS)('Analisi della difficoltà', () => {
  it('quote di danno e ablazioni', () => {
    const dealt = { hero: 0, companion: 0 }, taken = { hero: 0, companion: 0 };
    const orig = Battle.prototype.act;
    Battle.prototype.act = function (a) {
      const ev = orig.call(this, a);
      for (const e of ev) if (e.t === 'damage') {
        const src = this.unit(e.source), tgt = this.unit(e.target);
        if (tgt?.side === 'enemy' && src) dealt[src.kind === 'companion' ? 'companion' : 'hero'] += e.amount + e.absorbed;
        if (tgt?.side === 'ally') taken[tgt.kind === 'companion' ? 'companion' : 'hero'] += e.amount + e.absorbed;
      }
      return ev;
    };
    for (let i = 0; i < N; i++) playRun(i + 1, undefined, 'smart');
    Battle.prototype.act = orig;
    const share = (o: { hero: number; companion: number }) => `eroe ${pct(o.hero / (o.hero + o.companion))} · compagni ${pct(o.companion / (o.hero + o.companion))}`;
    console.log(`[quote] danno inflitto: ${share(dealt)} · danno subito dalla squadra: ${share(taken)}`);
    const variant = (label: string, setup: () => void, undo: () => void) => { setup(); report(label, Array.from({ length: N * 2 }, (_, i) => playRun(i + 1, undefined, 'smart'))); undo(); };
    const high = NODE_SCORE.high, low = NODE_SCORE.low;
    variant('attento, senza compagni', () => { NODE_SCORE.high = (hp) => ({ ...high(hp), recruit: 0 }); NODE_SCORE.low = { ...low, recruit: 0 }; }, () => { NODE_SCORE.high = high; NODE_SCORE.low = low; });
    variant('attento, tappe come l\'ingenuo', () => (SMART.nodes = false), () => (SMART.nodes = true));
    variant('attento, senza difesa', () => (SMART.guard = false), () => (SMART.guard = true));
  }, 1200000);
});

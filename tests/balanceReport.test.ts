import { describe, it } from 'vitest';
declare const process: { env: Record<string, string | undefined> };
import { FRUITS } from '../src/data/fruits';
import { playRun, type RunResult } from './sim';

/** Rapporto di bilanciamento dettagliato: si lancia con BAL=1 npx vitest run tests/balanceReport.test.ts */
const on = !!process.env.BAL;
const N = Number(process.env.BAL_N ?? 150);

function report(label: string, res: RunResult[]) {
  const n = res.length;
  const reached = [0, 1, 2, 3].map((a) => res.filter((r) => r.area >= a).length);
  const survived = [0, 1, 2, 3].map((a) => {
    const died = res.filter((r) => !r.won && r.area === a).length;
    return reached[a] ? 1 - died / reached[a] : 0;
  });
  const bossDeaths = [0, 1, 2, 3].map((a) => res.filter((r) => !r.won && r.area === a && r.deathNode === 'boss').length);
  const allDeaths = [0, 1, 2, 3].map((a) => res.filter((r) => !r.won && r.area === a).length);
  const hpBoss = [0, 1, 2, 3].map((a) => { const v = res.map((r) => r.hpAtBoss[a]).filter((x) => x !== undefined); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : NaN; });
  const won = res.filter((r) => r.won);
  const rpb = won.length ? won.reduce((s, r) => s + r.rounds / r.battles, 0) / won.length : NaN;
  const pct = (x: number) => `${(x * 100).toFixed(0)}%`;
  console.log(`[${label}] vittorie ${pct(won.length / n)} · superano il mare 1/2/3/4: ${survived.map(pct).join(' / ')} · morti al boss/totali per mare: ${bossDeaths.map((b, i) => `${b}/${allDeaths[i]}`).join(' ')} · HP all'arrivo dal boss: ${hpBoss.map((h) => (isNaN(h) ? '-' : pct(h))).join(' / ')} · turni medi per scontro ${rpb.toFixed(1)}`);
}

describe.skipIf(!on)('Rapporto di bilanciamento', () => {
  it('generale e per frutto', () => {
    report('tutti', Array.from({ length: N * 2 }, (_, i) => playRun(i + 1)));
    if (process.env.BAL_FRUITS !== '0') for (const f of FRUITS) report(f.id.replace('fruit_', ''), Array.from({ length: N }, (_, i) => playRun(5000 + i, f.id)));
  }, 600000);
});

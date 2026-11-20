import { it } from 'vitest';
import { FRUITS } from '../src/data/fruits';
import { BRANCH, playRun } from './sim';

declare const process: { env: Record<string, string | undefined> };

/**
 * F5: vittorie del giocatore attento per frutto e strada.
 * `BRANCHES=1 BR_PICK=a|b BR_N=100 npx vitest run tests/branchReport.test.ts --silent=false`
 * (BR_FRUITS=fruit_ember,fruit_frost per limitarli).
 */
it.skipIf(!process.env.BRANCHES)('rapporto strade', () => {
  BRANCH.pick = (process.env.BR_PICK ?? 'a') as 'a' | 'b';
  const N = Number(process.env.BR_N ?? 100);
  const only = process.env.BR_FRUITS?.split(',');
  const rows: string[] = [];
  for (const f of FRUITS) {
    if (only && !only.includes(f.id)) continue;
    let w = 0, lvl3 = 0;
    for (let s = 1; s <= N; s++) { const r = playRun(5000 + s, f.id, 'smart'); if (r.won) w++; if (r.level >= 3) lvl3++; }
    rows.push(`STRADA ${BRANCH.pick} ${f.name.padEnd(18)} ${String(Math.round((w / N) * 100)).padStart(3)}%  (al III: ${Math.round((lvl3 / N) * 100)}%)`);
  }
  console.log(rows.join('\n'));
}, 3_600_000);

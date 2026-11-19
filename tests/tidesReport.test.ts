import { it } from 'vitest';
import { MAX_TIDE } from '../src/data/tides';
import { playRun } from './sim';
declare const process: { env: Record<string, string | undefined> };

/** Curva delle Maree (F3): TIDES=1 npx vitest run tests/tidesReport.test.ts --silent=false (TIDES_N run per Marea, default 400). */
it.skipIf(!process.env.TIDES)('curva delle Maree', () => {
  const N = Number(process.env.TIDES_N ?? 400);
  for (let t = 0; t <= MAX_TIDE; t++) {
    let w = 0, n = 0;
    for (let s = 0; s < N; s++) { if (playRun(9000 + s, undefined, 'smart', t).won) w++; if (playRun(9000 + s, undefined, 'naive', t).won) n++; }
    console.log(`Marea ${String(t).padStart(2)}: attento ${(100 * w / N).toFixed(0)}% · ingenuo ${(100 * n / N).toFixed(0)}%`);
  }
}, 1_800_000);

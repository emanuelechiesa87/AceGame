import { it, vi } from 'vitest';
vi.mock('phaser', () => ({ default: {} }));
declare const process: { env: Record<string, string | undefined> };
import { writeFileSync } from 'node:fs';
// Anteprima dei disegni F1 su un foglio PPM: PREVIEW=1 npx vitest run tests/creaturePreview.test.ts
it.skipIf(!process.env.PREVIEW)('anteprima creature', async () => {
  const { F1_CREATURES } = await import('../src/pixel/f1Creatures');
  const S = 4, cell = 70;
  const ids = Object.keys(F1_CREATURES);
  const cols = 6, W = cols * cell * 2 * S, rows = Math.ceil(ids.length / cols);
  const H = rows * cell * S;
  const buf = new Uint8Array(W * H * 3).fill(200);
  ids.forEach((id, i) => {
    const d = F1_CREATURES[id];
    for (const hit of [false, true]) {
      const ox = ((i % cols) * 2 + (hit ? 1 : 0)) * cell * S, oy = Math.floor(i / cols) * cell * S;
      d.draw((x, y, c, w = 1, h = 1) => {
        const n = parseInt(c.slice(1), 16);
        for (let yy = y * S; yy < (y + h) * S; yy++) for (let xx = x * S; xx < (x + w) * S; xx++) {
          const X = ox + Math.round(xx), Y = oy + Math.round(yy);
          if (X < ox || Y < oy || X >= ox + cell * S || Y >= oy + cell * S) continue;
          const k = (Y * W + X) * 3; buf[k] = n >> 16; buf[k + 1] = (n >> 8) & 255; buf[k + 2] = n & 255;
        }
      }, hit);
    }
  });
  writeFileSync(process.env.PREVIEW_OUT ?? '/tmp/creature_preview.ppm', Buffer.concat([Buffer.from(`P6 ${W} ${H} 255\n`), Buffer.from(buf)]));
  console.log(ids.join(','));
});

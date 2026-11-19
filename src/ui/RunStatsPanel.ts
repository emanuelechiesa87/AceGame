import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../app/config';
import { AREAS } from '../data/areas';
import { statsRows } from '../systems/runStats';
import type { RunStats } from '../types/game';
import { Button } from './Button';
import { addBody, addTitle } from './text';
import { panel } from './widgets';

/**
 * Tabella delle statistiche della run (F0): una colonna per mare più il totale.
 * Si apre sopra il riepilogo e blocca i tocchi sotto.
 */
export function openRunStatsPanel(scene: Phaser.Scene, stats: RunStats): void {
  const items: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T): T => { items.push(o); return o; };
  const close = () => items.forEach((o) => o.destroy());

  keep(scene.add.rectangle(-400, -800, GAME_WIDTH + 800, GAME_HEIGHT + 1600, COLORS.background, 0.85).setOrigin(0).setInteractive());
  const top = 150, h = 900;
  keep(panel(scene, 24, top, GAME_WIDTH - 48, h, COLORS.panel, 0.98));
  keep(addTitle(scene, GAME_WIDTH / 2, top + 60, 'STATISTICHE', 48).setColor('#ffcf3a'));

  const n = stats.areas.length;
  const labelW = 175;
  const colW = (GAME_WIDTH - 50 - labelW - 50) / (n + 1);
  const colX = (i: number) => 50 + labelW + colW * (i + 0.5);
  const headY = top + 140;
  for (let i = 0; i <= n; i++) {
    const head = i < n ? `Mare ${i + 1}` : 'Totale';
    keep(addBody(scene, colX(i), headY, head, 19, i < n ? '#fbe9c8' : '#ffcf3a'));
    if (i < n) keep(addBody(scene, colX(i), headY + 26, AREAS[i]?.name.split(' ').pop() ?? '', 15, '#c9b38a'));
  }
  statsRows(stats).forEach((r, k) => {
    const y = headY + 85 + k * 58;
    keep(addBody(scene, 50, y, r.label, 20, '#fbe9c8').setOrigin(0, 0.5));
    r.values.forEach((v, i) => keep(addBody(scene, colX(i), y, v, 19, i < n ? '#ffffff' : '#ffcf3a')));
  });
  keep(addBody(scene, GAME_WIDTH / 2, top + h - 125, 'Tempo = gioco effettivo con l\'app aperta. Cure in lotta = pozioni, poteri, compagni e furto vita.', 17, '#c9b38a').setWordWrapWidth(600));
  keep(new Button(scene, GAME_WIDTH / 2, top + h - 55, 'CHIUDI', close, { variant: 'secondary', width: 280, height: 80, fontSize: 38 }));
}

import Phaser from 'phaser';
import { COLORS } from '../app/config';
import { NODE_LABELS } from '../data/areas';
import { BALANCE } from '../data/balance';
import { creatureKey, iconKey } from '../art/registry';
import { CREATURE_SCALE } from '../art/creatures';
import { effectiveStats } from '../state/RunState';
import type { RunState } from '../types/game';
import { addBody } from './text';
import { HpBar, icon, panel } from './widgets';
import { TEXTURE_SCALE } from '../app/config';

/** Barra superiore della run: HP, pozioni, frutti (3 slot), compagni, punteggio. */
export class RunHud {
  constructor(scene: Phaser.Scene, run: RunState, y = 20) {
    const stats = effectiveStats(run);
    panel(scene, 16, y, 688, 176, COLORS.panel, 0.92);
    addBody(scene, 40, y + 30, 'HP', 26, '#ff9ab0').setOrigin(0, 0.5);
    new HpBar(scene, 255, y + 18, 300, 24).set(run.currentHp, stats.maxHp, 0, false);
    icon(scene, 466, y + 30, iconKey('misc', 'potion'), 44);
    addBody(scene, 504, y + 30, `×${run.potions}`, 28, '#ffffff').setOrigin(0, 0.5);
    addBody(scene, 690, y + 30, `${run.score} pt`, 26, '#ffcf3a').setOrigin(1, 0.5);

    // frutti: 3 slot, quelli vuoti tratteggiati
    addBody(scene, 50, y + 96, 'POTERI', 20, '#c2b8e8').setOrigin(0, 0.5);
    for (let i = 0; i < BALANCE.limits.maxActivePowers; i++) {
      const x = 186 + i * 74, cy = y + 112;
      const g = scene.add.graphics();
      g.lineStyle(3, 0x8f86b8, 1).strokeCircle(x, cy, 31);
      const id = run.activeFruitIds[i];
      if (id) icon(scene, x, cy, iconKey('fruit', id), 64);
    }
    addBody(scene, 430, y + 96, 'SQUADRA', 20, '#c2b8e8').setOrigin(0, 0.5);
    for (let i = 0; i < BALANCE.limits.maxCompanions; i++) {
      const x = 470 + i * 78, cy = y + 116;
      scene.add.graphics().lineStyle(3, 0x8f86b8, 1).strokeCircle(x, cy, 32);
      const c = run.companions[i];
      if (c) scene.add.image(x, cy + 30, creatureKey(c.id)).setOrigin(0.5, 1).setScale((CREATURE_SCALE[c.id] * 0.38) / TEXTURE_SCALE);
    }
    // artefatti in piccolo, sotto
    run.artifactIds.forEach((id, i) => icon(scene, 50 + i * 40, y + 152, iconKey('artifact', id), 34));
  }
}

/** Avanzamento dell'area: un pallino per passo, con l'icona del nodo scelto. */
export function mapProgress(scene: Phaser.Scene, run: RunState, y: number): void {
  const n = run.map.length;
  const x0 = 80, x1 = 640;
  const g = scene.add.graphics();
  g.lineStyle(6, COLORS.ink, 1).lineBetween(x0, y, x1, y);
  g.lineStyle(3, 0xffcf3a, 1).lineBetween(x0, y, x0 + ((x1 - x0) * run.stepIndex) / (n - 1), y);
  run.map.forEach((step, i) => {
    const x = x0 + ((x1 - x0) * i) / (n - 1);
    const done = i < run.stepIndex, cur = i === run.stepIndex;
    g.fillStyle(COLORS.ink, 1).fillCircle(x, y, cur ? 26 : 20);
    g.fillStyle(done ? 0xffcf3a : cur ? 0xff5f6d : 0x3a3366, 1).fillCircle(x, y, cur ? 21 : 15);
    const shown = step.chosen ?? (step.options.length === 1 ? step.options[0] : undefined);
    if (shown && (done || cur || shown === 'boss')) icon(scene, x, y, iconKey('node', shown), cur ? 34 : 26);
  });
  void NODE_LABELS;
}

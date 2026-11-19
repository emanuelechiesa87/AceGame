import Phaser from 'phaser';
import { COLORS } from '../app/config';
import { AREAS, NODE_LABELS } from '../data/areas';
import { BALANCE } from '../data/balance';
import { MAX_FRUIT_LEVEL } from '../data/fruits';
import { ROMAN } from './fruitFx';
import { creatureKey, iconKey } from '../pixel/keys';
import { CREATURE_SCALE } from '../pixel/creatures';
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

    // il frutto della run con il suo livello di risveglio (I-V); i livelli
    // non ancora raggiungibili in quest'area sono sbarrati
    addBody(scene, 50, y + 96, 'FRUTTO', 20, '#f1d7a8').setOrigin(0, 0.5);
    const id = run.activeFruitIds[0];
    if (id) {
      icon(scene, 190, y + 110, iconKey('fruit', id), 72);
      const lvl = run.fruitLevel ?? 1;
      const g = scene.add.graphics();
      const cap = Math.min(MAX_FRUIT_LEVEL, AREAS[Math.min(run.areaIndex, AREAS.length - 1)].maxFruitLevel);
      for (let i = 0; i < MAX_FRUIT_LEVEL; i++) {
        const x = 240 + i * 28;
        g.fillStyle(COLORS.ink, 1).fillRect(x, y + 100, 22, 22);
        g.fillStyle(i < lvl ? 0xffcf3a : 0x4a2a14, 1).fillRect(x + 4, y + 104, 14, 14);
        if (i >= cap) g.lineStyle(3, 0x1f1633, 1).lineBetween(x + 4, y + 118, x + 18, y + 104);
      }
      addBody(scene, 309, y + 138, `Lv ${ROMAN[lvl]}`, 18, '#ffcf3a');
    }
    addBody(scene, 438, y + 70, 'SQUADRA', 20, '#f1d7a8').setOrigin(0, 0.5);
    for (let i = 0; i < BALANCE.limits.maxCompanions; i++) {
      const x = 470 + i * 78, cy = y + 116;
      scene.add.graphics().lineStyle(4, 0x8a5232, 1).strokeRect(x - 32, cy - 32, 64, 64);
      const c = run.companions[i];
      if (c) scene.add.image(x, cy + 30, creatureKey(c.id)).setOrigin(0.5, 1).setScale((CREATURE_SCALE[c.id] * 0.48) / TEXTURE_SCALE);
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
    const r = cur ? 24 : 18;
    g.fillStyle(COLORS.ink, 1).fillRect(x - r, y - r, r * 2, r * 2);
    g.fillStyle(done ? 0xffcf3a : cur ? 0xe4342f : 0x6b3a1e, 1).fillRect(x - r + 4, y - r + 4, r * 2 - 8, r * 2 - 8);
    const shown = step.chosen ?? (step.options.length === 1 ? step.options[0] : undefined);
    if (shown && (done || cur || shown === 'boss')) icon(scene, x, y, iconKey('node', shown), cur ? 34 : 26);
  });
  void NODE_LABELS;
}

import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../app/config';
import { Button } from './Button';
import { addBody, addTitle } from './text';
import { panel } from './widgets';

export interface TutorialStep {
  title: string;
  text: string;
  /** riquadro da evidenziare (coordinate logiche) */
  box?: { x: number; y: number; w: number; h: number };
}

/**
 * Tutorial a schede: velo scuro con un "buco" sull'elemento spiegato, scheda di testo,
 * AVANTI e SALTA. Ritorna quando il giocatore ha finito (o saltato).
 */
export function runTutorial(scene: Phaser.Scene, steps: TutorialStep[], wrap: <T>(fn: () => T) => T = (fn) => fn()): Promise<void> {
  return new Promise((resolve) => {
    let i = 0;
    let layer: Phaser.GameObjects.Container | undefined;
    const close = () => { layer?.destroy(); resolve(); };
    const show = () => wrap(() => {
      layer?.destroy();
      const st = steps[i];
      layer = scene.add.container(0, 0).setDepth(950);
      const g = scene.add.graphics();
      const dim = (x: number, y: number, w: number, h: number) => g.fillStyle(COLORS.background, 0.78).fillRect(x, y, w, h);
      const L = -400, T = -800, R = GAME_WIDTH + 400, B = 2080;
      if (st.box) {
        const { x, y, w, h } = st.box;
        dim(L, T, R - L, y - T); dim(L, y + h, R - L, B - y - h); dim(L, y, x - L, h); dim(x + w, y, R - x - w, h);
        const frame = scene.add.graphics();
        frame.lineStyle(8, COLORS.ink, 1).strokeRect(x - 4, y - 4, w + 8, h + 8);
        frame.lineStyle(5, COLORS.accent, 1).strokeRect(x - 4, y - 4, w + 8, h + 8);
        layer.add([g, frame]);
        scene.tweens.add({ targets: frame, alpha: 0.35, duration: 450, yoyo: true, repeat: -1 });
      } else {
        dim(L, T, R - L, B - T);
        layer.add(g);
      }
      // la zona velata blocca i tocchi sul gioco
      const blocker = scene.add.rectangle(L, T, R - L, B - T, 0, 0.001).setOrigin(0).setInteractive();
      layer.addAt(blocker, 0);

      const cardTop = st.box && st.box.y + st.box.h / 2 < 560 ? Math.min(st.box.y + st.box.h + 30, 620) : 170;
      layer.add(panel(scene, 40, cardTop, 640, 300, COLORS.panel, 0.98));
      layer.add(addTitle(scene, GAME_WIDTH / 2, cardTop + 50, st.title, 40).setColor('#ffcf3a'));
      layer.add(addBody(scene, GAME_WIDTH / 2, cardTop + 135, st.text, 25, '#fff7e6').setWordWrapWidth(580).setLineSpacing(6));
      layer.add(addBody(scene, 80, cardTop + 250, `${i + 1}/${steps.length}`, 22, '#f1d7a8').setOrigin(0, 0.5));
      const last = i === steps.length - 1;
      layer.add(new Button(scene, 500, cardTop + 250, last ? 'GIOCA!' : 'AVANTI', () => { i++; if (i >= steps.length) close(); else show(); }, { width: 250, height: 76, fontSize: 34, cooldownMs: 250 }));
      if (!last) layer.add(new Button(scene, 280, cardTop + 250, 'SALTA', close, { variant: 'secondary', width: 170, height: 64, fontSize: 26 }));
    });
    show();
  });
}

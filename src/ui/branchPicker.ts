import Phaser from 'phaser';
import { GAME_WIDTH } from '../app/config';
import { BRANCH_LEVEL, FRUIT_BY_ID, fruitAbility, type FruitBranch } from '../data/fruits';
import { iconKey } from '../pixel/keys';
import { GameSession } from '../state/GameSession';
import { Audio } from '../systems/Audio';
import { Button } from './Button';
import { modal } from './Offers';
import { addBody, addTitle, fitWidth } from './text';
import { icon, panel } from './widgets';

/**
 * F5: scelta della strada del frutto al Risveglio III. Si apre solo se serve
 * (`ctl.needsBranchChoice`) e si chiude quando la strada è scelta.
 */
export function pickBranch(scene: Phaser.Scene): Promise<void> {
  const ctl = GameSession.ctl;
  if (!ctl?.needsBranchChoice) return Promise.resolve();
  const f = FRUIT_BY_ID.get(ctl.run.activeFruitIds[0])!;
  const br = f.branches!;
  return new Promise((resolve) => {
    const m = modal(scene);
    const cx = GAME_WIDTH / 2;
    m.add([
      addTitle(scene, cx, 120, 'SCEGLI LA STRADA', 54).setColor('#ffcf3a'),
      icon(scene, cx, 225, iconKey('fruit', f.id), 104),
      addBody(scene, cx, 300, `${f.name}: la scelta vale per i Risvegli III, IV e V.`, 22, '#fbe9c8').setWordWrapWidth(620),
    ]);
    const card = (b: FruitBranch, y: number): void => {
      const a = fruitAbility(f, BRANCH_LEVEL, b);
      const v = fruitAbility(f, 5, b);
      const w = 660, h = 380;
      m.add(panel(scene, cx - w / 2, y - h / 2, w, h, b === 'a' ? 0x2f2860 : 0x3a2440));
      m.add([
        addBody(scene, cx - w / 2 + 30, y - h / 2 + 34, b === 'a' ? 'STRADA A' : 'STRADA B', 20, '#9be06a').setOrigin(0, 0.5),
        fitWidth(addTitle(scene, cx, y - h / 2 + 76, b === 'a' ? br.a : br.b.name, 42), w - 60),
        addBody(scene, cx, y - h / 2 + 124, `III · ${a.name} (${a.cost}⚡)`, 24, '#ffcf3a'),
        addBody(scene, cx, y - h / 2 + 156, a.description, 21, '#fff7e6').setWordWrapWidth(w - 60).setOrigin(0.5, 0),
        addBody(scene, cx, y + h / 2 - 104, `Al V: ${v.name}`, 20, '#c9a8ff'),
      ]);
      m.add(new Button(scene, cx, y + h / 2 - 50, 'SCEGLI', () => {
        ctl.chooseBranch(b);
        GameSession.persistRun();
        Audio.play('reward');
        scene.tweens.add({ targets: m, alpha: 0, duration: 200, onComplete: () => { m.destroy(); resolve(); } });
      }, { width: 300, height: 76, fontSize: 40, variant: b === 'a' ? 'primary' : 'danger' }));
    };
    card('a', 545);
    card('b', 955);
  });
}

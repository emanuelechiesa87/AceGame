import { FX_SCALE } from '../pixel/backgrounds';
import { runLook } from '../data/fruitLooks';
import { COLORS, GAME_WIDTH } from '../app/config';
import { AREAS } from '../data/areas';
import { FRUIT_BY_ID, fruitAbility } from '../data/fruits';
import { iconKey } from '../pixel/keys';
import { GameSession } from '../state/GameSession';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { ROMAN } from '../ui/fruitFx';
import { HeroRig } from '../ui/HeroRig';
import { addBody, addTitle } from '../ui/text';
import { icon, panel } from '../ui/widgets';
import { BaseScene } from './BaseScene';

/**
 * Passaggio d'area dopo il boss: si salpa verso il mare successivo con lo
 * stesso eroe. Il cambio d'area (nuova mappa, cura) è già applicato e salvato
 * da `finishNode`: questa scena lo racconta e basta.
 */
export class NewSeaScene extends BaseScene {
  constructor() {
    super('NewSea');
  }

  create(): void {
    this.setupCamera();
    const run = GameSession.run, ctl = GameSession.ctl;
    if (!run || !ctl) { this.scene.start('Menu'); return; }
    const area = ctl.area;

    new BiomeBackdrop(this, { groundTop: 980, tint: area.tint, theme: area.backdrop });
    this.fullRect(COLORS.background, 0.45);
    const lines = this.add.image(GAME_WIDTH / 2, 330, 'fx-speedlines').setScale(FX_SCALE).setAlpha(0.6);
    this.tweens.add({ targets: lines, angle: 360, duration: 30000, repeat: -1 });

    addBody(this, GAME_WIDTH / 2, 120, `MARE ${ctl.areaNumber} DI ${AREAS.length}`, 28, '#f1d7a8');
    const title = addTitle(this, GAME_WIDTH / 2, 200, 'NUOVO MARE!', 84).setAngle(-3).setColor('#ffe14a').setScale(0);
    this.tweens.add({ targets: title, scale: 1, duration: 420, ease: 'Back.easeOut' });
    addTitle(this, GAME_WIDTH / 2, 300, area.name.toUpperCase(), 48);
    addBody(this, GAME_WIDTH / 2, 356, area.tagline, 26, '#fbe9c8');

    const hero = new HeroRig(this, GAME_WIDTH / 2, 625, run.avatar === 'a' ? 'm' : 'f', 0.62, runLook(run)).walk();
    this.time.delayedCall(900, () => hero.idle());

    panel(this, 60, 640, 600, 330, COLORS.panel, 0.95);
    const pct = Math.round(ctl.tx.areaHealPct * 100);
    addBody(this, GAME_WIDTH / 2, 690, `La ciurma si riposa a bordo: +${pct}% HP`, 26, '#6fe08a');
    addBody(this, GAME_WIDTH / 2, 740, `Nemici più forti in questo mare`, 26, '#ff9ab0');

    // il tetto del Risveglio sale con le aree
    const prevCap = AREAS[run.areaIndex - 1]?.maxFruitLevel ?? area.maxFruitLevel;
    const fid = run.activeFruitIds[0];
    const f = fid ? FRUIT_BY_ID.get(fid) : undefined;
    if (f && ctl.fruitLevelCap > prevCap) {
      icon(this, 130, 850, iconKey('fruit', f.id), 84);
      const next = fruitAbility(f, ctl.fruitLevelCap);
      addTitle(this, 400, 820, `RISVEGLIO FINO AL ${ROMAN[ctl.fruitLevelCap]}!`, 32).setColor('#ffcf3a');
      addBody(this, 400, 870, `Al ${ROMAN[ctl.fruitLevelCap]}: ${next.name}`, 22, '#fbe9c8').setWordWrapWidth(470);
    } else if (f) {
      icon(this, 130, 850, iconKey('fruit', f.id), 84);
      addBody(this, 400, 850, `${f.name} · Lv ${ROMAN[ctl.fruitLevel]}`, 26, '#ffffff').setWordWrapWidth(470);
    }

    new Button(this, GAME_WIDTH / 2, 1090, 'SALPA!', () => {
      hero.cheer('happy', 'shout');
      this.time.delayedCall(400, () => this.goTo('Exploration'));
    }, { width: 420, height: 116, fontSize: 60 });
  }
}

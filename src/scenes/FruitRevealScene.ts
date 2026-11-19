import { FX_SCALE } from '../pixel/backgrounds';
import { runLook } from '../data/fruitLooks';
import { COLORS, GAME_WIDTH } from '../app/config';
import { iconKey } from '../pixel/keys';
import { GameSession } from '../state/GameSession';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { HeroRig } from '../ui/HeroRig';
import { fruitCard, modal } from '../ui/Offers';
import { addBody, addTitle } from '../ui/text';
import { icon } from '../ui/widgets';
import { BaseScene } from './BaseScene';

/** Rivelazione "gacha" del frutto iniziale casuale. */
export class FruitRevealScene extends BaseScene {
  constructor() {
    super('FruitReveal');
  }

  create(): void {
    this.setupCamera();
    const run = GameSession.run;
    if (!run) { this.scene.start('Menu'); return; }
    const fruitId = run.activeFruitIds[0];
    new BiomeBackdrop(this, { groundTop: 980 });
    this.fullRect(COLORS.background, 0.7);
    const lines = this.add.image(GAME_WIDTH / 2, 470, 'fx-speedlines').setScale(FX_SCALE);
    this.tweens.add({ targets: lines, angle: 360, duration: 20000, repeat: -1 });
    addTitle(this, GAME_WIDTH / 2, 150, 'IL TUO FRUTTO INIZIALE', 54).setAngle(-3);

    const glow = this.add.circle(GAME_WIDTH / 2, 470, 150, 0xfff4c9, 0.25);
    this.tweens.add({ targets: glow, scale: 1.2, alpha: 0.1, duration: 900, yoyo: true, repeat: -1 });
    const fr = icon(this, GAME_WIDTH / 2, 470, iconKey('fruitbig', fruitId), 250).setScale(0);
    this.tweens.chain({
      targets: fr,
      tweens: [
        { scale: (250 / 256) * 1.25, angle: 360, duration: 600, ease: 'Back.easeOut' },
        { scale: 250 / 256, duration: 200 },
      ],
    });
    this.tweens.add({ targets: fr, y: 450, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 800 });

    const card = modal(this);
    card.setDepth(10);
    card.list[0].destroy(); // niente velo: usiamo solo il riquadro
    fruitCard(this, card, fruitId, GAME_WIDTH / 2, 760, 680, 210).disableInteractive();

    const hero = new HeroRig(this, 170, 1240, run.avatar === 'a' ? 'm' : 'f', 0.75).idle();
    hero.setDepth(11);
    addBody(this, GAME_WIDTH / 2, 890, 'Unico frutto della run · tasto POTERE in battaglia\nLe ricompense lo RISVEGLIANO: livello III qui, fino al V nei mari lontani', 24, '#fbe9c8').setDepth(11);
    let eaten = false;
    new Button(this, 440, 1050, 'MANGIALO!', () => {
      if (eaten) return;
      eaten = true;
      // il frutto "contagia" subito l'eroe: colori e stemma del livello I
      hero.setLook(runLook(run), true);
      this.time.delayedCall(1300, () => this.goTo('Exploration'));
    }, { width: 400, height: 116, fontSize: 60 }).setDepth(12);
  }
}

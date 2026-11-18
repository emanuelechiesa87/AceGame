import Phaser from 'phaser';
import { BUILD_VERSION, COLORS, GAME_HEIGHT, GAME_WIDTH, TEXTURE_SCALE } from '../app/config';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { HeroRig } from '../ui/HeroRig';
import { addBody, addTitle, gradientFill } from '../ui/text';
import { BaseScene } from './BaseScene';

export class MenuScene extends BaseScene {
  constructor() {
    super('Menu');
  }

  create(): void {
    this.setupCamera();
    const cx = GAME_WIDTH / 2;
    const backdrop = new BiomeBackdrop(this, { groundTop: 760 });
    // velo scuro in alto per far leggere il logo
    this.add.rectangle(-400, -800, GAME_WIDTH + 800, 1320, COLORS.background, 0.35).setOrigin(0);

    const lines = this.add.image(cx, 300, 'fx-speedlines').setScale(1 / TEXTURE_SCALE).setAlpha(0.9);
    this.tweens.add({ targets: lines, angle: 360, duration: 60000, repeat: -1 });

    const logo = addTitle(this, cx, 250, 'ACEGAME', 150).setAngle(-6);
    gradientFill(logo, '#fff3b0', '#ff8a3d');
    this.tweens.add({ targets: logo, scale: { from: 1, to: 1.04 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    addTitle(this, cx + 20, 370, 'PROTOTIPO!', 44).setAngle(-6).setColor('#ff9ab0');

    const heroM = new HeroRig(this, 220, backdrop.groundY, 'm', 0.95).idle();
    const heroF = new HeroRig(this, 500, backdrop.groundY, 'f', 0.95).idle();
    heroF.setScale(-0.95, 0.95); // si guardano a vicenda
    heroM.setInteractive(new Phaser.Geom.Rectangle(-90, -330, 180, 330), Phaser.Geom.Rectangle.Contains).on('pointerup', () => heroM.cheer());
    heroF.setInteractive(new Phaser.Geom.Rectangle(-90, -330, 180, 330), Phaser.Geom.Rectangle.Contains).on('pointerup', () => heroF.cheer('fierce', 'shout'));

    new Button(this, cx, 1000, 'NUOVA RUN', () => this.goTo('CharacterSelect'), { width: 540, height: 124, fontSize: 64 });
    const small = { variant: 'secondary' as const, enabled: false, width: 190, height: 84, fontSize: 32 };
    new Button(this, cx - 222, 1140, 'COLLEZIONE', () => undefined, small);
    new Button(this, cx, 1140, 'RECORD', () => undefined, small);
    new Button(this, cx + 222, 1140, 'OPZIONI', () => undefined, small);

    addBody(this, cx, GAME_HEIGHT - 40, `v${BUILD_VERSION} · tocca gli eroi!`, 22, '#e9dcff');
  }
}


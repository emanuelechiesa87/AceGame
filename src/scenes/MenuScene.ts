import Phaser from 'phaser';
import { BUILD_VERSION, COLORS, GAME_HEIGHT, GAME_WIDTH, TEXTURE_SCALE } from '../app/config';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { HeroRig } from '../ui/HeroRig';
import { GameSession } from '../state/GameSession';
import { modal } from '../ui/Offers';
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

    const canResume = GameSession.hasSavedRun();
    if (canResume) {
      new Button(this, cx, 930, 'CONTINUA', () => { if (GameSession.resumeRun()) this.goTo('Exploration'); else this.scene.restart(); }, { width: 540, height: 112, fontSize: 60 });
      new Button(this, cx, 1046, 'NUOVA RUN', () => this.confirmNew(), { width: 420, height: 88, fontSize: 44, variant: 'danger' });
    } else {
      new Button(this, cx, 1000, 'NUOVA RUN', () => this.goTo('CharacterSelect'), { width: 540, height: 124, fontSize: 64 });
    }
    const small = { variant: 'secondary' as const, width: 190, height: 84, fontSize: 32 };
    new Button(this, cx - 222, 1150, 'COLLEZIONE', () => this.goTo('Collection'), small);
    new Button(this, cx, 1150, 'RECORD', () => this.goTo('Records'), small);
    const fast = () => GameSession.save.data.settings.fastAnimations;
    const speedBtn = new Button(this, cx + 222, 1150, fast() ? 'VELOCE' : 'NORMALE', () => {
      GameSession.save.update((s) => (s.settings.fastAnimations = !s.settings.fastAnimations));
      (speedBtn.list[1] as Phaser.GameObjects.Text).setText(fast() ? 'VELOCE' : 'NORMALE');
    }, small);

    addBody(this, cx, GAME_HEIGHT - 30, `v${BUILD_VERSION} · tocca gli eroi! · animazioni: tasto a destra`, 20, '#e9dcff');
  }

  private confirmNew(): void {
    const m = modal(this);
    m.add(addTitle(this, 360, 480, 'ABBANDONARE LA RUN?', 54));
    m.add(addBody(this, 360, 560, 'La run in corso andrà persa. Collezione e record restano.', 26, '#e9dcff'));
    m.add(new Button(this, 360, 700, 'SÌ, NUOVA RUN', () => { GameSession.abandonRun(); this.goTo('CharacterSelect'); }, { variant: 'danger', width: 460 }));
    m.add(new Button(this, 360, 840, 'NO', () => m.destroy(), { variant: 'secondary', width: 300 }));
  }
}


import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../app/config';
import { BALANCE } from '../data/balance';
import { GameSession } from '../state/GameSession';
import { Button } from '../ui/Button';
import { addBody, addTitle } from '../ui/text';

/**
 * M0: verifica tecnica di camminata automatica e parallasse. Non contiene
 * ancora incontri: quelli arrivano con la vertical slice (M1).
 */
export class ExplorationScene extends Phaser.Scene {
  private far!: Phaser.GameObjects.TileSprite;
  private near!: Phaser.GameObjects.TileSprite;
  private ground!: Phaser.GameObjects.TileSprite;
  private paused = false;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private readonly onVisibility = () => document.hidden && this.setPaused(true);

  constructor() {
    super('Exploration');
  }

  create(): void {
    const run = GameSession.run;
    if (!run) {
      this.scene.start('Menu');
      return;
    }
    this.paused = false;
    const groundY = 820;

    this.far = this.add.tileSprite(0, groundY - 360, GAME_WIDTH, 400, 'bg-far').setOrigin(0, 0);
    this.near = this.add.tileSprite(0, groundY - 300, GAME_WIDTH, 400, 'bg-near').setOrigin(0, 0);
    this.ground = this.add.tileSprite(0, groundY + 60, GAME_WIDTH, 200, 'ground').setOrigin(0, 0);

    const hero = this.add.image(220, groundY - 45, `avatar-${run.avatar}`);
    this.tweens.add({ targets: hero, y: hero.y - 10, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    addTitle(this, GAME_WIDTH / 2, 110, 'Area 1', 52);
    addBody(this, GAME_WIDTH / 2, 175, `Esplorazione automatica · seed ${run.runSeed.toString(16)}`, 24);
    addBody(this, GAME_WIDTH / 2, 1010, 'Gli incontri arriveranno con la vertical slice (M1).', 28);

    new Button(this, GAME_WIDTH / 2 - 140, 1150, 'Pausa', () => this.setPaused(true), { width: 250, variant: 'secondary' });
    new Button(this, GAME_WIDTH / 2 + 140, 1150, 'Esci', () => this.exitRun(), { width: 250, variant: 'secondary' });

    this.pauseOverlay = this.buildPauseOverlay();

    // Pausa automatica quando la scheda perde visibilità (chiamata, cambio app...).
    document.addEventListener('visibilitychange', this.onVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => document.removeEventListener('visibilitychange', this.onVisibility));
  }

  update(_time: number, deltaMs: number): void {
    if (this.paused) return;
    const dx = (BALANCE.exploration.walkSpeedPxPerSec * deltaMs) / 1000;
    this.far.tilePositionX += dx * 0.2;
    this.near.tilePositionX += dx * 0.5;
    this.ground.tilePositionX += dx;
  }

  private buildPauseOverlay(): Phaser.GameObjects.Container {
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.background, 0.85).setOrigin(0).setInteractive();
    const title = addTitle(this, GAME_WIDTH / 2, 480, 'In pausa', 72);
    const resume = new Button(this, GAME_WIDTH / 2, 680, 'Riprendi', () => this.setPaused(false));
    const overlay = this.add.container(0, 0, [shade, title, resume]).setDepth(100).setVisible(false);
    return overlay;
  }

  private setPaused(value: boolean): void {
    this.paused = value;
    this.pauseOverlay.setVisible(value);
    if (value) this.tweens.pauseAll();
    else this.tweens.resumeAll();
  }

  private exitRun(): void {
    GameSession.endRun();
    this.scene.start('Menu');
  }
}

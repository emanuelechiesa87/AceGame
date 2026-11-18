import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../app/config';
import { BALANCE } from '../data/balance';
import { GameSession } from '../state/GameSession';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { HeroRig } from '../ui/HeroRig';
import { addBody, addTitle } from '../ui/text';
import { BaseScene } from './BaseScene';

/**
 * Camminata automatica con parallasse. Gli incontri arrivano con la vertical
 * slice (M1): per ora la scena serve a validare grafica e prestazioni.
 */
export class ExplorationScene extends BaseScene {
  private backdrop!: BiomeBackdrop;
  private paused = false;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private readonly onVisibility = () => document.hidden && this.setPaused(true);

  constructor() {
    super('Exploration');
  }

  create(): void {
    this.setupCamera();
    const run = GameSession.run;
    if (!run) {
      this.scene.start('Menu');
      return;
    }
    this.paused = false;
    this.backdrop = new BiomeBackdrop(this, { groundTop: 820, withForeground: true });
    new HeroRig(this, 250, this.backdrop.groundY, run.avatar === 'a' ? 'm' : 'f', 1).walk();
    this.backdrop.addForeground();

    // Banner dell'area in alto, inclinato stile manga
    const banner = this.add.graphics();
    banner.fillStyle(COLORS.ink, 1).fillPoints([p(40, 70), p(700, 52), p(690, 186), p(30, 200)], true);
    banner.fillStyle(0xff5f6d, 1).fillPoints([p(30, 60), p(690, 42), p(680, 172), p(20, 188)], true);
    banner.lineStyle(6, COLORS.ink, 1).strokePoints([p(30, 60), p(690, 42), p(680, 172), p(20, 188)], true, true);
    addTitle(this, GAME_WIDTH / 2, 100, 'AREA 1', 56).setAngle(-2);
    addBody(this, GAME_WIDTH / 2, 152, 'PIANURE DEL TRAMONTO', 30, '#fff7e6').setAngle(-2);

    // Pannello comandi in basso
    this.add.rectangle(-200, 1050, GAME_WIDTH + 400, GAME_HEIGHT, COLORS.background, 0.85).setOrigin(0);
    addBody(this, GAME_WIDTH / 2, 1090, 'Gli incontri arrivano con la vertical slice (M1)', 22);
    new Button(this, GAME_WIDTH / 2 - 160, 1190, 'PAUSA', () => this.setPaused(true), { width: 270, height: 96, fontSize: 44, variant: 'secondary' });
    new Button(this, GAME_WIDTH / 2 + 160, 1190, 'ESCI', () => this.exitRun(), { width: 270, height: 96, fontSize: 44, variant: 'danger' });

    this.pauseOverlay = this.buildPauseOverlay();
    document.addEventListener('visibilitychange', this.onVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => document.removeEventListener('visibilitychange', this.onVisibility));
  }

  update(_time: number, deltaMs: number): void {
    if (this.paused) return;
    this.backdrop.scroll((BALANCE.exploration.walkSpeedPxPerSec * deltaMs) / 1000);
  }

  private buildPauseOverlay(): Phaser.GameObjects.Container {
    const shade = this.add.rectangle(-400, -800, GAME_WIDTH + 800, GAME_HEIGHT + 1600, COLORS.background, 0.85).setOrigin(0).setInteractive();
    const title = addTitle(this, GAME_WIDTH / 2, 500, 'PAUSA', 110).setAngle(-4);
    const resume = new Button(this, GAME_WIDTH / 2, 700, 'RIPRENDI', () => this.setPaused(false));
    return this.add.container(0, 0, [shade, title, resume]).setDepth(100).setVisible(false);
  }

  private setPaused(value: boolean): void {
    this.paused = value;
    this.pauseOverlay.setVisible(value);
    if (value) this.tweens.pauseAll();
    else this.tweens.resumeAll();
  }

  private exitRun(): void {
    GameSession.endRun();
    this.goTo('Menu');
  }
}

const p = (x: number, y: number) => new Phaser.Geom.Point(x, y);

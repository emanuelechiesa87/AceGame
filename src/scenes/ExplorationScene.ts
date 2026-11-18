import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../app/config';
import { iconKey } from '../pixel/keys';
import { NODE_LABELS, type NodeType } from '../data/areas';
import { BALANCE } from '../data/balance';
import { GameSession } from '../state/GameSession';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { HeroRig } from '../ui/HeroRig';
import { mapProgress, RunHud } from '../ui/RunHud';
import { addBody, addTitle } from '../ui/text';
import { icon, panel, steppedRect } from '../ui/widgets';
import { BaseScene } from './BaseScene';
import { enterNode } from './flow';

const WALK_MS = 2200;

/**
 * Esplorazione automatica: il personaggio cammina finché non arriva a un bivio,
 * poi il giocatore sceglie il prossimo nodo. Tocca lo schermo per arrivare subito.
 */
export class ExplorationScene extends BaseScene {
  private backdrop!: BiomeBackdrop;
  private hero!: HeroRig;
  private walking = true;
  private paused = false;
  private arrived = false;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private readonly onVisibility = () => document.hidden && this.setPaused(true);

  constructor() {
    super('Exploration');
  }

  create(): void {
    this.setupCamera();
    const run = GameSession.run;
    if (!run || !GameSession.ctl) { this.scene.start('Menu'); return; }
    this.walking = true; this.paused = false; this.arrived = false;

    this.backdrop = new BiomeBackdrop(this, { groundTop: 760, withForeground: true });
    this.hero = new HeroRig(this, 250, this.backdrop.groundY, run.avatar === 'a' ? 'm' : 'f', 0.95).walk();
    this.backdrop.addForeground();

    new RunHud(this, run);
    const area = GameSession.ctl.area;
    addTitle(this, GAME_WIDTH / 2, 236, area.name.toUpperCase(), 40).setAngle(-2);
    mapProgress(this, run, 300);

    const hint = addBody(this, GAME_WIDTH / 2, 1020, 'In cammino... (tocca per affrettarti)', 26, '#fff7e6');
    this.tweens.add({ targets: hint, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
    new Button(this, 640, 1210, 'II', () => this.setPaused(true), { width: 100, height: 84, fontSize: 40, variant: 'secondary' });

    const arrive = this.time.delayedCall(WALK_MS, () => this.arrive(hint));
    this.input.once('pointerdown', () => { if (!this.arrived) { arrive.remove(); this.arrive(hint); } });

    this.pauseOverlay = this.buildPauseOverlay();
    document.addEventListener('visibilitychange', this.onVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => document.removeEventListener('visibilitychange', this.onVisibility));
  }

  update(_t: number, dt: number): void {
    if (this.paused || !this.walking) return;
    this.backdrop.scroll((BALANCE.exploration.walkSpeedPxPerSec * dt) / 1000);
  }

  private arrive(hint: Phaser.GameObjects.Text): void {
    if (this.arrived) return;
    this.arrived = true;
    this.walking = false;
    hint.destroy();
    this.hero.idle();
    const step = GameSession.ctl!.currentStep;
    const opts = step.options;
    const top = 900;
    panel(this, 20, top - 40, 680, 420, COLORS.panel, 0.95);
    addTitle(this, GAME_WIDTH / 2, top + 10, opts.length > 1 ? 'BIVIO! SCEGLI LA STRADA' : 'SI PROSEGUE...', 40);
    const w = opts.length > 1 ? 300 : 420;
    opts.forEach((node, i) => {
      const x = opts.length > 1 ? 195 + i * 330 : GAME_WIDTH / 2;
      this.nodeCard(node, x, top + 180, w);
    });
  }

  private nodeCard(node: NodeType, x: number, y: number, w: number): void {
    const L = NODE_LABELS[node];
    const danger = node === 'boss' || node === 'elite';
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    steppedRect(g, -w / 2 + 6, -120 + 10, w, 240, COLORS.ink, 10);
    steppedRect(g, -w / 2, -120, w, 240, COLORS.ink, 10);
    steppedRect(g, -w / 2 + 5, -115, w - 10, 230, danger ? COLORS.hot : COLORS.accent, 8);
    g.fillStyle(COLORS.ink, 1).fillRect(-w / 2 + 14, -106, w - 28, 212);
    g.fillStyle(danger ? 0x7a1f3a : 0x7a4528, 1).fillRect(-w / 2 + 18, -102, w - 36, 204);
    g.fillStyle(0xffffff, 0.1).fillRect(-w / 2 + 18, -102, w - 36, 6);
    c.add([g, icon(this, 0, -40, iconKey('node', node), 110), addTitle(this, 0, 50, L.title.toUpperCase(), 40), addBody(this, 0, 92, L.hint, 21, '#fbe9c8')]);
    this.tweens.add({ targets: c, scale: { from: 0.6, to: 1 }, duration: 240, ease: 'Back.easeOut' });
    c.setSize(w, 240).setInteractive({ useHandCursor: true }).on('pointerup', () => {
      this.tweens.add({ targets: c, scale: 1.08, duration: 90, yoyo: true });
      enterNode((k, d) => this.goTo(k, d), node);
    });
  }

  private buildPauseOverlay(): Phaser.GameObjects.Container {
    const shade = this.fullRect(COLORS.background, 0.88).setInteractive();
    const title = addTitle(this, GAME_WIDTH / 2, 420, 'PAUSA', 110).setAngle(-4);
    const resume = new Button(this, GAME_WIDTH / 2, 640, 'RIPRENDI', () => this.setPaused(false));
    const quit = new Button(this, GAME_WIDTH / 2, 800, 'MENU (SALVA)', () => this.goTo('Menu'), { variant: 'secondary', width: 440, fontSize: 44 });
    const note = addBody(this, GAME_WIDTH / 2, 900, 'La run resta salvata: puoi riprenderla dal menu.', 24);
    return this.add.container(0, 0, [shade, title, resume, quit, note]).setDepth(900).setVisible(false);
  }

  private setPaused(v: boolean): void {
    this.paused = v;
    this.pauseOverlay.setVisible(v);
    if (v) this.tweens.pauseAll(); else this.tweens.resumeAll();
  }
}

import Phaser from 'phaser';
import { GAME_WIDTH } from '../app/config';
import { makePortTextures, PX } from '../pixel/backgrounds';
import { gridTexture } from '../pixel/render';
import { CRAB_FRAMES, CRAB_PAL, FRUIT_PIXELS, HERO_FRAMES, HERO_PAL } from '../pixel/sprites';
import { BaseScene } from './BaseScene';

const PIXEL_FONT = '"Pixelify Sans", monospace';
const INK = 0x1f1633;
const EXTRA = 400;

/**
 * PILOTA dello stile pixel piratesco: serve solo a decidere se convertire
 * tutto il gioco. Eroe animato, nemico, 3 frutti, porto, UI legno/pergamena.
 */
export class PixelPreviewScene extends BaseScene {
  private layers: { s: Phaser.GameObjects.TileSprite; f: number }[] = [];
  private walking = true;

  constructor() {
    super('PixelPreview');
  }

  create(): void {
    this.setupCamera();
    this.layers = [];
    this.walking = true;
    makePortTextures(this);
    Object.entries(HERO_FRAMES).forEach(([k, g]) => gridTexture(this, `pxh-${k}`, g, HERO_PAL));
    Object.entries(CRAB_FRAMES).forEach(([k, g]) => gridTexture(this, `pxc-${k}`, g, CRAB_PAL));
    Object.entries(FRUIT_PIXELS).forEach(([k, f]) => gridTexture(this, `pxf-${k}`, f.grid, f.pal));
    this.makeAnims();

    // --- scena del porto ---------------------------------------------------------
    const layer = (key: string, y: number, h: number, f: number) => {
      const s = this.add.tileSprite(-EXTRA, y, GAME_WIDTH + EXTRA * 2, h * PX, key).setOrigin(0).setTileScale(PX);
      this.layers.push({ s, f });
      return s;
    };
    layer('px-sky', 60, 200, 0);
    this.add.rectangle(-EXTRA, -800, GAME_WIDTH + EXTRA * 2, 862, 0x3b5bdb).setOrigin(0);
    layer('px-clouds', 200, 60, 0.05);
    layer('px-island', 560, 70, 0.15);
    layer('px-sea', 820, 50, 0.35);
    layer('px-dock', 960, 70, 1);
    this.add.rectangle(-EXTRA, 1240, GAME_WIDTH + EXTRA * 2, 900, 0x5f3520).setOrigin(0);

    const hero = this.add.sprite(220, 985, 'pxh-idle0').setOrigin(0.5, 1).setScale(6).play('pxh-walk');
    
    const crab = this.add.sprite(GAME_WIDTH + 200, 985, 'pxc-idle0').setOrigin(0.5, 1).setScale(7).play('pxc-idle');
    this.loopEncounter(hero, crab);

    // --- interfaccia legno / pergamena ----------------------------------------------
    this.wood(30, 40, 660, 130);
    this.text(GAME_WIDTH / 2, 82, 'PILOTA PIXEL', 44, '#ffe8a8');
    this.text(GAME_WIDTH / 2, 132, 'Porto delle Gemme', 28, '#f1d7a8');

    this.parchment(40, 1010, 640, 150);
    Object.entries(FRUIT_PIXELS).forEach(([id, f], i) => {
      const x = 150 + i * 210;
      const ic = this.add.image(x, 1062, `pxf-${id}`).setScale(5);
      this.tweens.add({ targets: ic, y: 1054, duration: 700 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.text(x, 1130, f.name, 22, '#4a2a14');
    });
    this.woodButton(GAME_WIDTH / 2, 1225, 'TORNA AL MENU', () => this.goTo('Menu'));
  }

  update(_t: number, dt: number): void {
    if (!this.walking) return;
    const dx = (90 * dt) / 1000;
    // tilePosition è in pixel di texture: con tileScale = PX lo spostamento va diviso per PX
    for (const l of this.layers) l.s.tilePositionX += (dx * l.f) / PX;
  }

  private makeAnims(): void {
    if (!this.anims.exists('pxh-walk')) {
      this.anims.create({ key: 'pxh-walk', frames: ['walk0', 'idle0', 'walk1', 'idle1'].map((k) => ({ key: `pxh-${k}` })), frameRate: 8, repeat: -1 });
      this.anims.create({ key: 'pxh-idle', frames: ['idle0', 'idle0', 'idle1', 'idle1', 'idle0', 'blink', 'idle0', 'idle1'].map((k) => ({ key: `pxh-${k}` })), frameRate: 4, repeat: -1 });
      this.anims.create({ key: 'pxc-idle', frames: [{ key: 'pxc-idle0' }, { key: 'pxc-idle1' }], frameRate: 3, repeat: -1 });
    }
  }

  /** Ciclo dimostrativo: cammina → arriva il granchio → si fronteggiano → riparte. */
  private loopEncounter(hero: Phaser.GameObjects.Sprite, crab: Phaser.GameObjects.Sprite): void {
    this.walking = true;
    hero.play('pxh-walk');
    crab.setPosition(GAME_WIDTH + 200, 985);
    this.tweens.add({
      targets: crab, x: 520, delay: 1800, duration: 2200,
      onComplete: () => {
        this.walking = false;
        hero.play('pxh-idle');
        const bubble = this.speech(520, 790, 'ARRR!');
        this.tweens.add({ targets: crab, y: 965, duration: 120, yoyo: true, repeat: 3 });
        this.time.delayedCall(2400, () => {
          bubble.destroy();
          this.tweens.add({ targets: crab, x: GAME_WIDTH + 200, duration: 600, ease: 'Quad.easeIn', onComplete: () => this.loopEncounter(hero, crab) });
        });
      },
    });
  }

  // --- elementi di interfaccia pixel ---------------------------------------------------
  private text(x: number, y: number, t: string, size: number, color: string): Phaser.GameObjects.Text {
    return this.add.text(x, y, t, { fontFamily: PIXEL_FONT, fontSize: `${size}px`, fontStyle: '700', color, stroke: '#1f1633', strokeThickness: color === '#4a2a14' ? 0 : 6 })
      .setResolution(2).setOrigin(0.5);
  }

  /** Pannello di legno con angoli "a gradino" (niente curve: è pixel art). */
  private wood(x: number, y: number, w: number, h: number): void {
    const g = this.add.graphics();
    const step = (c: number, inset: number) => { g.fillStyle(c, 1).fillRect(x + inset + 8, y + inset, w - 2 * inset - 16, h - 2 * inset).fillRect(x + inset, y + inset + 8, w - 2 * inset, h - 2 * inset - 16); };
    g.fillStyle(INK, 1).fillRect(x + 8, y + 12, w, h);
    step(INK, 0); step(0x8a5232, 4);
    for (let yy = y + 20; yy < y + h - 8; yy += 24) g.fillStyle(0x6b3a1e, 1).fillRect(x + 8, yy, w - 16, 4);
    g.fillStyle(0xa9693c, 1).fillRect(x + 12, y + 8, w - 24, 4);
    [[x + 18, y + 18], [x + w - 26, y + 18], [x + 18, y + h - 26], [x + w - 26, y + h - 26]].forEach(([nx, ny]) => g.fillStyle(0xd9e1ef, 1).fillRect(nx, ny, 8, 8));
  }

  private parchment(x: number, y: number, w: number, h: number): void {
    const g = this.add.graphics();
    g.fillStyle(INK, 1).fillRect(x + 8, y + 12, w, h);
    g.fillStyle(INK, 1).fillRect(x + 8, y, w - 16, h).fillRect(x, y + 8, w, h - 16);
    g.fillStyle(0xf1d7a8, 1).fillRect(x + 12, y + 4, w - 24, h - 8).fillRect(x + 4, y + 12, w - 8, h - 24);
    g.fillStyle(0xd9b878, 1).fillRect(x + 4, y + h - 24, w - 8, 8);
    for (let i = 0; i < 20; i++) g.fillStyle(0xe2c48e, 1).fillRect(x + 20 + ((i * 97) % (w - 40)), y + 20 + ((i * 53) % (h - 40)), 4, 4);
  }

  private woodButton(x: number, y: number, label: string, onTap: () => void): void {
    const w = 440, h = 92;
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    const draw = (pressed: boolean) => {
      g.clear();
      const oy = pressed ? 6 : 0;
      if (!pressed) g.fillStyle(INK, 1).fillRect(-w / 2 + 4, -h / 2 + 10, w, h);
      g.fillStyle(INK, 1).fillRect(-w / 2 + 6, -h / 2 + oy, w - 12, h).fillRect(-w / 2, -h / 2 + 6 + oy, w, h - 12);
      g.fillStyle(0xffcf3a, 1).fillRect(-w / 2 + 8, -h / 2 + 4 + oy, w - 16, h - 8).fillRect(-w / 2 + 4, -h / 2 + 8 + oy, w - 8, h - 16);
      g.fillStyle(0xffe27a, 1).fillRect(-w / 2 + 10, -h / 2 + 8 + oy, w - 20, 8);
      g.fillStyle(0xe09a12, 1).fillRect(-w / 2 + 10, h / 2 - 16 + oy, w - 20, 8);
      t.setY(-2 + oy);
    };
    const t = this.text(0, 0, label, 34, '#fff7e6');
    c.add([g, t]);
    draw(false);
    c.setSize(w, h).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => draw(true)).on('pointerout', () => draw(false))
      .on('pointerup', () => { draw(false); onTap(); });
  }

  private speech(x: number, y: number, t: string): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(INK, 1).fillRect(-84, -36, 168, 72).fillRect(-8, 36, 20, 16);
    g.fillStyle(0xffffff, 1).fillRect(-80, -32, 160, 64).fillRect(-4, 32, 12, 12);
    c.add([g, this.text(0, 0, t, 36, '#e4342f')]);
    c.setScale(0);
    this.tweens.add({ targets: c, scale: 1, duration: 160, ease: 'Back.easeOut' });
    return c;
  }
}

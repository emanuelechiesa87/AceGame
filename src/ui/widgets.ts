import Phaser from 'phaser';
import { COLORS, TEXTURE_SCALE } from '../app/config';
import { addBody, addTitle } from './text';

/** Rettangolo con angoli "a gradino" (niente curve: è pixel art). */
export function steppedRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number, step = 8, alpha = 1): Phaser.GameObjects.Graphics {
  g.fillStyle(color, alpha).fillRect(x + step, y, w - 2 * step, h).fillRect(x, y + step, w, h - 2 * step);
  return g;
}

/** Colori delle assi interne: i pannelli "evidenziati" usano legno più chiaro. */
const LIGHT_FILLS = new Set([0x3d3380, 0x2f2860]);

/**
 * Pannello di legno: cornice chiara con chiodi e interno di assi scure.
 * Con `fill` = PARCHMENT diventa una pergamena (testi scuri).
 */
export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, fill: number = COLORS.panel, alpha = 0.96): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  steppedRect(g, x + 6, y + 10, w, h, COLORS.ink, 12);
  steppedRect(g, x, y, w, h, COLORS.ink, 12);
  if (fill === PARCHMENT) {
    steppedRect(g, x + 5, y + 5, w - 10, h - 10, 0xf1d7a8, 8);
    g.fillStyle(0xd9b878, 1).fillRect(x + 8, y + h - 22, w - 16, 8);
    g.fillStyle(0xfff0cf, 1).fillRect(x + 16, y + 9, w - 32, 6);
    for (let i = 0; i < Math.floor((w * h) / 9000); i++) g.fillStyle(0xe2c48e, 1).fillRect(x + 20 + ((i * 97) % (w - 40)), y + 20 + ((i * 53) % (h - 40)), 4, 4);
    return g;
  }
  // cornice
  steppedRect(g, x + 5, y + 5, w - 10, h - 10, 0xa9693c, 8);
  g.fillStyle(0xc98a50, 1).fillRect(x + 16, y + 8, w - 32, 4);
  // assi interne
  const inner = LIGHT_FILLS.has(fill) ? 0x7a4528 : fill === COLORS.panel ? 0x5f3520 : 0x4a2a14;
  g.fillStyle(COLORS.ink, 1).fillRect(x + 16, y + 16, w - 32, h - 32);
  g.fillStyle(inner, alpha).fillRect(x + 20, y + 20, w - 40, h - 40);
  for (let yy = y + 20 + 36; yy < y + h - 24; yy += 36) g.fillStyle(0x000000, 0.18).fillRect(x + 20, yy, w - 40, 4);
  g.fillStyle(0xffffff, 0.08).fillRect(x + 20, y + 20, w - 40, 6);
  // chiodi
  [[x + 6, y + 6], [x + w - 14, y + 6], [x + 6, y + h - 14], [x + w - 14, y + h - 14]].forEach(([nx, ny]) => { g.fillStyle(COLORS.ink, 1).fillRect(nx, ny, 8, 8); g.fillStyle(0xd9e1ef, 1).fillRect(nx + 1, ny + 1, 5, 5); });
  return g;
}

export const PARCHMENT = 0xf1d7a8;

/** Icona 120×120 (rasterizzata a TEXTURE_SCALE) mostrata a `size` px logici. */
export function icon(scene: Phaser.Scene, x: number, y: number, key: string, size: number): Phaser.GameObjects.Image {
  return scene.add.image(x, y, key).setScale(size / (120 * TEXTURE_SCALE) * 1);
}

/** Barra HP con eventuale scudo sovrapposto. */
export class HpBar extends Phaser.GameObjects.Container {
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly label?: Phaser.GameObjects.Text;
  private shown = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, private readonly barW: number, private readonly barH: number, withLabel = true) {
    super(scene, x, y);
    this.g = scene.add.graphics();
    this.add(this.g);
    if (withLabel) {
      this.label = addBody(scene, 0, barH / 2 + 1, '', Math.round(barH * 0.95), '#ffffff').setStroke(COLORS.inkHex, 5);
      this.add(this.label);
    }
    scene.add.existing(this);
  }

  set(hp: number, max: number, shield = 0, animate = true): void {
    const target = Math.max(0, hp) / Math.max(1, max);
    const draw = (ratio: number) => {
      const g = this.g.clear();
      const x = -this.barW / 2;
      g.fillStyle(COLORS.ink, 1).fillRect(x - 4, -4, this.barW + 8, this.barH + 8);
      g.fillStyle(0x4a2a14, 1).fillRect(x, 0, this.barW, this.barH);
      const col = ratio > 0.5 ? 0x51cf66 : ratio > 0.25 ? 0xffcf3a : 0xe4342f;
      const fw = Math.round((this.barW * ratio) / 4) * 4;
      if (ratio > 0) {
        g.fillStyle(col, 1).fillRect(x, 0, Math.max(4, fw), this.barH);
        g.fillStyle(0xffffff, 0.35).fillRect(x, 0, Math.max(4, fw), 4);
        g.fillStyle(0x000000, 0.2).fillRect(x, this.barH - 4, Math.max(4, fw), 4);
      }
      if (shield > 0) {
        const sw = Math.min(1, shield / max) * this.barW;
        g.fillStyle(COLORS.ink, 1).fillRect(x + this.barW - sw - 2, -4, sw + 2, this.barH + 8);
        g.fillStyle(0x5fa8ff, 1).fillRect(x + this.barW - sw, -2, sw, this.barH + 4);
        g.fillStyle(0xbfe0ff, 1).fillRect(x + this.barW - sw, -2, sw, 3);
      }
    };
    if (this.label) this.label.setText(`${Math.max(0, hp)}/${max}${shield > 0 ? `  +${shield}` : ''}`);
    if (!animate) { this.shown = target; draw(target); return; }
    const from = this.shown;
    this.shown = target;
    this.scene.tweens.addCounter({ from: 0, to: 1, duration: 260, onUpdate: (tw) => draw(from + (target - from) * tw.getValue()!) });
  }
}

/** Testo che sale e svanisce (danni, cure, stati). */
export function floatText(scene: Phaser.Scene, x: number, y: number, text: string, color: string, size = 46, speed = 1): void {
  const t = addTitle(scene, x, y, text, size).setColor(color).setDepth(500);
  t.setScale(0.4);
  scene.tweens.chain({
    targets: t,
    tweens: [
      { scale: 1.15, duration: 120 / speed, ease: 'Back.easeOut' },
      { scale: 1, y: y - 70, alpha: 0, duration: 650 / speed, ease: 'Quad.easeIn', delay: 200 / speed },
    ],
    onComplete: () => t.destroy(),
  });
}

/** Striscione centrale per annunci (nome del potere, VITTORIA, ecc.). */
export function banner(scene: Phaser.Scene, y: number, text: string, color = 0xff5f6d, size = 58, holdMs = 650): Promise<void> {
  return new Promise((resolve) => {
    const c = scene.add.container(360, y).setDepth(600);
    const g = scene.add.graphics();
    const w = 760, h = Math.round(size * 1.6);
    // code del nastro
    g.fillStyle(COLORS.ink, 1).fillRect(-w / 2 - 20, -h / 2 + 16, 80, h).fillRect(w / 2 - 60, -h / 2 + 16, 80, h);
    g.fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(25).color, 1).fillRect(-w / 2 - 16, -h / 2 + 20, 72, h - 8).fillRect(w / 2 - 56, -h / 2 + 20, 72, h - 8);
    steppedRect(g, -w / 2 + 40, -h / 2, w - 80, h, COLORS.ink, 8);
    steppedRect(g, -w / 2 + 44, -h / 2 + 4, w - 88, h - 8, color, 6);
    g.fillStyle(0xffffff, 0.3).fillRect(-w / 2 + 52, -h / 2 + 8, w - 104, 6);
    g.fillStyle(0x000000, 0.2).fillRect(-w / 2 + 52, h / 2 - 14, w - 104, 6);
    const t = addTitle(scene, 0, -4, text, Math.round(size * 0.85));
    c.add([g, t]);
    c.setScale(1, 0);
    scene.tweens.chain({
      targets: c,
      tweens: [
        { scaleY: 1, duration: 120, ease: 'Back.easeOut' },
        { scaleY: 0, duration: 120, delay: holdMs, ease: 'Quad.easeIn' },
      ],
      onComplete: () => { c.destroy(); resolve(); },
    });
  });
}

export const p = (x: number, y: number) => new Phaser.Geom.Point(x, y);

export function wait(scene: Phaser.Scene, ms: number): Promise<void> {
  return new Promise((r) => scene.time.delayedCall(ms, r));
}

export function tween(scene: Phaser.Scene, cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
  return new Promise((r) => scene.tweens.add({ ...cfg, onComplete: () => r() }));
}

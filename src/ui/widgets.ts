import Phaser from 'phaser';
import { COLORS, TEXTURE_SCALE } from '../app/config';
import { addBody, addTitle } from './text';

/** Pannello "manga": rettangolo arrotondato con ombra piena e contorno spesso. */
export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, fill: number = COLORS.panel, alpha = 0.96): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(COLORS.ink, 1).fillRoundedRect(x + 6, y + 8, w, h, 26);
  g.fillStyle(fill, alpha).fillRoundedRect(x, y, w, h, 26);
  g.lineStyle(5, COLORS.ink, 1).strokeRoundedRect(x, y, w, h, 26);
  return g;
}

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
      g.fillStyle(COLORS.ink, 1).fillRoundedRect(x - 4, -4, this.barW + 8, this.barH + 8, (this.barH + 8) / 2);
      g.fillStyle(0x4a2038, 1).fillRoundedRect(x, 0, this.barW, this.barH, this.barH / 2);
      const col = ratio > 0.5 ? 0x6fe08a : ratio > 0.25 ? 0xffcf3a : 0xff5f6d;
      if (ratio > 0) g.fillStyle(col, 1).fillRoundedRect(x, 0, Math.max(this.barH, this.barW * ratio), this.barH, this.barH / 2);
      g.fillStyle(0xffffff, 0.35).fillRoundedRect(x + 4, 2, Math.max(0, this.barW * ratio - 8), this.barH * 0.3, 3);
      if (shield > 0) {
        const sw = Math.min(1, shield / max) * this.barW;
        g.fillStyle(0x5fa8ff, 0.85).fillRoundedRect(x + this.barW - sw, -2, sw, this.barH + 4, this.barH / 2);
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
    const w = 720, h = size * 1.7;
    g.fillStyle(COLORS.ink, 1).fillPoints([p(-w / 2 - 40, -h / 2 + 10), p(w / 2 + 40, -h / 2 - 10), p(w / 2 + 40, h / 2 - 2), p(-w / 2 - 40, h / 2 + 18)], true);
    g.fillStyle(color, 1).fillPoints([p(-w / 2 - 40, -h / 2 + 2), p(w / 2 + 40, -h / 2 - 18), p(w / 2 + 40, h / 2 - 10), p(-w / 2 - 40, h / 2 + 10)], true);
    const t = addTitle(scene, 0, -4, text, size).setAngle(-1.5);
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

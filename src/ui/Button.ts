import Phaser from 'phaser';
import { COLORS, FONT_TITLE, RENDER_SCALE } from '../app/config';

export interface ButtonOptions {
  width?: number;
  height?: number;
  enabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  fontSize?: number;
  /** Millisecondi in cui il pulsante ignora altri tap dopo un'attivazione. */
  cooldownMs?: number;
}

const SLANT = 18;
const SHADOW = 9;

/**
 * Pulsante in stile anime: forma inclinata, contorno spesso, ombra "a
 * rilievo" che sparisce alla pressione. Area di tocco ampia e blocco dei tap
 * ripetuti, così un doppio tocco accidentale non attiva due azioni.
 */
export class Button extends Phaser.GameObjects.Container {
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private enabledState: boolean;
  private locked = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    private readonly onTap: () => void,
    private readonly opts: ButtonOptions = {},
  ) {
    super(scene, x, y);
    const w = opts.width ?? 520;
    const h = opts.height ?? 116;
    this.enabledState = opts.enabled ?? true;
    const size = opts.fontSize ?? 56;

    this.bg = scene.add.graphics();
    this.label = scene.add
      .text(0, -4, text, {
        fontFamily: FONT_TITLE, fontSize: `${size}px`, color: COLORS.text,
        stroke: COLORS.inkHex, strokeThickness: Math.round(size / 7),
      })
      .setPadding(8)
      .setResolution(RENDER_SCALE)
      .setOrigin(0.5);
    this.add([this.bg, this.label]);
    this.setSize(w + SLANT * 2, h + SHADOW);
    this.draw(false);

    this.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.isActive() && this.draw(true))
      .on('pointerout', () => this.draw(false))
      .on('pointerup', () => {
        this.draw(false);
        if (!this.isActive()) return;
        this.locked = true;
        scene.tweens.add({ targets: this, scale: { from: 0.94, to: 1 }, duration: 160, ease: 'Back.easeOut' });
        scene.time.delayedCall(opts.cooldownMs ?? 400, () => (this.locked = false));
        this.onTap();
      });

    scene.add.existing(this);
  }

  setEnabled(enabled: boolean): this {
    this.enabledState = enabled;
    this.draw(false);
    return this;
  }

  private isActive(): boolean {
    return this.enabledState && !this.locked;
  }

  private colors(): { fill: number; light: number; text: string } {
    if (!this.enabledState) return { fill: 0x3a3366, light: 0x463e78, text: '#8f86b8' };
    switch (this.opts.variant ?? 'primary') {
      case 'secondary': return { fill: 0x5b4bd6, light: 0x7a6cf0, text: COLORS.text };
      case 'danger': return { fill: COLORS.hot, light: 0xff8a93, text: COLORS.text };
      default: return { fill: COLORS.accent, light: 0xffe27a, text: COLORS.text };
    }
  }

  private draw(pressed: boolean): void {
    const w = (this.opts.width ?? 520) / 2;
    const h = (this.opts.height ?? 116) / 2;
    const { fill, light, text } = this.colors();
    const dy = pressed ? SHADOW - 2 : 0;
    const shape = (oy: number) => [
      new Phaser.Geom.Point(-w + SLANT, -h + oy), new Phaser.Geom.Point(w + SLANT, -h + oy),
      new Phaser.Geom.Point(w - SLANT, h + oy), new Phaser.Geom.Point(-w - SLANT, h + oy),
    ];
    const g = this.bg.clear();
    if (!pressed) g.fillStyle(COLORS.ink, 1).fillPoints(shape(SHADOW), true);
    g.fillStyle(fill, 1).fillPoints(shape(dy), true);
    // banda di luce superiore: effetto "cel shading" sul pulsante
    g.fillStyle(light, 1).fillPoints([
      new Phaser.Geom.Point(-w + SLANT + 6, -h + dy + 6), new Phaser.Geom.Point(w + SLANT - 6, -h + dy + 6),
      new Phaser.Geom.Point(w + SLANT - 10, -h + dy + 22), new Phaser.Geom.Point(-w + SLANT + 2, -h + dy + 22),
    ], true);
    g.lineStyle(6, COLORS.ink, 1).strokePoints(shape(dy), true, true);
    this.label.setY(-4 + dy).setColor(text);
    this.label.setAlpha(this.enabledState ? 1 : 0.8);
  }
}

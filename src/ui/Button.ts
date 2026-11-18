import Phaser from 'phaser';
import { COLORS, FONT_TITLE, RENDER_SCALE } from '../app/config';
import { steppedRect } from './widgets';

export interface ButtonOptions {
  width?: number;
  height?: number;
  enabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  fontSize?: number;
  /** Millisecondi in cui il pulsante ignora altri tap dopo un'attivazione. */
  cooldownMs?: number;
}

const SHADOW = 10;

/**
 * Pulsante pixel art: tavola con angoli "a gradino", bordo scuro, luce in
 * alto e ombra piena che sparisce alla pressione. Area di tocco ampia e
 * blocco dei tap ripetuti contro i doppi tocchi accidentali.
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
    const size = Math.round((opts.fontSize ?? 56) * 0.82);

    this.bg = scene.add.graphics();
    this.label = scene.add
      .text(0, -3, text, {
        fontFamily: FONT_TITLE, fontSize: `${size}px`, fontStyle: '700', color: COLORS.text,
        stroke: COLORS.inkHex, strokeThickness: Math.max(4, Math.round(size / 6)),
      })
      .setPadding(8)
      .setResolution(RENDER_SCALE)
      .setOrigin(0.5);
    this.add([this.bg, this.label]);
    this.setSize(w, h + SHADOW);
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

  private colors(): { fill: number; light: number; dark: number; text: string } {
    if (!this.enabledState) return { fill: 0x6e6258, light: 0x857a70, dark: 0x564c44, text: '#c9bba8' };
    switch (this.opts.variant ?? 'primary') {
      case 'secondary': return { fill: 0x8a5232, light: 0xa9693c, dark: 0x6b3a1e, text: COLORS.text };
      case 'danger': return { fill: 0xd6334a, light: 0xff6b7a, dark: 0xa8211e, text: COLORS.text };
      default: return { fill: COLORS.accent, light: 0xffe27a, dark: COLORS.accentDark, text: COLORS.text };
    }
  }

  private draw(pressed: boolean): void {
    const w = this.opts.width ?? 520;
    const h = this.opts.height ?? 116;
    const { fill, light, dark, text } = this.colors();
    const oy = pressed ? SHADOW - 3 : 0;
    const x = -w / 2, y = -h / 2 + oy;
    const g = this.bg.clear();
    if (!pressed) steppedRect(g, x + 4, -h / 2 + SHADOW, w, h, COLORS.ink, 8);
    steppedRect(g, x, y, w, h, COLORS.ink, 8);
    steppedRect(g, x + 4, y + 4, w - 8, h - 8, fill, 6);
    g.fillStyle(light, 1).fillRect(x + 12, y + 8, w - 24, 8);
    g.fillStyle(dark, 1).fillRect(x + 12, y + h - 16, w - 24, 8);
    // chiodi agli angoli (pulsanti grandi)
    if (w >= 260) [[x + 14, y + h / 2 - 4], [x + w - 22, y + h / 2 - 4]].forEach(([nx, ny]) => g.fillStyle(COLORS.ink, 0.45).fillRect(nx, ny, 8, 8));
    this.label.setY(-3 + oy).setColor(text);
    this.label.setAlpha(this.enabledState ? 1 : 0.8);
  }
}

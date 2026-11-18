import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../app/config';

export interface ButtonOptions {
  width?: number;
  height?: number;
  enabled?: boolean;
  variant?: 'primary' | 'secondary';
  /** Millisecondi in cui il pulsante ignora altri tap dopo un'attivazione. */
  cooldownMs?: number;
}

/**
 * Pulsante touch con area ampia, feedback visivo alla pressione e blocco dei
 * tap ripetuti, così un doppio tocco accidentale non attiva due azioni.
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
    const h = opts.height ?? 120;
    this.enabledState = opts.enabled ?? true;

    this.bg = scene.add.graphics();
    this.label = scene.add
      .text(0, 0, text, { fontFamily: FONT_FAMILY, fontSize: '44px', color: COLORS.text, fontStyle: 'bold' })
      .setOrigin(0.5);
    this.add([this.bg, this.label]);
    this.setSize(w, h);
    this.draw(false);

    this.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.isActive() && this.draw(true))
      .on('pointerout', () => this.draw(false))
      .on('pointerup', () => {
        this.draw(false);
        if (!this.isActive()) return;
        this.locked = true;
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

  private draw(pressed: boolean): void {
    const w = this.width;
    const h = this.height;
    const primary = (this.opts.variant ?? 'primary') === 'primary';
    const fill = !this.enabledState ? COLORS.panel : pressed ? COLORS.accentDark : primary ? COLORS.accent : COLORS.panel;
    this.bg.clear();
    this.bg.fillStyle(fill, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 24);
    this.bg.lineStyle(4, this.enabledState ? COLORS.accent : 0x3a4370, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 24);
    this.label.setColor(!this.enabledState ? COLORS.textMuted : primary ? '#1a1206' : COLORS.text);
  }
}

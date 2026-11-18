import Phaser from 'phaser';
import { COLORS, FONT_BODY, FONT_TITLE, RENDER_SCALE } from '../app/config';

export function addTitle(scene: Phaser.Scene, x: number, y: number, text: string, size = 72) {
  return scene.add
    .text(x, y, text, {
      fontFamily: FONT_TITLE, fontSize: `${size}px`, fontStyle: '700', color: COLORS.text, align: 'center',
      stroke: COLORS.inkHex, strokeThickness: Math.round(size / 7),
      shadow: { offsetX: Math.round(size / 18), offsetY: Math.round(size / 12), color: COLORS.inkHex, blur: 0, fill: true, stroke: true },
    })
    .setPadding(12)
    .setResolution(RENDER_SCALE)
    .setOrigin(0.5);
}

export function addBody(scene: Phaser.Scene, x: number, y: number, text: string, size = 30, color: string = COLORS.textMuted) {
  return scene.add
    .text(x, y, text, { fontFamily: FONT_BODY, fontSize: `${size}px`, fontStyle: '700', color, align: 'center', wordWrap: { width: 640 } })
    .setResolution(RENDER_SCALE)
    .setOrigin(0.5);
}

/** Riempie un testo con un gradiente verticale (titoli "da copertina"). */
export function gradientFill(t: Phaser.GameObjects.Text, top: string, bottom: string): void {
  const g = t.context.createLinearGradient(0, 0, 0, t.height);
  g.addColorStop(0.2, top);
  g.addColorStop(0.85, bottom);
  t.setFill(g);
}

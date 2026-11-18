import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../app/config';

export function addTitle(scene: Phaser.Scene, x: number, y: number, text: string, size = 72) {
  return scene.add
    .text(x, y, text, { fontFamily: FONT_FAMILY, fontSize: `${size}px`, color: COLORS.text, fontStyle: 'bold', align: 'center' })
    .setOrigin(0.5);
}

export function addBody(scene: Phaser.Scene, x: number, y: number, text: string, size = 32, color: string = COLORS.textMuted) {
  return scene.add
    .text(x, y, text, { fontFamily: FONT_FAMILY, fontSize: `${size}px`, color, align: 'center', wordWrap: { width: 620 } })
    .setOrigin(0.5);
}

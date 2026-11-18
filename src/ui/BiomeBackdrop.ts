import Phaser from 'phaser';
import { GAME_WIDTH } from '../app/config';
import { PX, SKY_H, SKY_TOP } from '../pixel/backgrounds';

const EXTRA = 400;

/**
 * Scenario piratesco in pixel art con parallasse: cielo, nuvole, isole e nave
 * all'orizzonte, mare, e in basso il pontile del porto (esplorazione) oppure il
 * ponte della nave con parapetto (battaglia, `deck: true`).
 */
export class BiomeBackdrop {
  private readonly layers: { sprite: Phaser.GameObjects.TileSprite; factor: number }[] = [];
  readonly groundY: number;
  private readonly foregroundY: number;
  private readonly withForeground: boolean;

  constructor(private readonly scene: Phaser.Scene, opts: { groundTop?: number; withForeground?: boolean; deck?: boolean } = {}) {
    const groundTop = opts.groundTop ?? 880;
    this.groundY = groundTop + 56; // linea dei piedi
    this.withForeground = opts.withForeground ?? false;
    this.foregroundY = groundTop + 300;
    const horizon = groundTop - (opts.deck ? 150 : 210);
    const full = GAME_WIDTH + EXTRA * 2;

    // sopra il cielo (schermi molto alti): colore pieno
    scene.add.rectangle(-EXTRA, horizon - SKY_H * PX - 2000, full, 2002, Phaser.Display.Color.HexStringToColor(SKY_TOP).color).setOrigin(0);
    const tile = (key: string, y: number, artH: number, factor: number, h = artH * PX) => {
      const s = scene.add.tileSprite(-EXTRA, y, full, h, key).setOrigin(0).setTileScale(PX);
      s.setTilePosition(EXTRA / PX, 0);
      this.layers.push({ sprite: s, factor });
      return s;
    };
    tile('px-sky', horizon - SKY_H * PX, SKY_H, 0);
    scene.add.image(560, horizon - 300, 'px-sun').setScale(PX);
    tile('px-clouds', horizon - 640, 50, 0.05);
    tile('px-island', horizon - 50 * PX + 4, 50, 0.15);
    tile('px-sea', horizon, 60, 0.35, groundTop - horizon + 8);
    if (opts.deck) {
      tile('px-rail', groundTop - 22 * PX, 24, 1);
      tile('px-deck', groundTop, 120, 1);
      scene.add.rectangle(-EXTRA, groundTop + 120 * PX, full, 2000, 0x6b3a1e).setOrigin(0);
    } else {
      tile('px-dock', groundTop, 120, 1);
      scene.add.rectangle(-EXTRA, groundTop + 120 * PX, full, 2000, 0x5f3520).setOrigin(0);
    }
  }

  /** Da chiamare dopo aver aggiunto i personaggi: pali, botti e casse in primo piano. */
  addForeground(): void {
    if (!this.withForeground) return;
    const s = this.scene.add.tileSprite(-EXTRA, this.foregroundY, GAME_WIDTH + EXTRA * 2, 36 * PX, 'px-front').setOrigin(0).setTileScale(PX);
    this.layers.push({ sprite: s, factor: 1.4 });
  }

  scroll(dx: number): void {
    // tilePosition è in pixel di texture: con tileScale = PX lo spostamento va diviso per PX
    for (const l of this.layers) l.sprite.tilePositionX += (dx * l.factor) / PX;
  }
}

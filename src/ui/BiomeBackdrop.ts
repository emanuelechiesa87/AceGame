import Phaser from 'phaser';
import { GAME_WIDTH } from '../app/config';
import { TEXTURE_SCALE } from '../app/config';

const EXTRA = 400;

/** Strati del bioma con parallasse: ogni strato scorre a velocità diversa. */
export class BiomeBackdrop {
  private readonly layers: { sprite: Phaser.GameObjects.TileSprite; factor: number }[] = [];
  readonly groundY: number;

  constructor(scene: Phaser.Scene, opts: { groundTop?: number; withForeground?: boolean } = {}) {
    const groundTop = opts.groundTop ?? 880;
    this.groundY = groundTop + 56; // linea dei piedi, sul sentiero
    // Gli strati sono più larghi dell'area logica: su schermi più larghi (orizzontale)
    // la scena continua invece di mostrare bordi vuoti.
    scene.add.tileSprite(-EXTRA, 0, GAME_WIDTH + EXTRA * 2, 1280, 'bg-sky').setOrigin(0).setTileScale(1 / TEXTURE_SCALE).setTilePosition(EXTRA * TEXTURE_SCALE, 0);
    // fondo terra sotto lo strato "ground", fino al bordo inferiore
    scene.add.rectangle(-EXTRA, groundTop + 200, GAME_WIDTH + EXTRA * 2, 1200, 0x6b4a5a).setOrigin(0);
    const tile = (key: string, y: number, h: number, factor: number) => {
      const s = scene.add.tileSprite(-EXTRA, y, GAME_WIDTH + EXTRA * 2, h, key).setOrigin(0).setTileScale(1 / TEXTURE_SCALE);
      this.layers.push({ sprite: s, factor });
      return s;
    };
    tile('bg-clouds', 90, 360, 0.08);
    tile('bg-mountains', groundTop - 520, 440, 0.18);
    tile('bg-hills', groundTop - 320, 380, 0.45);
    tile('bg-ground', groundTop, 300, 1);
    this.foregroundY = groundTop + 70;
    this.withForeground = opts.withForeground ?? false;
    this.scene = scene;
  }

  private readonly foregroundY: number;
  private readonly withForeground: boolean;
  private readonly scene: Phaser.Scene;

  /** Da chiamare dopo aver aggiunto i personaggi: l'erba in primo piano va davanti. */
  addForeground(): void {
    if (!this.withForeground) return;
    const s = this.scene.add.tileSprite(-EXTRA, this.foregroundY, GAME_WIDTH + EXTRA * 2, 140, 'bg-foreground').setOrigin(0).setTileScale(1 / TEXTURE_SCALE);
    this.layers.push({ sprite: s, factor: 1.4 });
  }

  scroll(dx: number): void {
    // tilePosition è in pixel di texture: compenso la scala di rasterizzazione
    for (const l of this.layers) l.sprite.tilePositionX += dx * l.factor * TEXTURE_SCALE;
  }
}

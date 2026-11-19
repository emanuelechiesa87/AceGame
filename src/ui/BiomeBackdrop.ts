import Phaser from 'phaser';
import { GAME_WIDTH } from '../app/config';
import { CLOUDS_H, FRONT_H, GROUND_H, ISLAND_H, PX, RAIL_H, SEA_H, SKY_H } from '../pixel/backgrounds';
import { SKY_TOPS, THEME_KEYS } from '../pixel/seaThemes';
import type { BackdropTheme } from '../data/areas';

const EXTRA = 400;

/** Colore moltiplicato per la tinta dell'area (come fa setTint sulle texture). */
function mulColor(c: number, tint?: number): number {
  if (tint === undefined) return c;
  const ch = (v: number, s: number) => Math.round((((v >> s) & 255) * ((tint >> s) & 255)) / 255) << s;
  return ch(c, 16) | ch(c, 8) | ch(c, 0);
}

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
  private readonly tint?: number;

  constructor(private readonly scene: Phaser.Scene, opts: { groundTop?: number; withForeground?: boolean; deck?: boolean; tint?: number; theme?: BackdropTheme } = {}) {
    const groundTop = opts.groundTop ?? 880;
    this.groundY = groundTop + 56; // linea dei piedi
    this.withForeground = opts.withForeground ?? false;
    this.foregroundY = groundTop + 300;
    const horizon = groundTop - (opts.deck ? 150 : 210);
    const full = GAME_WIDTH + EXTRA * 2;
    this.tint = opts.tint;
    const theme = opts.theme ?? 'port';
    const K = THEME_KEYS(theme);
    const fill = (hex: number) => mulColor(hex, this.tint);

    // sopra il cielo (schermi molto alti): colore pieno
    scene.add.rectangle(-EXTRA, horizon - SKY_H * PX - 2000, full, 2002, Phaser.Display.Color.HexStringToColor(SKY_TOPS[theme]).color).setOrigin(0);
    // la tinta dell'area colora solo legno e pontile: cielo e mare hanno già i colori del tema
    const tile = (key: string, y: number, artH: number, factor: number, h = artH * PX, tinted = false) => {
      const s = scene.add.tileSprite(-EXTRA, y, full, h, key).setOrigin(0).setTileScale(PX);
      s.setTilePosition(EXTRA / PX, 0);
      if (tinted && this.tint !== undefined) s.setTint(this.tint);
      this.layers.push({ sprite: s, factor });
      return s;
    };
    tile(K.sky, horizon - SKY_H * PX, SKY_H, 0);
    scene.add.image(560, horizon - 300, K.sun).setScale(PX);
    tile(K.clouds, horizon - 640, CLOUDS_H, 0.05);
    tile(K.island, horizon - ISLAND_H * PX + 4, ISLAND_H, 0.15);
    tile(K.sea, horizon, SEA_H, 0.35, groundTop - horizon + 8);
    if (opts.deck) {
      tile('px-rail', groundTop - 44 * PX, RAIL_H, 1, RAIL_H * PX, true);
      tile('px-deck', groundTop, GROUND_H, 1, GROUND_H * PX, true);
      scene.add.rectangle(-EXTRA, groundTop + GROUND_H * PX, full, 2000, fill(0x6b3a1e)).setOrigin(0);
    } else {
      tile('px-dock', groundTop, GROUND_H, 1, GROUND_H * PX, true);
      scene.add.rectangle(-EXTRA, groundTop + GROUND_H * PX, full, 2000, fill(0x5f3520)).setOrigin(0);
    }
  }

  /** Da chiamare dopo aver aggiunto i personaggi: pali, botti e casse in primo piano. */
  addForeground(): void {
    if (!this.withForeground) return;
    const s = this.scene.add.tileSprite(-EXTRA, this.foregroundY, GAME_WIDTH + EXTRA * 2, FRONT_H * PX, 'px-front').setOrigin(0).setTileScale(PX);
    if (this.tint !== undefined) s.setTint(this.tint);
    this.layers.push({ sprite: s, factor: 1.4 });
  }

  scroll(dx: number): void {
    // tilePosition è in pixel di texture: con tileScale = PX lo spostamento va diviso per PX
    for (const l of this.layers) l.sprite.tilePositionX += (dx * l.factor) / PX;
  }
}

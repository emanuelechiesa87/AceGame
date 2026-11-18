import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, TEXTURE_SCALE } from '../app/config';
import { fitCamera } from './BaseScene';
import { allAssets } from '../art/registry';
import { scaledSvg, toDataUri } from '../art/svg';

/**
 * Rasterizza tutti gli SVG generati in codice in texture Phaser. Nessun file
 * immagine esterno: tutta la grafica è originale e versionata nel codice.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    fitCamera(this);
    const bar = this.add.rectangle(GAME_WIDTH / 2 - 200, GAME_HEIGHT / 2, 0, 16, COLORS.accent).setOrigin(0, 0.5);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 404, 20).setStrokeStyle(3, COLORS.accent);

    const assets = allAssets();
    let done = 0;
    Promise.all(
      assets.map(async (a) => {
        const img = new Image();
        img.src = toDataUri(scaledSvg(a.svg, a.w, a.h, TEXTURE_SCALE));
        await img.decode();
        this.textures.addImage(a.key, img);
        bar.width = (400 * ++done) / assets.length;
      }),
    )
      .then(() => this.scene.start('Menu'))
      .catch((err) => {
        console.error('Errore nel caricamento della grafica', err);
        this.add.text(40, 40, 'Errore di caricamento: ricarica la pagina', { color: '#fff', fontSize: '28px' });
      });
  }
}

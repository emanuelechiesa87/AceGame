import Phaser from 'phaser';
import { fitCamera } from './BaseScene';
import { makeBackgroundTextures } from '../pixel/backgrounds';
import { makeCreatureTextures } from '../pixel/creatures';
import { makeHeroTextures } from '../pixel/heroes';
import { makeIconTextures } from '../pixel/icons';

/**
 * Genera in codice tutte le texture in pixel art. Nessun file immagine
 * esterno: tutta la grafica è originale e versionata nel codice.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    fitCamera(this);
    try {
      makeHeroTextures(this, 'm');
      makeHeroTextures(this, 'f');
      makeCreatureTextures(this);
      makeIconTextures(this);
      makeBackgroundTextures(this);
      this.scene.start('Menu');
    } catch (err) {
      console.error('Errore nella generazione della grafica', err);
      this.add.text(40, 40, 'Errore di caricamento: ricarica la pagina', { color: '#fff', fontSize: '28px' });
    }
  }
}

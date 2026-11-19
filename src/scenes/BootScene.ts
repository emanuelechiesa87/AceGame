import Phaser from 'phaser';
import { fitCamera } from './BaseScene';
import { makeBackgroundTextures } from '../pixel/backgrounds';
import { makeSeaThemeTextures } from '../pixel/seaThemes';
import { makeCreatureTextures } from '../pixel/creatures';
import { makeHeroTextures } from '../pixel/heroes';
import { makeIconTextures } from '../pixel/icons';
import { GameSession } from '../state/GameSession';
import { Audio } from '../systems/Audio';

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
      makeSeaThemeTextures(this);
      // recupera la copia di sicurezza (IndexedDB) se il browser ha svuotato localStorage; max 1,5 s
      const timeout = new Promise<'ok'>((r) => setTimeout(() => r('ok'), 1500));
      void Promise.race([GameSession.restoreFromDurable(), timeout]).then(() => {
        Audio.init(GameSession.save.data.settings);
        this.scene.start('Menu');
      });
    } catch (err) {
      console.error('Errore nella generazione della grafica', err);
      this.add.text(40, 40, 'Errore di caricamento: ricarica la pagina', { color: '#fff', fontSize: '28px' });
    }
  }
}

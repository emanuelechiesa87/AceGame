import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../app/config';
import { waveCover, waveReveal } from '../ui/transitions';
import { GameSession } from '../state/GameSession';

/**
 * Inquadra sempre l'area logica 720×1280 al centro del canvas, qualunque sia
 * la forma dello schermo (telefono allungato, rotazione, desktop). Lo spazio
 * in più mostra il proseguimento della scena, non bande nere.
 */
export function fitCamera(scene: Phaser.Scene): void {
  const apply = () => {
    const { width, height } = scene.scale.gameSize;
    const zoom = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT);
    scene.cameras.main.setZoom(zoom).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
  };
  apply();
  scene.scale.on(Phaser.Scale.Events.RESIZE, apply);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, apply));
}

/** Parte del mondo logico davvero visibile (gli schermi alti mostrano più spazio sopra e sotto). */
export function visibleBounds(scene: Phaser.Scene): { top: number; bottom: number; left: number; right: number } {
  const { width, height } = scene.scale.gameSize;
  const zoom = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT);
  const vw = width / zoom, vh = height / zoom;
  return { top: GAME_HEIGHT / 2 - vh / 2, bottom: GAME_HEIGHT / 2 + vh / 2, left: GAME_WIDTH / 2 - vw / 2, right: GAME_WIDTH / 2 + vw / 2 };
}

export abstract class BaseScene extends Phaser.Scene {
  private transitioning = false;

  protected setupCamera(): void {
    this.transitioning = false;
    fitCamera(this);
  }

  /** Velocità delle transizioni: doppia con "animazioni veloci". */
  protected get fxSpeed(): number { return GameSession.save.data.settings.fastAnimations ? 2 : 1; }

  /** Le scene con una telecamera dell'interfaccia separata (battaglia) la usano per gli strati sopra a tutto. */
  protected uiWrap<T>(fn: () => T): T { return fn(); }

  /** Se la scena precedente è uscita con l'onda, questa la fa defluire. */
  protected revealIfWave(data?: { wave?: boolean }): Promise<void> {
    return data?.wave ? waveReveal(this, this.fxSpeed, (fn) => this.uiWrap(fn)) : Promise.resolve();
  }

  /**
   * Transizione tra scene; ignora richieste doppie da tap ripetuti.
   * `wave`: l'onda copre lo schermo e la scena di arrivo riceve `{ wave: true }`.
   */
  protected goTo(key: string, data?: object, style: 'flash' | 'wave' = 'flash'): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.input.enabled = false;
    if (style === 'wave') {
      waveCover(this, () => { this.input.enabled = true; this.scene.start(key, { ...data, wave: true }); }, this.fxSpeed, (fn) => this.uiWrap(fn));
      return;
    }
    this.cameras.main.flash(160, 255, 247, 230);
    this.time.delayedCall(140, () => {
      this.input.enabled = true;
      this.scene.start(key, data);
    });
  }

  /** Copre anche le aree fuori dall'inquadratura logica (schermi allungati). */
  protected fullRect(color: number, alpha: number): Phaser.GameObjects.Rectangle {
    return this.add.rectangle(-400, -800, GAME_WIDTH + 800, GAME_HEIGHT + 1600, color, alpha).setOrigin(0);
  }
}

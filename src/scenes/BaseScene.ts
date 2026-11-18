import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../app/config';

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

export abstract class BaseScene extends Phaser.Scene {
  private transitioning = false;

  protected setupCamera(): void {
    this.transitioning = false;
    fitCamera(this);
  }

  /** Transizione "a lampo" tra scene; ignora richieste doppie da tap ripetuti. */
  protected goTo(key: string, data?: object): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.input.enabled = false;
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

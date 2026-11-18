import Phaser from 'phaser';

/**
 * Genera texture segnaposto (forme geometriche) al volo: nessun asset esterno
 * finché non esiste una guida di stile. Sono volutamente temporanee.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.makeAvatar('avatar-a', 0x4bb3f2);
    this.makeAvatar('avatar-b', 0xf27b9b);
    this.makeLayer('bg-far', 0x1a2250, 0x232d66, 90, 260);
    this.makeLayer('bg-near', 0x2a3a5e, 0x34507a, 50, 160);
    this.makeGround();
    this.scene.start('Menu');
  }

  private makeAvatar(key: string, color: number): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(color, 1).fillRoundedRect(20, 70, 80, 110, 20); // corpo
    g.fillStyle(0xf4e1c8, 1).fillCircle(60, 45, 38); // testa
    g.fillStyle(0x111111, 1).fillCircle(48, 42, 5).fillCircle(72, 42, 5); // occhi
    g.fillStyle(0x222838, 1).fillRect(30, 178, 22, 30).fillRect(68, 178, 22, 30); // gambe
    g.generateTexture(key, 120, 210);
    g.destroy();
  }

  private makeLayer(key: string, base: number, peak: number, minH: number, maxH: number): void {
    const w = 720;
    const h = 400;
    const g = this.make.graphics({}, false);
    g.fillStyle(base, 1).fillRect(0, h - 40, w, 40);
    g.fillStyle(peak, 1);
    // Profilo ripetibile: inizio e fine alla stessa altezza per uno scorrimento senza giunture.
    for (let x = 0; x < w; x += 120) {
      const ph = minH + ((x * 37) % (maxH - minH));
      g.fillTriangle(x, h - 40, x + 60, h - 40 - ph, x + 120, h - 40);
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private makeGround(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(0x3b2f2a, 1).fillRect(0, 0, 128, 200);
    g.fillStyle(0x5a8f4e, 1).fillRect(0, 0, 128, 18);
    g.fillStyle(0x4a3c35, 1).fillRect(20, 60, 30, 12).fillRect(80, 120, 26, 10);
    g.generateTexture('ground', 128, 200);
    g.destroy();
  }
}

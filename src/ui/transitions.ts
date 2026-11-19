import Phaser from 'phaser';

/**
 * Transizione "a onda" (0.5.4): un'onda pixel attraversa lo schermo da sinistra
 * a destra. `waveCover` copre la scena che si chiude, `waveReveal` scopre quella
 * che si apre continuando nella stessa direzione, così sembra un'unica onda.
 * Solo cosmetica: usa il random di Phaser, non l'Rng di gioco.
 */

const DEPTH = 10_000;
const BODY_W = 1700; // larghezza della massa d'acqua (copre anche gli schermi larghi)
const LEFT = -460, RIGHT = 1180; // posizioni del fronte d'onda fuori schermo
const STEP = 16;

function drawWave(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0).setDepth(DEPTH);
  const g = scene.add.graphics();
  const y0 = -1000, y1 = 2300;
  const deep = 0x16508a, mid = 0x1f6fb2, light = 0x5fb8f0, foam = 0xfff7e6, ink = 0x1f1633;
  g.fillStyle(deep, 1).fillRect(-BODY_W, y0, BODY_W, y1 - y0);
  // fronte (destra) e coda (sinistra) a gradini, con cresta di schiuma
  for (let y = y0; y < y1; y += STEP) {
    const wob = Math.round((Math.sin(y / 70) * 34 + Math.sin(y / 23) * 10) / STEP) * STEP;
    g.fillStyle(ink, 1).fillRect(-8 + wob, y, 16, STEP);
    g.fillStyle(mid, 1).fillRect(-90 + wob, y, 82, STEP);
    g.fillStyle(light, 1).fillRect(-40 + wob, y, 32, STEP);
    if ((y / STEP) % 3 === 0) g.fillStyle(foam, 1).fillRect(-24 + wob, y, 16, STEP);
    const back = Math.round(Math.sin(y / 60 + 1.7) * 30 / STEP) * STEP;
    g.fillStyle(ink, 1).fillRect(-BODY_W - 8 + back, y, 16, STEP);
    g.fillStyle(mid, 1).fillRect(-BODY_W + 8 + back, y, 60, STEP);
    if ((y / STEP) % 4 === 1) g.fillStyle(foam, 1).fillRect(-BODY_W + 8 + back, y, 16, STEP);
  }
  // riflessi sparsi nell'acqua
  for (let i = 0; i < 70; i++) {
    g.fillStyle(i % 2 ? light : mid, 0.8).fillRect(-Phaser.Math.Between(140, BODY_W - 80), Phaser.Math.Between(y0, y1), Phaser.Math.Between(2, 6) * STEP, STEP / 2);
  }
  c.add(g);
  return c;
}

/** Copre la scena con l'onda, poi chiama `done` (di solito `scene.start`). */
export function waveCover(scene: Phaser.Scene, done: () => void, speed = 1, wrap: <T>(fn: () => T) => T = (fn) => fn()): void {
  const w = wrap(() => drawWave(scene));
  w.x = LEFT;
  scene.tweens.add({ targets: w, x: RIGHT, duration: 460 / speed, ease: 'Sine.easeIn', onComplete: done });
}

/** Scopre la nuova scena: l'onda prosegue verso destra e se ne va. */
export function waveReveal(scene: Phaser.Scene, speed = 1, wrap: <T>(fn: () => T) => T = (fn) => fn()): Promise<void> {
  const w = wrap(() => drawWave(scene));
  w.x = RIGHT;
  return new Promise((r) => scene.tweens.add({
    targets: w, x: RIGHT + BODY_W + 520, duration: 520 / speed, ease: 'Sine.easeOut',
    onComplete: () => { w.destroy(); r(); },
  }));
}

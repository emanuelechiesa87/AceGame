import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../app/config';
import { FRUIT_BY_ID, fruitAbility } from '../data/fruits';
import { iconKey, type HeroId } from '../pixel/keys';
import { HeroRig } from './HeroRig';
import { addBody, addTitle } from './text';
import { icon } from './widgets';

/**
 * Animazioni dedicate ai poteri dei frutti, in pixel art (solo quadrati e
 * linee squadrate). Ogni frutto ha la sua coreografia; il livello di
 * risveglio (1..5) ne aumenta intensità e spettacolarità; dal IV si aggiungono
 * un lampo e anelli dorati, al V una pioggia di scintille sullo schermo.
 * Solo cosmetiche: usano il random di Phaser, mai l'Rng di gioco.
 */
export interface FxUnit { x: number; y: number; top: number; root: Phaser.GameObjects.Container }
export interface FxCtx { scene: Phaser.Scene; caster: FxUnit; targets: FxUnit[]; level: number; speed: number }

export const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
const DEPTH = 300;
const R = Phaser.Math.Between;
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color;

// --- mattoncini -----------------------------------------------------------------------
function tw(scene: Phaser.Scene, cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
  return new Promise((r) => scene.tweens.add({ ...cfg, onComplete: () => r() }));
}
const wait = (scene: Phaser.Scene, ms: number) => new Promise<void>((r) => scene.time.delayedCall(ms, r));

/** Le particelle sono grandi apposta: sul telefono devono leggersi anche di sfuggita. */
const BIG = 1.8;

function sq(scene: Phaser.Scene, x: number, y: number, size: number, color: number, alpha = 1): Phaser.GameObjects.Rectangle {
  const z = Math.round((size * BIG) / 4) * 4;
  return scene.add.rectangle(Math.round(x / 4) * 4, Math.round(y / 4) * 4, z, z, color, alpha).setDepth(DEPTH).setStrokeStyle(3, COLORS.ink, 0.6);
}

/** Esplosione di quadratini che volano via e svaniscono. */
function burst(scene: Phaser.Scene, x: number, y: number, colors: number[], n: number, radius: number, dur: number, size = 12, gravity = 0): void {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
    const d = radius * (0.5 + Math.random() * 0.6);
    const p = sq(scene, x, y, size * (0.6 + Math.random() * 0.7), colors[i % colors.length]);
    scene.tweens.add({ targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d + gravity, alpha: 0, scale: 0.3, duration: dur * (0.7 + Math.random() * 0.5), ease: 'Quad.easeOut', onComplete: () => p.destroy() });
  }
}

/** Anello squadrato che si allarga. */
function ring(scene: Phaser.Scene, x: number, y: number, color: number, size: number, dur: number, thick = 8, depth = DEPTH): Promise<void> {
  const g = scene.add.graphics().setDepth(depth);
  const c = { t: 0 };
  return tw(scene, { targets: c, t: 1, duration: dur, ease: 'Quad.easeOut', onUpdate: () => {
    const sz = Math.round((20 + (size - 20) * c.t) / 4) * 4;
    g.clear().lineStyle(thick, color, 1 - c.t).strokeRect(x - sz / 2, y - sz / 2, sz, sz);
  } }).then(() => g.destroy());
}

/** Lampo a tutto schermo. */
function flash(scene: Phaser.Scene, color: number, alpha: number, dur: number): void {
  const f = scene.add.rectangle(-400, -800, GAME_WIDTH + 800, 2880, color, alpha).setOrigin(0).setDepth(DEPTH - 1);
  scene.tweens.add({ targets: f, alpha: 0, duration: dur, onComplete: () => f.destroy() });
}

/** Proiettile quadrato con scia. */
async function shoot(scene: Phaser.Scene, from: { x: number; y: number }, to: { x: number; y: number }, size: number, color: number, trail: number[], dur: number, arc = 0): Promise<void> {
  const p = sq(scene, from.x, from.y, size, color);
  const ink = scene.add.rectangle(from.x, from.y, size * BIG + 8, size * BIG + 8, COLORS.ink).setDepth(DEPTH - 1);
  const timer = scene.time.addEvent({ delay: 30, loop: true, callback: () => {
    const t = sq(scene, p.x + R(-6, 6), p.y + R(-6, 6), size * 0.6, trail[R(0, trail.length - 1)]);
    scene.tweens.add({ targets: t, alpha: 0, scale: 0.2, duration: 260, onComplete: () => t.destroy() });
  } });
  const c = { t: 0 };
  await tw(scene, { targets: c, t: 1, duration: dur, ease: 'Quad.easeIn', onUpdate: () => {
    const x = from.x + (to.x - from.x) * c.t, y = from.y + (to.y - from.y) * c.t - Math.sin(c.t * Math.PI) * arc;
    p.setPosition(x, y); ink.setPosition(x, y); p.setAngle(c.t * 360);
  } });
  timer.remove(); p.destroy(); ink.destroy();
}

/** Fulmine a zig-zag tra due punti. */
function bolt(scene: Phaser.Scene, from: { x: number; y: number }, to: { x: number; y: number }, color: number, width = 10, dur = 260): void {
  const g = scene.add.graphics().setDepth(DEPTH);
  const pts: Phaser.Math.Vector2[] = [];
  const n = 7;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push(new Phaser.Math.Vector2(from.x + (to.x - from.x) * t + (i && i < n ? R(-30, 30) : 0), from.y + (to.y - from.y) * t));
  }
  const w = width * 1.5;
  g.lineStyle(w + 10, COLORS.ink, 1).strokePoints(pts);
  g.lineStyle(w, color, 1).strokePoints(pts);
  g.lineStyle(Math.max(3, w / 3), 0xffffff, 1).strokePoints(pts);
  // sfarfallio: resta acceso, poi si spegne a scatti
  scene.tweens.add({ targets: g, alpha: { from: 1, to: 0.3 }, duration: 70, yoyo: true, repeat: 2, onComplete: () => scene.tweens.add({ targets: g, alpha: 0, duration: dur, onComplete: () => g.destroy() }) });
}

/** Fendente: barra spessa che si allunga in diagonale. */
async function slash(scene: Phaser.Scene, x: number, y: number, len: number, angle: number, color: number, thick: number, dur: number): Promise<void> {
  const ink = scene.add.rectangle(x, y, len + 10, thick + 10, COLORS.ink).setAngle(angle).setDepth(DEPTH);
  const bar = scene.add.rectangle(x, y, len, thick, color).setAngle(angle).setDepth(DEPTH);
  const core = scene.add.rectangle(x, y, len - 10, Math.max(4, thick / 3), 0xffffff).setAngle(angle).setDepth(DEPTH);
  const all = [ink, bar, core];
  all.forEach((o) => o.setScale(0, 1));
  await tw(scene, { targets: all, scaleX: 1, duration: dur, ease: 'Quad.easeOut' });
  await tw(scene, { targets: all, alpha: 0, scaleY: 0, duration: dur * 1.2 });
  all.forEach((o) => o.destroy());
}

/** Particelle che si raccolgono verso un punto (caricamento del potere). */
async function gather(scene: Phaser.Scene, x: number, y: number, colors: number[], n: number, dur: number): Promise<void> {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 60;
    const p = sq(scene, x + Math.cos(a) * d, y + Math.sin(a) * d, 10, colors[i % colors.length]);
    scene.tweens.add({ targets: p, x, y, alpha: { from: 0.2, to: 1 }, duration: dur * (0.6 + Math.random() * 0.4), ease: 'Quad.easeIn', onComplete: () => p.destroy() });
  }
  await wait(scene, dur);
}

function shake(scene: Phaser.Scene, dur: number, k: number): void { scene.cameras.main.shake(dur, k); }

// --- coreografie per frutto --------------------------------------------------------------
type Fx = (c: FxCtx) => Promise<void>;
const hand = (u: FxUnit) => ({ x: u.x + 50, y: u.y });

const FX: Record<string, Fx> = {
  /** Bacca Brace: pugno che si incendia, palla di fuoco, esplosione e braci. Lv III: meteore. */
  fruit_ember: async ({ scene, caster, targets, level, speed: s }) => {
    const fire = [0xff6b3d, 0xffb43a, 0xffe14a, 0xe4342f];
    await gather(scene, hand(caster).x, hand(caster).y, fire, 10 + level * 6, 420 / s);
    if (level >= 3) {
      flash(scene, 0xff6b3d, 0.35, 400 / s);
      await Promise.all(targets.map((t, i) => wait(scene, (i * 120) / s).then(() => shoot(scene, { x: t.x + 160, y: t.top - 500 }, { x: t.x, y: t.y }, 40, 0xff6b3d, fire, 380 / s))));
    } else await Promise.all(targets.map((t) => shoot(scene, hand(caster), { x: t.x, y: t.y }, 24 + level * 8, 0xff6b3d, fire, 300 / s)));
    shake(scene, 220 / s, 0.012 + level * 0.004);
    for (const t of targets) {
      burst(scene, t.x, t.y, fire, 18 + level * 8, 150 + level * 30, 520 / s, 14);
      void ring(scene, t.x, t.y, 0xffb43a, 220 + level * 40, 420 / s);
      for (let i = 0; i < 6 + level * 2; i++) {
        const e = sq(scene, t.x + R(-60, 60), t.y + R(-20, 40), 8, fire[R(0, 3)]);
        scene.tweens.add({ targets: e, y: e.y - R(80, 160), alpha: 0, duration: R(500, 900) / s, onComplete: () => e.destroy() });
      }
    }
    await wait(scene, 260 / s);
  },

  /** Mela Brina: fiocchi che si radunano, scheggia di ghiaccio, blocco di ghiaccio che si frantuma. Lv III: bufera. */
  fruit_frost: async ({ scene, caster, targets, level, speed: s }) => {
    const ice = [0xe8fbff, 0x9fe8ff, 0x5fd3ff, 0xffffff];
    if (level >= 3) {
      for (let i = 0; i < 50; i++) {
        const f = sq(scene, R(-100, GAME_WIDTH), R(-50, 300), R(6, 12), ice[i % 4], 0.9);
        scene.tweens.add({ targets: f, x: f.x + 400, y: f.y + 600, duration: R(500, 800) / s, onComplete: () => f.destroy() });
      }
      flash(scene, 0xbff4ff, 0.4, 500 / s);
      await wait(scene, 300 / s);
    } else {
      await gather(scene, hand(caster).x, hand(caster).y, ice, 12 + level * 4, 380 / s);
      await Promise.all(targets.map((t) => shoot(scene, hand(caster), { x: t.x, y: t.y }, 20 + level * 6, 0x9fe8ff, ice, 260 / s)));
    }
    const blocks = targets.map((t) => {
      const b = scene.add.rectangle(t.x, t.y, 170, 200, 0x9fe8ff, 0.55).setStrokeStyle(8, 0xe8fbff).setDepth(DEPTH).setScale(0.1);
      return { b, t };
    });
    await Promise.all(blocks.map(({ b }) => tw(scene, { targets: b, scale: 1, duration: 200 / s, ease: 'Back.easeOut' })));
    await wait(scene, 240 / s);
    shake(scene, 160 / s, 0.01);
    for (const { b, t } of blocks) { b.destroy(); burst(scene, t.x, t.y, ice, 20 + level * 6, 180, 520 / s, 16, 60); }
    await wait(scene, 150 / s);
  },

  /** Fico Granito: rocce che emergono dal terreno e formano un muro davanti alla squadra. */
  fruit_stone: async ({ scene, targets, level, speed: s }) => {
    const rock = [0x9a9aaa, 0x6e6e80, 0xc8a26b, 0x8a7a5a];
    shake(scene, 300 / s, 0.008);
    await Promise.all(targets.map(async (t, k) => {
      const pieces: Phaser.GameObjects.Rectangle[] = [];
      const cols = 3 + level;
      for (let i = 0; i < cols * 3; i++) {
        const x = t.x + 70 + (i % 2) * 14, y = t.y + 60 - Math.floor(i / 2) * 26;
        const r = scene.add.rectangle(x, t.y + 200, 34, 24, rock[i % 4]).setStrokeStyle(4, COLORS.ink).setDepth(DEPTH);
        pieces.push(r);
        scene.tweens.add({ targets: r, y, duration: 260 / s, delay: (i * 30 + k * 60) / s, ease: 'Back.easeOut' });
      }
      await wait(scene, (260 + cols * 90) / s);
      void ring(scene, t.x, t.y, 0xc8a26b, 180, 360 / s, 10);
      burst(scene, t.x + 70, t.y + 60, [0xd9c9a0, 0xb8a888], 10, 90, 400 / s, 10, -30);
      await wait(scene, 280 / s);
      pieces.forEach((p) => scene.tweens.add({ targets: p, alpha: 0, y: p.y + 30, duration: 300 / s, onComplete: () => p.destroy() }));
    }));
  },

  /** Pesca Tuono: cielo che si scurisce e fulmini su ogni nemico, catena tra i bersagli. */
  fruit_storm: async ({ scene, caster, targets, level, speed: s }) => {
    flash(scene, 0x14233f, 0.55, 900 / s);
    await gather(scene, caster.x, caster.top - 20, [0xffd94a, 0x5fd3ff], 10 + level * 4, 300 / s);
    const strikes = level >= 3 ? 2 : 1;
    for (let k = 0; k < strikes; k++) {
      flash(scene, 0xffffff, 0.5, 120 / s);
      targets.forEach((t) => {
        bolt(scene, { x: t.x + R(-40, 40), y: t.top - 520 }, { x: t.x, y: t.y }, 0xffd94a, 10 + level * 3, 320 / s);
        burst(scene, t.x, t.y, [0xffd94a, 0x5fd3ff, 0xffffff], 12 + level * 4, 130, 380 / s, 10);
      });
      for (let i = 1; i < targets.length; i++) bolt(scene, { x: targets[i - 1].x, y: targets[i - 1].y }, { x: targets[i].x, y: targets[i].y }, 0x5fd3ff, 6, 300 / s);
      shake(scene, 200 / s, 0.014);
      await wait(scene, 320 / s);
    }
  },

  /** Lampone Linfa: foglie e petali che spiralano attorno alla squadra, croci di cura che salgono. */
  fruit_life: async ({ scene, targets, level, speed: s }) => {
    const leaf = [0x6fe08a, 0x3fb36a, 0xff7fa6, 0xffd6e6];
    for (let i = 0; i < 14 + level * 8; i++) {
      const p = sq(scene, R(0, GAME_WIDTH), R(-100, 100), R(8, 14), leaf[i % 4]);
      scene.tweens.add({ targets: p, y: p.y + R(500, 800), x: p.x + R(-80, 80), angle: 360, alpha: 0, duration: R(900, 1300) / s, onComplete: () => p.destroy() });
    }
    await Promise.all(targets.map(async (t) => {
      for (let i = 0; i < 8 + level * 2; i++) {
        const a = (i / (8 + level * 2)) * Math.PI * 2;
        const p = sq(scene, t.x + Math.cos(a) * 80, t.y + 60, 12, leaf[i % 2]);
        scene.tweens.add({ targets: p, x: t.x + Math.cos(a + 3) * 20, y: t.top, alpha: 0, duration: 700 / s, onComplete: () => p.destroy() });
      }
      for (let i = 0; i < 2 + level; i++) {
        const cx = t.x + R(-50, 50), cy = t.y + R(-10, 40);
        const plus = [scene.add.rectangle(cx, cy, 28, 8, 0x6fe08a), scene.add.rectangle(cx, cy, 8, 28, 0x6fe08a)].map((r) => r.setDepth(DEPTH).setStrokeStyle(3, COLORS.ink));
        scene.tweens.add({ targets: plus, y: cy - 120, alpha: 0, duration: 800 / s, delay: (i * 120) / s, onComplete: () => plus.forEach((p) => p.destroy()) });
      }
      const glow = scene.add.rectangle(t.x, t.y, 160, 220, 0x6fe08a, 0.25).setDepth(DEPTH - 1);
      await tw(scene, { targets: glow, alpha: 0, scaleY: 1.4, duration: 700 / s, onComplete: () => glow.destroy() });
    }));
  },

  /** Susina d'Ombra: lo schermo si oscura, fendente viola gigante e frammenti d'ombra. Lv III: eclissi su tutti. */
  fruit_shadow: async ({ scene, caster, targets, level, speed: s }) => {
    const dark = scene.add.rectangle(-400, -800, GAME_WIDTH + 800, 2880, 0x0d0820, 0).setOrigin(0).setDepth(DEPTH - 2);
    await tw(scene, { targets: dark, fillAlpha: 0.7, duration: 280 / s });
    // l'eroe "sparisce" e ricompare dietro al bersaglio
    scene.tweens.add({ targets: caster.root, alpha: 0.15, duration: 120 / s, yoyo: true, hold: 300 / s });
    if (level >= 3) {
      const sun = scene.add.circle(GAME_WIDTH / 2, 200, 70, 0x0d0820).setStrokeStyle(10, 0x9b6bff).setDepth(DEPTH);
      await tw(scene, { targets: sun, scale: 1.4, duration: 300 / s });
      sun.destroy();
    }
    for (const t of targets) {
      void slash(scene, t.x, t.y, 260 + level * 40, -35, 0x9b6bff, 18 + level * 4, 120 / s);
      if (level >= 2) void slash(scene, t.x, t.y, 220 + level * 30, 35, 0xff5f8a, 12 + level * 3, 140 / s);
    }
    await wait(scene, 180 / s);
    shake(scene, 260 / s, 0.018);
    targets.forEach((t) => burst(scene, t.x, t.y, [0x9b6bff, 0x4a2a8a, 0xff5f8a], 20 + level * 6, 200, 600 / s, 12));
    await wait(scene, 300 / s);
    await tw(scene, { targets: dark, fillAlpha: 0, duration: 260 / s, onComplete: () => dark.destroy() });
  },

  /** Gelso Molla: l'eroe rimbalza e scaglia una raffica di molle a zig-zag. */
  fruit_spring: async ({ scene, caster, targets, level, speed: s }) => {
    await tw(scene, { targets: caster.root, y: caster.root.y - 60, duration: 140 / s, yoyo: true, ease: 'Quad.easeOut', repeat: 1 });
    const hits = 4 + level;
    for (let i = 0; i < hits; i++) {
      const t = targets[i % targets.length];
      const g = scene.add.graphics().setDepth(DEPTH);
      const draw = (len: number) => {
        const pts = Array.from({ length: 9 }, (_, k) => new Phaser.Math.Vector2(k * len / 8, k % 2 ? -20 : 20));
        g.clear().lineStyle(16, COLORS.ink).strokePoints(pts);
        g.lineStyle(9, 0xff7fb0).strokePoints(pts);
        g.lineStyle(3, 0xffd6e6).strokePoints(pts);
      };
      draw(100);
      g.setPosition(hand(caster).x, hand(caster).y - 20 + R(-20, 20));
      void tw(scene, { targets: g, x: t.x - 30, y: t.y + R(-30, 30), duration: 130 / s, ease: 'Quad.easeIn', onComplete: () => {
        g.destroy();
        void ring(scene, t.x, t.y, 0xff7fb0, 90 + level * 20, 240 / s, 6);
        burst(scene, t.x, t.y, [0xff7fb0, 0xfff1a8], 6, 70, 300 / s, 8);
      } });
      await wait(scene, 70 / s);
    }
    await wait(scene, 200 / s);
  },

  /** Nespola Nebbia: nuvole che avvolgono l'eroe, copie fantasma che si sdoppiano. */
  fruit_mist: async ({ scene, caster, level, speed: s }) => {
    for (let i = 0; i < 10 + level * 4; i++) {
      const p = scene.add.rectangle(caster.x + R(-90, 90), caster.y + R(-80, 80), R(40, 80), R(24, 40), 0xe8f0fb, 0.75).setDepth(DEPTH);
      scene.tweens.add({ targets: p, x: p.x + R(-60, 60), alpha: 0, scale: 1.6, duration: R(700, 1100) / s, onComplete: () => p.destroy() });
    }
    const ghosts = [-1, 1, ...(level >= 2 ? [-2, 2] : [])].map((d) => {
      const r = scene.add.rectangle(caster.x, caster.y, 90, 200, 0xc9d6e8, 0.35).setDepth(DEPTH);
      scene.tweens.add({ targets: r, x: caster.x + d * 70, alpha: 0, duration: 700 / s, onComplete: () => r.destroy() });
      return r;
    });
    void ghosts;
    await tw(scene, { targets: caster.root, alpha: { from: 1, to: 0.35 }, duration: 160 / s, yoyo: true, repeat: 2 });
    caster.root.setAlpha(1);
  },

  /** Cocco Zanna: ruggito, artigli che graffiano lo schermo, aura rossa che sale. */
  fruit_fang: async ({ scene, caster, level, speed: s }) => {
    const grr = addTitle(scene, caster.x + 40, caster.top - 40, 'GRRR!', 54).setColor('#ff9a2a').setDepth(DEPTH + 1).setScale(0.3);
    void tw(scene, { targets: grr, scale: 1.2, duration: 160 / s, ease: 'Back.easeOut' }).then(() => tw(scene, { targets: grr, alpha: 0, y: grr.y - 40, duration: 500 / s, delay: 200 / s, onComplete: () => grr.destroy() }));
    shake(scene, 400 / s, 0.016);
    for (let i = 0; i < 3; i++) void slash(scene, caster.x + 60 + i * 34, caster.y - 20 + i * 10, 220, 60, 0xb07b4a, 12, 110 / s);
    for (let i = 0; i < 20 + level * 8; i++) {
      const p = sq(scene, caster.x + R(-70, 70), caster.y + R(0, 110), R(8, 14), [0xe4342f, 0xff9a2a, 0xffcf3a][i % 3]);
      scene.tweens.add({ targets: p, y: p.y - R(150, 260), alpha: 0, duration: R(600, 900) / s, delay: R(0, 300) / s, onComplete: () => p.destroy() });
    }
    await tw(scene, { targets: caster.root, scaleX: caster.root.scaleX * 1.15, scaleY: caster.root.scaleY * 1.15, duration: 200 / s, yoyo: true, hold: 260 / s });
  },

  /** Kiwi Colla: palle di colla lanciate ad arco, schizzi verdi e rete appiccicosa. */
  fruit_glue: async ({ scene, caster, targets, level, speed: s }) => {
    const goo = [0xa8d84a, 0x78a828, 0xf1ffc2];
    await Promise.all(targets.map((t, i) => wait(scene, (i * 90) / s).then(() => shoot(scene, hand(caster), { x: t.x, y: t.y }, 26 + level * 4, 0xa8d84a, goo, 380 / s, 160))));
    for (const t of targets) {
      burst(scene, t.x, t.y, goo, 14 + level * 4, 120, 500 / s, 12, 40);
      const net = scene.add.graphics().setDepth(DEPTH);
      net.lineStyle(5, 0xd8f08a, 0.9);
      for (let k = -2; k <= 2; k++) { net.lineBetween(t.x - 80, t.y + k * 30, t.x + 80, t.y + k * 30 + 20); net.lineBetween(t.x + k * 30, t.y - 80, t.x + k * 30 + 20, t.y + 80); }
      scene.tweens.add({ targets: net, alpha: 0, duration: 900 / s, delay: 300 / s, onComplete: () => net.destroy() });
    }
    await wait(scene, 400 / s);
  },

  /** Prugna Specchio: pannelli di cristallo che ruotano attorno all'eroe, lampo di luce. */
  fruit_mirror: async ({ scene, caster, level, speed: s }) => {
    const n = 4 + level * 2;
    const panes = Array.from({ length: n }, () => scene.add.rectangle(caster.x, caster.y, 34, 56, 0x9fe8ff, 0.8).setStrokeStyle(4, 0xffffff).setDepth(DEPTH));
    const c = { a: 0, r: 20 };
    await tw(scene, { targets: c, a: Math.PI * 2, r: 110, duration: 700 / s, ease: 'Sine.easeOut', onUpdate: () => {
      panes.forEach((p, i) => { const a = c.a + (i / n) * Math.PI * 2; p.setPosition(caster.x + Math.cos(a) * c.r, caster.y + Math.sin(a) * c.r * 0.6); p.setScale(Math.abs(Math.cos(a)) * 0.6 + 0.4, 1); });
    } });
    flash(scene, 0xffffff, 0.45, 260 / s);
    panes.forEach((p) => scene.tweens.add({ targets: p, alpha: 0, duration: 400 / s, onComplete: () => p.destroy() }));
    burst(scene, caster.x, caster.y, [0xffffff, 0x9fe8ff], 16, 160, 400 / s, 10);
    await wait(scene, 200 / s);
  },

  /** Ananas Orologio: quadrante gigante con lancette che girano, onde del tempo, rintocco. */
  fruit_clock: async ({ scene, caster, targets, level, speed: s }) => {
    const cx = GAME_WIDTH / 2, cy = 330;
    const face = scene.add.circle(cx, cy, 110, 0xfff3bf, 0.92).setStrokeStyle(12, 0xe09a12).setDepth(DEPTH);
    const ticks = Array.from({ length: 12 }, (_, i) => scene.add.rectangle(cx + Math.cos(i * Math.PI / 6) * 88, cy + Math.sin(i * Math.PI / 6) * 88, 10, 10, COLORS.ink).setDepth(DEPTH));
    const hourHand = scene.add.rectangle(cx, cy, 10, 60, COLORS.ink).setOrigin(0.5, 1).setDepth(DEPTH);
    const minHand = scene.add.rectangle(cx, cy, 8, 90, 0xe4342f).setOrigin(0.5, 1).setDepth(DEPTH);
    const tic = addTitle(scene, cx, cy + 150, 'TIC... TAC!', 40).setColor('#ffcf3a').setDepth(DEPTH);
    await Promise.all([tw(scene, { targets: minHand, angle: 720 + level * 360, duration: 600 / s, ease: 'Cubic.easeIn' }), tw(scene, { targets: hourHand, angle: 60 + level * 30, duration: 600 / s })]);
    flash(scene, 0xffcf3a, 0.35, 300 / s);
    for (let i = 0; i < level + 1; i++) void ring(scene, cx, cy, 0xffcf3a, 500, (500 + i * 150) / s, 8);
    [face, hourHand, minHand, tic, ...ticks].forEach((o) => scene.tweens.add({ targets: o, alpha: 0, duration: 300 / s, onComplete: () => o.destroy() }));
    await Promise.all(targets.map((t) => shoot(scene, hand(caster), { x: t.x, y: t.y }, 22, 0xffcf3a, [0xffcf3a, 0xffffff], 220 / s)));
    targets.forEach((t) => burst(scene, t.x, t.y, [0xffcf3a, 0xffffff, 0x3fb36a], 14, 140, 400 / s, 10));
    shake(scene, 160 / s, 0.01);
    await wait(scene, 200 / s);
  },

  /** Melagrana Magnete: archi magnetici rosso/blu, il nemico viene attirato e i pezzi di metallo volano via. */
  fruit_magnet: async ({ scene, caster, targets, level, speed: s }) => {
    for (const t of targets) {
      const g = scene.add.graphics().setDepth(DEPTH);
      for (let k = 0; k < 3 + level; k++) {
        const off = (k - 1.5) * 26;
        g.lineStyle(8, COLORS.ink).beginPath().arc((caster.x + t.x) / 2, (caster.y + t.y) / 2 + off, Math.abs(t.x - caster.x) / 2, Math.PI, 0).strokePath();
        g.lineStyle(4, k % 2 ? 0x5fa8ff : 0xe4342f).beginPath().arc((caster.x + t.x) / 2, (caster.y + t.y) / 2 + off, Math.abs(t.x - caster.x) / 2, Math.PI, 0).strokePath();
      }
      scene.tweens.add({ targets: g, alpha: { from: 1, to: 0 }, duration: 700 / s, ease: 'Stepped', easeParams: [5], onComplete: () => g.destroy() });
    }
    await Promise.all(targets.map((t) => tw(scene, { targets: t.root, x: t.root.x - 70, duration: 180 / s, yoyo: true, hold: 120 / s, ease: 'Back.easeIn' })));
    for (const t of targets) {
      for (let i = 0; i < 8 + level * 3; i++) {
        const p = sq(scene, t.x + R(-40, 40), t.y + R(-40, 40), 10, [0xdfe7f2, 0x7a8494][i % 2]);
        scene.tweens.add({ targets: p, x: caster.x + 40, y: caster.y, duration: R(260, 420) / s, ease: 'Quad.easeIn', onComplete: () => p.destroy() });
      }
      burst(scene, t.x, t.y, [0xe4342f, 0x5fa8ff], 12, 120, 380 / s, 10);
    }
    shake(scene, 200 / s, 0.012);
    await wait(scene, 300 / s);
  },

  // --- dalla 0.5.5 (fase 4) ---------------------------------------------------------------------
  /** Fragola Vampira: due canini rossi incrociati sul bersaglio, gocce rosse che tornano all'eroe. Lv III: notte rossa su tutti. */
  fruit_blood: async ({ scene, caster, targets, level, speed: s }) => {
    const red = [0xe02848, 0xff5f6d, 0x8a1030, 0xffd6de];
    await gather(scene, hand(caster).x, hand(caster).y, red, 10 + level * 5, 360 / s);
    if (level >= 3) flash(scene, 0x8a1030, 0.4, 500 / s);
    await Promise.all(targets.map(async (t, i) => {
      await wait(scene, (i * 90) / s);
      void slash(scene, t.x - 16, t.y, 150 + level * 20, 62, 0xe02848, 14 + level * 2, 120 / s);
      await slash(scene, t.x + 16, t.y, 150 + level * 20, 118, 0xfff7e6, 12 + level * 2, 120 / s);
      burst(scene, t.x, t.y, red, 12 + level * 4, 110 + level * 20, 420 / s, 12);
    }));
    shake(scene, 180 / s, 0.01 + level * 0.002);
    // il sangue torna all'eroe: cura
    await Promise.all(targets.flatMap((t) => Array.from({ length: 3 + level }, (_, k) => wait(scene, (k * 60) / s).then(() => shoot(scene, { x: t.x, y: t.y }, { x: caster.x, y: caster.y }, 10, 0xe02848, red, 360 / s, 80)))));
    void ring(scene, caster.x, caster.y, 0xff5f6d, 200, 400 / s);
  },

  /** Durian Tanfo: nube verde che rotola sui nemici e ci resta sopra a ristagnare. */
  fruit_stench: async ({ scene, caster, targets, level, speed: s }) => {
    const gas = [0x9bd03a, 0xc9c23a, 0x6f9a2a, 0xe8f0a0];
    const puffs: Phaser.GameObjects.Rectangle[] = [];
    for (let i = 0; i < 18 + level * 6; i++) {
      const t = targets[i % targets.length];
      const p = sq(scene, caster.x + R(-30, 30), caster.y + R(-30, 30), R(14, 24), gas[i % 4], 0.85);
      puffs.push(p);
      scene.tweens.add({ targets: p, x: t.x + R(-90, 90), y: t.y + R(-80, 40), duration: R(380, 620) / s, ease: 'Sine.easeOut', delay: (i * 14) / s });
    }
    if (level >= 3) flash(scene, 0x9bd03a, 0.3, 600 / s);
    await wait(scene, 680 / s);
    for (const t of targets) {
      for (let i = 0; i < 4 + level; i++) {
        // riccioli di puzza che salgono
        const x0 = t.x + R(-60, 60);
        for (let k = 0; k < 5; k++) {
          const p = sq(scene, x0 + Math.sin(k) * 10, t.top - k * 18, 8, 0x9bd03a);
          scene.tweens.add({ targets: p, y: p.y - 60, x: p.x + Math.sin(k + 1) * 14, alpha: 0, duration: 700 / s, delay: (i * 80 + k * 40) / s, onComplete: () => p.destroy() });
        }
      }
    }
    await tw(scene, { targets: puffs, alpha: 0, y: '-=40', duration: 600 / s });
    puffs.forEach((p) => p.destroy());
  },

  /** Limone Acido: spruzzo di acido ad arco, schizzi che colano. Lv III: pioggia acida dall'alto. */
  fruit_acid: async ({ scene, caster, targets, level, speed: s }) => {
    const acid = [0xd8f04a, 0xb6f04a, 0xf2e43a, 0xffffff];
    if (level >= 3) {
      flash(scene, 0xd8f04a, 0.28, 400 / s);
      await Promise.all(targets.flatMap((t) => Array.from({ length: 6 + level * 2 }, (_, k) => wait(scene, (k * 45) / s).then(() => shoot(scene, { x: t.x + R(-60, 60), y: t.top - 420 }, { x: t.x + R(-50, 50), y: t.y + R(-30, 40) }, 10, 0xd8f04a, acid, 280 / s)))));
    } else await Promise.all(targets.map((t) => shoot(scene, hand(caster), { x: t.x, y: t.y }, 22 + level * 6, 0xd8f04a, acid, 340 / s, 120)));
    for (const t of targets) {
      burst(scene, t.x, t.y, acid, 14 + level * 4, 130, 480 / s, 12, 90);
      for (let i = 0; i < 4 + level * 2; i++) {
        const d = sq(scene, t.x + R(-50, 50), t.y + R(-20, 30), 8, 0xb6f04a);
        scene.tweens.add({ targets: d, y: d.y + R(60, 120), alpha: 0, duration: R(500, 800) / s, ease: 'Quad.easeIn', onComplete: () => d.destroy() });
      }
    }
    shake(scene, 160 / s, 0.008 + level * 0.002);
    await wait(scene, 380 / s);
  },

  /** Arancia Bolla: bolle che partono dalla mano e si gonfiano attorno ai nemici. */
  fruit_bubble: async ({ scene, caster, targets, level, speed: s }) => {
    const bub = (x: number, y: number, r: number) => {
      const g = scene.add.graphics().setDepth(DEPTH);
      g.lineStyle(8, COLORS.ink, 0.6).strokeCircle(0, 0, r).lineStyle(5, 0xffd8a8, 1).strokeCircle(0, 0, r).fillStyle(0xffffff, 0.9).fillRect(-r * 0.5, -r * 0.55, 8, 6);
      return g.setPosition(x, y);
    };
    for (let i = 0; i < 6 + level * 3; i++) {
      const b = bub(hand(caster).x, hand(caster).y, R(10, 22));
      scene.tweens.add({ targets: b, x: b.x + R(-60, 160), y: b.y - R(80, 260), alpha: 0, duration: R(600, 1000) / s, onComplete: () => b.destroy() });
    }
    await Promise.all(targets.map(async (t, i) => {
      await wait(scene, (i * 80) / s);
      const b = bub(hand(caster).x, hand(caster).y, 26);
      await tw(scene, { targets: b, x: t.x, y: t.y, duration: 340 / s, ease: 'Sine.easeInOut' });
      await tw(scene, { targets: b, scale: 3.4 + level * 0.2, duration: 240 / s, ease: 'Back.easeOut' });
      scene.tweens.add({ targets: b, alpha: 0, duration: 260 / s, onComplete: () => b.destroy() });
    }));
    await wait(scene, 160 / s);
  },

  /** Anguria Mina: semi neri lanciati ad arco che si piantano ai piedi dei nemici e iniziano a lampeggiare. */
  fruit_mine: async ({ scene, caster, targets, level, speed: s }) => {
    await gather(scene, hand(caster).x, hand(caster).y, [0x3fae4a, 0xe4342f, 0x1f1633], 8 + level * 4, 320 / s);
    await Promise.all(targets.map(async (t, i) => {
      await wait(scene, (i * 110) / s);
      const feet = { x: t.x + 30, y: t.root.y - 6 };
      await shoot(scene, hand(caster), feet, 12, 0x1f1633, [0x3fae4a, 0x1f1633], 420 / s, 200);
      void ring(scene, feet.x, feet.y, 0xff3b30, 120, 360 / s, 6);
      burst(scene, feet.x, feet.y, [0x8a5232, 0x3fae4a], 8, 60, 300 / s, 8);
    }));
    await wait(scene, 200 / s);
  },

  /** Uva Sciame: acini che ronzano attorno all'eroe e poi si lanciano a sciame. */
  fruit_swarm: async ({ scene, caster, targets, level, speed: s }) => {
    const grape = [0x8a52e0, 0x6a34b8, 0xb07bff];
    const n = 8 + level * 4;
    const bees = Array.from({ length: n }, (_, i) => sq(scene, caster.x + Math.cos(i) * 90, caster.y + Math.sin(i) * 50, 10, grape[i % 3]));
    const spin = { a: 0 };
    await tw(scene, { targets: spin, a: Math.PI * 2, duration: 520 / s, onUpdate: () => bees.forEach((b, i) => b.setPosition(caster.x + Math.cos(spin.a * 2 + i) * (70 + (i % 3) * 20), caster.y - 40 + Math.sin(spin.a * 2 + i) * 40)) });
    await Promise.all(bees.map((b, i) => {
      const t = targets[i % targets.length];
      return tw(scene, { targets: b, x: t.x + R(-40, 40), y: t.y + R(-50, 50), duration: R(220, 380) / s, delay: (i * 18) / s, ease: 'Quad.easeIn' }).then(() => { burst(scene, b.x, b.y, grape, 4, 40, 260 / s, 8); b.destroy(); });
    }));
    shake(scene, 140 / s, 0.008);
  },

  /** Ciliegia Gemella: lampo rosa, la gemella compare e i due colpi si incrociano. */
  fruit_twin: async ({ scene, caster, targets, level, speed: s }) => {
    const cherry = [0xe8264a, 0xff8fa8, 0xffffff];
    flash(scene, 0xff8fa8, 0.3, 360 / s);
    void ring(scene, caster.x - 70, caster.y, 0xff8fa8, 240, 420 / s);
    void ring(scene, caster.x, caster.y, 0xe8264a, 240, 420 / s);
    await wait(scene, 240 / s);
    await Promise.all(targets.map(async (t, i) => {
      await wait(scene, (i * 80) / s);
      void slash(scene, t.x, t.y, 170 + level * 16, 45, 0xe8264a, 14 + level * 2, 110 / s);
      await wait(scene, 90 / s);
      await slash(scene, t.x, t.y, 170 + level * 16, 135, 0xff8fa8, 14 + level * 2, 110 / s);
      burst(scene, t.x, t.y, cherry, 12 + level * 4, 120, 400 / s, 12);
    }));
    shake(scene, 160 / s, 0.01);
  },
};

/** Riproduce l'animazione del potere del frutto. */
export async function playFruitFx(fruitId: string, ctx: FxCtx): Promise<void> {
  const fx = FX[fruitId];
  if (!fx || ctx.targets.length === 0) return;
  // ritmo più lento delle altre animazioni: è il momento clou del turno
  ctx = { ...ctx, speed: ctx.speed * 0.7 };
  // aura del frutto sotto l'eroe: si capisce subito chi usa il potere
  const col = hex(FRUIT_BY_ID.get(fruitId)?.color ?? '#ffffff');
  void ring(ctx.scene, ctx.caster.x, ctx.caster.y + 60, col, 200 + ctx.level * 40, 500 / ctx.speed, 8);
  if (ctx.level >= 4) await highLevelIntro(ctx, col);
  await fx(ctx);
}

/** Livelli IV-V: il potere "carica" lo schermo prima della coreografia del frutto. */
async function highLevelIntro({ scene, caster, level, speed: s }: FxCtx, col: number): Promise<void> {
  const fl = scene.add.rectangle(-400, -800, GAME_WIDTH + 800, 2880, col, 0.35).setOrigin(0).setDepth(DEPTH - 1);
  scene.tweens.add({ targets: fl, alpha: 0, duration: 420 / s, onComplete: () => fl.destroy() });
  for (let i = 0; i < level - 2; i++) void ring(scene, caster.x, caster.y, i % 2 ? 0xffcf3a : col, 420 + i * 90, (380 + i * 120) / s, 8);
  if (level >= 5) {
    for (let i = 0; i < 26; i++) {
      const p = scene.add.rectangle(R(0, GAME_WIDTH), R(-200, 300), 10, 10, i % 3 ? 0xffcf3a : 0xffffff).setDepth(DEPTH + 5);
      scene.tweens.add({ targets: p, y: p.y + R(500, 900), alpha: 0, duration: R(600, 900) / s, onComplete: () => p.destroy() });
    }
  }
  scene.cameras.main.shake(160 / s, 0.006 * (level - 2));
  await wait(scene, 260 / s);
}

/**
 * Animazione del Risveglio (ricompensa): il frutto si illumina e sale di livello.
 * Con `heroId` sotto al frutto compare l'eroe, che al lampo si trasforma nel nuovo aspetto.
 */
export async function awakenFx(scene: Phaser.Scene, fruitId: string, level: number, heroId?: HeroId): Promise<void> {
  const f = FRUIT_BY_ID.get(fruitId)!;
  const col = hex(f.color);
  const withHero = !!heroId;
  const cx = GAME_WIDTH / 2, cy = withHero ? 380 : 560, size = withHero ? 170 : 220;
  const shade = scene.add.rectangle(-400, -800, GAME_WIDTH + 800, 2880, COLORS.background, 0.85).setOrigin(0).setDepth(700).setInteractive();
  const ic = icon(scene, cx, cy, iconKey('fruitbig', fruitId), size).setDepth(702).setScale(0);
  const hero = heroId ? new HeroRig(scene, cx, 930, heroId, 0.78, { fruitId, level: level - 1 }).idle().setDepth(702).setAlpha(0) : undefined;
  if (hero) void tw(scene, { targets: hero, alpha: 1, duration: 300 });
  await tw(scene, { targets: ic, scale: size / 256, duration: 300, ease: 'Back.easeOut' });
  const pulses = level >= 4 ? 4 : 3;
  for (let i = 0; i < pulses; i++) {
    for (let k = 0; k < 14 + (level - 1) * 3; k++) {
      const a = Math.random() * Math.PI * 2, d = 220;
      const p = scene.add.rectangle(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 12, 12, k % 2 ? col : 0xffffff).setDepth(701);
      scene.tweens.add({ targets: p, x: cx, y: cy, duration: 400, ease: 'Quad.easeIn', onComplete: () => p.destroy() });
    }
    void tw(scene, { targets: ic, scale: (size / 256) * 1.12, duration: 120, yoyo: true, delay: 300 });
    await wait(scene, 420);
  }
  // raggio dal frutto all'eroe
  if (hero) {
    const beam = scene.add.rectangle(cx, cy, 40, 10, col, 0.85).setOrigin(0.5, 0).setDepth(701).setBlendMode(Phaser.BlendModes.ADD);
    await tw(scene, { targets: beam, height: 930 - cy - 180, duration: 180, ease: 'Quad.easeIn' });
    scene.tweens.add({ targets: beam, alpha: 0, scaleX: 3, duration: 300, onComplete: () => beam.destroy() });
  }
  const fl = scene.add.rectangle(-400, -800, GAME_WIDTH + 800, 2880, 0xffffff, 0.8).setOrigin(0).setDepth(703);
  scene.tweens.add({ targets: fl, alpha: 0, duration: 500, onComplete: () => fl.destroy() });
  for (let i = 0; i < 3; i++) {
    void ring(scene, cx, cy, col, 700, 700 + i * 200, 10, 701);
  }
  hero?.setLook({ fruitId, level }, true);
  scene.cameras.main.shake(250, 0.01);
  const a = fruitAbility(f, level);
  const tY = withHero ? 190 : cy - 210;
  const t1 = addTitle(scene, cx, tY, `RISVEGLIO ${ROMAN[level]}!`, 72).setColor(level >= 5 ? '#ffffff' : '#ffcf3a').setDepth(704);
  const t2 = addTitle(scene, cx, withHero ? 1000 : cy + 180, a.name, 44).setDepth(704);
  const t3 = addBody(scene, cx, withHero ? 1070 : cy + 250, `${a.cost}⚡ · ${a.description}`, 24, '#fbe9c8').setWordWrapWidth(600).setDepth(704);
  const t4 = level >= 5 && hero ? addBody(scene, cx, 1150, 'TRASFORMAZIONE COMPLETA!', 30, '#ffe14a').setDepth(704) : undefined;
  await wait(scene, hero ? 2600 : 1700);
  const all = [shade, ic, t1, t2, t3, ...(hero ? [hero] : []), ...(t4 ? [t4] : [])];
  await tw(scene, { targets: all, alpha: 0, duration: 300 });
  all.forEach((o) => o.destroy());
}

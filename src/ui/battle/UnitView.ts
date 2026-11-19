import Phaser from 'phaser';
import { TEXTURE_SCALE } from '../../app/config';
import { CREATURE_SCALE, CREATURES } from '../../pixel/creatures';
import { creatureKey, iconKey } from '../../pixel/keys';
import type { Unit } from '../../systems/combat/types';
import type { Intent } from '../../types/content';
import { HeroRig } from '../HeroRig';
import { addBody } from '../text';
import { HpBar, icon, steppedRect } from '../widgets';

/** Piccola esplosione a quadretti (solo grafica). */
function burstAt(scene: Phaser.Scene, x: number, y: number, color: number): void {
  for (let i = 0; i < 6; i++) {
    const p = scene.add.rectangle(x, y, 8, 8, i % 2 ? color : 0xffffff).setDepth(260);
    scene.tweens.add({ targets: p, x: x + Phaser.Math.Between(-40, 40), y: y + Phaser.Math.Between(-40, 40), alpha: 0, duration: 300, onComplete: () => p.destroy() });
  }
}

/** Rappresentazione grafica di un'unità in battaglia. */
export class UnitView {
  readonly root: Phaser.GameObjects.Container;
  readonly hp: HpBar;
  private readonly sprite: Phaser.GameObjects.Image | HeroRig;
  private readonly statusRow: Phaser.GameObjects.Container;
  private intentIcon?: Phaser.GameObjects.Container;
  private readonly nameText: Phaser.GameObjects.Text;
  // segni visibili degli stati dei nuovi frutti (0.5.5)
  private bubbleFx?: Phaser.GameObjects.Container;
  private mineFx?: Phaser.GameObjects.Image;
  private grapes?: Phaser.GameObjects.Container;
  private twin?: HeroRig;
  private heroId?: 'm' | 'f';
  readonly height: number;
  readonly width: number;
  private idleTween?: Phaser.Tweens.Tween;

  constructor(private readonly scene: Phaser.Scene, readonly unit: Unit, x: number, y: number, heroId?: 'm' | 'f', readonly k = 1) {
    this.root = scene.add.container(x, y);
    this.heroId = heroId;
    if (unit.kind === 'hero') {
      const rig = new HeroRig(scene, 0, 0, heroId!, 0.82 * k).idle();
      scene.children.remove(rig);
      this.sprite = rig;
      this.height = Math.round(270 * k);
      this.width = Math.round(170 * k);
    } else {
      const s = (CREATURE_SCALE[unit.defId] ?? 0.8) * k;
      const img = scene.add.image(0, 0, creatureKey(unit.defId)).setOrigin(0.5, 1).setScale(s / TEXTURE_SCALE);
      this.sprite = img;
      this.height = CREATURES[unit.defId].h * s;
      this.width = CREATURES[unit.defId].w * s;
      this.idleTween = scene.tweens.add({ targets: img, scaleY: (s / TEXTURE_SCALE) * 0.94, scaleX: (s / TEXTURE_SCALE) * 1.04, duration: 520 + (unit.order % 3) * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    const shadow = scene.add.rectangle(0, 4, Math.round(104 * k), 14, 0x1f1633, 0.35);
    this.root.add([shadow, this.sprite]);
    this.hp = new HpBar(scene, 0, 16, 130, 20);
    scene.children.remove(this.hp);
    this.statusRow = scene.add.container(0, 58);
    const name = addBody(scene, 0, -this.height - 20, unit.name, 20, '#fff7e6').setStroke('#1f1633', 5);
    name.setX(this.inScreen(name.width / 2));
    this.nameText = name;
    this.root.add([this.hp, this.statusRow, name]);
    this.refresh(false);
  }

  private has(id: string): number | undefined { return this.unit.hp > 0 ? this.unit.statuses.find((s) => s.id === id)?.value : undefined; }

  /** Bolla attorno al nemico, mina ai suoi piedi, acini attorno all'eroe, gemella al suo fianco. */
  private refreshMarks(): void {
    const sc = this.scene;
    // bolla
    const inBubble = this.has('bubble') !== undefined;
    if (inBubble && !this.bubbleFx) {
      const r = Math.max(this.width, this.height) * 0.62;
      const g = sc.add.graphics();
      g.fillStyle(0xffb45f, 0.18).fillCircle(0, 0, r);
      g.lineStyle(10, 0x1f1633, 0.5).strokeCircle(0, 0, r);
      g.lineStyle(6, 0xffd8a8, 0.95).strokeCircle(0, 0, r);
      g.fillStyle(0xffffff, 0.9).fillRect(-r * 0.55, -r * 0.6, 18, 10).fillRect(-r * 0.65, -r * 0.45, 10, 14);
      this.bubbleFx = sc.add.container(0, -this.height / 2, [g]);
      this.root.add(this.bubbleFx);
      this.bubbleFx.setScale(0.2);
      sc.tweens.add({ targets: this.bubbleFx, scale: 1, duration: 260, ease: 'Back.easeOut' });
      sc.tweens.add({ targets: this.bubbleFx, y: this.bubbleFx.y - 10, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 260 });
    } else if (!inBubble && this.bubbleFx) {
      const b = this.bubbleFx; this.bubbleFx = undefined;
      sc.tweens.killTweensOf(b);
      sc.tweens.add({ targets: b, scale: 1.4, alpha: 0, duration: 200, onComplete: () => b.destroy() });
    }
    // mina
    const mined = this.has('mine') !== undefined;
    if (mined && !this.mineFx) {
      this.mineFx = icon(sc, Math.min(70, this.width / 2), -10, iconKey('status', 'mine'), 46);
      this.root.add(this.mineFx);
      sc.tweens.add({ targets: this.mineFx, alpha: 0.55, duration: 260, yoyo: true, repeat: -1 });
    } else if (!mined && this.mineFx) { this.mineFx.destroy(); this.mineFx = undefined; }
    // tinta verde dell'acido (solo creature)
    if (!(this.sprite instanceof HeroRig)) {
      if (this.has('acid') !== undefined) this.sprite.setTint(0xeaffb0); else this.sprite.clearTint();
    }
    // acini dello sciame
    const n = Math.round(this.has('swarm') ?? 0);
    if (n > 0 && !this.grapes) {
      this.grapes = sc.add.container(0, -this.height * 0.55);
      this.root.add(this.grapes);
      const spin = { a: 0 };
      sc.tweens.add({ targets: spin, a: Math.PI * 2, duration: 2600, repeat: -1, onUpdate: () => {
        const list = this.grapes?.list as Phaser.GameObjects.Rectangle[] | undefined;
        list?.forEach((g, i) => { const t = spin.a + (i / list.length) * Math.PI * 2; g.setPosition(Math.cos(t) * 110, Math.sin(t) * 46 + Math.sin(t * 3) * 6); g.setDepth(Math.sin(t) > 0 ? 1 : -1); });
      } });
    }
    if (this.grapes) {
      while (this.grapes.length < n) this.grapes.add(sc.add.rectangle(0, 0, 18, 18, 0x8a52e0).setStrokeStyle(4, 0x1f1633));
      while (this.grapes.length > n) {
        const g = this.grapes.list[this.grapes.length - 1] as Phaser.GameObjects.Rectangle;
        this.grapes.remove(g);
        burstAt(sc, this.root.x + g.x, this.root.y + this.grapes.y + g.y, 0x8a52e0);
        g.destroy();
      }
    }
    // gemella
    const twin = this.has('twin') !== undefined && this.sprite instanceof HeroRig;
    if (twin && !this.twin) {
      const t = new HeroRig(sc, -78, -22, this.heroId ?? 'm', 0.82 * this.k).idle();
      sc.children.remove(t);
      t.setAlpha(0);
      this.root.addAt(t, 0);
      this.twin = t;
      sc.tweens.add({ targets: t, alpha: 0.62, duration: 260 });
    } else if (!twin && this.twin) {
      const t = this.twin; this.twin = undefined;
      sc.tweens.add({ targets: t, alpha: 0, duration: 260, onComplete: () => t.destroy() });
    }
  }

  /** La gemella scatta al posto dell'eroe. */
  async twinLunge(toward: { x: number; y: number }, speed: number): Promise<void> {
    const t = this.twin;
    if (!t) return;
    const dx = toward.x - this.root.x, dy = toward.y - this.root.y, d = Math.hypot(dx, dy) || 1;
    t.slash(speed);
    await new Promise<void>((r) => this.scene.tweens.add({ targets: t, x: t.x + (dx / d) * 110, y: t.y + (dy / d) * 110, duration: 130 / speed, yoyo: true, ease: 'Quad.easeOut', onComplete: () => r() }));
  }

  /** Gli acini partono verso il bersaglio e tornano (solo grafica). */
  flingGrapes(to: { x: number; y: number }, speed: number): void {
    if (!this.grapes) return;
    for (const [i, g] of (this.grapes.list as Phaser.GameObjects.Rectangle[]).entries()) {
      const p = this.scene.add.rectangle(this.root.x + g.x, this.root.y + this.grapes.y + g.y, 18, 18, 0x8a52e0).setStrokeStyle(4, 0x1f1633).setDepth(250);
      this.scene.tweens.add({ targets: p, x: to.x + Phaser.Math.Between(-30, 30), y: to.y + Phaser.Math.Between(-30, 30), delay: (i * 50) / speed, duration: 220 / speed, ease: 'Quad.easeIn', onComplete: () => { burstAt(this.scene, p.x, p.y, 0xc9a8ff); p.destroy(); } });
    }
  }

  /** Spostamento orizzontale perché un elemento largo 2·halfW non esca dallo schermo. */
  private inScreen(halfW: number): number {
    const x = this.root.x;
    return Phaser.Math.Clamp(x, 6 + halfW, 714 - halfW) - x;
  }

  /** I nomi dei nemici comuni compaiono solo sul bersaglio, per non affollare il campo. */
  showName(on: boolean): void { this.nameText.setVisible(on); }

  get x(): number { return this.root.x; }
  get topY(): number { return this.root.y - this.height; }
  get centerY(): number { return this.root.y - this.height / 2; }

  refresh(animate = true): void {
    this.refreshMarks();
    const u = this.unit;
    const shield = u.statuses.find((s) => s.id === 'shield')?.value ?? 0;
    this.hp.set(u.hp, u.maxHp, shield, animate);
    this.statusRow.removeAll(true);
    const shown = u.statuses.filter((s) => s.id !== 'shield');
    shown.forEach((s, i) => {
      const x = (i - (shown.length - 1) / 2) * 34;
      this.statusRow.add(icon(this.scene, x, 0, iconKey('status', s.id), 30));
      if (s.turns < 50 && s.id !== 'guard') this.statusRow.add(addBody(this.scene, x + 12, 10, String(s.turns), 16, '#ffffff').setStroke('#1f1633', 4));
    });
  }

  setIntent(intent: Intent | null, label = ''): void {
    this.intentIcon?.destroy();
    this.intentIcon = undefined;
    if (!intent || this.unit.hp <= 0) return;
    const c = this.scene.add.container(this.inScreen(64), -this.height - 62);
    const bubble = this.scene.add.graphics();
    steppedRect(bubble, -64, -28, 128, 56, 0x1f1633, 6);
    steppedRect(bubble, -60, -24, 120, 48, 0xf1d7a8, 4);
    bubble.fillStyle(0x1f1633, 1).fillRect(-8, 28, 16, 8).fillStyle(0xf1d7a8, 1).fillRect(-4, 24, 8, 8);
    c.add([bubble, icon(this.scene, -36, 0, iconKey('intent', intent), 40), addBody(this.scene, 14, 0, label, 16, '#4a2a14').setWordWrapWidth(80)]);
    this.root.add(c);
    this.intentIcon = c;
    this.scene.tweens.add({ targets: c, y: c.y - 6, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  async hit(speed: number): Promise<void> {
    if (this.sprite instanceof HeroRig) this.sprite.setExpression('closed', 'ouch');
    else this.sprite.setTexture(creatureKey(this.unit.defId, true));
    this.scene.tweens.add({ targets: this.root, x: this.root.x + (this.unit.side === 'ally' ? -14 : 14), duration: 50 / speed, yoyo: true, repeat: 2 });
    this.flash();
    await new Promise((r) => this.scene.time.delayedCall(260 / speed, r));
    if (this.unit.hp > 0) this.restoreFace();
  }

  restoreFace(): void {
    if (this.sprite instanceof HeroRig) this.sprite.setExpression('open', this.sprite.heroId === 'm' ? 'grin' : 'smirk');
    else this.sprite.setTexture(creatureKey(this.unit.defId));
  }

  flash(): void {
    const target = this.sprite instanceof HeroRig ? null : this.sprite;
    if (target) { target.setTintFill(0xffffff); this.scene.time.delayedCall(70, () => target.clearTint()); }
  }

  /** Scatto verso il bersaglio (in diagonale: il campo è disposto dall'alto a destra al basso a sinistra). */
  async lunge(toward: { x: number; y: number }, speed: number): Promise<void> {
    const dx = toward.x - this.root.x, dy = toward.y - this.root.y;
    const d = Math.hypot(dx, dy) || 1;
    if (this.sprite instanceof HeroRig) this.sprite.slash(speed);
    await new Promise<void>((r) => this.scene.tweens.add({ targets: this.root, x: this.root.x + (dx / d) * 70, y: this.root.y + (dy / d) * 70, duration: 120 / speed, yoyo: true, ease: 'Quad.easeOut', onComplete: () => r() }));
  }

  /** Entrata in campo: la squadra arriva di corsa da sinistra, i nemici cadono dall'alto. */
  enter(delay: number, speed: number): Promise<void> {
    const x = this.root.x, y = this.root.y;
    const ally = this.unit.side === 'ally';
    if (ally) this.root.setX(x - 520); else this.root.setY(y - 700).setAlpha(0);
    return new Promise((r) => this.scene.tweens.add({
      targets: this.root, x, y, alpha: 1, delay: delay / speed, duration: (ally ? 420 : 380) / speed,
      ease: ally ? 'Cubic.easeOut' : 'Bounce.easeOut', onComplete: () => r(),
    }));
  }

  /** Piccolo salto di gioia (vittoria). */
  hop(delay = 0): void {
    this.scene.tweens.add({ targets: this.root, y: this.root.y - 34, delay, duration: 170, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
  }

  /** Solo il fendente dell'eroe, senza scatto in avanti (poteri a distanza). */
  slashOnly(speed: number): void { if (this.sprite instanceof HeroRig) this.sprite.slash(speed); }

  cheer(): void { if (this.sprite instanceof HeroRig) this.sprite.cheer('happy', 'shout'); }
  fierce(): void { if (this.sprite instanceof HeroRig) this.sprite.setExpression('fierce', 'shout'); }

  async ko(speed: number): Promise<void> {
    this.intentIcon?.destroy();
    this.idleTween?.remove();
    if (this.unit.side === 'enemy') {
      // si dissolve in scintille a blocchi
      const cols = [0xffffff, 0xffcf3a, 0x9fe8ff];
      for (let i = 0; i < 14; i++) {
        const p = this.scene.add.rectangle(this.root.x + Phaser.Math.Between(-50, 50), this.centerY + Phaser.Math.Between(-40, 40), 10, 10, cols[i % 3]).setDepth(this.root.depth + 1);
        this.scene.tweens.add({ targets: p, x: p.x + Phaser.Math.Between(-90, 90), y: p.y - Phaser.Math.Between(40, 140), alpha: 0, angle: 90, duration: 520 / speed, ease: 'Quad.easeOut', onComplete: () => p.destroy() });
      }
      await new Promise<void>((r) => this.scene.tweens.add({ targets: this.root, scaleX: 1.4, scaleY: 0, alpha: 0, duration: 380 / speed, ease: 'Back.easeIn', onComplete: () => r() }));
      this.root.setVisible(false);
    } else {
      this.scene.tweens.add({ targets: this.sprite, angle: this.unit.side === 'ally' ? -80 : 80, alpha: 0.4, duration: 300 / speed });
    }
  }

  setTargeted(on: boolean): void {
    if (!(this.sprite instanceof HeroRig)) this.sprite.setAlpha(1);
    this.root.setData('targeted', on);
  }
}

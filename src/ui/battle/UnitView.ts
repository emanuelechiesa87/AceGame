import Phaser from 'phaser';
import { TEXTURE_SCALE } from '../../app/config';
import { CREATURE_SCALE, CREATURES } from '../../pixel/creatures';
import { creatureKey, iconKey } from '../../pixel/keys';
import type { Unit } from '../../systems/combat/types';
import type { Intent } from '../../types/content';
import { HeroRig } from '../HeroRig';
import { addBody } from '../text';
import { HpBar, icon, steppedRect } from '../widgets';

/** Rappresentazione grafica di un'unità in battaglia. */
export class UnitView {
  readonly root: Phaser.GameObjects.Container;
  readonly hp: HpBar;
  private readonly sprite: Phaser.GameObjects.Image | HeroRig;
  private readonly statusRow: Phaser.GameObjects.Container;
  private intentIcon?: Phaser.GameObjects.Container;
  private readonly nameText: Phaser.GameObjects.Text;
  readonly height: number;
  readonly width: number;
  private idleTween?: Phaser.Tweens.Tween;

  constructor(private readonly scene: Phaser.Scene, readonly unit: Unit, x: number, y: number, heroId?: 'm' | 'f', readonly k = 1) {
    this.root = scene.add.container(x, y);
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

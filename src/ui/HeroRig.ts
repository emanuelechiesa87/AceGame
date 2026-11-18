import Phaser from 'phaser';
import { TEXTURE_SCALE } from '../app/config';
import { PIVOTS, type Eyes, type HeroId, type Mouth } from '../art/heroes';
import { heroKey } from '../art/registry';
import { CANVAS } from '../art/svg';

/** Punto del disegno che coincide con l'origine del rig: i piedi. */
const FEET = { x: 120, y: 334 };

/**
 * Personaggio "a pezzi": ogni parte ruota attorno al proprio perno, così con
 * poche texture si ottengono respiro, camminata, battito di ciglia e reazioni.
 * Le animazioni sono solo cosmetiche: usano il random di Phaser, non l'Rng di gioco.
 */
export class HeroRig extends Phaser.GameObjects.Container {
  private readonly body_: Phaser.GameObjects.Container; // tutto tranne gambe, per il "rimbalzo"
  private readonly headGroup: Phaser.GameObjects.Container;
  private readonly parts: Record<string, Phaser.GameObjects.Image> = {};
  private readonly eyesImg: Phaser.GameObjects.Image;
  private readonly mouthImg: Phaser.GameObjects.Image;
  private loops: Phaser.Tweens.Tween[] = [];
  private blinkTimer?: Phaser.Time.TimerEvent;
  private baseEyes: Eyes;
  private baseMouth: Mouth;
  private busy = false;

  constructor(scene: Phaser.Scene, x: number, y: number, readonly heroId: HeroId, scale = 1) {
    super(scene, x, y);
    this.baseEyes = 'open';
    this.baseMouth = heroId === 'm' ? 'grin' : 'smirk';

    const img = (part: string, pivot: { x: number; y: number }, parentOffset = FEET) =>
      scene.add
        .image(pivot.x - parentOffset.x, pivot.y - parentOffset.y, heroKey(heroId, part))
        .setOrigin(pivot.x / CANVAS.w, pivot.y / CANVAS.h)
        .setScale(1 / TEXTURE_SCALE);

    this.parts.scarf = img('scarf', PIVOTS.scarfTail);
    this.parts.legB = img('legB', PIVOTS.legBack);
    this.parts.legF = img('legF', PIVOTS.legFront);
    this.parts.armB = img('armB', PIVOTS.armBack);
    this.parts.armF = img('armF', PIVOTS.armFront);
    this.parts.body = img('body', PIVOTS.head);

    this.headGroup = scene.add.container(PIVOTS.head.x - FEET.x, PIVOTS.head.y - FEET.y);
    const inHead = (key: string) =>
      scene.add.image(0, 0, heroKey(heroId, key)).setOrigin(PIVOTS.head.x / CANVAS.w, PIVOTS.head.y / CANVAS.h).setScale(1 / TEXTURE_SCALE);
    this.eyesImg = inHead(`eyes-${this.baseEyes}`);
    this.mouthImg = inHead(`mouth-${this.baseMouth}`);
    this.headGroup.add([inHead('head'), this.eyesImg, this.mouthImg]);

    this.body_ = scene.add.container(0, 0, [this.parts.scarf, this.parts.armB, this.parts.body, this.headGroup, this.parts.armF]);
    // ordine di disegno: dietro → davanti
    this.add([this.parts.legB, this.parts.legF, this.body_]);
    // l'ombra a terra rende il personaggio "appoggiato" allo sfondo
    const shadow = scene.add.ellipse(0, 2, 120, 22, 0x1f1633, 0.35);
    this.addAt(shadow, 0);

    this.setScale(scale);
    scene.add.existing(this);
    this.startBlinking();
    this.once(Phaser.GameObjects.Events.DESTROY, () => this.blinkTimer?.remove());
  }

  setExpression(eyes: Eyes, mouth: Mouth): this {
    this.eyesImg.setTexture(heroKey(this.heroId, `eyes-${eyes}`));
    this.mouthImg.setTexture(heroKey(this.heroId, `mouth-${mouth}`));
    return this;
  }

  setBaseExpression(eyes: Eyes, mouth: Mouth): this {
    this.baseEyes = eyes;
    this.baseMouth = mouth;
    return this.setExpression(eyes, mouth);
  }

  idle(): this {
    this.stopLoops();
    const t = this.scene.tweens;
    this.loops.push(
      t.add({ targets: this.body_, y: 4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
      t.add({ targets: this.headGroup, angle: { from: -2, to: 2 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
      t.add({ targets: this.parts.armF, angle: { from: -4, to: 6 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
      t.add({ targets: this.parts.armB, angle: { from: 4, to: -6 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
      t.add({ targets: this.parts.scarf, angle: { from: -6, to: 8 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
    );
    return this;
  }

  walk(stepMs = 300): this {
    this.stopLoops();
    const t = this.scene.tweens;
    const swing = (target: Phaser.GameObjects.Image, a: number, b: number) =>
      t.add({ targets: target, angle: { from: a, to: b }, duration: stepMs, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.loops.push(
      swing(this.parts.legF, -26, 26), swing(this.parts.legB, 26, -26),
      swing(this.parts.armF, 30, -30), swing(this.parts.armB, -30, 30),
      t.add({ targets: this.body_, y: -10, duration: stepMs / 2, yoyo: true, repeat: -1, ease: 'Quad.easeOut' }),
      t.add({ targets: this.headGroup, angle: { from: -3, to: 3 }, duration: stepMs, yoyo: true, repeat: -1 }),
      t.add({ targets: this.parts.scarf, angle: { from: -14, to: 10 }, duration: stepMs / 1.5, yoyo: true, repeat: -1 }),
    );
    return this;
  }

  /** Saltello con espressione: usato per selezione, vittoria, scoperte. */
  cheer(eyes: Eyes = 'happy', mouth: Mouth = 'shout'): this {
    if (this.busy) return this;
    this.busy = true;
    this.setExpression(eyes, mouth);
    const s = this.scaleX;
    this.scene.tweens.chain({
      targets: this,
      tweens: [
        { scaleY: s * 0.88, scaleX: s * 1.08, duration: 90, ease: 'Quad.easeOut' },
        { y: this.y - 70, scaleY: s * 1.08, scaleX: s * 0.94, duration: 220, ease: 'Quad.easeOut' },
        { y: this.y, scaleY: s, scaleX: s, duration: 260, ease: 'Bounce.easeOut' },
      ],
      onComplete: () => {
        this.scene.time.delayedCall(350, () => {
          this.setExpression(this.baseEyes, this.baseMouth);
          this.busy = false;
        });
      },
    });
    this.scene.tweens.add({ targets: this.parts.armF, angle: -150, duration: 200, yoyo: true, hold: 300 });
    return this;
  }

  private startBlinking(): void {
    const schedule = () => {
      this.blinkTimer = this.scene.time.delayedCall(Phaser.Math.Between(1800, 4200), () => {
        if (!this.busy && this.active) {
          this.eyesImg.setTexture(heroKey(this.heroId, 'eyes-closed'));
          this.scene.time.delayedCall(110, () => this.active && !this.busy && this.eyesImg.setTexture(heroKey(this.heroId, `eyes-${this.baseEyes}`)));
        }
        if (this.active) schedule();
      });
    };
    schedule();
  }

  private stopLoops(): void {
    this.loops.forEach((tw) => tw.remove());
    this.loops = [];
    for (const p of Object.values(this.parts)) p.setAngle(0);
    this.body_.setY(0);
    this.headGroup.setAngle(0);
  }
}

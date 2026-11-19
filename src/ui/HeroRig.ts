import Phaser from 'phaser';
import { FRUIT_LOOKS, lookKey, lookStage, type HeroLook } from '../data/fruitLooks';
import { HERO_PX, makeHeroTextures, PARTS, type PartSpec } from '../pixel/heroes';
import { makeMotifTexture } from '../pixel/heroLooks';
import { heroKey, type Eyes, type HeroId, type Mouth } from '../pixel/keys';

/**
 * Personaggio "a blocchi": ogni parte (testa cubica, busto, braccia, gambe) ruota attorno al proprio perno, così con
 * poche texture si ottengono respiro, camminata, battito di ciglia e reazioni.
 * Le animazioni sono solo cosmetiche: usano il random di Phaser, non l'Rng di gioco.
 */
export class HeroRig extends Phaser.GameObjects.Container {
  private readonly body_: Phaser.GameObjects.Container; // tutto tranne gambe, per il "rimbalzo"
  private readonly headGroup: Phaser.GameObjects.Container;
  private readonly parts: Record<string, Phaser.GameObjects.Image> = {};
  private readonly eyesImg: Phaser.GameObjects.Image;
  private readonly mouthImg: Phaser.GameObjects.Image;
  private readonly headImg: Phaser.GameObjects.Image;
  private readonly auraBack: Phaser.GameObjects.Container;
  private readonly auraFront: Phaser.GameObjects.Container;
  private auraTweens: Phaser.Tweens.Tween[] = [];
  private variant = '';
  private curEyes: Eyes = 'open';
  private curMouth: Mouth = 'grin';
  /** Aspetto del frutto attuale (null = aspetto base). */
  look: HeroLook | null = null;
  private loops: Phaser.Tweens.Tween[] = [];
  private blinkTimer?: Phaser.Time.TimerEvent;
  private baseEyes: Eyes;
  private baseMouth: Mouth;
  private busy = false;

  constructor(scene: Phaser.Scene, x: number, y: number, readonly heroId: HeroId, scale = 1, look?: HeroLook | null) {
    super(scene, x, y);
    this.baseEyes = 'open';
    this.baseMouth = heroId === 'm' ? 'grin' : 'smirk';
    this.curMouth = this.baseMouth;
    this.look = look && lookKey(look) ? { ...look } : null;
    this.variant = lookKey(this.look);
    makeHeroTextures(scene, heroId, this.look);

    // ogni parte è posizionata sul proprio perno (coordinate d'arte × HERO_PX, origine ai piedi)
    const img = (part: string, spec: PartSpec, rel = { x: 0, y: 0 }) =>
      scene.add
        .image((spec.pivot.x - rel.x) * HERO_PX, (spec.pivot.y - rel.y) * HERO_PX, heroKey(heroId, part, this.variant))
        .setOrigin((spec.pivot.x - spec.x0) / spec.w, (spec.pivot.y - spec.y0) / spec.h)
        .setScale(HERO_PX);

    this.parts.cape = img('cape', PARTS.cape);
    this.parts.scarf = img('tail', PARTS.tail);
    this.parts.legB = img('legB', PARTS.legB);
    this.parts.legF = img('legF', PARTS.legF);
    this.parts.armB = img('armB', PARTS.armB);
    this.parts.armF = img('armF', PARTS.armF);
    this.parts.body = img('body', PARTS.body);

    this.headGroup = scene.add.container(PARTS.head.pivot.x * HERO_PX, PARTS.head.pivot.y * HERO_PX);
    const inHead = (key: string) => img(key, PARTS.head, PARTS.head.pivot);
    this.eyesImg = inHead(`eyes-${this.baseEyes}`);
    this.mouthImg = inHead(`mouth-${this.baseMouth}`);
    this.headImg = inHead('head');
    this.headGroup.add([this.headImg, this.eyesImg, this.mouthImg]);

    this.body_ = scene.add.container(0, 0, [this.parts.cape, this.parts.scarf, this.parts.armB, this.parts.body, this.headGroup, this.parts.armF]);
    // ordine di disegno: dietro → davanti
    this.auraBack = scene.add.container(0, 0);
    this.auraFront = scene.add.container(0, 0);
    this.add([this.auraBack, this.parts.legB, this.parts.legF, this.body_, this.auraFront]);
    // ombra a terra squadrata (pixel art)
    const shadow = scene.add.rectangle(0, 2, 112, 14, 0x1f1633, 0.35);
    this.addAt(shadow, 0);
    this.buildAura();

    this.setScale(scale);
    scene.add.existing(this);
    this.startBlinking();
    this.once(Phaser.GameObjects.Events.DESTROY, () => { this.blinkTimer?.remove(); this.clearAura(); });
  }

  setExpression(eyes: Eyes, mouth: Mouth): this {
    this.curEyes = eyes; this.curMouth = mouth;
    this.eyesImg.setTexture(heroKey(this.heroId, `eyes-${eyes}`, this.variant));
    this.mouthImg.setTexture(heroKey(this.heroId, `mouth-${mouth}`, this.variant));
    return this;
  }

  /**
   * Cambia l'aspetto del frutto (Risveglio). Con `flash` c'è una piccola trasformazione:
   * lampo bianco, scintille del frutto e saltello.
   */
  setLook(look: HeroLook | null, flash = false): this {
    const next = look && lookKey(look) ? { ...look } : null;
    const v = lookKey(next);
    const apply = () => {
      this.look = next;
      this.variant = v;
      makeHeroTextures(this.scene, this.heroId, next);
      const map: Record<string, string> = { cape: 'cape', scarf: 'tail', legB: 'legB', legF: 'legF', armB: 'armB', armF: 'armF', body: 'body' };
      for (const [k, part] of Object.entries(map)) this.parts[k].setTexture(heroKey(this.heroId, part, v));
      this.headImg.setTexture(heroKey(this.heroId, 'head', v));
      this.setExpression(this.curEyes, this.curMouth);
      this.buildAura();
    };
    if (!flash || !this.scene) { apply(); return this; }
    const col = next ? Phaser.Display.Color.HexStringToColor(FRUIT_LOOKS[next.fruitId].main).color : 0xffffff;
    const t = this.scene.tweens;
    // il personaggio si illumina, cambia al culmine del lampo e si scrolla
    this.parts.body.setTintFill(0xffffff);
    const all = [...Object.values(this.parts), this.headImg, this.eyesImg, this.mouthImg];
    all.forEach((o) => o.setTintFill(0xffffff));
    const glow = this.scene.add.circle(0, -60 * HERO_PX * 0.5, 90 * HERO_PX * 0.5, col, 0.55).setBlendMode(Phaser.BlendModes.ADD);
    this.addAt(glow, 1);
    t.add({ targets: glow, scale: { from: 0.3, to: 1.6 }, alpha: { from: 0.8, to: 0 }, duration: 520, ease: 'Quad.easeOut', onComplete: () => glow.destroy() });
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const sp = this.scene.add.rectangle(0, -45 * HERO_PX, 4 * HERO_PX, 4 * HERO_PX, i % 2 ? col : 0xffffff);
      this.add(sp);
      t.add({ targets: sp, x: Math.cos(a) * 60 * HERO_PX, y: -45 * HERO_PX + Math.sin(a) * 50 * HERO_PX, alpha: 0, angle: 180, duration: 560, ease: 'Quad.easeOut', onComplete: () => sp.destroy() });
    }
    this.scene.time.delayedCall(170, () => {
      if (!this.active) return;
      apply();
      all.forEach((o) => o.clearTint());
      this.cheer('happy', 'shout');
    });
    return this;
  }

  // --- aura del frutto (IV-V) -----------------------------------------------------------

  private clearAura(): void {
    this.auraTweens.forEach((tw) => tw.remove());
    this.auraTweens = [];
    this.auraBack?.removeAll(true);
    this.auraFront?.removeAll(true);
  }

  private buildAura(): void {
    this.clearAura();
    const look = this.look;
    if (!look) return;
    const st = lookStage(look.level);
    if (!st.aura) return;
    const lk = FRUIT_LOOKS[look.fruitId];
    const sc = this.scene;
    const col = Phaser.Display.Color.HexStringToColor(lk.main).color;
    // bagliore a terra
    const ground = sc.add.ellipse(0, 0, 150, 34, col, st.aura === 2 ? 0.45 : 0.28).setBlendMode(Phaser.BlendModes.ADD);
    this.auraBack.add(ground);
    this.auraTweens.push(sc.tweens.add({ targets: ground, scaleX: 1.18, scaleY: 1.25, alpha: ground.alpha * 0.55, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
    if (st.aura === 2) {
      // alone attorno al corpo
      const halo = sc.add.ellipse(0, -46 * HERO_PX, 50 * HERO_PX, 88 * HERO_PX, col, 0.13).setBlendMode(Phaser.BlendModes.ADD);
      this.auraBack.add(halo);
      this.auraTweens.push(sc.tweens.add({ targets: halo, scale: 1.1, alpha: 0.04, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
    }
    const key = makeMotifTexture(sc, look.fruitId);
    const emit = (front: boolean) => sc.add.particles(0, 0, key, {
      x: { min: -32 * HERO_PX, max: 32 * HERO_PX },
      y: { min: -70 * HERO_PX, max: -4 * HERO_PX },
      speedY: { min: -26 * HERO_PX, max: -10 * HERO_PX },
      speedX: { min: -4 * HERO_PX, max: 4 * HERO_PX },
      rotate: { min: -30, max: 30 },
      lifespan: { min: 900, max: 1500 },
      scale: { start: HERO_PX * (front ? 0.85 : 0.75), end: HERO_PX * 0.25 },
      alpha: { start: 0.95, end: 0 },
      frequency: st.aura === 2 ? (front ? 260 : 120) : 300,
      quantity: 1,
    });
    this.auraBack.add(emit(false));
    if (st.aura === 2) this.auraFront.add(emit(true));
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
      t.add({ targets: this.parts.cape, angle: { from: -2, to: 5 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
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
      t.add({ targets: this.parts.cape, angle: { from: 4, to: 14 }, duration: stepMs, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
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

  /** Fendente di sciabola: braccio alzato e colpo in avanti, faccia grintosa. */
  slash(speed = 1): this {
    this.setExpression('fierce', 'shout');
    const arm = this.parts.armF;
    this.scene.tweens.chain({
      targets: arm,
      tweens: [
        { angle: -130, duration: 110 / speed, ease: 'Quad.easeOut' },
        { angle: 35, duration: 90 / speed, ease: 'Quad.easeIn' },
        { angle: 0, duration: 160 / speed, ease: 'Sine.easeOut' },
      ],
      onComplete: () => { if (this.active && !this.busy) this.setExpression(this.baseEyes, this.baseMouth); },
    });
    return this;
  }

  private startBlinking(): void {
    const schedule = () => {
      this.blinkTimer = this.scene.time.delayedCall(Phaser.Math.Between(1800, 4200), () => {
        if (!this.busy && this.active) {
          this.eyesImg.setTexture(heroKey(this.heroId, 'eyes-closed', this.variant));
          this.scene.time.delayedCall(110, () => this.active && !this.busy && this.eyesImg.setTexture(heroKey(this.heroId, `eyes-${this.baseEyes}`, this.variant)));
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

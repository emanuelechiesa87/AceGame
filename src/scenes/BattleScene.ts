import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../app/config';
import { CREATURES, CREATURE_SCALE } from '../pixel/creatures';
import type { NodeType } from '../data/areas';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { COMPANION_BY_ID } from '../data/companions';
import { ENEMY_BY_ID } from '../data/enemies';
import { FRUIT_BY_ID, fruitAbility, fruitOfAbility } from '../data/fruits';
import { playFruitFx, type FxUnit } from '../ui/fruitFx';
import { GameSession } from '../state/GameSession';
import { effectiveStats } from '../state/RunState';
import { Battle, makeCompanionUnit, makeEnemyUnit, makeHeroUnit } from '../systems/combat/Battle';
import type { BattleEvent, PlayerAction, Unit } from '../systems/combat/types';
import type { Ability, StatusId } from '../types/content';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { UnitView } from '../ui/battle/UnitView';
import { addBody, addTitle } from '../ui/text';
import { banner, floatText, steppedRect, wait } from '../ui/widgets';
import { BaseScene, visibleBounds } from './BaseScene';
import { allySpots, frameFor, placeEnemy, type BattleFrame, type Box } from './battleLayout';

const STATUS_NAME: Record<StatusId, string> = { burn: 'Bruciatura!', poison: 'Veleno!', stun: 'Congelato!', shield: 'Scudo', atkUp: 'Furia!', vulnerable: 'Vulnerabile!', guard: 'In guardia', evade: 'Nebbia!', defUp: 'Corazza!', slow: 'Appiccicato!', reflect: 'Specchio!' };

/**
 * Battaglia a turni. Il motore (Battle) decide tutto; la scena anima gli eventi
 * in sequenza, bloccando l'input durante la risoluzione. Toccare lo schermo
 * mentre le animazioni scorrono le accelera (animazioni saltabili).
 */
export class BattleScene extends BaseScene {
  private battle!: Battle;
  private views = new Map<string, UnitView>();
  private node: NodeType = 'battle';
  private busy = false;
  private speed = 1;
  private targetUid?: string;
  private powerTarget?: string;
  private reticle!: Phaser.GameObjects.Container;
  private actionPanel!: Phaser.GameObjects.Container;
  private energyPips!: Phaser.GameObjects.Container;
  private specialButtons = new Map<string, Phaser.GameObjects.Container>();
  private enemyIds: string[] = [];
  private log!: Phaser.GameObjects.Text;
  private frame!: BattleFrame;
  /** Telecamera dell'interfaccia: il pannello azioni resta fermo mentre la telecamera di gioco zooma sull'azione. */
  private uiCam!: Phaser.Cameras.Scene2D.Camera;
  private uiBuilding = false;
  private baseZoom = 1;

  constructor() {
    super('Battle');
  }

  create(data: { node: NodeType; wave?: boolean }): void {
    this.setupCamera();
    this.setupUiCamera();
    const vb = visibleBounds(this);
    this.frame = frameFor(vb.top, vb.bottom);
    const run = GameSession.run, ctl = GameSession.ctl;
    if (!run || !ctl) { this.scene.start('Menu'); return; }
    this.views.clear(); this.specialButtons.clear();
    this.busy = true; this.speed = GameSession.save.data.settings.fastAnimations ? 2 : 1; this.targetUid = undefined;
    this.node = data.node;

    new BiomeBackdrop(this, { groundTop: this.frame.groundTop, deck: true, tint: ctl.area.tint, theme: ctl.area.backdrop });
    this.fullRect(0x14233f, 0.15);

    // --- setup motore -----------------------------------------------------------
    const stats = effectiveStats(run);
    this.enemyIds = ctl.enemyGroup(this.node);
    const arts = run.artifactIds.map((id) => ARTIFACT_BY_ID.get(id)!);
    this.battle = new Battle(
      {
        hero: makeHeroUnit(run.heroName, stats, Math.min(run.currentHp, stats.maxHp)),
        companions: run.companions.map((c, i) => makeCompanionUnit(c.id, `c${i}`, c.hp, c.charge, ctl.companionScale)),
        enemies: this.enemyIds.map((id, i) => makeEnemyUnit(id, `e${i}`, ctl.enemyScale)),
        powers: run.activeFruitIds.slice(0, 1).map((id) => fruitAbility(FRUIT_BY_ID.get(id)!, ctl.fruitLevel)),
        potions: run.potions,
        mods: {
          powerDamageMult: arts.reduce((m, a) => m * (a.powerDamageMult ?? 1), 1),
          surviveLethalOnce: arts.some((a) => a.surviveLethalOncePerBattle),
          enemyScale: ctl.enemyScale,
        },
      },
      ctl.rng,
    );

    // --- unità ---------------------------------------------------------------------
    // squadra in basso a sinistra (posti fissi), nemici in alto a destra (posti calcolati per non sovrapporsi)
    const spots = allySpots(this.frame);
    this.battle.alive('ally').forEach((u, i) => this.addView(u, spots[i]));
    this.battle.enemies().forEach((u) => this.addView(u, this.enemySpot(u)));
    this.sortDepth();

    this.reticle = this.add.container(0, 0).setDepth(200).setVisible(false);

    // --- interfaccia ---------------------------------------------------------------
    this.uiWrap(() => {
      this.log = addBody(this, GAME_WIDTH / 2, this.frame.logY, '', 26, '#fff7e6').setStroke('#1f1633', 6).setDepth(300);
      this.buildActionPanel();
    });
    const title = this.node === 'boss' ? 'BOSS!' : this.node === 'elite' ? 'ÉLITE!' : 'BATTAGLIA!';
    this.input.on('pointerdown', () => { if (this.busy) this.speed = Math.max(this.speed, 3); });

    // l'onda defluisce mentre la squadra entra di corsa e i nemici cadono in campo
    const s = this.speed;
    const entrances = [...this.views.values()].map((v, i) => v.enter(v.unit.side === 'ally' ? 80 + i * 70 : 260 + i * 90, s));
    void this.revealIfWave(data);
    void Promise.all(entrances).then(async () => {
      await banner(this, this.bannerY, title, this.node === 'battle' ? 0x1f6fb2 : COLORS.hot, 72, 500 / s);
      await this.play(this.battle.start());
      this.afterResolve();
    });
  }

  /** Altezza dei banner: a metà tra nemici e squadra. */
  private get bannerY(): number { return Math.round(this.frame.panelTop - 360); }

  protected override uiWrap<T>(fn: () => T): T {
    const prev = this.uiBuilding;
    this.uiBuilding = true;
    try { return fn(); } finally { this.uiBuilding = prev; }
  }

  private setupUiCamera(): void {
    const main = this.cameras.main;
    this.uiCam = this.cameras.add(0, 0, this.scale.gameSize.width, this.scale.gameSize.height);
    const sync = () => {
      const { width, height } = this.scale.gameSize;
      this.baseZoom = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT);
      this.uiCam.setSize(width, height).setZoom(this.baseZoom).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    };
    sync();
    const onAdd = (go: Phaser.GameObjects.GameObject) => { if (this.uiBuilding) main.ignore(go); else this.uiCam.ignore(go); };
    this.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, onAdd);
    this.scale.on(Phaser.Scale.Events.RESIZE, sync);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, onAdd);
      this.scale.off(Phaser.Scale.Events.RESIZE, sync);
    });
  }

  /** Zoom breve della telecamera di gioco sul punto dell'azione (l'interfaccia resta ferma). */
  private actionCam(x: number, y: number, zoom: number, ms: number): void {
    const cam = this.cameras.main;
    const cx = GAME_WIDTH / 2 + (x - GAME_WIDTH / 2) * 0.45, cy = GAME_HEIGHT / 2 + (y - GAME_HEIGHT / 2) * 0.35;
    cam.zoomTo(this.baseZoom * zoom, ms * 0.4, 'Sine.easeOut', true);
    cam.pan(cx, cy, ms * 0.4, 'Sine.easeOut', true);
    this.time.delayedCall(ms * 0.6, () => {
      cam.zoomTo(this.baseZoom, ms * 0.4, 'Sine.easeInOut', true);
      cam.pan(GAME_WIDTH / 2, GAME_HEIGHT / 2, ms * 0.4, 'Sine.easeInOut', true);
    });
  }

  private sortDepth(): void {
    // ordine di profondità: chi è più in basso sta davanti
    [...this.views.values()].sort((a, b) => a.root.y - b.root.y).forEach((v, i) => v.root.setDepth(10 + i));
  }

  private enemySize(u: Unit): { w: number; h: number; k: number } {
    const k = ENEMY_BY_ID.get(u.defId)!.tier === 'normal' ? this.frame.enemyK : this.frame.bigEnemyK;
    const sc = (CREATURE_SCALE[u.defId] ?? 0.8) * k;
    return { w: CREATURES[u.defId].w * sc, h: CREATURES[u.defId].h * sc, k };
  }

  /** Posto libero per un nemico (anche evocato): evita la squadra e chi è già in campo. */
  private enemySpot(u: Unit): { x: number; y: number; k: number } {
    const occupied: Box[] = [...this.views.values()].filter((v) => v.unit.hp > 0).map((v) => ({ x0: v.x - Math.max(v.width / 2, 66), y0: v.topY - (v.unit.side === 'enemy' ? 96 : 26), x1: v.x + Math.max(v.width / 2, 66), y1: v.root.y + 42 }));
    const sz = this.enemySize(u);
    const first = ![...this.views.values()].some((v) => v.unit.side === 'enemy');
    return { ...placeEnemy(this.frame, sz, occupied, first), k: sz.k };
  }

  private addView(u: Unit, slot: { x: number; y: number; k: number }): UnitView {
    const run = GameSession.run!;
    const v = new UnitView(this, u, slot.x, slot.y, run.avatar === 'a' ? 'm' : 'f', slot.k);
    this.views.set(u.uid, v);
    if (u.side === 'enemy') {
      const hw = Math.max(80, v.width / 2);
      v.root.setSize(hw * 2, v.height + 40).setInteractive(new Phaser.Geom.Rectangle(-hw, -v.height - 20, hw * 2, v.height + 60), Phaser.Geom.Rectangle.Contains);
      v.root.on('pointerup', () => { if (u.hp > 0) this.setTarget(u.uid); });
      if (ENEMY_BY_ID.get(u.defId)!.tier === 'normal') v.showName(false);
      const mv = this.battle.moveOf(u);
      v.setIntent(mv.intent ?? 'attack', mv.name);
    }
    return v;
  }

  // --- pannello azioni ------------------------------------------------------------------
  private buildActionPanel(): void {
    const top = this.frame.panelTop;
    this.add.rectangle(-400, top - 20, 1520, 1200, 0x3a2414, 0.97).setOrigin(0).setDepth(250);
    this.add.rectangle(-400, top - 28, 1520, 12, 0xa9693c, 1).setOrigin(0).setDepth(250).setStrokeStyle(4, COLORS.ink);
    this.actionPanel = this.add.container(0, 0).setDepth(260);
    this.energyPips = this.add.container(0, 0).setDepth(261);
    addBody(this, 40, top + 14, 'ENERGIA', 20, '#ffcf3a').setOrigin(0, 0.5).setDepth(261);

    const mk = (x: number, y: number, label: string, act: () => void, opts = {}) => {
      const b = new Button(this, x, y, label, () => this.onAction(act), { width: 300, height: 104, fontSize: 46, ...opts });
      this.actionPanel.add(b);
      return b;
    };
    mk(185, top + 110, 'ATTACCO', () => this.submit({ type: 'attack', targetUid: this.currentTarget()! }));
    const pw = this.battle.powers[0];
    const powerBtn = mk(530, top + 110, pw ? `POTERE ${pw.cost}⚡` : 'POTERE', () => this.usePower(), { variant: 'danger', fontSize: 42 });
    powerBtn.setName('power');
    mk(185, top + 236, 'DIFESA', () => this.submit({ type: 'guard' }), { variant: 'secondary' });
    const potion = mk(530, top + 236, `POZIONE ×${this.battle.potions}`, () => this.submit({ type: 'potion' }), { variant: 'secondary', fontSize: 38 });
    potion.setName('potion');

    // speciali dei compagni: piccoli pulsanti tondi con anello di carica
    this.battle.alive('ally').filter((u) => u.kind === 'companion').forEach((u, i) => {
      const c = this.add.container(470 + i * 86, top + 14).setDepth(262);
      this.specialButtons.set(u.uid, c);
      c.setSize(80, 64).setInteractive({ useHandCursor: true }).on('pointerup', () => this.onAction(() => this.useSpecial(u)));
      this.drawSpecial(u);
    });
    this.updateHud();
  }

  private drawSpecial(u: Unit): void { this.uiWrap(() => this.drawSpecialInner(u)); }

  private drawSpecialInner(u: Unit): void {
    const c = this.specialButtons.get(u.uid);
    if (!c) return;
    c.removeAll(true);
    const ready = this.battle.canSpecial(u);
    const g = this.add.graphics();
    steppedRect(g, -34, -32, 68, 64, COLORS.ink, 6);
    steppedRect(g, -30, -28, 60, 56, ready ? COLORS.accent : 0x6b3a1e, 4);
    // carica: tacche a blocchi sotto il nome
    for (let i = 0; i < u.chargeMax; i++) g.fillStyle(i < u.charge ? 0xffffff : 0x3a2414, 1).fillRect(-24 + i * (48 / u.chargeMax) + 2, 16, 48 / u.chargeMax - 4, 8);
    c.add([g, addBody(this, 0, 0, u.hp > 0 ? u.name.slice(0, 4).toUpperCase() : 'KO', 15, ready ? '#1f1633' : '#f1d7a8').setY(-6)]);
    if (ready) { c.add(addTitle(this, 22, -24, '!', 30).setColor('#ff5f6d')); this.tweens.add({ targets: c, scale: 1.1, duration: 300, yoyo: true, repeat: 1 }); }
  }

  private updateHud(): void { this.uiWrap(() => this.updateHudInner()); }

  private updateHudInner(): void {
    this.energyPips.removeAll(true);
    for (let i = 0; i < 5; i++) {
      const g = this.add.graphics();
      const on = i < this.battle.energy;
      const py = this.frame.panelTop - 3;
      g.fillStyle(COLORS.ink, 1).fillRect(133 + i * 44, py, 34, 34);
      g.fillStyle(on ? 0xffcf3a : 0x4a2a14, 1).fillRect(137 + i * 44, py + 4, 26, 26);
      if (on) g.fillStyle(0xffffff, 0.7).fillRect(141 + i * 44, py + 8, 8, 8);
      this.energyPips.add(g);
    }
    const potion = this.actionPanel.getByName('potion') as Button | null;
    if (potion) {
      (potion.list[1] as Phaser.GameObjects.Text).setText(`POZIONE ×${this.battle.potions}`);
      potion.setEnabled(this.battle.potions > 0 && this.battle.hero.hp < this.battle.hero.maxHp);
    }
    const power = this.actionPanel.getByName('power') as Button | null;
    const pw = this.battle.powers[0];
    if (power && pw) power.setAlpha(this.battle.energy >= (pw.cost ?? 0) ? 1 : 0.6);
    for (const u of this.battle.units) if (u.kind === 'companion') this.drawSpecial(u);
  }

  private setInputEnabled(on: boolean): void {
    this.actionPanel.setAlpha(on ? 1 : 0.55);
    this.reticle.setVisible(on && !!this.currentTarget());
  }

  private currentTarget(): string | undefined {
    const alive = this.battle.enemies();
    if (!this.targetUid || !alive.some((e) => e.uid === this.targetUid)) this.targetUid = alive[0]?.uid;
    return this.targetUid;
  }

  private setTarget(uid: string): void {
    this.targetUid = uid;
    this.placeReticle();
  }

  private placeReticle(): void {
    const t = this.currentTarget();
    const v = t ? this.views.get(t) : undefined;
    for (const o of this.views.values()) if (o.unit.side === 'enemy' && ENEMY_BY_ID.get(o.unit.defId)!.tier === 'normal') o.showName(o === v);
    if (!v) { this.reticle.setVisible(false); return; }
    // mirino a quattro angoli attorno al bersaglio
    this.reticle.removeAll(true);
    const hw = Math.max(56, v.width / 2 + 10), top = -v.height - 12, bot = 12, L = 26, T = 8;
    const g = this.add.graphics();
    for (const [sx, sy, y] of [[-1, 1, top], [1, 1, top], [-1, -1, bot], [1, -1, bot]] as const) {
      const x = sx * hw;
      g.fillStyle(COLORS.ink, 1).fillRect(Math.min(x, x - sx * L) - 3, y - (sy < 0 ? T : 0) - 3, L + 6, T + 6).fillRect(x - (sx > 0 ? T : 0) - 3, Math.min(y, y + sy * L) - 3, T + 6, L + 6);
      g.fillStyle(COLORS.hot, 1).fillRect(Math.min(x, x - sx * L), y - (sy < 0 ? T : 0), L, T).fillRect(x - (sx > 0 ? T : 0), Math.min(y, y + sy * L), T, L);
    }
    this.reticle.add(g);
    this.tweens.killTweensOf(this.reticle);
    this.reticle.setScale(1);
    this.tweens.add({ targets: this.reticle, scale: 1.06, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.reticle.setPosition(v.x, v.root.y).setVisible(!this.busy);
  }

  private onAction(fn: () => void): void {
    if (this.busy || this.battle.phase !== 'awaitingInput') return;
    fn();
  }

  /** Un solo frutto per run: il pulsante POTERE lo usa subito sul bersaglio. */
  private usePower(): void {
    const a = this.battle.powers[0];
    if (!a) { this.log.setText('Nessun frutto attivo.'); return; }
    if (!this.battle.canUsePower(a)) {
      this.log.setText(`${a.name}: servono ${a.cost}⚡ (ne hai ${this.battle.energy}). DIFESA ricarica +1⚡`);
      this.tweens.add({ targets: this.energyPips, x: 8, duration: 50, yoyo: true, repeat: 3 });
      return;
    }
    this.powerTarget = this.currentTarget();
    this.submit({ type: 'power', abilityId: a.id, targetUid: this.powerTarget });
  }

  /** Bersagli grafici dell'animazione del potere, secondo la regola di mira. */
  private fxTargets(a: Ability): FxUnit[] {
    const toFx = (v?: UnitView): FxUnit | undefined => (v ? { x: v.x, y: v.centerY, top: v.topY, root: v.root } : undefined);
    const alive = (side: 'ally' | 'enemy') => this.battle.alive(side).map((u) => toFx(this.views.get(u.uid))).filter((x): x is FxUnit => !!x);
    switch (a.target) {
      case 'allEnemies': return alive('enemy');
      case 'allAllies': return alive('ally');
      case 'self': case 'lowestAlly': return [toFx(this.views.get('hero'))!].filter(Boolean);
      default: return [toFx(this.views.get(this.powerTarget ?? this.currentTarget() ?? '')) ?? alive('enemy')[0]].filter(Boolean);
    }
  }

  private useSpecial(u: Unit): void {
    if (!this.battle.canSpecial(u)) {
      const d = COMPANION_BY_ID.get(u.defId)!;
      this.log.setText(u.hp > 0 ? `${d.special.name}: carica ${u.charge}/${u.chargeMax} (si carica quando ${d.name} agisce)` : `${d.name} è KO`);
      return;
    }
    void this.run({ type: 'special', companionUid: u.uid, targetUid: this.currentTarget() });
  }

  private submit(a: PlayerAction): void {
    void this.run(a);
  }

  private async run(a: PlayerAction): Promise<void> {
    this.busy = true;
    this.speed = GameSession.save.data.settings.fastAnimations ? 2 : 1;
    this.setInputEnabled(false);
    const ev = this.battle.act(a);
    await this.play(ev);
    this.afterResolve();
  }

  private afterResolve(): void {
    if (this.battle.phase === 'victory') { void this.onVictory(); return; }
    if (this.battle.phase === 'defeat') { void this.onDefeat(); return; }
    this.busy = false;
    this.speed = GameSession.save.data.settings.fastAnimations ? 2 : 1;
    this.updateHud();
    this.setInputEnabled(true);
    this.placeReticle();
    this.log.setText(this.battle.powers[0] ? `Potere: ${this.battle.powers[0].name} (${this.battle.powers[0].cost}⚡)` : 'Tocca un nemico per mirare · scegli un\'azione');
    this.views.get('hero')?.fierce();
  }

  // --- animazione degli eventi -------------------------------------------------------------
  private async play(events: BattleEvent[]): Promise<void> {
    let lastUser: string | undefined;
    for (let idx = 0; idx < events.length; idx++) {
      const e = events[idx];
      const s = this.speed;
      switch (e.t) {
        case 'round': if (e.n > 1) this.log.setText(`Round ${e.n}`); break;
        case 'turn': lastUser = e.uid; break;
        case 'use': {
          const v = this.views.get(e.uid);
          const who = this.battle.unit(e.uid)!;
          this.log.setText(`${who.name}: ${e.name}`);
          if (e.isPower || e.isSpecial) {
            if (v) this.actionCam(v.x, v.centerY, 1.1, 700 / s);
            this.cameras.main.shake(160 / s, 0.006);
            await banner(this, this.bannerY, e.name.toUpperCase() + '!', e.isPower ? COLORS.hot : 0x1f6fb2, 56, 380 / s);
          }
          const fruit = e.isPower ? fruitOfAbility(e.ability) : undefined;
          const power = fruit ? this.battle.powers.find((p) => p.id === e.ability) : undefined;
          if (fruit && power && v) {
            if (power.target === 'enemy' || power.target === 'allEnemies') v.slashOnly(s);
            await playFruitFx(fruit.id, { scene: this, caster: { x: v.x, y: v.centerY, top: v.topY, root: v.root }, targets: this.fxTargets(power), level: GameSession.ctl?.fruitLevel ?? 1, speed: s });
          } else if (v && e.ability !== 'guard' && e.ability !== 'potion') {
            // scatto verso il primo bersaglio colpito da questa azione
            const next = events.slice(idx + 1).find((x) => x.t === 'damage' && x.source === e.uid) as Extract<BattleEvent, { t: 'damage' }> | undefined;
            const tv = next ? this.views.get(next.target) : undefined;
            const toward = tv ? { x: tv.x, y: tv.root.y } : who.side === 'ally' ? { x: 520, y: this.frame.panelTop - 360 } : { x: 220, y: this.frame.panelTop - 80 };
            if (who.kind === 'hero' || (tv && Phaser.Math.RND.frac() < 0.35)) this.actionCam((v.x + toward.x) / 2, (v.centerY + (tv?.centerY ?? toward.y)) / 2, 1.05, 420 / s);
            await v.lunge(toward, s);
          }
          if (e.ability === 'guard' && v) floatText(this, v.x, v.centerY, 'GUARDIA', '#9cc8ff', 34, s);
          lastUser = e.uid;
          break;
        }
        case 'damage': {
          const v = this.views.get(e.target);
          if (!v) break;
          v.refresh();
          if (e.absorbed > 0) floatText(this, v.x + 40, v.centerY - 30, `-${e.absorbed}🛡`, '#9cc8ff', 30, s);
          const col = e.kind === 'burn' ? '#ff8a3d' : e.kind === 'poison' ? '#9be06a' : e.kind === 'reflect' ? '#9fe8ff' : e.crit ? '#ffe14a' : '#ffffff';
          if (e.amount > 0 || e.absorbed === 0) floatText(this, v.x, v.centerY, `${e.crit ? 'CRIT! ' : ''}${e.amount}`, col, e.crit ? 60 : 50, s);
          if (e.amount > 0) { if (e.crit) this.cameras.main.shake(120 / s, 0.01); await v.hit(s); }
          else await wait(this, 160 / s);
          break;
        }
        case 'heal': { const v = this.views.get(e.target); if (v) { v.refresh(); floatText(this, v.x, v.centerY, `+${e.amount}`, '#6fe08a', 46, s); await wait(this, 200 / s); } break; }
        case 'shield': { const v = this.views.get(e.target); if (v) { v.refresh(); floatText(this, v.x, v.centerY - 20, `+${e.amount} scudo`, '#9cc8ff', 32, s); await wait(this, 120 / s); } break; }
        case 'status': { const v = this.views.get(e.target); if (v) { v.refresh(); if (e.status !== 'guard') floatText(this, v.x, v.topY, STATUS_NAME[e.status], '#d6a8ff', 32, s); await wait(this, 150 / s); } break; }
        case 'dodge': { const v = this.views.get(e.target); if (v) { floatText(this, v.x, v.centerY, 'SCHIVATO!', '#e8f0fb', 38, s); await wait(this, 220 / s); } break; }
        case 'steal': { const a = this.views.get(e.source), t = this.views.get(e.target); t?.refresh(); a?.refresh(); if (t) floatText(this, t.x, t.topY, `-${e.amount} scudo rubato!`, '#9cc8ff', 30, s); await wait(this, 200 / s); break; }
        case 'extraAction': await banner(this, this.bannerY, 'ANCORA UN TURNO!', 0xffcf3a, 52, 380 / s); break;
        case 'resist': { const v = this.views.get(e.target); if (v) floatText(this, v.x, v.topY, 'Resiste!', '#f1d7a8', 30, s); break; }
        case 'cleanse': { const v = this.views.get(e.target); if (v) v.refresh(); break; }
        case 'stunned': { const v = this.views.get(e.uid); if (v) { v.refresh(); floatText(this, v.x, v.topY, 'CONGELATO!', '#bff4ff', 38, s); await wait(this, 400 / s); } break; }
        case 'ko': { const v = this.views.get(e.uid); if (v) { floatText(this, v.x, v.topY, 'KO!', '#ff5f6d', 56, s); await v.ko(s); } this.placeReticle(); break; }
        case 'survive': await banner(this, this.bannerY, 'FILO DEL DESTINO!', 0xff5f8a, 50, 500 / s); this.views.get(e.uid)?.refresh(); break;
        case 'summon': {
          const v = this.addView(e.unit, this.enemySpot(e.unit));
          this.sortDepth();
          v.root.setScale(0);
          this.enemyIds.push(e.unit.defId);
          this.tweens.add({ targets: v.root, scale: 1, duration: 300 / s, ease: 'Back.easeOut' });
          await wait(this, 300 / s);
          break;
        }
        case 'enrage': this.cameras.main.shake(400 / s, 0.012); await banner(this, this.bannerY, `${this.battle.unit(e.uid)!.name.toUpperCase()} SI ARRABBIA!`, COLORS.hot, 46, 600 / s); break;
        case 'intent': { const u = this.battle.unit(e.uid); const v = this.views.get(e.uid); if (u && v) v.setIntent(e.intent, ENEMY_BY_ID.get(u.defId)!.moves[e.move].name); break; }
        case 'energy': case 'charge': this.updateHud(); break;
        case 'end': break;
      }
    }
    void lastUser;
    for (const v of this.views.values()) v.refresh(false);
  }

  // --- fine battaglia --------------------------------------------------------------------------
  private async onVictory(): Promise<void> {
    const ctl = GameSession.ctl!;
    this.log.setText('');
    this.views.get('hero')?.cheer();
    [...this.views.values()].filter((v) => v.unit.side === 'ally' && v.unit.hp > 0).forEach((v, i) => v.hop(i * 90));
    this.actionCam(this.views.get('hero')?.x ?? 240, this.views.get('hero')?.centerY ?? 700, 1.08, 1100);
    await banner(this, this.bannerY, 'VITTORIA!', 0xffcf3a, 90, 900);
    const comps = this.battle.units.filter((u) => u.kind === 'companion').map((u) => ({ id: u.defId, hp: u.hp, charge: u.charge }));
    ctl.run.potions = this.battle.potions;
    ctl.run.heroKos += 0;
    ctl.onVictory(this.enemyIds, this.battle.hero.hp, comps);
    if (this.node === 'boss') ctl.onAreaCleared();
    GameSession.persistRun();
    this.goTo('Reward', { node: this.node, mode: 'battle' }, 'wave');
  }

  private async onDefeat(): Promise<void> {
    this.log.setText('');
    await banner(this, this.bannerY, 'SCONFITTA...', 0x4a3a33, 80, 1100);
    GameSession.run!.currentHp = 0;
    GameSession.run!.potions = this.battle.potions;
    this.goTo('Summary', { result: 'defeat' });
  }
}

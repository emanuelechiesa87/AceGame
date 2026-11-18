import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../app/config';
import { iconKey } from '../art/registry';
import type { NodeType } from '../data/areas';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { COMPANION_BY_ID } from '../data/companions';
import { ENEMY_BY_ID } from '../data/enemies';
import { FRUIT_BY_ID } from '../data/fruits';
import { GameSession } from '../state/GameSession';
import { effectiveStats } from '../state/RunState';
import { Battle, makeCompanionUnit, makeEnemyUnit, makeHeroUnit } from '../systems/combat/Battle';
import type { BattleEvent, PlayerAction, Unit } from '../systems/combat/types';
import type { Ability, StatusId } from '../types/content';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { UnitView } from '../ui/battle/UnitView';
import { modal } from '../ui/Offers';
import { addBody, addTitle } from '../ui/text';
import { banner, floatText, icon, panel, wait } from '../ui/widgets';
import { BaseScene } from './BaseScene';

const ALLY_SLOTS = [{ x: 220, y: 760 }, { x: 80, y: 680 }, { x: 330, y: 610 }, { x: 110, y: 540 }];
const ENEMY_SLOTS = [{ x: 540, y: 760 }, { x: 640, y: 620 }, { x: 430, y: 600 }, { x: 600, y: 500 }];
const STATUS_NAME: Record<StatusId, string> = { burn: 'Bruciatura!', poison: 'Veleno!', stun: 'Congelato!', shield: 'Scudo', atkUp: 'Furia!', vulnerable: 'Vulnerabile!', guard: 'In guardia' };

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
  private reticle!: Phaser.GameObjects.Container;
  private actionPanel!: Phaser.GameObjects.Container;
  private energyPips!: Phaser.GameObjects.Container;
  private specialButtons = new Map<string, Phaser.GameObjects.Container>();
  private enemyIds: string[] = [];
  private log!: Phaser.GameObjects.Text;

  constructor() {
    super('Battle');
  }

  create(data: { node: NodeType }): void {
    this.setupCamera();
    const run = GameSession.run, ctl = GameSession.ctl;
    if (!run || !ctl) { this.scene.start('Menu'); return; }
    this.views.clear(); this.specialButtons.clear();
    this.busy = true; this.speed = GameSession.save.data.settings.fastAnimations ? 2 : 1; this.targetUid = undefined;
    this.node = data.node;

    new BiomeBackdrop(this, { groundTop: 560 });
    this.fullRect(0x15122e, 0.15);

    // --- setup motore -----------------------------------------------------------
    const stats = effectiveStats(run);
    this.enemyIds = ctl.enemyGroup(this.node);
    const arts = run.artifactIds.map((id) => ARTIFACT_BY_ID.get(id)!);
    this.battle = new Battle(
      {
        hero: makeHeroUnit(run.avatar === 'a' ? 'Kai' : 'Nova', stats, Math.min(run.currentHp, stats.maxHp)),
        companions: run.companions.map((c, i) => makeCompanionUnit(c.id, `c${i}`, c.hp, c.charge)),
        enemies: this.enemyIds.map((id, i) => makeEnemyUnit(id, `e${i}`)),
        powers: run.activeFruitIds.map((id) => FRUIT_BY_ID.get(id)!.ability),
        potions: run.potions,
        mods: {
          powerDamageMult: arts.reduce((m, a) => m * (a.powerDamageMult ?? 1), 1),
          surviveLethalOnce: arts.some((a) => a.surviveLethalOncePerBattle),
        },
      },
      ctl.rng,
    );

    // --- unità ---------------------------------------------------------------------
    const allies = this.battle.alive('ally');
    allies.forEach((u, i) => this.addView(u, ALLY_SLOTS[i]));
    this.battle.enemies().forEach((u, i) => this.addView(u, ENEMY_SLOTS[i]));
    // ordine di profondità: chi è più in basso sta davanti
    [...this.views.values()].sort((a, b) => a.root.y - b.root.y).forEach((v, i) => v.root.setDepth(10 + i));

    this.reticle = this.add.container(0, 0).setDepth(200);
    const arrow = this.add.graphics();
    arrow.fillStyle(COLORS.ink, 1).fillTriangle(-22, -28, 22, -28, 0, 6).fillStyle(COLORS.hot, 1).fillTriangle(-15, -24, 15, -24, 0, 0);
    this.reticle.add(arrow);
    this.tweens.add({ targets: arrow, y: -10, duration: 400, yoyo: true, repeat: -1 });

    // --- interfaccia ---------------------------------------------------------------
    this.log = addBody(this, GAME_WIDTH / 2, 60, '', 26, '#fff7e6').setStroke('#1f1633', 6).setDepth(300);
    const title = this.node === 'boss' ? 'BOSS!' : this.node === 'elite' ? 'ÉLITE!' : 'BATTAGLIA!';
    this.buildActionPanel();
    this.input.on('pointerdown', () => { if (this.busy) this.speed = Math.max(this.speed, 3); });

    void banner(this, 420, title, this.node === 'battle' ? 0x5b4bd6 : COLORS.hot, 72, 500).then(async () => {
      await this.play(this.battle.start());
      this.afterResolve();
    });
  }

  private addView(u: Unit, slot: { x: number; y: number }): UnitView {
    const run = GameSession.run!;
    const v = new UnitView(this, u, slot.x, slot.y, run.avatar === 'a' ? 'm' : 'f');
    this.views.set(u.uid, v);
    if (u.side === 'enemy') {
      v.root.setSize(160, v.height + 40).setInteractive(new Phaser.Geom.Rectangle(-80, -v.height - 20, 160, v.height + 60), Phaser.Geom.Rectangle.Contains);
      v.root.on('pointerup', () => { if (u.hp > 0) this.setTarget(u.uid); });
      const mv = this.battle.moveOf(u);
      v.setIntent(mv.intent ?? 'attack', mv.name);
    }
    return v;
  }

  // --- pannello azioni ------------------------------------------------------------------
  private buildActionPanel(): void {
    const top = 900;
    this.add.rectangle(-400, top - 20, 1520, 1200, 0x15122e, 0.92).setOrigin(0).setDepth(250);
    this.actionPanel = this.add.container(0, 0).setDepth(260);
    this.energyPips = this.add.container(0, 0).setDepth(261);
    addBody(this, 40, top + 14, 'ENERGIA', 20, '#ffcf3a').setOrigin(0, 0.5).setDepth(261);

    const mk = (x: number, y: number, label: string, act: () => void, opts = {}) => {
      const b = new Button(this, x, y, label, () => this.onAction(act), { width: 300, height: 104, fontSize: 46, ...opts });
      this.actionPanel.add(b);
      return b;
    };
    mk(185, top + 110, 'ATTACCO', () => this.submit({ type: 'attack', targetUid: this.currentTarget()! }));
    mk(530, top + 110, 'POTERI', () => this.openPowers(), { variant: 'danger' });
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

  private drawSpecial(u: Unit): void {
    const c = this.specialButtons.get(u.uid);
    if (!c) return;
    c.removeAll(true);
    const ready = this.battle.canSpecial(u);
    const g = this.add.graphics();
    g.fillStyle(COLORS.ink, 1).fillCircle(0, 0, 32);
    g.fillStyle(ready ? COLORS.accent : 0x3a3366, 1).fillCircle(0, 0, 27);
    g.lineStyle(5, ready ? 0xffffff : 0x8f86b8, 1).beginPath().arc(0, 0, 30, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * u.charge) / u.chargeMax).strokePath();
    c.add([g, addBody(this, 0, 0, u.hp > 0 ? u.name.slice(0, 4).toUpperCase() : 'KO', 15, ready ? '#1f1633' : '#c2b8e8')]);
    if (ready) { c.add(addTitle(this, 22, -24, '!', 30).setColor('#ff5f6d')); this.tweens.add({ targets: c, scale: 1.1, duration: 300, yoyo: true, repeat: 1 }); }
  }

  private updateHud(): void {
    this.energyPips.removeAll(true);
    for (let i = 0; i < 5; i++) {
      const g = this.add.graphics();
      const on = i < this.battle.energy;
      g.fillStyle(COLORS.ink, 1).fillCircle(150 + i * 44, 914, 17);
      g.fillStyle(on ? 0xffcf3a : 0x3a3366, 1).fillCircle(150 + i * 44, 914, 13);
      if (on) g.fillStyle(0xffffff, 0.6).fillCircle(146 + i * 44, 909, 4);
      this.energyPips.add(g);
    }
    const potion = this.actionPanel.getByName('potion') as Button | null;
    if (potion) {
      (potion.list[1] as Phaser.GameObjects.Text).setText(`POZIONE ×${this.battle.potions}`);
      potion.setEnabled(this.battle.potions > 0 && this.battle.hero.hp < this.battle.hero.maxHp);
    }
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
    if (!v) { this.reticle.setVisible(false); return; }
    this.reticle.setPosition(v.x, v.topY - 100).setVisible(!this.busy);
  }

  private onAction(fn: () => void): void {
    if (this.busy || this.battle.phase !== 'awaitingInput') return;
    fn();
  }

  private openPowers(): void {
    const m = modal(this);
    m.add(addTitle(this, 360, 330, 'POTERI DEI FRUTTI', 54).setAngle(-2));
    m.add(addBody(this, 360, 392, `Energia: ${this.battle.energy} ⚡ · bersaglio: ${this.battle.unit(this.currentTarget() ?? '')?.name ?? '-'}`, 24, '#ffcf3a'));
    this.battle.powers.forEach((a: Ability, i) => {
      const fruit = [...FRUIT_BY_ID.values()].find((f) => f.ability.id === a.id)!;
      const y = 520 + i * 170, ok = this.battle.canUsePower(a);
      m.add(panel(this, 50, y - 70, 620, 150, ok ? 0x3d3380 : 0x2a2352));
      m.add(icon(this, 120, y + 5, iconKey('fruit', fruit.id), 96).setAlpha(ok ? 1 : 0.5));
      m.add(addTitle(this, 190, y - 30, a.name, 36).setOrigin(0, 0.5).setAlpha(ok ? 1 : 0.6));
      m.add(addBody(this, 190, y + 22, a.description, 21, '#e9dcff').setOrigin(0, 0.5).setWordWrapWidth(380).setAlign('left'));
      m.add(addTitle(this, 640, y - 30, `${a.cost}⚡`, 36).setOrigin(1, 0.5).setColor(ok ? '#ffcf3a' : '#8f86b8'));
      if (ok) {
        const z = this.add.zone(360, y + 5, 620, 150).setInteractive({ useHandCursor: true });
        z.on('pointerup', () => { m.destroy(); this.submit({ type: 'power', abilityId: a.id, targetUid: this.currentTarget() }); });
        m.add(z);
      }
    });
    if (this.battle.powers.length === 0) m.add(addBody(this, 360, 560, 'Nessun frutto attivo.', 28));
    m.add(new Button(this, 360, 1100, 'INDIETRO', () => m.destroy(), { variant: 'secondary', width: 360, height: 92, fontSize: 40 }));
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
    this.log.setText('Tocca un nemico per mirare · scegli un\'azione');
    this.views.get('hero')?.fierce();
  }

  // --- animazione degli eventi -------------------------------------------------------------
  private async play(events: BattleEvent[]): Promise<void> {
    let lastUser: string | undefined;
    for (const e of events) {
      const s = this.speed;
      switch (e.t) {
        case 'round': if (e.n > 1) this.log.setText(`Round ${e.n}`); break;
        case 'turn': lastUser = e.uid; break;
        case 'use': {
          const v = this.views.get(e.uid);
          const who = this.battle.unit(e.uid)!;
          this.log.setText(`${who.name}: ${e.name}`);
          if (e.isPower || e.isSpecial) {
            this.cameras.main.shake(160 / s, 0.006);
            await banner(this, 420, e.name.toUpperCase() + '!', e.isPower ? COLORS.hot : 0x5b4bd6, 56, 380 / s);
          }
          if (v && e.ability !== 'guard' && e.ability !== 'potion') {
            const foe = who.side === 'ally' ? 600 : 150;
            await v.lunge(foe, s);
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
          const col = e.kind === 'burn' ? '#ff8a3d' : e.kind === 'poison' ? '#9be06a' : e.crit ? '#ffe14a' : '#ffffff';
          if (e.amount > 0 || e.absorbed === 0) floatText(this, v.x, v.centerY, `${e.crit ? 'CRIT! ' : ''}${e.amount}`, col, e.crit ? 60 : 50, s);
          if (e.amount > 0) { if (e.crit) this.cameras.main.shake(120 / s, 0.01); await v.hit(s); }
          else await wait(this, 160 / s);
          break;
        }
        case 'heal': { const v = this.views.get(e.target); if (v) { v.refresh(); floatText(this, v.x, v.centerY, `+${e.amount}`, '#6fe08a', 46, s); await wait(this, 200 / s); } break; }
        case 'shield': { const v = this.views.get(e.target); if (v) { v.refresh(); floatText(this, v.x, v.centerY - 20, `+${e.amount} scudo`, '#9cc8ff', 32, s); await wait(this, 120 / s); } break; }
        case 'status': { const v = this.views.get(e.target); if (v) { v.refresh(); if (e.status !== 'guard') floatText(this, v.x, v.topY, STATUS_NAME[e.status], '#d6a8ff', 32, s); await wait(this, 150 / s); } break; }
        case 'resist': { const v = this.views.get(e.target); if (v) floatText(this, v.x, v.topY, 'Resiste!', '#c2b8e8', 30, s); break; }
        case 'cleanse': { const v = this.views.get(e.target); if (v) v.refresh(); break; }
        case 'stunned': { const v = this.views.get(e.uid); if (v) { v.refresh(); floatText(this, v.x, v.topY, 'CONGELATO!', '#bff4ff', 38, s); await wait(this, 400 / s); } break; }
        case 'ko': { const v = this.views.get(e.uid); if (v) { floatText(this, v.x, v.topY, 'KO!', '#ff5f6d', 56, s); await v.ko(s); } this.placeReticle(); break; }
        case 'survive': await banner(this, 420, 'FILO DEL DESTINO!', 0xff5f8a, 50, 500 / s); this.views.get(e.uid)?.refresh(); break;
        case 'summon': {
          const used = new Set([...this.views.values()].filter((v) => v.unit.side === 'enemy' && v.unit.hp > 0).map((v) => `${v.root.x},${v.root.y}`));
          const slot = ENEMY_SLOTS.find((sl) => !used.has(`${sl.x},${sl.y}`)) ?? ENEMY_SLOTS[1];
          const v = this.addView(e.unit, slot);
          v.root.setDepth(30).setScale(0);
          this.enemyIds.push(e.unit.defId);
          this.tweens.add({ targets: v.root, scale: 1, duration: 300 / s, ease: 'Back.easeOut' });
          await wait(this, 300 / s);
          break;
        }
        case 'enrage': this.cameras.main.shake(400 / s, 0.012); await banner(this, 420, `${this.battle.unit(e.uid)!.name.toUpperCase()} SI ARRABBIA!`, COLORS.hot, 46, 600 / s); break;
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
    await banner(this, 420, 'VITTORIA!', 0xffcf3a, 90, 900);
    const comps = this.battle.units.filter((u) => u.kind === 'companion').map((u) => ({ id: u.defId, hp: u.hp, charge: u.charge }));
    ctl.run.potions = this.battle.potions;
    ctl.run.heroKos += 0;
    ctl.onVictory(this.enemyIds, this.battle.hero.hp, comps);
    if (this.node === 'boss') ctl.onAreaCleared();
    GameSession.persistRun();
    this.goTo('Reward', { node: this.node, mode: 'battle' });
  }

  private async onDefeat(): Promise<void> {
    this.log.setText('');
    await banner(this, 420, 'SCONFITTA...', 0x3a3366, 80, 1100);
    GameSession.run!.currentHp = 0;
    GameSession.run!.potions = this.battle.potions;
    this.goTo('Summary', { result: 'defeat' });
  }
}

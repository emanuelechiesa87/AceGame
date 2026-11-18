import { COLORS, GAME_WIDTH, TEXTURE_SCALE } from '../app/config';
import { iconKey } from '../art/registry';
import type { NodeType } from '../data/areas';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { BALANCE } from '../data/balance';
import { FRUIT_BY_ID } from '../data/fruits';
import { GameSession } from '../state/GameSession';
import type { Reward } from '../systems/RunController';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { offerArtifact, offerFruit, RARITY_LABEL } from '../ui/Offers';
import { RunHud } from '../ui/RunHud';
import { addBody, addTitle } from '../ui/text';
import { icon, panel } from '../ui/widgets';
import { BaseScene } from './BaseScene';
import { finishNode } from './flow';

/** Dopo una vittoria: scegli 1 ricompensa su 3. Al forziere: un tesoro unico. */
export class RewardScene extends BaseScene {
  private picked = false;

  constructor() {
    super('Reward');
  }

  create(data: { node: NodeType; mode: 'battle' | 'chest' }): void {
    this.setupCamera();
    const ctl = GameSession.ctl;
    if (!ctl) { this.scene.start('Menu'); return; }
    this.picked = false;
    new BiomeBackdrop(this, { groundTop: 980 });
    this.fullRect(COLORS.background, 0.55);
    new RunHud(this, ctl.run);
    const lines = this.add.image(GAME_WIDTH / 2, 640, 'fx-speedlines').setScale(1 / TEXTURE_SCALE).setAlpha(0.6);
    this.tweens.add({ targets: lines, angle: 360, duration: 40000, repeat: -1 });

    if (data.mode === 'chest') {
      addTitle(this, GAME_WIDTH / 2, 280, 'FORZIERE!', 76).setAngle(-3);
      const fruit = ctl.rng.next() < 0.4 ? ctl.randomNewFruit() : undefined;
      const art = fruit ? undefined : ctl.randomNewArtifact();
      const reward: Reward = fruit ? { kind: 'fruit', id: fruit } : art ? { kind: 'artifact', id: art } : { kind: 'potion' };
      addBody(this, GAME_WIDTH / 2, 350, 'Dentro c\'è...', 30, '#e9dcff');
      this.card(reward, GAME_WIDTH / 2, 620, 560, true);
      return;
    }
    addTitle(this, GAME_WIDTH / 2, 280, data.node === 'boss' ? 'BOTTINO DEL BOSS!' : 'SCEGLI UNA RICOMPENSA', 56).setAngle(-3);
    addBody(this, GAME_WIDTH / 2, 346, 'Una sola: scegli bene!', 26, '#e9dcff');
    ctl.rewardOptions(data.node).forEach((r, i) => this.card(r, GAME_WIDTH / 2, 500 + i * 230, 640, false));
    new Button(this, GAME_WIDTH / 2, 1200, 'SALTA', () => this.finish(), { variant: 'secondary', width: 260, height: 80, fontSize: 36 });
  }

  private describe(r: Reward): { key: string; title: string; text: string; tag: string } {
    const R = BALANCE.rewards;
    switch (r.kind) {
      case 'fruit': { const f = FRUIT_BY_ID.get(r.id)!; return { key: iconKey('fruit', f.id), title: f.name, text: `${f.ability.name} (${f.ability.cost}⚡): ${f.ability.description}`, tag: `FRUTTO · ${RARITY_LABEL[f.rarity]}` }; }
      case 'artifact': { const a = ARTIFACT_BY_ID.get(r.id)!; return { key: iconKey('artifact', a.id), title: a.name, text: a.description, tag: `ARTEFATTO · ${RARITY_LABEL[a.rarity]}` }; }
      case 'potion': return { key: iconKey('misc', 'potion'), title: 'Pozione', text: `Cura il ${Math.round(BALANCE.combat.potionHealPct * 100)}% degli HP in battaglia.`, tag: 'OGGETTO' };
      case 'heal': return { key: iconKey('node', 'rest'), title: 'Spuntino', text: `Recuperi subito il ${Math.round(R.healRewardPct * 100)}% degli HP.`, tag: 'CURA' };
      case 'maxHp': return { key: iconKey('node', 'recruit'), title: 'Cuore Robusto', text: `+${R.maxHpUp} HP massimi per questa run.`, tag: 'POTENZIAMENTO' };
    }
  }

  private card(r: Reward, x: number, y: number, w: number, big: boolean): void {
    const d = this.describe(r);
    const h = big ? 360 : 200;
    const c = this.add.container(x, y);
    const g = panel(this, -w / 2, -h / 2, w, h, 0x3d3380);
    const iconSize = big ? 170 : 120;
    const ix = big ? 0 : -w / 2 + 90, iy = big ? -60 : 0;
    const tx = big ? 0 : -w / 2 + 170;
    c.add([g, icon(this, ix, iy, d.key, iconSize)]);
    c.add(addBody(this, big ? 0 : w / 2 - 24, big ? -h / 2 + 30 : -h / 2 + 28, d.tag, 18, '#ffcf3a').setOrigin(big ? 0.5 : 1, 0.5));
    c.add(addTitle(this, tx, big ? 60 : -40, d.title, big ? 48 : 38).setOrigin(big ? 0.5 : 0, 0.5));
    c.add(addBody(this, tx, big ? 120 : 30, d.text, 22, '#fff7e6').setOrigin(big ? 0.5 : 0, 0.5).setWordWrapWidth(big ? w - 60 : w - 200).setAlign(big ? 'center' : 'left'));
    c.setScale(0.5);
    this.tweens.add({ targets: c, scale: 1, duration: 260, ease: 'Back.easeOut' });
    c.setSize(w, h).setInteractive({ useHandCursor: true }).on('pointerup', () => this.take(r, c));
    if (big) c.add(addBody(this, 0, h / 2 + 40, 'Tocca per prenderlo', 24, '#e9dcff'));
  }

  private take(r: Reward, c: Phaser.GameObjects.Container): void {
    if (this.picked) return;
    this.picked = true;
    this.tweens.add({ targets: c, scale: 1.08, duration: 100, yoyo: true });
    const ctl = GameSession.ctl!;
    switch (r.kind) {
      case 'fruit': offerFruit(this, r.id, () => this.finish()); return;
      case 'artifact': offerArtifact(r.id); break;
      default: ctl.applySimple(r.kind);
    }
    this.time.delayedCall(250, () => this.finish());
  }

  private finish(): void {
    finishNode((k, d) => this.goTo(k, d));
  }
}

import type Phaser from 'phaser';

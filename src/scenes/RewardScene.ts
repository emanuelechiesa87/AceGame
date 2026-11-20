import { FX_SCALE } from '../pixel/backgrounds';
import { Audio } from '../systems/Audio';
import { COLORS, GAME_WIDTH } from '../app/config';
import { iconKey } from '../pixel/keys';
import type { NodeType } from '../data/areas';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { BALANCE } from '../data/balance';
import { BRANCH_LEVEL, FRUIT_BY_ID, fruitAbility } from '../data/fruits';
import { GameSession } from '../state/GameSession';
import type { Reward } from '../systems/RunController';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { offerArtifact, RARITY_LABEL } from '../ui/Offers';
import { awakenFx, ROMAN } from '../ui/fruitFx';
import { pickBranch } from '../ui/branchPicker';
import { RunHud } from '../ui/RunHud';
import { addBody, addTitle, fitWidth } from '../ui/text';
import { icon, panel } from '../ui/widgets';
import { BaseScene } from './BaseScene';
import { finishNode } from './flow';

/** Dopo una vittoria: scegli 1 ricompensa su 3. Al forziere: un tesoro unico. */
export class RewardScene extends BaseScene {
  private picked = false;

  constructor() {
    super('Reward');
  }

  create(data: { node: NodeType; mode: 'battle' | 'chest'; wave?: boolean; coins?: number; offered?: boolean }): void {
    this.setupCamera();
    const ctl = GameSession.ctl;
    if (!ctl) { this.scene.start('Menu'); return; }
    this.picked = false;
    new BiomeBackdrop(this, { groundTop: 980 });
    this.fullRect(COLORS.background, 0.55);
    // le monete del forziere prima della barra in alto, così il totale è già aggiornato
    const chestCoins = data.mode === 'chest' ? ctl.rollCoins('chest') : 0;
    new RunHud(this, ctl.run);
    const lines = this.add.image(GAME_WIDTH / 2, 640, 'fx-speedlines').setScale(FX_SCALE).setAlpha(0.6);
    this.tweens.add({ targets: lines, angle: 360, duration: 40000, repeat: -1 });

    if (data.mode === 'chest') {
      addTitle(this, GAME_WIDTH / 2, 280, 'FORZIERE!', 76).setAngle(-3);
      // forziere: artefatto, oppure risveglio del frutto, oppure pozione
      const awaken = ctl.canAwaken && ctl.rng.next() < 0.35;
      const art = awaken ? undefined : ctl.randomNewArtifact();
      const reward: Reward = awaken ? { kind: 'awaken' } : art ? { kind: 'artifact', id: art } : { kind: 'potion' };
      addBody(this, GAME_WIDTH / 2, 350, `Dentro c'è... (+${chestCoins} monete)`, 30, '#fbe9c8');
      this.card(reward, GAME_WIDTH / 2, 620, 560, true);
      return;
    }
    const coinText = data.coins ? `+${data.coins} monete · ` : '';
    if (data.offered === false) {
      // F2: negli scontri normali la ricompensa non è garantita
      addTitle(this, GAME_WIDTH / 2, 280, 'BOTTINO', 64).setAngle(-3);
      icon(this, GAME_WIDTH / 2, 560, iconKey('misc', 'coin'), 200);
      addTitle(this, GAME_WIDTH / 2, 720, `+${data.coins ?? 0} MONETE`, 56);
      addBody(this, GAME_WIDTH / 2, 800, 'Niente tesori questa volta.\nLe monete si spendono dal Mercante.', 28, '#fbe9c8');
      new Button(this, GAME_WIDTH / 2, 1060, 'CONTINUA', () => this.finish(), { width: 420, height: 100, fontSize: 48 });
      void this.revealIfWave(data);
      return;
    }
    addTitle(this, GAME_WIDTH / 2, 280, data.node === 'boss' ? 'BOTTINO DEL BOSS!' : data.node === 'miniboss' ? 'TESORO DEL CAPOBANDA!' : 'SCEGLI UNA RICOMPENSA', 56).setAngle(-3);
    addBody(this, GAME_WIDTH / 2, 346, `${coinText}Una sola: scegli bene!`, 26, '#fbe9c8');
    const opts = ctl.rewardOptions(data.node);
    // con la Mappa Strappata le scelte sono 4: carte un po' più basse
    const four = opts.length > 3;
    opts.forEach((r, i) => this.card(r, GAME_WIDTH / 2, four ? 466 + i * 188 : 500 + i * 230, 640, false, four ? 176 : 200));
    new Button(this, GAME_WIDTH / 2, 1200, 'SALTA', () => this.finish(), { variant: 'secondary', width: 260, height: 80, fontSize: 36 });
    void this.revealIfWave(data);
  }

  private describe(r: Reward): { key: string; title: string; text: string; tag: string } {
    const R = BALANCE.rewards;
    switch (r.kind) {
      case 'awaken': {
        const f = FRUIT_BY_ID.get(GameSession.run!.activeFruitIds[0])!;
        const c = GameSession.ctl!, nl = c.fruitLevel + 1;
        const next = fruitAbility(f, nl, c.fruitBranch);
        // F5: verso il III la strada non è ancora scelta
        const text = nl === BRANCH_LEVEL && f.branches && !c.run.fruitBranch ? `Scegli la strada: ${f.branches.a} o ${f.branches.b.name}.` : `${next.name} (${next.cost}⚡): ${next.description}`;
        return { key: iconKey('fruit', f.id), title: `Risveglio ${ROMAN[nl]}`, text, tag: 'POTERE DEL FRUTTO' };
      }
      case 'artifact': { const a = ARTIFACT_BY_ID.get(r.id)!; return { key: iconKey('artifact', a.id), title: a.name, text: a.description, tag: `ARTEFATTO · ${RARITY_LABEL[a.rarity]}` }; }
      case 'potion': return { key: iconKey('misc', 'potion'), title: 'Pozione', text: `Cura il ${Math.round(BALANCE.combat.potionHealPct * 100)}% degli HP in battaglia.`, tag: 'OGGETTO' };
      case 'heal': return { key: iconKey('node', 'rest'), title: 'Spuntino', text: `Recuperi subito il ${Math.round(R.healRewardPct * 100)}% degli HP.`, tag: 'CURA' };
      case 'maxHp': return { key: iconKey('node', 'recruit'), title: 'Cuore Robusto', text: `+${R.maxHpUp} HP massimi per questa run.`, tag: 'POTENZIAMENTO' };
    }
  }

  private card(r: Reward, x: number, y: number, w: number, big: boolean, hSmall = 200): void {
    const d = this.describe(r);
    const h = big ? 360 : hSmall;
    const c = this.add.container(x, y);
    const g = panel(this, -w / 2, -h / 2, w, h, 0x3d3380);
    const iconSize = big ? 170 : 120;
    const ix = big ? 0 : -w / 2 + 90, iy = big ? -60 : 0;
    const tx = big ? 0 : -w / 2 + 170;
    c.add([g, icon(this, ix, iy, d.key, iconSize)]);
    c.add(addBody(this, big ? 0 : w / 2 - 24, big ? -h / 2 + 30 : -h / 2 + 28, d.tag, 18, '#ffcf3a').setOrigin(big ? 0.5 : 1, 0.5));
    c.add(fitWidth(addTitle(this, tx, big ? 60 : -40, d.title, big ? 48 : 38).setOrigin(big ? 0.5 : 0, 0.5), big ? w - 40 : w - 190));
    c.add(addBody(this, tx, big ? 120 : 30, d.text, 22, '#fff7e6').setOrigin(big ? 0.5 : 0, 0.5).setWordWrapWidth(big ? w - 60 : w - 200).setAlign(big ? 'center' : 'left'));
    c.setScale(0.5);
    this.tweens.add({ targets: c, scale: 1, duration: 260, ease: 'Back.easeOut' });
    c.setSize(w, h).setInteractive({ useHandCursor: true }).on('pointerup', () => this.take(r, c));
    if (big) c.add(addBody(this, 0, h / 2 + 40, 'Tocca per prenderlo', 24, '#fbe9c8'));
  }

  private take(r: Reward, c: Phaser.GameObjects.Container): void {
    if (this.picked) return;
    this.picked = true;
    this.tweens.add({ targets: c, scale: 1.08, duration: 100, yoyo: true });
    if (r.kind !== 'awaken') Audio.play('reward');
    const ctl = GameSession.ctl!;
    switch (r.kind) {
      case 'awaken': {
        ctl.awaken();
        // F5: al III si sceglie prima la strada
        void pickBranch(this)
          .then(() => awakenFx(this, GameSession.run!.activeFruitIds[0], ctl.fruitLevel, GameSession.run!.avatar === 'a' ? 'm' : 'f', ctl.fruitBranch))
          .then(() => this.finish());
        return;
      }
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

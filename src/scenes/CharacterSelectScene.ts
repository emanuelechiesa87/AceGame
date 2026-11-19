import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../app/config';
import type { HeroId } from '../pixel/keys';
import { GameSession } from '../state/GameSession';
import { isValidHeroName } from '../state/RunState';
import type { AvatarVariant } from '../types/game';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { HeroRig } from '../ui/HeroRig';
import { NameInput } from '../ui/NameInput';
import { addBody, addTitle } from '../ui/text';
import { steppedRect } from '../ui/widgets';
import { BaseScene } from './BaseScene';

const CARDS: { id: AvatarVariant; hero: HeroId; label: string; tag: string; x: number }[] = [
  { id: 'a', hero: 'm', label: 'LUI', tag: 'Testa calda', x: GAME_WIDTH / 2 - 168 },
  { id: 'b', hero: 'f', label: 'LEI', tag: 'Genio ribelle', x: GAME_WIDTH / 2 + 168 },
];
const CARD = { top: 250, h: 570, cy: 535 };

export class CharacterSelectScene extends BaseScene {
  private frames = new Map<AvatarVariant, Phaser.GameObjects.Graphics>();
  private rigs = new Map<AvatarVariant, HeroRig>();
  private heroName = '';
  private go!: Button;
  private nameField!: NameInput;

  constructor() {
    super('CharacterSelect');
  }

  create(): void {
    this.setupCamera();
    this.frames.clear();
    this.rigs.clear();
    const cx = GAME_WIDTH / 2;
    new BiomeBackdrop(this, { groundTop: 980 });
    this.fullRect(COLORS.background, 0.55);

    addTitle(this, cx, 110, 'CREA IL TUO EROE', 70).setAngle(-3);
    addBody(this, cx, 188, 'L\'aspetto è solo estetico: statistiche identiche.', 26, '#fbe9c8');

    for (const c of CARDS) {
      const frame = this.add.graphics();
      this.frames.set(c.id, frame);
      const rig = new HeroRig(this, c.x, 730, c.hero, 1.0).idle();
      this.rigs.set(c.id, rig);
      addTitle(this, c.x, 770, c.label, 46);
      addBody(this, c.x, 806, c.tag, 22, '#fbe9c8').setStroke('#1f1633', 5);
      this.add.zone(c.x, CARD.cy, 316, CARD.h).setInteractive({ useHandCursor: true }).on('pointerup', () => this.select(c.id, true));
    }

    addTitle(this, cx, 880, 'COME SI CHIAMA?', 40).setColor('#ffcf3a');
    this.heroName = GameSession.save.data.lastHeroName;
    this.nameField = new NameInput(this, cx, 960, 520, 86, this.heroName, (v) => { this.heroName = v; this.refreshGo(); });
    this.go = new Button(this, cx, 1085, 'VIA!', () => this.startRun(), { width: 460, height: 112, fontSize: 64 });
    new Button(this, cx, 1210, 'INDIETRO', () => this.goTo('Menu'), { variant: 'secondary', width: 300, height: 84, fontSize: 38 });

    this.select(GameSession.selectedAvatar, false);
    this.refreshGo();
  }

  private refreshGo(): void {
    this.go.setEnabled(isValidHeroName(this.heroName));
  }

  private select(id: AvatarVariant, react: boolean): void {
    GameSession.selectedAvatar = id;
    for (const c of CARDS) {
      const active = c.id === id;
      const g = this.frames.get(c.id)!;
      const x = c.x - 152, y = CARD.top, w = 304, h = CARD.h;
      g.clear();
      steppedRect(g, x + 8, y + 12, w, h, COLORS.ink, 12);
      steppedRect(g, x, y, w, h, COLORS.ink, 12);
      steppedRect(g, x + 6, y + 6, w - 12, h - 12, active ? COLORS.accent : 0x8a5232, 8);
      g.fillStyle(active ? 0x7a4528 : COLORS.panel, active ? 0.95 : 0.8).fillRect(x + 16, y + 16, w - 32, h - 32);
      if (active) {
        g.fillStyle(0xffcf3a, 0.18);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          g.fillTriangle(c.x, CARD.cy, c.x + Math.cos(a) * 250, CARD.cy + Math.sin(a) * 250, c.x + Math.cos(a + 0.22) * 250, CARD.cy + Math.sin(a + 0.22) * 250);
        }
      }
      const rig = this.rigs.get(c.id)!;
      rig.setAlpha(active ? 1 : 0.75);
      if (active && react) rig.cheer(c.hero === 'm' ? 'happy' : 'fierce', 'shout');
    }
  }

  private startRun(): void {
    if (!isValidHeroName(this.heroName)) { this.nameField.el.focus(); return; }
    this.nameField.el.blur();
    // F3: con almeno una Marea sbloccata si passa dalla scelta della Marea
    if (GameSession.maxTideUnlocked > 0) {
      GameSession.save.update((s) => (s.lastHeroName = this.heroName.trim()));
      this.goTo('TideSelect', { heroName: this.heroName.trim() });
      return;
    }
    GameSession.beginRun(GameSession.selectedAvatar, this.heroName.trim());
    this.rigs.get(GameSession.selectedAvatar)?.cheer('fierce', 'shout');
    this.time.delayedCall(450, () => this.goTo('FruitReveal'));
  }
}

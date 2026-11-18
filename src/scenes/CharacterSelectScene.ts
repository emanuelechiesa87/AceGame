import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../app/config';
import type { HeroId } from '../art/heroes';
import { GameSession } from '../state/GameSession';
import type { AvatarVariant } from '../types/game';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { HeroRig } from '../ui/HeroRig';
import { addBody, addTitle } from '../ui/text';
import { BaseScene } from './BaseScene';

const CARDS: { id: AvatarVariant; hero: HeroId; name: string; tag: string; x: number }[] = [
  { id: 'a', hero: 'm', name: 'KAI', tag: 'Testa calda', x: GAME_WIDTH / 2 - 168 },
  { id: 'b', hero: 'f', name: 'NOVA', tag: 'Genio ribelle', x: GAME_WIDTH / 2 + 168 },
];

export class CharacterSelectScene extends BaseScene {
  private frames = new Map<AvatarVariant, Phaser.GameObjects.Graphics>();
  private rigs = new Map<AvatarVariant, HeroRig>();

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

    addTitle(this, cx, 130, 'SCEGLI IL TUO EROE', 70).setAngle(-3);
    addBody(this, cx, 210, 'Cambia solo l\'aspetto: statistiche identiche.', 26, '#e9dcff');

    for (const c of CARDS) {
      const frame = this.add.graphics();
      this.frames.set(c.id, frame);
      const rig = new HeroRig(this, c.x, 770, c.hero, 1.05).idle();
      this.rigs.set(c.id, rig);
      addTitle(this, c.x, 830, c.name, 64);
      addBody(this, c.x, 892, c.tag, 26, '#e9dcff');
      this.add
        .zone(c.x, 600, 316, 620)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => this.select(c.id, true));
    }
    this.select(GameSession.selectedAvatar, false);

    new Button(this, cx, 1040, 'VIA!', () => this.startRun(), { width: 460, height: 120, fontSize: 68 });
    new Button(this, cx, 1180, 'INDIETRO', () => this.goTo('Menu'), { variant: 'secondary', width: 320, height: 88, fontSize: 40 });
  }

  private select(id: AvatarVariant, react: boolean): void {
    GameSession.selectedAvatar = id;
    for (const c of CARDS) {
      const active = c.id === id;
      const g = this.frames.get(c.id)!;
      const x = c.x - 152, y = 300, w = 304, h = 620;
      g.clear();
      g.fillStyle(COLORS.ink, 1).fillRoundedRect(x + 8, y + 10, w, h, 30);
      g.fillStyle(active ? 0x3d3380 : COLORS.panel, active ? 0.95 : 0.7).fillRoundedRect(x, y, w, h, 30);
      if (active) {
        // raggi di luce dietro all'eroe selezionato
        g.fillStyle(0xffcf3a, 0.18);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          g.fillTriangle(c.x, 600, c.x + Math.cos(a) * 260, 600 + Math.sin(a) * 260, c.x + Math.cos(a + 0.22) * 260, 600 + Math.sin(a + 0.22) * 260);
        }
      }
      g.lineStyle(active ? 8 : 4, active ? COLORS.accent : 0x5b4f99, 1).strokeRoundedRect(x, y, w, h, 30);
      const rig = this.rigs.get(c.id)!;
      rig.setAlpha(active ? 1 : 0.75);
      if (active && react) rig.cheer(c.hero === 'm' ? 'happy' : 'fierce', 'shout');
    }
  }

  private startRun(): void {
    GameSession.beginRun(GameSession.selectedAvatar);
    this.rigs.get(GameSession.selectedAvatar)?.cheer('fierce', 'shout');
    this.time.delayedCall(450, () => this.goTo('FruitReveal'));
  }
}

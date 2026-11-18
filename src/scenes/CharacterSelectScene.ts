import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../app/config';
import { GameSession } from '../state/GameSession';
import { createRunState } from '../state/RunState';
import { randomSeed } from '../systems/Rng';
import type { AvatarVariant } from '../types/game';
import { Button } from '../ui/Button';
import { addBody, addTitle } from '../ui/text';

const VARIANTS: { id: AvatarVariant; label: string; x: number }[] = [
  { id: 'a', label: 'Aspetto A', x: GAME_WIDTH / 2 - 170 },
  { id: 'b', label: 'Aspetto B', x: GAME_WIDTH / 2 + 170 },
];

export class CharacterSelectScene extends Phaser.Scene {
  private frames = new Map<AvatarVariant, Phaser.GameObjects.Graphics>();

  constructor() {
    super('CharacterSelect');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    addTitle(this, cx, 180, 'Scegli il tuo avatar', 56);
    addBody(this, cx, 260, 'Cambia solo l\'aspetto: le statistiche sono identiche.', 28);

    for (const v of VARIANTS) {
      const frame = this.add.graphics();
      this.frames.set(v.id, frame);
      this.add.image(v.x, 560, `avatar-${v.id}`).setScale(1.3);
      addBody(this, v.x, 760, v.label, 34, COLORS.text);
      // Area di tocco ampia quanto tutta la card.
      this.add
        .zone(v.x, 580, 300, 440)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => this.select(v.id));
    }
    this.select(GameSession.selectedAvatar);

    new Button(this, cx, 960, 'Inizia', () => this.startRun());
    new Button(this, cx, 1110, 'Indietro', () => this.scene.start('Menu'), { variant: 'secondary' });
    addBody(this, cx, GAME_HEIGHT - 50, 'Grafica segnaposto temporanea', 22);
  }

  private select(id: AvatarVariant): void {
    GameSession.selectedAvatar = id;
    for (const v of VARIANTS) {
      const g = this.frames.get(v.id)!;
      const active = v.id === id;
      g.clear();
      g.fillStyle(COLORS.panel, active ? 1 : 0.5).fillRoundedRect(v.x - 150, 360, 300, 440, 28);
      g.lineStyle(active ? 8 : 3, active ? COLORS.accent : 0x3a4370, 1).strokeRoundedRect(v.x - 150, 360, 300, 440, 28);
    }
  }

  private startRun(): void {
    GameSession.run = createRunState(GameSession.selectedAvatar, randomSeed());
    this.scene.start('Exploration');
  }
}

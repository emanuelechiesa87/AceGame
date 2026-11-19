import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../app/config';
import { BALANCE } from '../data/balance';
import { MAX_TIDE, TIDES } from '../data/tides';
import { GameSession } from '../state/GameSession';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { addBody, addTitle } from '../ui/text';
import { panel } from '../ui/widgets';
import { BaseScene } from './BaseScene';

/**
 * F3 · Scelta della Marea prima di salpare (solo se almeno la Marea 1 è sbloccata).
 * I malus si sommano: l'elenco mostra tutti quelli attivi, l'ultimo in evidenza.
 */
export class TideSelectScene extends BaseScene {
  private tide = 0;
  private heroName = '';
  private title!: Phaser.GameObjects.Text;
  private sub!: Phaser.GameObjects.Text;
  private bonus!: Phaser.GameObjects.Text;
  private lines: Phaser.GameObjects.Text[] = [];
  private down!: Button;
  private up!: Button;
  private started = false;

  constructor() {
    super('TideSelect');
  }

  create(data: { heroName?: string }): void {
    this.setupCamera();
    this.started = false;
    this.lines = [];
    this.heroName = data?.heroName ?? GameSession.save.data.lastHeroName;
    this.tide = GameSession.selectedTide;
    const cx = GAME_WIDTH / 2;
    new BiomeBackdrop(this, { groundTop: 980 });
    this.fullRect(COLORS.background, 0.6);

    addTitle(this, cx, 105, 'SCEGLI LA MAREA', 64).setAngle(-3);
    addBody(this, cx, 175, `Sbloccate fino alla Marea ${GameSession.maxTideUnlocked} di ${MAX_TIDE}`, 24, '#fbe9c8');

    this.down = new Button(this, 110, 275, '<', () => this.set(this.tide - 1), { variant: 'secondary', width: 110, height: 100, fontSize: 60 });
    this.up = new Button(this, 610, 275, '>', () => this.set(this.tide + 1), { variant: 'secondary', width: 110, height: 100, fontSize: 60 });
    this.title = addTitle(this, cx, 255, '', 64).setColor('#ffcf3a');
    this.sub = addBody(this, cx, 312, '', 26, '#fbe9c8');

    panel(this, 60, 370, 600, 600, COLORS.panel, 0.95);
    addBody(this, cx, 405, 'MALUS ATTIVI', 24, '#f1d7a8');
    for (let i = 0; i < MAX_TIDE; i++) this.lines.push(addBody(this, 95, 455 + i * 50, '', 25, '#fbe9c8').setOrigin(0, 0.5));
    this.bonus = addBody(this, cx, 1000, '', 24, '#6fe08a');

    new Button(this, cx, 1095, 'SALPA!', () => this.start(), { width: 460, height: 112, fontSize: 64 });
    new Button(this, cx, 1215, 'INDIETRO', () => this.goTo('CharacterSelect'), { variant: 'secondary', width: 300, height: 84, fontSize: 38 });
    this.set(this.tide);
  }

  private set(n: number): void {
    const max = GameSession.maxTideUnlocked;
    this.tide = Math.max(0, Math.min(max, n));
    this.down.setEnabled(this.tide > 0);
    this.up.setEnabled(this.tide < max);
    const def = TIDES[this.tide - 1];
    this.title.setText(this.tide ? `MAREA ${this.tide}` : 'MARE CALMO');
    this.sub.setText(def ? def.name : 'Nessun malus');
    this.lines.forEach((t, i) => {
      const d = TIDES[i];
      const on = i < this.tide;
      t.setText(on ? `${d.n} · ${d.desc}` : '').setColor(i === this.tide - 1 ? '#ffcf3a' : '#fbe9c8');
    });
    if (!this.tide) this.lines[0].setText('Nessun malus: il viaggio di sempre.').setColor('#fbe9c8');
    const mult = 1 + BALANCE.tides.scoreBonus * this.tide;
    this.bonus.setText(this.tide ? `Punteggio ×${mult.toFixed(1).replace('.', ',')}` : '');
  }

  private start(): void {
    if (this.started) return;
    this.started = true;
    GameSession.selectedTide = this.tide;
    GameSession.beginRun(GameSession.selectedAvatar, this.heroName.trim(), this.tide);
    this.goTo('FruitReveal');
  }
}

import { COLORS, GAME_WIDTH } from '../app/config';
import { iconKey } from '../pixel/keys';
import { GameSession } from '../state/GameSession';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { addBody, addTitle } from '../ui/text';
import { icon, panel } from '../ui/widgets';
import { BaseScene } from './BaseScene';

/** Top 3 locale. Etichettata sempre come record del dispositivo, non classifica pubblica. */
export class RecordsScene extends BaseScene {
  constructor() {
    super('Records');
  }

  create(): void {
    this.setupCamera();
    const s = GameSession.save.data;
    new BiomeBackdrop(this, { groundTop: 1000 });
    this.fullRect(COLORS.background, 0.7);
    addTitle(this, GAME_WIDTH / 2, 110, 'RECORD', 80).setAngle(-3);
    addBody(this, GAME_WIDTH / 2, 185, 'Record su questo dispositivo', 28, '#ffcf3a');

    const medals = [0xffd94a, 0xd9e1ef, 0xd08a4a];
    if (s.hallOfFame.length === 0) addBody(this, GAME_WIDTH / 2, 500, 'Ancora nessun record.\nCompleta una run per entrare nella Top 3!', 30, '#fbe9c8');
    s.hallOfFame.forEach((e, i) => {
      const y = 290 + i * 220;
      panel(this, 40, y, 640, 190, COLORS.panel, 0.95);
      this.add.circle(110, y + 70, 42, medals[i]).setStrokeStyle(5, COLORS.ink);
      addTitle(this, 110, y + 70, String(i + 1), 52);
      addTitle(this, 180, y + 50, `${e.score} PT`, 48).setOrigin(0, 0.5).setColor('#ffcf3a');
      addBody(this, 660, y + 50, e.result === 'victory' ? 'VITTORIA' : 'SCONFITTA', 22, e.result === 'victory' ? '#9be06a' : '#ff9ab0').setOrigin(1, 0.5);
      const d = new Date(e.date);
      addBody(this, 180, y + 100, `${e.heroName ? e.heroName + ' · ' : ''}${d.toLocaleDateString('it-IT')} · ${Math.floor(e.durationSec / 60)}m · area ${e.maxArea} · ${e.enemiesDefeated} nemici`, 21, '#fbe9c8').setOrigin(0, 0.5);
      e.fruits.slice(0, 6).forEach((f, k) => icon(this, 200 + k * 50, y + 150, iconKey('fruit', f), 44));
    });

    const L = s.lifetime;
    addBody(this, GAME_WIDTH / 2, 990, `Run giocate: ${L.runs} · vittorie: ${L.victories} · nemici totali: ${L.enemiesDefeated}`, 22, '#f1d7a8');
    addBody(this, GAME_WIDTH / 2, 1040, 'Cancellando i dati del sito i record vanno persi.', 20, '#a89580');
    new Button(this, GAME_WIDTH / 2, 1170, 'INDIETRO', () => this.goTo('Menu'), { variant: 'secondary', width: 320, height: 88, fontSize: 40 });
  }
}

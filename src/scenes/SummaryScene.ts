import { FX_SCALE } from '../pixel/backgrounds';
import { COLORS, GAME_WIDTH } from '../app/config';
import { iconKey } from '../pixel/keys';
import { GameSession } from '../state/GameSession';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { HeroRig } from '../ui/HeroRig';
import { addBody, addTitle } from '../ui/text';
import { icon, panel } from '../ui/widgets';
import { BaseScene } from './BaseScene';

/** Fine run: riepilogo, punteggio e aggiornamento dei record locali. */
export class SummaryScene extends BaseScene {
  constructor() {
    super('Summary');
  }

  create(data: { result: 'victory' | 'defeat' }): void {
    this.setupCamera();
    const run = GameSession.run;
    if (!run) { this.scene.start('Menu'); return; }
    const snapshot = { ...run };
    const res = GameSession.endRun(data.result);
    const win = data.result === 'victory';

    new BiomeBackdrop(this, { groundTop: 980 });
    this.fullRect(COLORS.background, win ? 0.45 : 0.75);
    if (win) {
      const lines = this.add.image(GAME_WIDTH / 2, 330, 'fx-speedlines').setScale(FX_SCALE);
      this.tweens.add({ targets: lines, angle: 360, duration: 30000, repeat: -1 });
    }
    addTitle(this, GAME_WIDTH / 2, 150, win ? `${snapshot.heroName.toUpperCase()} HA VINTO!` : `${snapshot.heroName.toUpperCase()} È K.O.`, 60).setAngle(-3).setColor(win ? '#ffe14a' : '#ff9ab0');
    const hero = new HeroRig(this, GAME_WIDTH / 2, 470, snapshot.avatar === 'a' ? 'm' : 'f', 0.85).idle();
    if (win) this.time.addEvent({ delay: 1400, loop: true, callback: () => hero.cheer('happy', 'shout') });
    else hero.setBaseExpression('closed', 'ouch');

    panel(this, 60, 520, 600, 430, COLORS.panel, 0.96);
    addTitle(this, GAME_WIDTH / 2, 580, `${snapshot.score} PUNTI`, 64).setColor('#ffcf3a');
    if (res && res.rank >= 0) {
      const t = addTitle(this, GAME_WIDTH / 2, 645, res.rank === 0 ? 'NUOVO RECORD!' : `${res.rank + 1}° MIGLIOR RISULTATO!`, 34).setColor('#ff5f8a');
      this.tweens.add({ targets: t, scale: 1.1, duration: 400, yoyo: true, repeat: -1 });
    }
    const dur = res ? `${Math.floor(res.entry.durationSec / 60)}m ${res.entry.durationSec % 60}s` : '-';
    const rows = [
      ['Nemici sconfitti', String(snapshot.enemiesDefeated)],
      ['Élite / Boss', `${snapshot.elitesDefeated} / ${snapshot.bossesDefeated}`],
      ['Eventi completati', String(snapshot.eventsCompleted)],
      ['Durata', dur],
    ];
    rows.forEach(([k, v], i) => {
      addBody(this, 110, 710 + i * 44, k, 26, '#fbe9c8').setOrigin(0, 0.5);
      addBody(this, 610, 710 + i * 44, v, 26, '#ffffff').setOrigin(1, 0.5);
    });
    addBody(this, 110, 905, 'Frutti usati:', 24, '#fbe9c8').setOrigin(0, 0.5);
    snapshot.usedFruitIds.forEach((id, i) => icon(this, 300 + i * 56, 905, iconKey('fruit', id), 50));

    addBody(this, GAME_WIDTH / 2, 990, 'Collezione e record restano salvati su questo dispositivo.', 22, '#f1d7a8');
    new Button(this, GAME_WIDTH / 2, 1080, 'NUOVA RUN', () => this.goTo('CharacterSelect'), { width: 460, height: 110, fontSize: 56 });
    new Button(this, GAME_WIDTH / 2, 1200, 'MENU', () => this.goTo('Menu'), { variant: 'secondary', width: 300, height: 84, fontSize: 40 });
  }
}

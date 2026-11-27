import type Phaser from 'phaser';
import { BUILD_VERSION, COLORS, GAME_WIDTH } from '../app/config';
import { GameSession } from '../state/GameSession';
import { Audio } from '../systems/Audio';
import { exportFileName } from '../systems/SaveTransfer';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { downloadText, pickTextFile } from '../ui/fileIO';
import { modal } from '../ui/Offers';
import { addBody, addTitle } from '../ui/text';
import { panel } from '../ui/widgets';
import { BaseScene } from './BaseScene';

type Settings = typeof GameSession.save.data.settings;

/** Impostazioni: audio, animazioni, vibrazione, tutorial, salvataggi (export/import), azzeramento. */
export class SettingsScene extends BaseScene {
  private toast?: Phaser.GameObjects.Text;

  constructor() {
    super('Settings');
  }

  create(): void {
    this.setupCamera();
    new BiomeBackdrop(this, { groundTop: 1000 });
    this.fullRect(COLORS.background, 0.75);
    addTitle(this, GAME_WIDTH / 2, 100, 'IMPOSTAZIONI', 72).setAngle(-3);

    const set = () => GameSession.save.data.settings;
    const upd = (fn: (s: Settings) => void) => GameSession.save.update((s) => fn(s.settings));

    panel(this, 40, 170, 640, 470, COLORS.panel, 0.95);
    this.volumeRow(220, 'MUSICA', () => set().music, (v) => { upd((s) => (s.music = v)); Audio.setVolumes(set().music, set().sfx); });
    this.volumeRow(320, 'EFFETTI', () => set().sfx, (v) => { upd((s) => (s.sfx = v)); Audio.setVolumes(set().music, set().sfx); Audio.play('hit'); });
    this.toggleRow(420, 'ANIMAZIONI', () => (set().fastAnimations ? 'VELOCI' : 'NORMALI'), () => upd((s) => (s.fastAnimations = !s.fastAnimations)));
    this.toggleRow(520, 'VIBRAZIONE', () => (set().vibration ? 'SÌ' : 'NO'), () => { upd((s) => (s.vibration = !s.vibration)); Audio.setVibration(set().vibration); Audio.buzz(40); });

    panel(this, 40, 670, 640, 380, COLORS.panel, 0.95);
    new Button(this, 210, 720, 'TUTORIAL', () => { upd((s) => (s.tutorialDone = false)); this.say('Il tutorial ripartirà alla prossima battaglia'); }, { variant: 'secondary', width: 270, height: 72, fontSize: 30 });
    new Button(this, 510, 720, 'LA STORIA', () => this.goTo('Story', { id: 'intro', next: 'Settings' }), { variant: 'secondary', width: 270, height: 72, fontSize: 30 });

    addBody(this, 70, 810, 'SALVATAGGI', 30, '#ffcf3a').setOrigin(0, 0.5);
    addBody(this, 70, 850, 'Copia di sicurezza automatica attiva. Esporta un file per cambiare telefono.', 20, '#fbe9c8').setOrigin(0, 0.5).setWordWrapWidth(580);
    new Button(this, 210, 930, 'ESPORTA', () => this.doExport(), { width: 270, height: 84, fontSize: 34 });
    new Button(this, 510, 930, 'IMPORTA', () => void this.doImport(), { variant: 'secondary', width: 270, height: 84, fontSize: 34 });
    new Button(this, GAME_WIDTH / 2, 1015, 'CANCELLA PROGRESSI', () => this.confirmReset(), { variant: 'danger', width: 420, height: 60, fontSize: 26 });

    new Button(this, GAME_WIDTH / 2, 1140, 'INDIETRO', () => this.goTo('Menu'), { variant: 'secondary', width: 320, height: 90, fontSize: 40 });
    addBody(this, GAME_WIDTH / 2, 1230, `v${BUILD_VERSION} · suoni e musica originali, generati dal gioco`, 18, '#fbe9c8');
  }

  private volumeRow(y: number, label: string, get: () => number, put: (v: number) => void): void {
    addBody(this, 70, y + 20, label, 30, '#fff7e6').setOrigin(0, 0.5);
    const bars: Phaser.GameObjects.Rectangle[] = [];
    const draw = () => bars.forEach((b, i) => b.setFillStyle(i < Math.round(get() * 5) ? 0xffcf3a : 0x3a2414));
    for (let i = 0; i < 5; i++) bars.push(this.add.rectangle(370 + i * 38, y + 20, 28, 20 + i * 7, 0x3a2414).setOrigin(0.5, 0.5).setStrokeStyle(4, COLORS.ink));
    const step = (d: number) => { put(Math.max(0, Math.min(1, Math.round((get() + d) * 5) / 5))); draw(); };
    new Button(this, 300, y + 20, '−', () => step(-0.2), { variant: 'secondary', width: 72, height: 72, fontSize: 44, cooldownMs: 120 });
    new Button(this, 620, y + 20, '+', () => step(0.2), { variant: 'secondary', width: 72, height: 72, fontSize: 44, cooldownMs: 120 });
    draw();
  }

  private toggleRow(y: number, label: string, text: () => string, flip: () => void): void {
    addBody(this, 70, y + 20, label, 30, '#fff7e6').setOrigin(0, 0.5);
    const b = new Button(this, 520, y + 20, text(), () => { flip(); (b.list[1] as Phaser.GameObjects.Text).setText(text()); }, { variant: 'secondary', width: 240, height: 72, fontSize: 30, cooldownMs: 200 });
  }

  private say(msg: string, color = '#9be06a'): void {
    this.toast?.destroy();
    this.toast = addBody(this, GAME_WIDTH / 2, 655, msg, 24, color).setStroke('#1f1633', 6).setDepth(50).setWordWrapWidth(640);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 2600, duration: 400 });
  }

  private doExport(): void {
    const ok = downloadText(exportFileName(), GameSession.exportText());
    this.say(ok ? 'File salvato (cartella Download)' : 'Esportazione non riuscita', ok ? '#9be06a' : '#ff9ab0');
  }

  private async doImport(): Promise<void> {
    const text = await pickTextFile();
    if (text === null) return;
    const m = modal(this);
    m.add(addTitle(this, 360, 470, 'IMPORTARE?', 60));
    m.add(addBody(this, 360, 560, 'I progressi di questo telefono verranno sostituiti da quelli del file.', 26, '#fbe9c8').setWordWrapWidth(560));
    m.add(new Button(this, 360, 700, 'SÌ, IMPORTA', () => {
      m.destroy();
      try {
        const r = GameSession.importText(text);
        this.say(r.hasRun ? 'Importato! C\'è anche una run da continuare' : 'Progressi importati!');
      } catch (err) {
        this.say((err as Error).message, '#ff9ab0');
      }
    }, { variant: 'danger', width: 420 }));
    m.add(new Button(this, 360, 840, 'ANNULLA', () => m.destroy(), { variant: 'secondary', width: 300 }));
  }

  private confirmReset(): void {
    const m = modal(this);
    m.add(addTitle(this, 360, 450, 'CANCELLARE TUTTO?', 56));
    m.add(addBody(this, 360, 545, 'Collezione, sblocchi, record e run in corso spariranno. Consiglio: prima ESPORTA.', 26, '#fbe9c8').setWordWrapWidth(580));
    m.add(new Button(this, 360, 700, 'SÌ, CANCELLA', () => { m.destroy(); GameSession.resetProgress(); this.say('Progressi cancellati'); }, { variant: 'danger', width: 420 }));
    m.add(new Button(this, 360, 840, 'NO', () => m.destroy(), { variant: 'secondary', width: 300 }));
  }
}

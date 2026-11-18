import Phaser from 'phaser';
import { BUILD_VERSION, GAME_HEIGHT, GAME_WIDTH } from '../app/config';
import { Button } from '../ui/Button';
import { addBody, addTitle } from '../ui/text';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    addTitle(this, cx, 260, 'AceGame', 96);
    addBody(this, cx, 350, 'Prototipo – titolo provvisorio');

    new Button(this, cx, 600, 'Nuova run', () => this.scene.start('CharacterSelect'));
    new Button(this, cx, 760, 'Collezione', () => undefined, { variant: 'secondary', enabled: false });
    new Button(this, cx, 920, 'Record', () => undefined, { variant: 'secondary', enabled: false });
    new Button(this, cx, 1080, 'Impostazioni', () => undefined, { variant: 'secondary', enabled: false });

    addBody(this, cx, GAME_HEIGHT - 50, `v${BUILD_VERSION} · M0 fondazioni`, 24);
  }
}

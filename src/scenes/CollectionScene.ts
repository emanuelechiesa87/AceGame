import { COLORS, GAME_WIDTH, TEXTURE_SCALE } from '../app/config';
import { CREATURE_SCALE } from '../pixel/creatures';
import { creatureKey, iconKey } from '../pixel/keys';
import { ARTIFACTS } from '../data/artifacts';
import { COMPANIONS } from '../data/companions';
import { FRUITS } from '../data/fruits';
import { GameSession } from '../state/GameSession';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { addBody, addTitle } from '../ui/text';
import { icon } from '../ui/widgets';
import { BaseScene } from './BaseScene';

/** Collezione permanente: frutti, artefatti e compagni incontrati. */
export class CollectionScene extends BaseScene {
  constructor() {
    super('Collection');
  }

  create(): void {
    this.setupCamera();
    const s = GameSession.save.data;
    new BiomeBackdrop(this, { groundTop: 1000 });
    this.fullRect(COLORS.background, 0.7);
    addTitle(this, GAME_WIDTH / 2, 90, 'COLLEZIONE', 72).setAngle(-3);

    const section = (y: number, title: string, found: number, total: number) => {
      addTitle(this, 50, y, title, 40).setOrigin(0, 0.5);
      addBody(this, 670, y, `${found}/${total}`, 26, '#ffcf3a').setOrigin(1, 0.5);
    };

    const fr = FRUITS.filter((f) => s.discoveredFruitIds.includes(f.id));
    section(190, 'FRUTTI', fr.length, FRUITS.length);
    const inPool = FRUITS.length - GameSession.lockedFruitIds().length;
    addBody(this, 360, 190, `nel pool: ${inPool}`, 18, '#6fe08a');
    FRUITS.forEach((f, i) => {
      const x = 105 + (i % 4) * 170, y = 260 + Math.floor(i / 4) * 105;
      const known = s.discoveredFruitIds.includes(f.id);
      const ic = icon(this, x, y - 8, iconKey('fruit', f.id), 72);
      if (!known) ic.setTintFill(0x3a2414);
      addBody(this, x, y + 38, known ? f.name : '???', 17, known ? '#fff7e6' : '#a89580');
    });

    const ar = ARTIFACTS.filter((a) => s.discoveredArtifactIds.includes(a.id));
    section(660, 'ARTEFATTI', ar.length, ARTIFACTS.length);
    ARTIFACTS.forEach((a, i) => {
      const x = 80 + i * 140, y = 760;
      const known = s.discoveredArtifactIds.includes(a.id);
      const ic = icon(this, x, y, iconKey('artifact', a.id), 84);
      if (!known) ic.setTintFill(0x3a2414);
      addBody(this, x, y + 64, known ? a.name : '???', 17, known ? '#fff7e6' : '#a89580').setWordWrapWidth(130);
    });

    const cm = COMPANIONS.filter((c) => s.metCompanionIds.includes(c.id));
    section(880, 'COMPAGNI', cm.length, COMPANIONS.length);
    COMPANIONS.forEach((c, i) => {
      const x = 140 + i * 220, y = 1060;
      const known = s.metCompanionIds.includes(c.id);
      const img = this.add.image(x, y, creatureKey(c.id)).setOrigin(0.5, 1).setScale((CREATURE_SCALE[c.id] * 0.9) / TEXTURE_SCALE);
      if (!known) img.setTintFill(0x3a2414);
      addBody(this, x, y + 22, known ? c.name : '???', 22, known ? '#fff7e6' : '#a89580');
    });

    new Button(this, GAME_WIDTH / 2, 1190, 'INDIETRO', () => this.goTo('Menu'), { variant: 'secondary', width: 320, height: 88, fontSize: 40 });
  }
}

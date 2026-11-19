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
import { RARITY_LABEL } from '../ui/Offers';
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
      // 20 frutti: griglia 5×4
      const x = 76 + (i % 5) * 142, y = 252 + Math.floor(i / 5) * 100;
      const known = s.discoveredFruitIds.includes(f.id);
      const ic = icon(this, x, y - 10, iconKey('fruit', f.id), 62);
      if (!known) ic.setTintFill(0x3a2414);
      addBody(this, x, y + 36, known ? f.name : '???', 15, known ? '#fff7e6' : '#a89580').setWordWrapWidth(134).setAlign('center').setLineSpacing(-4);
    });

    const ar = ARTIFACTS.filter((a) => s.discoveredArtifactIds.includes(a.id));
    section(660, 'ARTEFATTI', ar.length, ARTIFACTS.length);
    // 17 artefatti: due file di icone; tocca un'icona per leggerne nome ed effetto
    const info = addBody(this, GAME_WIDTH / 2, 856, 'Tocca un artefatto per leggerlo', 19, '#a89580').setWordWrapWidth(640).setAlign('center');
    ARTIFACTS.forEach((a, i) => {
      const perRow = 9, row = Math.floor(i / perRow), col = i % perRow;
      const inRow = Math.min(perRow, ARTIFACTS.length - row * perRow);
      const x = GAME_WIDTH / 2 + (col - (inRow - 1) / 2) * 76, y = 722 + row * 78;
      const known = s.discoveredArtifactIds.includes(a.id);
      const ic = icon(this, x, y, iconKey('artifact', a.id), 62);
      if (!known) ic.setTintFill(0x3a2414);
      ic.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        info.setText(known ? `${a.name} · ${RARITY_LABEL[a.rarity]}\n${a.description}` : '??? · ancora da scoprire').setColor(known ? '#fff7e6' : '#a89580');
      });
    });

    const cm = COMPANIONS.filter((c) => s.metCompanionIds.includes(c.id));
    section(912, 'COMPAGNI', cm.length, COMPANIONS.length);
    COMPANIONS.forEach((c, i) => {
      const x = 140 + i * 220, y = 1078;
      const known = s.metCompanionIds.includes(c.id);
      const img = this.add.image(x, y, creatureKey(c.id)).setOrigin(0.5, 1).setScale((CREATURE_SCALE[c.id] * 0.9) / TEXTURE_SCALE);
      if (!known) img.setTintFill(0x3a2414);
      addBody(this, x, y + 22, known ? c.name : '???', 22, known ? '#fff7e6' : '#a89580');
    });

    new Button(this, GAME_WIDTH / 2, 1190, 'INDIETRO', () => this.goTo('Menu'), { variant: 'secondary', width: 320, height: 88, fontSize: 40 });
  }
}

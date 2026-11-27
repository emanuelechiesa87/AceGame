import { COLORS, GAME_WIDTH, TEXTURE_SCALE } from '../app/config';
import { runLook } from '../data/fruitLooks';
import { storyPages, type StoryId, type StoryPage } from '../data/story';
import { CREATURE_SCALE } from '../pixel/creatures';
import { creatureKey } from '../pixel/keys';
import { GameSession } from '../state/GameSession';
import { BiomeBackdrop } from '../ui/BiomeBackdrop';
import { Button } from '../ui/Button';
import { HeroRig } from '../ui/HeroRig';
import { addBody } from '../ui/text';
import { panel } from '../ui/widgets';
import { BaseScene } from './BaseScene';

export interface StoryData { id: StoryId; next: string; nextData?: object; page?: number }

/** Schermate di storia (introduzione, Marea, finale): un tocco per proseguire, SALTA per chiudere. */
export class StoryScene extends BaseScene {
  constructor() {
    super('Story');
  }

  create(data: StoryData): void {
    this.setupCamera();
    const run = GameSession.run;
    const pages = storyPages(data.id, run?.heroName ?? (GameSession.save.data.lastHeroName || 'Eroe'), run?.tide ?? 0);
    const index = data.page ?? 0;
    const page = pages[index];
    this.scenery(page);

    panel(this, 40, 790, 640, 300, COLORS.panel, 0.96);
    addBody(this, GAME_WIDTH / 2, 940, page.text, 34, '#fff7e6').setWordWrapWidth(570);

    const last = index === pages.length - 1;
    const finish = () => {
      if (data.id === 'intro') GameSession.save.update((s) => (s.seen = { ...s.seen, intro: true }));
      this.goTo(data.next, data.nextData);
    };
    const forward = () => (last ? finish() : this.goTo('Story', { ...data, page: index + 1 }));
    new Button(this, GAME_WIDTH / 2, 1160, last ? 'CONTINUA' : 'AVANTI', forward, { width: 420, height: 100, fontSize: 48 });
    if (!last) new Button(this, 610, 90, 'SALTA', finish, { variant: 'secondary', width: 180, height: 72, fontSize: 30 });
    // si prosegue anche toccando lo schermo (fuori dai pulsanti)
    this.input.on('pointerup', (_p: unknown, over: unknown[]) => { if (!over.length) forward(); });
  }

  private scenery(page: StoryPage): void {
    new BiomeBackdrop(this, { groundTop: 700, theme: page.theme });
    this.fullRect(COLORS.background, 0.25);
    if (page.foe) {
      this.add.image(page.hero ? 500 : GAME_WIDTH / 2, 720, creatureKey(page.foe)).setOrigin(0.5, 1).setScale((CREATURE_SCALE[page.foe] * 1.2) / TEXTURE_SCALE);
    }
    const run = GameSession.run;
    if (page.hero) {
      const avatar = run?.avatar ?? GameSession.selectedAvatar;
      new HeroRig(this, page.foe ? 200 : GAME_WIDTH / 2, 720, avatar === 'a' ? 'm' : 'f', 1, run ? runLook(run) : undefined).idle();
    }
  }
}

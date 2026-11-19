import '@fontsource/pixelify-sans/700.css';
import { Audio } from '../systems/Audio';
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE } from './config';
import { BootScene } from '../scenes/BootScene';
import { MenuScene } from '../scenes/MenuScene';
import { CharacterSelectScene } from '../scenes/CharacterSelectScene';
import { ExplorationScene } from '../scenes/ExplorationScene';
import { FruitRevealScene } from '../scenes/FruitRevealScene';
import { BattleScene } from '../scenes/BattleScene';
import { RewardScene } from '../scenes/RewardScene';
import { EventScene } from '../scenes/EventScene';
import { SummaryScene } from '../scenes/SummaryScene';
import { NewSeaScene } from '../scenes/NewSeaScene';
import { CollectionScene } from '../scenes/CollectionScene';
import { RecordsScene } from '../scenes/RecordsScene';
import { SettingsScene } from '../scenes/SettingsScene';
import { GameSession } from '../state/GameSession';
import { HeroRig } from '../ui/HeroRig';
import { registerPwa } from './pwa';

async function start(): Promise<void> {
  // I testi Phaser vengono disegnati subito: i font devono essere pronti prima.
  await Promise.allSettled([document.fonts.load('700 30px "Pixelify Sans"')]);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#2c3f9e', // colore della cima del cielo
    scale: {
      // EXPAND: riempie tutto lo schermo anche sui telefoni molto allungati (S23 = 19.5:9);
      // l'area logica 720×1280 resta centrata, l'extra mostra cielo e terreno.
      mode: Phaser.Scale.EXPAND,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH * RENDER_SCALE,
      height: GAME_HEIGHT * RENDER_SCALE,
    },
    input: { activePointers: 2 },
    audio: { noAudio: true }, // suoni e musica sono sintetizzati da systems/Audio.ts
    render: { antialias: true, pixelArt: false },
    scene: [BootScene, MenuScene, CharacterSelectScene, FruitRevealScene, ExplorationScene, BattleScene, RewardScene, EventScene, NewSeaScene, SummaryScene, CollectionScene, RecordsScene, SettingsScene],
  });

  // Esposto solo per il debug da console (es. chrome://inspect sull'S23).
  Audio.init(GameSession.save.data.settings);
  GameSession.startClock();
  (window as unknown as { __game: Phaser.Game; __session: typeof GameSession }).__game = game;
  (window as unknown as { __session: typeof GameSession }).__session = GameSession;
  (window as unknown as { __HeroRig: typeof HeroRig }).__HeroRig = HeroRig;
}

registerPwa();
void start();

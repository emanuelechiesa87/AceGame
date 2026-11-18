import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from './config';
import { BootScene } from '../scenes/BootScene';
import { MenuScene } from '../scenes/MenuScene';
import { CharacterSelectScene } from '../scenes/CharacterSelectScene';
import { ExplorationScene } from '../scenes/ExplorationScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: COLORS.background,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  input: { activePointers: 2 },
  render: { antialias: true, pixelArt: false },
  scene: [BootScene, MenuScene, CharacterSelectScene, ExplorationScene],
});

// Esposto solo per il debug da console (es. chrome://inspect sull'S23).
(window as unknown as { __game: Phaser.Game }).__game = game;

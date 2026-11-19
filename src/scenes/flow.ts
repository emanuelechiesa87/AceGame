import type Phaser from 'phaser';
import type { NodeType } from '../data/areas';
import { GameSession } from '../state/GameSession';

type Go = (key: string, data?: object) => void;

/** Instrada il nodo scelto verso la scena giusta. */
export function enterNode(go: Go, node: NodeType): void {
  GameSession.ctl!.choose(node);
  GameSession.persistRun();
  switch (node) {
    case 'battle': case 'elite': case 'boss': go('Battle', { node }); break;
    case 'chest': go('Reward', { node, mode: 'chest' }); break;
    default: go('Event', { node });
  }
}

/** Chiude il nodo corrente: avanza la mappa, salva, e decide dove andare. */
export function finishNode(go: Go): void {
  const ctl = GameSession.ctl!;
  ctl.advance();
  if (ctl.run.stepIndex >= ctl.run.map.length) {
    // boss sconfitto: si salpa verso il mare successivo, oppure la run è vinta
    if (!ctl.nextArea()) { go('Summary', { result: 'victory' }); return; }
    GameSession.persistRun();
    go('NewSea');
    return;
  }
  GameSession.persistRun();
  go('Exploration');
}

export type SceneWithGo = Phaser.Scene & { go: Go };

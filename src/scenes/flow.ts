import type Phaser from 'phaser';
import type { NodeType } from '../data/areas';
import { GameSession } from '../state/GameSession';
import { nodeScene, resumeTarget } from '../systems/checkpoint';

type Go = (key: string, data?: object, style?: 'flash' | 'wave') => void;

/** Instrada il nodo scelto verso la scena giusta. */
export function enterNode(go: Go, node: NodeType): void {
  GameSession.ctl!.choose(node);
  delete GameSession.run!.pending;
  GameSession.persistRun();
  const t = nodeScene(node);
  if (t.kind === 'scene') go(t.key, t.data, t.key === 'Battle' ? 'wave' : undefined);
}

/** CONTINUA dal menu: si torna nel punto esatto in cui si era rimasti. */
export function resumeNode(go: Go): void {
  const t = resumeTarget(GameSession.run!);
  if (t.kind === 'finish') finishNode(go);
  else go(t.key, t.data);
}

/** Chiude il nodo corrente: avanza la mappa, salva, e decide dove andare. */
export function finishNode(go: Go): void {
  const ctl = GameSession.ctl!;
  ctl.advance();
  // si salva solo insieme alla mappa avanzata: se la run è vinta resta il punto precedente fino al riepilogo
  const pending = ctl.run.pending;
  delete ctl.run.pending;
  if (ctl.run.stepIndex >= ctl.run.map.length) {
    // boss sconfitto: si salpa verso il mare successivo, oppure la run è vinta
    if (!ctl.nextArea()) { ctl.run.pending = pending; go('Story', { id: 'finale', next: 'Summary', nextData: { result: 'victory' } }); return; }
    GameSession.persistRun();
    go('NewSea');
    return;
  }
  GameSession.persistRun();
  go('Exploration');
}

export type SceneWithGo = Phaser.Scene & { go: Go };

import type { NodeType } from '../data/areas';
import type { RunState } from '../types/game';

/** Dove riportare il giocatore quando riprende una run. `finish` = tappa già risolta, va solo chiusa. */
export type ResumeTarget =
  | { kind: 'scene'; key: 'Exploration' | 'Battle' | 'Reward' | 'Event'; data?: object }
  | { kind: 'finish' };

export function nodeScene(node: NodeType): ResumeTarget {
  switch (node) {
    case 'battle': case 'elite': case 'miniboss': case 'boss': return { kind: 'scene', key: 'Battle', data: { node } };
    case 'chest': return { kind: 'scene', key: 'Reward', data: { node, mode: 'chest' } };
    default: return { kind: 'scene', key: 'Event', data: { node } };
  }
}

export function resumeTarget(run: RunState): ResumeTarget {
  const p = run.pending;
  if (p?.phase === 'done') return { kind: 'finish' };
  if (p?.phase === 'reward') return { kind: 'scene', key: 'Reward', data: { node: p.node, mode: 'battle', coins: p.coins, offered: p.offered } };
  if (p?.phase === 'battle') return nodeScene(p.node);
  if (p?.phase === 'shop') return nodeScene('shop');
  // tappa scelta ma senza progressi salvati: si rientra nella stessa (il generatore casuale riparte dallo stesso punto)
  const chosen = run.map[run.stepIndex]?.chosen;
  return chosen ? nodeScene(chosen) : { kind: 'scene', key: 'Exploration' };
}

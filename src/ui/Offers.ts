import Phaser from 'phaser';
import { COLORS } from '../app/config';
import { iconKey } from '../pixel/keys';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { COMPANION_BY_ID } from '../data/companions';
import { FRUIT_BY_ID, fruitAbility } from '../data/fruits';
import { GameSession } from '../state/GameSession';
import { Button } from './Button';
import { addBody, addTitle } from './text';
import { icon, panel } from './widgets';

const RARITY_COLOR: Record<string, number> = { common: 0x6fe08a, rare: 0x5fa8ff, epic: 0xb07bff };
export const RARITY_LABEL: Record<string, string> = { common: 'Comune', rare: 'Raro', epic: 'Epico' };

/** Livello modale che copre la scena e blocca i tocchi sotto. */
export function modal(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0).setDepth(800);
  const shade = scene.add.rectangle(-400, -800, 1520, 2880, COLORS.background, 0.88).setOrigin(0).setInteractive();
  c.add(shade);
  return c;
}

/** Riquadro descrittivo di un frutto (usato in rivelazione, ricompense, sostituzione). */
export function fruitCard(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, id: string, x: number, y: number, w: number, h: number): Phaser.GameObjects.Zone {
  const f = FRUIT_BY_ID.get(id)!;
  parent.add(panel(scene, x - w / 2, y - h / 2, w, h, 0x2f2860));
  const g = scene.add.graphics().lineStyle(6, RARITY_COLOR[f.rarity], 1).strokeRect(x - w / 2 + 14, y - h / 2 + 14, w - 28, h - 28);
  parent.add([
    g,
    icon(scene, x - w / 2 + 70, y, iconKey('fruit', id), 104),
    addTitle(scene, x - w / 2 + 140, y - h / 2 + 34, f.name, 36).setOrigin(0, 0.5),
    addBody(scene, x + w / 2 - 24, y - h / 2 + 34, `${RARITY_LABEL[f.rarity]} · ${fruitAbility(f, 1).cost}⚡`, 20, '#ffcf3a').setOrigin(1, 0.5),
    addBody(scene, x - w / 2 + 140, y + 6, `${fruitAbility(f, 1).name}: ${fruitAbility(f, 1).description}`, 19, '#fff7e6').setOrigin(0, 0.5).setWordWrapWidth(w - 170).setAlign('left'),
    addBody(scene, x - w / 2 + 140, y + h / 2 - 34, `Passiva: ${passiveText(f.passive)}`, 19, '#9be06a').setOrigin(0, 0.5),
  ]);
  return scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
}

export function passiveText(m: { maxHp?: number; atk?: number; def?: number; spd?: number }): string {
  const parts: string[] = [];
  if (m.maxHp) parts.push(`${m.maxHp > 0 ? '+' : ''}${m.maxHp} HP max`);
  if (m.atk) parts.push(`${m.atk > 0 ? '+' : ''}${m.atk} ATT`);
  if (m.def) parts.push(`${m.def > 0 ? '+' : ''}${m.def} DIF`);
  if (m.spd) parts.push(`${m.spd > 0 ? '+' : ''}${m.spd} VEL`);
  return parts.join(', ') || '—';
}

export function offerArtifact(artifactId: string): void {
  GameSession.discover({ artifacts: [artifactId] });
  GameSession.ctl!.gainArtifact(artifactId);
}

/** Recluta un compagno; con squadra piena chiede chi sostituire. */
export function offerCompanion(scene: Phaser.Scene, companionId: string, onDone: (taken: boolean) => void): void {
  const ctl = GameSession.ctl!;
  GameSession.discover({ companions: [companionId] });
  const res = ctl.recruit(companionId);
  if (res !== 'needsReplace') { onDone(res === 'added'); return; }
  const m = modal(scene);
  m.add(addTitle(scene, 360, 200, 'SQUADRA AL COMPLETO', 52));
  m.add(addBody(scene, 360, 270, `Chi lascia il posto a ${COMPANION_BY_ID.get(companionId)!.name}?`, 28, '#fbe9c8'));
  ctl.run.companions.forEach((c, i) => {
    m.add(new Button(scene, 360, 420 + i * 140, COMPANION_BY_ID.get(c.id)!.name.toUpperCase(), () => { ctl.recruit(companionId, c.id); m.destroy(); onDone(true); }, { variant: 'secondary', width: 420 }));
  });
  m.add(new Button(scene, 360, 1000, 'NON RECLUTARE', () => { m.destroy(); onDone(false); }, { variant: 'danger', width: 420 }));
}

export function artifactName(id: string): string { return ARTIFACT_BY_ID.get(id)?.name ?? id; }

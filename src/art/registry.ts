import * as B from './biome';
import { CREATURES } from './creatures';
import { arm, body, eyes, head, leg, mouth, scarfTail, type Eyes, type HeroId, type Mouth } from './heroes';
import { ARTIFACT_ICONS, FRUIT_ICONS, INTENT_ICONS, NODE_ICONS, POTION_ICON, STATUS_ICONS } from './icons';
import { CANVAS } from './svg';

export interface SvgAsset { key: string; svg: string; w: number; h: number; scale?: number }

export const EYES: Eyes[] = ['open', 'closed', 'happy', 'fierce'];
export const MOUTHS: Mouth[] = ['grin', 'shout', 'smirk', 'ouch'];

export const heroKey = (id: HeroId, part: string) => `hero-${id}-${part}`;
export const creatureKey = (id: string, hit = false) => `cr-${id}${hit ? '-hit' : ''}`;
export const iconKey = (group: 'fruit' | 'artifact' | 'node' | 'intent' | 'status' | 'misc', id: string) => `ic-${group}-${id}`;

function heroAssets(id: HeroId): SvgAsset[] {
  const c = (key: string, svg: string): SvgAsset => ({ key: heroKey(id, key), svg, w: CANVAS.w, h: CANVAS.h });
  return [
    c('scarf', scarfTail(id)),
    c('legB', leg(id, false)), c('legF', leg(id, true)),
    c('armB', arm(id, false)), c('armF', arm(id, true)),
    c('body', body(id)), c('head', head(id)),
    ...EYES.map((e) => c(`eyes-${e}`, eyes(id, e))),
    ...MOUTHS.map((m) => c(`mouth-${m}`, mouth(id, m))),
  ];
}

function icons(group: Parameters<typeof iconKey>[0], map: Record<string, string>): SvgAsset[] {
  return Object.entries(map).map(([id, svg]) => ({ key: iconKey(group, id), svg, w: 120, h: 120 }));
}

export function allAssets(): SvgAsset[] {
  return [
    ...heroAssets('m'), ...heroAssets('f'),
    ...Object.entries(CREATURES).flatMap(([id, c]) => [
      { key: creatureKey(id), svg: c.normal, w: c.w, h: c.h },
      { key: creatureKey(id, true), svg: c.hit, w: c.w, h: c.h },
    ]),
    ...icons('fruit', FRUIT_ICONS), ...icons('artifact', ARTIFACT_ICONS), ...icons('node', NODE_ICONS),
    ...icons('intent', INTENT_ICONS), ...icons('status', STATUS_ICONS), ...icons('misc', { potion: POTION_ICON }),
    { key: 'bg-sky', svg: B.sky(), w: B.W, h: 1280 },
    { key: 'bg-clouds', svg: B.clouds(), w: B.W, h: 360 },
    { key: 'bg-mountains', svg: B.mountains(), w: B.W, h: 440 },
    { key: 'bg-hills', svg: B.hills(), w: B.W, h: 380 },
    { key: 'bg-ground', svg: B.ground(), w: B.W, h: 300 },
    { key: 'bg-foreground', svg: B.foreground(), w: B.W, h: 140 },
    { key: 'fx-speedlines', svg: B.speedLines(), w: 1400, h: 1400 },
  ];
}

import type Phaser from 'phaser';
import { block, INK, pixelTexture, shade, type Px } from './render';
import { heroKey, type Eyes, type HeroId, type Mouth } from './keys';

/**
 * Eroi pirata "a blocchi": testa cubica, busto, braccia e gambe rettangolari,
 * ciascuno in una texture separata che ruota attorno al proprio perno.
 * Coordinate in pixel d'arte, origine ai piedi (0,0), y verso l'alto negativa.
 * Forme cubiche generiche e originali: nessun riferimento a personaggi esistenti.
 */

/** Pixel logici per pixel d'arte con il rig a scala 1. */
export const HERO_PX = 8;

export interface PartSpec { x0: number; y0: number; w: number; h: number; pivot: { x: number; y: number } }

export const PARTS: Record<'legB' | 'legF' | 'body' | 'armB' | 'armF' | 'head' | 'tail', PartSpec> = {
  legB: { x0: -5, y0: -12, w: 5, h: 12, pivot: { x: -2.5, y: -12 } },
  legF: { x0: 0, y0: -12, w: 5, h: 12, pivot: { x: 2.5, y: -12 } },
  body: { x0: -5, y0: -24, w: 10, h: 13, pivot: { x: 0, y: -12 } },
  armB: { x0: -8, y0: -24, w: 4, h: 11, pivot: { x: -6, y: -23 } },
  armF: { x0: 4, y0: -24, w: 12, h: 13, pivot: { x: 6, y: -23 } },
  // testa: canvas più grande del cubo 12×12 per cappello/capelli
  head: { x0: -10, y0: -42, w: 20, h: 20, pivot: { x: 0, y: -23 } },
  tail: { x0: -12, y0: -33, w: 7, h: 14, pivot: { x: -6, y: -32 } },
};

interface HeroPal { skin: string; hair: string; top: string; topB: string; trim: string; legs: string; boots: string; belt: string; hat: string; blade: string; hilt: string; eye: string }

export const HERO_PAL: Record<HeroId, HeroPal> = {
  // LUI: bandana rossa, gilet di cuoio su maglia a righe blu notte, pantaloni prugna
  m: { skin: '#ffcfa6', hair: '#7a3b1e', top: '#fff3dc', topB: '#26386b', trim: '#8a5232', legs: '#4a3a66', boots: '#6b3a1e', belt: '#3a2414', hat: '#e4342f', blade: '#dfe7f2', hilt: '#ffcf3a', eye: '#2a7fd4' },
  // LEI: tricorno marrone con piuma, giacca verde mare, fusciacca rossa, pantaloni crema
  f: { skin: '#f4c29a', hair: '#3b2147', top: '#fff3dc', topB: '#1f8a7a', trim: '#ffcf3a', legs: '#efe0bf', boots: '#2a1f2e', belt: '#d6334a', hat: '#6b3a1e', blade: '#dfe7f2', hilt: '#b9c3d6', eye: '#3fae5a' },
};

function part(scene: Phaser.Scene, key: string, spec: PartSpec, draw: (px: Px) => void): void {
  pixelTexture(scene, key, spec.w, spec.h, (px) => draw((x, y, c, w, h) => px(x - spec.x0, y - spec.y0, c, w, h)));
}

export function makeHeroTextures(scene: Phaser.Scene, id: HeroId): void {
  const p = HERO_PAL[id];
  const k = (n: string) => heroKey(id, n);

  // --- gambe: pantaloni + stivali con risvolto ---------------------------------------
  const leg = (front: boolean) => (px: Px) => {
    const x = front ? 0 : -5;
    const legs = front ? p.legs : shade(p.legs, -0.15);
    const boots = front ? p.boots : shade(p.boots, -0.15);
    block(px, x, -12, 5, 8, legs);
    block(px, x, -5, 5, 5, boots);
    px(x + 1, -5, shade(boots, 0.35), 3, 1); // risvolto
  };
  part(scene, k('legB'), PARTS.legB, leg(false));
  part(scene, k('legF'), PARTS.legF, leg(true));

  // --- busto -----------------------------------------------------------------------
  part(scene, k('body'), PARTS.body, (px) => {
    if (id === 'm') {
      block(px, -5, -24, 10, 13, p.top);
      for (let y = -21; y < -13; y += 2) px(-2, y, p.topB, 4, 1); // righe della maglia
      block(px, -5, -24, 3, 11, p.trim, { light: false }); // gilet aperto
      block(px, 2, -24, 3, 11, p.trim, { light: false });
      px(-1, -23, p.skin, 2, 1); // scollo
    } else {
      block(px, -5, -24, 10, 13, p.topB);
      px(-2, -23, p.top, 4, 7); // camicia
      px(-1, -23, p.skin, 2, 1);
      px(-3, -23, p.trim, 1, 9); px(2, -23, p.trim, 1, 9); // bordi dorati della giacca
      px(-4, -19, p.trim, 1, 1); px(3, -19, p.trim, 1, 1); px(-4, -16, p.trim, 1, 1); px(3, -16, p.trim, 1, 1);
    }
    // cintura con fibbia
    px(-5, -14, INK, 10, 3);
    px(-4, -14, p.belt, 8, 2);
    px(-1, -14, '#ffcf3a', 2, 2);
  });

  // --- braccia (quello davanti impugna una sciabola) -----------------------------------
  const sleeve = id === 'm' ? p.top : p.topB;
  part(scene, k('armB'), PARTS.armB, (px) => {
    block(px, -8, -24, 4, 8, shade(sleeve, -0.18));
    block(px, -8, -17, 4, 4, shade(p.skin, -0.12));
  });
  part(scene, k('armF'), PARTS.armF, (px) => {
    // sciabola tenuta in avanti, disegnata prima della mano
    px(8, -16, INK, 8, 3);
    px(9, -15, p.blade, 6, 1);
    px(15, -15, INK, 1, 1);
    px(8, -17, INK, 2, 5); px(8, -16, p.hilt, 1, 3); // guardia
    block(px, 4, -24, 4, 8, sleeve);
    if (id === 'm') { px(5, -21, p.topB, 2, 1); px(5, -19, p.topB, 2, 1); } else px(5, -18, p.trim, 2, 1);
    block(px, 4, -17, 5, 4, p.skin);
  });

  // --- testa cubica + cappello/capelli --------------------------------------------------
  part(scene, k('head'), PARTS.head, (px) => {
    block(px, -6, -35, 12, 12, p.skin);
    px(-5, -27, shade(p.skin, -0.12), 1, 2); // orecchio (lato sinistro: guarda a destra)
    px(4, -28, '#ff9f8a', 1, 1); px(-2, -28, '#ff9f8a', 1, 1); // guance
    if (id === 'm') {
      // capelli a ciuffi squadrati sopra la bandana
      px(-6, -38, INK, 12, 3);
      px(-5, -37, p.hair, 10, 2);
      px(-4, -39, INK, 3, 2); px(-3, -38, p.hair, 1, 1);
      px(0, -40, INK, 3, 3); px(1, -39, p.hair, 1, 2);
      px(4, -39, INK, 3, 2); px(5, -38, p.hair, 1, 1);
      // bandana rossa con pois
      block(px, -7, -36, 14, 4, p.hat, { dark: false });
      px(-4, -34, '#fff3dc', 1, 1); px(1, -34, '#fff3dc', 1, 1); px(5, -35, '#fff3dc', 1, 1);
      // basette
      px(-6, -32, p.hair, 1, 3);
    } else {
      // frangia
      px(-6, -33, p.hair, 12, 2); px(-6, -31, p.hair, 2, 4); px(3, -31, p.hair, 3, 1);
      // tricorno squadrato con bordo dorato e piuma
      block(px, -9, -36, 18, 3, p.hat);
      px(-8, -36, p.trim, 16, 1);
      block(px, -5, -40, 10, 5, p.hat);
      px(-4, -37, p.trim, 8, 1);
      px(-1, -39, '#fff3dc', 2, 2); // stemma inventato: una gemma chiara
      px(-8, -42, INK, 3, 6); px(-7, -41, '#e4342f', 1, 4); // piuma
    }
  });

  // --- coda della bandana (lui) / capelli lunghi (lei): oscilla al vento ---------------------
  part(scene, k('tail'), PARTS.tail, (px) => {
    if (id === 'm') {
      px(-10, -33, INK, 5, 4); px(-9, -32, p.hat, 3, 2);
      px(-12, -30, INK, 4, 5); px(-11, -29, p.hat, 2, 3);
      px(-10, -26, INK, 3, 4); px(-9, -25, shade(p.hat, -0.2), 1, 2);
    } else {
      block(px, -9, -33, 4, 13, p.hair, { light: false });
      px(-8, -32, shade(p.hair, 0.3), 1, 9);
    }
  });

  // --- espressioni: occhi e bocca sovrapposti alla faccia ---------------------------------
  const face = (name: string, draw: (px: Px) => void) => part(scene, k(name), PARTS.head, draw);
  const brow = (px: Px, fierce: boolean) => {
    if (fierce) { px(-3, -31, INK, 2, 1); px(-2, -30, INK, 1, 1); px(2, -31, INK, 2, 1); px(2, -30, INK, 1, 1); }
    else { px(-3, -31, INK, 2, 1); px(2, -31, INK, 2, 1); }
  };
  const EYE_FN: Record<Eyes, (px: Px) => void> = {
    open: (px) => {
      brow(px, false);
      for (const x of [-3, 2]) { px(x, -29, '#ffffff', 1, 2); px(x + 1, -29, INK, 1, 2); px(x + 1, -28, p.eye, 1, 1); }
    },
    closed: (px) => { for (const x of [-3, 2]) px(x, -28, INK, 2, 1); },
    happy: (px) => { for (const x of [-3, 2]) { px(x, -28, INK, 1, 1); px(x + 1, -29, INK, 1, 1); px(x + 2, -28, INK, 1, 1); } },
    fierce: (px) => {
      brow(px, true);
      for (const x of [-3, 2]) { px(x, -29, '#ffffff', 2, 2); px(x + 1, -29, INK, 1, 2); }
    },
  };
  const MOUTH_FN: Record<Mouth, (px: Px) => void> = {
    grin: (px) => { px(-2, -26, INK, 5, 2); px(-1, -26, '#ffffff', 3, 1); },
    shout: (px) => { px(-1, -27, INK, 3, 3); px(0, -26, '#e4342f', 1, 1); },
    smirk: (px) => { px(-1, -26, INK, 3, 1); px(2, -27, INK, 1, 1); },
    ouch: (px) => { px(-2, -26, INK, 1, 1); px(-1, -27, INK, 1, 1); px(0, -26, INK, 1, 1); px(1, -27, INK, 1, 1); px(2, -26, INK, 1, 1); },
  };
  (Object.keys(EYE_FN) as Eyes[]).forEach((e) => face(`eyes-${e}`, EYE_FN[e]));
  (Object.keys(MOUTH_FN) as Mouth[]).forEach((m) => face(`mouth-${m}`, MOUTH_FN[m]));
}

import type Phaser from 'phaser';
import { block, INK, pixelTexture, shade, type Px } from './render';
import { heroKey, type Eyes, type HeroId, type Mouth } from './keys';
import { FRUIT_LOOKS, lookKey, lookStage, type HeroLook } from '../data/fruitLooks';
import { drawCape, drawEmblem, drawHeadBack, drawHeadFront, drawMarks, drawShoulder, type HeadCtx } from './heroLooks';

/**
 * Eroi pirata "a blocchi": testa cubica, busto, braccia e gambe rettangolari,
 * ciascuno in una texture separata che ruota attorno al proprio perno.
 * Coordinate in pixel d'arte, origine ai piedi (0,0), y verso l'alto negativa.
 * Forme cubiche generiche e originali: nessun riferimento a personaggi esistenti.
 */

/** Pixel logici per pixel d'arte con il rig a scala 1 (doppia risoluzione dalla 0.6). */
export const HERO_PX = 4;

export interface PartSpec { x0: number; y0: number; w: number; h: number; pivot: { x: number; y: number } }

export const PARTS: Record<'legB' | 'legF' | 'body' | 'armB' | 'armF' | 'head' | 'tail' | 'cape', PartSpec> = {
  legB: { x0: -10, y0: -24, w: 10, h: 24, pivot: { x: -5, y: -24 } },
  legF: { x0: 0, y0: -24, w: 10, h: 24, pivot: { x: 5, y: -24 } },
  body: { x0: -12, y0: -48, w: 24, h: 26, pivot: { x: 0, y: -24 } },
  // braccia: tela allargata verso l'alto per gli spallacci del frutto
  armB: { x0: -21, y0: -56, w: 16, h: 30, pivot: { x: -12, y: -46 } },
  armF: { x0: 2, y0: -56, w: 30, h: 34, pivot: { x: 12, y: -46 } },
  // testa: tela più grande del cubo 24×24 per cappello, piuma, capelli e accessori del frutto
  head: { x0: -32, y0: -108, w: 64, h: 64, pivot: { x: 0, y: -46 } },
  tail: { x0: -25, y0: -68, w: 15, h: 40, pivot: { x: -12, y: -64 } },
  // mantello del livello V (vuoto negli altri casi)
  cape: { x0: -34, y0: -72, w: 36, h: 72, pivot: { x: -8, y: -47 } },
};

interface HeroPal { skin: string; hair: string; top: string; topB: string; trim: string; legs: string; boots: string; belt: string; hat: string; blade: string; hilt: string; eye: string }

export const HERO_PAL: Record<HeroId, HeroPal> = {
  // LUI: bandana rossa, gilet di cuoio su maglia a righe blu notte, pantaloni prugna
  m: { skin: '#ffcfa6', hair: '#7a3b1e', top: '#fff3dc', topB: '#26386b', trim: '#8a5232', legs: '#4a3a66', boots: '#6b3a1e', belt: '#3a2414', hat: '#e4342f', blade: '#dfe7f2', hilt: '#ffcf3a', eye: '#2a7fd4' },
  // LEI: tricorno marrone con piuma, giacca verde mare, fusciacca rossa, pantaloni crema
  f: { skin: '#f8cfae', hair: '#5a2a4a', top: '#fff3dc', topB: '#1f8a7a', trim: '#ffcf3a', legs: '#efe0bf', boots: '#3a2236', belt: '#e0457b', hat: '#7a3b2e', blade: '#dfe7f2', hilt: '#b9c3d6', eye: '#2fae7a' },
};

function part(scene: Phaser.Scene, key: string, spec: PartSpec, draw: (px: Px) => void): void {
  pixelTexture(scene, key, spec.w, spec.h, (px) => draw((x, y, c, w, h) => px(x - spec.x0, y - spec.y0, c, w, h)));
}

/**
 * Texture dell'eroe. Con `look` (frutto + livello) si ottiene la variante "contagiata" dal frutto:
 * colori, segni, accessori e mantello crescono a ogni Risveglio (vedi data/fruitLooks.ts).
 * Le texture sono create una volta sola per variante e restano in cache.
 */
export function makeHeroTextures(scene: Phaser.Scene, id: HeroId, look?: HeroLook | null): void {
  const variant = lookKey(look);
  const k = (n: string) => heroKey(id, n, variant);
  if (scene.textures.exists(k('mouth-ouch'))) return;
  const lk = variant ? FRUIT_LOOKS[look!.fruitId] : undefined;
  const level = variant ? Math.min(5, look!.level) : 0;
  const st = lookStage(level);
  const p: HeroPal = { ...HERO_PAL[id] };
  if (lk) {
    // I: bandana / cappello e cintura del frutto
    if (id === 'm') { p.hat = lk.main; p.belt = lk.dark; } else { p.hat = lk.dark; p.belt = lk.main; }
    // II: occhi e bordi
    if (st.eyes) { p.eye = lk.eye; if (id === 'f') p.trim = lk.light; else p.hilt = lk.light; }
    // IV: capelli e abiti
    if (st.hair) p.hair = lk.hair;
    if (st.clothes) {
      if (id === 'm') { p.topB = lk.main; p.trim = lk.dark; p.legs = shade(lk.dark, -0.25); }
      else { p.topB = lk.dark; p.legs = shade(lk.light, -0.12); p.boots = shade(lk.dark, -0.35); }
      p.blade = lk.light;
    }
  }
  // piuma, nastro e fiocco di LEI prendono il colore del frutto
  const ACC = lk ? lk.main : '#ff6fa8';
  const ACC_L = lk ? lk.light : '#ffd6e6';
  const headCtx: HeadCtx | undefined = lk ? { lk, s: st.headSize as 1 | 2 | 3, female: id === 'f', level } : undefined;
  const GOLD = '#ffcf3a';

  // --- gambe: pantaloni con cucitura e piega, stivali con risvolto e suola ---------------------
  const leg = (front: boolean) => (px: Px) => {
    const x = front ? 0 : -10;
    const legs = front ? p.legs : shade(p.legs, -0.15);
    const boots = front ? p.boots : shade(p.boots, -0.15);
    if (id === 'f') {
      // gamba snella, stivali alti al ginocchio con fibbia e tacco
      block(px, x + 1, -24, 8, 12, legs);
      px(x + 3, -22, shade(legs, 0.25), 1, 9);
      block(px, x, -14, 10, 14, boots);
      px(x + 1, -14, shade(boots, 0.45), 8, 2); px(x + 1, -12, shade(boots, -0.3), 8, 1); // risvolto
      px(x + 2, -11, shade(boots, 0.3), 1, 8); // riflesso del cuoio
      px(x + 5, -9, INK, 3, 3); px(x + 6, -8, GOLD, 1, 1); // fibbia
      px(x + 1, -2, shade(boots, -0.45), 9, 1); px(x + 6, -2, INK, 4, 2); // suola e tacco
    } else {
      block(px, x, -24, 10, 15, legs);
      px(x + 6, -22, shade(legs, -0.25), 1, 12); // cucitura
      px(x + 2, -16, shade(legs, 0.22), 2, 1); px(x + 3, -15, shade(legs, 0.22), 2, 1); // piega al ginocchio
      block(px, x, -10, 10, 10, boots);
      px(x - 0, -10, INK, 10, 1); px(x + 1, -9, shade(boots, 0.4), 8, 2); // risvolto
      px(x + 2, -7, shade(boots, 0.25), 1, 4);
      px(x + 1, -2, shade(boots, -0.45), 9, 1);
    }
  };
  part(scene, k('legB'), PARTS.legB, leg(false));
  part(scene, k('legF'), PARTS.legF, leg(true));

  // --- busto -----------------------------------------------------------------------
  part(scene, k('body'), PARTS.body, (px) => {
    if (id === 'm') {
      block(px, -10, -48, 20, 26, p.top);
      for (let y = -45; y < -30; y += 4) px(-4, y, p.topB, 8, 2); // righe della maglia
      px(-4, -45, shade(p.topB, 0.3), 2, 1);
      // gilet aperto con revers chiaro e bottoni
      block(px, -10, -48, 7, 22, p.trim, { light: false });
      block(px, 3, -48, 7, 22, p.trim, { light: false });
      px(-4, -47, shade(p.trim, 0.35), 1, 20); px(3, -47, shade(p.trim, 0.35), 1, 20);
      px(-9, -47, shade(p.trim, 0.2), 1, 18);
      for (const y of [-42, -37]) { px(-6, y, GOLD, 2, 2); px(-6, y + 1, shade(GOLD, -0.35), 2, 1); }
      // scollo a V
      px(-3, -48, p.skin, 6, 1); px(-2, -47, p.skin, 4, 1); px(-1, -46, p.skin, 2, 1);
      // cintura con fibbia d'oro
      px(-10, -30, INK, 20, 6);
      px(-9, -29, p.belt, 18, 4); px(-9, -29, shade(p.belt, 0.3), 18, 1);
      px(-3, -30, INK, 6, 6); px(-2, -29, GOLD, 4, 4); px(-1, -28, p.belt, 2, 2); px(-2, -29, '#fff3b0', 1, 1);
      px(-10, -24, shade(p.legs, -0.1), 20, 2);
      if (lk) drawEmblem(px, lk, 6, -41);
      return;
    }
    // LEI: giacca sciancrata (spalle strette, vita stretta, falde svasate sui fianchi)
    px(-9, -48, INK, 18, 17); px(-7, -32, INK, 14, 6); px(-12, -28, INK, 24, 6);
    px(-8, -47, p.topB, 16, 15); px(-6, -32, p.topB, 12, 5); px(-11, -27, p.topB, 22, 4);
    px(-8, -47, shade(p.topB, 0.32), 16, 1); px(7, -46, shade(p.topB, -0.22), 1, 14); px(10, -27, shade(p.topB, -0.22), 1, 4);
    px(-10, -26, shade(p.topB, 0.18), 3, 2);
    // camicetta con jabot a balze
    px(-4, -47, p.top, 8, 10);
    for (let y = -46; y < -38; y += 2) { px(-2, y, '#ffffff', 2, 1); px(0, y + 1, '#ffffff', 2, 1); }
    px(-2, -48, p.skin, 4, 2);
    // bordi e bottoni dorati
    px(-5, -46, p.trim, 1, 13); px(4, -46, p.trim, 1, 13);
    for (const y of [-43, -39, -35]) { px(-7, y, GOLD, 1, 1); px(6, y, GOLD, 1, 1); }
    px(-11, -24, p.trim, 22, 1); // orlo delle falde
    // fusciacca rosa con fiocco
    px(-7, -32, p.belt, 14, 4); px(-7, -32, shade(p.belt, 0.3), 14, 1);
    px(5, -33, INK, 6, 6); px(6, -32, p.belt, 2, 4); px(8, -31, shade(p.belt, -0.25), 2, 2); px(7, -31, INK, 1, 2);
    if (lk) drawEmblem(px, lk, -6, -40);
  });

  // --- braccia (quello davanti impugna una sciabola) -----------------------------------
  const sleeve = id === 'm' ? p.top : p.topB;
  part(scene, k('armB'), PARTS.armB, (px) => {
    block(px, -16, -48, 8, 15, shade(sleeve, -0.18));
    if (id === 'm') for (const y of [-44, -39]) px(-15, y, shade(p.topB, -0.15), 6, 2);
    else px(-15, -35, shade(p.trim, -0.2), 6, 1);
    block(px, -16, -34, 8, 8, shade(p.skin, -0.12));
    if (lk && st.shoulders >= 2) drawShoulder(px, { ...lk, main: shade(lk.main, -0.15), light: shade(lk.light, -0.1) }, lk.shoulder, -12, -48, true);
  });
  part(scene, k('armF'), PARTS.armF, (px) => {
    // sciabola tenuta in avanti, disegnata prima della mano
    px(16, -32, INK, 14, 5); px(29, -31, INK, 2, 3); px(30, -30, INK, 1, 1);
    px(17, -31, '#ffffff', 12, 1); px(17, -30, p.blade, 13, 1); px(17, -29, shade(p.blade, -0.2), 12, 1);
    px(19, -30, shade(p.blade, -0.35), 8, 1); // scanalatura
    px(15, -35, INK, 4, 11); px(16, -34, p.hilt, 2, 9); px(16, -34, shade(p.hilt, 0.4), 1, 4); // guardia
    block(px, 7, -48, 9, 16, sleeve);
    if (id === 'm') { for (const y of [-44, -39]) px(8, y, p.topB, 7, 2); }
    else { px(8, -36, p.trim, 7, 2); px(8, -35, shade(p.trim, -0.3), 7, 1); }
    block(px, 7, -34, 10, 8, p.skin);
    px(9, -31, shade(p.skin, -0.2), 6, 1); // nocche
    if (lk && st.shoulders >= 1) drawShoulder(px, lk, lk.shoulder, 12, -48, st.shoulderSize === 2);
    // V: segno luminoso sull'avambraccio
    if (lk && level >= 5) { px(8, -33, lk.glow, 8, 1); px(10, -32, lk.main, 4, 1); }
  });

  // --- testa cubica + cappello/capelli --------------------------------------------------
  part(scene, k('head'), PARTS.head, (px) => {
    if (headCtx) drawHeadBack(px, headCtx);
    block(px, -12, -70, 24, 24, p.skin);
    px(-11, -69, shade(p.skin, 0.2), 4, 6); // luce sulla tempia
    px(-11, -57, INK, 4, 6); px(-10, -56, shade(p.skin, -0.12), 2, 4); px(-10, -55, shade(p.skin, -0.3), 1, 2); // orecchio
    px(3, -55, shade(p.skin, -0.18), 2, 1); // naso (guarda a destra)
    if (id === 'f') { px(4, -53, '#ff9ab0', 4, 2); px(-8, -53, '#ff9ab0', 3, 2); } else { px(6, -53, '#ff9f8a', 2, 1); px(-6, -53, '#ff9f8a', 2, 1); }
    if (id === 'm') {
      // capelli a ciuffi squadrati sopra la bandana
      px(-12, -77, INK, 24, 6); px(-11, -76, p.hair, 22, 4);
      for (const [x, y, w, h] of [[-10, -81, 6, 5], [-2, -84, 7, 8], [7, -80, 6, 4]]) { px(x, y, INK, w, h); px(x + 1, y + 1, p.hair, w - 2, h - 1); px(x + 1, y + 1, shade(p.hair, 0.3), 1, h - 2); }
      // bandana rossa con pois e piega
      block(px, -14, -73, 28, 8, p.hat, { dark: false });
      px(-13, -67, shade(p.hat, -0.3), 26, 1);
      for (const [x, y] of [[-9, -71], [-1, -70], [6, -71], [10, -68], [-5, -68]]) px(x, y, lk ? lk.light : '#fff3dc', 2, 2);
      // basette
      px(-12, -65, p.hair, 3, 7); px(-12, -65, shade(p.hair, -0.3), 1, 7);
      if (lk && st.eyes) drawMarks(px, lk, level);
      if (headCtx) drawHeadFront(px, headCtx);
      return;
    }
    // LEI: capelli lunghi che incorniciano il viso fino alle spalle
    px(-15, -69, INK, 6, 25); px(-14, -68, p.hair, 4, 23);
    px(9, -69, INK, 6, 23); px(10, -68, p.hair, 4, 21);
    px(-13, -66, shade(p.hair, 0.35), 1, 16); px(11, -66, shade(p.hair, 0.35), 1, 12); // riflessi
    px(-14, -45, INK, 4, 1); px(11, -47, INK, 3, 1);
    // frangia a ciocche
    px(-12, -69, p.hair, 24, 4);
    px(-11, -65, p.hair, 6, 2); px(-10, -63, p.hair, 3, 1); px(2, -65, p.hair, 7, 2); px(6, -63, p.hair, 3, 2);
    px(-6, -68, shade(p.hair, 0.3), 6, 1);
    // orecchino dorato
    px(-11, -50, GOLD, 2, 3); px(-11, -48, shade(GOLD, -0.3), 2, 1);
    // piuma rosa distesa all'indietro (dietro al cappello)
    px(-25, -84, INK, 18, 8); px(-24, -83, ACC, 16, 6);
    px(-24, -83, ACC_L, 7, 2); px(-23, -80, shade(ACC, -0.2), 14, 1); px(-22, -82, '#ffffff', 12, 1);
    px(-26, -86, INK, 6, 4); px(-25, -85, ACC, 3, 2);
    // cappello piumato a falda larga con nastro rosa e gemma
    block(px, -18, -75, 36, 6, p.hat);
    px(-17, -75, shade(p.hat, 0.35), 34, 1);
    block(px, -10, -84, 20, 10, p.hat);
    px(-9, -83, shade(p.hat, 0.3), 3, 7);
    px(-9, -77, ACC, 18, 2); px(-9, -77, ACC_L, 18, 1);
    px(-2, -82, INK, 5, 4); px(-1, -81, lk ? lk.light : '#fff3dc', 3, 2); px(-1, -81, '#ffffff', 1, 1);
    if (lk && st.eyes) drawMarks(px, lk, level);
    if (headCtx) drawHeadFront(px, headCtx);
  });

  // --- coda della bandana (lui) / coda di capelli (lei): oscilla al vento ---------------------
  part(scene, k('tail'), PARTS.tail, (px) => {
    if (id === 'm') {
      const dot = lk ? lk.light : '#fff3dc';
      px(-20, -67, INK, 9, 8); px(-19, -66, p.hat, 7, 6); px(-17, -64, dot, 2, 2);
      px(-24, -60, INK, 8, 10); px(-23, -59, p.hat, 6, 8); px(-22, -56, dot, 2, 2);
      px(-21, -51, INK, 6, 8); px(-20, -50, shade(p.hat, -0.2), 4, 6);
    } else {
      // coda lunga e ondulata con fiocco rosa
      block(px, -19, -61, 9, 18, p.hair, { light: false });
      block(px, -21, -45, 9, 13, p.hair, { light: false });
      px(-17, -59, shade(p.hair, 0.35), 2, 14); px(-19, -43, shade(p.hair, 0.35), 2, 8);
      px(-20, -33, INK, 6, 3); px(-19, -33, p.hair, 4, 2);
      px(-20, -66, INK, 10, 7); px(-19, -65, ACC, 8, 5); px(-19, -65, ACC_L, 3, 1); px(-16, -65, INK, 2, 5); // fiocco
    }
  });

  // --- mantello (solo al V) ---------------------------------------------------------------
  part(scene, k('cape'), PARTS.cape, (px) => { if (lk && st.cape) drawCape(px, lk, lk.cape); });

  // --- espressioni: occhi e bocca sovrapposti alla faccia ---------------------------------
  const face = (name: string, draw: (px: Px) => void) => part(scene, k(name), PARTS.head, draw);
  const EX = [-7, 3]; // x dell'angolo sinistro di ciascun occhio
  const lashes = (px: Px) => { if (id === 'f') { px(-8, -62, INK, 1, 1); px(-7, -61, INK, 4, 1); px(3, -61, INK, 4, 1); px(7, -62, INK, 1, 1); } };
  const EYE_FN: Record<Eyes, (px: Px) => void> = {
    open: (px) => {
      if (st.glowEyes && lk) {
        lashes(px);
        // occhi luminosi: bianco acceso, pupilla del frutto e scia di luce verso l'esterno
        for (const x of EX) { px(x, -63, INK, 4, 1); px(x, -60, lk.glow, 4, 4); px(x + 2, -60, lk.eye, 2, 4); px(x + 2, -60, '#ffffff', 1, 1); }
        px(-9, -60, lk.eye, 2, 1); px(-10, -61, shade(lk.eye, 0.3), 1, 1); px(7, -60, lk.eye, 2, 1); px(9, -61, shade(lk.eye, 0.3), 1, 1);
        return;
      }
      if (id === 'f') {
        lashes(px);
        for (const x of EX) { px(x, -64, shade(p.hair, -0.1), 4, 1); px(x, -60, '#ffffff', 4, 5); px(x + 1, -60, p.eye, 3, 5); px(x + 2, -59, INK, 2, 3); px(x + 1, -60, '#ffffff', 1, 1); px(x + 1, -56, shade(p.eye, 0.4), 2, 1); }
        return;
      }
      for (const x of EX) { px(x, -63, INK, 4, 1); px(x, -60, '#ffffff', 4, 4); px(x + 2, -60, INK, 2, 4); px(x + 2, -58, p.eye, 2, 1); px(x + 2, -60, '#ffffff', 1, 1); }
    },
    closed: (px) => { lashes(px); for (const x of EX) px(x, -57, INK, 4, 1); },
    happy: (px) => { lashes(px); for (const x of EX) { px(x, -57, INK, 1, 1); px(x + 1, -58, INK, 2, 1); px(x + 3, -57, INK, 1, 1); } },
    fierce: (px) => {
      lashes(px);
      // sopracciglia inclinate verso il centro
      px(-8, -64, INK, 2, 1); px(-6, -63, INK, 2, 1); px(-4, -62, INK, 1, 1);
      px(5, -64, INK, 2, 1); px(3, -63, INK, 2, 1); px(3, -62, INK, 1, 1);
      for (const x of EX) {
        if (st.glowEyes && lk) { px(x, -60, lk.glow, 4, 3); px(x + 2, -60, lk.eye, 2, 3); continue; }
        px(x, -60, '#ffffff', 4, 3); px(x + 2, -60, INK, 2, 3); if (id === 'f') px(x + 1, -60, p.eye, 1, 3);
      }
    },
  };
  // lei: labbra rosa, bocca più piccola
  const lip = id === 'f' ? '#d6456e' : INK;
  const MOUTH_FN: Record<Mouth, (px: Px) => void> = {
    grin: (px) => {
      if (id === 'f') { px(-3, -52, lip, 7, 1); px(-4, -53, lip, 1, 1); px(4, -53, lip, 1, 1); px(-2, -51, shade(lip, 0.35), 5, 1); return; }
      px(-4, -54, INK, 9, 4); px(-3, -53, '#ffffff', 7, 1); px(-2, -52, '#e05a5a', 5, 1);
    },
    shout: (px) => { px(-2, -55, lip, 6, 5); px(-1, -54, '#8a1e2a', 4, 3); px(-1, -52, '#ff6b8a', 4, 1); px(-1, -54, '#ffffff', 4, 1); },
    smirk: (px) => {
      if (id === 'f') { px(-2, -52, lip, 4, 1); px(2, -53, lip, 2, 1); px(-1, -51, shade(lip, 0.35), 3, 1); return; }
      px(-3, -52, INK, 6, 1); px(3, -53, INK, 2, 1);
    },
    ouch: (px) => { for (let x = -4; x <= 4; x++) px(x, x % 2 ? -53 : -52, INK, 1, 1); },
  };
  (Object.keys(EYE_FN) as Eyes[]).forEach((e) => face(`eyes-${e}`, EYE_FN[e]));
  (Object.keys(MOUTH_FN) as Mouth[]).forEach((m) => face(`mouth-${m}`, MOUTH_FN[m]));
}

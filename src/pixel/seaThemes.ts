import type Phaser from 'phaser';
import type { BackdropTheme } from '../data/areas';
import { CLOUDS_H, ISLAND_H, SEA_H, SKY_H, W } from './backgrounds';
import { pixelTexture, shade, type Px } from './render';

/**
 * Scenari dei mari 2-4: cielo, astro, nuvole/nebbia, orizzonte e acqua propri.
 * Il pontile e il ponte della nave restano quelli del porto (tinti dall'area):
 * la ciurma viaggia sempre sulla stessa nave. Stesse regole di `backgrounds.ts`:
 * strati larghi W che si ripetono senza giunture.
 */
export const THEME_KEYS = (t: BackdropTheme) => {
  const sfx = t === 'port' ? '' : `-${t}`;
  return { sky: `px-sky${sfx}`, sun: `px-sun${sfx}`, clouds: `px-clouds${sfx}`, island: `px-island${sfx}`, sea: `px-sea${sfx}` };
};

/** Colore della cima del cielo (riempie gli schermi molto alti). */
export const SKY_TOPS: Record<BackdropTheme, string> = { port: '#2c3f9e', reef: '#1c9ab8', abyss: '#070820', graveyard: '#241d30' };

function rnd(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const wrap = (px: Px): Px => (x, y, c, w = 1, h = 1) => { for (const dx of [-W, 0, W]) px(x + dx, y, c, w, h); };

function sky(scene: Phaser.Scene, key: string, bands: string[], stars: number, starCol: string, seed: number): void {
  pixelTexture(scene, key, W, SKY_H, (px) => {
    const bh = SKY_H / bands.length;
    bands.forEach((c, i) => px(0, i * bh, c, W, bh + 1));
    for (let i = 1; i < bands.length; i++) {
      const y = i * bh;
      for (let x = 0; x < W; x += 2) { px(x + (i % 2), y - 2, bands[i]); px(x + ((i + 1) % 2), y - 1, bands[i]); px(x + (i % 2), y, bands[i - 1]); }
      for (let x = 0; x < W; x += 4) { px(x, y - 4, bands[i]); px(x + 2, y + 2, bands[i - 1]); }
    }
    const r = rnd(seed);
    for (let i = 0; i < stars; i++) {
      const x = Math.floor(r() * W), y = Math.floor(r() * SKY_H * 0.55);
      px(x, y, i % 7 ? starCol : '#ffffff');
      if (i % 11 === 0) { px(x - 1, y, shade(starCol, -0.3)); px(x + 1, y, shade(starCol, -0.3)); px(x, y - 1, shade(starCol, -0.3)); px(x, y + 1, shade(starCol, -0.3)); }
    }
  });
}

/** Disco (sole o luna) con alone e, per la luna, crateri. */
function orb(scene: Phaser.Scene, key: string, rim: string, mid: string, core: string, craters: string | null): void {
  pixelTexture(scene, key, 48, 48, (px) => {
    for (let y = -23; y <= 23; y++) for (let x = -23; x <= 23; x++) {
      const d = x * x + y * y;
      if (d > 529) continue;
      px(24 + x, 24 + y, d > 460 ? rim : d > 380 ? mid : (x + y < -18 && d < 200) ? '#ffffff' : core);
    }
    if (craters) for (const [cx, cy, r] of [[30, 18, 4], [18, 30, 3], [28, 32, 2], [16, 16, 2]]) {
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) px(cx + x, cy + y, craters);
    }
  });
}

export function makeSeaThemeTextures(scene: Phaser.Scene): void {
  reef(scene);
  abyss(scene);
  graveyard(scene);
}

// --- Scogliera dei Coralli: giorno tropicale, coralli che spuntano dall'acqua turchese -------
function reef(scene: Phaser.Scene): void {
  const k = THEME_KEYS('reef');
  sky(scene, k.sky, ['#1c9ab8', '#22a8c4', '#2bb6cf', '#3bc4da', '#54d0e2', '#74dbe8', '#99e6ee', '#c3f0f0', '#ffe3b8', '#ffd0a0'], 20, '#e3fafc', 21);
  orb(scene, k.sun, '#ffb43a', '#ffd43b', '#fff6c8', null);
  pixelTexture(scene, k.clouds, W, CLOUDS_H, (p) => {
    const px = wrap(p), r = rnd(22);
    for (let i = 0; i < 3; i++) {
      const cx = Math.floor(i * 120 + r() * 40), cy = Math.floor(40 + r() * 40), w = Math.floor(50 + r() * 30);
      px(cx + 4, cy - 8, '#ffffff', w - 18, 8); px(cx + 12, cy - 14, '#ffffff', w - 40, 6);
      px(cx, cy, '#ffffff', w, 10); px(cx + 2, cy + 10, '#d3f4f9', w - 4, 3);
    }
  });
  pixelTexture(scene, k.island, W, ISLAND_H, (p) => {
    const px = wrap(p), r = rnd(23);
    // isolotto roccioso con arco naturale
    for (let x = 30; x < 150; x++) {
      const h = Math.round(46 - Math.abs(x - 90) * 0.55 + Math.sin(x / 5) * 2);
      if (h <= 0) continue;
      const hole = x > 70 && x < 104 && 96 - h < 80;
      px(x, 96 - h, '#7a6a5a', 1, hole ? Math.max(0, 80 - (96 - h) - Math.round(14 - Math.abs(x - 87) * 0.8)) : h);
      px(x, 96 - h, '#a8967e', 1, 2);
      if (x % 4 === 0) px(x, 96 - h + 6 + (x % 7), '#5e5044', 1, 3);
    }
    px(56, 50, '#4caf50', 30, 3); px(60, 47, '#66bb6a', 20, 3); // ciuffo verde in cima
    // coralli ramificati che emergono dall'acqua
    const coral = (x0: number, base: string, height: number) => {
      const branch = (x: number, y: number, len: number, dir: number, depth: number) => {
        for (let i = 0; i < len; i++) {
          const xx = x + Math.round((i * dir) / 2), yy = y - i;
          px(xx - 1, yy, shade(base, -0.35), 3, 1); px(xx, yy, i % 3 ? base : shade(base, 0.25), 1, 1);
          if (depth > 0 && i === Math.floor(len / 2)) branch(xx, yy, Math.floor(len * 0.6), dir === 0 ? 1 : -dir, depth - 1);
        }
        px(x + Math.round((len * dir) / 2) - 1, y - len - 1, shade(base, 0.4), 3, 2);
      };
      branch(x0, 95, height, 0, 2); branch(x0 - 2, 95, Math.floor(height * 0.7), -1, 1); branch(x0 + 2, 95, Math.floor(height * 0.75), 1, 1);
    };
    coral(186, '#ff6b8a', 26); coral(214, '#ff9f43', 18); coral(250, '#e64980', 30); coral(300, '#ff8787', 20); coral(336, '#f783ac', 24);
    // rocce tondeggianti e spruzzi
    for (let i = 0; i < 8; i++) { const x = 160 + Math.floor(r() * 190); px(x, 90, '#5e5044', 8 + (i % 3) * 4, 6); px(x + 1, 90, '#8a7a68', 4, 1); }
    for (let i = 0; i < 14; i++) px(150 + ((i * 29) % 210), 92 - (i % 4), '#ffffff', 2, 1);
  });
  pixelTexture(scene, k.sea, W, SEA_H, (p) => {
    const px = wrap(p);
    px(0, 0, '#15aabf', W, SEA_H); px(0, 34, '#1098ad', W, 44); px(0, 78, '#0c8599', W, 42);
    for (let x = 0; x < W; x += 2) { px(x, 33, '#15aabf'); px(x + 1, 77, '#1098ad'); }
    // riflessi luminosi (caustiche) e creste
    for (let x = 0; x < W; x += 20) {
      const a = (x / 20) % 4;
      px(x, 5 + a * 2, '#c5f6fa', 10, 1); px(x + 3, 4 + a * 2, '#ffffff', 4, 1);
      px(x + 8, 24 + a * 3, '#66d9e8', 8, 1); px(x + 2, 50 + a * 4, '#3bc9db', 6, 1); px(x + 12, 90 + a * 3, '#22b8cf', 5, 1);
    }
    // macchie di corallo sotto il pelo dell'acqua
    for (let i = 0; i < 10; i++) { const x = (i * 41) % W, y = 60 + ((i * 17) % 50); px(x, y, '#e8789a', 6, 2); px(x + 1, y - 1, '#f7a3bd', 3, 1); }
  });
}

// --- Abisso Luminoso: notte stellata, guglie scure e luci bioluminescenti ---------------------
function abyss(scene: Phaser.Scene): void {
  const k = THEME_KEYS('abyss');
  sky(scene, k.sky, ['#070820', '#0b0d2e', '#0f123c', '#13174a', '#181d58', '#1e2466', '#262b72', '#2f2f7c', '#3a3184', '#46318a'], 160, '#c5f6fa', 31);
  orb(scene, k.sun, '#3bc9db', '#99e9f2', '#e3fafc', '#a5d8e0');
  pixelTexture(scene, k.clouds, W, CLOUDS_H, (p) => {
    const px = wrap(p), r = rnd(32);
    // aurora a nastri
    for (let x = 0; x < W; x++) {
      const y = 40 + Math.round(Math.sin(x / 23) * 14 + Math.sin(x / 9) * 4);
      const c = x % 3 === 0 ? '#38d9a9' : '#20c997';
      px(x, y, c, 1, 2); if (x % 2 === 0) px(x, y + 3, '#12b886', 1, 1);
      if (r() < 0.25) px(x, y - 4 - Math.floor(r() * 10), '#63e6be', 1, 1);
    }
  });
  pixelTexture(scene, k.island, W, ISLAND_H, (p) => {
    const px = wrap(p), r = rnd(33);
    // guglie di roccia nera, con venature luminose
    const spire = (x0: number, w: number, h: number) => {
      for (let i = 0; i < h; i++) {
        const half = Math.max(1, Math.round((w / 2) * (1 - i / h) + Math.sin(i / 3) * 1));
        px(x0 - half, 95 - i, '#141632', half * 2, 1);
        px(x0 - half, 95 - i, '#262a52', 1, 1);
      }
      for (let i = 4; i < h - 4; i += 5) px(x0 - 1 + ((i * 3) % 3), 95 - i, i % 2 ? '#3bc9db' : '#b197fc', 2, 1);
    };
    spire(40, 26, 70); spire(70, 18, 48); spire(150, 30, 84); spire(184, 16, 40); spire(268, 22, 60); spire(320, 14, 36);
    // funghi e meduse luminose che galleggiano sull'orizzonte
    for (let i = 0; i < 16; i++) {
      const x = Math.floor(r() * W), y = 40 + Math.floor(r() * 46), c = i % 3 === 0 ? '#ff8cc6' : i % 3 === 1 ? '#66d9e8' : '#b2f2bb';
      px(x - 2, y, c, 5, 2); px(x - 1, y - 1, shade(c, 0.5), 3, 1); px(x, y + 2, shade(c, -0.3), 1, 3);
      px(x - 3, y - 2, shade(c, -0.6), 7, 1);
    }
    px(0, 94, '#0b0d2e', W, 2);
  });
  pixelTexture(scene, k.sea, W, SEA_H, (p) => {
    const px = wrap(p), r = rnd(34);
    px(0, 0, '#0b1a45', W, SEA_H); px(0, 34, '#091538', W, 44); px(0, 78, '#06102b', W, 42);
    for (let x = 0; x < W; x += 2) { px(x, 33, '#0b1a45'); px(x + 1, 77, '#091538'); }
    // riflesso della luna e plancton luminoso
    for (let y = 2; y < 50; y += 3) { const w = 14 - Math.floor(y / 5); px(270 - w / 2 + ((y * 7) % 5) - 2, y, '#99e9f2', w, 1); }
    for (let i = 0; i < 90; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * SEA_H); px(x, y, i % 4 ? '#3bc9db' : '#c3fae8'); }
    for (let x = 0; x < W; x += 26) px(x, 8 + (x % 3) * 4, '#4263eb', 10, 1);
  });
}

// --- Cimitero delle Navi: crepuscolo nebbioso, relitti spezzati e acqua torbida --------------
function graveyard(scene: Phaser.Scene): void {
  const k = THEME_KEYS('graveyard');
  sky(scene, k.sky, ['#241d30', '#2e2540', '#3a2f4c', '#4a3d5a', '#5c4d6a', '#6e5e78', '#857388', '#9d8a98', '#b8a4a8', '#cdb9b0'], 50, '#e6dcf0', 41);
  orb(scene, k.sun, '#c9bfd8', '#ddd4ea', '#f4effa', '#c2b8d0');
  pixelTexture(scene, k.clouds, W, CLOUDS_H, (p) => {
    const px = wrap(p), r = rnd(42);
    // banchi di nebbia a strisce sfrangiate
    for (const [y, c] of [[30, '#a99bb0'], [58, '#bfb2c0'], [80, '#d2c6cc']] as [number, string][]) {
      for (let x = 0; x < W; x += 3) {
        const h = 2 + Math.floor(r() * 4);
        if (r() < 0.75) px(x, y - Math.floor(h / 2), c, 3, h);
      }
    }
  });
  pixelTexture(scene, k.island, W, ISLAND_H, (p) => {
    const px = wrap(p);
    const hullC = '#3d3040', dark = '#2a2030', sail = '#8a7f88';
    // scafo inclinato
    const hull = (x0: number, w: number, tilt: number) => {
      for (let i = 0; i < w; i++) {
        const top = 82 - Math.round(i * tilt) - (i < 8 ? 8 - i : 0);
        px(x0 + i, top, hullC, 1, 96 - top);
        px(x0 + i, top, '#5a4a5a', 1, 1);
        if (i % 9 === 4) px(x0 + i, top + 4, '#c8a050', 2, 2); // oblò spento... o quasi
      }
    };
    hull(20, 70, 0.18); hull(200, 54, -0.12);
    // alberi spezzati con vele strappate e cime pendenti
    const mast = (x: number, top: number, lean: number, torn: boolean) => {
      for (let y = top; y < 82; y++) px(x + Math.round(((y - top) * lean) / 20), y, dark, 2, 1);
      if (torn) {
        for (let r = 0; r < 18; r++) { const w = 16 - Math.abs(r - 8); px(x + 2, top + 6 + r, r % 5 === 4 ? '#6e6470' : sail, Math.max(2, w - (r % 3)), 1); }
        px(x + 10, top + 12, dark, 4, 3);
      }
      px(x - 8, top + 4, dark, 18, 2);
      for (let i = 0; i < 12; i++) px(x - 8 + i, top + 6 + Math.round(i * 1.4), '#5a4a5a');
    };
    mast(46, 20, 2, true); mast(76, 40, -3, false); mast(222, 28, -2, true); mast(300, 50, 4, false);
    // prua che emerge in verticale, quasi affondata
    for (let i = 0; i < 30; i++) px(330 + Math.round(i / 6), 96 - i, hullC, 10 - Math.round(i / 5), 1);
    px(0, 92, '#4a4250', W, 4); px(0, 92, '#6a6070', W, 1);
  });
  pixelTexture(scene, k.sea, W, SEA_H, (p) => {
    const px = wrap(p), r = rnd(44);
    px(0, 0, '#4a5a58', W, SEA_H); px(0, 34, '#3e4e4c', W, 44); px(0, 78, '#334240', W, 42);
    for (let x = 0; x < W; x += 2) { px(x, 33, '#4a5a58'); px(x + 1, 77, '#3e4e4c'); }
    for (let x = 0; x < W; x += 22) { const a = (x / 22) % 3; px(x, 6 + a * 3, '#7a8a86', 9, 1); px(x + 10, 40 + a * 5, '#5e6e6a', 7, 1); }
    // detriti galleggianti: assi e barili
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(r() * W), y = 12 + Math.floor(r() * 90);
      if (i % 3) { px(x, y, '#5f4a3a', 10, 2); px(x, y, '#7a6250', 10, 1); }
      else { px(x, y, '#5f4a3a', 5, 4); px(x, y + 1, '#8a8a8a', 5, 1); }
    }
  });
}

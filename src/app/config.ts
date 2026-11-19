/** Risoluzione logica di riferimento, portrait (prima ipotesi da validare col prototipo). */
export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

/**
 * Il canvas reale è più grande della risoluzione logica: su un telefono con
 * schermo da ~1080 px di larghezza il gioco resta nitido invece di sgranarsi.
 * Le scene lavorano sempre in coordinate logiche (720×1280).
 */
export const RENDER_SCALE = 1.5;

/** Icone e creature sono generate già ingrandite di questo fattore (pixel netti). */
export const TEXTURE_SCALE = 2;

export const COLORS = {
  background: 0x14233f,
  ink: 0x1f1633,
  panel: 0x5f3520,
  accent: 0xffcf3a,
  accentDark: 0xe09a12,
  hot: 0xe4342f,
  text: '#fff7e6',
  textMuted: '#f1d7a8',
  inkHex: '#1f1633',
} as const;

/**
 * Jersey 10 (OFL, vedi ASSET_LICENSES.md) per tutto il gioco (0.6.8: Pixelify Sans
 * era poco leggibile, il 5 sembrava una S e la C una O). Ha un solo peso e lettere
 * più piccole e strette: le dimensioni scritte nel codice si moltiplicano per FONT_SIZE_MULT.
 */
export const FONT_TITLE = '"Jersey 10", monospace';
export const FONT_BODY = '"Jersey 10", monospace';
export const FONT_WEIGHT = '400';
export const FONT_SIZE_MULT = 1.2;
/** Dimensione effettiva del testo a partire da quella "di progetto". */
export const fontPx = (size: number): string => `${Math.round(size * FONT_SIZE_MULT)}px`;

export const BUILD_VERSION = __APP_VERSION__;

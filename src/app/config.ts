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

/** Pixelify Sans (OFL, vedi ASSET_LICENSES.md) per tutto il gioco. */
export const FONT_TITLE = '"Pixelify Sans", monospace';
export const FONT_BODY = '"Pixelify Sans", monospace';

export const BUILD_VERSION = __APP_VERSION__;

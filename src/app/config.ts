/** Risoluzione logica di riferimento, portrait (prima ipotesi da validare col prototipo). */
export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

/**
 * Il canvas reale è più grande della risoluzione logica: su un telefono con
 * schermo da ~1080 px di larghezza il gioco resta nitido invece di sgranarsi.
 * Le scene lavorano sempre in coordinate logiche (720×1280).
 */
export const RENDER_SCALE = 1.5;

/** Le texture vettoriali vengono rasterizzate a questa scala. */
export const TEXTURE_SCALE = 2;

export const COLORS = {
  background: 0x15122e,
  ink: 0x1f1633,
  panel: 0x2a2352,
  accent: 0xffcf3a,
  accentDark: 0xe09a12,
  hot: 0xff5f6d,
  text: '#fff7e6',
  textMuted: '#c2b8e8',
  inkHex: '#1f1633',
} as const;

export const FONT_TITLE = 'Bangers, "Arial Black", sans-serif';
export const FONT_BODY = '"M PLUS Rounded 1c", system-ui, sans-serif';

export const BUILD_VERSION = __APP_VERSION__;

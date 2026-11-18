import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };

// Il percorso base deve coincidere con il nome del repository per GitHub Pages
// (https://emanuelechiesa87.github.io/AceGame/). Solo il server di sviluppo usa "/".
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/AceGame/' : '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600, // Phaser da solo pesa ~1.2 MB non compresso
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
}));

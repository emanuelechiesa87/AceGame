/// <reference types="node" />
import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Plugin } from 'vite';

/**
 * PWA: dopo la build scrive dist/sw.js partendo da pwa/sw.template.js, con la lista di tutti
 * i file del gioco da mettere in cache (così parte anche senza rete). La versione della cache
 * è un hash del contenuto: cambia solo se cambia davvero qualcosa.
 */
function pwa(): Plugin {
  let outDir = 'dist';
  return {
    name: 'acegame-pwa',
    apply: 'build',
    configResolved(cfg) { outDir = cfg.build.outDir; },
    closeBundle() {
      const files: string[] = [];
      const walk = (dir: string): void => {
        for (const name of readdirSync(dir)) {
          const full = join(dir, name);
          if (statSync(full).isDirectory()) walk(full);
          else files.push(relative(outDir, full).split(sep).join('/'));
        }
      };
      walk(outDir);
      const list = files.filter((f) => f !== 'sw.js' && !f.endsWith('.map')).sort();
      const hash = createHash('sha256');
      for (const f of list) hash.update(f).update(readFileSync(join(outDir, f)));
      const version = `${pkg.version}-${hash.digest('hex').slice(0, 10)}`;
      const precache = ['./', ...list.map((f) => `./${f}`)];
      const sw = readFileSync('pwa/sw.template.js', 'utf8')
        .replace('__VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(precache, null, 2));
      writeFileSync(join(outDir, 'sw.js'), sw);
    },
  };
}

// Il percorso base deve coincidere con il nome del repository per GitHub Pages
// (https://emanuelechiesa87.github.io/AceGame/). Solo il server di sviluppo usa "/".
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/AceGame/' : '/',
  plugins: [pwa()],
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

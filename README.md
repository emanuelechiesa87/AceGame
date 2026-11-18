# AceGame

Roguelike 2D mobile-first per browser (Chrome). Prototipo, titolo provvisorio.

Stack: TypeScript · Phaser 3 · Vite · Vitest. Nessun backend.

## Comandi

```bash
npm install
npm run dev      # server locale, raggiungibile anche dal telefono sulla stessa Wi-Fi
npm test         # test unitari
npm run build    # typecheck + build in dist/
npm run preview  # serve la build (percorso /AceGame/)
```

Per provare dal telefono in locale: avvia `npm run dev` e apri sul telefono
l'indirizzo `Network:` mostrato nel terminale (stessa rete Wi-Fi del PC).

## Pubblicazione

Ogni push su `main` esegue test e build e pubblica su GitHub Pages
(`.github/workflows/deploy.yml`): https://emanuelechiesa87.github.io/AceGame/

## Struttura

```
src/
  app/      avvio Phaser e configurazione
  scenes/   scene (Boot, Menu, CharacterSelect, Exploration)
  systems/  logica di gioco indipendente dal rendering (Rng, ...)
  state/    stato della run (temporaneo) e sessione
  data/     contenuti e bilanciamento (data-driven)
  ui/       componenti di interfaccia
  types/    tipi condivisi
tests/      test unitari (Vitest)
```

## Regole del progetto

- Tutta la casualità passa da `systems/Rng.ts` (seed riproducibile).
- Nessun numero di gameplay nelle scene: va in `data/balance.ts`.
- Solo asset originali o con licenza verificata, registrati in `ASSET_LICENSES.md`.

## Stato

- **M0 – fondazioni** ✅ build, scene navigabili, layout portrait, camminata automatica di prova, pausa.
- **M1 – vertical slice**: prossimo passo.

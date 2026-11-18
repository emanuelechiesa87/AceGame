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
  art/      grafica vettoriale originale generata in codice (eroi, bioma, effetti)
  scenes/   scene: Menu, CharacterSelect, FruitReveal, Exploration, Battle,
            Reward, Event, Summary, Collection, Records
  systems/  regole senza grafica: combat/Battle (turni), RunController (mappa,
            ricompense, limiti), EventResolver, SaveSystem, Rng
  state/    stato della run (temporaneo) e sessione
  data/     contenuti e bilanciamento (frutti, artefatti, compagni, nemici, aree, eventi)
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
- **Estetica v1** ✅ eroi Kai e Nova animati a parti, bioma "Pianure del Tramonto", interfaccia in stile anime, schermo intero.
- **M1 – vertical slice** ✅ run completa: frutto iniziale casuale, mappa a bivi (7 passi),
  battaglie a turni con energia, poteri dei frutti (max 3, sostituzione), compagni automatici
  con speciali manuali (max 3), intenzioni dei nemici visibili, élite e boss con fase di rabbia,
  ricompense 1 su 3, forzieri, eventi, riposo, punteggio, Top 3 locale, collezione,
  run salvata a ogni nodo (riprendibile dopo refresh).

## Come si gioca una battaglia

- Tocca un nemico per mirarlo, poi scegli: **Attacco**, **Poteri** (consumano ⚡),
  **Difesa** (dimezza i danni e dà +1 ⚡), **Pozione**.
- Sopra ogni nemico c'è la sua prossima mossa: attacco, colpo pesante, difesa, malus.
- I compagni agiscono da soli; quando il loro cerchio è pieno tocca il loro tasto per la speciale
  (non consuma il tuo turno).
- Tocca lo schermo durante le animazioni per accelerarle.

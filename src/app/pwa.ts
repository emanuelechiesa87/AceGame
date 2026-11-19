/**
 * Gioco installabile e offline (PWA).
 * Registra il service worker (generato in build da vite.config.ts) e gestisce gli aggiornamenti:
 * una versione nuova si scarica in background e si applica solo in un momento sicuro
 * (quando il giocatore è al menu), con un ricaricamento della pagina. Mai durante una run.
 */
let waiting: ServiceWorker | null = null;
let safe = false;
let applying = false; // true solo dopo che abbiamo chiesto noi di attivare la versione nuova
let reloading = false;

export function registerPwa(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Al primo avvio il SW prende il controllo senza bisogno di ricaricare.
    if (!applying || reloading) return;
    reloading = true;
    location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          sw?.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) setWaiting(sw);
          });
        });
        // Su Android l'app installata resta aperta a lungo: controlla gli aggiornamenti al rientro.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void reg.update().catch(() => undefined);
        });
      })
      .catch(() => undefined); // senza SW il gioco funziona lo stesso (solo online)
  });
}

/** Il menu chiama setUpdateSafe(true) quando è visibile, false quando lo si lascia. */
export function setUpdateSafe(value: boolean): void {
  safe = value;
  applyIfPossible();
}

function setWaiting(sw: ServiceWorker): void {
  waiting = sw;
  applyIfPossible();
}

function applyIfPossible(): void {
  if (safe && waiting) {
    applying = true;
    waiting.postMessage('skipWaiting');
    waiting = null;
  }
}

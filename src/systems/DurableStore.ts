/**
 * Copia di sicurezza dei salvataggi in IndexedDB (dalla 0.6).
 * localStorage resta la fonte veloce e sincrona usata durante il gioco; ogni scrittura
 * viene ricopiata qui. All'avvio, se localStorage è stato svuotato (pulizia del browser,
 * spazio insufficiente) o è più vecchio, si recupera la copia da IndexedDB.
 * Tutto è "best effort": se IndexedDB non c'è o fallisce, il gioco funziona come prima.
 */
const DB = 'acegame';
const STORE = 'kv';

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch { resolve(null); }
  });
}

class DurableStoreImpl {
  private db: Promise<IDBDatabase | null> | null = null;
  private pending = new Map<string, string | null>();
  private flushing = false;

  private get conn(): Promise<IDBDatabase | null> {
    this.db ??= openDb();
    return this.db;
  }

  async get(key: string): Promise<string | null> {
    const db = await this.conn;
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
        req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null);
        req.onerror = () => resolve(null);
      } catch { resolve(null); }
    });
  }

  /** Scrittura asincrona; più scritture ravvicinate sulla stessa chiave diventano una sola. */
  put(key: string, value: string | null): void {
    this.pending.set(key, value);
    if (!this.flushing) void this.flush();
  }

  private async flush(): Promise<void> {
    this.flushing = true;
    try {
      const db = await this.conn;
      while (db && this.pending.size) {
        const batch = [...this.pending];
        this.pending.clear();
        await new Promise<void>((resolve) => {
          try {
            const tx = db.transaction(STORE, 'readwrite');
            const st = tx.objectStore(STORE);
            for (const [k, v] of batch) { if (v === null) st.delete(k); else st.put(v, k); }
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
            tx.onabort = () => resolve();
          } catch { resolve(); }
        });
      }
      if (!db) this.pending.clear();
    } finally {
      this.flushing = false;
    }
  }

  /** Chiede al browser di non cancellare i dati del gioco per liberare spazio. */
  async requestPersistence(): Promise<boolean> {
    try { return (await navigator.storage?.persist?.()) ?? false; } catch { return false; }
  }
}

export const DurableStore = new DurableStoreImpl();

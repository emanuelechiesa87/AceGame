/** Scarica un testo come file (export dei salvataggi). Su Android finisce in "Download". */
export function downloadText(name: string, text: string): boolean {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } catch { return false; }
}

/** Apre il selettore di file e ritorna il testo scelto (null se annullato). */
export function pickTextFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,application/json,text/plain'; input.style.display = 'none';
    let done = false;
    const finish = (v: string | null) => { if (done) return; done = true; input.remove(); resolve(v); };
    input.addEventListener('change', () => {
      const f = input.files?.[0];
      if (!f) return finish(null);
      if (f.size > 2_000_000) return finish(null);
      f.text().then(finish, () => finish(null));
    });
    input.addEventListener('cancel', () => finish(null));
    document.body.appendChild(input);
    input.click();
  });
}

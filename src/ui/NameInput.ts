import Phaser from 'phaser';
import { FONT_BODY, FONT_WEIGHT } from '../app/config';
import { HERO_NAME_MAX, sanitizeHeroName } from '../state/RunState';

/**
 * Campo di testo HTML posizionato sopra il canvas: usa la tastiera nativa del
 * telefono (Phaser non ha un input testuale). Segue il canvas a ogni resize
 * e viene rimosso quando la scena si chiude.
 */
export class NameInput {
  readonly el: HTMLInputElement;
  private last = '';

  constructor(private readonly scene: Phaser.Scene, private readonly x: number, private readonly y: number, private readonly w: number, private readonly h: number, value: string, onChange: (v: string) => void) {
    const el = document.createElement('input');
    el.type = 'text';
    el.value = value;
    el.maxLength = HERO_NAME_MAX;
    el.placeholder = 'Scrivi il nome...';
    el.autocomplete = 'off';
    el.spellcheck = false;
    el.setAttribute('enterkeyhint', 'done');
    el.setAttribute('aria-label', 'Nome del tuo eroe');
    Object.assign(el.style, {
      position: 'fixed', zIndex: '10', boxSizing: 'border-box', textAlign: 'center',
      fontFamily: FONT_BODY, fontWeight: FONT_WEIGHT, color: '#4a2a14', background: '#f1d7a8',
      border: '6px solid #1f1633', borderRadius: '0', outline: 'none',
      boxShadow: '6px 8px 0 #1f1633', padding: '0 12px', caretColor: '#e4342f',
    } satisfies Partial<CSSStyleDeclaration>);
    el.addEventListener('input', () => {
      const clean = sanitizeHeroName(el.value);
      if (clean !== el.value) el.value = clean;
      onChange(el.value);
    });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') el.blur(); });
    document.body.appendChild(el);
    this.el = el;

    // Riposiziona a ogni frame (solo se cambia): segue resize, rotazione e tastiera.
    const place = () => this.place();
    place();
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, place);
    const cleanup = () => { scene.events.off(Phaser.Scenes.Events.POST_UPDATE, place); el.remove(); };
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
  }

  /** Converte coordinate logiche (camera) in pixel CSS della pagina. */
  private place(): void {
    const cam = this.scene.cameras.main;
    const canvas = this.scene.game.canvas.getBoundingClientRect();
    const k = (cam.zoom * canvas.width) / this.scene.scale.width;
    // Il punto mondo al centro della camera finisce al centro del canvas:
    // calcolo diretto, senza dipendere da worldView (aggiornato solo al render).
    const mid = cam.midPoint;
    const left = canvas.left + canvas.width / 2 + (this.x - this.w / 2 - mid.x) * k;
    const top = canvas.top + canvas.height / 2 + (this.y - this.h / 2 - mid.y) * k;
    const key = `${left}|${top}|${k}`;
    if (key === this.last) return;
    this.last = key;
    Object.assign(this.el.style, { left: `${left}px`, top: `${top}px`, width: `${this.w * k}px`, height: `${this.h * k}px`, fontSize: `${Math.round(this.h * 0.5 * k)}px` });
  }
}

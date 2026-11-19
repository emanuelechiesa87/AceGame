/**
 * Suoni e musica sintetizzati in tempo reale con Web Audio (dalla 0.6).
 * Nessun file audio: tutti i suoni e le melodie sono originali e scritti qui nel codice,
 * quindi non servono licenze. Il contesto audio parte al primo tocco (regola dei browser).
 */

export type SfxName =
  | 'click' | 'select' | 'hit' | 'crit' | 'hurt' | 'heal' | 'shield' | 'power' | 'ko' | 'dodge'
  | 'awaken' | 'reward' | 'victory' | 'defeat' | 'whoosh' | 'boom' | 'pop' | 'eat' | 'status';
export type TrackName = 'menu' | 'map' | 'battle' | 'boss';

const NOTE: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
/** 'A4' → 440 Hz. */
export function freq(n: string): number {
  const m = /^([A-G][#b]?)(-?\d)$/.exec(n);
  if (!m) throw new Error(`nota non valida: ${n}`);
  const midi = (Number(m[2]) + 1) * 12 + NOTE[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Traccia: passi da un ottavo (o da una terzina in 6/8). '.' = pausa, '-' = tiene la nota. */
export interface Track { bpm: number; stepsPerBeat: number; lead: string[]; bass: string[]; drums: string; leadWave: OscillatorType; leadVol: number }

const seq = (s: string) => s.trim().split(/\s+/);

/** Melodie originali (scritte per AceGame). */
export const TRACKS: Record<TrackName, Track> = {
  // canto di marinai in 6/8, re minore
  menu: {
    bpm: 112, stepsPerBeat: 3, leadWave: 'square', leadVol: 0.05,
    lead: seq(`D4 - F4 A4 - A4  G4 - E4 C4 - .  D4 - F4 A4 - D5  C5 - A4 A4 - .
               Bb4 - A4 G4 - F4  E4 - C4 E4 - G4  F4 - E4 D4 - C4  D4 - - - . .`),
    bass: seq(`D2 . . A2 . .  C2 . . G2 . .  D2 . . A2 . .  F2 . . C3 . .
               Bb1 . . F2 . .  C2 . . G2 . .  A1 . . E2 . .  D2 . . A2 . .`),
    drums: 'k..h..k..h..k..h..k..h..k..h..k..h..k..h..k.hh.k',
  },
  // esplorazione: passo leggero, fa maggiore
  map: {
    bpm: 100, stepsPerBeat: 2, leadWave: 'triangle', leadVol: 0.09,
    lead: seq(`F4 . A4 . C5 - A4 .  G4 . Bb4 . A4 - - .  F4 . A4 . C5 . D5 .  C5 - A4 . G4 - - .
               D4 . F4 . A4 - G4 .  E4 . G4 . C5 - - .  Bb4 . A4 . G4 . E4 .  F4 - - - . . . .`),
    bass: seq(`F2 . C3 . F2 . C3 .  C2 . G2 . C2 . G2 .  F2 . C3 . F2 . C3 .  C2 . G2 . C2 . E2 .
               D2 . A2 . D2 . A2 .  C2 . G2 . C2 . G2 .  Bb1 . F2 . C2 . G2 .  F2 . C3 . F2 . . .`),
    drums: 'k.h.s.h.k.h.s.h.k.h.s.h.k.h.s.hhk.h.s.h.k.h.s.h.k.h.s.h.k.h.s.h.',
  },
  // battaglia: la minore, incalzante
  battle: {
    bpm: 148, stepsPerBeat: 2, leadWave: 'square', leadVol: 0.045,
    lead: seq(`A4 . C5 A4 E5 . D5 C5  B4 . G4 B4 D5 . C5 B4  A4 . C5 A4 E5 . G5 E5  F5 - E5 - D5 - B4 -
               C5 . A4 C5 F5 . E5 D5  B4 . G4 B4 E5 . D5 B4  A4 . E5 A4 C5 . B4 A4  G#4 - B4 - E5 - - .`),
    bass: seq(`A2 A2 A3 A2 A2 A2 A3 A2  G2 G2 G3 G2 G2 G2 G3 G2  F2 F2 F3 F2 F2 F2 F3 F2  E2 E2 E3 E2 E2 E2 G#2 E2
               F2 F2 F3 F2 F2 F2 F3 F2  G2 G2 G3 G2 G2 G2 G3 G2  A2 A2 A3 A2 A2 A2 A3 A2  E2 E2 E3 E2 E2 B2 E3 E2`),
    drums: 'k.h.s.hkk.h.s.h.k.h.s.hkk.h.s.hsk.h.s.hkk.h.s.h.k.h.s.hkk.hsssss',
  },
  // boss: mi minore, cromatico e pesante
  boss: {
    bpm: 160, stepsPerBeat: 2, leadWave: 'sawtooth', leadVol: 0.035,
    lead: seq(`E4 . E4 G4 . F#4 . E4  Bb4 - A4 - G4 - F#4 -  E4 . E4 G4 . B4 . C5  B4 - Bb4 - A4 - G4 -
               E5 . D5 C5 . B4 . A4  Bb4 . A4 G4 . F#4 . E4  G4 . F#4 E4 . D#4 . E4  B3 - - - E4 - - .`),
    bass: seq(`E2 E2 E2 E2 E2 E2 F2 E2  Bb1 Bb1 Bb1 Bb1 A1 A1 A1 A1  E2 E2 E2 E2 E2 E2 G2 E2  B1 B1 Bb1 Bb1 A1 A1 B1 B1
               C2 C2 C2 C2 C2 C2 D2 C2  Bb1 Bb1 Bb1 Bb1 A1 A1 A1 A1  E2 E2 E2 E2 C2 C2 C2 C2  B1 B1 B1 B1 E2 E2 E2 E2`),
    drums: 'k.hsk.hsk.hsk.hsk.hsk.hsk.hsk.hskkhsk.hsk.hsk.hsk.hsk.hsk.hsksss',
  },
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private vol = { music: 0.6, sfx: 0.8 };
  private vibrate = true;
  private track: TrackName | null = null;
  private step = 0;
  private nextTime = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private unlockBound = false;

  /** Da chiamare una volta all'avvio: il contesto parte al primo tocco. */
  init(settings: { music: number; sfx: number; vibration: boolean }): void {
    this.setVolumes(settings.music, settings.sfx);
    this.vibrate = settings.vibration;
    if (this.unlockBound || typeof window === 'undefined') return;
    this.unlockBound = true;
    const unlock = () => {
      this.ensure();
      void this.ctx?.resume();
    };
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend(); else void this.ctx.resume();
    });
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      this.ctx = ctx;
      this.master = ctx.createGain(); this.master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor();
      this.master.connect(comp).connect(ctx.destination);
      this.sfxBus = ctx.createGain(); this.sfxBus.connect(this.master);
      this.musicBus = ctx.createGain(); this.musicBus.connect(this.master);
      this.applyVolumes();
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
      if (this.track) this.startLoop();
      return ctx;
    } catch { return null; }
  }

  setVolumes(music: number, sfx: number): void {
    this.vol = { music, sfx };
    this.applyVolumes();
  }

  setVibration(on: boolean): void { this.vibrate = on; }

  private applyVolumes(): void {
    if (!this.ctx) return;
    // curva percettiva: metà cursore = un quarto di potenza
    this.sfxBus!.gain.setTargetAtTime(this.vol.sfx * this.vol.sfx, this.ctx.currentTime, 0.02);
    this.musicBus!.gain.setTargetAtTime(this.vol.music * this.vol.music * 0.8, this.ctx.currentTime, 0.05);
  }

  /** Vibrazione breve (solo se attiva e supportata). */
  buzz(ms: number | number[]): void {
    if (!this.vibrate) return;
    try { navigator.vibrate?.(ms); } catch { /* non supportata */ }
  }

  // --- mattoni del sintetizzatore ------------------------------------------------------

  private tone(f0: number, f1: number, dur: number, type: OscillatorType, vol: number, at = 0, bus = this.sfxBus, attack = 0.005): void {
    const ctx = this.ctx; if (!ctx || !bus) return;
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  private hiss(dur: number, vol: number, f0: number, f1: number, at = 0, bus = this.sfxBus, type: BiquadFilterType = 'bandpass'): void {
    const ctx = this.ctx; if (!ctx || !bus || !this.noise) return;
    const t = ctx.currentTime + at;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    src.playbackRate.value = 0.7 + Math.random() * 0.6;
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = 0.9;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(bus);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }

  private arp(notes: string[], gap: number, dur: number, type: OscillatorType, vol: number, at = 0): void {
    notes.forEach((n, i) => this.tone(freq(n), freq(n), dur, type, vol, at + i * gap));
  }

  // --- effetti ---------------------------------------------------------------------------

  play(name: SfxName): void {
    if (!this.ensure() || this.vol.sfx <= 0) return;
    const r = 1 + (Math.random() - 0.5) * 0.08; // piccola variazione: meno ripetitivo
    switch (name) {
      case 'click': this.tone(660 * r, 990 * r, 0.06, 'square', 0.08); break;
      case 'select': this.tone(520 * r, 780 * r, 0.07, 'triangle', 0.14); break;
      case 'hit': this.hiss(0.12, 0.5, 2400, 400); this.tone(160 * r, 60, 0.12, 'sine', 0.5); break;
      case 'crit': this.hiss(0.2, 0.6, 3500, 300); this.tone(220 * r, 50, 0.2, 'square', 0.25); this.tone(1200, 1800, 0.08, 'square', 0.08, 0.02); break;
      case 'hurt': this.tone(240 * r, 110, 0.18, 'sawtooth', 0.18); this.hiss(0.1, 0.35, 1200, 300); break;
      case 'heal': this.arp(['C5', 'E5', 'G5', 'C6'], 0.06, 0.18, 'triangle', 0.16); break;
      case 'shield': this.tone(300, 300, 0.25, 'square', 0.06); this.tone(450, 600, 0.2, 'triangle', 0.12, 0.03); break;
      case 'power': this.tone(180, 1400, 0.45, 'sawtooth', 0.12); this.hiss(0.5, 0.35, 400, 6000, 0.05, this.sfxBus, 'highpass'); this.tone(90, 45, 0.5, 'sine', 0.45, 0.35); break;
      case 'ko': this.tone(700 * r, 120, 0.25, 'square', 0.1); this.hiss(0.18, 0.4, 3000, 600, 0.05); break;
      case 'dodge': this.hiss(0.18, 0.3, 800, 4000, 0, this.sfxBus, 'highpass'); break;
      case 'status': this.tone(400 * r, 300, 0.12, 'triangle', 0.12); this.tone(600 * r, 450, 0.1, 'triangle', 0.08, 0.06); break;
      case 'boom': this.hiss(0.6, 0.8, 1800, 80, 0, this.sfxBus, 'lowpass'); this.tone(110, 35, 0.6, 'sine', 0.7); break;
      case 'pop': this.tone(900 * r, 1800, 0.06, 'sine', 0.3); this.hiss(0.08, 0.3, 5000, 2000); break;
      case 'whoosh': this.hiss(0.5, 0.25, 300, 2500, 0, this.sfxBus, 'bandpass'); break;
      case 'eat': this.hiss(0.08, 0.4, 1500, 900); this.hiss(0.08, 0.4, 1500, 900, 0.14); this.arp(['G4', 'C5', 'E5'], 0.07, 0.15, 'square', 0.07, 0.3); break;
      case 'reward': this.arp(['B5', 'E6'], 0.08, 0.22, 'square', 0.08); this.arp(['B5', 'E6'], 0.08, 0.22, 'triangle', 0.12); break;
      case 'awaken':
        this.arp(['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6', 'E6'], 0.07, 0.3, 'square', 0.06);
        this.arp(['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6', 'E6'], 0.07, 0.3, 'triangle', 0.1);
        this.hiss(1.2, 0.25, 2000, 9000, 0.5, this.sfxBus, 'highpass');
        this.tone(65, 65, 1.2, 'sine', 0.35, 0.55, this.sfxBus, 0.05);
        break;
      case 'victory':
        this.arp(['C5', 'C5', 'C5', 'G5'], 0.12, 0.14, 'square', 0.07);
        this.tone(freq('E5'), freq('E5'), 0.6, 'square', 0.07, 0.5); this.tone(freq('C6'), freq('C6'), 0.6, 'triangle', 0.12, 0.5);
        this.arp(['C3', 'G3', 'C4'], 0.12, 0.3, 'triangle', 0.18);
        break;
      case 'defeat': this.arp(['G4', 'F#4', 'F4', 'E4'], 0.22, 0.3, 'square', 0.07); this.tone(freq('C3'), freq('C3') * 0.9, 1.0, 'triangle', 0.2, 0.9); break;
    }
  }

  // --- musica ------------------------------------------------------------------------------

  /** Cambia la musica (null = silenzio). Se è già quella, non riparte. */
  music(name: TrackName | null): void {
    if (this.track === name) return;
    this.track = name;
    this.step = 0;
    if (!name) { this.stopLoop(); return; }
    if (this.ctx) this.startLoop();
  }

  private startLoop(): void {
    this.stopLoop();
    if (!this.ctx) return;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 50);
  }

  private stopLoop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private schedule(): void {
    const ctx = this.ctx; const name = this.track;
    if (!ctx || !name || !this.musicBus) return;
    if (ctx.state !== 'running') { this.nextTime = ctx.currentTime + 0.1; return; }
    const tr = TRACKS[name];
    const stepDur = 60 / tr.bpm / tr.stepsPerBeat;
    if (this.nextTime < ctx.currentTime - 0.2) this.nextTime = ctx.currentTime + 0.05; // dopo una pausa non recupera tutte le note
    while (this.nextTime < ctx.currentTime + 0.25) {
      if (this.vol.music > 0) this.playStep(tr, this.step, this.nextTime - ctx.currentTime, stepDur);
      this.step = (this.step + 1) % tr.lead.length;
      this.nextTime += stepDur;
    }
  }

  private held(line: string[], i: number): number {
    let n = 1;
    while (line[(i + n) % line.length] === '-' && n < line.length) n++;
    return n;
  }

  private playStep(tr: Track, i: number, at: number, stepDur: number): void {
    const bus = this.musicBus;
    const lead = tr.lead[i];
    if (lead && lead !== '.' && lead !== '-') this.tone(freq(lead), freq(lead), stepDur * this.held(tr.lead, i) * 0.95, tr.leadWave, tr.leadVol, at, bus, 0.01);
    const bass = tr.bass[i % tr.bass.length];
    if (bass && bass !== '.' && bass !== '-') this.tone(freq(bass), freq(bass), stepDur * Math.min(2, this.held(tr.bass, i)) * 0.9, 'triangle', 0.22, at, bus, 0.01);
    const d = tr.drums[i % tr.drums.length];
    if (d === 'k') this.tone(140, 45, 0.14, 'sine', 0.4, at, bus);
    else if (d === 's') this.hiss(0.1, 0.18, 2200, 1200, at, bus);
    else if (d === 'h') this.hiss(0.035, 0.07, 8000, 7000, at, bus, 'highpass');
  }
}

export const Audio = new AudioEngine();

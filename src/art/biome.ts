import { svgDoc } from './svg';

/**
 * Bioma 1 "Pianure del Tramonto": sfondi in stile anime senza contorno nero
 * (i personaggi hanno il contorno, così risaltano). Ogni strato è largo W e
 * si ripete senza giunture: gli elementi che escono dal bordo vengono
 * ridisegnati anche dall'altro lato.
 */
export const W = 720;

/** Generatore deterministico locale: gli sfondi sono sempre identici. */
function lcg(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function wrap(draw: (dx: number) => string): string {
  return draw(-W) + draw(0) + draw(W);
}

/** Profilo ondulato periodico: y uguale a x=0 e x=W. */
function ridge(h: number, base: number, amp: number[], phase: number[], step = 12): string {
  let d = `M0,${h}`;
  for (let x = 0; x <= W; x += step) {
    let y = base;
    amp.forEach((a, i) => (y += a * Math.sin(((x / W) * (i + 1) * 2 + phase[i]) * Math.PI)));
    d += ` L${x},${y.toFixed(1)}`;
  }
  return `<path d="${d} L${W},${h} Z"/>`;
}

export function sky(h = 1280): string {
  const defs = `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#241f5c"/><stop offset="0.22" stop-color="#5a3a8f"/>
    <stop offset="0.38" stop-color="#d0558f"/><stop offset="0.48" stop-color="#ff9a6a"/><stop offset="0.56" stop-color="#ffd38a"/></linearGradient>
    <radialGradient id="s" cx="0.5" cy="0.5" r="0.5"><stop offset="0.55" stop-color="#fff4c9"/><stop offset="1" stop-color="#ffd38a" stop-opacity="0"/></radialGradient>`;
  const rnd = lcg(7);
  let stars = '';
  for (let i = 0; i < 40; i++) {
    const x = rnd() * W, y = rnd() * 300, r = 0.8 + rnd() * 1.8;
    stars += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#fff" opacity="${(0.3 + rnd() * 0.6).toFixed(2)}"/>`;
  }
  const sun = `<circle cx="520" cy="560" r="230" fill="url(#s)" opacity="0.7"/><circle cx="520" cy="560" r="96" fill="#fff4c9"/><circle cx="520" cy="560" r="96" fill="none" stroke="#ffe6a0" stroke-width="10" opacity="0.6"/>`;
  return svgDoc(`<rect width="${W}" height="${h}" fill="url(#g)"/>${stars}${sun}`, W, h, defs);
}

export function clouds(): string {
  const h = 360;
  const rnd = lcg(21);
  let out = '';
  for (let i = 0; i < 5; i++) {
    const cx = (i / 5) * W + rnd() * 80, cy = 70 + rnd() * 220, s = 0.7 + rnd() * 0.7;
    out += wrap((dx) => {
      const x = cx + dx;
      const blob = (ox: number, oy: number, r: number, c: string) => `<circle cx="${(x + ox * s).toFixed(0)}" cy="${(cy + oy * s).toFixed(0)}" r="${(r * s).toFixed(0)}" fill="${c}"/>`;
      return `<g opacity="0.85">${blob(0, 0, 38, '#ffc3c9')}${blob(40, -16, 46, '#ffc3c9')}${blob(86, 0, 36, '#ffc3c9')}<rect x="${(x - 30 * s).toFixed(0)}" y="${cy.toFixed(0)}" width="${(150 * s).toFixed(0)}" height="${(30 * s).toFixed(0)}" fill="#ffc3c9"/>${blob(40, 6, 34, '#ffdfe0')}<rect x="${(x - 30 * s).toFixed(0)}" y="${(cy + 22 * s).toFixed(0)}" width="${(150 * s).toFixed(0)}" height="${(10 * s).toFixed(0)}" fill="#e79bb2"/></g>`;
    });
  }
  return svgDoc(out, W, h);
}

export function mountains(): string {
  const h = 440;
  const far = `<g fill="#7a4f9e">${ridge(h, 200, [40, 26, 14], [0.1, 0.6, 1.3])}</g>`;
  // picchi con lato illuminato verso il sole (destra) e neve stilizzata
  const rnd = lcg(3);
  let peaks = '';
  for (let i = 0; i < 4; i++) {
    const px = 60 + i * 180 + rnd() * 40, ph = 150 + rnd() * 110, pw = 150 + rnd() * 60, base = h - 60;
    peaks += wrap((dx) => {
      const x = px + dx, top = base - ph;
      return `<path d="M${x - pw},${base} L${x},${top} L${x + pw},${base} Z" fill="#5b3a86"/>` +
        `<path d="M${x},${top} L${x + pw},${base} L${x + pw * 0.35},${base} Z" fill="#9a5fa8"/>` +
        `<path d="M${x},${top} L${x - pw * 0.22},${top + ph * 0.24} L${x - pw * 0.08},${top + ph * 0.2} L${x},${top + ph * 0.3} L${x + pw * 0.1},${top + ph * 0.2} L${x + pw * 0.22},${top + ph * 0.24} Z" fill="#ffe0ec"/>`;
    });
  }
  const mist = `<rect y="${h - 80}" width="${W}" height="80" fill="#c7609a" opacity="0.55"/>`;
  return svgDoc(far + peaks + mist, W, h);
}

export function hills(): string {
  const h = 380;
  const back = `<g fill="#2f7f7a">${ridge(h, 150, [22, 12], [0.3, 1.1])}</g>`;
  const front = `<g fill="#3fa37a">${ridge(h, 210, [18, 10, 6], [1.2, 0.2, 0.8])}</g>`;
  const rim = `<g fill="#79d39a" opacity="0.9">${ridge(h, 212, [18, 10, 6], [1.2, 0.2, 0.8])}</g>`.replace('<path', '<path transform="translate(0,-6)"');
  const rnd = lcg(11);
  let trees = '';
  for (let i = 0; i < 7; i++) {
    const tx = (i / 7) * W + rnd() * 60, ty = 175 + rnd() * 40, s = 0.7 + rnd() * 0.6;
    trees += wrap((dx) => {
      const x = tx + dx;
      return `<rect x="${(x - 5 * s).toFixed(0)}" y="${ty.toFixed(0)}" width="${(10 * s).toFixed(0)}" height="${(40 * s).toFixed(0)}" fill="#3a2a4a"/>` +
        `<ellipse cx="${x.toFixed(0)}" cy="${(ty - 18 * s).toFixed(0)}" rx="${(34 * s).toFixed(0)}" ry="${(40 * s).toFixed(0)}" fill="#1f6b62"/>` +
        `<ellipse cx="${(x + 10 * s).toFixed(0)}" cy="${(ty - 28 * s).toFixed(0)}" rx="${(20 * s).toFixed(0)}" ry="${(22 * s).toFixed(0)}" fill="#3c9a7c"/>` +
        `<ellipse cx="${(x + 14 * s).toFixed(0)}" cy="${(ty - 34 * s).toFixed(0)}" rx="${(8 * s).toFixed(0)}" ry="${(9 * s).toFixed(0)}" fill="#ffb98a" opacity="0.7"/>`;
    });
  }
  return svgDoc(back + trees + rim + front, W, h);
}

export function ground(): string {
  const h = 300;
  const rnd = lcg(5);
  let deco = '';
  for (let i = 0; i < 14; i++) {
    const gx = rnd() * W, gy = 70 + rnd() * 190;
    const kind = i % 3;
    deco += wrap((dx) => {
      const x = gx + dx;
      if (kind === 0) return `<ellipse cx="${x.toFixed(0)}" cy="${gy.toFixed(0)}" rx="16" ry="7" fill="#8a5a46"/><ellipse cx="${(x - 3).toFixed(0)}" cy="${(gy - 2).toFixed(0)}" rx="9" ry="3" fill="#b07b5c"/>`;
      if (kind === 1) return `<circle cx="${x.toFixed(0)}" cy="${gy.toFixed(0)}" r="5" fill="#ffd34d"/><circle cx="${(x + 12).toFixed(0)}" cy="${(gy + 6).toFixed(0)}" r="4" fill="#ff7fa6"/>`;
      return `<path d="M${(x - 8).toFixed(0)},${gy.toFixed(0)} L${(x - 4).toFixed(0)},${(gy - 16).toFixed(0)} L${x.toFixed(0)},${gy.toFixed(0)} L${(x + 4).toFixed(0)},${(gy - 20).toFixed(0)} L${(x + 8).toFixed(0)},${gy.toFixed(0)} Z" fill="#2f8a5a"/>`;
    });
  }
  const dirt = `<rect y="40" width="${W}" height="${h - 40}" fill="#6b4a5a"/><rect y="60" width="${W}" height="90" fill="#c08a6a"/><rect y="60" width="${W}" height="10" fill="#e0aa84"/><rect y="140" width="${W}" height="10" fill="#9a6a58"/>`;
  const grass = `<g fill="#4fbf7a">${ridge(70, 44, [5, 3], [0, 0.5], 8)}</g><g fill="#7fe09a">${ridge(70, 46, [5, 3], [0, 0.5], 8)}</g>`.replace('<g fill="#7fe09a"><path', '<g fill="#7fe09a"><path transform="translate(0,-4)" opacity="0.8"');
  return svgDoc(dirt + grass + deco, W, h);
}

export function foreground(): string {
  const h = 140;
  const rnd = lcg(99);
  let blades = '';
  for (let i = 0; i < 26; i++) {
    const bx = rnd() * W, bh = 40 + rnd() * 80;
    blades += wrap((dx) => {
      const x = bx + dx;
      return `<path d="M${(x - 7).toFixed(0)},${h} Q${(x - 2).toFixed(0)},${(h - bh * 0.6).toFixed(0)} ${(x + 6).toFixed(0)},${(h - bh).toFixed(0)} Q${(x + 4).toFixed(0)},${(h - bh * 0.5).toFixed(0)} ${(x + 7).toFixed(0)},${h} Z" fill="#1d5a45"/>`;
    });
  }
  return svgDoc(blades, W, h);
}

/** Linee cinetiche radiali stile manga per la schermata titolo. */
export function speedLines(size = 1400): string {
  const c = size / 2;
  const rnd = lcg(42);
  let out = '';
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2 + rnd() * 0.03, w = 0.012 + rnd() * 0.025;
    const r1 = 180 + rnd() * 120, r2 = c * 1.5;
    const p = (ang: number, r: number) => `${(c + Math.cos(ang) * r).toFixed(0)},${(c + Math.sin(ang) * r).toFixed(0)}`;
    out += `<path d="M${p(a, r1)} L${p(a - w, r2)} L${p(a + w, r2)} Z" fill="#ffffff" opacity="${(0.05 + rnd() * 0.12).toFixed(2)}"/>`;
  }
  return svgDoc(out, size, size);
}

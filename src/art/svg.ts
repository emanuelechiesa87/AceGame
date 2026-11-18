/** Utility per comporre SVG in codice. Tutte le parti di un personaggio
 *  condividono lo stesso riquadro (CANVAS), così si sovrappongono allineate. */
export const CANVAS = { w: 240, h: 360 } as const;
export const OUTLINE = '#1f1633';
export const STROKE = 5;

export function svgDoc(body: string, w: number = CANVAS.w, h: number = CANVAS.h, defs = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;
}

export function path(d: string, fill: string, stroke: string | null = OUTLINE, sw = STROKE, extra = ''): string {
  const s = stroke ? ` stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"` : '';
  return `<path d="${d}" fill="${fill}"${s}${extra ? ' ' + extra : ''}/>`;
}

export function ellipse(cx: number, cy: number, rx: number, ry: number, fill: string, stroke: string | null = OUTLINE, sw = STROKE): string {
  const s = stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : '';
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"${s}/>`;
}

/** Ciuffo di punte disposte su un arco: base dei capelli "spettinati" anime. */
export function spikes(cx: number, cy: number, rIn: number, rOut: number, fromDeg: number, toDeg: number, count: number, jitter = 0): string {
  const pts: string[] = [];
  const step = (toDeg - fromDeg) / count;
  for (let i = 0; i <= count; i++) {
    const a1 = ((fromDeg + i * step) * Math.PI) / 180;
    pts.push(`${(cx + Math.cos(a1) * rIn).toFixed(1)},${(cy + Math.sin(a1) * rIn).toFixed(1)}`);
    if (i < count) {
      const a2 = ((fromDeg + (i + 0.5) * step) * Math.PI) / 180;
      const r = rOut + (i % 2 === 0 ? jitter : -jitter);
      pts.push(`${(cx + Math.cos(a2) * r).toFixed(1)},${(cy + Math.sin(a2) * r).toFixed(1)}`);
    }
  }
  return `M${pts.join(' L')} Z`;
}

/** Rasterizza a risoluzione `scale` riscrivendo width/height (il viewBox resta uguale). */
export function scaledSvg(svg: string, w: number, h: number, scale: number): string {
  return svg.replace(/^<svg([^>]*?) width="[^"]+" height="[^"]+"/, `<svg$1 width="${w * scale}" height="${h * scale}"`);
}

export function toDataUri(svg: string): string {
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

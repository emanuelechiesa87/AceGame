"""Genera le icone PWA in pixel art (public/icons/). Uso: python3 scripts/make_icons.py
Icona provvisoria (punto 6, identità definitiva, ancora da decidere): frutto dorato con foglia
su mare notturno. Disegno originale, nessuna spirale."""
from PIL import Image, ImageDraw
import os

BG, BG2 = (11, 16, 38), (28, 40, 92)
OUT, GOLD, LIGHT, SHADE, DARK = (40, 22, 10), (242, 184, 75), (255, 226, 140), (214, 138, 46), (160, 92, 30)
LEAF, LEAF2, STEM = (90, 143, 78), (130, 190, 100), (92, 58, 30)
WAVE, FOAM = (40, 70, 150), (120, 170, 230)

def art(n=32):
    o = (n - 32) / 2   # margine extra per l'icona maskable
    im = Image.new('RGB', (n, n), BG)
    px = im.load()
    for y in range(n):            # cielo in gradiente a bande
        t = y / n
        c = tuple(int(BG[i] + (BG2[i] - BG[i]) * t) for i in range(3))
        for x in range(n): px[x, y] = c
    for x in range(n):            # onda in basso
        h = int(25 + o * 1.4) + (1 if (x // 4) % 2 else 0)
        for y in range(h, n): px[x, y] = WAVE
        px[x, h] = FOAM
    cx, cy, r = 15.5 + o, 16.5 + o, 8.6   # frutto
    for y in range(n):
        for x in range(n):
            d = ((x - cx) ** 2 + ((y - cy) * 1.05) ** 2) ** 0.5
            if d <= r + 0.9 and d > r - 0.1: px[x, y] = OUT
            elif d <= r - 0.1:
                c = GOLD
                if x - cx + (y - cy) > 4: c = SHADE
                if x - cx + (y - cy) > 9: c = DARK
                if (x - 12 - o) ** 2 + (y - 13 - o) ** 2 <= 5: c = LIGHT
                px[x, y] = c
    oi = int(o)
    for x, y in [(16, 7), (16, 6), (17, 5)]: px[x + oi, y + oi] = STEM   # picciolo
    leaf = [(18, 6), (19, 5), (20, 5), (21, 5), (22, 6), (19, 6), (20, 6), (21, 6), (19, 7), (20, 7)]
    for x, y in leaf: px[x + oi, y + oi] = LEAF
    for x, y in [(20, 5), (21, 5)]: px[x + oi, y + oi] = LEAF2
    return im

def save(img, size, path):
    k = -(-size // img.width)   # fattore intero, poi ritaglio centrale
    a = img.resize((img.width * k, img.height * k), Image.NEAREST)
    m = (a.width - size) // 2
    a.crop((m, m, m + size, m + size)).save(path, optimize=True)

root = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
os.makedirs(root, exist_ok=True)
base = art()
save(base, 192, os.path.join(root, 'icon-192.png'))
save(base, 512, os.path.join(root, 'icon-512.png'))
save(art(40), 512, os.path.join(root, 'icon-maskable-512.png'))  # zona sicura: frutto nel cerchio centrale
save(base, 180, os.path.join(root, 'apple-touch-icon.png'))
print('ok')

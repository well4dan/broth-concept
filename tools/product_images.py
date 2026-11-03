#!/usr/bin/env python3
"""Extrai as 9 fotos reais do Instagram (@brothconcept) e gera 3 ângulos por peça.

Ângulos: 1 = look completo, 2 = detalhe superior, 3 = detalhe inferior/tecido.
Saída: site/assets/img/produtos/bc-00N-{1,2,3}.webp (+ -thumb.webp para cards).
Observação: as fontes são capturas de tela (~330 px de largura). Para produção,
substituir por fotos originais em alta resolução mantendo os mesmos nomes de arquivo.
"""
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / "referencias-instagram"
OUT = ROOT / "site" / "assets" / "img" / "produtos"
OUT.mkdir(parents=True, exist_ok=True)

GRIDS = [
    ("Captura de tela de 2026-11-02 11-04-05.png", 9, 451, [(25, 356), (358, 689), (691, 1022)]),
    ("Captura de tela de 2026-11-02 11-04-15.png", 1, 439, [(25, 356), (358, 689), (691, 1022)]),
    ("Captura de tela de 2026-11-02 11-04-32.png", 6, 448, [(20, 351), (353, 684), (686, 1017)]),
]
# centro horizontal do corpo em cada foto (fração da largura), usado nos recortes de detalhe
SUBJECT_CX = [0.50, 0.55, 0.55, 0.45, 0.50, 0.44, 0.42, 0.46, 0.50]


def clean_corner_icon(img: Image.Image) -> Image.Image:
    """Remove o ícone de carrossel do Instagram (canto superior direito)."""
    out = img.copy()
    w, _ = out.size
    x1, x2 = w - 42, w - 5
    for y in range(5, 42):
        left, right = out.getpixel((x1 - 1, y)), out.getpixel((min(w - 1, x2 + 1), y))
        for x in range(x1, x2):
            t = (x - x1) / (x2 - x1)
            out.putpixel((x, y), tuple(int(left[c] * (1 - t) + right[c] * t) for c in range(3)))
    return out


def clean_hover_overlay(img: Image.Image) -> Image.Image:
    """A foto 6 foi capturada com o hover do Instagram: restaura exposição e remove ícones."""
    bright = ImageEnhance.Contrast(ImageEnhance.Brightness(img).enhance(2.05)).enhance(1.08)
    for y in range(200, 236):
        t = (y - 198) / 40.0
        for x in range(104, 232):
            px = bright.getpixel((x, y))
            if x >= 183 or min(px) > 110:
                top, bot = bright.getpixel((x, 198)), bright.getpixel((x, 238))
                bright.putpixel((x, y), tuple(int(top[c] * (1 - t) + bot[c] * t) for c in range(3)))
    return bright


def detail_crop(img: Image.Image, cx: float, y0: float, width_frac: float) -> Image.Image:
    w, h = img.size
    cw = int(w * width_frac)
    ch = int(cw * 4 / 3)
    left = max(0, min(w - cw, int(w * cx - cw / 2)))
    top = max(0, min(h - ch, int(h * y0)))
    return img.crop((left, top, left + cw, top + ch))


def save(img: Image.Image, name: str, size: tuple[int, int], quality: int = 84) -> None:
    out = img.resize(size, Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.1, percent=60, threshold=3))
    out.save(OUT / f"{name}.webp", "WEBP", quality=quality, method=6)


def main() -> None:
    idx = 0
    for fname, y1, y2, cols in GRIDS:
        src = Image.open(REF / fname).convert("RGB")
        for x1, x2 in cols:
            crop = clean_corner_icon(src.crop((x1, y1, x2, y2)))
            if idx == 5:
                crop = clean_hover_overlay(crop)
            base = f"bc-{idx + 1:03d}"
            save(crop, f"{base}-1", (900, 1200))
            save(crop, f"{base}-thumb", (480, 640), 80)
            save(detail_crop(crop, SUBJECT_CX[idx], 0.06, 0.62), f"{base}-2", (720, 960))
            save(detail_crop(crop, SUBJECT_CX[idx], 0.40, 0.62), f"{base}-3", (720, 960))
            idx += 1
    print(f"{idx} peças processadas em {OUT}")


if __name__ == "__main__":
    main()

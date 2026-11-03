#!/usr/bin/env python3
"""Prepare campaign WebP images, OG image, Phosphor icon sprite, and favicons for site/."""

import os
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance

ROOT = Path("/home/wellington/Projetos/SITES/Broth Concept")
SITE = ROOT / "site"
CAMP_DIR = SITE / "assets" / "img" / "campanha"
BRAIN = Path("/home/wellington/.gemini/antigravity/brain/29d968b0-e6b8-49ab-a772-81a17e5b8032")
PH_DIR = Path("/tmp/fontpkg/ph/package/assets")

CAMP_DIR.mkdir(parents=True, exist_ok=True)

CAMPAIGN_MAP = [
    ("hero_01_1793636743298.jpg", "hero-01.webp", (1600, 900)),
    ("hero_02_1793636880689.jpg", "hero-02.webp", (1600, 900)),
    ("hero_03_1793636903723.jpg", "hero-03.webp", (1600, 900)),
    ("cat_palco_1793636930724.jpg", "cat-palco.webp", (900, 1200)),
    ("cat_alfaiataria_1793636961295.jpg", "cat-alfaiataria.webp", (900, 1200)),
    ("cat_renda_1793636997655.jpg", "cat-renda.webp", (900, 1200)),
    ("sob_medida_1793637037361.jpg", "sob-medida.webp", (1200, 800)),
    ("journal_01_1793637105950.jpg", "journal-01.webp", (960, 720)),
    ("journal_02_1793637182952.jpg", "journal-02.webp", (960, 720)),
    ("journal_03_1793637249644.jpg", "journal-03.webp", (960, 720)),
]


def crop_resize(img: Image.Image, target_size: tuple[int, int]) -> Image.Image:
    tw, th = target_size
    iw, ih = img.size
    target_ratio = tw / th
    src_ratio = iw / ih
    if src_ratio > target_ratio:
        new_w = int(ih * target_ratio)
        left = (iw - new_w) // 2
        img = img.crop((left, 0, left + new_w, ih))
    elif src_ratio < target_ratio:
        new_h = int(iw / target_ratio)
        top = (ih - new_h) // 2
        img = img.crop((0, top, iw, top + new_h))
    return img.resize((tw, th), Image.Resampling.LANCZOS)


def process_campaign_images():
    for src_name, dst_name, dims in CAMPAIGN_MAP:
        src_path = BRAIN / src_name
        dst_path = CAMP_DIR / dst_name
        with Image.open(src_path) as im:
            im = im.convert("RGB")
            out = crop_resize(im, dims)
            out.save(dst_path, "WEBP", quality=84, method=6)
            print(f"Saved {dst_path.relative_to(ROOT)} ({dims[0]}x{dims[1]})")

    # Generate OG Image 1200x630 from hero-01
    with Image.open(BRAIN / "hero_01_1793636743298.jpg") as im:
        im = im.convert("RGB")
        og = crop_resize(im, (1200, 630))
        og = ImageEnhance.Brightness(og).enhance(0.82)
        draw = ImageDraw.Draw(og, "RGBA")
        draw.rectangle([0, 440, 1200, 630], fill=(11, 16, 10, 215))
        draw.line([(60, 465), (1140, 465)], fill=(197, 174, 124, 140), width=1)
        og_path = SITE / "og-image.jpg"
        og.save(og_path, "JPEG", quality=88, optimize=True)
        print(f"Saved {og_path.relative_to(ROOT)} (1200x630)")


def build_icon_sprite():
    light_icons = [
        "magnifying-glass",
        "bag",
        "heart",
        "user",
        "truck",
        "shield-check",
        "whatsapp-logo",
        "instagram-logo",
        "caret-down",
        "caret-right",
        "caret-left",
        "x",
        "plus",
        "minus",
        "check",
        "star",
        "sparkle",
        "ruler",
        "arrows-clockwise",
        "chat-circle-text",
        "paper-plane-tilt",
        "copy",
        "sliders-horizontal",
        "package",
        "barcode",
        "qr-code",
        "credit-card",
        "lock-key",
        "eye",
        "trash",
        "pencil-simple",
        "file-text",
        "chart-line-up",
        "share-network",
        "map-pin",
        "clock",
        "play",
        "pause",
        "arrows-out-simple",
        "CheckCircle",
        "warning-circle",
        "gift",
        "tag",
        "funnel",
        "list",
        "globe",
        "Receipt",
        " SealCheck",
    ]
    symbols = []
    for raw_name in light_icons:
        name = raw_name.strip().lower()
        svg_file = PH_DIR / "light" / f"{name}-light.svg"
        if not svg_file.exists():
            continue
        content = svg_file.read_text(encoding="utf-8")
        inner = re.sub(r"^<svg[^>]*>|</svg>\s*$", "", content, flags=re.DOTALL).strip()
        symbols.append(f'  <symbol id="i-{name}" viewBox="0 0 256 256">{inner}</symbol>')

    for fill_name in ["star", "heart", "check-circle", "seal-check", "play"]:
        svg_file = PH_DIR / "fill" / f"{fill_name}-fill.svg"
        if svg_file.exists():
            content = svg_file.read_text(encoding="utf-8")
            inner = re.sub(r"^<svg[^>]*>|</svg>\s*$", "", content, flags=re.DOTALL).strip()
            symbols.append(f'  <symbol id="i-{fill_name}-fill" viewBox="0 0 256 256">{inner}</symbol>')

    sprite = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n' + "\n".join(symbols) + "\n</svg>\n"
    out_path = SITE / "assets" / "icons.svg"
    out_path.write_text(sprite, encoding="utf-8")
    print(f"Saved {out_path.relative_to(ROOT)} with {len(symbols)} symbols")


def build_favicons():
    # Browser tab monogram icon (does NOT expose brand download kit)
    fav_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="20" fill="#111710"/>
  <rect x="8" y="8" width="112" height="112" rx="14" fill="none" stroke="#C5AE7C" stroke-width="1.5" stroke-opacity="0.45"/>
  <text x="64" y="80" text-anchor="middle" fill="#ECEAE3" font-family="Georgia, serif" font-size="62" font-weight="300" letter-spacing="2">B</text>
  <circle cx="94" cy="40" r="4" fill="#729E6C"/>
</svg>
"""
    (SITE / "favicon.svg").write_text(fav_svg, encoding="utf-8")

    # Use existing high-res icon from root or generate clean PNG icons
    for size, filename in [
        (180, "apple-touch-icon.png"),
        (192, "icon-192.png"),
        (512, "icon-512.png"),
        (512, "icon-512-maskable.png"),
    ]:
        img = Image.new("RGBA", (size, size), (17, 23, 16, 255))
        draw = ImageDraw.Draw(img)
        pad = int(size * 0.08)
        draw.rounded_rectangle(
            [pad, pad, size - pad, size - pad],
            radius=int(size * 0.12),
            outline=(197, 174, 124, 130),
            width=max(2, size // 96),
        )
        # Draw stylized B monogram geometry
        cx, cy = size // 2, size // 2
        stem_x = int(size * 0.34)
        top_y = int(size * 0.25)
        bot_y = int(size * 0.75)
        mid_y = int(size * 0.49)
        w_line = max(3, size // 28)
        draw.line([(stem_x, top_y), (stem_x, bot_y)], fill=(236, 234, 227, 255), width=w_line)
        draw.arc([stem_x - int(size * 0.14), top_y, int(size * 0.67), mid_y], 270, 90, fill=(236, 234, 227, 255), width=w_line)
        draw.arc([stem_x - int(size * 0.14), mid_y, int(size * 0.71), bot_y], 270, 90, fill=(236, 234, 227, 255), width=w_line)
        draw.line([(stem_x, top_y), (int(size * 0.50), top_y)], fill=(236, 234, 227, 255), width=w_line)
        draw.line([(stem_x, mid_y), (int(size * 0.53), mid_y)], fill=(236, 234, 227, 255), width=w_line)
        draw.line([(stem_x, bot_y), (int(size * 0.54), bot_y)], fill=(236, 234, 227, 255), width=w_line)
        dot_r = max(3, size // 36)
        draw.ellipse([int(size * 0.72) - dot_r, int(size * 0.30) - dot_r, int(size * 0.72) + dot_r, int(size * 0.30) + dot_r], fill=(114, 158, 108, 255))
        img.save(SITE / filename, "PNG", optimize=True)
        if size == 512 and filename == "icon-512.png":
            ico_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
            ico_32.save(SITE / "favicon.ico", format="ICO", sizes=[(32, 32), (16, 16)])
    print("Saved favicons and app icons in site/")


if __name__ == "__main__":
    process_campaign_images()
    build_icon_sprite()
    build_favicons()

"""Converte imagens para .webp menores. Uso: python scripts/to_webp.py <imagem>... [--largura 1200] [--qualidade 80]
Grava ao lado do original, com nome em kebab-case (sem acento nem espaço). O original não é apagado."""
import argparse, re, unicodedata
from pathlib import Path
from PIL import Image

def slug(s):
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

ap = argparse.ArgumentParser()
ap.add_argument("arquivos", nargs="+")
ap.add_argument("--largura", type=int, default=1200)
ap.add_argument("--qualidade", type=int, default=80)
a = ap.parse_args()

for f in map(Path, a.arquivos):
    img = Image.open(f)
    if img.width > a.largura:
        img = img.resize((a.largura, round(img.height * a.largura / img.width)), Image.LANCZOS)
    out = f.with_name(slug(f.stem) + ".webp")
    img.save(out, "WEBP", quality=a.qualidade, method=6)
    print(f"{f.name} ({f.stat().st_size // 1024} KB) -> {out.name} ({out.stat().st_size // 1024} KB, {img.width}x{img.height})")

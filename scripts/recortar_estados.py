"""Recorta a folha de ilustrações dos estados (uma imagem com 9 artes e legendas) em webp transparentes, um por estado.
Uso: python scripts/recortar_estados.py <folha.png> [saida=public/estados]
As regiões abaixo são faixas generosas só da arte (sem as legendas); o recorte final é o contorno do que não é branco."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

# estado: (x0, x1, y0, y1) — folha de 1448x1086; a legenda começa em y≈435 (linha 1) e y≈905 (linha 2)
FAIXAS = {
    "vazio": (30, 370, 70, 425), "erro": (385, 725, 70, 425), "carregando": (735, 1060, 70, 425), "parcial": (1065, 1440, 70, 425),
    "bloqueado": (5, 325, 575, 895), "sem-permissao": (326, 590, 575, 895), "desatualizado": (592, 890, 575, 895),
    "acao-destrutiva": (892, 1185, 575, 895), "sucesso": (1187, 1445, 575, 895),
}
LARGURA = 800
PAD = 12

def cor_para_alfa(rgb):
    """Tira o fundo branco: quanto mais longe do branco, mais opaco. A cor é recomposta para parecer igual sobre branco."""
    f = rgb.astype(np.float32) / 255
    a = 1 - f.min(axis=2)
    a = np.where(a < 0.02, 0, a)  # ruído do fundo
    cor = np.where(a[..., None] > 0, (f - (1 - a[..., None])) / np.maximum(a[..., None], 1e-6), 0)
    return np.dstack([np.clip(cor, 0, 1), a])

folha = Image.open(sys.argv[1]).convert("RGB")
saida = Path(sys.argv[2] if len(sys.argv) > 2 else "public/estados")
saida.mkdir(parents=True, exist_ok=True)
for nome, (x0, x1, y0, y1) in FAIXAS.items():
    rgba = cor_para_alfa(np.asarray(folha.crop((x0, y0, x1, y1))))
    ys, xs = np.where(rgba[..., 3] > 0.04)
    box = (max(xs.min() - PAD, 0), max(ys.min() - PAD, 0), min(xs.max() + PAD, rgba.shape[1]), min(ys.max() + PAD, rgba.shape[0]))
    img = Image.fromarray((rgba * 255).astype(np.uint8), "RGBA").crop(box)
    if img.width > LARGURA:
        img = img.resize((LARGURA, round(img.height * LARGURA / img.width)), Image.LANCZOS)
    arq = saida / f"{nome}.webp"
    img.save(arq, "WEBP", quality=88, method=6)
    print(f"{nome}: {img.width}x{img.height}, {arq.stat().st_size // 1024} KB")

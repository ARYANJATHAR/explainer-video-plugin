"""Generate a subtle paper-texture background. Usage: python paper.py out.png [W H] [r g b]"""
import sys
import numpy as np
from PIL import Image
out = sys.argv[1] if len(sys.argv) > 1 else "paper.png"
W, H = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (1080, 1920)
base = np.array([float(x) for x in sys.argv[4:7]] if len(sys.argv) > 6 else [246, 241, 231], dtype=np.float32)
rng = np.random.default_rng(7)
fine = rng.normal(0, 1, (H, W)).astype(np.float32) * 3.2
small = ((rng.normal(0, 1, (max(2, H // 24), max(2, W // 24))) * 40 + 128).clip(0, 255)).astype(np.uint8)
coarse = (np.array(Image.fromarray(small).resize((W, H), Image.BICUBIC)).astype(np.float32) - 128) * 0.05
yy, xx = np.mgrid[0:H, 0:W]
d = np.sqrt(((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H / 2) / (H * 0.7)) ** 2)
vig = -np.clip(d - 0.55, 0, None) * 16
img = base[None, None, :] + (fine + coarse + vig)[..., None] * np.array([1, 1, 1.08])[None, None, :]
Image.fromarray(img.clip(0, 255).astype(np.uint8)).save(out)
print("wrote", out)

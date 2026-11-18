"""Split the full Shuttlers logo (green disc, black S and wordmark on white) into
   - a clean RGBA logo (white background removed), and
   - a mask image for the cloud renderer: R = green coverage, G = black coverage, A = R + G.
python split_logo.py logo_on_white.(jpg|png) logo_rgba.png logo_masks.png
"""
import sys
import numpy as np
from PIL import Image

GREEN = np.array([33, 229, 130], np.float32)
src, out_rgba, out_mask = sys.argv[1:4]
p = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
R, G = p[..., 0], p[..., 1]
# unmix each pixel as white*w + green*g + black*k (w + g + k = 1), using the G and R channels
g = np.clip((G - R) / (GREEN[1] - GREEN[0]), 0, 1)
w = np.clip((R - GREEN[0] * g) / 255.0, 0, 1)
k = np.clip(1 - w - g, 0, 1)
g[g < 0.02] = 0; k[k < 0.02] = 0
a = np.clip(g + k, 0, 1)
col = (GREEN[None, None] * g[..., None]) / np.maximum(a, 1e-4)[..., None]   # black contributes 0
rgba = np.dstack([np.clip(col, 0, 255), a * 255]).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save(out_rgba)
mask = np.dstack([g * 255, k * 255, np.zeros_like(g), a * 255]).astype(np.uint8)
Image.fromarray(mask, 'RGBA').save(out_mask)
print(rgba.shape, 'green px', int((g > .5).sum()), 'black px', int((k > .5).sum()))

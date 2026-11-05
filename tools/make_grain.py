"""Generates the seeded film-grain tile used by <Grain/> (public/fx/grain.png)."""
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
rng = np.random.default_rng(1729)
n = rng.normal(0.5, 0.22, (512, 512))
n = gaussian_filter(n, 0.6, mode="wrap")
n = (n - n.min()) / (n.max() - n.min())
Image.fromarray((n * 255).astype(np.uint8), "L").save("public/fx/grain.png")
print("wrote public/fx/grain.png")

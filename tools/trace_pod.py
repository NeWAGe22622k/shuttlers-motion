"""
Vectorises the app's own Pod illustration (public/vehicles/app-pod-car-large.png, 290×126)
into smooth layered SVG paths so the Pod can be shown sharp at any size.
Writes src/edu/podPaths.json. Run: python3 tools/trace_pod.py
"""
import json
import numpy as np
from PIL import Image, ImageFilter
from skimage import measure

UP = 8
im = Image.open("public/vehicles/app-pod-car-large.png").convert("RGBA")
W, H = im.size
big = im.resize((W * UP, H * UP), Image.LANCZOS)
a = np.asarray(big).astype(float) / 255
rgb, al = a[..., :3], a[..., 3]
lum = rgb @ [0.299, 0.587, 0.114]

def smooth(mask, r=3.0):
    return np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(float) / 255

body = al > 0.5
green = (rgb[..., 1] > rgb[..., 0] + 0.15) & (rgb[..., 1] > rgb[..., 2] + 0.05) & body
dark = (lum < 0.3) & body & ~green
# the S inside the badge is drawn from the real S mark, not traced
ys, xs = np.nonzero(green)
bcx, bcy = xs.mean(), ys.mean()
brx, bry = (xs.max() - xs.min()) / 2, (ys.max() - ys.min()) / 2
yy, xx = np.mgrid[0:H * UP, 0:W * UP]
in_badge = ((xx - bcx) / (brx * 1.08)) ** 2 + ((yy - bcy) / (bry * 1.08)) ** 2 <= 1
dark = dark & ~in_badge
inner = body & ~green & ~dark & ~in_badge

def paths(field, level=0.5, tol=2.0, min_len=40):
    out = []
    for c in measure.find_contours(np.pad(field, 2), level):
        c = c - 2
        if len(c) < min_len:
            continue
        c = measure.approximate_polygon(c, tolerance=tol)
        pts = " ".join(f"{x:.1f} {y:.1f}" for y, x in c)
        out.append("M" + pts.replace(" ", " ", 1) + "Z")
    return " ".join(p.replace("M", "M", 1) for p in out)

layers = []
sil = smooth(al > 0.5, 4.0)
layers.append({"name": "silhouette", "d": paths(sil), "tone": float(np.percentile(lum[inner], 4))})
bands = [0.70, 0.78, 0.85, 0.92]
for i, th in enumerate(bands):
    m = smooth((lum >= th) & inner, 5.0) * (sil > 0.5)
    sel = (lum >= th) & inner
    tone = float(np.median(lum[sel & (lum < (bands[i + 1] if i + 1 < len(bands) else 1.01))]))
    layers.append({"name": f"band{th}", "d": paths(m), "tone": tone})
tires = smooth(dark, 3.5)
layers.append({"name": "tires", "d": paths(tires), "tone": -1})

ys, xs = np.nonzero(green)
cx, cy = xs.mean(), ys.mean()
rx = (xs.max() - xs.min()) / 2
ry = (ys.max() - ys.min()) / 2
json.dump({"viewBox": [0, 0, W * UP, H * UP], "layers": layers, "badge": {"cx": cx, "cy": cy, "rx": rx, "ry": ry},
           "colours": {"tire": [int(v * 255) for v in np.median(rgb[dark], axis=0)], "green": [int(v * 255) for v in np.median(rgb[green], axis=0)]}},
          open("src/edu/podPaths.json", "w"))
print("layers", [(l["name"], len(l["d"]), round(l["tone"], 3)) for l in layers], "badge", round(cx), round(cy), round(rx), round(ry))

# Builds a white-on-transparent logo strip: S mark + "Shuttlers" wordmark.
import sys
from PIL import Image, ImageDraw, ImageFont
import numpy as np
icon = Image.open(sys.argv[1]).convert('RGB')
a = np.asarray(icon).astype(np.float32)
lum = a.mean(axis=2)
mask = np.clip((120 - lum) / 80, 0, 1)            # black S on green
ys, xs = np.where(mask > 0.5)
mask = mask[ys.min():ys.max()+1, xs.min():xs.max()+1]
H = 600
m = Image.fromarray((mask*255).astype(np.uint8)).resize((int(mask.shape[1]*H/mask.shape[0]), H), Image.LANCZOS)
font = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf', 470)
txt = 'Shuttlers'
bb = font.getbbox(txt)
tw, th = bb[2]-bb[0], bb[3]-bb[1]
gap = 110
W = m.width + gap + tw + 40
out = Image.new('L', (W, H), 0)
out.paste(m, (0, 0))
d = ImageDraw.Draw(out)
d.text((m.width + gap - bb[0], (H - th)//2 - bb[1]), txt, font=font, fill=255)
rgba = Image.new('RGBA', out.size, (255,255,255,0)); rgba.putalpha(out)
rgba.save(sys.argv[2]); print(out.size)

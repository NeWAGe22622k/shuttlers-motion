"""Composite the cloud Coaster bus into the real sky of the source shot, tracked to the camera.

  * Every source pixel is passed through untouched except where the cloud / captions sit.
  * Cloud is placed once in reference-frame sky coordinates and follows the camera via the
    per-frame homographies from track.py (sky at infinity => homography is exact for a
    handheld tilt/pan). Behind the building via a tracked holdout matte.
  * Motion blur matched to the footage (~quarter of per-frame motion), graded into the
    footage's overcast cloud range (grade.py).
  * Caption 1 at the top while she looks up; caption 2 tracked under the cloud.

python comp_tracked.py --src SRC.mov --cloud final_cloud.png --track track.npz --out OUT.mp4
"""
import argparse, json, os, subprocess, sys
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from grade import load_rgba, grade  # noqa

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, 'fonts', 'TikTokSans-700.ttf')

ap = argparse.ArgumentParser()
ap.add_argument('--src', required=True)
ap.add_argument('--cloud', required=True)
ap.add_argument('--track', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--track-scale', type=float, default=4.0, help='full-res px per tracking px')
ap.add_argument('--cx', type=float, default=1085, help='cloud centre x in the reference frame (full-res px)')
ap.add_argument('--cy', type=float, default=1050, help='cloud centre y in the reference frame')
ap.add_argument('--cw', type=float, default=1560, help='cloud width in the reference frame')
ap.add_argument('--cap1', default='POV you asked for a sign')
ap.add_argument('--cap2', default='This is your sign to use Shuttlers')
ap.add_argument('--cap1-end', type=float, default=3.35)
ap.add_argument('--cap2-in', type=float, default=3.95)
ap.add_argument('--cap2-out', type=float, default=5.75)
ap.add_argument('--cap-size', type=float, default=0.046)
ap.add_argument('--cap1-y', type=float, default=0.14)
ap.add_argument('--shutter', type=float, default=0.25)
ap.add_argument('--chroma', type=float, default=1.0, help='how much of the logo colour survives grading (1 = brand colours)')
ap.add_argument('--cap2-gap', type=float, default=0.018, help='gap between caption 2 and the top of the cloud, fraction of height')
ap.add_argument('--frames', default='', help='a,b: only process this frame range (preview)')
ap.add_argument('--scale-out', type=int, default=0, help='output width (0 = source)')
ap.add_argument('--crf', type=int, default=16)
args = ap.parse_args()

# ------------------------------------------------------------------ source
pr = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_streams',
                                         '-show_format', '-of', 'json', args.src]))
vs = pr['streams'][0]
W, H = int(vs['width']), int(vs['height'])
rot = 0
for sd in vs.get('side_data_list', []) or []:
    if 'rotation' in sd: rot = int(sd['rotation'])
if abs(rot) in (90, 270): W, H = H, W
fps_s = vs['r_frame_rate']; num, den = map(int, fps_s.split('/')); FPS = num / den
NF = int(vs.get('nb_frames') or round(float(pr['format']['duration']) * FPS))
print('source', W, H, FPS, NF)

# ------------------------------------------------------------------ cloud layer (graded, premultiplied)
c = load_rgba(args.cloud)
_rgb = c[..., :3]
_L = _rgb @ np.array([0.2126, 0.7152, 0.0722], np.float32)
# grade levels from the plain cloud only: opaque, neutral, not the dark brand letters
_neutral = (c[..., 3] > 0.9) & ((_rgb.max(-1) - _rgb.min(-1)) < 0.03) & (_L > 0.42)
L = _L[_neutral]
scale = args.cw / c.shape[1]
c = cv2.resize(c, (int(round(args.cw)), int(round(c.shape[0] * scale))), interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC)
cg = grade(c, lo=np.percentile(L, 1), hi=np.percentile(L, 99.7), gamma=1.25, haze=0.16, soften=3.5)
# reduce logo/ambient chroma toward neutral (keeps a soft blue tint in the letters)
lum = cg[..., :3] @ np.array([0.2126, 0.7152, 0.0722], np.float32)
cg[..., :3] = lum[..., None] + (cg[..., :3] - lum[..., None]) * args.chroma
ch, cw_ = cg.shape[:2]
prem = np.dstack([cg[..., :3] * cg[..., 3:4], cg[..., 3:4]]).astype(np.float32)
# cloud-layer pixel -> reference-frame full-res pixel
A = np.array([[1, 0, args.cx - cw_ / 2], [0, 1, args.cy - ch / 2], [0, 0, 1]], np.float64)
# top-centre of the opaque part (caption 2 sits just above the cloud)
rows = np.where(cg[..., 3].max(axis=1) > 0.3)[0]
anchor_ref = np.array([args.cx, args.cy - ch / 2 + rows.min() - args.cap2_gap * H, 1.0])

# ------------------------------------------------------------------ tracking (tracking px -> full res)
t = np.load(args.track)
tidx = list(t['idx']); Ht = t['H']
Sc = np.diag([args.track_scale, args.track_scale, 1.0])
Hfull = {i: Sc @ Ht[k] @ np.linalg.inv(Sc) for k, i in enumerate(tidx)}   # ref full -> frame full
# frame numbering: tracking used 1-based file numbers (ffmpeg %04d); decoded frame n (0-based) = file n+1

# building holdout in reference tracking coords (mapped from frames 122/180/188), extended off-frame
bld_ref = np.array([[-3000, -2500], [-1000, -2500], [-150, 7], [-51, 313], [31, 843], [95, 1400], [-3000, 1400]], np.float64)
bld_ref_full = bld_ref * args.track_scale


def caption(text, size_frac):
    size = int(round(size_frac * W))
    font = ImageFont.truetype(FONT, size)
    d0 = ImageDraw.Draw(Image.new('L', (1, 1)))
    bb = d0.textbbox((0, 0), text, font=font)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    pad = int(size * 0.6)
    img = Image.new('RGBA', (tw + 2 * pad, th + 2 * pad), (0, 0, 0, 0))
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0))
    # soft dark halo + tight drop shadow so white text reads on the white wall and on bright sky
    ImageDraw.Draw(sh).text((pad - bb[0], pad - bb[1] + size * 0.03), text, font=font, fill=(0, 0, 0, 255),
                            stroke_width=max(1, int(size * 0.05)), stroke_fill=(0, 0, 0, 255))
    halo = np.asarray(sh.filter(ImageFilter.GaussianBlur(size * 0.16))).astype(np.float32)
    tight = np.asarray(sh.filter(ImageFilter.GaussianBlur(size * 0.04))).astype(np.float32)
    a_ = np.clip(halo[..., 3] * 0.55 + tight[..., 3] * 0.35, 0, 255).astype(np.uint8)
    sh = Image.fromarray(np.dstack([np.zeros(a_.shape + (3,), np.uint8), a_]), 'RGBA')
    ImageDraw.Draw(img).text((pad - bb[0], pad - bb[1]), text, font=font, fill=(255, 255, 255, 255))
    out = np.asarray(Image.alpha_composite(sh, img)).astype(np.float32) / 255
    if out.shape[1] > W * 0.92:  # never wider than the frame
        f = W * 0.92 / out.shape[1]
        out = cv2.resize(out, (int(out.shape[1] * f), int(out.shape[0] * f)), interpolation=cv2.INTER_AREA)
    return out


cap1 = caption(args.cap1, args.cap_size)
cap2 = caption(args.cap2, args.cap_size)


def over(frame, layer, x, y, opacity=1.0):
    """frame float RGB, layer straight RGBA; top-left at (x, y)."""
    h, w = layer.shape[:2]
    x, y = int(round(x)), int(round(y))
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0: return
    l = layer[y0 - y:y1 - y, x0 - x:x1 - x]
    a = l[..., 3:4] * opacity
    frame[y0:y1, x0:x1] = frame[y0:y1, x0:x1] * (1 - a) + l[..., :3] * a


def smooth(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)


def motion_blur(img, dx, dy):
    L_ = float(np.hypot(dx, dy))
    if L_ < 1.5: return img
    k = int(np.ceil(L_)) | 1
    ker = np.zeros((k, k), np.float32)
    cxk = k // 2
    for s in np.linspace(-0.5, 0.5, 4 * k):
        ker[int(round(cxk + s * dy)), int(round(cxk + s * dx))] += 1
    ker /= ker.sum()
    return cv2.filter2D(img, -1, ker)


# ------------------------------------------------------------------ IO
f0, f1 = (0, NF - 1)
if args.frames:
    f0, f1 = map(int, args.frames.split(','))
dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', f'{f0 / FPS:.4f}', '-i', args.src, '-frames:v', str(f1 - f0 + 1),
                        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
OW = args.scale_out or W; OH = int(round(H * OW / W / 2)) * 2
tmp_v = args.out + '.video.mp4'
enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', fps_s,
                        '-i', '-', '-vf', f'scale={OW}:{OH}:flags=lanczos' if OW != W else 'null',
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', str(args.crf), '-profile:v', 'high', '-pix_fmt', 'yuv420p',
                        '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', tmp_v],
                       stdin=subprocess.PIPE)
rng = np.random.default_rng(5)
fsz = W * H * 3
for n in range(f0, f1 + 1):
    buf = dec.stdout.read(fsz)
    if len(buf) < fsz: break
    frame_u8 = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    tsec = n / FPS
    k = n + 1  # tracking file index
    touched = False
    frame = None
    if k in Hfull:
        Hk = Hfull[k]
        M = Hk @ A
        # bounding box of the warped layer
        corners = cv2.perspectiveTransform(np.array([[[0, 0], [cw_, 0], [cw_, ch], [0, ch]]], np.float64), M)[0]
        bx0, by0 = np.floor(corners.min(0)).astype(int) - 60
        bx1, by1 = np.ceil(corners.max(0)).astype(int) + 60
        if bx1 > 0 and by1 > 0 and bx0 < W and by0 < H:
            frame = frame_u8.astype(np.float32) / 255
            touched = True
            bx0c, by0c, bx1c, by1c = max(bx0, 0), max(by0, 0), min(bx1, W), min(by1, H)
            T = np.array([[1, 0, -bx0c], [0, 1, -by0c], [0, 0, 1]], np.float64)
            lay = cv2.warpPerspective(prem, T @ M, (bx1c - bx0c, by1c - by0c), flags=cv2.INTER_LINEAR,
                                      borderMode=cv2.BORDER_CONSTANT, borderValue=0)
            # motion blur from the centre's motion between neighbouring frames
            ctr = np.array([[[cw_ / 2, ch / 2]]])
            pa = cv2.perspectiveTransform(ctr, Hfull.get(k - 1, Hk) @ A)[0, 0]
            pb = cv2.perspectiveTransform(ctr, Hfull.get(k + 1, Hk) @ A)[0, 0]
            dv = (pb - pa) / 2 * args.shutter
            lay = motion_blur(lay, dv[0], dv[1])
            # building holdout
            hold = np.zeros(lay.shape[:2], np.float32)
            poly = cv2.perspectiveTransform(bld_ref_full[None], T @ Hk)[0]
            cv2.fillPoly(hold, [np.round(poly).astype(np.int32)], 1.0, lineType=cv2.LINE_AA)
            hold = cv2.GaussianBlur(hold, (0, 0), 2.0)
            a = lay[..., 3:4] * (1 - hold[..., None])
            rgb = lay[..., :3] * (1 - hold[..., None])
            reg = frame[by0c:by1c, bx0c:bx1c]
            reg[:] = rgb + reg * (1 - a)
            # match the footage's (very low) noise inside the cloud
            nz = rng.normal(0, 0.0025, reg.shape[:2]).astype(np.float32)[..., None]
            reg[:] += nz * a
        # caption 2: upright, follows the point under the cloud
        op2 = smooth((tsec - args.cap2_in) / 0.3) * (1 - smooth((tsec - (args.cap2_out - 0.3)) / 0.3))
        if op2 > 0.001:
            if frame is None: frame = frame_u8.astype(np.float32) / 255; touched = True
            p = Hk @ anchor_ref; p = p[:2] / p[2]
            # caption bottom edge sits on the anchor; keep it clear of the top of the frame (app UI)
            top = p[1] - cap2.shape[0] * 0.8
            op2 *= smooth((top - 0.06 * H) / (0.03 * H))
            if op2 > 0.001:
                over(frame, cap2, p[0] - cap2.shape[1] / 2, top, op2)
    op1 = 1 - smooth((tsec - args.cap1_end) / 0.2)
    if op1 > 0.001:
        if frame is None: frame = frame_u8.astype(np.float32) / 255; touched = True
        over(frame, cap1, (W - cap1.shape[1]) / 2, args.cap1_y * H - cap1.shape[0] / 2, op1)
    if touched:
        out = (np.clip(frame, 0, 1) * 255 + 0.5).astype(np.uint8)
    else:
        out = frame_u8
    enc.stdin.write(out.tobytes())
    if n % 30 == 0: print('frame', n, flush=True)
enc.stdin.close(); enc.wait(); dec.wait()

# ------------------------------------------------------------------ mux original audio untouched
subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', tmp_v, '-ss', f'{f0 / FPS:.4f}', '-i', args.src,
                       '-map', '0:v', '-map', '1:a?', '-c:v', 'copy', '-c:a', 'copy',
                       '-movflags', '+faststart', args.out])
os.remove(tmp_v)
print('wrote', args.out)

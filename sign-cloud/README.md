# "Your sign" cloud edit (9:16)

A Shuttlers Coaster bus made of cloud, composited into the real sky of the source shot and
tracked to the camera, in the style of the "POV: you asked the universe for a sign" trend.

- Source: `public/footage/sign-pov-IMG_8700.mov` (iPhone, 2160×3840, 30 fps, 9.4 s)
- Renders: `renders/sign-shuttlers-cloud-9x16.mp4` (1080×1920) and `renders/sign-shuttlers-cloud-9x16-4k.mp4` (2160×3840)

| Time | What happens | Copy |
|---|---|---|
| 0.0–3.4 s | She looks up and points | "POV you asked for a sign" (top) |
| ~3.4–6.3 s | Camera tilts into the sky; the cloud bus sits in the real clouds and follows the camera | "This is your sign to use Shuttlers" (above the cloud, ~4.1–6.1 s) |
| 6.3–9.4 s | Camera back on her, untouched | none |

The footage itself is not altered: no grade, no retouching, no speed change. Only the cloud and caption pixels are
added; every other pixel is passed straight through (untouched frames measure 44 dB PSNR against the source,
i.e. only the re-encode). The original audio is copied as is.

## How it is built

1. **Cloud** (`scene.py`, Blender 5.3 `bpy`): a Coaster-proportioned bus mesh (bevelled side profile, wheels,
   recessed window band) is converted to an SDF grid in geometry nodes. Cumulus billows (3 octaves of smooth-F1
   Voronoi plus fBm) displace that surface. The full Shuttlers logo (`public/brand/shuttlers-logo-full.png`) is
   projected onto the side: a thin skin under the billowy surface is dyed brand green and black, with a slight
   engraving. Everything is baked into a VDB
   density grid, then path-traced in Cycles with 48 volume bounces under a neutral overcast dome to match the
   footage's light. Output: `assets/cloud-bus-overcast.png` (RGBA, straight alpha).
2. **Track** (`track.py`): LK optical flow and RANSAC homographies, chained from reference frame 143
   (`data/track.npz`, 540×960 tracking coords). The building edge was mapped into sky coordinates and is used as
   a holdout matte, so the cloud can never draw over the building.
3. **Composite** (`comp_tracked.py`): grades the render into the footage's measured cloud range (`grade.py`),
   pulls the logo back to exact brand colours (#21E582 and black), and warps it per frame with the homography. It adds motion blur matched to the footage (a quarter of the
   per-frame motion) and draws the TikTok Sans captions: the first fixed at the top, the second following the
   point above the cloud and kept inside the frame. Then it re-muxes the original audio.

## Rebuild

```bash
python3 -m venv .venv && .venv/bin/pip install bpy==5.3.0 numpy pillow opencv-python-headless
# logo -> clean RGBA + green/black coverage masks for the renderer
.venv/bin/python sign-cloud/split_logo.py logo-on-white.jpg public/brand/shuttlers-logo-full.png sign-cloud/assets/shuttlers-logo-masks.png
# cloud render (~15 min on 4 CPU cores)
.venv/bin/python sign-cloud/scene.py --out sign-cloud/assets/cloud-bus-overcast.png --w 1782 --h 3168 --samples 40 \
  --overcast 1 --sun 0.6 --sky 1.3 --puff 1.6 --edge 0.13 --sun-el 78 --sun-angle 40 --density 30 --yaw -22 \
  --voxel 0.015 --bg 0 --border 0.08,0.92,0.50,0.88 --engrave 0.035 --shell 0.13 --logo-w 4.3 --logo-cz 1.05 \
  --logo sign-cloud/assets/shuttlers-logo-masks.png
# tracking (frames extracted at 540×960 as f0001.jpg…)
mkdir -p /tmp/small && ffmpeg -i public/footage/sign-pov-IMG_8700.mov -vf scale=540:960 -q:v 3 /tmp/small/f%04d.jpg
.venv/bin/python sign-cloud/track.py /tmp/small 90 205 143 sign-cloud/data/track.npz
# composite (4K), then the 1080 delivery
.venv/bin/python sign-cloud/comp_tracked.py --src public/footage/sign-pov-IMG_8700.mov \
  --cloud sign-cloud/assets/cloud-bus-overcast.png --track sign-cloud/data/track.npz --cw 1750 --cy 1450 \
  --cap2-in 4.0 --cap2-out 6.15 --out renders/sign-shuttlers-cloud-9x16-4k.mp4
ffmpeg -i renders/sign-shuttlers-cloud-9x16-4k.mp4 -vf scale=1080:1920:flags=lanczos -c:v libx264 -preset slow \
  -crf 17 -pix_fmt yuv420p -c:a copy -movflags +faststart renders/sign-shuttlers-cloud-9x16.mp4
```

Useful `comp_tracked.py` knobs: `--cx/--cy/--cw` (cloud position and size in the reference frame), `--cap1-end`,
`--cap2-in/--cap2-out`, `--cap2-gap`, `--brand` (0–1 pull of the logo to exact brand colours), `--shutter` (motion blur).

To use a different logo, run `split_logo.py` on it (logo on white), then re-run the cloud render and the composite.
`make_logo.py` builds the earlier stand-in (S mark plus a typed wordmark) and is no longer used.

Font: TikTok Sans Bold (SIL Open Font License, from Google Fonts), `fonts/TikTokSans-700.ttf`.

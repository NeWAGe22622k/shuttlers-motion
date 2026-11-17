"""Grade a rendered cloud (RGBA, straight alpha) to sit in the footage's overcast sky."""
import numpy as np
import cv2

# footage sky (sRGB 0-255): shadows / mids / highlights of the real clouds (frame 143)
SKY_SHADOW = np.array([123, 132, 140], np.float32) / 255
SKY_MID = np.array([150, 159, 168], np.float32) / 255
SKY_HIGH = np.array([229, 230, 232], np.float32) / 255


def load_rgba(path):
    a = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    a = a.astype(np.float32) / (65535.0 if a.dtype == np.uint16 else 255.0)
    return np.dstack([a[..., 2], a[..., 1], a[..., 0], a[..., 3]])  # BGRA -> RGBA


def grade(rgba, lo=0.36, hi=0.985, shadow=None, high=None, gamma=1.0, haze=0.10, alpha_gain=1.0, soften=0.0):
    """Map the render's luminance range into the footage's cloud range and tint to its colour.

    lo/hi: render luminance (display) that maps to the footage's shadow / highlight colours.
    haze:  pull toward the mid-sky colour (aerial perspective, keeps it in the cloud layer).
    """
    shadow = SKY_SHADOW if shadow is None else shadow
    high = SKY_HIGH if high is None else high
    rgb, a = rgba[..., :3], rgba[..., 3:4]
    L = rgb @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    t = np.clip((L - lo) / (hi - lo), 0, 1) ** gamma
    out = shadow + (high - shadow) * t[..., None]
    # keep the logo's cool tint: chroma of the render relative to its own grey
    chroma = rgb - L[..., None]
    out = out + chroma * 0.85
    out = out * (1 - haze) + SKY_MID * haze
    a = np.clip(a * alpha_gain, 0, 1)
    if soften > 0:
        k = int(soften * 6) | 1
        out = cv2.GaussianBlur(out * a, (k, k), soften)
        a = cv2.GaussianBlur(a, (k, k), soften)[..., None] if a.ndim == 3 else a
        out = out / np.maximum(a, 1e-4)
    return np.dstack([np.clip(out, 0, 1), a])

"""Track the camera (sky at infinity => homography per frame) relative to a reference frame.

python track.py FRAMES_DIR first last ref out.npz
Frames are numbered f0001.jpg ... (1-based, as written by ffmpeg). Homographies map
reference-frame pixel coords -> frame-i pixel coords, at the tracking resolution.
"""
import sys, glob, os
import numpy as np, cv2

d, first, last, ref, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]


def load(i):
    return cv2.imread(os.path.join(d, f'f{i:04d}.jpg'), cv2.IMREAD_GRAYSCALE)


clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))


def prep(g):
    return clahe.apply(g)


def pair_h(a, b):
    """Homography mapping points in frame a -> frame b."""
    pa = cv2.goodFeaturesToTrack(a, maxCorners=1500, qualityLevel=0.003, minDistance=8, blockSize=9)
    pb, st, err = cv2.calcOpticalFlowPyrLK(a, b, pa, None, winSize=(31, 31), maxLevel=5,
                                           criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 40, 0.01))
    # forward-backward check
    pa2, st2, _ = cv2.calcOpticalFlowPyrLK(b, a, pb, None, winSize=(31, 31), maxLevel=5)
    fb = np.linalg.norm(pa - pa2, axis=2).ravel()
    ok = (st.ravel() == 1) & (st2.ravel() == 1) & (fb < 0.8)
    if ok.sum() < 12:
        return None, ok.sum()
    H, inl = cv2.findHomography(pa[ok], pb[ok], cv2.RANSAC, 2.0)
    return H, int(inl.sum()) if inl is not None else 0


frames = {i: prep(load(i)) for i in range(first, last + 1)}
Hs = {ref: np.eye(3)}
stats = {}
for i in range(ref + 1, last + 1):          # forward
    H, n = pair_h(frames[i - 1], frames[i]); stats[i] = n
    Hs[i] = H @ Hs[i - 1]
for i in range(ref - 1, first - 1, -1):     # backward
    H, n = pair_h(frames[i + 1], frames[i]); stats[i] = n
    Hs[i] = H @ Hs[i + 1]
idx = np.arange(first, last + 1)
np.savez(out, idx=idx, H=np.stack([Hs[i] / Hs[i][2, 2] for i in idx]), inliers=np.array([stats.get(i, -1) for i in idx]))
for i in idx[::5]:
    c = Hs[i] @ np.array([270, 300, 1.0]); c /= c[2]
    print(i, stats.get(i), np.round(c[:2], 1))

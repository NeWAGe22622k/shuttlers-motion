"""
PodVideo2-16x9 score + SFX, generated entirely in code (no samples, no external audio).

    python3 audio/build_v2_16x9_audio.py

Reads src/pod2/config/timing.json and writes
    public/audio/score-v2.wav                 (exactly 30.000 s, 48 kHz, 24-bit stereo, -14 LUFS / -1 dBTP)
    public/audio/v2-16x9/stems/{drums,bass,music,sfx}.wav   (pre-master stems, same length)

Music: punchy Afro-house with an amapiano lean, 120 BPM, A minor, Fmaj9 -> G6 -> Em7 -> Am9 (one chord per bar).
Synth kick, clap, 16th shakers (56% swing), log-drum bass (+7 st pitch drop over 60 ms, 350 ms decay, tanh),
pad, pluck, stabs, convolution reverb (generated IR). Seeded RNG: every run is bit-identical before mastering.
"""
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = json.load(open(os.path.join(ROOT, "src/pod2/config/timing.json")))
A = T["audio"]
SR = A["sampleRate"]
FPS = T["fps"]
DUR_F = T["duration"]
N = int(round(DUR_F / FPS * SR))  # 1,440,000
BEAT = 60.0 / T["bpm"]
STEP = BEAT / 4
SWING = 0.56
RNG = np.random.default_rng(20261106)
OUT = os.path.join(ROOT, "public/audio")
STEMS = os.path.join(OUT, "v2-16x9/stems")
PRE_GAIN_DB = 4.0  # drive into the limiter so loudnorm can stay linear


def fs(frame):
    """frame -> sample index: round(frame * 1600) at 48 kHz / 30 fps (beat n = frame 15n = sample 24000n)"""
    return int(round(frame * 1600))


def tsec(n):
    return np.arange(n) / SR


def env_exp(n, tau):
    return np.exp(-tsec(n) / tau)


def noise(n):
    return RNG.standard_normal(n)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def place(buf, x, at, gain=1.0, pan=0.0):
    """add mono/stereo x into stereo buf at sample `at` (clipped to the buffer)."""
    if x.ndim == 1:
        l = np.sqrt(0.5 * (1 - pan))
        r = np.sqrt(0.5 * (1 + pan))
        x = np.stack([x * l, x * r], axis=1) * np.sqrt(2)
    if at >= len(buf):
        return
    end = min(len(buf), at + len(x))
    if at < 0:
        x = x[-at:]
        at = 0
        end = min(len(buf), len(x))
    buf[at:end] += gain * x[: end - at]


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ------------------------------------------------------------------ instruments

def kick():
    n = int(0.42 * SR)
    t = tsec(n)
    f = 48 + (150 - 48) * np.exp(-t / 0.03)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * env_exp(n, 0.22)
    click = hp(noise(n), 3000) * env_exp(n, 0.002) * 0.4
    return np.tanh(1.6 * (body + click))


def clap():
    n = int(0.35 * SR)
    x = np.zeros(n)
    for d in (0.0, 0.006, 0.012):  # tight flam: one transient to the ear and to onset detection
        k = int(d * SR)
        burst = noise(n - k) * env_exp(n - k, 0.006 if d < 0.012 else 0.13)
        x[k:] += burst
    return bp(x, 900, 2600) * 0.9


def shaker(vel=1.0):
    n = int(0.06 * SR)
    a = np.minimum(1, tsec(n) / 0.004)
    return hp(noise(n), 6500, 4) * a * env_exp(n, 0.018) * 0.35 * vel


def log_drum(freq, dur=0.5):
    """Amapiano log drum: starts +7 semitones up and drops to pitch in 60 ms, 350 ms decay, tanh."""
    n = int(dur * SR)
    t = tsec(n)
    semis = 7 * np.clip(1 - t / 0.06, 0, 1) ** 2  # +7 st falling to pitch over 60 ms
    f = freq * 2 ** (semis / 12)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    x *= env_exp(n, 0.35) * np.minimum(1, t / 0.003)
    return np.tanh(2.6 * x) * 0.55


def saw(freq, n, detune=0.0):
    t = tsec(n)
    ph = (t * freq * (1 + detune)) % 1.0
    return 2 * ph - 1


def chord_tone(freqs, n, cutoff=2400, voices=3):
    x = np.zeros(n)
    for fq in freqs:
        for v in range(voices):
            det = (v - (voices - 1) / 2) * 0.006
            x += saw(fq, n, det)
    return lp(x / (len(freqs) * voices), cutoff, 2)


def pluck(freq, dur=0.6, bright=0.5):
    """Karplus-Strong pluck."""
    n = int(dur * SR)
    period = max(2, int(SR / freq))
    buf = RNG.uniform(-1, 1, period)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % period]
        buf[i % period] = 0.5 * (buf[i % period] + buf[(i + 1) % period]) * (0.994 - 0.004 * (1 - bright))
    return lp(out, 5000) * 0.6


def stab(freqs, dur=0.22):
    n = int(dur * SR)
    x = chord_tone(freqs, n, cutoff=3200, voices=4) * env_exp(n, 0.07) * np.minimum(1, tsec(n) / 0.002)
    return np.tanh(2.2 * x) * 0.6


def impact():
    n = int(0.9 * SR)
    t = tsec(n)
    f = 40 + 90 * np.exp(-t / 0.05)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.3)
    crack = bp(noise(n), 1500, 7000) * env_exp(n, 0.03) * 0.5
    return np.tanh(1.4 * (boom + crack)) * 0.9


# ------------------------------------------------------------------ SFX recipes (brief §7)

def sfx_tap():
    n = int(0.06 * SR)
    click = np.zeros(n)
    k = int(0.0015 * SR)
    click[:k] = noise(k) * np.linspace(1, 0, k)
    blip = np.sin(2 * np.pi * 1200 * tsec(n)) * env_exp(n, 0.012)
    return 0.7 * click + 0.5 * blip


def sfx_key():
    n = int(0.012 * SR)
    k = int(0.001 * SR)
    x = np.zeros(n)
    x[:k] = hp(noise(k), 2500) * np.linspace(1, 0, k)
    return x * 0.5


def sfx_wipe(frames=12):
    n = int(frames / FPS * SR)
    src = noise(n)
    out = np.zeros(n)
    chunk = int(0.005 * SR)
    for i in range(0, n, chunk):
        p = i / n
        fc = 300 * (3000 / 300) ** p
        seg = src[max(0, i - 2048) : i + chunk]
        y = bp(seg, fc / 1.5, min(fc * 1.5, SR / 2 - 100))
        out[i : i + chunk] = y[-len(out[i : i + chunk]) :]
    shape = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
    return out * shape * 0.5


def sfx_thud():
    n = int(0.08 * SR)
    t = tsec(n)
    f = 90 + (50 - 90) * (t / t[-1])
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.035) * 0.9


def sfx_clack():
    n = int(0.05 * SR)
    hi = bp(noise(n), 2200, 6000) * env_exp(n, 0.006)
    lo = np.sin(2 * np.pi * 180 * tsec(n)) * env_exp(n, 0.012)
    return 0.7 * hi + 0.4 * lo


def sfx_door():
    n = int(0.35 * SR)
    t = tsec(n)
    thump = np.sin(2 * np.pi * (55 + 30 * np.exp(-t / 0.02)) * t) * env_exp(n, 0.07)
    latch = np.zeros(n)
    for d, g in ((0.010, 1.0),):  # one latch click, 10 ms into the thump (a single transient)
        k = int(d * SR)
        m = int(0.012 * SR)
        latch[k : k + m] += bp(noise(m), 2000, 4500) * env_exp(m, 0.003) * g
    return np.tanh(1.3 * (0.9 * thump + 0.6 * latch))


def sfx_eyelid():
    """A soft, short eyelid tick: a 4 ms filtered click plus a tiny 1.8 kHz tone, at -12 dB."""
    n = int(0.05 * SR)
    t = tsec(n)
    k = int(0.004 * SR)
    click = np.zeros(n)
    click[:k] = bp(noise(k), 1500, 5000) * np.hanning(2 * k)[k:]
    tone = np.sin(2 * np.pi * 1800 * t) * env_exp(n, 0.008) * 0.6
    x = click + tone
    return x / np.max(np.abs(x)) * 10 ** (-12 / 20)


EYELID_LEN = int(0.05 * SR)


def sfx_tock():
    """Pin landing: a short wood-block knock (mid-range, no sub: never a second kick)."""
    n = int(0.08 * SR)
    t = tsec(n)
    body = np.sin(2 * np.pi * 820 * t) * env_exp(n, 0.018) + 0.5 * np.sin(2 * np.pi * 1640 * t) * env_exp(n, 0.01)
    click = hp(noise(n), 3000) * env_exp(n, 0.0015) * 0.4
    return (body + click) * 0.7


def crash(dur=1.1):
    n = int(dur * SR)
    return hp(noise(n), 5000, 2) * env_exp(n, 0.35) * np.minimum(1, tsec(n) / 0.001) * 0.35


def sfx_tick(freq=3200):
    n = int(0.03 * SR)
    return (np.sin(2 * np.pi * freq * tsec(n)) * env_exp(n, 0.004) + hp(noise(n), 4000) * env_exp(n, 0.0015) * 0.3) * 0.5


def sfx_riser(frames):
    n = int(frames / FPS * SR)
    t = tsec(n)
    p = t / t[-1]
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2 * p)) / SR) * 0.15
    nz = noise(n)
    out = np.zeros(n)
    chunk = int(0.01 * SR)
    for i in range(0, n, chunk):
        fc = 400 * (6000 / 400) ** (i / n)
        seg = nz[max(0, i - 2048) : i + chunk]
        y = bp(seg, fc / 1.4, min(fc * 1.4, SR / 2 - 100))
        out[i : i + chunk] = y[-len(out[i : i + chunk]) :]
    return (out * 0.35 + tone) * p**2


def sfx_whoosh(frames):
    """Pull-away: noise band and a tone falling in pitch (doppler) as the car recedes."""
    n = int(frames / FPS * SR)
    t = tsec(n)
    p = t / t[-1]
    nz = noise(n)
    out = np.zeros(n)
    chunk = int(0.01 * SR)
    for i in range(0, n, chunk):
        fc = 2600 * (380 / 2600) ** (i / n)
        seg = nz[max(0, i - 2048) : i + chunk]
        y = bp(seg, fc / 1.6, min(fc * 1.6, SR / 2 - 100))
        out[i : i + chunk] = y[-len(out[i : i + chunk]) :]
    tone = np.sin(2 * np.pi * np.cumsum(520 * 2 ** (-1.1 * p)) / SR) * 0.12
    amp = np.minimum(1, p / 0.12) * (1 - p) ** 1.4
    return (out * 0.6 + tone) * amp


# ------------------------------------------------------------------ arrangement

CHORDS = [  # one per bar, A minor: Fmaj9 -> G6 -> Em7 -> Am9
    {"root": midi(41), "pad": [midi(m) for m in (53, 57, 60, 64, 67)]},  # F A C E G
    {"root": midi(43), "pad": [midi(m) for m in (55, 59, 62, 64)]},  # G B D E
    {"root": midi(40), "pad": [midi(m) for m in (52, 55, 59, 62)]},  # E G B D
    {"root": midi(45), "pad": [midi(m) for m in (57, 60, 64, 67, 71)]},  # A C E G B
]
BEAT_S = 24000  # beat n starts at sample n*24000 (frame n*15)
BAR_S = 4 * BEAT_S
STEP_S = BEAT_S // 4
assert SR == 48000 and FPS == 30 and T["bpm"] == 120

ON = A["onGrid"]
OFF = A["offbeat"]
OFFBEAT_CUES = sorted(f for v in OFF.values() for f in v)
CLEAR = int(0.060 * SR)  # the groove drops any non-beat event this close to an offbeat cue


def check_grid():
    bad = [(k, f) for k, v in ON.items() for f in v if f % T["beat"] != 0]
    bad += [("keysOnGrid", f) for f in A["keysOnGrid"] if f % T["beat"]] + [("reelOnGrid", f) for f in A["reelOnGrid"] if f % T["beat"]]
    if bad:
        sys.exit(f"onGrid cues off the beat grid: {bad}")


def step_at(bar, step):
    """sample of a 16th: beats exactly on the grid, off-16ths swung to 56%"""
    pair = step // 2
    off = step % 2
    return bar * BAR_S + pair * 2 * STEP_S + (int(round(SWING * 2 * STEP_S)) if off else 0)


def near_offbeat(at):
    return any(abs(at - fs(c)) < CLEAR for c in OFFBEAT_CUES)


KICK = [0, 4, 8, 12]  # four on the floor: every beat of the groove has exactly one kick
CLAP = [4, 12]
LOG = [(3, 0), (6, 0), (10, 7), (11, 0), (14, 12)]  # (step, semitone offset)
PLUCK_STEPS = [0, 3, 6, 8, 11, 14]


def sections(frame):
    """what plays at a frame: 'build' | 'full' | 'halt' (f600-660, "Blink": silence) | 'out'"""
    if frame < A["drop"]:
        return "build"
    if frame < A["halt"]:
        return "full"
    if frame < A["backIn"]:
        return "halt"
    if frame > A["drumsOutAfter"]:
        return "out"
    return "full"


KICKS_PLACED = []  # sample positions of every groove kick (for the onset check)


def accent(music, drums, sfx, frame, big=False):
    """Accent on a beat that already has the groove's kick: stab + clap + crash only, never another kick."""
    at = fs(frame)
    place(music, stab(CHORDS[(at // BAR_S) % 4]["pad"], 0.3 if big else 0.22), at, 0.45)
    place(drums, clap(), at, 0.45, pan=0.05)
    place(sfx, crash(1.4 if big else 0.8), at, 0.8 if big else 0.5, pan=-0.1)


def build():
    check_grid()
    drums = np.zeros((N, 2))
    bass = np.zeros((N, 2))
    music = np.zeros((N, 2))
    sfx = np.zeros((N, 2))
    K, CL = kick(), clap()
    n_bars = int(np.ceil(N / BAR_S))
    for bar in range(n_bars):
        ch = CHORDS[bar % 4]
        pad_n = BAR_S + int(0.3 * SR)
        start = bar * BAR_S
        f0 = start * FPS / SR
        if sections(f0) != "halt":
            pad = chord_tone(ch["pad"], pad_n, cutoff=280 if f0 < A["drop"] else 2200, voices=3)
            pad *= np.minimum(1, tsec(pad_n) / 0.08) * np.minimum(1, (pad_n - np.arange(pad_n)) / (0.3 * SR))
            place(music, pad, start, 0.22, pan=-0.15)
        elif (bar + 1) * BAR_S > fs(A["backIn"]):
            rest = (bar + 1) * BAR_S - fs(A["backIn"]) + int(0.3 * SR)
            pad = chord_tone(ch["pad"], rest, cutoff=2200, voices=3) * np.minimum(1, (rest - np.arange(rest)) / (0.3 * SR))
            place(music, pad, fs(A["backIn"]), 0.22, pan=-0.15)
        for s_ in range(16):
            at = step_at(bar, s_)
            if at >= N:
                continue
            fr = at * FPS / SR
            sec = sections(fr)
            if sec in ("build", "halt", "out"):
                continue
            on_beat = s_ % 4 == 0
            if not on_beat and near_offbeat(at):
                continue  # leave room for an offbeat cue (keys, reel ticks, blinks)
            place(drums, shaker(1.0 if s_ % 4 == 2 else 0.6), at, 0.9, pan=0.35 if s_ % 2 else 0.2)
            if sec != "full":
                continue
            if s_ in KICK:
                place(drums, K, at, 0.9)
                KICKS_PLACED.append(at)
            if s_ in CLAP:
                place(drums, CL, at, 0.5, pan=-0.05)
            for st, semi in LOG:
                if s_ == st:
                    place(bass, log_drum(ch["root"] * 2 ** (semi / 12)), at, 0.75)
            if s_ in PLUCK_STEPS and fr >= 150:
                tones = ch["pad"]
                place(music, pluck(tones[(s_ + bar) % len(tones)] * 2, 0.45, 0.4), at, 0.16, pan=0.4 if s_ % 3 else -0.3)
    # build: the pad's filter opens 280 Hz -> 4 kHz over f0-60, plus a riser into the drop
    b0, b1 = fs(A["build"][0]), fs(A["build"][1])
    n = b1 - b0
    raw = chord_tone(CHORDS[0]["pad"], n, cutoff=12000, voices=3)
    out = np.zeros(n)
    chunk = int(0.01 * SR)
    for i in range(0, n, chunk):
        fc = 280 * (4000 / 280) ** (i / n)
        seg = raw[max(0, i - 2048) : i + chunk]
        out[i : i + chunk] = lp(seg, fc)[-len(out[i : i + chunk]) :]
    place(music, out * np.linspace(0.5, 1, n), b0, 0.3)
    place(sfx, sfx_riser(A["drop"] - A["build"][0]), b0, 0.5)
    # accents on kick beats: stab + clap + crash, no extra kick
    for h in ON["hits"]:
        accent(music, drums, sfx, h, big=h == A["drop"])
    for h in ON["stabs"]:
        place(music, stab([f * 2 for f in CHORDS[(fs(h) // BAR_S) % 4]["pad"]]), fs(h), 0.45, pan=0.1)
    accent(music, drums, sfx, ON["backIn"][0], big=True)
    accent(music, drums, sfx, ON["finalHit"][0], big=True)
    # swell under the flood (f645-690)
    s0, s1 = fs(A["swell"][0]), fs(A["swell"][1])
    sw = chord_tone([f * 2 for f in CHORDS[2]["pad"]], s1 - s0, cutoff=3000, voices=4) * np.linspace(0, 1, s1 - s0) ** 2
    place(music, sw, s0, 0.35)
    place(sfx, sfx_riser(A["swell"][1] - A["swell"][0]), s0, 0.25)
    for i, p in enumerate(ON["plucks"]):
        place(music, pluck(midi(76 + [0, 3, 7][i]), 0.9, 0.9), fs(p), 0.45, pan=0.2)
    # cues
    for c in ON["clack"] + OFF["clack"]:
        place(sfx, sfx_clack(), fs(c), 0.8, pan=0.1)
    for w in OFF["wipes"]:  # swells that peak on the beat
        place(sfx, sfx_wipe(), fs(w), 0.6)
    for tp in ON["taps"]:
        place(sfx, sfx_tap(), fs(tp), 0.7, pan=-0.3)
    for k in sorted(OFF["keys"] + A["keysOnGrid"]):
        place(sfx, sfx_key(), fs(k), 0.6, pan=-0.3)
    for r in sorted(OFF["reel"] + A["reelOnGrid"]):
        place(sfx, sfx_tick(2600), fs(r), 0.45, pan=-0.2)
    place(sfx, sfx_tock(), fs(ON["pin"][0]), 0.9)
    # the door click sits on top of the music (f700)
    place(sfx, sfx_door(), fs(OFF["door"][0]), 0.9)
    place(sfx, sfx_whoosh(A["whooshLen"]), fs(ON["whoosh"][0]), 0.8)
    for tk in sorted(ON["endTicks"] + OFF["endTicks"]):
        place(sfx, sfx_tick(3600), fs(tk), 0.6)
    return drums, bass, music, sfx


def bezier_ease(x1, y1, x2, y2):
    def f(u):
        u = min(1.0, max(0.0, u))
        lo, hi = 0.0, 1.0
        for _ in range(40):
            m = (lo + hi) / 2
            bx = 3 * (1 - m) ** 2 * m * x1 + 3 * (1 - m) * m**2 * x2 + m**3
            if bx < u:
                lo = m
            else:
                hi = m
        m = (lo + hi) / 2
        return 3 * (1 - m) ** 2 * m * y1 + 3 * (1 - m) * m**2 * y2 + m**3

    return f


expo_out = bezier_ease(0.16, 1, 0.3, 1)


def reverb_ir(sec=1.8):
    n = int(sec * SR)
    t = tsec(n)
    ir = np.stack([noise(n), noise(n)], axis=1) * np.exp(-t / 0.42)[:, None]
    ir = np.stack([lp(ir[:, 0], 6000), lp(ir[:, 1], 6000)], axis=1)
    ir[: int(0.012 * SR)] = 0  # pre-delay
    return ir / np.sqrt(np.sum(ir**2))


def apply_reverb(x, ir, wet):
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return x + wet * y


def duck_env(hits):
    g = np.ones(N)
    db = 10 ** (-4 / 20)
    a, h, r = int(0.005 * SR), int(0.06 * SR), int(0.2 * SR)
    shape = np.concatenate([np.linspace(1, db, a), np.full(h, db), np.linspace(db, 1, r)])
    for fr in hits:
        i = fs(fr)
        e = min(N, i + len(shape))
        g[i:e] = np.minimum(g[i:e], shape[: e - i])
    return g


def halt(x):
    """f600 -> f660 ("Blink"): the music stops dead; only the two eyelid ticks are added afterwards."""
    a, b = fs(A["halt"]), fs(A["backIn"])
    fade = int(0.003 * SR)
    x[a - fade : a] *= np.linspace(1, 0, fade)[:, None]
    x[a:b] = 0
    return x


def limiter(x, ceiling_db=-1.5, release=0.08):
    c = 10 ** (ceiling_db / 20)
    peak = np.max(np.abs(x), axis=1)
    look = int(0.003 * SR)
    pk = np.maximum(peak, np.concatenate([peak[look:], np.zeros(look)]))
    gain = np.minimum(1.0, c / np.maximum(pk, 1e-9))
    rel = np.exp(-1 / (release * SR))
    g = np.empty_like(gain)
    cur = 1.0
    for i in range(len(gain)):
        cur = gain[i] if gain[i] < cur else rel * cur + (1 - rel) * gain[i]
        g[i] = cur
    return x * g[:, None]


def loudnorm(x):
    with tempfile.TemporaryDirectory() as d:
        src = os.path.join(d, "pre.wav")
        dst = os.path.join(d, "post.wav")
        sf.write(src, x, SR, subtype="FLOAT")
        p1 = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", src, "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
        js = p1.stderr[p1.stderr.rfind("{") : p1.stderr.rfind("}") + 1]
        m = json.loads(js)
        af = (
            f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
            f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=json"
        )
        p2 = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-i", src, "-af", af, "-ar", str(SR), "-c:a", "pcm_f32le", dst], capture_output=True, text=True)
        js2 = p2.stderr[p2.stderr.rfind("{") : p2.stderr.rfind("}") + 1]
        info = json.loads(js2)
        y, _ = sf.read(dst, dtype="float64")
    if len(y) < N:
        y = np.concatenate([y, np.zeros((N - len(y), 2))])
    return y[:N], info


# ------------------------------------------------------------------ onset analysis of the final mix

def _zp(x, sos):
    from scipy.signal import sosfiltfilt

    return sosfiltfilt(sos, x)


def detect_kicks(mono):
    """Kick onsets by normalised cross-correlation with the kick waveform in the low band (<200 Hz):
    sample-precise. A kick is a correlation peak >= 0.8, at least 200 ms from the next."""
    sos = butter(4, 200, btype="low", fs=SR, output="sos")
    x = _zp(mono, sos)
    tpl = _zp(np.concatenate([kick(), np.zeros(256)]), sos)[: int(0.06 * SR)]
    tpl = tpl - tpl.mean()
    corr = fftconvolve(x, tpl[::-1], mode="full")[len(tpl) - 1 :]
    energy = fftconvolve(x**2, np.ones(len(tpl)), mode="full")[len(tpl) - 1 :]
    rho = corr / (np.sqrt(np.maximum(energy, 1e-12)) * np.linalg.norm(tpl))
    out = []
    i = 0
    while i < len(rho):
        if rho[i] >= 0.8:
            j = i + int(np.argmax(rho[i : i + int(0.02 * SR)]))
            out.append(j)
            i = j + int(0.2 * SR)
        else:
            i += 1
    return np.array(out)


def onset_envelope(mono, n_fft=1024, hop=96):
    """SuperFlux spectral flux (log magnitude, frequency max-filter on the reference frame)."""
    from scipy.ndimage import maximum_filter1d

    pad = np.concatenate([np.zeros(n_fft // 2), mono, np.zeros(n_fft // 2)])
    n_frames = 1 + (len(pad) - n_fft) // hop
    win = np.hanning(n_fft)
    idx = np.arange(n_fft)[None, :] + hop * np.arange(n_frames)[:, None]
    mag = np.abs(np.fft.rfft(pad[idx] * win, axis=1))
    L = np.log1p(100 * mag)
    ref = maximum_filter1d(L, size=3, axis=1)
    flux = np.maximum(0, L[1:] - ref[:-1]).sum(axis=1)
    flux = np.concatenate([[0], flux])
    return flux / max(1e-9, flux.max()), hop


def detect_transients(mono):
    """librosa-style peak picking on the onset envelope: local max over the past 30 ms, above the
    ±100 ms mean by 0.07, then a 20 ms wait. Returns onset sample positions."""
    o, hop = onset_envelope(mono)
    fr = lambda sec: max(1, int(round(sec * SR / hop)))
    pre_max, pre_avg, post_avg, wait = fr(0.03), fr(0.1), fr(0.1), fr(0.02)
    peaks = []
    last = -10**9
    for t in range(1, len(o) - 1):
        if o[t] < o[t - 1] or o[t] < o[t + 1]:
            continue
        if o[t] < o[max(0, t - pre_max) : t + 1].max():
            continue
        if o[t] < o[max(0, t - pre_avg) : t + post_avg + 1].mean() + 0.07:
            continue
        if t - last < wait:
            continue
        peaks.append(t)
        last = t
    return np.array(peaks) * hop


def onset_report(y):
    mono = y.mean(axis=1)
    kicks = detect_kicks(mono)
    # every groove kick must be found within +-1 ms of n*0.5 s
    errs = []
    for k in KICKS_PLACED:
        assert k % BEAT_S == 0, f"groove kick off the grid at sample {k}"
        near = kicks[np.argmin(np.abs(kicks - k))] if len(kicks) else -10**9
        errs.append((near - k) / SR * 1000)
    errs = np.array(errs)
    tr = detect_transients(mono)
    gaps = np.diff(tr) / SR * 1000
    close = [(round(float(tr[i]) / SR * FPS, 2), round(float(gaps[i]), 1)) for i in np.where(gaps < 50)[0]]
    return {
        "kicks_expected": len(KICKS_PLACED),
        "kick_err_ms_max": float(np.max(np.abs(errs))) if len(errs) else 0.0,
        "kicks_off": [round(KICKS_PLACED[i] / SR * FPS, 1) for i in np.where(np.abs(errs) > 1.0)[0]],
        "transients": len(tr),
        "min_gap_ms": float(gaps.min()) if len(gaps) else 0.0,
        "close": close,
        "kicks_detected": int(len(kicks)),
        "kicks_detected_off_grid": [round(float(k) / SR * FPS, 2) for k in kicks if abs(k - round(k / BEAT_S) * BEAT_S) > SR / 1000],
    }


def main():
    drums, bass, music, sfx = build()
    ir = reverb_ir()
    music = apply_reverb(music, ir, 0.35)
    drums = drums + 0.12 * np.stack([fftconvolve(drums[:, c], ir[:, c])[:N] for c in range(2)], axis=1)
    duck = duck_env(ON["hits"] + ON["stabs"] + ON["backIn"] + ON["finalHit"])
    music *= duck[:, None]
    bass *= duck[:, None]
    # drums out after f870 (already not triggered); short tail to 900 on everything
    for x in (drums, bass, music, sfx):
        halt(x)
    sfx = apply_reverb(sfx, ir, 0.12)
    halt(sfx)
    # the door click is the only sound in the halt (f590); dry, it has its own tail
    # in the silence: the two blink sounds, nothing else
    # (frame, peak dBFS): the two blink ticks and the softer "open" tick
    LEV = A["levels"]
    SILENT_SOUNDS = sorted([(b, LEV["blinks"]) for b in ON["blinks"] + OFF["blinks"]] + [(b, LEV["openTick"]) for b in OFF["openTick"]])
    BLINKS = [b for b, _ in SILENT_SOUNDS]
    for b in BLINKS:
        place(sfx, sfx_eyelid(), fs(b), 1.0)
    tail = int(0.12 * SR)
    mix = drums + bass + music + sfx
    mix[-tail:] *= np.linspace(1, 0, tail)[:, None]
    os.makedirs(STEMS, exist_ok=True)
    for name, st in (("drums", drums), ("bass", bass), ("music", music), ("sfx", sfx)):
        sf.write(os.path.join(STEMS, f"{name}.wav"), np.clip(st / max(1.0, np.max(np.abs(st)) * 1.05), -1, 1), SR, subtype="PCM_24")
    pre = limiter(mix / max(1e-9, np.max(np.abs(mix))) * 10 ** (PRE_GAIN_DB / 20), ceiling_db=-2.0)
    out, info = loudnorm(pre)
    a, b = fs(A["halt"]), fs(A["backIn"])
    out[a:b] = np.where(np.abs(out[a:b]) < 10 ** (-90 / 20), 0, out[a:b])
    # the blink sounds are alone in the silence: set each to its exact peak level after mastering
    for bl, db in SILENT_SOUNDS:
        seg = out[fs(bl) : fs(bl) + EYELID_LEN]
        seg *= 10 ** (db / 20) / max(1e-12, np.max(np.abs(seg)))
    path = os.path.join(OUT, "score-v2.wav")
    sf.write(path, out, SR, subtype="PCM_24")

    # ------------------------------------------------ asserts
    y, sr = sf.read(path, dtype="float64")
    problems = []
    if sr != SR or y.shape != (N, 2):
        problems.append(f"format {sr} {y.shape}")
    if np.max(np.abs(y)) >= 1.0:
        problems.append("clipping")
    # f601-659 must be silent apart from the blink / open ticks
    quiet = np.ones(N, bool)
    quiet[: fs(A["halt"] + 1)] = False
    quiet[fs(A["backIn"]) :] = False
    for bl in BLINKS:
        quiet[fs(bl) : fs(bl) + EYELID_LEN] = False
    sil = 20 * np.log10(max(1e-12, np.max(np.abs(y[quiet]))))
    blink_db = [round(20 * np.log10(np.max(np.abs(y[fs(bl) : fs(bl) + EYELID_LEN]))), 1) for bl in BLINKS]
    if sil > -60:
        problems.append(f"f601-659 not silent outside the blink/open ticks ({sil:.1f} dBFS)")
    # cues: the sharpest attack in the SFX stem within +-1.5 frames of each cue must sit within +-1 frame of it
    s, _ = sf.read(os.path.join(STEMS, "sfx.wav"), dtype="float64")
    env = np.convolve(np.abs(s).max(axis=1), np.ones(48) / 48, mode="same")  # 1 ms envelope
    rise = np.diff(env, prepend=env[0])
    cues = ON["taps"] + ON["clack"] + OFF["clack"] + ON["pin"] + OFF["door"] + BLINKS + ON["endTicks"] + OFF["endTicks"]
    late = []
    for c in cues:
        w0, w1 = fs(c - 1.5), fs(c + 1.5)
        on = w0 + int(np.argmax(rise[w0:w1]))
        if abs(on - fs(c)) > SR / FPS:
            late.append((c, round((on - fs(c)) / SR * FPS, 2)))
    if late:
        problems.append(f"cues off by >1 frame: {late}")
    print(f"wrote {os.path.relpath(path, ROOT)}  {N / SR:.3f}s  {SR} Hz 24-bit stereo")
    print(f"  loudnorm out: I={info.get('output_i')} LUFS  TP={info.get('output_tp')} dBTP  LRA={info.get('output_lra')}  ({info.get('normalization_type')})")
    print(f"  peak {20 * np.log10(np.max(np.abs(y))):.2f} dBFS · f601-659 max {sil:.1f} dBFS outside the blinks (blinks peak {blink_db} dBFS) · {len(cues)} cues checked")
    rep = onset_report(y)
    print(f"  onsets: {rep['kicks_expected']} groove kicks, max error {rep['kick_err_ms_max']:.3f} ms (limit 1 ms); "
          f"{rep['transients']} transients, min gap {rep['min_gap_ms']:.1f} ms (limit 50 ms)")
    print(f"  kick detector: {rep['kicks_detected']} kick-shaped onsets found, {len(rep['kicks_detected_off_grid'])} off the grid")
    if rep["kicks_detected_off_grid"]:
        problems.append(f"kick-shaped onsets off the grid at frames {rep['kicks_detected_off_grid']}")
    if rep["kicks_off"]:
        problems.append(f"kicks off the grid by >1 ms at frames {rep['kicks_off']}")
    if rep["close"]:
        problems.append(f"transients closer than 50 ms at (frame, gap ms) {rep['close']}")
    json.dump(rep, open(os.path.join(STEMS, "..", "onset-report.json"), "w"), indent=1)
    if problems:
        print("FAILED:", "; ".join(problems))
        sys.exit(1)
    print("  all asserts passed")


if __name__ == "__main__":
    main()

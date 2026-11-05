#!/usr/bin/env python3
"""
Shuttlers Pod: original score + SFX, generated in code (no external audio).

Reads src/config/timing.json and writes 48 kHz / 24-bit stereo WAVs to public/audio/:
  score-hero.wav (32.000 s), score-cutdown.wav (15.000 s)
  music-hero.wav, sfx-hero.wav, music-cutdown.wav, sfx-cutdown.wav (stems)

Style: warm, optimistic Afro-house with an amapiano lean. 120 BPM, A minor,
one chord per bar: Fmaj9 → G6 → Em7 → Am9. Every instrument is synthesised.
Re-run whenever timing.json changes:  python3 audio/build_audio.py
"""
import json
import os
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TIMING = json.load(open(os.path.join(ROOT, "src/config/timing.json")))
OUT = os.path.join(ROOT, "public/audio")
os.makedirs(OUT, exist_ok=True)

SR = 48000
FPS = TIMING["fps"]
BPM = TIMING["bpm"]
BEAT_S = 60.0 / BPM
BAR_S = BEAT_S * 4
RNG = np.random.default_rng(20261008)


def fs(frame):  # frame → seconds
    return frame / FPS


def smp(sec):
    return int(round(sec * SR))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def env_exp(n, tau_s, attack_s=0.002):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack_s, 1e-6), 0, 1)
    return a * np.exp(-t / tau_s)


def add(buf, x, at_s, gain=1.0, pan=0.0):
    """Mix mono/stereo x into stereo buf at time at_s with equal-power pan."""
    i = smp(at_s)
    if i >= buf.shape[0]:
        return
    if x.ndim == 1:
        l = np.cos((pan + 1) * np.pi / 4)
        r = np.sin((pan + 1) * np.pi / 4)
        x = np.stack([x * l * np.sqrt(2), x * r * np.sqrt(2)], axis=1)
    j0 = max(0, i)
    k0 = j0 - i
    n = min(buf.shape[0] - j0, x.shape[0] - k0)
    if n > 0:
        buf[j0 : j0 + n] += x[k0 : k0 + n] * gain


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, min(hi, SR / 2 - 100)], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="high", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, min(f, SR / 2 - 100), btype="low", fs=SR, output="sos"), x)


def noise(n):
    return RNG.standard_normal(n)


def sweep_bp(x, f0, f1, q=2.0, block=256):
    """Band-pass with a log-swept centre (block-wise coefficients, carried state)."""
    out = np.zeros_like(x)
    zi = None
    nb = int(np.ceil(len(x) / block))
    for b in range(nb):
        c = f0 * (f1 / f0) ** (b / max(1, nb - 1))
        lo, hi = c / (1 + 0.5 / q), c * (1 + 0.5 / q)
        sos = signal.butter(1, [lo, min(hi, SR / 2 - 200)], btype="band", fs=SR, output="sos")
        if zi is None:
            zi = signal.sosfilt_zi(sos) * 0
        seg = x[b * block : (b + 1) * block]
        y, zi = signal.sosfilt(sos, seg, zi=zi)
        out[b * block : (b + 1) * block] = y
    return out


def tv_lowpass(x, cutoff_fn, block=512):
    """Time-varying low-pass for stereo x; cutoff_fn(t_seconds) → Hz."""
    out = np.zeros_like(x)
    zi = None
    for b in range(int(np.ceil(x.shape[0] / block))):
        t = b * block / SR
        sos = signal.butter(2, float(np.clip(cutoff_fn(t), 60, SR / 2 - 500)), btype="low", fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2, 2))
        seg = x[b * block : (b + 1) * block]
        y, zi = signal.sosfilt(sos, seg, axis=0, zi=zi)
        out[b * block : (b + 1) * block] = y
    return out


def plate_ir(seconds=1.6, decay=0.42):
    n = smp(seconds)
    t = np.arange(n) / SR
    l = noise(n) * np.exp(-t / decay)
    r = noise(n) * np.exp(-t / decay)
    l, r = lp(hp(l, 300), 7000), lp(hp(r, 300), 7000)
    ir = np.stack([l, r], axis=1)
    return ir / np.sqrt(np.sum(ir**2) / 2)


IR = plate_ir()
IR_LONG = plate_ir(3.2, 0.9)


def reverb(x, ir=IR, wet=0.3):
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    y = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: x.shape[0]] for c in range(2)], axis=1)
    return x * (1 - wet) + y * wet


# ---------------------------------------------------------------- instruments

def kick(amp=1.0):
    n = smp(0.45)
    t = np.arange(n) / SR
    f = 45 + (120 - 45) * np.exp(-t / 0.03)  # 120 → 45 Hz over ~120 ms
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.22)
    click = hp(noise(n), 3000) * np.exp(-t / 0.0015) * 0.5
    return np.tanh((body + click) * 1.6) * amp


def sub(freq=55.0, dur=0.8):
    n = smp(dur)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.35) * np.clip(t / 0.005, 0, 1)


def clap():
    n = smp(0.25)
    out = np.zeros(n)
    for k in range(3):
        i = smp(0.010 * k)
        m = smp(0.012)
        out[i : i + m] += noise(m) * np.exp(-np.arange(m) / SR / 0.004)
    tail = noise(n) * np.exp(-np.arange(n) / SR / 0.15) * 0.6
    out += tail * (np.arange(n) > smp(0.02))
    return bp(out, 1000, 3000) * 2.2


def shaker(acc=1.0):
    n = smp(0.06)
    t = np.arange(n) / SR
    return hp(noise(n), 7000) * np.clip(t / 0.004, 0, 1) * np.exp(-t / 0.018) * acc


def log_drum(freq, dur=0.5):
    n = smp(dur)
    t = np.arange(n) / SR
    f = freq * 2 ** ((7 / 12) * np.exp(-t / 0.02))  # +7 st → target in ~60 ms
    ph = 2 * np.pi * np.cumsum(f) / SR
    tri = 2 / np.pi * np.arcsin(np.sin(ph))
    x = 0.6 * np.sin(ph) + 0.4 * tri
    return np.tanh(x * np.exp(-t / 0.35) * 2.4) * 0.8


def saw_voice(freq, n, detune_cents=0.0, harmonics=24):
    t = np.arange(n) / SR
    f = freq * 2 ** (detune_cents / 1200)
    x = np.zeros(n)
    phase = RNG.uniform(0, 2 * np.pi)
    for k in range(1, harmonics + 1):
        if f * k > 9000:
            break
        x += np.sin(2 * np.pi * f * k * t + phase * k) / k
    return x


def pad_chord(notes, dur):
    n = smp(dur)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for i, m in enumerate(notes):
        for j, d in enumerate([-7, -2.5, 2.5, 7]):
            v = saw_voice(mtof(m), n, d, 14) * 0.12
            pan = -0.6 + 1.2 * ((i * 4 + j) % 5) / 4
            out[:, 0] += v * np.cos((pan + 1) * np.pi / 4)
            out[:, 1] += v * np.sin((pan + 1) * np.pi / 4)
    a = np.clip(t / 0.3, 0, 1) * np.clip((dur - t) / 0.3, 0, 1)
    return out * a[:, None]


def pluck(freq, dur=0.22):
    n = smp(dur)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k in range(1, 18):
        if freq * k > 12000:
            break
        x += np.sin(2 * np.pi * freq * k * t) / k * np.exp(-t * (6 + 9 * k))  # fast filter envelope
    return x * np.clip(t / 0.002, 0, 1) * 0.5


def stab(notes):
    n = smp(0.5)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for m in notes:
        x += saw_voice(mtof(m), n, RNG.uniform(-4, 4), 10)
    return lp(x * np.exp(-t / 0.08), 3500) * 0.35


def bell(freq, dur=1.2):
    n = smp(dur)
    t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t / (0.9 / r)) for r, a in [(1, 1), (2.76, 0.45), (5.4, 0.22), (8.93, 0.1)])
    return x * np.clip(t / 0.002, 0, 1) * 0.35


def riser(dur):
    n = smp(dur)
    t = np.arange(n) / SR
    nz = sweep_bp(noise(n), 400, 7000, q=1.5) * (t / dur) ** 2
    f = 200 * (1200 / 200) ** (t / dur)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / dur) ** 2 * 0.25
    return nz * 0.8 + s


# ---------------------------------------------------------------- sfx

def sfx_tap():
    n = smp(0.05)
    t = np.arange(n) / SR
    click = hp(noise(n), 2000) * (t < 0.0015)
    blip = np.sin(2 * np.pi * 1200 * t) * np.exp(-t / 0.008) * (t < 0.025)
    return click * 0.6 + blip * 0.5


def sfx_key():
    n = smp(0.01)
    t = np.arange(n) / SR
    return hp(noise(n), 2500) * np.exp(-t / 0.0006) * 0.35


def sfx_pop():
    n = smp(0.09)
    t = np.arange(n) / SR
    f = 900 * (300 / 900) ** np.clip(t / 0.06, 0, 1)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.03) * np.clip(t / 0.001, 0, 1) * 0.6


def sfx_whoosh(dur=0.25, f0=300, f1=3000):
    n = smp(dur + 0.1)
    t = np.arange(n) / SR
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return sweep_bp(noise(n), f0, f1, q=1.2) * e * 0.9


def sfx_shimmer():
    n = smp(0.6)
    t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t + RNG.uniform(0, 6)) for f in (2600, 3900, 5200)) * np.exp(-t / 0.4) * np.clip(t / 0.003, 0, 1)
    return reverb(x * 0.18, wet=0.45)


def sfx_gps():
    n = smp(0.6)
    out = np.zeros(n)
    m = smp(0.12)
    tt = np.arange(m) / SR
    ping = np.sin(2 * np.pi * 1600 * tt) * np.exp(-tt / 0.04)
    for k, g in enumerate([1, 0.45, 0.2]):
        i = smp(0.15 * k)
        out[i : i + m] += ping * g
    return out * 0.35


def sfx_select():
    out = np.zeros(smp(0.6))
    for k, m in enumerate([88, 93]):  # E6 → A6
        b = bell(mtof(m), 0.45)
        i = smp(0.07 * k)
        out[i : i + len(b)] += b[: len(out) - i]
    return out * 0.8


def sfx_lock():
    n = smp(0.5)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(2):
        i = smp(0.03 * k)
        m = smp(0.02)
        tt = np.arange(m) / SR
        c = bp(noise(m), 2500, 6000) * np.exp(-tt / 0.003) + np.sin(2 * np.pi * 3100 * tt) * np.exp(-tt / 0.006) * 0.4
        out[i : i + m] += c * 0.7
    thump = np.sin(2 * np.pi * (60 + 40 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.12)
    return out + thump * 0.9


def sfx_success():
    out = np.zeros(smp(1.4))
    for k, m in enumerate([76, 79, 84]):  # E5 G5 C6
        b = bell(mtof(m), 1.0)
        i = smp(0.09 * k)
        out[i : i + len(b)] += b[: len(out) - i]
    return out


def sfx_popper():
    n = smp(0.7)
    t = np.arange(n) / SR
    pf = lp(noise(n), 900) * np.exp(-t / 0.05) * 1.2
    cr = np.zeros(n)
    for _ in range(60):
        i = int(RNG.uniform(0.02, 0.6) * SR)
        m = smp(0.004)
        if i + m < n:
            cr[i : i + m] += hp(noise(m), 4000) * RNG.uniform(0.1, 0.5) * np.exp(-(i / SR) / 0.3)
    return pf + cr


def sfx_car(gain=1.0, dur=1.1):
    n = smp(dur)
    t = np.arange(n) / SR
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    dop = sweep_bp(noise(n), 1800, 500, q=1.5) * e
    rumble = lp(noise(n), 120) * e * 2.5
    return (dop * 0.8 + rumble) * gain * 0.7


def sfx_carby():
    n = smp(0.45)
    t = np.arange(n) / SR
    e = np.exp(-((t - 0.12) ** 2) / (2 * 0.06**2))
    return sweep_bp(noise(n), 2500, 600, q=1.4) * e * 0.9


def sfx_whip():
    return sfx_whoosh(0.12, 1500, 9000) * 0.8


# ---------------------------------------------------------------- arrangement

CHORDS = [  # (pad voicing in 220–660 Hz, log-drum root, name)
    ([57, 60, 64, 67], mtof(41), "Fmaj9"),
    ([62, 64, 67, 71], mtof(43), "G6"),
    ([59, 62, 64, 67], mtof(40), "Em7"),
    ([60, 64, 67, 71], mtof(45), "Am9"),
]
LOG_PATTERN = [0, 3, 6, 10, 12, 14]  # syncopated 16ths in a bar


def in_ranges(fr, ranges):
    return any(a <= fr < b for a, b in ranges)


def build_music(A, n_frames, word_frames):
    N = smp(fs(n_frames))
    drums = np.zeros((N, 2))
    tonal = np.zeros((N, 2))
    hits = np.zeros((N, 2))
    verb_send = np.zeros((N, 2))
    groove = [tuple(r) for r in A["groove"]]
    sixteenth = BEAT_S / 4

    # pad: one chord per bar (+0.3 s overlap); outro resolves Fmaj9 → Am9 with long reverb
    n_bars = int(np.ceil(fs(n_frames) / BAR_S))
    outro0 = fs(A["outro"][0])
    for b in range(n_bars):
        t0 = b * BAR_S
        if t0 >= outro0:
            break
        notes = CHORDS[b % 4][0]
        add(tonal, pad_chord(notes, BAR_S + 0.3), t0, 0.55)
    o0, o1 = A["outro"]
    half = (o1 - o0) / 2
    outro_pad = np.zeros((N, 2))
    add(outro_pad, pad_chord(CHORDS[0][0], fs(half) + 0.4), fs(o0), 0.6)
    add(outro_pad, pad_chord(CHORDS[3][0] + [76], fs(half) + 0.6), fs(o0 + half), 0.6)

    # pluck arpeggio on 1/8 notes (chord tones an octave up)
    for k in range(int(fs(n_frames) / (BEAT_S / 2))):
        t = k * BEAT_S / 2
        fr = t * FPS
        if fr >= A["outro"][0]:
            break
        notes = CHORDS[int(t // BAR_S) % 4][0]
        m = notes[[0, 2, 1, 3, 2, 0, 3, 1][k % 8]] + 12
        g = 0.18 if fr < A["drop"] else 0.26
        add(tonal, pluck(mtof(m)), t, g, pan=0.35 if k % 2 else -0.35)

    # groove: kick, clap 2&4, swung shaker 16ths, log drum, offbeat stabs
    beats = int(fs(n_frames) / BEAT_S) + 1
    for bt in range(beats):
        t = bt * BEAT_S
        fr = t * FPS
        bar = int(t // BAR_S)
        notes, root, _ = CHORDS[bar % 4]
        in_g = in_ranges(fr, groove)
        drums_live = in_g or (A["outro"][0] <= fr < A["drumsOut"])
        if drums_live:
            add(drums, kick(), t, 0.9)
            if bt % 2 == 1:
                add(drums, clap(), t, 0.42)
            # offbeat stab on the "and" of 2 and 4
            if bt % 2 == 1:
                st = stab([n + 12 for n in notes[1:]])
                add(tonal, st, t + BEAT_S / 2, 0.5)
                add(verb_send, st, t + BEAT_S / 2, 0.5)
        shaker_live = drums_live or (A["breakdown"][0] <= fr < A["build"][1])
        if shaker_live:
            for s in range(4):
                off = s * sixteenth + (0.56 - 0.5) * 2 * sixteenth * (s % 2)
                acc = [1.0, 0.4, 0.7, 0.4][s]
                add(drums, shaker(acc), t + off, 0.16, pan=0.25)
        if in_g and bt % 4 == 0:
            for s in LOG_PATTERN:
                add(drums, log_drum(root), t + s * sixteenth, 0.55)

    # one-beat log-drum fills before scene changes
    for fr in A["fills"]:
        t = fs(fr) - BEAT_S
        root = CHORDS[int(fs(fr) // BAR_S) % 4][1]
        for s in range(4):
            add(drums, log_drum(root * 2 ** (s * 2 / 12), 0.2), t + s * sixteenth, 0.5)

    # build: clap roll 1/8 → 1/16 over the build window
    b0, b1 = A["build"]
    t, end = fs(b0), fs(b1)
    while t < end:
        p = (t - fs(b0)) / max(1e-6, end - fs(b0))
        add(drums, clap(), t, 0.15 + 0.3 * p)
        t += (BEAT_S / 2) * (1 - p) + (BEAT_S / 4) * p

    # intro word ticks + riser
    for fr in word_frames:
        n = smp(0.02)
        tick = hp(noise(n), 3000) * np.exp(-np.arange(n) / SR / 0.002)
        add(hits, tick, fs(fr), 0.25)
    r0, r1 = A["riser"]
    add(hits, riser(fs(r1 - r0)), fs(r0), 0.35)

    # drop: kick + sub + stab
    d = fs(A["drop"])
    add(hits, kick(), d, 1.0)
    add(hits, sub(mtof(29), 1.0), d, 0.9)
    st = stab(CHORDS[int(d // BAR_S) % 4][0])
    add(hits, st, d, 0.9)
    add(verb_send, st, d, 0.9)

    # lock thump
    add(hits, sub(48, 0.6), fs(A["lock"]), 0.8)
    # confetti: impact + bright bell arpeggio C–E–G–C
    c = fs(A["confetti"])
    add(hits, kick(), c, 0.8)
    for k, m in enumerate([84, 88, 91, 96]):
        bl = bell(mtof(m), 1.0)
        add(hits, bl, c + k * 0.07, 0.5, pan=-0.3 + 0.2 * k)
        add(verb_send, bl, c + k * 0.07, 0.5)
    # flash hits
    for fr in A["flashHits"]:
        t = fs(fr)
        add(hits, kick(), t, 1.0)
        s2 = stab(CHORDS[int(t // BAR_S) % 4][0])
        add(hits, s2, t, 0.8)
        add(verb_send, s2, t, 0.6)
    # final hit
    f = fs(A["finalHit"])
    add(hits, kick(), f, 1.0)
    add(hits, sub(mtof(33), 1.6), f, 0.9)
    s3 = stab(CHORDS[3][0])
    add(hits, s3, f, 0.9)
    add(verb_send, s3, f, 1.0)

    # filter curve for pad + pluck: intro opens 600→2500, breakdown sweeps down, build rises
    i0, i1 = map(fs, A["intro"])
    k0, k1 = map(fs, A["breakdown"])
    u0, u1 = map(fs, A["build"])

    def cutoff(t):
        if t < i1:
            return 600 * (2500 / 600) ** np.clip((t - i0) / max(1e-6, i1 - i0), 0, 1)
        if k0 <= t < k1:
            return 2500 * (700 / 2500) ** ((t - k0) / max(1e-6, k1 - k0))
        if u0 <= t < u1:
            return 700 * (3000 / 700) ** ((t - u0) / max(1e-6, u1 - u0))
        return 2500

    tonal = tv_lowpass(tonal, cutoff)
    music = drums + tonal
    # flash section: music low-passed between the hits
    if A["flashFiltered"]:
        a, b = map(fs, A["flashFiltered"])
        filt = tv_lowpass(music, lambda t: 800)
        w = np.zeros(N)
        ia, ib = smp(a), smp(b)
        w[ia:ib] = 1
        w = np.convolve(w, np.ones(smp(0.03)) / smp(0.03), mode="same")
        music = music * (1 - w[:, None]) + filt * w[:, None]
    # near-silence before the drop
    s0, s1 = A["silence"]
    g = np.ones(N)
    g[smp(fs(s0)) : smp(fs(s1))] = 0.0
    g = np.convolve(g, np.ones(smp(0.012)) / smp(0.012), mode="same")
    music *= g[:, None]
    music += reverb(outro_pad, IR_LONG, wet=0.55)
    music += reverb(verb_send, IR, wet=1.0) * 0.35
    music += hits
    # outro fade
    fade = np.ones(N)
    nf = smp(fs(A["fadeFrames"]))
    fade[-nf:] = np.linspace(1, 0, nf) ** 1.5
    return music * fade[:, None]


SFX_FN = {
    "tap": lambda a: (sfx_tap(), 0.7),
    "pop": lambda a: (sfx_pop(), 0.45),
    "whoosh": lambda a: (sfx_whoosh(), 0.28),
    "shimmer": lambda a: (sfx_shimmer(), 0.8),
    "gps": lambda a: (sfx_gps(), 0.8),
    "select": lambda a: (sfx_select(), 0.6),
    "lock": lambda a: (sfx_lock(), 0.9),
    "success": lambda a: (sfx_success(), 0.6),
    "popper": lambda a: (sfx_popper(), 0.7),
    "carBy": lambda a: (sfx_carby(), 0.6),
    "whip": lambda a: (sfx_whip(), 0.5),
}


SWELL_PEAK = {"whoosh": 0.125, "whip": 0.06, "carBy": 0.12}


def build_sfx(cues, n_frames):
    N = smp(fs(n_frames))
    out = np.zeros((N, 2))
    placed = []  # (name, frame) for alignment checks
    for name, frames in cues.items():
        if name == "key":
            for fr in frames:
                k = sfx_key()
                add(out, k, fs(fr), 0.5, pan=0.1)
                placed.append((name, fr, k, smp(fs(fr))))
        elif name == "loader":
            a, b = frames
            fr = a
            while fr < b:
                add(out, sfx_key(), fs(fr), 0.12)
                fr += 4
        elif name == "car":
            for fr, g in frames:
                add(out, sfx_car(g), fs(fr) - 0.15, 1.0, pan=0.4)
        elif name in SFX_FN:
            for fr in frames:
                x, g = SFX_FN[name](None)
                pre = SWELL_PEAK.get(name, 0.0)  # swells peak on the cue; clicks start on it
                add(out, x, fs(fr) - pre, g, pan=0.15 if name == "tap" else 0.0)
                placed.append((name, fr, x, smp(fs(fr) - pre)))
    return out, placed


# ---------------------------------------------------------------- cue mapping (hero → cutdown)

def map_frame(fr, segments):
    outs = []
    for s in segments:
        h0, h1 = s["hero"]
        c0, c1 = s["cut"]
        if "pushOutAt" in s and fr >= s["pushOutAt"]:
            continue
        if h0 <= fr < h1:
            outs.append(round(c0 + (fr - h0) * (c1 - c0) / (h1 - h0)))
    return outs


def cutdown_cues(hero_cues, segments):
    out = {}
    for name, frames in hero_cues.items():
        if name.startswith("_") or name == "duck":
            continue
        if name == "loader":
            a = map_frame(frames[0], segments)
            b = map_frame(frames[1] - 1, segments)
            if a and b:
                out[name] = [a[0], b[0] + 1]
            continue
        if name == "car":
            out[name] = [[m, g] for fr, g in frames for m in map_frame(fr, segments)]
            continue
        out[name] = sorted({m for fr in frames for m in map_frame(fr, segments)})
    return out


# ---------------------------------------------------------------- mix + master

def duck_env(N, frames, depth_db=-4.0):
    g = np.ones(N)
    lo = 10 ** (depth_db / 20)
    att, rel = smp(0.01), smp(0.11)
    shape = np.concatenate([np.linspace(1, lo, att), np.linspace(lo, 1, rel)])
    for fr in frames:
        i = smp(fs(fr))
        n = min(len(shape), N - i)
        if n > 0:
            g[i : i + n] = np.minimum(g[i : i + n], shape[:n])
    return g


def limiter(x, ceiling=0.7, look=smp(0.004), release=0.08):
    peak = np.max(np.abs(x), axis=1)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    # look-ahead min filter then smooth release
    win = np.lib.stride_tricks.sliding_window_view(np.concatenate([need, np.ones(look)]), look + 1).min(axis=1)[: len(need)]
    a = np.exp(-1 / (release * SR))
    g = np.empty_like(win)
    cur = 1.0
    for i, v in enumerate(win):
        cur = v if v < cur else a * cur + (1 - a) * v
        g[i] = cur
    return x * g[:, None]


def loudnorm(src, dst, seconds):
    p1 = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", src, "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    js = p1.stderr[p1.stderr.rfind("{") : p1.stderr.rfind("}") + 1]
    m = json.loads(js)
    af = (
        f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
        f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=json"
    )
    p2 = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-i", src, "-af", af, "-ar", str(SR), "-c:a", "pcm_s24le", dst], capture_output=True, text=True)
    js2 = p2.stderr[p2.stderr.rfind("{") : p2.stderr.rfind("}") + 1]
    m2 = json.loads(js2)
    # enforce exact length
    y, sr = sf.read(dst, always_2d=True)
    n = smp(seconds)
    y = y[:n] if len(y) >= n else np.concatenate([y, np.zeros((n - len(y), 2))])
    sf.write(dst, y, SR, subtype="PCM_24")
    return m, m2


def measure(path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "loudnorm=I=-14:TP=-1:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    js = p.stderr[p.stderr.rfind("{") : p.stderr.rfind("}") + 1]
    return json.loads(js)


def check_alignment(placed, label):
    """
    Each cue's own transient must land within ±1 frame of its cue frame.
    Clicks/hits: first point where the 1 ms RMS envelope reaches 30% of its peak (so a multi-note chime counts from its first note). Swells (whoosh, whip, car-by): envelope peak.
    Measured per cue on the signal exactly as placed, so overlapping cues can't mask each other.
    """
    tol = SR / FPS
    worst = 0.0
    for name, fr, x, start in placed:
        mono = x if x.ndim == 1 else np.mean(x, axis=1)
        if name in SWELL_PEAK:
            w = smp(0.06)  # noise swells: smooth enough that the envelope peak isn't noise jitter
            env = np.sqrt(np.convolve(mono**2, np.ones(w) / w, mode="same"))
            idx = int(np.argmax(env))
        else:
            w = smp(0.001)
            env = np.sqrt(np.convolve(mono**2, np.ones(w) / w, mode="full")[: len(mono)])
            idx = int(np.argmax(env >= 0.3 * env.max()))
        err = abs(start + idx - smp(fs(fr)))
        worst = max(worst, err / tol)
        assert err <= tol, f"[{label}] {name}@{fr}: transient {err / SR * 1000:.1f} ms off (> 1 frame)"
    print(f"  [{label}] {len(placed)} cue transients within ±1 frame (worst {worst:.2f} frame)")


def render(label, n_frames, A, cues, word_frames, duck_frames):
    seconds = n_frames / FPS
    print(f"• {label}: {seconds:.3f}s")
    music = build_music(A, n_frames, word_frames)
    sfx, placed = build_sfx(cues, n_frames)
    g = duck_env(music.shape[0], duck_frames)
    mix = music * g[:, None] * 0.55 + sfx * 0.8
    mix = np.tanh(mix * 1.1) / 1.1  # soft clip
    mix = limiter(mix, 0.7)
    sf.write(os.path.join(OUT, f"music-{label}.wav"), np.clip(music * 0.35, -1, 1), SR, subtype="PCM_24")
    sf.write(os.path.join(OUT, f"sfx-{label}.wav"), np.clip(sfx * 0.5, -1, 1), SR, subtype="PCM_24")
    tmp = os.path.join(OUT, f".premaster-{label}.wav")
    sf.write(tmp, mix, SR, subtype="PCM_24")
    dst = os.path.join(OUT, f"score-{label}.wav")
    loudnorm(tmp, dst, seconds)
    os.remove(tmp)
    # QA
    y, _ = sf.read(dst, always_2d=True)
    assert abs(len(y) / SR - seconds) < 1e-9, f"{label}: duration {len(y) / SR}"
    peak = np.max(np.abs(y))
    assert peak < 0.999, f"{label}: clipping (peak {peak})"
    m = measure(dst)
    print(f"  duration {len(y) / SR:.3f}s · integrated {m['input_i']} LUFS · true peak {m['input_tp']} dBTP · sample peak {20 * np.log10(peak):.2f} dBFS")
    assert abs(float(m["input_i"]) + 14) <= 0.6, f"{label}: loudness {m['input_i']} LUFS"
    assert float(m["input_tp"]) <= -0.9, f"{label}: true peak {m['input_tp']}"
    check_alignment(placed, label)


def main():
    H = TIMING["hero"]
    hero_cues = {k: v for k, v in TIMING["sfx"].items() if not k.startswith("_") and k != "duck"}
    hero_cues["key"] = H["s4"]["keys"]
    words = [H["s1"]["wordsStart"] + i * H["s1"]["wordStep"] for i in range(6)]
    duck = sorted(set(TIMING["sfx"]["tap"] + TIMING["sfx"]["duck"]))
    render("hero", H["duration"], TIMING["audio"]["hero"], hero_cues, words, duck)

    segs = TIMING["cutdown"]["segments"]
    cd = cutdown_cues({**TIMING["sfx"], "key": H["s4"]["keys"]}, segs)
    cwords = sorted({m for w in words for m in map_frame(w, segs)})
    cduck = sorted({m for fr in duck for m in map_frame(fr, segs)} | {TIMING["audio"]["cutdown"]["drop"], TIMING["audio"]["cutdown"]["finalHit"]})
    render("cutdown", TIMING["cutdown"]["duration"], TIMING["audio"]["cutdown"], cd, cwords, cduck)
    print("done")


if __name__ == "__main__":
    sys.exit(main())

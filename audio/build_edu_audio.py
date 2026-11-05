#!/usr/bin/env python3
"""
Shuttlers Pod education videos: original Afro-house scores + SFX, generated in code.

Reads src/config/timing.json (section "edu") and writes 48 kHz / 24-bit stereo WAVs to
public/audio/edu/:  music-eduN.wav (the stem a licensed track would replace),
sfx-eduN.wav, score-eduN.wav (mix, -14 LUFS, <= -1 dBTP), exactly 30.000 s each.

Genre/mood guide only (no melody, hook or sample is copied): deep, warm Afro-house with
an amapiano lean. 120 BPM so one beat = 15 frames and each 2 s card in the brief = 1 bar.

  python3 audio/build_edu_audio.py                 # build V1 + V2
  python3 audio/build_edu_audio.py --video 2       # one video
  python3 audio/build_edu_audio.py --video 1 --music licensed.wav [--offset 0.0]
      # re-mix a licensed instrumental under the SFX stem (warns if not 115–120 BPM)
"""
import argparse
import json
import os
import sys

import numpy as np
import soundfile as sf
from scipy import signal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_audio as B  # noqa: E402  (shared synth, mix and QA helpers)

ROOT = B.ROOT
T = json.load(open(os.path.join(ROOT, "src/config/timing.json")))
E = T["edu"]
OUT = os.path.join(ROOT, "public/audio/edu")
os.makedirs(OUT, exist_ok=True)
SR, FPS = B.SR, B.FPS
BEAT = 60.0 / T["bpm"]
BAR = BEAT * 4
STEP = BEAT / 4
SWING = 0.56
RNG = np.random.default_rng(5150)
smp, fs, mtof, add = B.smp, B.fs, B.mtof, B.add


def noise(n):
    return RNG.standard_normal(n)


# ---------------------------------------------------------------- new Afro-house voices

def conga(freq, slap=0.4, dur=0.28):
    n = smp(dur)
    t = np.arange(n) / SR
    f = freq * (1 + 0.35 * np.exp(-t / 0.012))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.11)
    s = B.bp(noise(n), 1200, 4500) * np.exp(-t / 0.006) * slap
    return (body + s) * np.clip(t / 0.001, 0, 1) * 0.6


def rim():
    n = smp(0.08)
    t = np.arange(n) / SR
    click = B.bp(noise(n), 1500, 3500) * np.exp(-t / 0.004)
    tone = np.sin(2 * np.pi * 820 * t) * np.exp(-t / 0.012) * 0.6
    return (click + tone) * 0.5


def open_hat(dur=0.2):
    n = smp(dur)
    t = np.arange(n) / SR
    return B.hp(noise(n), 7500) * np.clip(t / 0.002, 0, 1) * np.exp(-t / 0.07) * 0.5


def rhodes(freq, dur=1.6):
    """FM electric piano: decaying modulation index, gentle tremolo."""
    n = smp(dur)
    t = np.arange(n) / SR
    idx = 2.2 * np.exp(-t / 0.18) + 0.4
    mod = np.sin(2 * np.pi * freq * 1.0 * t) * idx
    car = np.sin(2 * np.pi * freq * t + mod)
    bell = np.sin(2 * np.pi * freq * 14 * t) * np.exp(-t / 0.02) * 0.06
    trem = 1 + 0.12 * np.sin(2 * np.pi * 4.8 * t)
    return (car + bell) * np.exp(-t / 0.9) * trem * np.clip(t / 0.003, 0, 1) * 0.28


def kalimba(freq, dur=0.6):
    n = smp(dur)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.28)
    x += np.sin(2 * np.pi * freq * 5.4 * t) * np.exp(-t / 0.03) * 0.35  # tine "tick"
    x += np.sin(2 * np.pi * freq * 2.0 * t) * np.exp(-t / 0.12) * 0.15
    return x * np.clip(t / 0.0015, 0, 1) * 0.35


def sub_note(freq, dur):
    n = smp(dur)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * freq * 2 * t)
    env = np.clip(t / 0.004, 0, 1) * np.exp(-t / (dur * 0.9))
    return np.tanh(x * env * 1.6) * 0.55


FORMANTS = {"a": (800, 1150, 2900), "o": (450, 800, 2830), "e": (400, 1700, 2600)}


def vox(freq, vowel="a", dur=0.18):
    """Synthesised vowel chop (no real voice): glottal saw through three formants."""
    n = smp(dur)
    t = np.arange(n) / SR
    g = B.saw_voice(freq, n, 0, 30)
    f1, f2, f3 = FORMANTS[vowel]
    x = B.bp(g, f1 * 0.85, f1 * 1.15) + 0.6 * B.bp(g, f2 * 0.9, f2 * 1.1) + 0.3 * B.bp(g, f3 * 0.92, f3 * 1.08)
    env = np.clip(t / 0.01, 0, 1) * np.clip((dur - t) / 0.04, 0, 1)
    return x * env * 0.5


def hum(dur):
    """Low building drone for intros: two detuned sines + filtered noise, rising."""
    n = smp(dur)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 55.4 * t) + 0.3 * np.sin(2 * np.pi * 110.3 * t)
    x += B.lp(noise(n), 300) * 0.4
    return x * (t / dur) ** 1.4 * 0.5



# ---------------------------------------------------------------- Afro-house percussion + voices

def djembe(kind="tone", pitch=1.0):
    """Djembe hit: 'bass' (deep thump), 'tone' (open), 'slap' (bright crack)."""
    n = smp(0.35)
    t = np.arange(n) / SR
    if kind == "bass":
        f = 78 * pitch * (1 + 0.6 * np.exp(-t / 0.01))
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    elif kind == "tone":
        f = 230 * pitch * (1 + 0.25 * np.exp(-t / 0.008))
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.07) + 0.25 * np.sin(2 * np.pi * np.cumsum(f * 1.58) / SR) * np.exp(-t / 0.04)
        x += B.bp(noise(n), 800, 2500) * np.exp(-t / 0.005) * 0.4
    else:
        x = B.bp(noise(n), 1500, 6000) * np.exp(-t / 0.012) + np.sin(2 * np.pi * 410 * pitch * t) * np.exp(-t / 0.02) * 0.4
    return x * np.clip(t / 0.0008, 0, 1) * 0.6


def talking_drum(base=190.0, up=1.45, dur=0.32):
    """Talking drum: pitch squeezes up then relaxes (the drummer's armpit squeeze)."""
    n = smp(dur)
    t = np.arange(n) / SR
    bend = 1 + (up - 1) * np.sin(np.pi * np.clip(t / (dur * 0.7), 0, 1))
    f = base * bend
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.14)
    x += B.bp(noise(n), 900, 3000) * np.exp(-t / 0.004) * 0.3
    return x * np.clip(t / 0.001, 0, 1) * 0.55


def tom(freq):
    n = smp(0.4)
    t = np.arange(n) / SR
    f = freq * (1 + 0.5 * np.exp(-t / 0.02))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18) + B.lp(noise(n), 900) * np.exp(-t / 0.01) * 0.3) * 0.6


def chant(freq, vowel="e", dur=0.42, slide=2.0, voices=4):
    """Group call/response chant, synthesised (vowel formants, pitch scoop, vibrato). No real voice."""
    n = smp(dur)
    t = np.arange(n) / SR
    out = np.zeros(n)
    f1, f2, f3 = FORMANTS[vowel]
    for v in range(voices):
        det = 2 ** ((RNG.uniform(-14, 14)) / 1200)
        f = freq * det * 2 ** ((-slide * np.exp(-t / 0.05)) / 12) * (1 + 0.012 * np.sin(2 * np.pi * 5.3 * t + v))
        ph = np.cumsum(f) / SR
        g = 2 * (ph % 1) - 1
        out += B.bp(g, f1 * 0.85, f1 * 1.15) + 0.55 * B.bp(g, f2 * 0.9, f2 * 1.1) + 0.25 * B.bp(g, f3 * 0.92, f3 * 1.08)
    env = np.clip(t / 0.03, 0, 1) * np.clip((dur - t) / 0.12, 0, 1)
    return out / voices * env * 0.9


def flute(freq, dur=0.5):
    n = smp(dur)
    t = np.arange(n) / SR
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.08) / 0.1, 0, 1)
    ph = 2 * np.pi * np.cumsum(freq * vib) / SR
    x = np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)
    breath = B.bp(noise(n), freq * 1.5, min(freq * 5, 12000)) * 0.12
    env = np.clip(t / 0.06, 0, 1) * np.clip((dur - t) / 0.15, 0, 1)
    return (x + breath) * env * 0.3


def bass_note(midi, dur):
    """Deep rolling bass: rounded sine + soft second harmonic, slight attack thump."""
    m = midi - 12 if mtof(midi - 12) >= 50 else midi
    return sub_note(mtof(m), dur)


# ---------------------------------------------------------------- SFX

def sfx_scratch():
    """Record scratch: band-passed noise + sawtooth with a fast pitch wobble down/up."""
    n = smp(0.42)
    t = np.arange(n) / SR
    f = 900 * (0.35 + 0.65 * np.abs(np.sin(2 * np.pi * 5.5 * t))) * np.exp(-t / 0.5)
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    nz = B.bp(noise(n), 600, 4000)
    return np.tanh((saw * 0.6 + nz * 0.5) * np.exp(-t / 0.22) * 2) * 0.8


def sfx_tick():
    n = smp(0.05)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 2400 * t) * np.exp(-t / 0.004) + B.hp(noise(n), 4000) * np.exp(-t / 0.002) * 0.5) * 0.5


def sfx_door():
    """Car door: low thump + latch click."""
    n = smp(0.35)
    t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * (70 + 60 * np.exp(-t / 0.015)) * t) * np.exp(-t / 0.07)
    latch = B.bp(noise(n), 2000, 6000) * np.exp(-np.maximum(0, t - 0.012) / 0.004) * (t > 0.012)
    return thump * 0.9 + latch * 0.6


def sfx_pin():
    n = smp(0.3)
    t = np.arange(n) / SR
    f = 260 * (0.45 + 0.55 * np.exp(-t / 0.03))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.09) * 0.9 + B.lp(noise(n), 400) * np.exp(-t / 0.02) * 0.3


def sfx_flip():
    out = np.zeros(smp(0.25))
    for k in range(3):
        n = smp(0.03)
        c = B.bp(noise(n), 1500, 6000) * np.exp(-np.arange(n) / SR / 0.006)
        i = smp(0.05 * k)
        out[i:i + n] += c * (0.6 - 0.15 * k)
    return out


def sfx_blink():
    n = smp(0.12)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(1800 * np.exp(-t / 0.03) + 400) / SR) * np.exp(-t / 0.025) * 0.35


def sfx_snap():
    n = smp(0.2)
    t = np.arange(n) / SR
    return B.bp(noise(n), 1500, 7000) * np.exp(-t / 0.008) * 0.9 + np.sin(2 * np.pi * 1300 * t) * np.exp(-t / 0.03) * 0.3


def sfx_frost():
    n = smp(1.0)
    t = np.arange(n) / SR
    x = B.hp(noise(n), 6000) * np.sin(np.pi * np.clip(t, 0, 1)) ** 2 * 0.25
    x += sum(np.sin(2 * np.pi * f * t) * np.exp(-t / 0.5) for f in (3100, 4650, 6200)) * 0.05
    return B.reverb(x, wet=0.5)


def sfx_seat():
    n = smp(0.2)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(500 + 700 * (1 - np.exp(-t / 0.04))) / SR) * np.exp(-t / 0.06) * 0.45


SFX = {
    "whoosh": (lambda: B.sfx_whoosh(), 0.24, 0.125),
    "race": (lambda: B.sfx_whoosh(0.6, 400, 5000), 0.3, 0.3),
    "pin": (sfx_pin, 0.8, 0.0),
    "clock": (sfx_tick, 0.7, 0.0),
    "clockTicks": (sfx_tick, 0.55, 0.0),
    "calendar": (sfx_flip, 0.7, 0.0),
    "seat": (sfx_seat, 0.6, 0.0),
    "seatsFill": (sfx_seat, 0.5, 0.0),
    "fareSnap": (sfx_snap, 0.7, 0.0),
    "frost": (sfx_frost, 0.7, 0.5),
    "scratch": (sfx_scratch, 0.85, 0.0),
    "door": (sfx_door, 0.9, 0.0),
    "nod": (lambda: B.sfx_pop() * 0.4, 0.4, 0.0),
    "tap": (lambda: B.sfx_tap(), 0.75, 0.0),
    "flick": (sfx_flip, 0.4, 0.0),
    "blink": (sfx_blink, 0.8, 0.0),
    "pop": (lambda: B.sfx_pop(), 0.55, 0.0),
    "glow": (lambda: B.sfx_shimmer(), 0.5, 0.0),
}


# ---------------------------------------------------------------- arrangement

VIDEOS = {
    # Hypnotic two-chord minor vamps (2 bars each), Afro-house style.
    "v1": {  # A minor: Am9 | Am9 | Fmaj9 | Fmaj9
        "chords": [([60, 64, 67, 71], 45), ([60, 64, 67, 71], 45), ([57, 60, 64, 67], 41), ([57, 60, 64, 67], 41)],
        "marimba": [69, None, 72, 76, None, 72, 74, None, 76, None, 74, 72, None, 69, 67, None],
        "flute": [76, None, None, 79, None, 76, 74, None, 72, None, 74, None, None, 69, None, None],
        "talk": 196.0,
    },
    "v2": {  # C minor: Cm9 | Cm9 | Fm9 | Fm9
        "chords": [([63, 67, 70, 74], 36), ([63, 67, 70, 74], 36), ([60, 63, 67, 68], 41), ([60, 63, 67, 68], 41)],
        "marimba": [72, None, 75, 79, None, 75, 77, None, 79, None, 77, 75, None, 72, 70, None],
        "flute": [79, None, None, 82, None, 79, 77, None, 75, None, 77, None, None, 72, None, None],
        "talk": 220.0,
    },
}

KICK = [0, 4, 8, 12]
SNAP = [4, 12]
CLAVE = [0, 3, 6, 10, 12]  # son clave (3-2) on the 16th grid
DJ_TONE = [2, 5, 10, 13]
DJ_SLAP = [7, 15]
CONGA = [(1, 1), (6, 0), (9, 1), (11, 1), (14, 0)]  # (step, hi?) answers the djembe
HAT = [2, 6, 10, 14]
BASS = [(2, 0), (3, 0), (6, 7), (7, 0), (10, 0), (11, 12), (14, 7)]  # rolling offbeat bass (step, interval)


def st(bar, step):
    return bar * BAR + step * STEP + (SWING - 0.5) * 2 * STEP * (step % 2)


PERC = {"kick", "snap", "clave", "djembe", "conga", "shaker", "hat", "bass", "pad", "keys"}


def layers_v1(fr, S):
    """Which layers play at frame fr (V1)."""
    if fr < S["drop"]:
        return {"hum", "pad", "shaker_soft"}
    if S["silence"][0] <= fr < S["silence"][1]:
        return set()
    if S["strip"][0] <= fr < S["strip"][1]:
        return {"kick", "bass", "pad", "djembe", "shaker"}
    if fr >= S["end"][0]:
        return {"kick", "bass", "pad", "djembe", "conga", "shaker", "hat", "keys"} if fr < S["button"] else set()
    base = set(PERC) | {"chant"}
    if fr >= 120:
        base |= {"marimba", "talk"}
    if S["grooveB"][0] <= fr < S["grooveB"][1] or S["slam"][0] <= fr < S["slam"][1]:
        base |= {"flute", "toms"}
    return base


def layers_v2(fr, S):
    if fr < S["drop"]:
        return {"pad", "hum", "shaker_soft"}
    for a, b in (S["blackout"], S["halt"]):
        if a <= fr < b:
            return set()
    if fr >= S["end"][0]:
        return {"kick", "bass", "pad", "djembe", "conga", "shaker", "hat", "keys"} if fr < S["button"] else set()
    base = set(PERC) | {"marimba"}
    if fr >= 180:
        base |= {"talk"}
    if fr >= 360:
        base |= {"flute"}
    if fr >= S["kickBack"]:
        base |= {"chant", "toms"}
    return base


def build_music(key):
    V = VIDEOS[key]
    D = E[key]
    S = D["sections"]
    layers = layers_v1 if key == "v1" else layers_v2
    N = smp(fs(E["duration"]))
    drums = np.zeros((N, 2))
    tonal = np.zeros((N, 2))
    hits = np.zeros((N, 2))
    send = np.zeros((N, 2))
    bars = int(np.ceil(E["duration"] / 60))
    for bar in range(bars):
        notes, root = V["chords"][bar % 4]
        bar_fr = bar * 60
        L = layers(bar_fr + 1, S)
        if "pad" in L and bar % 2 == 0:
            gain = 0.3 if bar_fr < S["drop"] else 0.36
            add(tonal, B.pad_chord(notes, BAR * 2 + 0.3), bar * BAR, gain)
            add(send, B.pad_chord(notes, BAR * 2), bar * BAR, 0.12)
        for step in range(16):
            t = st(bar, step)
            fr = t * FPS
            L = layers(fr, S)
            if not L:
                continue
            if "kick" in L and step in KICK:
                add(drums, B.kick(), t, 0.78)
            if "snap" in L and step in SNAP:
                add(drums, B.clap(), t, 0.2)
            if "clave" in L and step in CLAVE:
                add(drums, rim(), t, 0.33, pan=-0.35)
            if "djembe" in L:
                if step in DJ_TONE:
                    add(drums, djembe("tone", 1.0 if step != 13 else 1.12), t, 0.5, pan=0.2)
                if step in DJ_SLAP:
                    add(drums, djembe("slap"), t, 0.42, pan=0.3)
                if step == 8 and bar % 2 == 1:
                    add(drums, djembe("bass"), t, 0.45)
            if "conga" in L:
                for s_, hi in CONGA:
                    if s_ == step:
                        add(drums, conga(mtof(root + (26 if hi else 21)), 0.5 if hi else 0.3), t, 0.4, pan=-0.4 if hi else -0.15)
            if "shaker" in L or ("shaker_soft" in L and step % 2 == 0):
                add(drums, B.shaker([1.0, 0.45, 0.75, 0.45][step % 4]), t, 0.15 if "shaker" in L else 0.08, pan=0.3)
            if "hat" in L and step in HAT:
                add(drums, open_hat(), t, 0.14, pan=-0.2)
            if "talk" in L and bar % 2 == 1 and step in (11, 14):
                add(drums, talking_drum(V["talk"] * (1.0 if step == 11 else 0.84)), t, 0.45, pan=0.45)
            if "toms" in L and bar % 4 == 3 and step >= 12:
                add(drums, tom(mtof(root + 12) * [1.5, 1.33, 1.12, 1.0][step - 12]), t, 0.5, pan=0.3 - 0.2 * (step - 12))
            if "bass" in L:
                for s_, iv in BASS:
                    if s_ == step:
                        add(drums, bass_note(root + iv, STEP * 1.8), t, 0.75)
            if "keys" in L and step == 0 and bar % 2 == 0:
                ch = np.sum([rhodes(mtof(m)) for m in notes], axis=0)
                add(tonal, ch, t, 0.3, pan=-0.1)
                add(send, ch, t, 0.25)
            if "marimba" in L and step % 2 == 0:
                m = V["marimba"][(bar % 2) * 8 + step // 2]
                if m is not None:
                    k = kalimba(mtof(m))
                    add(tonal, k, t, 0.36, pan=0.35 if step % 4 else -0.25)
                    add(send, k, t, 0.3)
            if "flute" in L and step % 2 == 0 and bar % 4 >= 2:
                m = V["flute"][(bar % 2) * 8 + step // 2]
                if m is not None:
                    fl = flute(mtof(m), STEP * 3.2)
                    add(tonal, fl, t, 0.42, pan=-0.3)
                    add(send, fl, t, 0.55)
            if "chant" in L:
                if step == 0 and bar % 2 == 0:  # call
                    c = chant(mtof(notes[1]), "e", 0.38, 3.0)
                    add(tonal, c, t, 0.45, pan=-0.15)
                    add(send, c, t, 0.6)
                if step == 8 and bar % 2 == 1:  # response
                    c = chant(mtof(notes[0]), "o", 0.5, 2.0)
                    add(tonal, c, t, 0.4, pan=0.2)
                    add(send, c, t, 0.6)
    # intro hum + riser into the drop
    add(hits, hum(fs(S["drop"])), 0.0, 0.5)
    add(hits, B.riser(fs(S["drop"] - 10)), fs(10), 0.28)
    # the drop
    d = fs(S["drop"])
    add(hits, B.kick(), d, 1.0)
    add(hits, B.sub(mtof(VIDEOS[key]["chords"][1][1] - 12), 1.0), d, 0.8)
    st0 = B.stab(VIDEOS[key]["chords"][1][0])
    add(hits, st0, d, 0.9)
    add(send, st0, d, 0.9)
    # punched words / beat hits
    for fr in D["wordHits"]:
        add(hits, B.kick(), fs(fr), 0.75)
        s2 = B.stab([n + 12 for n in VIDEOS[key]["chords"][int(fr // 60) % 4][0][1:]])
        add(hits, s2, fs(fr), 0.55)
        add(send, s2, fs(fr), 0.5)
    # comebacks after silence
    back = S.get("slam", [S.get("kickBack")])[0] if key == "v1" else S["kickBack"]
    add(hits, B.kick(), fs(back), 1.0)
    add(hits, B.sub(mtof(VIDEOS[key]["chords"][0][1] - 12), 0.9), fs(back), 0.8)
    # button ending: final kick + chord stab + sub, tail rings into a quick fade
    b = fs(S["button"])
    add(hits, B.kick(), b, 1.0)
    add(hits, B.sub(mtof(VIDEOS[key]["chords"][3][1] - 12), 1.0), b, 0.9)
    s3 = B.stab(VIDEOS[key]["chords"][3][0])
    add(hits, s3, b, 1.0)
    add(send, s3, b, 1.0)

    # intro filter opens 500 → 3000 Hz; everything else open
    def cutoff(t):
        return 500 * (3000 / 500) ** np.clip(t / fs(S["drop"]), 0, 1) if t < fs(S["drop"]) else 3200

    music = drums + B.tv_lowpass(tonal, cutoff)
    music += B.reverb(send, B.IR, wet=1.0) * 0.3
    # hard gates: dead silences/halts/blackouts (the brief wants them truly silent)
    g = np.ones(N)
    gaps = [S["silence"]] if key == "v1" else [S["blackout"], S["halt"]]
    for a, z in gaps:
        g[smp(fs(a)):smp(fs(z))] = 0.0
    g = np.convolve(g, np.ones(smp(0.006)) / smp(0.006), mode="same")
    music *= g[:, None]
    music += hits * g[:, None]
    # after the button: let the stab ring 0.6 s then fade to silence by 30 s
    fade = np.ones(N)
    i0, i1 = smp(b + 0.25), N
    fade[i0:i1] = np.linspace(1, 0, i1 - i0) ** 2
    return music * fade[:, None]


def build_sfx(key):
    D = E[key]
    N = smp(fs(E["duration"]))
    out = np.zeros((N, 2))
    placed = []
    for name, frames in D["sfx"].items():
        fn, gain, pre = SFX[name]
        for fr in frames:
            x = fn()
            add(out, x, fs(fr) - pre, gain, pan=0.12 if name == "tap" else 0.0)
            if name in ("whoosh", "race", "frost"):
                B.SWELL_PEAK[name] = pre
            placed.append((name, fr, x, smp(fs(fr) - pre)))
    return out, placed


def master(key, music, sfx, placed):
    D = E[key]
    taps = D["sfx"].get("tap", []) + D["sfx"].get("door", []) + D["wordHits"]
    g = B.duck_env(music.shape[0], taps)
    mix = music * g[:, None] * 0.55 + sfx * 0.8
    mix = np.tanh(mix * 1.1) / 1.1
    mix = B.limiter(mix, 0.7)
    n = key[-1]
    sf.write(os.path.join(OUT, f"music-edu{n}.wav"), np.clip(music * 0.35, -1, 1), SR, subtype="PCM_24")
    sf.write(os.path.join(OUT, f"sfx-edu{n}.wav"), np.clip(sfx * 0.5, -1, 1), SR, subtype="PCM_24")
    tmp = os.path.join(OUT, f".pre-edu{n}.wav")
    sf.write(tmp, mix, SR, subtype="PCM_24")
    dst = os.path.join(OUT, f"score-edu{n}.wav")
    seconds = E["duration"] / FPS
    B.loudnorm(tmp, dst, seconds)
    os.remove(tmp)
    y, _ = sf.read(dst, always_2d=True)
    assert abs(len(y) / SR - seconds) < 1e-9, f"{key}: duration {len(y) / SR}"
    peak = np.max(np.abs(y))
    assert peak < 0.999, f"{key}: clipping"
    m = B.measure(dst)
    print(f"  edu{n}: {len(y) / SR:.3f}s · {m['input_i']} LUFS · TP {m['input_tp']} dBTP · peak {20 * np.log10(peak):.2f} dBFS")
    assert abs(float(m["input_i"]) + 14) <= 0.6 and float(m["input_tp"]) <= -0.9
    B.check_alignment(placed, f"edu{n}")
    # silences must really be silent in the master (music halts; only the brief's SFX may sound)
    S = D["sections"]
    gaps = [S["silence"]] if key == "v1" else [S["blackout"], S["halt"]]
    sfx_mono = np.max(np.abs(sfx), axis=1)
    for a, z in gaps:
        seg = slice(smp(fs(a) + 0.05), smp(fs(z) - 0.01))
        resid = np.max(np.abs(music[seg]))
        assert resid < 1e-3, f"{key}: music leaks into silence {a}-{z} ({resid:.4f})"
        print(f"  edu{n}: frames {a}–{z} silent (music) · SFX inside: {'yes' if sfx_mono[seg].max() > 1e-3 else 'none'}")


def remix_licensed(key, path, offset):
    y, sr = sf.read(path, always_2d=True)
    if sr != SR:
        y = signal.resample_poly(y, SR, sr, axis=0)
    if y.shape[1] == 1:
        y = np.repeat(y, 2, axis=1)
    i = smp(offset)
    N = smp(fs(E["duration"]))
    music = np.zeros((N, 2))
    seg = y[i:i + N]
    music[: len(seg)] = seg
    # rough tempo estimate from onset autocorrelation
    env = np.abs(np.diff(np.mean(music, axis=1)))
    env = np.convolve(env, np.ones(480) / 480, mode="same")[::480]
    ac = np.correlate(env - env.mean(), env - env.mean(), "full")[len(env) - 1:]
    lags = np.arange(len(ac)) * 480 / SR
    win = (lags > 0.4) & (lags < 0.65)
    bpm = 60 / lags[win][np.argmax(ac[win])]
    print(f"  licensed track tempo ≈ {bpm:.1f} BPM")
    if not 115 <= bpm <= 120.5:
        print("  WARNING: outside 115–120 BPM, cuts will not land on its beats without retiming.")
    sfx, placed = build_sfx(key)
    master(key, music / max(1e-9, np.max(np.abs(music))) * 1.4, sfx, placed)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", type=int, choices=[1, 2])
    ap.add_argument("--music")
    ap.add_argument("--offset", type=float, default=0.0)
    a = ap.parse_args()
    keys = [f"v{a.video}"] if a.video else ["v1", "v2"]
    for key in keys:
        print(f"• {key}: {E[key]['title']} ({E[key]['key']})")
        if a.music:
            remix_licensed(key, a.music, a.offset)
        else:
            music = build_music(key)
            sfx, placed = build_sfx(key)
            master(key, music, sfx, placed)
    print("done")


if __name__ == "__main__":
    main()

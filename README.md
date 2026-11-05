# Shuttlers Pod: launch motion film

Remotion (React/TypeScript) build of the Shuttlers Pod launch film, with an original score and SFX generated in Python.

| Composition | Size | Length |
| --- | --- | --- |
| `PodHero-16x9` | 1920×1080 · 30fps | 960f (32s), the master |
| `PodCutdown-16x9` | 1920×1080 · 30fps | 450f (15s) |
| `Components-Preview` | 1920×1080 | p1 (f0–59): every component in every state · p2 (f60–119): every rebuilt screen |
| `ScreenCheck` | 393×852 | build aid: one rebuilt screen + `ReferenceOverlay` (`--props='{"screen":"home","overlay":0.5}'`) |

## Run

```bash
npm install
python3 -m pip install numpy scipy soundfile   # add --break-system-packages if needed
python3 audio/build_audio.py                   # writes public/audio/* (re-run whenever timing.json changes)
npx remotion studio                            # preview
npm run render:hero                            # out/pod-hero-16x9.mp4
npm run render:cutdown                         # out/pod-cutdown-16x9.mp4
node tools/stills.mjs PodHero-16x9 10 45 80    # QA stills → out/qa/f-<N>.png
node tools/check_assets.mjs                    # rewrites MISSING_ASSETS.md
```

`remotion.config.ts` points Remotion at the pre-installed Chromium headless shell. Override it with `REMOTION_CHROME=/path/to/chrome`.

## Where things live

- `src/config/timing.json`: **every frame number** (BPM 120 → BEAT 15f, BAR 60f), the cutdown's segment remaps, the music arrangement and SFX cue frames. Read by both the TS code and `audio/build_audio.py`.
- `src/config/content.ts`: **every visible string**.
- `src/config/brand.ts`: colour tokens, easings, springs, shadow, type scale, layout, font loading.
- `src/screens/`: the app screens rebuilt at 393×852 app points (screenshots ÷ 3).
- `src/scenes/`: S1 … S10. S3–S8 share one persistent phone (`PhoneAct.tsx`).
- `src/components/`: motion primitives (settleWords, blur in/out, lift-out, push, Pod capsule, finger taps, rolling digits, stylised map, keyboard, party popper and confetti, fleet car with contact shadow, reflection and motion blur).

## How the cutdown works

Each scene reads the *hero-absolute* frame via `useT()`. The cutdown replays the same scene components through linear time remaps (`timing.json → cutdown.segments`). The SFX cues are mapped through the same segments, so picture and sound stay locked.

## Education videos (brief: "Shuttlers Pod: Education Videos")

- Copy (verbatim from the brief): `src/edu/content.ts` · timings: `src/config/timing.json → edu`
- Scores: `python3 audio/build_edu_audio.py` → `public/audio/edu/` (V1 + V2; `--music track.wav` swaps in a licensed track)
- Timing animatics (9:16): compositions `Edu1-Animatic`, `Edu2-Animatic`

Generated audio (`public/audio/`) and renders (`out/`) are not committed. Run both audio scripts after cloning:

```bash
python3 audio/build_audio.py && python3 audio/build_edu_audio.py
```

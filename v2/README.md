# Astrivo v2 engine

The engine behind **"What If the Sun Vanished?" v2**, the quality bar for every new Astrivo Short.
It is separate from the daily automation (`PIPELINE.md`, `flat/`, `tools/build_job.py`, GitHub Actions),
which it does not change. Jobs live in `v2/jobs/<id>/`, outside `jobs/`, so they never trigger the render workflow.

## How a Short is built

```
v2/jobs/<id>/script.json   the lines (one line = one scene, a cut every 2–3 s)
v2/jobs/<id>/scene.py      the animation + sound for this Short (copy the example and change it)
```

```bash
pip install --break-system-packages pycairo numpy scipy soundfile pillow kokoro-onnx   # + faster-whisper for a real voice
# Poppins font must be installed (fonts/ in this repo -> ~/.fonts, then fc-cache -f)

python3 v2/make.py v2/jobs/<id> voice                 # stand-in voice (Kokoro) -> voice.wav + timing.json
python3 v2/make.py v2/jobs/<id> voice --audio x.mp3   # real ElevenLabs voice -> word times via Whisper
python3 v2/make.py v2/jobs/<id> stills 0.5 4 10 22    # test frames -> frames/sheet.png (always look before rendering)
python3 v2/make.py v2/jobs/<id> render                # sound + scenes + out/<id>.mp4 and out/<id>_no_voice.mp4
```

The real voice must say exactly the script text (lines joined by spaces). ElevenLabs voice used by the channel:
Liam – Energetic, Social Media Creator (`TX3LPaxmHKxFdv7VOQHJ`), model `eleven_multilingual_v2`.

## What scene.py defines

Read `examples/sun-vanished/scene.py` fully before writing a new one: it is the reference.

| name | what it does |
|---|---|
| `HOOK` | top banner parts, e.g. `[("WHAT IF THE ", WHITE), ("SUN", YEL), (" VANISHED?", WHITE)]` |
| `setup(J)` | turn spoken words into times with `wstart("s04", "ZERO")`; set `BOOMS` (time, shake), `CUTS` (extra cuts), `LOOP` (cut back to frame 0) |
| `counter(t)` | the always-moving number: `dict(label, value, red, bar, flash)`; countdown first, then elapsed time |
| `STAGES`, `stage(t)` | progress tracker chips, last one `"?"` until the twist; returns `(index, override_label)` |
| `SCENES` | `{"s01": fn(ctx, t, lt), ...}`, one per script line (`lt` = seconds into that line) |
| `dust_on(sid, t)`, `overlay(ctx, t)` | optional floating dust; big impact words (`big_word`) |
| `sound(A)` | every SFX / beat / chord change, keyed to the same event times |

The engine adds automatically: push-in on every scene, screen shake on `BOOMS`, a swipe + speed lines on every cut,
vignette, the HUD (banner, counter, stage tracker) and the karaoke captions.

## Library (engine/lib.py)

| group | functions |
|---|---|
| backgrounds | `bg_space(ctx,t,drift)`, `bg_sky(ctx,t,dark,cold)`, `ground(ctx,dark,frost)`, `city`, `streetlamp`, `tree` |
| bodies | `sun`, `earth(…, lit, frozen, lights, crack)`, `moon(…, dark)` |
| people | `person(ctx,x,y,s,t,pose)` with poses `stand / point / shield / shiver`, `coat=`; `breath(...)` |
| effects | `glow`, `burst`, `snow`, `frost`, `flash`, `dashed_circle` |
| text | `text`, `tag` (small label pill), `big_word` (huge impact word), `fmt_ms` |
| motion | `ease`, `eout`, `back`, `lerp`, `mix`, `clamp` |

Need something new (a volcano, a rocket, a black hole)? Draw it in scene.py with the same recipe: gradient shapes,
one soft shadow, a `glow`, no outlines. If it is useful again, move it into lib.py.

## Sound kit (engine/audio.py)

`A.impact` (layered boom + reverb), `A.whoosh`, `A.tick`, `A.beep`, `A.implode`, `A.chime`, `A.crackle`, `A.ice_crack`,
`A.bubbles`, `A.riser`, `A.zap`, `A.wind`, `A.hum`; `A.countdown(t0, t1)` (ticks + a beat that speeds up),
`A.pulse(t0, t1)`; `A.music_plan([(time, *A.CHORDS["Dm"]), ...])`; `A.ducks.append((t0, t1))` silences the music
after a key moment. Real SFX files: `A.add(A.sfx, t, A.load("boom.wav"), 0.8)`.
The mix ducks music under the voice automatically.

## Quality checklist (must all be yes)

- Visible change by 0.3 s; first line states the event as if it just happened
- Live counter always on screen; stage tracker with a "?"
- A cut every 2–3 s; a sound on every beat; one visual style
- People react; at least one human-scale scene; one "wow" visual; big climax in the last third
- A twist the top Shorts on the topic don't use; the ending loops into frame 0
- Captions clean (one yellow word, nothing merged, nothing below y≈1500 or under the right-side buttons)
- Facts checked

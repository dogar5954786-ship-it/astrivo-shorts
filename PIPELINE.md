# Astrivo Shorts — production playbook

This file is read by the automated Claude runs. It explains how to turn a picked topic
into a render job. GitHub Actions (`.github/workflows/render.yml`) renders every new
`jobs/<id>/job.json` and publishes the video at
`https://github.com/dogar5954786-ship-it/astrivo-shorts/releases/download/videos/<id>.mp4`.

## 1. Folder layout (this repo is also the memory of the automation)

```
state/<YYYY-MM-DD>.json   one file per day: picks, job ids, review + upload status
jobs/<id>/job.json        what to render (written by Claude)
jobs/<id>/scene.js        the animation for this Short (written by Claude, flat style, see section 4)
flat/                     the flat-style renderer: style.js (drawing library), runner.js (hook, captions, music),
                          render.mjs, examples/moon-closer (the reference Short to copy)
jobs/<id>/result.json     written by GitHub Actions: {"status": "rendered", "url": ...} or {"status": "failed", "log": ...}
```

Job id: `<YYYY-MM-DD>-<topic number>` e.g. `2026-11-12-2` (one Short per day). A redo adds `-v2`, `-v3` …

`state/<date>.json`:
```json
{
  "date": "2026-11-12",
  "topics_thread_id": "...",
  "picks": [2],
  "notes": "make it more dramatic",
  "jobs": [
    {"id": "2026-11-12-2", "topic_no": 2, "title": "Why Is Space Black?",
     "description": "...", "tags": ["space", "..."], "status": "rendering"}
  ],
  "review_thread_id": null,
  "log": ["2026-11-12T06:10+05:00 jobs pushed"]
}
```
Job `status` values: `rendering` → `rendered` → `review_sent` → `approved` (with `"publish_at": "2026-11-12T19:00:00+05:00"`) → `uploaded` (with `"youtube_id"`). Also `failed`, `redo`, `rejected`.

## 2. Writing the Short — v3 format (READ FORMAT-V3.md FIRST)

**`FORMAT-V3.md` in this repo is the rulebook for every new Short. Read it fully before writing
anything.** It replaces the old 30–45 second narrated format. The essentials:

- **15–22 seconds** (target 18). Never over 25.
- **No voiceover.** Music + sound effects only. Do not call ElevenLabs for a v3 job.
- **Frame 0 is mid-action** — something is already being hit, cut or launched at t = 0.
- **Planets are characters with faces** that react; the Short is a story with a conflict.
- **6–9 beats**, each 1.8–3.0 s, climax at 75–85%, calm payoff in the last 2–3 s.
- **0–4 hard cuts in the whole Short** (prefer 1). Move the camera instead of cutting.
- **No captions.** A persistent multi-colour title banner at the top, green numbers, white labels.

Instead of spoken segments you write **`jobs/<id>/beats.md`**: one line per beat, each line a
physical action with its time range and any text that appears. FORMAT-V3.md section 2 has the
template and the story shapes that work in this niche.

Facts must be true — check any number you are not sure about with a web search.

## 3. job.json format (v3 flat style)

```json
{
  "id": "2026-11-26-1",
  "style": "flat",
  "format": "v3",
  "title": "Earth's Water Is Nothing",
  "banner": {"lines": ["EARTH'S WATER", "IS NOTHING"]},
  "duration": 18.0,
  "music": {"kind": "drive", "bpm": 100, "gain": 0.9},
  "beats": [
    {"id": "b1", "t": 0.0,  "note": "syringe already stabbing Earth, Earth screams"},
    {"id": "b2", "t": 2.0,  "note": "water drains, Earth turns brown", "number": "1.4B KM³"},
    {"id": "b3", "t": 4.5,  "note": "pan left to Jupiter with Europa", "label": "EUROPA"}
  ]
}
```
- `"format": "v3"` switches off the voice track and the caption layer.
- `banner.lines`: 1–2 lines, ALL CAPS. The renderer colours each word from the
  amber → white → cyan → magenta cycle and pins it at y 120–300.
- No `voice_url`, no `segments`, no `highlight`, no `caption_y` for v3 jobs.
- `beats[].t` is the start time in seconds; `number` and `label` are optional on-screen text.
- Next to job.json you MUST write `jobs/<id>/beats.md` and `jobs/<id>/scene.js`.

## 4. The look: flat-vector characters on near-black space

Flat-vector on a 720×1280 canvas (rendered 1080×1920). Background **`#00011B`** (near-black navy,
flat — not the old purple gradient), small parallax stars. Chunky outline-free shapes with
multi-stop gradients, flat crescent shadows, rim light, soft glows. Smooth eased motion with
overshoot. Reference: `flat/examples/moon-closer/` for the scene.js **structure** only — its
pacing and its narrated timing are v2 and no longer the target.

**Every body is a character with a face**: two big white black-outlined eyes, angling eyebrows, a
mouth that opens wide for shock. Add a `face(x, cx, cy, r, {mood, look})` helper to `flat/style.js`
(moods `calm, scared, angry, smug, happy, strain, pain`) built on the existing `eye`/`buddy` code,
so any `planet()` or `earth()` can wear one. **Squash and stretch on every impact** — `earth()`
already takes `bulge`/`quake`; use them on every hit and spring back over ~0.25 s.
Physical props (a sword, a giant syringe, a hammer) are encouraged — a silly prop is what turns a
fact into a story.

Astrivo's characters must be **our own designs**. Copy the technique in FORMAT-V3.md — timing,
structure, geometry, sound, camera — never another channel's character designs or specific scenes.
Never draw real people, logos or brand characters.

### 4a. scene.js API
```js
(function () {
  const { lerp, seg, eo, eio, back, C, PL, sky, planet, earth, sun, ... } = FLAT;   // flat/style.js
  let TL = null;
  SCENE({
    init(T) { TL = { slash: T.b(1), crack: T.b(2), climax: T.b(7), ... }; },  // beat times
    draw(x, W, H, t, T, L, o) { ... },   // draw frame at scene time t (pure function of t)
    sound(k, T, L, S) { ... },           // sound effects on the same clock
  });
})();
```
For v3, timing helper `T` is driven by the **beat grid**, not by spoken words:
`T.b(i)` start of beat i, `T.bEnd(i)`, `T.at(i, 0.5)` halfway through beat i, `T.beat(n)` the time
of music beat n (60/bpm apart), `T.D` total length. **Put every pop, hit and label change on a
music beat** — that is what makes it feel tight. The old word helpers (`T.word`, `T.s`, `T.e`)
only exist for legacy v2 jobs.

Library `FLAT` (flat/style.js), all draw at logical 720×1280:
| group | functions |
|---|---|
| background | `sky(x,W,H,t,{x,y,z})` star field with parallax (z = zoom) |
| bodies | `earth(x,cx,cy,r,{spin,bulge,bulgeAng,quake,t})`, `planet(x,cx,cy,r,PL.<name>,{inner,glowA,ringA})` with `PL.moon/mars/venus/jupiter/saturn/neptune/teal/magenta/coral/ice/rock`, `moonGlow`, `sun(x,cx,cy,r,t,{spots})`, `streaks`, `blackhole`, `rock`, `trail`, `ring`, `atmo` |
| ground | `city(W)` + `water(x,W,H,level,amp,t)` |
| characters | `face(x,cx,cy,r,{mood,look})` **(new — add it)**, `buddy`, `eye`, `badge` |
| text | `text(x,s,cx,cy,px,col)`, `pill`, `bigNumber(x,s,cx,cy,px,t,tIn)` pop + burst, `fmt(n)` |
| graphics | `arrow`, `glow`, `spark`, `burst`, `flare`, `ball` |
| motion | `popIn(t,t0,t1)`, `shake(t,t0,amp)`, `back(u)` overshoot, `seg(t,a,b)`, `eio/eo` |
| transitions | `sweep`, `whiteout`, `flash`, `speedLines` |
Every frame must be a pure function of t: randomness only from `H.rng(seed)`, never `Math.random()`.

### 4b. Layout (exact, in the logical 1080×1920 frame)
- **Title banner:** centred, top edge **y ≈ 120**, bottom **y ≈ 300**. One line ≈ 67 px tall, two
  lines ≈ 180 px. Width **72–75%** of frame (side margins 130–150 px). Heavy bold *italic*, ALL
  CAPS, thick black outline. **Each word a different colour**, cycling
  `#F0AA17` amber → `#FFFFFF` white → `#0EA9F3` cyan → `#CE05D8` magenta. On screen the whole video,
  never animated after frame 0.
- **Numbers:** `#30F80A` hard green, bold italic, black outline, **y 1170–1360**, **≥ 90 px**
  (biggest number ≥ 140 px). Pop in with overshoot on a music beat.
  **Prefer one running tally that grows** (1.4B → 3B → 7B → 9B) over separate numbers — it is the
  strongest retention device we measured.
- **Names/labels:** white, bold italic, black outline, **thin white leader line** to the object,
  typing in letter by letter over ~0.3 s. Short words only. **Max 6 in the whole Short.**
- **Safe zones:** nothing important below **y 1500** or in the right **150 px**. Watermark at
  y ≈ 1690, centred, low opacity.
- **No captions.** The caption layer is off for v3.

### 4c. THE HOOK — the first 1 second
This is where we are losing 40%+ of viewers. Do all of these.
1. **Frame 0 is mid-action.** The sword is already swinging, the needle is already in, the beam is
   already firing. No approach, no establishing shot, no empty sky, no title card, no fade-in.
2. **A hard camera push-in across the first 0.5–1.0 s.** The hero object should roughly double in
   screen size in that time. Highest motion of the whole Short is here.
3. **A character reacts inside the first 0.5 s** — eyes wide, mouth open, squash on impact.
4. **The title banner is fully on screen at frame 0** — it never fades in.
5. **Two distinct actions inside the first second** (e.g. slash, then wind up and slash again).
6. No number and no label in the first second. Picture only.

### 4d. Pacing, camera and cutting
- **Default to no cut.** Pan to the next character, push in, pull out. The whole Short should feel
  like one continuous shot wherever the story allows. **0–4 hard cuts total, prefer 1.**
  (Measured: the 54 M-view reference has 2 in 19 s; our old rule said one every 2–3 s.)
- **Allowed cuts:** one into the climax (with a white flash), and at most one cross-section reveal.
- **Motion profile:** highest in the first 2 s → calmer middle where labels and numbers can be read
  → rising into the climax → calm for the last 2 s.
- **Climax at 75–85%** of the Short: biggest visual, white flash, shake, biggest sound, biggest
  number. Leave a ~0.3 s sound gap just before it.
- **Never a still frame.** Something always drifts, spins, breathes or sparkles.
- **End wide and hold ~1.5–2 s**: a pull-back showing the whole comparison. Frame the last shot so
  it loops cleanly into beat 1.

### 4e. Sound (no voice)
- **No voiceover.** `render.mjs` already substitutes silence when `--voice` is absent and the mix
  still lands at −14 LUFS / −1.5 dBTP, which is exactly where the references sit.
- **Music:** one continuous high-energy bed at full level by **0.2 s** — no intro ramp. Because
  there is no voice to duck under, it sits much louder than in v2.
- **A sound on every physical beat:** slash, whoosh, suction, impact, electric crackle, pop.
- **Cartoon vocal grunts** on character hits (a yelp, a gasp, an "ugh") — short, non-verbal, no
  words. These are a big part of why the references feel alive.
- **A click or pop on every number and label** as it lands.
- In `sound(k, T, L, S)`: `S.pluck`, `S.boop`, `S.tocksAlong`, `S.whoosh`, `S.hit` (once per Short,
  at the climax), `S.chord`, `S.shimmer`, `S.air`, `k.play('impact'|'thud'|'riser'|'sparkle'|'swish'|'tick'|'stamp', t, {gain})`.

### 4f. Check before you push (always)
`python3 tools/build_job.py jobs/<id> --preview` writes `build/<id>/sheet.png`. For v3 it builds
timing from the beat grid instead of a voice file. Look at the sheet with the Read tool and check:
**frame 0 is mid-action**, the banner is correct and readable, the hero fills the frame, numbers
are green and ≥ 90 px, nothing sits below y 1500, no empty or black frames, and the last frame
matches the first. Fix and repeat until clean. Then push. Do NOT commit `build/`.
After the GitHub render, pull the release mp4 with `gh` and check `ffmpeg -ss 0 -frames:v 1` plus
the climax frame before sending the review email.

## 5. Music and sound (replaces the old voice step)

v3 Shorts have **no voiceover**, so the ElevenLabs step is skipped. The renderer generates the
music bed and all sound effects from `scene.js`.

For the uploaded version, pick the track in **YouTube's own Shorts audio picker** so it is licensed
and can pick up trending-audio reach. Never rip a copyrighted song into the MP4.

*(Legacy v2 only: ElevenLabs via Zapier "Convert Text to Speech", voice Liam – Energetic
`TX3LPaxmHKxFdv7VOQHJ`, model `eleven_multilingual_v2`, format `mp3_44100_128`.)*

## 4g. Old 3D renderer (legacy)
Jobs without `"style": "flat"` still render with the old realistic 3D engine (real3d.html / street3d.html).
Do not use it for new Shorts. Its format, for reference:

### job.json (3D)

```json
{
  "id": "2026-11-12-2",
  "title": "Why Is Space Black?",
  "voice_url": "<audio_url from ElevenLabs>",
  "hook": {"text": "WHY IS SPACE\nBLACK?", "seconds": 2.8},
  "segments": [
    {"text": "Space is full of stars… so why is it black?", "page": "space",
     "shot": {"punch": true, "shake": 1, "earth": {"pos": [0,0,0], "scale": 1, "spin": 0.4},
              "camera": [{"t": 0, "pos": [0,0,3.4], "look": [0,0,0], "fov": 40},
                         {"t": 1, "pos": [0.8,0.3,3.0], "look": [0,0,0], "fov": 40}]}}
  ]
}
```
Rules:
- The segment `text`s joined with spaces must be EXACTLY the text sent to ElevenLabs (same words, same order). That is how captions and cuts sync to the voice.
- `hook.text`: the title in CAPITALS, 2 short lines split with `\n`, max ~16 characters per line. The last line shows in yellow.
- Camera keyframe `t` is a **fraction 0..1 of the segment** (the renderer converts it to seconds).
- First segment: always `"punch": true` and `"shake": 1`, and a camera that moves fast/close. Later segments: a slow push-in or drift.

### What the 3D renderer can show

`page: "space"` (realistic 3D, black space with stars). A shot can combine:
| key | fields | notes |
|---|---|---|
| `earth` | `pos`, `scale`, `spin`, `tilt`, `rot` | photoreal Earth with clouds + atmosphere. scale 1 at camera z 3.4 fills the frame |
| `field` | `true` | glowing magnetic field loops around Earth (needs `earth`) |
| `sun` | `pos`, `scale`, `light` | fiery Sun with glow, also lights the scene. e.g. pos [-4.2,6.6,-12] scale 1.5 |
| `streaks` | `true` | solar wind particles flying from Sun to Earth (needs `sun` + `earth`) |
| `moon` | `pos`, `scale`, `spin` | grey cratered Moon |
| `planet` | `pos`, `scale`, `color` (hex), `type` `"rocky"`/`"gas"`, `rings` bool, `spin` | Mars `#c1440e` rocky, Jupiter `#c99b6d` gas, Saturn `#d8b07a` gas+rings, Neptune `#3f63c9` gas, Venus `#e3c07a` gas |
| `blackhole` | `pos`, `scale` | black core, orange accretion disk, glow. camera z ≈ 9–11 for scale 1 |
| `punch` | `true` | fast zoom-in at the start of the shot |
| `shake` | 0–2 | camera shake at the start of the shot (impacts, shocks) |
| `cutFlash` | bool | white flash on the cut (default on for every shot after the first) |
| `camera` | list of `{t, pos, look, fov, roll?}` | at least 2 keyframes |

Good framing examples:
- Earth hero: earth pos [0,0,0] scale 1, camera [0,0,3.4] → [0.8,0.3,3.0].
- Earth wide + field: field true, camera [0,0.2,13] → [3,2,10].
- Sun hitting Earth: earth pos [3.2,-4.2,0] scale 3.6, sun pos [-4.2,6.6,-12] scale 1.5, streaks true, camera [0,0,10] → [0.5,0.5,7.5] look [-0.5,0.5,0] fov 46.
- Earth + Moon: earth pos [-1.2,-0.6,0] scale 1, moon pos [1.6,1.4,-1] scale 0.27, camera [0,0,6] → [0.5,0.2,5.2].
- Black hole close-up: blackhole pos [0,0,0] scale 1, camera [0,0.8,11] → [0,0.5,8].

`page: "street"`: a fixed realistic street scene with mannequins and cars flying east and a compass.
Use it ONLY for lines about people/cars/objects being thrown or moving on the ground. `shot` is ignored.

If a topic needs something the renderer can't show, pick the closest object and let the
caption carry the meaning — never leave a shot empty.

## 6. YouTube upload settings

Zapier YouTube "Upload Video": `video` = release URL, `title` = title + " #shorts" (max 100 chars),
`description` = 2–3 simple lines + 3–5 hashtags, `tags`, `privacy_status` `public`,
`made_for_kids` `false`, `category_id` `28` (Science & Technology), `notify_subscribers` `true`.

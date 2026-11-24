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

## 2. Writing the script (most important part)

ONE Short per day. Script and edit are designed together: the words say it, the picture shows it on the same word.

- Length: 30–45 seconds = **85–115 words**. Simple, spoken English, short sentences, energetic voice.
- **The first 3 seconds decide everything.** Segment 0 is the hook: ONE line of ≤ 9 words, a shocking claim or a
  direct "what if"/"why" question with a twist ("What if the Moon came ten times closer?"). Never start with
  "Hey guys", "Did you know" or the channel name.
- Segment 1 must start the story at once (a hard fact or the first step), segment 2 must raise the stakes.
- Every sentence earns its place: a new fact, a new picture, or more tension. A number in every 2nd line if possible.
- **7–10 segments**, each one sentence or half-sentence (2–5 s). Put the biggest number / most shocking line at
  60–75 % of the Short (the "key hit").
- End with a twist or a line that loops back to the start (helps rewatches). No "like and subscribe".
- Facts must be true. Check anything you are not sure about with a web search. Use vivid numbers.
- Write numbers in digits with commas in the script ("384,400 kilometers") so captions show them big and yellow.
- Punctuation steers the voice: `?` `!` `…` and commas for pauses. No emojis, no ALL CAPS in the spoken text.

## 3. job.json format (flat style)

```json
{
  "id": "2026-11-13-2",
  "style": "flat",
  "title": "What If the Moon Came 10x Closer?",
  "voice_url": "<audio_url from ElevenLabs>",
  "hook": {"text": "WHAT IF THE MOON\nCAME 10× CLOSER?", "y": 820},
  "highlight": ["Moon", "rings", "apart"],
  "music": {"kind": "pulse", "bpm": 100},
  "segments": [ {"text": "What if the Moon came ten times closer?"}, {"text": "Right now, it's 384,400 kilometers away."} ]
}
```
- `"style": "flat"` is required for every new job. Next to job.json you MUST write `jobs/<id>/scene.js` (section 4).
- The segment `text`s joined with single spaces must be EXACTLY the text sent to ElevenLabs. The renderer finds
  the time of every spoken word (Whisper) and gives your scene those times, so the picture lands on the word.
- `hook.text`: the title in CAPITALS, 2 lines split with `\n`, ≤ 16 characters per line, last line yellow.
  `hook.y` = where it sits (default 800; keep it off the hero object).
- `highlight`: words shown in yellow in the captions (numbers are always yellow).
- `music`: `kind` "pulse" (default, energetic beat) or "pad" (calm); `bpm` 90–110. The music is ducked under the voice.
- Optional `tail` (seconds held after the last word, default 1.2) and `caption_y` (default 1000).

## 4. The look: "Flat-Vector Science" + the scene file

Style: flat-vector science explainer on a 720×1280 canvas (rendered at 1080×1920). Deep navy-to-violet space
gradient, sparkly stars, chunky outline-free shapes with multi-stop gradients, flat crescent shadows + rim light,
soft glows, banded planets, big rounded Nunito numbers, chunky dotted arrows, white/yellow label pills, fine print
grain on every frame. Smooth eased motion with gentle overshoot. Reference: `flat/examples/moon-closer/`
(scene.js + job.json). **Read that example fully before writing a new scene and copy its structure.**

### 4a. scene.js API
```js
(function () {
  const { lerp, seg, eo, eio, back, C, PL, sky, planet, earth, sun, ... } = FLAT;   // the library, flat/style.js
  let TL = null;
  SCENE({
    init(T) { TL = { intro: T.s(1), boom: T.word('thousand', 4), ... }; },   // turn spoken words into times
    cold: () => TL.boom - 0.2,      // optional cold open (see 4c). Return the scene time to show during the hook.
    coldSpeed: 0.35,                // slow-motion speed of the cold open
    draw(x, W, H, t, T, L, o) { ... },   // draw frame at scene time t (pure function of t). o.cold = cold open showing
    sound(k, T, L, S) { ... },           // sound effects on the same clock (S = helpers, see 4e)
  });
})();
```
Timing helpers `T`: `T.s(i)` start of segment i, `T.e(i)` end, `T.at(i, 0.5)` halfway, `T.word('rings', 7)` start
of the first word "rings" in or after segment 7, `T.wordEnd(...)`, `T.D` total length, `T.n` segment count.
**Key every beat to the word that names it** (the number pops on the word "thousand", the Moon breaks on "apart").
This is the rule that fixes "the visuals don't match the words".

Library `FLAT` (flat/style.js), all draw at logical 720×1280:
| group | functions |
|---|---|
| background | `sky(x,W,H,t,{x,y,z})` star field with parallax (z = zoom) |
| bodies | `earth(x,cx,cy,r,{spin,bulge,bulgeAng,quake,t})`, `planet(x,cx,cy,r,PL.<name>,{inner,glowA,ringA})` with `PL.moon/mars/venus/jupiter/saturn/neptune/teal/magenta/coral/ice/rock`, `moonGlow`, `sun(x,cx,cy,r,t,{spots})`, `streaks(x,A,B,t,{col,n,width})` (solar wind), `blackhole(x,cx,cy,r,t,{tilt})`, `rock(x,cx,cy,r,seed,rot)`, `trail(x,hx,hy,ang,len,wid,col)` (meteor/comet), `ring`, `atmo` |
| ground | `city(W)` buildings data + `water(x,W,H,level,amp,t)` (see exB in the example for how the shore scene is drawn) |
| characters | `buddy(x,cx,cy,r,{col,look,worry,happy,armUp,t})` cute round big-eyed character ("you"), `eye`, `badge(x,cx,cy,r,ok,scale)` ✓/✗ |
| text | `text(x,s,cx,cy,px,col)` with long shadow, `pill(x,cx,cy,s,px,{s,bg,fg,ptr})`, `bigNumber(x,s,cx,cy,px,t,tIn)` pop + burst, `fmt(n)` |
| graphics | `arrow(x,P,prog,col,lw,{dots:true})` drawn-on dotted arrow (P = 4 bezier points, `line(a,b)` makes one), `glow`, `spark`, `burst(x,cx,cy,age,seed,spread)`, `flare(x,cx,cy,k,t)`, `ball(x,cx,cy,r,[c0,c1,c2])` |
| motion | `popIn(t,t0,t1)`, `shake(t,t0,amp)`, `back(u)` overshoot, `seg(t,a,b)` 0..1, `eio/eo` easing |
| transitions | `sweep(x,W,H,u,PL.x)` giant planet wipe, `whiteout(x,W,H,a)` glow dive, `flash(x,W,H,a)`, `speedLines(x,W,H,a,t)` |
Need something new (a rocket, a volcano, a comet)? Draw it in scene.js with the same recipe: `ball()`/gradient shapes,
no outlines, one crescent shadow, a soft `glow`. Never draw real people, faces, logos or brand characters.
Every frame must be a pure function of t: randomness only from `H.rng(seed)`, never `Math.random()`.

### 4b. Layout rules (phone screen)
- Captions are drawn by the renderer at y ≈ 1000 (1–3 words, pop on each spoken word). Keep y 940–1060 free of
  important labels. Keep anything important out of the bottom 200 px and the right 90 px (YouTube buttons).
- Headlines ≥ 44 px, labels ≥ 28 px, key numbers ≥ 64 px (the key hit ≥ 110 px). Hero object fills most of the frame.
- Fewer labels than a silent video: the voice and captions explain; labels only for numbers and names.

### 4c. THE HOOK — editing rules for the first 3 seconds (do all of them)
The renderer does the shared parts automatically; your scene must supply the picture.
1. **Frame 0 is already exciting.** No fade-in, no empty sky, no slow build. The renderer adds a white flash,
   a zoom punch + shake that settles by 0.35 s, an impact hit and the title slam at 0.0 s.
2. **Cold open (default for every Short):** set `cold:` to the most dramatic moment of the Short (the key hit, an
   explosion, the planet breaking). The hook line is spoken over that moment in slow motion; at the end of
   segment 0 the renderer plays a 0.3 s "rewind" (VHS streaks, ◀◀, falling whoosh) into segment 1. This opens
   a loop the viewer wants closed. Hide labels that belong to later beats while `o.cold` is true.
   Only skip the cold open when segment 0 itself is the payoff — then animate segment 0 so something big moves
   in the first 0.5 s and changes again at ~1.2 s and ~2.2 s.
3. Segment 1 must land with motion already on screen (the intro of scene 1 runs from `T.s(1) - 0.4`).
4. In the first 3 s something changes at least every ~1 s (punch, cut, pop, number).

### 4d. Pacing, cuts and transitions after the hook
- A visual change every 1–2 s: a new object, a label/number pop, a camera push, a counter, an arrow drawing on.
- 2–3 scenes per Short (e.g. space → ground view → space). Change scene only when the story jumps (place, scale,
  before/after). Do it the style's way: `sweep` (a planet/moon rushes past the camera) or `whiteout` (glow dive).
  Otherwise stay continuous: objects move, grow and transform into the next idea.
- The key hit (biggest number/most shocking moment): pop ≥ 110 px number + `shake` + `flare` + `burst`, and a
  short sound gap before it (no other effects in the 0.3 s before).
- Keep the camera alive: slow zoom (`sky` z), drift, parallax. Never a still frame for more than ~1.5 s.
- End: takeaway line(s) pop on their words and hold ~1 s; the last frame should loop well into the first.

### 4e. Sound
The renderer adds: an energetic music bed (ducked under the voice), the frame-0 impact + title stamp, the rewind
and the landing thud. In `sound(k, T, L, S)` add the effects for your beats, on the same times as the picture:
`S.pluck(t, 'E4')` label/number lands, `S.boop(t, 400)` a body pops in, `S.tocksAlong(t0, t1, n, f0, df)` an
arrow/counter, `S.whoosh(t)` a sweep or big move, `S.hit(t)` THE key hit (swell + impact + chord + shimmer),
`S.chord(t, notes)`, `S.shimmer(t, notes)`, `S.air(t, dur, top)`, `k.play('impact'|'thud'|'riser'|'sparkle'|'swish'|'tick'|'stamp', t, {gain})`,
`S.backPeak(t0, t1)` = the moment a pop reaches full size (use it as the sound time). Max ~3 sounds at once; the
voice must stay clear. Use `S.hit` once per Short.

### 4f. Check before you push (always)
`python3 tools/build_job.py jobs/<id> --preview` writes `build/<id>/sheet.png` (frames from the hook, every
segment and the end) using estimated word times (the real voice file can't be downloaded in the Claude cloud
sandbox). Look at the sheet with the Read tool. Fix: page errors, empty or black frames, text cut off, labels
under the captions, objects that don't match their line. Repeat until clean. Then push. Do NOT commit `build/`.
After the GitHub render, open the result video's frames if possible (download the release mp4 with `gh` and
`ffmpeg -ss <t> -frames:v 1`) and check the hook frames once more before sending the review email.

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

## 5. Voice

ElevenLabs via Zapier "Convert Text to Speech": voice **Liam – Energetic, Social Media Creator**
(`voice_id` `TX3LPaxmHKxFdv7VOQHJ`), model `eleven_multilingual_v2`, format `mp3_44100_128`.
Put the returned `audio_url` into `voice_url` and push the job straight away (the link expires after some hours).

## 6. YouTube upload settings

Zapier YouTube "Upload Video": `video` = release URL, `title` = title + " #shorts" (max 100 chars),
`description` = 2–3 simple lines + 3–5 hashtags, `tags`, `privacy_status` `public`,
`made_for_kids` `false`, `category_id` `28` (Science & Technology), `notify_subscribers` `true`.

# Astrivo Shorts — production playbook

This file is read by the automated Claude runs. It explains how to turn a picked topic
into a render job. GitHub Actions (`.github/workflows/render.yml`) renders every new
`jobs/<id>/job.json` and publishes the video at
`https://github.com/dogar5954786-ship-it/astrivo-shorts/releases/download/videos/<id>.mp4`.

## 1. Folder layout (this repo is also the memory of the automation)

```
state/<YYYY-MM-DD>.json   one file per day: picks, job ids, review + upload status
jobs/<id>/job.json        what to render (written by Claude)
jobs/<id>/result.json     written by GitHub Actions: {"status": "rendered", "url": ...} or {"status": "failed", "log": ...}
```

Job id: `<YYYY-MM-DD>-<topic number>` e.g. `2026-11-12-4`. A redo adds `-v2`, `-v3` …

`state/<date>.json`:
```json
{
  "date": "2026-11-12",
  "topics_thread_id": "...",
  "picks": [2, 4],
  "notes": "make 4 more dramatic",
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

- Length: 30–45 seconds = **85–115 words**. Simple, spoken English. Short sentences.
- **Hook (first 3 seconds) decides everything.** The first segment is ONE line of ≤ 9 words:
  a shocking claim or a direct "what if"/"why" question with a twist,
  e.g. "If Earth stopped spinning, you'd die in seconds." Never start with "Hey guys", "Did you know", or the channel name.
- Second line must raise the stakes or open a loop ("But that's not the scariest part…").
- Every sentence must earn its place: new fact, new image, or rising tension.
- Change the visual every 2–4 seconds → **7–10 segments**, each one sentence or half-sentence.
- End with a twist or a line that loops back to the start (helps rewatches). No "like and subscribe".
- Facts must be true. If unsure, check with a web search. Use vivid numbers ("1,000 miles an hour").
- Use punctuation to steer the voice: `?` `!` `…` and commas for pauses. No emojis, no ALL CAPS in the spoken text.

## 3. job.json format

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

## 4. What the renderer can show

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
